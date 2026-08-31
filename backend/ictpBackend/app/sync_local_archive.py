import os
import re
import glob
import shutil
import time
import asyncio
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

# Paths based on project structure
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INCOMING_DIR = os.path.join(BASE_DIR, "../incoming")
NAV_DIR = os.path.join(BASE_DIR, "../nav")

# Load .env explicitly so it works regardless of the current working
# directory the process was launched from (important with uvicorn --reload).
# .env lives in gnss_backend/ (one level up from this file, which sits in
# app/) -- matches database.py's BASE_DIR = Path(__file__).resolve().parent.parent
# convention, and pipeline.py's BASE_DIR = dirname(dirname(__file__)).
load_dotenv(os.path.join(BASE_DIR, "..", ".env"))

os.makedirs(INCOMING_DIR, exist_ok=True)
os.makedirs(NAV_DIR, exist_ok=True)


def _copy_to_incoming(src_path, filename):
    """Ensure pipeline.py's process_incoming_folder() can see this NAV file.
    fetch_nasa_nav() (and its fallbacks) save into NAV_DIR, but the pipeline
    only ever scans INCOMING_DIR -- without this, a freshly fetched NAV file
    would never get uploaded to Supabase or update the nav pointer."""
    if not src_path or not os.path.exists(src_path):
        return
    dest_path = os.path.join(INCOMING_DIR, filename)
    if not os.path.exists(dest_path):
        shutil.copy2(src_path, dest_path)
        print(f"  [nav_sync] Copied NAV file into incoming/ for pipeline processing -> {filename}")

# Local receiver archive server configurations
LOCAL_BASE_URL = "http://127.0.0.1:5000"  # Local receiver server, same PC (no VPN needed)
CONNECT_URL = f"{LOCAL_BASE_URL}/connect"
ARCHIVE_2026_URL = f"{LOCAL_BASE_URL}/browse/archive/2026"

# Local receiver credentials
SERVER_IP = "192.168.2.107"
SERVER_PASSWORD = "gral"

# NASA Earthdata Bearer Token Configuration
NASA_USERNAME = os.environ.get("NASA_USERNAME", "your_nasa_username_here")
NASA_BEARER_TOKEN = os.environ.get("NASA_BEARER_TOKEN")

if not NASA_BEARER_TOKEN:
    print("  [nav_sync] WARNING: NASA_BEARER_TOKEN env var not set. Live NASA fetch will be skipped.")

# How many days to walk backward, trying NASA again for each earlier date,
# before giving up on NASA entirely and falling back to whatever NAV file
# already happens to be cached locally (see _use_local_fallback).
MAX_NAV_DAYS_BACK = int(os.environ.get("MAX_NAV_DAYS_BACK", "5"))

# When true, fetch_nasa_nav() always hits NASA CDDIS live instead of trusting
# whatever's already cached in nav/ for that date -- lets you force a fresh
# download every cycle instead of silently reusing a stale local copy.
# Controlled via .env so it can be turned back off (recommended once you no
# longer need to force-refetch, to avoid hammering NASA every ~30s).
FORCE_NASA_REFETCH = os.environ.get("NAV_FORCE_REFETCH", "true").strip().lower() in ("1", "true", "yes")


def _nav_filename_for(year, doy):
    return f"BRDM00DLR_S_{year}{doy}0000_01D_MN.rnx.gz"


def _check_local_nav_cache(year, doy):
    """Returns the local path for this exact year/DOY's NAV file if it's
    already sitting in NAV_DIR and looks like a real file (not an HTML
    error page saved by mistake)."""
    nav_filename = _nav_filename_for(year, doy)
    local_nav_path = os.path.join(NAV_DIR, nav_filename)
    if os.path.exists(local_nav_path):
        with open(local_nav_path, "rb") as f:
            if b"<html" not in f.read(50).lower():
                return local_nav_path
    return None


