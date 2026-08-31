"""
Live Septentrio SBF reader -> Supabase (Postgres + Realtime).

Decodes the live SBF stream via pysbf2, reshapes the per-satellite
repeating fields (e.g. 'Azimuth_01', 'Azimuth_02', ...) into a clean
JSON 'satellites' array, and inserts each decoded block as one row
into a single Supabase table. Old rows are periodically deleted so
storage doesn't grow unbounded.

CHANGES FROM THE ORIGINAL VERSION:
  - reshape_repeating_groups() now MERGES nested sub-records (e.g.
    ChannelStatus's per-channel "SigInfo" sub-block) into the same
    per-channel dict as a "signals" list, instead of letting them land
    as separate array entries. Previously, a block reporting 77 real
    channels produced ~150 "satellites" array entries (SatInfo +
    SigInfo interleaved), which inflated every downstream count.
  - Added "MeasEpoch" to BLOCKS_OF_INTEREST / REPEATING_BLOCKS -- this
    is the block that actually carries CN0. ChannelStatus does NOT
    carry CN0, despite an earlier incorrect assumption; MeasEpoch does.
  - Added "GEOIGPMask" (MT18, the real ionospheric grid point mask) so
    the ionospheric delay map can place grid points exactly instead of
    approximating.

Secrets (SUPABASE_URL, SUPABASE_SERVICE_KEY) are loaded from a ".env"
file in the same folder -- copy ".env.example" to ".env" and fill in
your real values before running this.

Install dependencies first (or just: pip install -r requirements.txt):
    pip install pysbf2 pyserial pandas openpyxl supabase python-dotenv

Usage:
    python live_sbf_reader_supabase.py
    (Ctrl+C to stop)
"""

import os
import re
import sys
import time
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from serial import Serial
from pysbf2 import SBFReader, SBF_PROTOCOL
from supabase import create_client

# ============================== CONFIG ==============================
PORT = "COM6"           # replace with port_finder.find_septentrio_port() if desired
BAUD = 115200

TABLE_NAME = "gnss_live_data"

# how often (seconds) to delete rows older than RETENTION_MINUTES
CLEANUP_INTERVAL_SECONDS = 30
RETENTION_MINUTES = 10

# also keep a local backup copy on disk, same as before (optional but recommended)
OUTPUT_DIR = "gnss_live_data"
KEEP_LOCAL_BACKUP = True

BLOCKS_OF_INTEREST = {
    "SatVisibility",
    "ChannelStatus",
    "GEOIonoDelay",
    "GEOIGPMask",  # MT18 -- the real IGP band mask, lets the frontend place ionospheric grid points exactly instead of approximating
    "PVTGeodetic",
    "ReceiverStatus",
    "ReceiverTime",
    "DOP",
    "MeasEpoch",  # carries CN0 -- ChannelStatus does NOT, despite earlier assumption
    "GPSNav",     # broadcast ephemeris -- needed for orbit propagation (3D globe)
}

# blocks that contain per-satellite / per-IGP repeating fields
# (numbered suffixes like _01, _02, ... and sometimes _01_01 for sub-groups)
REPEATING_BLOCKS = {"SatVisibility", "ChannelStatus", "GEOIonoDelay", "GEOIGPMask", "MeasEpoch"}
# ======================================================================

# --- load secrets from .env ---
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("ERROR: SUPABASE_URL / SUPABASE_SERVICE_KEY not found.")
    print("Copy .env.example to .env and fill in your real values first.")
    sys.exit(1)

os.makedirs(OUTPUT_DIR, exist_ok=True)
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

_block_rows = {}  # kept for the optional local xlsx backup

_SUFFIX_RE = re.compile(r"^(.*?)_(\d{2})(?:_(\d{2}))?$")


def flatten_message(msg):
    return {k: v for k, v in vars(msg).items() if not k.startswith("_")}


