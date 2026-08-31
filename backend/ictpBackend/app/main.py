import asyncio
import math
from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session as OrmSession
from app.connections import manager

from app.pipeline import watch_loop_async
from app.database import get_db, init_db, LiveData, ProcessedFile
from app.sync_local_archive import sync_latest_archive, watch_local_archive_loop_async
from app.satellite_position import ecef_to_geodetic

WGS84_A = 6378137.0  # equatorial radius, metres -- used only for a rough
# satellite altitude estimate (distance-from-center minus this), which is
# accurate to within WGS84's ~21km flattening error -- negligible against
# orbit altitudes of thousands of km, fine for globe visualization scale.

# Sessions are hourly (see parser.py's fixed 3600s completeness window) and
# the ingest watcher polls every 30s, so data that hasn't refreshed in over
# one full session length is flagged stale for the status panel.
STALE_THRESHOLD_SECONDS = 3600

app = FastAPI(title="GRAL GNSS Observatory API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    init_db()
    # Give this app its own larger thread pool. FastAPI's sync route
    # handlers (station_info, satellite_summary, etc.) and the background
    # archive/nav sync loops (via asyncio.to_thread) both run on the SAME
    # default executor. Python's default pool is small (often ~8-12
    # threads), so on a slow/flaky network the background sync's blocking
    # HTTP calls (each with up to 30s timeouts) can saturate every thread,
    # leaving API requests stuck waiting indefinitely with no response --
    # this is what caused the dashboard to hang instead of erroring.
    import concurrent.futures
    asyncio.get_running_loop().set_default_executor(
        concurrent.futures.ThreadPoolExecutor(max_workers=32)
    )
    # Keeps the backend "alive" in the background, watching for new files
    # and refreshing the live table without any manual step. These are real
    # asyncio tasks (not blocking background threads), so they can actually
    # be cancelled cleanly on shutdown -- see on_shutdown below. This is
    # what stops uvicorn --reload from leaving zombie processes that each
    # keep a Supabase connection open, eventually exhausting the pool.
    app.state.watch_task = asyncio.create_task(watch_loop_async())
    app.state.archive_task = asyncio.create_task(watch_local_archive_loop_async())


@app.on_event("shutdown")
async def on_shutdown():
    for task in (getattr(app.state, "watch_task", None), getattr(app.state, "archive_task", None)):
        if task:
            task.cancel()
    tasks = [t for t in (getattr(app.state, "watch_task", None), getattr(app.state, "archive_task", None)) if t]
    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)


# --- WebSocket: pushes real-time "new data is in" events to the frontend dashboard ---
@app.websocket("/ws/live")
async def live_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection open and listen for client messages if any
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.get("/")
def root():
    return {"status": "ok", "service": "GRAL GNSS Observatory API"}


@app.get("/api/station")
def station_info(db: OrmSession = Depends(get_db)):
    """Current station/session metadata -- the dashboard header tile with DOP metrics.

    Station identity fields (marker/receiver/antenna/position/session bounds)
    are the same across every row of the current live snapshot, so any row
    works for those. DOP (pdop/vdop/gdop/hdop/tdop), however, is computed and stored
    PER EPOCH -- picking an arbitrary row (previously `.first()`, effectively
    the earliest epoch by insert order) could show geometry from the start
    of the session instead of right now. Ordering by `time` descending
    always gets the most recent epoch's DOP, matching what /api/status does
    for data-freshness.
    """
    row = (
        db.query(LiveData)
        .order_by(LiveData.time.desc().nullslast())
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="No live data yet -- waiting for the first file.")
    return {
        "source_file": row.source_file,
        "nav_file": row.nav_file,
        "marker": row.station_marker,
        "receiver": row.receiver,
        "antenna": row.antenna,
        "position": {"x": row.pos_x, "y": row.pos_y, "z": row.pos_z},
        "lat_deg": row.lat_deg,
        "lon_deg": row.lon_deg,
        "height_m": row.height_m,
        "pdop": row.pdop,
        "vdop": row.vdop,
        "gdop": row.gdop,
        "hdop": row.hdop,
        "tdop": row.tdop,
        "session_start": row.session_start.strftime("%Y-%m-%d %H:%M:%S") if row.session_start else None,
        "session_end": row.session_end.strftime("%Y-%m-%d %H:%M:%S") if row.session_end else None,
    }


