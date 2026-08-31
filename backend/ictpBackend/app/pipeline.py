"""
Unified real-time pipeline -- LIVE SNAPSHOT model, using Supabase Storage
as the TRANSPORT PIPE (port -> Supabase -> backend -> frontend), not an
archive. Nothing is meant to sit in the bucket for long.
"""
import os
import shutil
import time
import glob
import gzip
import asyncio
from collections import defaultdict
from datetime import datetime, timezone

import hatanaka

from app.connections import manager
from app.parser import parse_rinex_file, detect_rinex_type
from app.skyplot_data import compute_skyplot_data
from app.dop_calculator import compute_dop
from app.database import (
    init_db, SessionLocal, LiveData, clear_live_data,
    is_file_processed, mark_file_processed,
)
from app import cloud_storage
from app.sync_local_archive import extract_date_and_fetch_nav

# When true, OBS/NAV files are always fully (re)processed even if a
# ProcessedFile record already exists for that exact filename -- lets the
# same file be dropped into incoming/ repeatedly (e.g. during testing, or
# when the receiver keeps re-serving the same cached file) and still
# produce fresh skyplot/DOP rows every time. Controlled via .env so it can
# be turned back off once you no longer need to force-reprocess.
FORCE_REPROCESS = os.getenv("PIPELINE_FORCE_REPROCESS", "true").strip().lower() in ("1", "true", "yes")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # gnss_backend/
INCOMING_DIR = os.path.join(BASE_DIR, "incoming")
BATCH_DIR = os.path.join(BASE_DIR, "batch")          # local scratch only, cleared per file
NAV_CACHE_DIR = os.path.join(BASE_DIR, "nav_cache")   # holds the pointer file + durable local nav copy
NAV_POINTER_PATH = os.path.join(NAV_CACHE_DIR, "current.txt")
NAV_LOCAL_PATH = os.path.join(NAV_CACHE_DIR, "current_nav.rnx")  # durable decompressed nav file, always on disk -- never depends on Supabase
PROCESSED_DIR = os.path.join(BASE_DIR, "processed")   # durable copy of the last successfully processed OBS file
OBS_CACHE_DIR = os.path.join(BASE_DIR, "obs_cache")    # holds pointers for that same "current" OBS bundle
OBS_REMOTE_POINTER_PATH = os.path.join(OBS_CACHE_DIR, "current_remote.txt")
OBS_LOCAL_POINTER_PATH = os.path.join(OBS_CACHE_DIR, "current_local.txt")

for d in (INCOMING_DIR, BATCH_DIR, NAV_CACHE_DIR, PROCESSED_DIR, OBS_CACHE_DIR):
    os.makedirs(d, exist_ok=True)


def _ecef_to_geodetic_deg(x, y, z):
    import math
    a = 6378137.0
    f = 1 / 298.257223563
    e2 = f * (2 - f)
    lon = math.atan2(y, x)
    p = math.sqrt(x * x + y * y)
    lat = math.atan2(z, p * (1 - e2))
    for _ in range(10):
        N = a / math.sqrt(1 - e2 * math.sin(lat) ** 2)
        h = p / math.cos(lat) - N
        lat = math.atan2(z, p * (1 - e2 * N / (N + h)))
    N = a / math.sqrt(1 - e2 * math.sin(lat) ** 2)
    h = p / math.cos(lat) - N
    return math.degrees(lat), math.degrees(lon), h


def _get_current_nav_pointer():
    if not os.path.exists(NAV_POINTER_PATH):
        return None
    with open(NAV_POINTER_PATH, "r") as f:
        remote_path = f.read().strip()
    return remote_path or None


def _set_current_nav_pointer(remote_path: str):
    with open(NAV_POINTER_PATH, "w") as f:
        f.write(remote_path)


def _get_current_obs_pointer(pointer_path):
    if not os.path.exists(pointer_path):
        return None
    with open(pointer_path, "r") as f:
        value = f.read().strip()
    return value or None


def _set_current_obs_pointer(pointer_path, value: str):
    with open(pointer_path, "w") as f:
        f.write(value)


