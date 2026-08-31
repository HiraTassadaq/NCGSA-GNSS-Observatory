import math
from app.orbits.coordinates import calculate_gmst, ecef_to_lla, lla_to_ecef, ecef_to_enu

# Frequencies & Constants
F_L1 = 1575.42e6
F_L2 = 1227.60e6
F_G1 = 1602.00e6
F_G2 = 1246.00e6
C = 299792458.0
R_E = 6371.0
H_IONO = 350.0

def propagate_satellite(satrec, jd: float, fr: float, obs_lat: float, obs_lng: float, obs_alt_m: float):
    """Propagate satellite to Julian date, returning LLA and ENU coordinates."""
    e_code, pos, vel = satrec.sgp4(jd, fr)
    if e_code != 0:
        return None

    theta = calculate_gmst(jd, fr)
    cos_t, sin_t = math.cos(theta), math.sin(theta)
    
    x_teme, y_teme, z_teme = pos[0] * 1000.0, pos[1] * 1000.0, pos[2] * 1000.0
    vx_teme, vy_teme, vz_teme = vel[0] * 1000.0, vel[1] * 1000.0, vel[2] * 1000.0

    x_ecef = x_teme * cos_t + y_teme * sin_t
    y_ecef = -x_teme * sin_t + y_teme * cos_t
    z_ecef = z_teme

    omega_e = 7.2921151467e-5
    vx_ecef = vx_teme * cos_t + vy_teme * sin_t + omega_e * y_ecef
    vy_ecef = -vx_teme * sin_t + vy_teme * cos_t - omega_e * x_ecef
    vz_ecef = vz_teme

    sat_lat, sat_lng, sat_alt = ecef_to_lla(x_ecef, y_ecef, z_ecef)
    obs_x, obs_y, obs_z = lla_to_ecef(obs_lat, obs_lng, obs_alt_m)

    dx, dy, dz = x_ecef - obs_x, y_ecef - obs_y, z_ecef - obs_z
    e, n, u = ecef_to_enu(obs_lat, obs_lng, dx, dy, dz)

    range_dist = math.sqrt(e**2 + n**2 + u**2)
    el_deg = math.degrees(math.asin(u / range_dist))
    az_deg = math.degrees(math.atan2(e, n)) % 360.0
    
    los_x, los_y, los_z = dx / range_dist, dy / range_dist, dz / range_dist
    range_rate = vx_ecef * los_x + vy_ecef * los_y + vz_ecef * los_z

    return {
        "sat_lat": sat_lat, "sat_lng": sat_lng, "sat_alt": sat_alt,
        "azimuth": az_deg, "elevation": el_deg, "range": range_dist, "range_rate": range_rate
    }

def get_doppler(range_rate: float, constellation: str):
    """Calculate Doppler Shift (Hz) for L1 and L2 frequencies."""
    f0_l1 = F_G1 if constellation == "GLONASS" else F_L1
    f0_l2 = F_G2 if constellation == "GLONASS" else F_L2
        
    return {
        "doppler_l1": round(-f0_l1 * (range_rate / C), 2),
        "doppler_l2": round(-f0_l2 * (range_rate / C), 2)
    }