@app.get("/api/satellites")
def satellite_summary(db: OrmSession = Depends(get_db)):
    """One row per currently-tracked satellite: completeness/SNR/multipath/iono."""
    rows = db.query(LiveData).all()
    seen = {}
    for r in rows:
        if r.prn not in seen:
            seen[r.prn] = {
                "prn": r.prn, "system": r.system,
                "valid_epochs": r.valid_epochs, "completeness_pct": r.completeness_pct,
                "avg_snr": r.avg_snr, "cycle_slips": r.cycle_slips, "quality": r.quality,
                "multipath_mp1": r.multipath_mp1, "multipath_mp2": r.multipath_mp2,
                "iono_delay_l1": r.iono_delay_l1,
            }
    return sorted(seen.values(), key=lambda s: s["prn"])


@app.get("/api/skyplot")
def skyplot(db: OrmSession = Depends(get_db)):
    """Elevation/azimuth path per satellite -- feeds the sky-plot chart directly."""
    rows = (
        db.query(LiveData)
        .filter(LiveData.time.isnot(None))
        .order_by(LiveData.prn, LiveData.time)
        .all()
    )
    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No sky-plot data yet -- a navigation file may not have arrived yet.",
        )
    by_prn = {}
    for r in rows:
        by_prn.setdefault(r.prn, {"prn": r.prn, "system": r.system, "path": []})
        by_prn[r.prn]["path"].append({
            "time": r.time.strftime("%Y-%m-%d %H:%M:%S"),
            "elevation_deg": r.elevation_deg,
            "azimuth_deg": r.azimuth_deg,
        })
    return {"satellite_count": len(by_prn), "satellites": list(by_prn.values())}


@app.get("/api/satellites-in-view")
def satellites_in_view(db: OrmSession = Depends(get_db)):
    """Total tracked-satellite count over time -- for a 'sats in view' trend line."""
    rows = (
        db.query(LiveData)
        .filter(LiveData.time.isnot(None))
        .order_by(LiveData.time)
        .all()
    )
    by_time = {}
    for r in rows:
        by_time[r.time] = r.total_sats_at_time
    return [
        {"time": t.strftime("%Y-%m-%d %H:%M:%S"), "count": c}
        for t, c in sorted(by_time.items())
    ]


@app.get("/api/satellites/orbits")
def get_satellite_orbits(min_elevation: float = 0.0, db: OrmSession = Depends(get_db)):
    """
    Real ECEF satellite positions/tracks for the 3D globe.

    Every point returned here comes from LiveData.sat_x/y/z -- broadcast-
    ephemeris propagation (satellite_position.py / glonass_sbas_position.py),
    the SAME computation and the SAME samples used for the sky plot, just
    persisted instead of discarded. A satellite with no matching nav record
    (or no nav file processed at all) simply has no path here -- this
    endpoint never invents or interpolates a position to fill the gap.

    `min_elevation` (degrees, default 0 = geometric horizon) sets the
    visibility mask: a sample is marked "visible" when its elevation angle
    as seen from the station is at or above this threshold.
    """
    rows = (
        db.query(LiveData)
        .filter(LiveData.time.isnot(None), LiveData.sat_x.isnot(None))
        .order_by(LiveData.prn, LiveData.time)
        .all()
    )

    station_row = db.query(LiveData).first()
    station = None
    if station_row and station_row.pos_x is not None:
        station = {
            "x": station_row.pos_x, "y": station_row.pos_y, "z": station_row.pos_z,
            "lat_deg": station_row.lat_deg, "lon_deg": station_row.lon_deg,
            "height_m": station_row.height_m,
        }

    by_prn = {}
    for r in rows:
        entry = by_prn.setdefault(r.prn, {"prn": r.prn, "system": r.system, "path": []})
        lat_rad, lon_rad = ecef_to_geodetic(r.sat_x, r.sat_y, r.sat_z)
        altitude_m = math.sqrt(r.sat_x ** 2 + r.sat_y ** 2 + r.sat_z ** 2) - WGS84_A
        visible = r.elevation_deg is not None and r.elevation_deg >= min_elevation
        entry["path"].append({
            "time": r.time.strftime("%Y-%m-%d %H:%M:%S"),
            "x": r.sat_x, "y": r.sat_y, "z": r.sat_z,
            "latitude": round(math.degrees(lat_rad), 5),
            "longitude": round(math.degrees(lon_rad), 5),
            "altitude_m": round(altitude_m, 1),
            "elevation_deg": r.elevation_deg,
            "azimuth_deg": r.azimuth_deg,
            "visible": visible,
        })

    satellites = [
        {**entry, "current": entry["path"][-1] if entry["path"] else None}
        for entry in by_prn.values()
    ]
    satellites.sort(key=lambda s: s["prn"])

    if not satellites:
        return {
            "status": "unavailable",
            "reason": (
                "No nav-based satellite positions available yet -- a "
                "navigation file may not have been processed for the "
                "current observation session."
            ),
            "station": station,
            "min_elevation_deg": min_elevation,
            "satellites": [],
        }

    return {
        "status": "ok",
        "station": station,
        "min_elevation_deg": min_elevation,
        "satellite_count": len(satellites),
        "satellites": satellites,
    }