def _local_decompress_if_needed(path: str) -> str:
    fname = os.path.basename(path)
    if fname.endswith(".crx") or fname.endswith(".crx.gz"):
        rnx_path = str(hatanaka.decompress_on_disk(path))
        rnx_dest = os.path.join(BATCH_DIR, os.path.basename(rnx_path))
        if os.path.abspath(rnx_path) != os.path.abspath(rnx_dest):
            shutil.move(rnx_path, rnx_dest)
        return rnx_dest
    elif fname.endswith(".rnx.gz"):
        rnx_fname = fname[:-3]
        rnx_dest = os.path.join(BATCH_DIR, rnx_fname)
        with gzip.open(path, "rb") as f_in, open(rnx_dest, "wb") as f_out:
            shutil.copyfileobj(f_in, f_out)
        return rnx_dest
    elif fname.endswith(".rnx"):
        rnx_dest = os.path.join(BATCH_DIR, fname)
        if os.path.abspath(path) != os.path.abspath(rnx_dest):
            shutil.copy2(path, rnx_dest)
        return rnx_dest
    else:
        raise ValueError(f"Unrecognized file type: {fname}")


def _build_live_rows(obs_result, obs_fname, nav_fname, skyplot_rows):
    meta = obs_result["meta"]
    lat = lon = h = None
    station_ecef = (meta.get("x"), meta.get("y"), meta.get("z"))
    
    if meta.get("x") is not None:
        lat, lon, h = _ecef_to_geodetic_deg(meta["x"], meta["y"], meta["z"])

    session_start = obs_result["epochs"][0]["time"] if obs_result["epochs"] else meta.get("start")
    session_end = obs_result["epochs"][-1]["time"] if obs_result["epochs"] else None

    sat_by_prn = {s["prn"]: s for s in obs_result["satellites"]}
    now = datetime.now(timezone.utc)

    rows = []
    if skyplot_rows:
        # Group skyplot rows by time to compute dynamic DOP per epoch (handling case sensitivity)
        skyplot_by_time = defaultdict(list)
        counts_by_time = defaultdict(int)
        
        for r in skyplot_rows:
            counts_by_time[r["time"]] += 1
            x_val = r.get("X") if r.get("X") is not None else r.get("x")
            y_val = r.get("Y") if r.get("Y") is not None else r.get("y")
            z_val = r.get("Z") if r.get("Z") is not None else r.get("z")
            
            if x_val is not None and y_val is not None and z_val is not None:
                skyplot_by_time[r["time"]].append((x_val, y_val, z_val))

        # Precompute DOP per timestamp
        dop_cache = {}
        # NOTE: was `if all(station_ecef):` -- but all() treats 0.0 as
        # falsy, so a station whose ECEF X/Y/Z happens to be exactly 0.0
        # (a placeholder/approximate position some RINEX headers use)
        # would silently skip DOP entirely, leaving PDOP/VDOP/GDOP/HDOP/
        # TDOP all None even though real coordinates were present. Check
        # for None explicitly instead.
        if all(v is not None for v in station_ecef):
            for t, sats in skyplot_by_time.items():
                dop_res = compute_dop(station_ecef, sats)
                dop_cache[t] = dop_res
        else:
            print("  [pipeline] Warning: Station ECEF coordinates are missing; cannot compute DOP.")

        for r in skyplot_rows:
            s = sat_by_prn.get(r["prn"], {})
            t = r["time"]
            current_dop = dop_cache.get(t, {"PDOP": None, "VDOP": None, "GDOP": None, "HDOP": None, "TDOP": None})

            rows.append(LiveData(
                source_file=obs_fname, nav_file=nav_fname,
                station_marker=meta.get("marker"), receiver=meta.get("receiver"), antenna=meta.get("antenna"),
                pos_x=meta.get("x"), pos_y=meta.get("y"), pos_z=meta.get("z"),
                lat_deg=lat, lon_deg=lon, height_m=h,
                pdop=current_dop.get("PDOP"), vdop=current_dop.get("VDOP"), gdop=current_dop.get("GDOP"),
                hdop=current_dop.get("HDOP"), tdop=current_dop.get("TDOP"),
                session_start=session_start, session_end=session_end,
                ingested_at=now,
                prn=r["prn"], system=r["system"],
                valid_epochs=s.get("valid_epochs"), completeness_pct=s.get("completeness_pct"),
                avg_snr=s.get("avg_snr"), cycle_slips=s.get("cycle_slips"), quality=s.get("quality"),
                multipath_mp1=s.get("multipath_mp1"), multipath_mp2=s.get("multipath_mp2"),
                iono_delay_l1=s.get("iono_delay_l1"),
                time=t, elevation_deg=r["elevation_deg"], azimuth_deg=r["azimuth_deg"],
                sat_x=r.get("x"), sat_y=r.get("y"), sat_z=r.get("z"),
                total_sats_at_time=counts_by_time[t],
            ))
    else:
        print(f"  [pipeline] Warning: No skyplot rows found. Ensure a navigation file was uploaded first.")
        for s in obs_result["satellites"]:
            rows.append(LiveData(
                source_file=obs_fname, nav_file=nav_fname,
                station_marker=meta.get("marker"), receiver=meta.get("receiver"), antenna=meta.get("antenna"),
                pos_x=meta.get("x"), pos_y=meta.get("y"), pos_z=meta.get("z"),
                lat_deg=lat, lon_deg=lon, height_m=h,
                pdop=None, vdop=None, gdop=None, hdop=None, tdop=None,
                session_start=session_start, session_end=session_end,
                ingested_at=now,
                prn=s["prn"], system=s["system"],
                valid_epochs=s.get("valid_epochs"), completeness_pct=s.get("completeness_pct"),
                avg_snr=s.get("avg_snr"), cycle_slips=s.get("cycle_slips"), quality=s.get("quality"),
                multipath_mp1=s.get("multipath_mp1"), multipath_mp2=s.get("multipath_mp2"),
                iono_delay_l1=s.get("iono_delay_l1"),
                time=None, elevation_deg=None, azimuth_deg=None,
                total_sats_at_time=None,
            ))
    return rows


