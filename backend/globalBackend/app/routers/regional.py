import math
import datetime
import time
from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from sgp4.api import Satrec, jday

from app import state
from app.orbits import (
    propagate_satellite, compute_dop, estimate_tec_and_delay,
    get_constellation, get_prn, get_satellite_health
)

router = APIRouter(prefix="/api")

# In-memory caches for compute-heavy regional grids
_pakistan_cache = {"key": None, "timestamp": 0, "data": None}
_islamabad_cache = {"key": None, "timestamp": 0, "data": None}
_CACHE_TTL = 30  # 30 seconds cache TTL


def parse_timestamp(time_str: Optional[str]) -> datetime.datetime:
    if time_str:
        try:
            return datetime.datetime.fromisoformat(time_str.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid ISO timestamp format.")
    return datetime.datetime.now(datetime.timezone.utc)


@router.get("/pakistan-grid")
def get_pakistan_grid(
    mask: float = Query(10.0, description="Elevation mask angle"),
    system: str = Query("ALL", description="Constellation filter (ALL, GPS, Galileo, etc.)"),
    time_str: Optional[str] = Query(None, alias="time", description="ISO timestamp")
):
    """Compute 1° x 1° DOP and satellite visibility grid over Pakistan (Lat 23 to 37 N, Lng 60 to 78 E)."""
    dt = parse_timestamp(time_str)
    cache_key = f"{mask}-{system}-{dt.strftime('%Y%m%d%H%M')}"
    now = time.time()
    if _pakistan_cache["key"] == cache_key and (now - _pakistan_cache["timestamp"]) < _CACHE_TTL:
        return _pakistan_cache["data"]

    jd, fr = jday(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second + dt.microsecond / 1e6)

    satrecs = []
    for sat_data in state.satellites_cache:
        const = get_constellation(sat_data["name"])
        if system != "ALL" and const != system:
            continue
        try:
            satrecs.append({
                "satrec": Satrec.twoline2rv(sat_data["line1"], sat_data["line2"]),
                "constellation": const,
                "name": sat_data["name"]
            })
        except Exception:
            continue

    # Pakistan bounds: lat 23.0 to 37.0 (step 1°), lng 60.0 to 78.0 (step 1°)
    lats = [round(23.0 + i * 1.0, 1) for i in range(15)]
    lngs = [round(60.0 + i * 1.0, 1) for i in range(19)]

    points = []
    for lat in lats:
        for lng in lngs:
            visible = []
            for item in satrecs:
                try:
                    prop = propagate_satellite(item["satrec"], jd, fr, lat, lng, 0.0)
                    if prop and prop["elevation"] >= mask:
                        visible.append(prop)
                except Exception:
                    continue
            dop = compute_dop(visible)
            tec = estimate_tec_and_delay(lat, lng, 90.0, dt)
            points.append({
                "lat": lat, "lng": lng,
                "num_satellites": len(visible),
                "gdop": dop["gdop"], "pdop": dop["pdop"],
                "hdop": dop["hdop"], "vdop": dop["vdop"], "tdop": dop["tdop"],
                "vtec": tec["vtec"]
            })

    result = {
        "timestamp": dt.isoformat(),
        "region": "Pakistan",
        "bounds": {"min_lat": 23.0, "max_lat": 37.0, "min_lng": 60.0, "max_lng": 78.0},
        "resolution_deg": 1.0,
        "mask": mask,
        "system": system,
        "points": points
    }
    _pakistan_cache.update({"key": cache_key, "timestamp": now, "data": result})
    return result


@router.get("/islamabad-grid")
def get_islamabad_grid(
    mask: float = Query(10.0, description="Elevation mask angle"),
    system: str = Query("ALL", description="Constellation filter"),
    time_str: Optional[str] = Query(None, alias="time", description="ISO timestamp")
):
    """Compute high-resolution 0.25° x 0.25° DOP & TEC grid over Islamabad Capital Region (Lat 33.4 to 33.9 N, Lng 72.8 to 73.3 E)."""
    dt = parse_timestamp(time_str)
    cache_key = f"{mask}-{system}-{dt.strftime('%Y%m%d%H%M')}"
    now = time.time()
    if _islamabad_cache["key"] == cache_key and (now - _islamabad_cache["timestamp"]) < _CACHE_TTL:
        return _islamabad_cache["data"]

    jd, fr = jday(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second + dt.microsecond / 1e6)

    satrecs = []
    for sat_data in state.satellites_cache:
        const = get_constellation(sat_data["name"])
        if system != "ALL" and const != system:
            continue
        try:
            satrecs.append({
                "satrec": Satrec.twoline2rv(sat_data["line1"], sat_data["line2"]),
                "constellation": const
            })
        except Exception:
            continue

    # Islamabad bounds: lat 33.40 to 33.95 (step 0.05°), lng 72.80 to 73.35 (step 0.05°)
    lats = [round(33.40 + i * 0.05, 2) for i in range(12)]
    lngs = [round(72.80 + i * 0.05, 2) for i in range(12)]

    points = []
    for lat in lats:
        for lng in lngs:
            visible = []
            for item in satrecs:
                try:
                    prop = propagate_satellite(item["satrec"], jd, fr, lat, lng, 540.0)
                    if prop and prop["elevation"] >= mask:
                        visible.append(prop)
                except Exception:
                    continue
            dop = compute_dop(visible)
            tec = estimate_tec_and_delay(lat, lng, 90.0, dt)
            points.append({
                "lat": lat, "lng": lng,
                "num_satellites": len(visible),
                "gdop": dop["gdop"], "pdop": dop["pdop"],
                "hdop": dop["hdop"], "vdop": dop["vdop"], "tdop": dop["tdop"],
                "vtec": tec["vtec"]
            })

    result = {
        "timestamp": dt.isoformat(),
        "region": "Islamabad",
        "ncgsa_coords": {"lat": 33.6560, "lng": 73.1560},
        "bounds": {"min_lat": 33.40, "max_lat": 33.95, "min_lng": 72.80, "max_lng": 73.35},
        "resolution_deg": 0.05,
        "mask": mask,
        "system": system,
        "points": points
    }
    _islamabad_cache.update({"key": cache_key, "timestamp": now, "data": result})
    return result


@router.get("/ground-tracks")
def get_ground_tracks(
    system: str = Query("ALL", description="Constellation filter"),
    time_str: Optional[str] = Query(None, alias="time", description="ISO timestamp"),
    history_mins: int = Query(45, ge=15, le=120, description="Past orbit track duration in minutes"),
    future_mins: int = Query(45, ge=15, le=120, description="Future orbit track duration in minutes"),
    step_mins: int = Query(3, ge=1, le=10, description="Track sampling interval in minutes")
):
    """Compute past, current, and predicted 2D ground tracks for satellites."""
    dt = parse_timestamp(time_str)

    tracks = []
    for sat_data in state.satellites_cache[:60]:  # Cap to top 60 satellites for 60fps performance
        const = get_constellation(sat_data["name"])
        if system != "ALL" and const != system:
            continue
        try:
            satrec = Satrec.twoline2rv(sat_data["line1"], sat_data["line2"])
            prn = get_prn(sat_data["name"], satrec.satnum)

            jd_now, fr_now = jday(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second)
            prop_now = propagate_satellite(satrec, jd_now, fr_now, 0.0, 0.0, 0.0)
            if not prop_now:
                continue

            past = []
            for m in range(history_mins, 0, -step_mins):
                t = dt - datetime.timedelta(minutes=m)
                jd, fr = jday(t.year, t.month, t.day, t.hour, t.minute, t.second)
                prop = propagate_satellite(satrec, jd, fr, 0.0, 0.0, 0.0)
                if prop:
                    past.append({"lat": round(prop["sat_lat"], 3), "lng": round(prop["sat_lng"], 3)})

            future = []
            for m in range(step_mins, future_mins + 1, step_mins):
                t = dt + datetime.timedelta(minutes=m)
                jd, fr = jday(t.year, t.month, t.day, t.hour, t.minute, t.second)
                prop = propagate_satellite(satrec, jd, fr, 0.0, 0.0, 0.0)
                if prop:
                    future.append({"lat": round(prop["sat_lat"], 3), "lng": round(prop["sat_lng"], 3)})

            tracks.append({
                "name": sat_data["name"],
                "prn": prn,
                "constellation": const,
                "current": {"lat": round(prop_now["sat_lat"], 3), "lng": round(prop_now["sat_lng"], 3), "alt_km": round(prop_now["sat_alt"] / 1000.0, 1)},
                "past": past,
                "future": future
            })
        except Exception:
            continue

    return {"timestamp": dt.isoformat(), "system": system, "count": len(tracks), "tracks": tracks}


@router.get("/satellite-passes")
def get_satellite_passes(
    lat: float = Query(33.6560, description="Observer Latitude"),
    lng: float = Query(73.1560, description="Observer Longitude"),
    alt: float = Query(540.0, description="Observer Altitude"),
    mask: float = Query(10.0, description="Elevation mask angle"),
    system: str = Query("ALL", description="Constellation filter"),
    time_str: Optional[str] = Query(None, alias="time", description="ISO timestamp"),
    window_hours: float = Query(6.0, ge=1.0, le=24.0, description="Pass window hours (± window)")
):
    """Compute upcoming and current satellite passes (AOS, Max Elevation, LOS) for an observer point."""
    dt = parse_timestamp(time_str)
    start_time = dt - datetime.timedelta(hours=window_hours)
    end_time = dt + datetime.timedelta(hours=window_hours)

    passes = []

    for sat_data in state.satellites_cache:
        const = get_constellation(sat_data["name"])
        if system != "ALL" and const != system:
            continue

        try:
            satrec = Satrec.twoline2rv(sat_data["line1"], sat_data["line2"])
            prn = get_prn(sat_data["name"], satrec.satnum)

            step_sec = 120
            t_curr = start_time
            in_pass = False
            pass_start = None
            max_el = -90.0
            max_el_time = None
            az_aos = None
            az_los = None

            while t_curr <= end_time:
                jd, fr = jday(t_curr.year, t_curr.month, t_curr.day, t_curr.hour, t_curr.minute, t_curr.second)
                prop = propagate_satellite(satrec, jd, fr, lat, lng, alt)

                if prop and prop["elevation"] >= mask:
                    if not in_pass:
                        in_pass = True
                        pass_start = t_curr
                        az_aos = round(prop["azimuth"], 1)
                        max_el = prop["elevation"]
                        max_el_time = t_curr
                    else:
                        if prop["elevation"] > max_el:
                            max_el = prop["elevation"]
                            max_el_time = t_curr
                    az_los = round(prop["azimuth"], 1)
                else:
                    if in_pass:
                        duration_mins = round((t_curr - pass_start).total_seconds() / 60.0)
                        if duration_mins >= 3 and max_el >= mask:
                            passes.append({
                                "name": sat_data["name"],
                                "prn": prn,
                                "constellation": const,
                                "aos": pass_start.strftime("%H:%M"),
                                "aos_iso": pass_start.isoformat(),
                                "los": t_curr.strftime("%H:%M"),
                                "los_iso": t_curr.isoformat(),
                                "max_el": round(max_el, 1),
                                "max_el_time": max_el_time.strftime("%H:%M"),
                                "duration_mins": duration_mins,
                                "azimuth_aos": az_aos,
                                "azimuth_los": az_los
                            })
                        in_pass = False
                        max_el = -90.0

                t_curr += datetime.timedelta(seconds=step_sec)

            if in_pass and pass_start:
                duration_mins = round((end_time - pass_start).total_seconds() / 60.0)
                if duration_mins >= 3 and max_el >= mask:
                    passes.append({
                        "name": sat_data["name"],
                        "prn": prn,
                        "constellation": const,
                        "aos": pass_start.strftime("%H:%M"),
                        "aos_iso": pass_start.isoformat(),
                        "los": end_time.strftime("%H:%M"),
                        "los_iso": end_time.isoformat(),
                        "max_el": round(max_el, 1),
                        "max_el_time": max_el_time.strftime("%H:%M") if max_el_time else pass_start.strftime("%H:%M"),
                        "duration_mins": duration_mins,
                        "azimuth_aos": az_aos,
                        "azimuth_los": az_los
                    })

        except Exception:
            continue

    passes.sort(key=lambda x: x["aos_iso"])
    return {
        "timestamp": dt.isoformat(),
        "observer": {"lat": lat, "lng": lng, "alt": alt, "mask": mask},
        "system": system,
        "count": len(passes),
        "passes": passes
    }


@router.get("/analytics-24h")
def get_analytics_24h(
    lat: float = Query(33.6560, description="Observer Latitude"),
    lng: float = Query(73.1560, description="Observer Longitude"),
    alt: float = Query(540.0, description="Observer Altitude"),
    mask: float = Query(10.0, description="Elevation mask angle"),
    time_str: Optional[str] = Query(None, alias="time", description="ISO timestamp")
):
    """Generate 24-hour analytical trend data (visibility, PDOP, Multi-GNSS comparison) centered around timestamp."""
    dt = parse_timestamp(time_str)
    start_time = dt - datetime.timedelta(hours=12)
    step = datetime.timedelta(minutes=30)
    num_samples = 48

    times = []
    total_visible = []
    pdop_series = []
    constellation_series = {"GPS": [], "Galileo": [], "BeiDou": [], "GLONASS": [], "NavIC": [], "QZSS": [], "SBAS": []}

    satrecs = []
    for sat_data in state.satellites_cache:
        try:
            satrecs.append({
                "satrec": Satrec.twoline2rv(sat_data["line1"], sat_data["line2"]),
                "constellation": get_constellation(sat_data["name"])
            })
        except Exception:
            continue

    system_stats = {
        c: {"total_elev": 0.0, "elev_count": 0} for c in ["GPS", "Galileo", "BeiDou", "GLONASS", "NavIC", "QZSS", "SBAS"]
    }
    all_visible_props = []

    for i in range(num_samples + 1):
        t_sample = start_time + step * i
        jd, fr = jday(t_sample.year, t_sample.month, t_sample.day, t_sample.hour, t_sample.minute, t_sample.second)
        times.append(t_sample.strftime("%H:%M"))

        vis_props = []
        counts = {c: 0 for c in constellation_series.keys()}

        for item in satrecs:
            try:
                prop = propagate_satellite(item["satrec"], jd, fr, lat, lng, alt)
                if prop and prop["elevation"] >= mask:
                    vis_props.append(prop)
                    c = item["constellation"]
                    if c in counts:
                        counts[c] += 1
                        system_stats[c]["total_elev"] += prop["elevation"]
                        system_stats[c]["elev_count"] += 1
            except Exception:
                continue

        total_vis = len(vis_props)
        total_visible.append(total_vis)
        dop = compute_dop(vis_props)
        pdop_val = round(dop["pdop"], 2) if dop["pdop"] < 20 else 20.0
        pdop_series.append(pdop_val)

        for c in constellation_series.keys():
            constellation_series[c].append(counts[c])

        if i == num_samples // 2:
            all_visible_props = vis_props

    multi_gnss_table = []
    sum_all_elev = 0.0
    sum_all_count = 0

    for c, stats in system_stats.items():
        vis_count = constellation_series[c][num_samples // 2]
        avg_elev = round(stats["total_elev"] / stats["elev_count"], 1) if stats["elev_count"] > 0 else 0.0
        c_props = [p for p in all_visible_props if get_constellation(p.get("name", "")) == c]
        c_dop = compute_dop(c_props)
        c_pdop = round(c_dop["pdop"], 1) if c_dop["pdop"] < 30 else 30.0

        multi_gnss_table.append({
            "system": c,
            "visible": vis_count,
            "avg_elev": avg_elev,
            "pdop": c_pdop
        })

        sum_all_elev += stats["total_elev"]
        sum_all_count += stats["elev_count"]

    overall_dop = compute_dop(all_visible_props)
    overall_pdop = round(overall_dop["pdop"], 1) if overall_dop["pdop"] < 30 else 30.0
    overall_avg_elev = round(sum_all_elev / sum_all_count, 1) if sum_all_count > 0 else 0.0

    multi_gnss_table.append({
        "system": "Multi-GNSS",
        "visible": len(all_visible_props),
        "avg_elev": overall_avg_elev,
        "pdop": overall_pdop
    })

    return {
        "timestamp": dt.isoformat(),
        "observer": {"lat": lat, "lng": lng, "alt": alt, "mask": mask},
        "times": times,
        "total_visible": total_visible,
        "pdop_series": pdop_series,
        "constellation_series": constellation_series,
        "comparison_table": multi_gnss_table
    }