def _fetch_nav_from_nasa(year, doy):
    """Tries to download the NAV file for this exact year/DOY from NASA
    CDDIS. Returns the local path on success, None otherwise. Does not
    touch local cache or fallback logic -- that's handled by the caller."""
    if not NASA_BEARER_TOKEN:
        return None

    nav_filename = _nav_filename_for(year, doy)
    local_nav_path = os.path.join(NAV_DIR, nav_filename)
    yy = year[-2:]

    urls_to_try = [
        f"https://cddis.nasa.gov/archive/gnss/data/daily/{year}/{doy}/{yy}p/{nav_filename}",
        f"https://cddis.nasa.gov/archive/gnss/data/daily/{year}/brdc/{nav_filename}",
    ]

    session = requests.Session()
    headers = {"Authorization": f"Bearer {NASA_BEARER_TOKEN}"}

    for url in urls_to_try:
        try:
            print(f"  [nav_sync] Scanning NASA CDDIS path -> {url}")
            response = session.get(url, headers=headers, timeout=30, allow_redirects=True)
            content_type = response.headers.get("Content-Type", "")

            # A gzipped BRDM daily nav file is reliably well over a few
            # hundred KB. Guard against saving a truncated/partial download
            # or an auth-error body that slipped past the html check (e.g.
            # a plain-text "unauthorized" response) as if it were valid.
            MIN_VALID_GZ_BYTES = 50_000
            if (response.status_code == 200 and "text/html" not in content_type
                    and b"<html" not in response.content[:50].lower()
                    and len(response.content) >= MIN_VALID_GZ_BYTES):
                with open(local_nav_path, "wb") as f:
                    f.write(response.content)
                print(f"  [nav_sync] Successfully found and downloaded NAV file from NASA: {nav_filename}")
                return local_nav_path
            elif response.status_code == 200:
                print(f"  [nav_sync] Response looked invalid (only {len(response.content)} bytes) -- "
                      f"not saving; treating as not found at this path.")
            else:
                print(f"  [nav_sync] Not found at this path (status {response.status_code}).")
        except Exception as e:
            print(f"  [nav_sync] Path check warning: {e}")

    return None


def fetch_nasa_nav(year, doy):
    """Retrieval order for a NAV file matching a given observation date (year/DOY):
      1. Local cache -- if we already have this exact date's NAV file, use it.
      2. NASA CDDIS for this exact date.
      3. NASA CDDIS again, walking backward day-by-day (up to MAX_NAV_DAYS_BACK
         days) until an earlier date's NAV file is found -- this is what lets
         processing continue with the most recent available ephemeris when
         today's NAV hasn't been published yet.
      4. As an absolute last resort, whatever NAV file is already cached
         locally, regardless of date (_use_local_fallback)."""
    nav_filename = _nav_filename_for(year, doy)

    # 1. Local cache for the exact requested date -- skipped entirely when
    # FORCE_NASA_REFETCH is on, so every call actually re-hits NASA instead
    # of silently reusing whatever's already sitting in nav/.
    if not FORCE_NASA_REFETCH:
        local_hit = _check_local_nav_cache(year, doy)
        if local_hit:
            print(f"  [nav_sync] Using existing local NAV file for day {doy}: {nav_filename}")
            _copy_to_incoming(local_hit, nav_filename)
            return local_hit
    else:
        print(f"  [nav_sync] NAV_FORCE_REFETCH is on -- skipping local cache check for day {doy}, going straight to NASA.")

    # 2. Live NASA fetch for the exact requested date.
    print("  [nav_sync] Downloading from NASA...")
    if not NASA_BEARER_TOKEN:
        print("  [nav_sync] Skipping live NASA fetch: no bearer token configured.")
        # Even with FORCE_NASA_REFETCH on, fall back to local cache here --
        # there's no point failing the whole cycle just because we can't
        # reach NASA and skipped the cache check above.
        if FORCE_NASA_REFETCH:
            local_hit = _check_local_nav_cache(year, doy)
            if local_hit:
                print(f"  [nav_sync] Falling back to existing local NAV file for day {doy}: {nav_filename}")
                _copy_to_incoming(local_hit, nav_filename)
                return local_hit
    else:
        nasa_hit = _fetch_nav_from_nasa(year, doy)
        if nasa_hit:
            _copy_to_incoming(nasa_hit, nav_filename)
            return nasa_hit
        elif FORCE_NASA_REFETCH:
            # NASA reachable but this exact date 404'd -- try the local cache
            # for this exact date before falling through to the day-walk-back
            # logic below (which also now re-checks NASA per day).
            local_hit = _check_local_nav_cache(year, doy)
            if local_hit:
                print(f"  [nav_sync] NASA fetch failed for day {doy}, using existing local NAV file: {nav_filename}")
                _copy_to_incoming(local_hit, nav_filename)
                return local_hit

        # 3. Walk backward day-by-day, asking NASA for each earlier date,
        # until we find one that exists (handles the case where the
        # satellite's ephemeris for "today" simply hasn't been published
        # to CDDIS yet -- very common for the current/most recent day).
        print(f"  [nav_sync] NAV not available on NASA for DOY {doy}. "
              f"Checking previous days (up to {MAX_NAV_DAYS_BACK} days back)...")
        try:
            current_date = datetime.strptime(f"{year}{doy}", "%Y%j")
        except ValueError:
            current_date = None

        if current_date:
            for days_back in range(1, MAX_NAV_DAYS_BACK + 1):
                prev_date = current_date - timedelta(days=days_back)
                prev_year = prev_date.strftime("%Y")
                prev_doy = prev_date.strftime("%j")

                # Check local cache for this earlier date first (cheap),
                # then fall back to asking NASA for it.
                prev_local_hit = _check_local_nav_cache(prev_year, prev_doy)
                if prev_local_hit:
                    print(f"  [nav_sync] Using cached NAV file from {days_back} day(s) "
                          f"prior (DOY {prev_doy}) for computations.")
                    _copy_to_incoming(prev_local_hit, os.path.basename(prev_local_hit))
                    return prev_local_hit

                prev_nasa_hit = _fetch_nav_from_nasa(prev_year, prev_doy)
                if prev_nasa_hit:
                    print(f"  [nav_sync] Found NAV file from {days_back} day(s) prior "
                          f"(DOY {prev_doy}) on NASA -- using it for computations.")
                    _copy_to_incoming(prev_nasa_hit, os.path.basename(prev_nasa_hit))
                    return prev_nasa_hit

    # 4. Absolute last resort: whatever valid NAV file already exists
    # locally, regardless of date.
    print(f"  [nav_sync] No NAV file found on NASA within {MAX_NAV_DAYS_BACK} days "
          f"of DOY {doy}. Switching to local fallback files...")
    fallback_path = _use_local_fallback(doy)
    if fallback_path:
        _copy_to_incoming(fallback_path, os.path.basename(fallback_path))
    return fallback_path