def _broadcast(payload: dict):
    try:
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None
        
        if loop and loop.is_running():
            asyncio.run_coroutine_threadsafe(manager.broadcast(payload), loop)
        else:
            asyncio.run(manager.broadcast(payload))
    except Exception as e:
        print(f"  [pipeline] failed to broadcast websocket update: {e}")


def _cleanup_local(*paths):
    for p in paths:
        try:
            if p and os.path.exists(p):
                os.remove(p)
        except OSError:
            pass


async def process_one_file_async(path: str) -> dict:
    return await asyncio.to_thread(process_one_file, path)


def process_one_file(path: str) -> dict:
    # Dedup key -- the pre-decompression filename, exactly as
    # sync_local_archive.py's sync_latest_archive() knows it as "latest_file".
    # This must be checked BEFORE any work happens, and independent of
    # whether a copy still exists in incoming/ -- that existence check is
    # what used to race against this function's own cleanup at the end,
    # causing the same file to be re-downloaded and reprocessed forever.
    original_incoming_fname = os.path.basename(path)

    db = SessionLocal()
    try:
        already_done = is_file_processed(db, original_incoming_fname, "obs")
    finally:
        db.close()

    if already_done and not FORCE_REPROCESS:
        print(f"  [pipeline] OBS file {original_incoming_fname} already processed previously -- skipping.")
        try:
            local_rnx_guess = _local_decompress_if_needed(path)
        except Exception:
            local_rnx_guess = None
        _cleanup_local(path, local_rnx_guess)
        return {"source_file": original_incoming_fname, "skipped": True}
    elif already_done:
        print(f"  [pipeline] OBS file {original_incoming_fname} already processed previously -- "
              f"FORCE_REPROCESS is on, reprocessing anyway.")

    local_rnx = _local_decompress_if_needed(path)
    rnx_fname = os.path.basename(local_rnx)
    remote_path = f"obs/{rnx_fname}"

    # Best-effort cloud backup only -- upload_file() already swallows its own
    # errors and never raises, so a missing/emptied/unreachable Supabase
    # bucket can never block processing here.
    cloud_storage.upload_file(local_rnx, remote_path)
    # NOTE: the previous bundle's local/remote copies are NOT touched here.
    # They stay exactly as they are -- the durable "current" bundle -- until
    # this new one has fully processed and gone live, further down.

    # For every OBS file, actively fetch/confirm the nav file matching THIS
    # file's own date -- don't just blindly trust whatever nav pointer
    # happens to already be cached from a previous, possibly unrelated, run.
    # fetch_nasa_nav (via extract_date_and_fetch_nav) already tries, in
    # order: an existing local cache for this exact date, then a live NASA
    # fetch, then the most recent nav file available locally as a last
    # resort -- and it drops whatever it finds into incoming/, which we
    # then register as the current pointer below.
    try:
        nav_fetch_result = extract_date_and_fetch_nav(rnx_fname)
    except Exception as e:
        nav_fetch_result = None
        print(f"  [pipeline] Warning: nav fetch for {rnx_fname} raised {e}; falling back to whatever nav pointer already exists.")

    if nav_fetch_result:
        nav_incoming_copy = os.path.join(INCOMING_DIR, os.path.basename(nav_fetch_result))
        if os.path.exists(nav_incoming_copy):
            try:
                process_nav_file(nav_incoming_copy)
            except Exception as e:
                print(f"  [pipeline] Warning: could not register fetched nav file {nav_incoming_copy}: {e}")

    # Parse straight from the local decompressed copy we already have on
    # disk -- no dependency on Supabase for the actual compute path. The
    # upload above is a backup only; whether it succeeded or not, `local_rnx`
    # is always available here.
    working_copy = local_rnx

    result = parse_rinex_file(working_copy)

    nav_remote = _get_current_nav_pointer()
    skyplot_rows = []
    nav_local_temp = NAV_LOCAL_PATH if os.path.exists(NAV_LOCAL_PATH) else None
    if nav_local_temp:
        skyplot_rows, _summary = compute_skyplot_data(working_copy, nav_local_temp, sample_every_minutes=5)
    else:
        print("  [pipeline] Warning: no local nav file available yet; skyplot will be empty for this file.")

    init_db()
    db = SessionLocal()
    try:
        clear_live_data(db)
        rows = _build_live_rows(
            result, rnx_fname,
            os.path.basename(nav_remote) if nav_remote else None,
            skyplot_rows,
        )
        db.add_all(rows)
        db.commit()
    finally:
        db.close()

    _broadcast({
        "type": "LIVE_UPDATE",
        "source_file": rnx_fname,
        "nav_file": os.path.basename(nav_remote) if nav_remote else None,
        "satellites": len(result["satellites"]),
        "skyplot_points": len(skyplot_rows),
    })

    db = SessionLocal()
    try:
        mark_file_processed(db, original_incoming_fname, "obs", source="local_archive", remote_path=remote_path)
        db.commit()
    finally:
        db.close()

    # --- Only now, with the new bundle fully processed and live, retire the
    # previous one. This guarantees a complete OBS file is always available
    # somewhere (locally in processed/, and in Supabase) even if the
    # receiver is slow to produce the next file -- nothing is ever deleted
    # with no replacement ready to take its place. ---
    old_local = _get_current_obs_pointer(OBS_LOCAL_POINTER_PATH)
    old_remote = _get_current_obs_pointer(OBS_REMOTE_POINTER_PATH)

    processed_dest = os.path.join(PROCESSED_DIR, rnx_fname)
    if os.path.abspath(working_copy) != os.path.abspath(processed_dest):
        shutil.copy2(working_copy, processed_dest)

    _set_current_obs_pointer(OBS_LOCAL_POINTER_PATH, processed_dest)
    _set_current_obs_pointer(OBS_REMOTE_POINTER_PATH, remote_path)

    if old_local and old_local != processed_dest:
        _cleanup_local(old_local)
    if old_remote and old_remote != remote_path:
        cloud_storage.delete_remote_file(old_remote)

    # The raw file that arrived in incoming/ is safe to remove now -- a
    # durable copy already lives in processed/ (and best-effort in Supabase).
    # NOTE: nav_local_temp (NAV_LOCAL_PATH) is intentionally NOT deleted here
    # -- it's the durable local nav file, needed for every future OBS file
    # until a newer nav file replaces it.
    _cleanup_local(path, local_rnx)

    return {
        "source_file": rnx_fname,
        "satellites": len(result["satellites"]),
        "epochs": len(result["epochs"]),
        "skyplot_points": len(skyplot_rows),
        "nav_file_used": os.path.basename(nav_remote) if nav_remote else None,
    }


