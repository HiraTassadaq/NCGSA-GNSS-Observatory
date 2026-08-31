"""
Handles temporary cloud storage and local file retention logic.
Local files are kept for processing and automatically managed (rotated/deleted when new files arrive),
while lightweight API/telemetry snapshots or temporary files are synced with the cloud bucket
and cleaned up to maintain safety buffers without impacting storage limits.
"""
import os
import time

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
SUPABASE_BUCKET = os.environ.get("SUPABASE_BUCKET", "gnss-files")

_client = None


def _get_client():
    global _client
    if _client is not None:
        return _client
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return None
    from supabase import create_client
    _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _client


def upload_file(local_path: str, remote_path: str) -> str | None:
    """
    Uploads a navigation or snapshot file to the Supabase Storage bucket 
    as a temporary safety buffer.
    """
    client = _get_client()
    if client is None:
        print(f"  [cloud_storage] SUPABASE_URL/SUPABASE_SERVICE_KEY not set -- "
              f"skipping upload of {os.path.basename(local_path)}")
        return None

    try:
        with open(local_path, "rb") as f:
            data = f.read()
        client.storage.from_(SUPABASE_BUCKET).upload(
            path=remote_path,
            file=data,
            file_options={"upsert": "true"},
        )
        print(f"  [cloud_storage] uploaded file to cloud buffer: {remote_path}")
        return remote_path
    except Exception as e:
        print(f"  [cloud_storage] ERROR uploading {local_path}: {e}")
        return None


def download_file(remote_path: str, local_path: str) -> str | None:
    """Downloads a file from the Supabase Storage bucket on demand."""
    client = _get_client()
    if client is None:
        return None

    try:
        data = client.storage.from_(SUPABASE_BUCKET).download(remote_path)
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        with open(local_path, "wb") as f:
            f.write(data)
        print(f"  [cloud_storage] downloaded {remote_path}")
        return local_path
    except Exception as e:
        print(f"  [cloud_storage] ERROR downloading {remote_path}: {e}")
        return None


def delete_local_file(local_path: str):
    """Deletes local files when a newer interval/file replaces them."""
    try:
        if os.path.exists(local_path):
            os.remove(local_path)
            print(f"  [cleanup] rotated/deleted local file: {os.path.basename(local_path)}")
    except OSError as e:
        print(f"  [cleanup] could not delete {local_path}: {e}")


def delete_remote_file(file_path: str):
    """Deletes old snapshots or files from Supabase storage to maintain the 2-hour window limit."""
    client = _get_client()
    if client is None:
        return
    try:
        client.storage.from_(SUPABASE_BUCKET).remove([file_path])
        print(f"  [cloud_storage] purged expired remote file/snapshot: {file_path}")
    except Exception as e:
        print(f"Error deleting remote file: {e}")