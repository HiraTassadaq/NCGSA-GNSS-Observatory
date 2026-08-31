"""
Ingestion & Real-Time Processing Job.
Processes incoming RINEX observation and navigation files locally, updates 
the single rolling LiveData table snapshot in the database, clears out older 
local/cloud caches when new files arrive, and broadcasts live updates.
"""
import sys
import os
import glob
from datetime import datetime, timezone
from app.database import init_db, SessionLocal, LiveData, clear_live_data
from app.parser import parse_rinex_file
from app.nav_parser import parse_nav_file
from app.skyplot_data import compute_skyplot_data
from app.dop_calculator import compute_dop
from app.cloud_storage import upload_file, delete_local_file, delete_remote_file
from app.connections import manager
import asyncio
import json


def process_live_snapshot(db, obs_path: str, nav_path: str = None):
    """
    Clears the previous rolling snapshot table and loads a fresh live snapshot
    derived from the active observation and navigation files.
    """
    fname = os.path.basename(obs_path)
    print(f"  [ingest] Processing live snapshot for: {fname}")

    # 1. Parse observation file
    obs_result = parse_rinex_file(obs_path)
    meta = obs_result["meta"]

    # 2. Parse navigation file if available for advanced geometry/skyplot
    nav_data = parse_nav_file(nav_path) if nav_path and os.path.exists(nav_path) else {}
    
    # Extract satellite ECEF positions for DOP calculation if possible
    receiver_pos = (meta.get("x", 0.0), meta.get("y", 0.0), meta.get("z", 0.0))
    
    # 3. Clear old rolling snapshot data from DB
    clear_live_data(db)
    db.commit()

    # 4. Compute skyplot points & metrics
    skyplot_rows, sky_summary = [], {}
    if nav_path and os.path.exists(nav_path):
        skyplot_rows, sky_summary = compute_skyplot_data(obs_path, nav_path, sample_every_minutes=5)

    # Map skyplot points by timestamp & PRN for quick merging
    skyplot_map = {}
    for pt in skyplot_rows:
        key = (pt["prn"], pt["time"])
        skyplot_map[key] = (pt["elevation_deg"], pt["azimuth_deg"])

    # Real per-epoch DOP, computed the same way pipeline.py does it --
    # this used to be a hardcoded placeholder dict that never reflected
    # actual satellite geometry.
    dop_by_time = {}
    if all(receiver_pos):
        positions_by_time = {}
        for pt in skyplot_rows:
            t_key = pt["time"]
            x_val = pt.get("X") if pt.get("X") is not None else pt.get("x")
            y_val = pt.get("Y") if pt.get("Y") is not None else pt.get("y")
            z_val = pt.get("Z") if pt.get("Z") is not None else pt.get("z")
            if x_val is not None and y_val is not None and z_val is not None:
                positions_by_time.setdefault(t_key, []).append((x_val, y_val, z_val))
        for t_key, sats in positions_by_time.items():
            dop_by_time[t_key] = compute_dop(receiver_pos, sats)

    # 5. Insert fresh rolling snapshot rows (Denormalized single table model)
    satellites = obs_result["satellites"]
    epochs = obs_result["epochs"]

    # Build lookup for satellite summaries
    sat_summary_map = {s["prn"]: s for s in satellites}

    inserted_rows_count = 0
    for epoch in epochs:
        t = epoch["time"]
        total_sats = epoch["total"]

        for prn, s_info in sat_summary_map.items():
            elev_az = skyplot_map.get((prn, t), (None, None))
            
            row = LiveData(
                source_file=fname,
                nav_file=os.path.basename(nav_path) if nav_path else None,
                station_marker=meta.get("marker"),
                receiver=meta.get("receiver"),
                antenna=meta.get("antenna"),
                pos_x=receiver_pos[0],
                pos_y=receiver_pos[1],
                pos_z=receiver_pos[2],
                lat_deg=meta.get("lat"),
                lon_deg=meta.get("lon"),
                height_m=meta.get("height"),
                session_start=meta.get("start"),
                session_end=meta.get("end"),
                pdop=dop_by_time.get(t, {}).get("PDOP"),
                vdop=dop_by_time.get(t, {}).get("VDOP"),
                gdop=dop_by_time.get(t, {}).get("GDOP"),
                hdop=dop_by_time.get(t, {}).get("HDOP"),
                tdop=dop_by_time.get(t, {}).get("TDOP"),
                prn=prn,
                system=s_info["system"],
                valid_epochs=s_info.get("valid_epochs"),
                completeness_pct=s_info.get("completeness_pct"),
                avg_snr=s_info.get("avg_snr"),
                cycle_slips=s_info.get("cycle_slips"),
                quality=s_info.get("quality"),
                multipath_mp1=s_info.get("multipath_mp1"),
                multipath_mp2=s_info.get("multipath_mp2"),
                iono_delay_l1=s_info.get("iono_delay_l1"),
                time=t,
                elevation_deg=elev_az[0],
                azimuth_deg=elev_az[1],
                total_sats_at_time=total_sats,
                ingested_at=datetime.now(timezone.utc),
            )
            db.add(row)
            inserted_rows_count += 1

    db.commit()
    print(f"  [ingest] Snapshot updated successfully: {inserted_rows_count} rows loaded into live_data.")

    # 6. Upload lightweight status snapshot / payload summary to cloud temporary buffer (2-hour buffer)
    snapshot_summary = {
        "source_file": fname,
        "marker": meta.get("marker"),
        "total_satellites": len(satellites),
        "total_epochs": len(epochs),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    temp_json_path = "nav_cache/latest_snapshot.json"
    os.makedirs(os.path.dirname(temp_json_path), exist_ok=True)
    with open(temp_json_path, "w") as f:
        json.dump(snapshot_summary, f)
    
    upload_file(temp_json_path, "cache/latest_snapshot.json")
    delete_local_file(temp_json_path)

    return True


def handle_incoming_file(db, new_file_path: str, active_nav_path: str = None):
    """
    Handles rotation: when a new file arrives, older local observation files 
    are cleaned up/rotated, and the new file is processed into the live snapshot.
    """
    if not os.path.exists(new_file_path):
        return

    # Process the live snapshot with the new file
    process_live_snapshot(db, new_file_path, active_nav_path)