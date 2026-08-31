"""
Pulls sample rows from EVERY table you saw listed in the third-party
Supabase project, so we can check all of them in one pass for anything
resembling real broadcast ephemeris (satellite clock bias/drift, orbital
parameters) rather than just receiver-computed fixes.

READ-ONLY: only .select() calls are made.

Usage:
    python explore_all_tables.py
"""

import os
import json
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

URL = os.environ.get("THIRD_PARTY_SUPABASE_URL")
KEY = os.environ.get("THIRD_PARTY_SUPABASE_KEY")

if not URL or not KEY:
    raise SystemExit("Set THIRD_PARTY_SUPABASE_URL and THIRD_PARTY_SUPABASE_KEY in your .env first.")

client = create_client(URL, KEY)

# Every table name visible in the dashboard screenshot.
TABLES = [
    "gnss_history",
    "gnss_live",
    "gnss_satellite_history",
    "mon_hw_history",
    "mon_rf_history",
    "nav_clock_history",
    "nav_sig_history",
    "nav_status_history",
    "navigation",
    "observation",
    "rxm_rawx_history",
]

# Columns to look for that would indicate REAL ephemeris (not just a
# position fix). If any of these show up, flag it loudly.
EPHEMERIS_HINT_KEYWORDS = [
    "eccentric", "inclination", "sqrt_a", "sqrta", "mean_anomaly",
    "clock_bias", "clock_drift", "af0", "af1", "af2", "toe", "iode",
    "omega", "crs", "crc", "cus", "cuc", "cis", "cic", "subframe",
    "ephemeris", "broadcast",
]

summary = []

for table_name in TABLES:
    print("=" * 70)
    print(f"TABLE: {table_name}")
    print("=" * 70)
    try:
        res = client.table(table_name).select("*").limit(2).execute()
        rows = res.data
        if not rows:
            print("  (no rows returned -- table empty or RLS hiding them, but exists)\n")
            summary.append((table_name, "empty/no-access", []))
            continue

        columns = list(rows[0].keys())
        print(f"  Columns: {columns}\n")
        print("  Sample row (truncated):")
        for key, value in rows[0].items():
            val_str = str(value)
            if len(val_str) > 150:
                val_str = val_str[:150] + "...(truncated)"
            print(f"    {key}: {val_str}")

        # Check for ephemeris-like column names
        hits = [c for c in columns if any(kw in c.lower() for kw in EPHEMERIS_HINT_KEYWORDS)]
        if hits:
            print(f"\n  *** POSSIBLE EPHEMERIS COLUMNS FOUND: {hits} ***")
            summary.append((table_name, "POSSIBLE EPHEMERIS", hits))
        else:
            summary.append((table_name, "no ephemeris-like columns", columns))

    except Exception as e:
        print(f"  Error / not accessible: {e}")
        summary.append((table_name, f"error: {e}", []))
    print()

print("=" * 70)
print("SUMMARY")
print("=" * 70)
for table_name, status, extra in summary:
    print(f"  {table_name:30s} -> {status}")

print("\nLook for any 'POSSIBLE EPHEMERIS' lines above -- that's the table "
      "to investigate further. If none show up, none of these tables "
      "contain real broadcast ephemeris.")