def _use_local_fallback(doy):
    if os.path.exists(NAV_DIR):
        existing_files = [f for f in os.listdir(NAV_DIR) if f.endswith((".rnx", ".rnx.gz"))]
        valid_files = [
            f for f in existing_files
            if b"<html" not in open(os.path.join(NAV_DIR, f), "rb").read(50).lower()
        ]

        if valid_files:
            valid_files.sort()
            fallback_file = valid_files[-1]
            fallback_path = os.path.join(NAV_DIR, fallback_file)
            print(f"  [nav_sync] Fallback Activated: Using available navigation file -> {fallback_file}")
            return fallback_path

    print("  [nav_sync] Critical Error: No valid navigation files available at all!")
    return None


def extract_date_and_fetch_nav(filename):
    match_doy = re.search(r'_(\d{4})(\d{3})', filename)
    match_date = re.search(r'_(\d{4})(\d{2})(\d{2})', filename)

    if match_doy:
        year, doy = match_doy.groups()
        return fetch_nasa_nav(year, doy)
    elif match_date:
        year, month, day = match_date.groups()
        dt = datetime(int(year), int(month), int(day))
        return fetch_nasa_nav(dt.strftime("%Y"), dt.strftime("%j"))
    else:
        target_date = datetime.now(timezone.utc) - timedelta(days=1)
        return fetch_nasa_nav(target_date.strftime("%Y"), target_date.strftime("%j"))


