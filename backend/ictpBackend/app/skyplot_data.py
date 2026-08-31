"""
Step 3 (updated): combine a REAL obs session with the REAL nav file to
compute elevation/azimuth for every satellite that session actually
tracked, at real times across the session -- this is the data a sky
plot would draw.

Still standalone: doesn't touch pipeline.py, main.py, database.py, or
anything currently working.

Coverage: ALL satellite systems now supported --
  - GPS, Galileo, BeiDou, QZSS, IRNSS: Kepler orbital elements
    (satellite_position.py)
  - GLONASS: RK4 numerical integration (glonass_sbas_position.py)
  - SBAS: Taylor-series extrapolation (glonass_sbas_position.py)
"""
from datetime import timedelta
from collections import defaultdict

from app.parser import parse_rinex_file
from app.nav_parser import parse_nav_file
from app.satellite_position import satellite_ecef_position, elevation_azimuth
from app.glonass_sbas_position import glonass_ecef_position, sbas_ecef_position

KEPLER_SYSTEMS = {"G", "E", "C", "J", "I"}
GLONASS_SYSTEM = {"R"}
SBAS_SYSTEM = {"S"}
SYS_LETTER_TO_NAME = {"G": "GPS", "E": "Galileo", "C": "BeiDou", "R": "GLONASS",
                       "S": "SBAS", "J": "QZSS", "I": "IRNSS"}


def nearest_nav_record(nav_records_for_prn, target_time):
    """Pick the broadcast record whose reference epoch is closest to target_time
    (satellites broadcast a fresh set of elements roughly every ~2 hours;
    using the nearest one is the standard approach)."""
    if not nav_records_for_prn:
        return None
    return min(nav_records_for_prn, key=lambda r: abs((r["epoch"] - target_time).total_seconds()))


def compute_skyplot_data(obs_path: str, nav_path: str, sample_every_minutes: int = 5):
    """
    Returns a list of rows: {prn, system, time, elevation_deg, azimuth_deg}
    for every satellite the obs session tracked (ALL systems now), sampled
    every `sample_every_minutes` across the session.
    Also returns a summary dict with counts/skip reasons.
    """
    obs_result = parse_rinex_file(obs_path)
    nav_data = parse_nav_file(nav_path)

    station_ecef = (obs_result["meta"]["x"], obs_result["meta"]["y"], obs_result["meta"]["z"])
    tracked_prns = sorted(set(s["prn"] for s in obs_result["satellites"]))

    if not obs_result["epochs"]:
        return [], {"error": "no epochs in obs file"}

    start_time = obs_result["epochs"][0]["time"]
    end_time = obs_result["epochs"][-1]["time"]

    sample_times = []
    t = start_time
    while t <= end_time:
        sample_times.append(t)
        t += timedelta(minutes=sample_every_minutes)

    rows = []
    skipped_no_nav = []
    skipped_unknown_system = []

    for prn in tracked_prns:
        sys = prn[0]
        if sys not in (KEPLER_SYSTEMS | GLONASS_SYSTEM | SBAS_SYSTEM):
            skipped_unknown_system.append(prn)
            continue
        nav_records = nav_data.get(sys, [])
        prn_records = [r for r in nav_records if r["prn"] == prn]
        if not prn_records:
            skipped_no_nav.append(prn)
            continue

        for t in sample_times:
            rec = nearest_nav_record(prn_records, t)
            if sys in KEPLER_SYSTEMS:
                pos = satellite_ecef_position(rec, t)
            elif sys in GLONASS_SYSTEM:
                pos = glonass_ecef_position(rec, t)
            else:  # SBAS
                pos = sbas_ecef_position(rec, t)
            if pos is None:
                continue
            elev, az = elevation_azimuth(pos, station_ecef)
            rows.append({
              "prn": prn, "system": SYS_LETTER_TO_NAME[sys], "time": t,
              "elevation_deg": round(elev, 2), "azimuth_deg": round(az, 2),
              "x": float(pos[0]), "y": float(pos[1]), "z": float(pos[2])
          })

    summary = {
        "station": obs_result["meta"].get("marker"),
        "session_start": start_time, "session_end": end_time,
        "sample_interval_minutes": sample_every_minutes,
        "tracked_satellites_total": len(tracked_prns),
        "computed_satellites": len(set(r["prn"] for r in rows)),
        "computed_points": len(rows),
        "skipped_no_matching_nav_record": skipped_no_nav,
        "skipped_unknown_system": skipped_unknown_system,
    }
    return rows, summary


if __name__ == "__main__":
    OBS_PATH = "obs/GRAL00PAK_R_20262040600_01H_01S_MO.rnx"
    NAV_PATH = "nav/BRDM00DLR_S_20262040000_01D_MN.rnx"

    rows, summary = compute_skyplot_data(OBS_PATH, NAV_PATH, sample_every_minutes=10)

    print("=== Summary ===")
    for k, v in summary.items():
        print(f"  {k}: {v}")

    print(f"\n=== Sample of computed points (first 15 of {len(rows)}) ===")
    for r in rows[:15]:
        print(f"  {r['prn']} ({r['system']:7s}) {r['time']}  elev={r['elevation_deg']:>7.2f}  az={r['azimuth_deg']:>7.2f}")

    print(f"\n=== One satellite's full path across the session (first tracked Kepler-system PRN) ===")
    if rows:
        first_prn = rows[0]["prn"]
        for r in rows:
            if r["prn"] == first_prn:
                print(f"  {r['time'].strftime('%H:%M')}  elev={r['elevation_deg']:>7.2f}  az={r['azimuth_deg']:>7.2f}")
