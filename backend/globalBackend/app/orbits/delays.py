import math
import random
from datetime import datetime, timezone
from app.orbits.propagation import C, R_E, H_IONO, F_L1, F_L2

def estimate_tec_and_delay(obs_lat: float, obs_lng: float, elevation_deg: float, dt=None):
    """Estimate Slant Total Electron Content (STEC) and ionospheric range delay in meters/nanoseconds."""
    if elevation_deg <= 0:
        return {"vtec": 0.0, "stec": 0.0, "delay_l1_m": 0.0, "delay_l1_ns": 0.0, "delay_l2_m": 0.0, "delay_l2_ns": 0.0}

    if dt is None:
        dt = datetime.now(timezone.utc)
    
    local_hour = (dt.hour + obs_lng / 15.0) % 24.0
    lat_factor = math.cos(math.radians(obs_lat))
    base_vtec = 8.0 + 20.0 * (0.5 + 0.5 * math.cos((local_hour - 14.0) * 2 * math.pi / 24.0))
    vtec = base_vtec * (0.3 + 0.7 * lat_factor)

    el_rad = math.radians(elevation_deg)
    sin_ref = (R_E / (R_E + H_IONO)) * math.cos(el_rad)
    stec = vtec * (1.0 / math.sqrt(1.0 - sin_ref**2))

    delay_l1_m = (40.3 * stec * 1e16) / (F_L1**2)
    delay_l2_m = (40.3 * stec * 1e16) / (F_L2**2)

    return {
        "vtec": round(vtec, 2),
        "stec": round(stec, 2),
        "delay_l1_m": round(delay_l1_m, 2),
        "delay_l1_ns": round((delay_l1_m / C) * 1e9, 2),
        "delay_l2_m": round(delay_l2_m, 2),
        "delay_l2_ns": round((delay_l2_m / C) * 1e9, 2)
    }

def simulate_snr(elevation_deg: float) -> float:
    """Simulate Carrier-to-Noise ratio (C/N0 in dB-Hz) with scintillation noise."""
    if elevation_deg < 0:
        return 0.0
    base_snr = 32.0 + 18.0 * (elevation_deg / 90.0)
    snr = base_snr + random.uniform(-1.0, 1.0)
    return round(max(0.0, min(52.0, snr)), 2)