@app.get("/api/dop-history")
def dop_history(db: OrmSession = Depends(get_db)):
    """DOP (PDOP/VDOP/HDOP/TDOP/GDOP) trend over the session, one point per
    epoch. DOP is computed per-epoch, not per-satellite (see pipeline.py's
    _build_live_rows), so every satellite row sharing the same `time` has
    identical DOP values -- we only need ONE row per distinct epoch here,
    not one per satellite-epoch pair."""
    rows = (
        db.query(LiveData)
        .filter(LiveData.time.isnot(None))
        .order_by(LiveData.time)
        .all()
    )
    by_time = {}
    for r in rows:
        if r.time not in by_time:
            by_time[r.time] = {
                "time": r.time.strftime("%Y-%m-%d %H:%M:%S"),
                "pdop": r.pdop, "vdop": r.vdop, "hdop": r.hdop,
                "tdop": r.tdop, "gdop": r.gdop,
            }
    return sorted(by_time.values(), key=lambda d: d["time"])


@app.get("/api/status")
def system_status(db: OrmSession = Depends(get_db)):
    """Diagnostics for the dashboard's system-status panel. There is no
    dedicated health-tracking table -- every field here is inferred from
    the current live snapshot, so it reflects the same data the other
    endpoints serve rather than a separate monitoring path."""
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    row = db.query(LiveData).order_by(LiveData.ingested_at.desc()).first()
    now = datetime.now(timezone.utc)

    last_processed = row.ingested_at if row else None
    data_age_seconds = None
    if last_processed:
        la = last_processed if last_processed.tzinfo else last_processed.replace(tzinfo=timezone.utc)
        data_age_seconds = (now - la).total_seconds()

    has_skyplot = db.query(LiveData).filter(LiveData.time.isnot(None)).first() is not None
    has_orbit_positions = db.query(LiveData).filter(LiveData.sat_x.isnot(None)).first() is not None

    # Monotonic version the frontend can cheaply poll for: it strictly
    # increases exactly once per successfully processed OBS/NAV file (see
    # pipeline.py's mark_file_processed), tied to real processing events
    # rather than to wall-clock precision like last_processed_at below.
    latest_processed = db.query(ProcessedFile).order_by(ProcessedFile.id.desc()).first()
    version = latest_processed.id if latest_processed else 0

    return {
        "api": "ok",
        "database": "connected" if db_ok else "error",
        "websocket_clients": len(manager.active_connections),
        "version": version,
        "observation_file": {
            "status": "loaded" if row and row.source_file else "none",
            "name": row.source_file if row else None,
        },
        "navigation_file": {
            "status": "loaded" if row and row.nav_file else "none",
            "name": row.nav_file if row else None,
        },
        "skyplot_data_available": has_skyplot,
        "orbit_data_available": has_orbit_positions,
        "last_processed_at": last_processed.strftime("%Y-%m-%d %H:%M:%S") if last_processed else None,
        "data_age_seconds": round(data_age_seconds, 1) if data_age_seconds is not None else None,
        "stale": data_age_seconds is not None and data_age_seconds > STALE_THRESHOLD_SECONDS,
        "stale_threshold_seconds": STALE_THRESHOLD_SECONDS,
    }


# Disabled for demo stability: this ran a full synchronous multi-request
# network sync (login + folder listing + file download, each with 5-15s
# timeouts) at MODULE IMPORT TIME, before the app could serve any requests
# -- and re-ran on every --reload trigger. It's redundant with
# watch_local_archive_loop_async() above, which already performs the same
# sync safely in the background on a timer. On a slow/flaky connection this
# call alone could stall startup for a long time.
# sync_latest_archive()
