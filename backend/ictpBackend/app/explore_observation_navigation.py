"""
Pulls real sample rows from the 'observation' and 'navigation' tables
in the third-party Supabase project, so we can see actual DATA (not
just column names) and judge whether either one is usable as a NAV
or OBS substitute.

READ-ONLY: only .select() calls are made.

Usage:
    python explore_observation_navigation.py
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

TABLES = ["observation", "navigation"]

for table_name in TABLES:
    print("=" * 70)
    print(f"TABLE: {table_name}")
    print("=" * 70)
    try:
        # order by recorded_at desc so we see the most recent (likely
        # real, live) data rather than possibly-stale old test rows
        res = (
            client.table(table_name)
            .select("*")
            .order("recorded_at", desc=True)
            .limit(3)
            .execute()
        )
        rows = res.data
        if not rows:
            print("  No rows returned (table empty, or RLS hiding them).\n")
            continue

        print(f"  Got {len(rows)} row(s). Showing each in full:\n")
        for i, row in enumerate(rows, 1):
            print(f"  --- Row {i} ---")
            print(json.dumps(row, indent=2, default=str))
            print()

    except Exception as e:
        print(f"  Error querying '{table_name}': {e}\n")

print("Done. Share this output (values look fine to share, no secrets here) "
      "and I'll tell you whether either table is usable, and how.")