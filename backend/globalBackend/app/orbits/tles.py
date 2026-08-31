import os
import json
import time
import datetime
import requests

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
CACHE_FILE = os.path.join(DATA_DIR, "cached_tles.json")

# How long stored CelesTrak data is considered "fresh" before we refetch.
# This is also the interval the background refresh loop (see main.py) runs on.
REFRESH_INTERVAL_SECONDS = 2 * 60 * 60  # 2 hours

# Default GNSS TLEs in case CelesTrak is offline
DEFAULT_TLES = [
    "GPS BIIR-2  (PRN 02)\n1 28474U 04045A   26204.49842106  .00000037  00000-0  00000-0 0  9991\n2 28474  56.0964  93.1897 0192534 227.0673 131.6033  2.00561574158654",
    "GPS BIIF-1  (PRN 25)\n1 36585U 10022A   26204.41724218  .00000049  00000-0  00000-0 0  9997\n2 36585  55.5103 216.7112 0064732 173.8430 186.2798  2.00557431118129",
    "GPS BIIF-2  (PRN 01)\n1 37753U 11036A   26204.38201402  .00000067  00000-0  00000-0 0  9997\n2 37753  54.9123 336.8123 0089123 154.2189 205.9182  2.00562381105912",
    "COSMOS 2547 (GLONASS 705)\n1 46231U 20058A   26204.45182902  .00000098  00000-0  00000-0 0  9995\n2 46231  64.8123 112.9123 0012012 312.9012  46.1293  2.13101293 45812",
    "COSMOS 2555 (GLONASS 706)\n1 48261U 21045A   26204.41289120  .00000087  00000-0  00000-0 0  9998\n2 48261  64.9123 234.9012 0015012 124.9123 235.1293  2.13108912 34912",
    "GSAT0101 (PRN E11)\n1 37846U 11060A   26204.39128012  .00000012  00000-0  00000-0 0  9992\n2 37846  56.1293 189.9123 0002131  45.9123 314.1293  1.98102931 98129",
    "GSAT0201 (PRN E12)\n1 40128U 14050A   26204.41092831  .00000015  00000-0  00000-0 0  9991\n2 40128  56.0912 310.1293 0001891  98.1293 261.9012  1.98108912 84912",
    "BEIDOU-3 G1 (PRN C19)\n1 43681U 18084A   26204.51239012  .00000123  00000-0  00000-0 0  9993\n2 43681  55.1293  78.9123 0008123 210.9123 149.1293  2.00891231 51293",
    "BEIDOU-3 I1 (PRN C20)\n1 44521U 19058A   26204.48912301  .00000112  00000-0  00000-0 0  9992\n2 44521  55.0912 198.1293 0009123  98.9123 261.1293  2.00889123 45812",
    "IRNSS-1I\n1 43286U 18035A   26204.58912902  .00000213  00000-0  00000-0 0  9994\n2 43286  29.1293 145.9123 0019231 189.9123 170.1293  1.00289123  4129"
]

# In-memory record of the last successful fetch, so /api/status can report
# freshness without re-reading the disk cache every time.
last_refresh_meta = {"fetched_at": None, "source": None}


def _save_cache(tles):
    """Best-effort disk cache write, timestamped so we know how stale it is.
    Never raises — a locked/read-only data dir (common on Windows when the
    project sits on a restricted or network drive) should degrade to
    in-memory-only operation, not crash the whole app."""
    payload = {
        "fetched_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "tles": tles
    }
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(CACHE_FILE, "w") as f:
            json.dump(payload, f, indent=2)
    except Exception as e:
        print(f"Warning: could not write TLE cache to disk ({CACHE_FILE}): {e}. "
              f"Continuing with in-memory data only.")


def _read_cache_payload():
    """Read the on-disk cache. Supports both the new {fetched_at, tles} shape
    and the older bare-list shape (treated as having unknown/zero freshness)."""
    if not os.path.exists(CACHE_FILE):
        return None
    try:
        with open(CACHE_FILE, "r") as f:
            data = json.load(f)
        if isinstance(data, dict) and "tles" in data:
            return data
        if isinstance(data, list):
            return {"fetched_at": None, "tles": data}
    except Exception:
        pass
    return None


def get_cache_age_seconds():
    """Seconds since the on-disk cache was last written by a successful
    CelesTrak fetch. Returns None if there's no timestamped cache yet."""
    payload = _read_cache_payload()
    if not payload or not payload.get("fetched_at"):
        return None
    try:
        fetched_at = datetime.datetime.fromisoformat(payload["fetched_at"])
        now = datetime.datetime.now(datetime.timezone.utc)
        return (now - fetched_at).total_seconds()
    except Exception:
        return None


def load_local_tle_cache():
    payload = _read_cache_payload()
    if payload and payload.get("tles"):
        last_refresh_meta.update(fetched_at=payload.get("fetched_at"), source="cache")
        return payload["tles"]
    tles_parsed = []
    for entry in DEFAULT_TLES:
        parts = entry.strip().split("\n")
        if len(parts) == 3:
            tles_parsed.append({"name": parts[0], "line1": parts[1], "line2": parts[2]})
    _save_cache(tles_parsed)
    last_refresh_meta.update(fetched_at=datetime.datetime.now(datetime.timezone.utc).isoformat(), source="default")
    return tles_parsed


def _fetch_group_tle(group: str):
    """Fetch and parse a single CelesTrak TLE group. Returns [] on failure."""
    url = f"https://celestrak.org/NORAD/elements/gp.php?GROUP={group}&FORMAT=tle"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            lines = response.text.splitlines()
            parsed = []
            i = 0
            while i + 2 < len(lines):
                name, line1, line2 = lines[i].strip(), lines[i+1].strip(), lines[i+2].strip()
                if name and line1.startswith("1") and line2.startswith("2"):
                    parsed.append({"name": name, "line1": line1, "line2": line2})
                i += 3
            return parsed
    except Exception as e:
        print(f"Failed to fetch live TLEs for group '{group}': {e}")
    return []


def fetch_fresh_tles():
    """Hit CelesTrak right now, store the result (with a fresh timestamp) to
    disk, and return it. Falls back to whatever's already cached/default if
    CelesTrak can't be reached."""
    # "gnss" covers GPS/GLONASS/Galileo/BeiDou/IRNSS/QZSS.
    # "sbas" covers WAAS/EGNOS/GAGAN/MSAS/SDCM augmentation satellites separately.
    gnss_tles = _fetch_group_tle("gnss")
    sbas_tles = _fetch_group_tle("sbas")
    tles_parsed = gnss_tles + sbas_tles

    if tles_parsed:
        _save_cache(tles_parsed)
        last_refresh_meta.update(fetched_at=datetime.datetime.now(datetime.timezone.utc).isoformat(), source="celestrak")
        return tles_parsed

    return load_local_tle_cache()


def load_or_fetch_tles(max_age_seconds=REFRESH_INTERVAL_SECONDS):
    """Startup/refresh-loop entry point implementing the "stored data, refresh
    every 2 hours" policy: if the on-disk CelesTrak cache is younger than
    max_age_seconds, use it as-is (no network call). Otherwise fetch fresh
    data from CelesTrak and re-stamp the cache."""
    age = get_cache_age_seconds()
    if age is not None and age < max_age_seconds:
        payload = _read_cache_payload()
        last_refresh_meta.update(fetched_at=payload.get("fetched_at"), source="cache")
        return payload["tles"]
    return fetch_fresh_tles()
