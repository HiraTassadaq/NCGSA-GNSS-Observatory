import math

def calculate_gmst(jd: float, fr: float) -> float:
    """Greenwich Mean Sidereal Time in radians."""
    t = ((jd + fr) - 2451545.0) / 36525.0
    theta = 24110.54841 + 8640184.812866 * t + 0.093104 * t**2 - 6.2e-6 * t**3
    theta_rad = (theta * (2.0 * math.pi / 86400.0)) % (2.0 * math.pi)
    if theta_rad < 0:
        theta_rad += 2.0 * math.pi
    return theta_rad

def ecef_to_lla(x: float, y: float, z: float):
    """Convert ECEF coordinates (meters) to LLA (lat, lon in deg, alt in meters)."""
    a, b = 6378137.0, 6356752.314245
    f = (a - b) / a
    e2 = (2 * f) - (f * f)
    ep2 = (a**2 - b**2) / b**2

    p = math.sqrt(x**2 + y**2)
    if p < 1e-6:
        return (90.0 if z > 0 else -90.0), 0.0, abs(z) - b

    theta = math.atan2(z * a, p * b)
    lat = math.atan2(z + ep2 * b * (math.sin(theta) ** 3), p - e2 * a * (math.cos(theta) ** 3))
    lon = math.atan2(y, x)
    N = a / math.sqrt(1 - e2 * (math.sin(lat) ** 2))
    return math.degrees(lat), math.degrees(lon), (p / math.cos(lat)) - N

def lla_to_ecef(lat_deg: float, lon_deg: float, alt_m: float):
    """Convert LLA (deg, meters) to ECEF (meters)."""
    lat, lon = math.radians(lat_deg), math.radians(lon_deg)
    a, b = 6378137.0, 6356752.314245
    e2 = 1 - (b / a)**2
    N = a / math.sqrt(1 - e2 * math.sin(lat)**2)
    x = (N + alt_m) * math.cos(lat) * math.cos(lon)
    y = (N + alt_m) * math.cos(lat) * math.sin(lon)
    z = (N * (1 - e2) + alt_m) * math.sin(lat)
    return x, y, z

def ecef_to_enu(lat_deg: float, lon_deg: float, dx: float, dy: float, dz: float):
    """Convert ECEF difference vector to Local East-North-Up (meters)."""
    lat, lon = math.radians(lat_deg), math.radians(lon_deg)
    sin_lat, cos_lat = math.sin(lat), math.cos(lat)
    sin_lon, cos_lon = math.sin(lon), math.cos(lon)
    
    e = -sin_lon * dx + cos_lon * dy
    n = -sin_lat * cos_lon * dx - sin_lat * sin_lon * dy + cos_lat * dz
    u = cos_lat * cos_lon * dx + cos_lat * sin_lon * dy + sin_lat * dz
    return e, n, u
