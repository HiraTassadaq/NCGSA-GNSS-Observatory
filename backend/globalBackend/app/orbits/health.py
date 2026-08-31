import os
import json
import time
import requests

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
HEALTH_CACHE_FILE = os.path.join(DATA_DIR, "cached_health.json")

# CelesTrak SATCAT query returning OPS_STATUS_CODE per catalog object (GNSS + SBAS
# groups, JSON format). NOTE: this must be the SATCAT "records.php" endpoint, not the
# GP/orbital-elements "gp.php" endpoint used for TLEs elsewhere in this app — gp.php
# only serves orbital-element fields and does NOT include OPS_STATUS_CODE at all (it
# comes back null for every record), which is why status lookups were always "unknown".
# OPS_STATUS_CODE meanings (per CelesTrak / UCS convention):
#   '+' operational, 'P' partially operational, 'B'/'S' backup/spare/standby,
#   'X' extended mission, 'D' decayed, 'N' non-operational, '?' unknown
CELESTRAK_SATCAT_JSON_URL = "https://celestrak.org/satcat/records.php?GROUP={group}&FORMAT=json"
_HEALTH_GROUPS = ["gnss", "sbas"]

_STATUS_MAP = {
    "+": "active", "P": "active", "X": "active",
    "B": "standby", "S": "standby",
    "D": "inactive", "N": "inactive",
}

_REFRESH_INTERVAL_SEC = 6 * 3600  # refresh at most every 6 hours
_last_fetch_ts = 0
_health_by_norad_id = {}


def _status_from_code(code):
    if not code:
        return "unknown"
    return _STATUS_MAP.get(str(code).strip().upper(), "unknown")


def _load_cache_from_disk():
    if os.path.exists(HEALTH_CACHE_FILE):
        try:
            with open(HEALTH_CACHE_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def _save_cache_to_disk(data):
    """Best-effort disk cache write — never raises. Same rationale as tles.py's
    _save_cache: a locked/read-only data dir should degrade to in-memory-only
    operation, not crash the whole app."""
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(HEALTH_CACHE_FILE, "w") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Warning: could not write health cache to disk ({HEALTH_CACHE_FILE}): {e}. "
              f"Continuing with in-memory data only.")


def fetch_fresh_health():
    """Fetch operational status for all GNSS + SBAS satellites from CelesTrak's SATCAT.
    Falls back to whatever is cached on disk (or empty) if the network call fails.
    """
    global _health_by_norad_id, _last_fetch_ts
    try:
        mapped = {}
        for group in _HEALTH_GROUPS:
            r = requests.get(CELESTRAK_SATCAT_JSON_URL.format(group=group), timeout=10)
            if r.status_code == 200:
                records = r.json()
                for rec in records:
                    norad_id = rec.get("NORAD_CAT_ID")
                    if norad_id is None:
                        continue
                    status = _status_from_code(rec.get("OPS_STATUS_CODE"))
                    mapped[str(norad_id)] = {
                        "status": status,
                        "ops_status_code": rec.get("OPS_STATUS_CODE"),
                        "object_name": rec.get("OBJECT_NAME"),
                        "source": "celestrak_satcat",
                    }
        if mapped:
            _health_by_norad_id = mapped
            _last_fetch_ts = time.time()
            _save_cache_to_disk(mapped)
            return mapped
    except Exception as e:
        print(f"Failed to fetch live GNSS health/status data: {e}")

    # Fall back to disk cache
    cached = _load_cache_from_disk()
    if cached:
        _health_by_norad_id = cached
    _last_fetch_ts = time.time()
    return _health_by_norad_id


def get_health_cache():
    """Return the in-memory health map, refreshing from CelesTrak if stale."""
    global _last_fetch_ts
    if not _health_by_norad_id or (time.time() - _last_fetch_ts) > _REFRESH_INTERVAL_SEC:
        fetch_fresh_health()
    return _health_by_norad_id


def get_satellite_health(catalog_number: int):
    """Look up operational health for a single satellite by NORAD catalog number.
    Returns a dict with status in {"active","standby","inactive","unknown"}.
    """
    cache = get_health_cache()
    entry = cache.get(str(catalog_number))
    if entry:
        return {
            "status": entry.get("status", "unknown"),
            "ops_status_code": entry.get("ops_status_code"),
            "source": entry.get("source", "celestrak_satcat"),
        }
    return {"status": "unknown", "ops_status_code": None, "source": "celestrak_satcat"}