def process_nav_file(path: str) -> dict:
    original_fname = os.path.basename(path)

    # Without this guard, sync_local_archive.py's _copy_to_incoming()
    # re-copies the same nav file into incoming/ on every OBS cycle (its own
    # "already in incoming/" check is defeated by this function's cleanup
    # below), so this function used to re-run in full -- re-upload,
    # re-pointer, re-broadcast NAV_UPDATE -- every ~30s even though the nav
    # file never changed.
    db = SessionLocal()
    try:
        already_done = is_file_processed(db, original_fname, "nav")
    finally:
        db.close()

    if already_done and not FORCE_REPROCESS:
        print(f"  [pipeline] NAV file {original_fname} already processed previously -- skipping re-upload/re-broadcast.")
        try:
            local_rnx_guess = _local_decompress_if_needed(path)
        except Exception:
            local_rnx_guess = None
        _cleanup_local(path, local_rnx_guess)
        return {"source_file": original_fname, "nav_current_remote": _get_current_nav_pointer(), "skipped": True}
    elif already_done:
        print(f"  [pipeline] NAV file {original_fname} already processed previously -- "
              f"FORCE_REPROCESS is on, reprocessing anyway.")

    local_rnx = _local_decompress_if_needed(path)
    rnx_fname = os.path.basename(local_rnx)
    remote_path = f"nav/{rnx_fname}"

    # Sanity-check the decompressed file before it's allowed to become the
    # durable NAV_LOCAL_PATH copy. A truncated/corrupt/empty download (bad
    # network, expired auth, interrupted write) must never silently replace
    # a working nav file -- that poisons every skyplot computation until
    # the next successful nav file happens to come in. A real merged
    # BRDM-style nav file is consistently >100KB even gzipped/decompressed
    # for a single day; anything drastically smaller is treated as invalid.
    MIN_VALID_NAV_BYTES = 10_000
    nav_size = os.path.getsize(local_rnx) if os.path.exists(local_rnx) else 0
    if nav_size < MIN_VALID_NAV_BYTES:
        print(f"  [pipeline] ERROR: downloaded NAV file {rnx_fname} is only {nav_size} bytes "
              f"(< {MIN_VALID_NAV_BYTES} minimum) -- looks corrupt/truncated. Refusing to "
              f"overwrite the existing durable nav file at {NAV_LOCAL_PATH}. NOT marking as "
              f"processed, so this will be retried on the next cycle.")
        _cleanup_local(local_rnx, path)
        return {"source_file": original_fname, "nav_current_remote": _get_current_nav_pointer(),
                "skipped": True, "error": "nav file too small, kept previous good copy"}

    # Durable local copy FIRST -- this is what the skyplot computation
    # actually reads from now (see NAV_LOCAL_PATH in process_one_file).
    # Written before the cloud upload so a missing/unreachable Supabase
    # bucket can never leave us without a usable nav file.
    shutil.copy2(local_rnx, NAV_LOCAL_PATH)

    # Best-effort cloud backup only -- never required for the compute path.
    cloud_storage.upload_file(local_rnx, remote_path)
    _cleanup_local(local_rnx, path)

    old_remote = _get_current_nav_pointer()
    if old_remote and old_remote != remote_path:
        cloud_storage.delete_remote_file(old_remote)

    _set_current_nav_pointer(remote_path)

    db = SessionLocal()
    try:
        mark_file_processed(db, original_fname, "nav", source="pipeline", remote_path=remote_path)
        db.commit()
    finally:
        db.close()

    _broadcast({"type": "NAV_UPDATE", "nav_file": rnx_fname})

    return {"source_file": original_fname, "nav_current_remote": remote_path}


