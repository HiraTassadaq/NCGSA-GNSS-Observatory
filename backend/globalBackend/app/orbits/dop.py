import math
import numpy as np

def compute_dop(visible_sats):
    """Compute GDOP, PDOP, HDOP, VDOP, and TDOP from visible satellite geometries."""
    fallback = {"gdop": 99.9, "pdop": 99.9, "hdop": 99.9, "vdop": 99.9, "tdop": 99.9}
    if len(visible_sats) < 4:
        return fallback

    A = []
    for sat in visible_sats:
        az = math.radians(sat["azimuth"])
        el = math.radians(sat["elevation"])
        r_east = math.cos(el) * math.sin(az)
        r_north = math.cos(el) * math.cos(az)
        r_up = math.sin(el)
        A.append([r_east, r_north, r_up, 1.0])

    A = np.array(A)
    try:
        Q = np.linalg.pinv(np.dot(A.T, A))
        hdop = math.sqrt(max(0.0, Q[0, 0] + Q[1, 1]))
        vdop = math.sqrt(max(0.0, Q[2, 2]))
        pdop = math.sqrt(max(0.0, Q[0, 0] + Q[1, 1] + Q[2, 2]))
        tdop = math.sqrt(max(0.0, Q[3, 3]))
        gdop = math.sqrt(max(0.0, Q[0, 0] + Q[1, 1] + Q[2, 2] + Q[3, 3]))
        
        return {
            "gdop": round(gdop, 2), "pdop": round(pdop, 2),
            "hdop": round(hdop, 2), "vdop": round(vdop, 2), "tdop": round(tdop, 2)
        }
    except Exception:
        return fallback
