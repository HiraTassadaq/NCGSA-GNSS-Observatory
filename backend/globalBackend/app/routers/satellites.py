import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from sgp4.api import Satrec, jday

from app import state
from app.orbits import (
    propagate_satellite, get_doppler, estimate_tec_and_delay,
    simulate_snr, get_constellation, get_prn, compute_dop,
    get_satellite_health
)

router = APIRouter(prefix="/api")

@router.get("/visible-satellites")
def get_visible_satellites(
    lat: float = Query(..., description="Observer Latitude (degrees)"),
    lng: float = Query(..., description="Observer Longitude (degrees)"),
    alt: float = Query(0.0, description="Observer Altitude (meters)"),
    mask: float = Query(10.0, description="Elevation Mask Angle (degrees)"),
    time: Optional[str] = Query(None, description="ISO timestamp (defaults to current server time)")
):
    """Calculate visible satellites and relevant GNSS parameters."""
    if time:
        try:
            dt = datetime.datetime.fromisoformat(time.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid ISO timestamp format.")
    else:
        dt = datetime.datetime.now(datetime.timezone.utc)

    jd, fr = jday(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second + dt.microsecond / 1e6)
    all_sats = []
    summary = {"total_visible": 0, "GPS": 0, "GLONASS": 0, "Galileo": 0, "BeiDou": 0, "IRNSS": 0, "QZSS": 0, "SBAS": 0, "Other": 0}
    # Total tracked catalog size per constellation, independent of visibility/elevation mask.
    total_catalog = {"GPS": 0, "GLONASS": 0, "Galileo": 0, "BeiDou": 0, "IRNSS": 0, "QZSS": 0, "SBAS": 0, "Other": 0}
    health_counts = {"active": 0, "standby": 0, "inactive": 0, "unknown": 0}

    for sat_data in state.satellites_cache:
        try:
            satrec = Satrec.twoline2rv(sat_data["line1"], sat_data["line2"])
            prop = propagate_satellite(satrec, jd, fr, lat, lng, alt)
            if prop:
                const = get_constellation(sat_data["name"])
                is_visible = prop["elevation"] >= mask
                total_catalog[const] = total_catalog.get(const, 0) + 1
                health = get_satellite_health(satrec.satnum)
                health_counts[health["status"]] = health_counts.get(health["status"], 0) + 1

                all_sats.append({
                    "name": sat_data["name"], "catalog_number": satrec.satnum,
                    "prn": get_prn(sat_data["name"], satrec.satnum), "constellation": const,
                    "elevation": round(prop["elevation"], 2), "azimuth": round(prop["azimuth"], 2),
                    "range_km": round(prop["range"] / 1000.0, 2), "range_rate_ms": round(prop["range_rate"], 2),
                    "sat_lat": round(prop["sat_lat"], 5), "sat_lng": round(prop["sat_lng"], 5),
                    "sat_alt_km": round(prop["sat_alt"] / 1000.0, 2),
                    "snr": simulate_snr(prop["elevation"]),
                    "doppler": get_doppler(prop["range_rate"], const),
                    "tec": estimate_tec_and_delay(lat, lng, prop["elevation"], dt),
                    "visible": is_visible,
                    # Real operational health/status, independent of "visible" (which is purely
                    # geometric/elevation-based). See app/orbits/health.py.
                    "health": health
                })
                if is_visible:
                    summary[const] += 1
                    summary["total_visible"] += 1
        except Exception:
            continue

    all_sats.sort(key=lambda x: (x["visible"], x["elevation"]), reverse=True)
    dop = compute_dop([s for s in all_sats if s["visible"]])

    gps_epoch = datetime.datetime(1980, 1, 6, tzinfo=datetime.timezone.utc)
    diff = dt - gps_epoch
    gps_week = diff.days // 7
    gps_tow = (diff.days % 7) * 86400 + diff.seconds + diff.microseconds / 1e6

    # Leap seconds: GPS-UTC offset (currently 18 as of 2017+; update on next leap event)
    LEAP_SECONDS = 18

    return {
        "timestamp": dt.isoformat(),
        "gps_time": {"week": gps_week, "tow": round(gps_tow, 2), "leap_seconds": LEAP_SECONDS},
        "observer": {"lat": lat, "lng": lng, "alt": alt, "mask": mask},
        "satellites": all_sats, "dop": dop, "summary": summary,
        "total_catalog": total_catalog,
        "health_summary": health_counts
    }

@router.get("/time-series")
def get_time_series(
    lat: float = Query(..., description="Observer Latitude (degrees)"),
    lng: float = Query(..., description="Observer Longitude (degrees)"),
    alt: float = Query(0.0, description="Observer Altitude (meters)"),
    mask: float = Query(10.0, description="Elevation Mask Angle (degrees)")
):
    """Generate a trailing 2-hour HISTORICAL time-series (not a forecast) of GNSS
    parameters, ending at the current server time. Every call recomputes the
    window relative to "now", so it naturally slides forward each time it's
    fetched: called at 12:46 it covers ~10:46-12:46, called later at 14:46 it
    covers ~12:46-14:46. Positions are reconstructed from the current TLE set
    for real past instants, not propagated forward into the future."""
    now_dt = datetime.datetime.now(datetime.timezone.utc)
    WINDOW_HOURS = 2
    NUM_SAMPLES = 24  # 5-minute resolution across the 2-hour window
    window_start = now_dt - datetime.timedelta(hours=WINDOW_HOURS)
    step = datetime.timedelta(hours=WINDOW_HOURS) / NUM_SAMPLES

    # 1. Identify which satellites are visible right now, to choose 8 representative ones to trace
    jd, fr = jday(now_dt.year, now_dt.month, now_dt.day, now_dt.hour, now_dt.minute, now_dt.second)
    initial_sats = []
    
    for sat_data in state.satellites_cache:
        try:
            satrec = Satrec.twoline2rv(sat_data["line1"], sat_data["line2"])
            prop = propagate_satellite(satrec, jd, fr, lat, lng, alt)
            if prop:
                const = get_constellation(sat_data["name"])
                initial_sats.append({
                    "name": sat_data["name"],
                    "prn": get_prn(sat_data["name"], satrec.satnum),
                    "constellation": const,
                    "elevation": prop["elevation"],
                    "sat_alt_km": prop["sat_alt"] / 1000.0,
                    "sat_data": sat_data
                })
        except:
            continue
            
    initial_sats.sort(key=lambda x: x["elevation"], reverse=True)
    tracked_sats_info = []
    const_counts = {}
    
    # Pick a diverse mix from different constellations
    for sat in initial_sats:
        c = sat["constellation"]
        const_counts[c] = const_counts.get(c, 0) + 1
        if const_counts[c] <= 2 and len(tracked_sats_info) < 8:
            tracked_sats_info.append(sat)
            
    # Fallback to fill 8 satellites
    if len(tracked_sats_info) < 8 and len(initial_sats) > len(tracked_sats_info):
        for sat in initial_sats:
            if sat not in tracked_sats_info and len(tracked_sats_info) < 8:
                tracked_sats_info.append(sat)
                
    # If still empty, grab first 8 from cache
    if len(tracked_sats_info) == 0:
        for sat_data in state.satellites_cache[:8]:
            const = get_constellation(sat_data["name"])
            tracked_sats_info.append({
                "name": sat_data["name"],
                "prn": sat_data["name"][:6],
                "constellation": const,
                "sat_data": sat_data
            })

    # Prepare time-series structures
    times = []
    num_satellites_data = []
    dop_data = []
    tec_data = []
    satellite_paths = {sat["prn"]: {"constellation": sat["constellation"], "elevations": [], "altitudes": []} for sat in tracked_sats_info}

    # Step through the trailing 2-hour window, oldest to newest, ending at "now"
    for i in range(NUM_SAMPLES + 1):
        dt = window_start + step * i
        jd, fr = jday(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second)
        
        times.append(dt.strftime("%H:%M"))
        
        # Slant TEC at 45 degree representative elevation for this sample
        sample_tec = estimate_tec_and_delay(lat, lng, 45.0, dt)["vtec"]
        tec_data.append(sample_tec)

        visible_count = 0
        visible_sats_for_dop = []

        # Propagate all cache to get total visible and DOP for this historical instant
        for sat_data in state.satellites_cache:
            try:
                satrec = Satrec.twoline2rv(sat_data["line1"], sat_data["line2"])
                prop = propagate_satellite(satrec, jd, fr, lat, lng, alt)
                if prop:
                    is_visible = prop["elevation"] >= mask
                    if is_visible:
                        visible_count += 1
                        visible_sats_for_dop.append(prop)
            except:
                continue
                
        num_satellites_data.append(visible_count)
        
        # Calculate DOP
        dop = compute_dop(visible_sats_for_dop)
        dop_data.append({
            "gdop": round(dop["gdop"], 2) if dop["gdop"] < 20 else 20,
            "pdop": round(dop["pdop"], 2) if dop["pdop"] < 20 else 20,
            "hdop": round(dop["hdop"], 2) if dop["hdop"] < 20 else 20,
            "vdop": round(dop["vdop"], 2) if dop["vdop"] < 20 else 20,
            "tdop": round(dop["tdop"], 2) if dop["tdop"] < 20 else 20
        })

        # Propagate the 8 selected tracked satellites for this historical instant
        for sat in tracked_sats_info:
            prn = sat["prn"]
            sat_data = sat["sat_data"]
            try:
                satrec = Satrec.twoline2rv(sat_data["line1"], sat_data["line2"])
                prop = propagate_satellite(satrec, jd, fr, lat, lng, alt)
                if prop:
                    satellite_paths[prn]["elevations"].append(round(prop["elevation"], 2))
                    satellite_paths[prn]["altitudes"].append(round(prop["sat_alt"] / 1000.0, 2))
                else:
                    satellite_paths[prn]["elevations"].append(0.0)
                    satellite_paths[prn]["altitudes"].append(20000.0)
            except:
                satellite_paths[prn]["elevations"].append(0.0)
                satellite_paths[prn]["altitudes"].append(20000.0)

    return {
        "window_hours": WINDOW_HOURS,
        "window_start": window_start.isoformat(),
        "window_end": now_dt.isoformat(),
        "times": times,
        "num_satellites": num_satellites_data,
        "dop": dop_data,
        "tec": tec_data,
        "satellite_paths": satellite_paths
    }


@router.post("/update-tles")
def force_update_tles():
    """Trigger manual cache update from CelesTrak."""
    state.satellites_cache = fetch_fresh_tles()
    return {
        "status": "success",
        "updated_satellites_count": len(state.satellites_cache),
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