def process_incoming_folder() -> list:
    obs_only_patterns = ["*.crx", "*.crx.gz"]
    ambiguous_patterns = ["*.rnx", "*.rnx.gz"]

    obs_files = []
    for p in obs_only_patterns:
        obs_files.extend(glob.glob(os.path.join(INCOMING_DIR, p)))

    ambiguous_files = []
    for p in ambiguous_patterns:
        ambiguous_files.extend(glob.glob(os.path.join(INCOMING_DIR, p)))

    summaries = []
    for path in sorted(obs_files):
        try:
            summary = process_one_file(path)
            summaries.append(summary)
            if not summary.get("skipped"):
                print(f"  processed (obs): {summary['source_file']} "
                      f"({summary['satellites']} satellites, {summary['skyplot_points']} skyplot points, "
                      f"nav_used={summary['nav_file_used']})")
        except Exception as e:
            print(f"  ERROR processing {os.path.basename(path)}: {e}")

    for path in sorted(ambiguous_files):
        fname = os.path.basename(path)
        try:
            kind = detect_rinex_type(path)
        except Exception as e:
            print(f"  ERROR detecting type for {fname}: {e}")
            continue
        try:
            if kind == "nav":
                summary = process_nav_file(path)
                summaries.append(summary)
                if not summary.get("skipped"):
                    print(f"  processed (nav): {summary['source_file']} -> {summary['nav_current_remote']}")
            else:
                summary = process_one_file(path)
                summaries.append(summary)
                if not summary.get("skipped"):
                    print(f"  processed (obs): {summary['source_file']} "
                          f"({summary['satellites']} satellites, {summary['skyplot_points']} skyplot points, "
                          f"nav_used={summary['nav_file_used']})")
        except Exception as e:
            print(f"  ERROR processing {fname}: {e}")
    return summaries


