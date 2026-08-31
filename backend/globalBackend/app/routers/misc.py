import time
import requests
from typing import Optional
from fastapi import APIRouter, Query, HTTPException

router = APIRouter(prefix="/api")

@router.get("/n2yo-query")
def query_n2yo(
    id: int = Query(25544, description="NORAD ID"),
    lat: float = Query(33.68, description="Lat"),
    lng: float = Query(73.04, description="Lng"),
    alt: float = Query(0, description="Alt"),
    days: int = Query(5, description="Days"),
    api_key: Optional[str] = Query(None, description="API Key")
):
    """Simulate or fetch passes from N2YO API."""
    if api_key and api_key.strip():
        url = f"https://api.n2yo.com/rest/v1/satellite/radiopasses/{id}/{lat}/{lng}/{alt}/{days}/30/&apiKey={api_key}"
        try:
            r = requests.get(url, timeout=10)
            if r.status_code == 200:
                return r.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"N2YO API failed: {e}")
            
    now_ts = int(time.time())
    passes = []
    for i in range(1, 4):
        start_ts = now_ts + (i * 12 * 3600) + 1800
        passes.append({
            "startAz": 45 * i, "startAzCompass": "NE" if i==1 else "SW", "startUTC": start_ts,
            "maxAz": 120 * i % 360, "maxAzCompass": "E" if i==1 else "W", "maxEl": 20.0 + 25.0 * i,
            "maxUTC": start_ts + 300,
            "endAz": 180 * i % 360, "endAzCompass": "S", "endUTC": start_ts + 600, "mag": -1.2 + 0.5 * i
        })
    return {"info": {"satid": id, "satname": "SIMULATED SATELLITE", "passescount": len(passes)}, "passes": passes}

@router.get("/cddis-query")
def query_cddis(
    station_code: str = Query("ISBA", description="IGS Station"),
    year: int = Query(2026, description="Year"),
    doy: int = Query(200, description="Day of Year"),
    product_type: str = Query("orbit", description="orbit, clock, or rinex")
):
    """Simulates queries to CDDIS / IGS Archive."""
    doy_str = str(doy).zfill(3)
    year_short = str(year)[2:]
    
    if product_type == "orbit":
        filename = f"igs{year_short}{doy_str}.sp3"
        url = f"https://cddis.nasa.gov/archive/gnss/products/{year}/{doy_str}/{filename}.Z"
        preview = f"*  {year}  {doy_str} 0 0 0.00000000EPOCH\nPG11  14200.0  -18000.0  9000.0\nPG12  -15000.0  12000.0  16000.0"
    elif product_type == "clock":
        filename = f"igs{year_short}{doy_str}.clk"
        url = f"https://cddis.nasa.gov/archive/gnss/products/{year}/{doy_str}/{filename}.Z"
        preview = f"+ CLK     {year}  {doy_str}\nAS G11  -120.91283\nAS G12  342.12938"
    else:
        filename = f"{station_code.lower()}{doy_str}0.{year_short}o"
        url = f"https://cddis.nasa.gov/archive/gnss/data/daily/{year}/{doy_str}/{year_short}o/{filename}.Z"
        preview = f"     2.11           OBSERVATION DATA\nANTIGRAVITY REC     {station_code}"

    return {
        "station": station_code, "product_type": product_type, "date": f"{year}-DOY-{doy_str}", "filename": filename,
        "cddis_url": url, "file_size_bytes": 1024 * 342, "status": "Available",
        "gps_week": int((doy + (year - 1980) * 365.25) / 7), "preview_lines": preview.split("\n")
    }