def sync_latest_archive():
    """Condition-based sync: Tries live server fetching first; falls back to cached local observation data matching its exact date."""
    session = requests.Session()
    live_sync_success = False

    print(f"  [archive_sync] Attempting live sync from local archive server at {LOCAL_BASE_URL}...")
    login_payload = {
        "ip": SERVER_IP,
        "password": SERVER_PASSWORD,
        "remember": "on"
    }

    try:
        login_res = session.post(CONNECT_URL, data=login_payload, allow_redirects=True, timeout=5)
        print(f"  [DEBUG] /connect status: {login_res.status_code}")

        if login_res.status_code == 200:
            res = session.get(ARCHIVE_2026_URL, timeout=5)
            print(f"  [DEBUG] /browse/archive/2026 status: {res.status_code}")

            if res.status_code == 200:
                # DEBUG: dump every raw href found on the archive/2026 page, unfiltered
                all_hrefs = [a['href'] for a in BeautifulSoup(res.text, 'html.parser').find_all('a', href=True)]
                print(f"  [DEBUG] ALL raw hrefs on archive/2026 page ({len(all_hrefs)} total): {all_hrefs}")

                soup = BeautifulSoup(res.text, 'html.parser')
                subfolders = []
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    if "/archive/2026/" in href:
                        parts = href.strip("/").split("/")
                        if len(parts) >= 4:
                            subfolders.append(parts[-1])

                subfolders = sorted(list(set(subfolders)), key=lambda x: int(x) if x.isdigit() else 0)
                print(f"  [DEBUG] Parsed+sorted DOY subfolders: {subfolders}")

                if subfolders:
                    latest_folder = subfolders[-1]
                    print(f"  [DEBUG] Picked latest_folder = {latest_folder}")

                    folder_url = f"{LOCAL_BASE_URL}/browse/archive/2026/{latest_folder}"
                    folder_res = session.get(folder_url, timeout=10)
                    print(f"  [DEBUG] folder_url={folder_url} status={folder_res.status_code}")

                    if folder_res.status_code == 200:
                        folder_soup = BeautifulSoup(folder_res.text, 'html.parser')
                        obs_files = [link['href'].split("/")[-1] for link in folder_soup.find_all('a', href=True) if any(ext in link['href'] for ext in [".crx.gz", ".rnx", ".crx"])]
                        print(f"  [DEBUG] obs_files found in {latest_folder}: {obs_files}")

                        if obs_files:
                            obs_files.sort()
                            latest_file = obs_files[-1]
                            print(f"  [DEBUG] Picked latest_file = {latest_file}")

                            local_file_path = os.path.join(INCOMING_DIR, latest_file)

                            if not os.path.exists(local_file_path):
                                download_url = f"{LOCAL_BASE_URL}/download/archive/2026/{latest_folder}/{latest_file}"
                                file_res = session.get(download_url, stream=True, timeout=15)
                                if file_res.status_code == 200:
                                    with open(local_file_path, "wb") as f:
                                        for chunk in file_res.iter_content(chunk_size=8192):
                                            f.write(chunk)
                                    print(f"  [archive_sync] Live download complete: {latest_file}")

                            extract_date_and_fetch_nav(latest_file)
                            live_sync_success = True

    except Exception as e:
        print(f"  [archive_sync] Live server unreachable ({e}).")

    if not live_sync_success:
        print("  [archive_sync] 🔄 FALLBACK CONDITION ACTIVATED: Using pre-stored local observation files...")
        if os.path.exists(INCOMING_DIR):
            cached_files = [f for f in os.listdir(INCOMING_DIR) if f.endswith((".crx.gz", ".rnx", ".crx"))]
            if cached_files:
                cached_files.sort()
                latest_cached_file = cached_files[-1]
                print(f"  [archive_sync] Using cached observation file -> {latest_cached_file}")
                extract_date_and_fetch_nav(latest_cached_file)
            else:
                print("  [archive_sync] Warning: No cached observation files found in incoming directory.")


def watch_local_archive_loop(interval_seconds: int = 60):
    """Keeps re-checking the local receiver archive server (127.0.0.1)
    for new observation files, forever, on its own timer -- separate from
    pipeline.py's watch_loop(), which only ever looks at files already
    sitting in incoming/. Without this, sync_latest_archive() only ran
    once at server startup and would never notice a brand-new file
    appearing on the receiver afterwards; you'd have had to restart the
    whole server to pick it up. sync_latest_archive() is already safe to
    call repeatedly -- it only downloads a file if it doesn't already have
    a local copy of that exact filename.

    NOTE: this blocking, thread-based version is kept for CLI/manual use
    (see __main__ below). The FastAPI app uses watch_local_archive_loop_async
    instead, since a plain `while True` inside a background thread can
    never be told to stop -- see that function's docstring."""
    print(f"Watching local archive server {LOCAL_BASE_URL} every {interval_seconds}s ... (Ctrl+C to stop)")
    while True:
        try:
            sync_latest_archive()
        except Exception as e:
            print(f"  [archive_sync] Unexpected error during periodic check: {e}")
        time.sleep(interval_seconds)


async def watch_local_archive_loop_async(interval_seconds: int = 60):
    """Same behavior as watch_local_archive_loop, but as a real asyncio
    coroutine instead of a blocking thread. This matters specifically for
    uvicorn --reload: a `while True: ...; time.sleep(N)` running inside a
    background thread has no way to be told "stop" -- when --reload tries
    to shut the old process down, it hangs waiting on that thread forever,
    leaving a zombie process that keeps its Supabase database connection
    open. Enough of those over repeated reloads exhausts Supabase's
    connection pool entirely (exactly what happened). This version awaits
    asyncio.sleep() instead of blocking on time.sleep(), which means it can
    actually be cancelled cleanly via task.cancel() on shutdown -- each
    network call still runs in a thread (via asyncio.to_thread) so it never
    blocks the rest of the FastAPI app while in progress."""
    print(f"Watching local archive server {LOCAL_BASE_URL} every {interval_seconds}s ... (Ctrl+C to stop)")
    try:
        while True:
            try:
                await asyncio.to_thread(sync_latest_archive)
            except Exception as e:
                print(f"  [archive_sync] Unexpected error during periodic check: {e}")
            await asyncio.sleep(interval_seconds)
    except asyncio.CancelledError:
        print("  [archive_sync] Receiver watch loop cancelled, shutting down cleanly.")
        raise


if __name__ == "__main__":
    sync_latest_archive()