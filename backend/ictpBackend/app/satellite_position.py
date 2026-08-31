"""
Step 2: compute a satellite's actual position in space from its broadcast
orbital elements (parsed by nav_parser.py), then convert that into
elevation/azimuth as seen from a ground station -- the two numbers that
make a sky plot possible.

Still completely standalone: doesn't import or get imported by anything
in the existing obs pipeline.

Algorithm: standard Keplerian broadcast-ephemeris propagation
(ICD-GPS-200 / Galileo OS-SIS-ICD -- same math, both use WGS84-compatible
constants). Works for GPS and Galileo as-is; BeiDou uses slightly
different constants (CGCS2000) which can be passed in if needed later.
"""
import math
from datetime import datetime

MU_DEFAULT = 3.986005e14          # WGS84 Earth gravitational constant (m^3/s^2) -- GPS/Galileo
OMEGA_E_DOT_DEFAULT = 7.2921151467e-5  # WGS84 Earth rotation rate (rad/s)


def satellite_ecef_position(record: dict, target_time: datetime,
                             mu: float = MU_DEFAULT, omega_e_dot: float = OMEGA_E_DOT_DEFAULT):
    """
    record: one nav record dict from nav_parser.parse_nav_file()
             (must be a Keplerian-format record: G/E/C/J/I, not R/S)
    target_time: the datetime we want the satellite's position AT

    Returns (X, Y, Z) in metres, ECEF (WGS84-ish), or None if inputs invalid.
    """
    f = record["fields"]
    try:
        sqrtA = f["sqrtA"]
        e = f["Eccentricity"]
        M0 = f["M0"]
        DeltaN = f["DeltaN"]
        omega = f["omega"]
        i0 = f["i0"]
        OMEGA0 = f["OMEGA0"]
        OMEGA_DOT = f["OMEGA_DOT"]
        IDOT = f["IDOT"]
        Cuc, Cus = f["Cuc"], f["Cus"]
        Crc, Crs = f["Crc"], f["Crs"]
        Cic, Cis = f["Cic"], f["Cis"]
        Toe = f["Toe"]
    except (KeyError, TypeError):
        return None
    if None in (sqrtA, e, M0, DeltaN, omega, i0, OMEGA0, OMEGA_DOT, IDOT, Toe):
        return None

    # Time since reference epoch (seconds). Using direct elapsed real time
    # between target and this record's own epoch -- valid as long as we
    # don't cross a GPS week boundary, which we won't within one day.
    tk = (target_time - record["epoch"]).total_seconds()

    a = sqrtA ** 2
    n0 = math.sqrt(mu / a ** 3)
    n = n0 + DeltaN
    Mk = M0 + n * tk

    # Solve Kepler's equation Mk = Ek - e*sin(Ek) iteratively
    Ek = Mk
    for _ in range(15):
        Ek = Ek - (Ek - e * math.sin(Ek) - Mk) / (1 - e * math.cos(Ek))

    vk = math.atan2(math.sqrt(1 - e ** 2) * math.sin(Ek), math.cos(Ek) - e)
    Phik = vk + omega

    duk = Cus * math.sin(2 * Phik) + Cuc * math.cos(2 * Phik)
    drk = Crs * math.sin(2 * Phik) + Crc * math.cos(2 * Phik)
    dik = Cis * math.sin(2 * Phik) + Cic * math.cos(2 * Phik)

    uk = Phik + duk
    rk = a * (1 - e * math.cos(Ek)) + drk
    ik = i0 + dik + IDOT * tk

    xk_prime = rk * math.cos(uk)
    yk_prime = rk * math.sin(uk)

    OMEGAk = OMEGA0 + (OMEGA_DOT - omega_e_dot) * tk - omega_e_dot * Toe

    X = xk_prime * math.cos(OMEGAk) - yk_prime * math.cos(ik) * math.sin(OMEGAk)
    Y = xk_prime * math.sin(OMEGAk) + yk_prime * math.cos(ik) * math.cos(OMEGAk)
    Z = yk_prime * math.sin(ik)

    return (X, Y, Z)


def ecef_to_geodetic(x, y, z):
    a = 6378137.0
    f = 1 / 298.257223563
    e2 = f * (2 - f)
    lon = math.atan2(y, x)
    p = math.sqrt(x * x + y * y)
    lat = math.atan2(z, p * (1 - e2))
    for _ in range(10):
        N = a / math.sqrt(1 - e2 * math.sin(lat) ** 2)
        h = p / math.cos(lat) - N
        lat = math.atan2(z, p * (1 - e2 * N / (N + h)))
    return lat, lon  # radians


def elevation_azimuth(sat_ecef, station_ecef):
    """
    sat_ecef, station_ecef: (X, Y, Z) tuples in metres.
    Returns (elevation_deg, azimuth_deg).
    """
    Xs, Ys, Zs = station_ecef
    Xk, Yk, Zk = sat_ecef
    lat, lon = ecef_to_geodetic(Xs, Ys, Zs)

    dx, dy, dz = Xk - Xs, Yk - Ys, Zk - Zs

    sin_lat, cos_lat = math.sin(lat), math.cos(lat)
    sin_lon, cos_lon = math.sin(lon), math.cos(lon)

    east = -sin_lon * dx + cos_lon * dy
    north = -sin_lat * cos_lon * dx - sin_lat * sin_lon * dy + cos_lat * dz
    up = cos_lat * cos_lon * dx + cos_lat * sin_lon * dy + sin_lat * dz

    elevation = math.degrees(math.atan2(up, math.sqrt(east ** 2 + north ** 2)))
    azimuth = math.degrees(math.atan2(east, north))
    if azimuth < 0:
        azimuth += 360
    return elevation, azimuth


if __name__ == "__main__":
    from app.nav_parser import parse_nav_file

    NAV_PATH = "nav/BRDM00DLR_S_20262040000_01D_MN.rnx"
    # GRAL station's known ECEF position (from your obs file headers)
    GRAL_ECEF = (1540572.3390, 5095327.8950, 3502672.0477)

    data = parse_nav_file(NAV_PATH)
    r = data["G"][0]  # first G01 record, epoch 2026-07-23 00:00:00

    # Test at several times after the record's reference epoch
    for minutes_offset in [0, 15, 30, 60, 120]:
        from datetime import timedelta
        t = r["epoch"] + timedelta(minutes=minutes_offset)
        pos = satellite_ecef_position(r, t)
        if pos is None:
            print(f"+{minutes_offset:>4} min: could not compute position")
            continue
        X, Y, Z = pos
        dist_from_earth_center = math.sqrt(X**2 + Y**2 + Z**2)
        elev, az = elevation_azimuth(pos, GRAL_ECEF)
        print(f"+{minutes_offset:>4} min: X={X:>14.1f} Y={Y:>14.1f} Z={Z:>14.1f}  "
              f"|dist from Earth center|={dist_from_earth_center/1000:>9.1f} km  "
              f"elev={elev:>6.2f} deg  az={az:>6.2f} deg")
