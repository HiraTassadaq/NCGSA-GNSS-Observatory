"""
One-off diagnostic script -- run this manually, once, to discover:
  1. What buckets exist in the third-party Supabase project
  2. What folder structure / files live inside the relevant bucket

READ-ONLY: only .list() calls are made. Nothing is uploaded, deleted, or modified.

Usage:
    python explore_third_party_supabase.py
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()  # reads THIRD_PARTY_SUPABASE_URL / THIRD_PARTY_SUPABASE_KEY from your .env

URL = os.environ.get("THIRD_PARTY_SUPABASE_URL")
KEY = os.environ.get("THIRD_PARTY_SUPABASE_KEY")

if not URL or not KEY:
    raise SystemExit("Set THIRD_PARTY_SUPABASE_URL and THIRD_PARTY_SUPABASE_KEY in your .env first.")

client = create_client(URL, KEY)

print("=" * 60)
print("STEP 1: Listing all storage buckets in the project...")
print("=" * 60)

try:
    buckets = client.storage.list_buckets()
    if not buckets:
        print("No buckets returned. Either there are none, or this key can't see them.")
    for b in buckets:
        print(f"  - name: {b.name!r}   public: {getattr(b, 'public', 'unknown')}")
except Exception as e:
    print(f"Could not list buckets ({e}).")
    print("This can happen if the key only has scoped access to one bucket "
          "rather than project-wide bucket-listing permission. If so, ask "
          "the third party for the exact bucket name directly, then set "
          "BUCKET_NAME_TO_EXPLORE below and re-run just Step 2.")
    buckets = []

BUCKET_NAME_TO_EXPLORE = None  # e.g. "nav-archive" -- fill in if Step 1 fails

bucket_names = [b.name for b in buckets] if buckets else (
    [BUCKET_NAME_TO_EXPLORE] if BUCKET_NAME_TO_EXPLORE else []
)

if not bucket_names:
    print("\nNo bucket to explore yet -- fill in BUCKET_NAME_TO_EXPLORE and re-run.")

for bucket_name in bucket_names:
    print("\n" + "=" * 60)
    print(f"STEP 2: Exploring top level of bucket '{bucket_name}'...")
    print("=" * 60)
    try:
        top_level = client.storage.from_(bucket_name).list()
        for item in top_level[:25]:
            print(f"  - {item.get('name')}")
        if len(top_level) > 25:
            print(f"  ... and {len(top_level) - 25} more")

        folder_like = [item.get("name") for item in top_level if item.get("id") is None]
        if folder_like:
            sample_folder = folder_like[0]
            print(f"\n  Peeking inside first folder: '{sample_folder}/'...")
            nested = client.storage.from_(bucket_name).list(sample_folder)
            for item in nested[:25]:
                print(f"    - {sample_folder}/{item.get('name')}")

            nested_folder_like = [item.get("name") for item in nested if item.get("id") is None]
            if nested_folder_like:
                deeper = nested_folder_like[0]
                deeper_path = f"{sample_folder}/{deeper}"
                print(f"\n  Peeking one level deeper: '{deeper_path}/'...")
                deepest = client.storage.from_(bucket_name).list(deeper_path)
                for item in deepest[:25]:
                    print(f"      - {deeper_path}/{item.get('name')}")

    except Exception as e:
        print(f"  Could not list contents of '{bucket_name}' ({e}).")

print("\nDone. Use whatever bucket name + folder pattern showed real NAV-looking "
      "filenames (e.g. 'BRDM00DLR_S_...rnx.gz') to fill in THIRD_PARTY_SUPABASE_BUCKET "
      "in your .env, and tell me the folder pattern so I can update remote_path in "
      "sync_local_archive.py to match.")