def watch_loop(interval_seconds: int = 30):
    """NOTE: this blocking, thread-based version is kept for CLI/manual use
    (see __main__ below). The FastAPI app uses watch_loop_async instead --
    see that function's docstring for why."""
    print(f"Watching {INCOMING_DIR} every {interval_seconds}s ... (Ctrl+C to stop)")
    while True:
        process_incoming_folder()
        time.sleep(interval_seconds)


async def watch_loop_async(interval_seconds: int = 30):
    """Same behavior as watch_loop, but as a real asyncio coroutine instead
    of a blocking thread. This matters specifically for uvicorn --reload: a
    `while True: ...; time.sleep(N)` running inside a background thread has
    no way to be told "stop" -- when --reload tries to shut the old process
    down, it hangs waiting on that thread forever, leaving a zombie process
    that keeps its Supabase database connection open. Enough of those over
    repeated reloads exhausts Supabase's connection pool entirely (exactly
    what happened). This version awaits asyncio.sleep() instead of blocking
    on time.sleep(), which means it can actually be cancelled cleanly via
    task.cancel() on shutdown -- process_incoming_folder() still runs in a
    thread (via asyncio.to_thread) so it never blocks the rest of the
    FastAPI app while in progress."""
    print(f"Watching {INCOMING_DIR} every {interval_seconds}s ... (Ctrl+C to stop)")
    try:
        while True:
            await asyncio.to_thread(process_incoming_folder)
            await asyncio.sleep(interval_seconds)
    except asyncio.CancelledError:
        print("  [pipeline] Folder watch loop cancelled, shutting down cleanly.")
        raise


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--watch":
        watch_loop()
    else:
        print(f"Processing all files currently in {INCOMING_DIR} ...")
        process_incoming_folder()
        print("Done. (Run with --watch to keep checking continuously.)")