def reshape_repeating_groups(row):
    """
    Turn pysbf2's flat 'FieldName_01', 'FieldName_02', ... keys into a
    clean 'satellites' list of per-entry dicts.

    IMPORTANT: some SBF blocks (ChannelStatus, MeasEpoch) nest a variable
    number of sub-records per channel (e.g. one entry per tracked
    frequency). These show up as keys like 'CN0_01_01', 'CN0_01_02' --
    same primary index (01) as the parent channel, with a second index
    for which sub-record. Those must be MERGED into the same channel's
    dict (as a "signals" list), not left as separate top-level entries --
    otherwise a block reporting N real channels produces up to 2N+ array
    entries, corrupting every downstream count.
    """
    groups = {}  # primary idx -> merged dict, with "_signals" holding sub-records
    scalars = {}

    for key, value in row.items():
        m = _SUFFIX_RE.match(key)
        if m:
            base, idx1, idx2 = m.groups()
            entry = groups.setdefault(idx1, {})
            if idx2:
                sub = entry.setdefault("_signals", {}).setdefault(idx2, {})
                sub[base] = value
            else:
                entry[base] = value
        else:
            scalars[key] = value

    entries = []
    for idx in sorted(groups.keys()):
        entry = groups[idx]
        if "_signals" in entry:
            entry["signals"] = [entry["_signals"][k] for k in sorted(entry["_signals"].keys())]
            del entry["_signals"]
        entries.append(entry)

    scalars["satellites"] = entries
    return scalars


def push_to_supabase(ident, row):
    reshaped = reshape_repeating_groups(row) if ident in REPEATING_BLOCKS else dict(row)

    # SatVisibility stores Azimuth/Elevation in hundredths of a degree
    if ident == "SatVisibility":
        for sat in reshaped.get("satellites", []):
            if "Azimuth" in sat:
                sat["Azimuth"] = sat["Azimuth"] / 100.0
            if "Elevation" in sat:
                sat["Elevation"] = sat["Elevation"] / 100.0

    logged_at = reshaped.pop("_logged_at_utc", None)
    tow = reshaped.get("TOW")
    wnc = reshaped.get("WNc")

    try:
        supabase.table(TABLE_NAME).insert({
            "block": ident,
            "tow": tow,
            "wnc": wnc,
            "logged_at": logged_at,
            "payload": reshaped,
        }).execute()
    except Exception as e:
        print(f"[Supabase insert failed for {ident}]: {e}")


def cleanup_old_rows():
    cutoff = (datetime.now(timezone.utc) - timedelta(minutes=RETENTION_MINUTES)).isoformat()
    try:
        supabase.table(TABLE_NAME).delete().lt("logged_at", cutoff).execute()
        print(f"[Cleanup] deleted rows older than {RETENTION_MINUTES} min")
    except Exception as e:
        print(f"[Cleanup failed]: {e}")


def main():
    print(f"Opening {PORT} @ {BAUD} baud ... (Ctrl+C to stop)")
    last_cleanup = time.time()

    with Serial(PORT, BAUD, timeout=3) as stream:
        reader = SBFReader(stream, protfilter=SBF_PROTOCOL)
        try:
            for raw_data, msg in reader:
                if msg is None:
                    continue
                ident = msg.identity
                if ident not in BLOCKS_OF_INTEREST:
                    continue

                row = flatten_message(msg)
                row["_logged_at_utc"] = datetime.now(timezone.utc).isoformat()

                print(f"[{ident}] TOW={row.get('TOW')}")

                push_to_supabase(ident, row)

                if KEEP_LOCAL_BACKUP:
                    _block_rows.setdefault(ident, []).append(row)

                if time.time() - last_cleanup > CLEANUP_INTERVAL_SECONDS:
                    cleanup_old_rows()
                    last_cleanup = time.time()

        except KeyboardInterrupt:
            print("\nStopped by user.")

    if KEEP_LOCAL_BACKUP and _block_rows:
        try:
            import pandas as pd
            excel_path = os.path.join(OUTPUT_DIR, "gnss_live_dashboard.xlsx")
            with pd.ExcelWriter(excel_path) as writer:
                for ident, rows in _block_rows.items():
                    df = pd.DataFrame(rows)
                    df.to_csv(os.path.join(OUTPUT_DIR, f"{ident}.csv"), index=False)
                    df.to_excel(writer, sheet_name=ident[:31], index=False)
            print(f"\nLocal backup written to: {excel_path}")
        except ImportError:
            print("Install pandas + openpyxl for the optional local backup.")


if __name__ == "__main__":
    main()