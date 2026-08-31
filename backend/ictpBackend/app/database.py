"""
Single-table, real-time database model.

This project uses a rolling LIVE SNAPSHOT model.
Each time a new RINEX observation/navigation pair is processed,
the previous snapshot is deleted and replaced with fresh data.

Database:
    - Supabase PostgreSQL only
"""

import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from dotenv import load_dotenv

# Load .env from gnss_backend/.env
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / ".env"

load_dotenv(ENV_PATH)

print("Loading .env from:", ENV_PATH)
print("Exists:", ENV_PATH.exists())

from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    Float,
    String,
    DateTime,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import declarative_base, sessionmaker

# ---------------------------------------------------------------------
# Database Configuration
# ---------------------------------------------------------------------

DATABASE_URL = os.getenv("DATABASE_URL")
LOCAL_FALLBACK_URL = f"sqlite:///{BASE_DIR / 'gnss.db'}"


def _safe_display_url(url: str) -> str:
    """Same connection target, with the username/password stripped out --
    never print real credentials to the terminal (screenshots, shared
    logs, etc. would otherwise leak the Supabase password in plaintext)."""
    parsed = urlparse(url)
    host_part = parsed.hostname or "?"
    if parsed.port:
        host_part += f":{parsed.port}"
    return f"{parsed.scheme}://***:***@{host_part}{parsed.path}"


def _try_connect(url: str, connect_args: dict):
    """Attempts a real connection, returns the engine on success or None on
    any failure -- never raises. This is what lets us fall back instead of
    crashing the whole app at import time."""
    try:
        eng = create_engine(url, pool_pre_ping=True, connect_args=connect_args)
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        return eng
    except Exception as e:
        print(f"  [database] Could not connect to {_safe_display_url(url)}: {e}")
        return None


engine = None

if DATABASE_URL:
    print("=" * 70)
    print("Trying Supabase PostgreSQL:", _safe_display_url(DATABASE_URL))
    print("=" * 70)
    # Fail fast (5s) instead of hanging indefinitely if Supabase is
    # unreachable/paused/deleted -- we WANT this to fail quickly so we can
    # fall back to local SQLite below rather than blocking startup.
    engine = _try_connect(DATABASE_URL, {"connect_timeout": 5})

if engine is not None:
    print("Successfully connected to Supabase PostgreSQL.")
else:
    # No DATABASE_URL, or Supabase unreachable/paused/deleted -- fall back
    # to a local SQLite file so the backend ALWAYS starts and serves data
    # regardless of internet/Supabase status. This is intentional: the demo
    # must never be blocked by a cloud dependency going down.
    print(f"  [database] Falling back to local SQLite at {LOCAL_FALLBACK_URL}")
    engine = _try_connect(LOCAL_FALLBACK_URL, {"check_same_thread": False})
    if engine is None:
        raise RuntimeError(
            "Could not connect to Supabase AND could not create the local "
            "SQLite fallback database -- check disk permissions."
        )
    print("Using local SQLite database (Supabase unavailable).")

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


# ---------------------------------------------------------------------
# Live Snapshot Table
# ---------------------------------------------------------------------

