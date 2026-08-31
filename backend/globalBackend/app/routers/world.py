import time
import datetime
from fastapi import APIRouter, Query
from sgp4.api import Satrec, jday

from app import state
from app.orbits import propagate_satellite, compute_dop, estimate_tec_and_delay

router = APIRouter(prefix="/api")

# Simple in-memory cache: grid computation is expensive (N_grid_points x N_satellites
# propagations), so results are cached for a short window and reused across requests.
_CACHE_TTL_SEC = 60
_world_dop_cache = {"key": None, "timestamp": 0, "data": None}
_world_tec_cache = {"key": None, "timestamp": 0, "data": None}


def _build_grid(step_deg: float):
    lats = [round(-90 + i * step_deg, 3) for i in range(int(180 / step_deg) + 1)]
    lngs = [round(-180 + i * step_deg, 3) for i in range(int(360 / step_deg) + 1)]
    return lats, lngs


@router.get("/world-dop")
def get_world_dop(
    step_deg: float = Query(10.0, ge=2.0, le=30.0, description="Grid resolution in degrees"),
    mask: float = Query(10.0, description="Elevation mask angle (degrees)")
):
    """Compute DOP (GDOP/PDOP/HDOP/VDOP/TDOP) on a world lat/lng grid for the current
    timestamp, for rendering as a heatmap on a 3D globe. Cached briefly since this is
    compute-heavy (grid_points x satellites propagations per request)."""
    cache_key = f"{step_deg}-{mask}"
    now = time.time()
    if _world_dop_cache["key"] == cache_key and (now - _world_dop_cache["timestamp"]) < _CACHE_TTL_SEC:
        return _world_dop_cache["data"]

    dt = datetime.datetime.now(datetime.timezone.utc)
    jd, fr = jday(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second)

    # Pre-parse TLEs once for reuse across all grid points.
    satrecs = []
    for sat_data in state.satellites_cache:
        try:
            satrecs.append(Satrec.twoline2rv(sat_data["line1"], sat_data["line2"]))
        except Exception:
            continue

    lats, lngs = _build_grid(step_deg)
    points = []
    for lat in lats:
        for lng in lngs:
            visible = []
            for satrec in satrecs:
                try:
                    prop = propagate_satellite(satrec, jd, fr, lat, lng, 0.0)
                    if prop and prop["elevation"] >= mask:
                        visible.append(prop)
                except Exception:
                    continue
            dop = compute_dop(visible)
            points.append({
                "lat": lat, "lng": lng,
                "gdop": dop["gdop"], "pdop": dop["pdop"],
                "hdop": dop["hdop"], "vdop": dop["vdop"], "tdop": dop["tdop"],
                "num_satellites": len(visible)
            })

    result = {
        "timestamp": dt.isoformat(),
        "step_deg": step_deg,
        "mask": mask,
        "points": points
    }
    _world_dop_cache.update({"key": cache_key, "timestamp": now, "data": result})
    return result


@router.get("/world-tec")
def get_world_tec(
    step_deg: float = Query(10.0, ge=2.0, le=30.0, description="Grid resolution in degrees")
):
    """Compute Vertical TEC (VTEC) on a world lat/lng grid for rendering as an
    ionospheric heatmap on a 3D globe.

    NOTE: this reuses the same simplified analytic day/night + latitude model used
    elsewhere in this app (app/orbits/delays.py estimate_tec_and_delay), evaluated at
    the zenith (90 deg elevation) so it returns pure VTEC per grid cell. It is NOT a
    real IGS/CODE Global Ionosphere Map (GIM) product — for that you would need to
    ingest real IONEX data, which is out of scope here.
    """
    cache_key = f"{step_deg}"
    now = time.time()
    if _world_tec_cache["key"] == cache_key and (now - _world_tec_cache["timestamp"]) < _CACHE_TTL_SEC:
        return _world_tec_cache["data"]

    dt = datetime.datetime.now(datetime.timezone.utc)
    lats, lngs = _build_grid(step_deg)
    points = []
    for lat in lats:
        for lng in lngs:
            tec = estimate_tec_and_delay(lat, lng, 90.0, dt)
            points.append({"lat": lat, "lng": lng, "vtec": tec["vtec"]})

    result = {
        "timestamp": dt.isoformat(),
        "step_deg": step_deg,
        "model": "analytic_local_time_latitude (not a real IONEX/GIM product)",
        "points": points
    }
    _world_tec_cache.update({"key": cache_key, "timestamp": now, "data": result})
    return result
