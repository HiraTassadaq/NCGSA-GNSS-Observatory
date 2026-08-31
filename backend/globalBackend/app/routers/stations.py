import os
import json
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api")

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
STATIONS_FILE = os.path.join(DATA_DIR, "stations.json")

@router.get("/stations")
def get_stations():
    """Return configured city capitals and IGS Ground Stations."""
    if os.path.exists(STATIONS_FILE):
        try:
            with open(STATIONS_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read stations database: {e}")
    raise HTTPException(status_code=404, detail="Stations file not found.")
