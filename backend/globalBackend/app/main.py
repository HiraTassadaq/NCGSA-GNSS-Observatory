import datetime
import logging
import threading
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import state
from app.orbits import tles
from app.orbits.health import fetch_fresh_health
from app.routers import satellites, stations, weather, misc, world, regional

logger = logging.getLogger(__name__)

app = FastAPI(title="GNSS Telemetry & API Portal", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(satellites.router)
app.include_router(stations.router)
app.include_router(weather.router)
app.include_router(misc.router)
app.include_router(world.router)
app.include_router(regional.router)


def _tle_refresh_loop():
    """Background loop: re-fetches CelesTrak GNSS/SBAS TLEs every
    REFRESH_INTERVAL_SECONDS (2 hours) and swaps them into state.satellites_cache.
    Runs for the lifetime of the process; failures just keep the previous
    stored data in place until the next successful attempt."""
    while True:
        time.sleep(tles.REFRESH_INTERVAL_SECONDS)
        try:
            fresh = tles.fetch_fresh_tles()
            state.satellites_cache = fresh
            logger.info("Scheduled refresh: reloaded %d satellite TLEs from CelesTrak.", len(fresh))
        except Exception as e:
            logger.error("Scheduled TLE refresh failed, keeping existing cached data: %s", e)


@app.on_event("startup")
def startup_event():
    logging.basicConfig(level=logging.INFO)
    logger.info("Initializing GNSS Dashboard backend...")
    try:
        # Use stored CelesTrak data if it's less than 2 hours old; otherwise
        # fetch fresh data from CelesTrak and re-stamp the stored cache.
        state.satellites_cache = tles.load_or_fetch_tles()
        logger.info(
            "Loaded %d satellite TLEs into cache (source: %s, fetched_at: %s).",
            len(state.satellites_cache),
            tles.last_refresh_meta.get("source"),
            tles.last_refresh_meta.get("fetched_at"),
        )
    except Exception as e:
        logger.error("TLE cache initialization failed, starting with empty cache: %s", e)
        state.satellites_cache = []

    try:
        health_cache = fetch_fresh_health()
        logger.info("Loaded operational health/status for %d satellites.", len(health_cache))
    except Exception as e:
        logger.error("Health cache initialization failed, satellites will report 'unknown' health: %s", e)

    # Kick off the every-2-hours background refresh so long-running servers
    # don't just serve startup-time TLEs forever.
    refresh_thread = threading.Thread(target=_tle_refresh_loop, daemon=True)
    refresh_thread.start()


@app.get("/api/status")
def get_status():
    age_seconds = tles.get_cache_age_seconds()
    return {
        "status": "online",
        "cached_satellites_count": len(state.satellites_cache),
        "time": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "tle_source": tles.last_refresh_meta.get("source"),
        "tle_fetched_at": tles.last_refresh_meta.get("fetched_at"),
        "tle_cache_age_seconds": age_seconds,
        "tle_refresh_interval_seconds": tles.REFRESH_INTERVAL_SECONDS,
    }
