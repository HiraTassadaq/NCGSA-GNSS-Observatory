"""
One-off diagnostic script -- run this manually, once, to discover the
structure of the third-party Supabase TABLE that holds NAV file data
(as opposed to Storage, which we've ruled out).

READ-ONLY: only .select() calls are made. Nothing is inserted, updated,
or deleted.

Usage:
    1. Fill in TABLE_NAMES_TO_TRY below with your best guesses (or the
       real name if they gave it to you).
    2. python explore_third_party_table.py
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

# Fill in any guesses you have here. If they told you the real name, put
# just that one in the list.
TABLE_NAMES_TO_TRY = [
    "nav_files",
    "nav",
    "nav_archive",
    "gnss_nav",
    "brdc_nav",
    "navigation_files",
]

for table_name in TABLE_NAMES_TO_TRY:
    print("=" * 60)
    print(f"Trying table: '{table_name}'")
    print("=" * 60)
    try:
        res = client.table(table_name).select("*").limit(3).execute()
        rows = res.data
        if not rows:
            print("  Table exists but returned 0 rows (or RLS is hiding them).")
            continue

        print(f"  SUCCESS -- found {len(rows)} sample row(s). Columns:")
        print(f"  {list(rows[0].keys())}")
        print("\n  Sample row (values truncated to 200 chars each):")
        for key, value in rows[0].items():
            val_str = str(value)
            if len(val_str) > 200:
                val_str = val_str[:200] + "...(truncated)"
            print(f"    {key}: {val_str}")

    except Exception as e:
        print(f"  Not found / error: {e}")
    print()

print("If none of the guesses worked, ask the third party directly for the "
      "exact table name, add it to TABLE_NAMES_TO_TRY, and re-run.")
print("Once we see real column names, tell me: which column holds the actual "
      "NAV file content (or a URL to it), and which column(s) represent the "
      "observation date/DOY -- I'll wire sync_local_archive.py to match.")