class LiveData(Base):
    """
    One row per (satellite, sampled time).

    The table is cleared and repopulated whenever a new
    observation/navigation pair finishes processing.
    """

    __tablename__ = "live_data"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # ---------------- Station Metadata ----------------

    source_file = Column(String)
    nav_file = Column(String, nullable=True)

    station_marker = Column(String)
    receiver = Column(String)
    antenna = Column(String)

    pos_x = Column(Float)
    pos_y = Column(Float)
    pos_z = Column(Float)

    lat_deg = Column(Float, nullable=True)
    lon_deg = Column(Float, nullable=True)
    height_m = Column(Float, nullable=True)

    session_start = Column(DateTime)
    session_end = Column(DateTime, nullable=True)

    # ---------------- DOP Metrics ----------------

    pdop = Column(Float, nullable=True)
    vdop = Column(Float, nullable=True)
    gdop = Column(Float, nullable=True)
    hdop = Column(Float, nullable=True)
    tdop = Column(Float, nullable=True)

    # ---------------- Satellite Summary ----------------

    prn = Column(String)
    system = Column(String)

    valid_epochs = Column(Integer, nullable=True)
    completeness_pct = Column(Float, nullable=True)
    avg_snr = Column(Float, nullable=True)

    cycle_slips = Column(Integer, nullable=True)

    quality = Column(String, nullable=True)

    multipath_mp1 = Column(Float, nullable=True)
    multipath_mp2 = Column(Float, nullable=True)

    iono_delay_l1 = Column(Float, nullable=True)

    # ---------------- Skyplot ----------------

    time = Column(DateTime, nullable=True)

    elevation_deg = Column(Float, nullable=True)
    azimuth_deg = Column(Float, nullable=True)

    # ---------------- Satellite ECEF ----------------

    sat_x = Column(Float, nullable=True)
    sat_y = Column(Float, nullable=True)
    sat_z = Column(Float, nullable=True)

    # ---------------- Satellites in View ----------------

    total_sats_at_time = Column(Integer, nullable=True)

    ingested_at = Column(DateTime)


class ProcessedFile(Base):
    """
    Durable record of every OBS/NAV file that has been FULLY processed --
    independent of whether transient copies still exist in incoming/,
    batch/, or processed/. This is the source of truth dedup checks query
    against (sync_local_archive.py's archive-sync loop and pipeline.py's
    process_one_file/process_nav_file), replacing the old "does a copy
    still exist in incoming/" check -- which raced against pipeline.py's
    own post-processing cleanup and caused the same file to be re-downloaded
    and reprocessed on every watch cycle.
    """

    __tablename__ = "processed_files"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Original (pre-decompression) filename -- must match the exact string
    # sync_local_archive.py uses as "latest_file" / nav_filename, since that
    # module never sees the decompressed name.
    filename = Column(String, nullable=False, index=True)
    file_type = Column(String, nullable=False)  # "obs" | "nav"

    source = Column(String, nullable=True)       # "local_archive" | "nasa_cddis" | "supabase_cache" | "local_fallback" | "pipeline"
    remote_path = Column(String, nullable=True)  # Supabase Storage key
    checksum = Column(String, nullable=True)

    status = Column(String, nullable=False, default="success")  # "success" | "failed"
    processed_at = Column(DateTime, nullable=False)

    __table_args__ = (
        UniqueConstraint("filename", "file_type", name="uq_processed_files_filename_type"),
    )


# ---------------------------------------------------------------------
# Database Initialization
# ---------------------------------------------------------------------

def init_db():
    """
    Creates tables if they do not exist.

    NOTE:
    This will NOT modify existing tables.
    Any future schema changes should be made
    directly in Supabase or through Alembic migrations.
    """
    Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------

def clear_live_data(db):
    """
    Removes the previous live snapshot.
    """
    db.query(LiveData).delete()


def is_file_processed(db, filename: str, file_type: str) -> bool:
    """True only for a SUCCESSFUL prior record -- a failed attempt must
    still be retried."""
    return db.query(ProcessedFile).filter(
        ProcessedFile.filename == filename,
        ProcessedFile.file_type == file_type,
        ProcessedFile.status == "success",
    ).first() is not None


def mark_file_processed(db, filename: str, file_type: str, *, source=None,
                         remote_path=None, checksum=None, status: str = "success"):
    """Insert-or-update the dedup record for (filename, file_type). Caller
    is responsible for db.commit()."""
    existing = db.query(ProcessedFile).filter(
        ProcessedFile.filename == filename,
        ProcessedFile.file_type == file_type,
    ).first()
    now = datetime.now(timezone.utc)
    if existing:
        existing.status = status
        existing.source = source
        existing.remote_path = remote_path
        existing.checksum = checksum
        existing.processed_at = now
    else:
        db.add(ProcessedFile(
            filename=filename, file_type=file_type, source=source,
            remote_path=remote_path, checksum=checksum, status=status,
            processed_at=now,
        ))


def get_db():
    """
    FastAPI dependency.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
