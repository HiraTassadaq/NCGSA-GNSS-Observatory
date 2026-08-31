"""
GLONASS and SBAS satellite position calculation.

Unlike GPS/Galileo/BeiDou (which broadcast abstract orbital elements,
handled in satellite_position.py via Kepler's equation), GLONASS and
SBAS broadcast DIRECT position/velocity/acceleration in an Earth-fixed
frame. Getting the position at a different time requires a different
approach for each:

  GLONASS: numerical integration (4th-order Runge-Kutta) of the actual
  equations of motion (PZ-90 reference frame), since the satellite's
  broadcast position needs to be propagated forward/backward in time
  using real physics (Earth's oblateness + Coriolis/centrifugal terms,
  since we're integrating directly in a ROTATING Earth-fixed frame).
  This is the standard method used by real GNSS processing software
  (e.g. RTKLIB) for GLONASS.

  SBAS: broadcasts are refreshed frequently and satellites are
  (near-)geostationary, so a simple Taylor-series extrapolation using
  the given position + velocity + acceleration is the standard,
  sufficiently accurate approach (this is what the SBAS ICD itself
  prescribes) -- no integration needed.

Still completely standalone -- doesn't modify or get imported by
anything in the existing obs pipeline.
"""
import math

MU_GLONASS = 398600.4418          # km^3/s^2 (PZ-90 Earth gravitational constant)
AE_GLONASS = 6378.136             # km (PZ-90 equatorial radius)
J02_GLONASS = 1082625.7e-9        # 2nd zonal harmonic (Earth oblateness)
OMEGA_EARTH = 7.292115e-5         # rad/s (Earth rotation rate)


def _glonass_derivatives(state, accel_luni):
    """
    state = [x, y, z, vx, vy, vz] in km, km/s (PZ-90 Earth-fixed frame)
    accel_luni = (ax, ay, az) broadcast luni-solar acceleration, km/s^2
    Returns d(state)/dt = [vx, vy, vz, ax_total, ay_total, az_total]
    """
    x, y, z, vx, vy, vz = state
    ax_ls, ay_ls, az_ls = accel_luni

    r2 = x * x + y * y + z * z
    r = math.sqrt(r2)
    r5 = r2 * r2 * r

    common = 1.5 * J02_GLONASS * MU_GLONASS * AE_GLONASS ** 2 / r5
    z2_r2 = z * z / r2

    ax = (-MU_GLONASS * x / r ** 3
          - common * x * (1 - 5 * z2_r2)
          + OMEGA_EARTH ** 2 * x + 2 * OMEGA_EARTH * vy + ax_ls)
    ay = (-MU_GLONASS * y / r ** 3
          - common * y * (1 - 5 * z2_r2)
          + OMEGA_EARTH ** 2 * y - 2 * OMEGA_EARTH * vx + ay_ls)
    az = (-MU_GLONASS * z / r ** 3
          - common * z * (3 - 5 * z2_r2)
          + az_ls)

    return [vx, vy, vz, ax, ay, az]


def _rk4_step(state, accel_luni, dt):
    k1 = _glonass_derivatives(state, accel_luni)
    s2 = [state[i] + dt / 2 * k1[i] for i in range(6)]
    k2 = _glonass_derivatives(s2, accel_luni)
    s3 = [state[i] + dt / 2 * k2[i] for i in range(6)]
    k3 = _glonass_derivatives(s3, accel_luni)
    s4 = [state[i] + dt * k3[i] for i in range(6)]
    k4 = _glonass_derivatives(s4, accel_luni)
    return [state[i] + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) for i in range(6)]


def glonass_ecef_position(record: dict, target_time, step_seconds: float = 30.0):
    """
    record: a GLONASS ('R') record from nav_parser.parse_nav_file()
    target_time: datetime to compute position at
    Returns (X, Y, Z) in METRES, or None if inputs invalid.
    """
    f = record["fields"]
    try:
        x0 = f["X_km"]; y0 = f["Y_km"]; z0 = f["Z_km"]
        vx0 = f["X_vel_km_s"]; vy0 = f["Y_vel_km_s"]; vz0 = f["Z_vel_km_s"]
        ax = f["X_accel_km_s2"]; ay = f["Y_accel_km_s2"]; az = f["Z_accel_km_s2"]
    except (KeyError, TypeError):
        return None
    if None in (x0, y0, z0, vx0, vy0, vz0, ax, ay, az):
        return None

    dt_total = (target_time - record["epoch"]).total_seconds()
    if dt_total == 0:
        return (x0 * 1000, y0 * 1000, z0 * 1000)

    state = [x0, y0, z0, vx0, vy0, vz0]
    accel_luni = (ax, ay, az)

    remaining = dt_total
    direction = 1 if remaining >= 0 else -1
    step = direction * min(step_seconds, abs(remaining)) if remaining != 0 else 0
    # integrate in fixed steps, last step shorter to land exactly on target
    n_full_steps = int(abs(dt_total) // step_seconds)
    last_step = abs(dt_total) - n_full_steps * step_seconds

    for _ in range(n_full_steps):
        state = _rk4_step(state, accel_luni, direction * step_seconds)
    if last_step > 1e-9:
        state = _rk4_step(state, accel_luni, direction * last_step)

    X, Y, Z = state[0] * 1000, state[1] * 1000, state[2] * 1000  # km -> m
    return (X, Y, Z)


def sbas_ecef_position(record: dict, target_time):
    """
    record: an SBAS ('S') record from nav_parser.parse_nav_file()
    target_time: datetime to compute position at
    Returns (X, Y, Z) in METRES, using simple Taylor-series extrapolation
    (standard SBAS approach -- satellites are (near-)geostationary and
    messages refresh frequently, so full integration isn't needed/used).
    """
    f = record["fields"]
    try:
        x0 = f["X_km"]; y0 = f["Y_km"]; z0 = f["Z_km"]
        vx0 = f["X_vel_km_s"]; vy0 = f["Y_vel_km_s"]; vz0 = f["Z_vel_km_s"]
        ax = f["X_accel_km_s2"] or 0.0
        ay = f["Y_accel_km_s2"] or 0.0
        az = f["Z_accel_km_s2"] or 0.0
    except (KeyError, TypeError):
        return None
    if None in (x0, y0, z0, vx0, vy0, vz0):
        return None

    dt = (target_time - record["epoch"]).total_seconds()
    X = (x0 + vx0 * dt + 0.5 * ax * dt ** 2) * 1000
    Y = (y0 + vy0 * dt + 0.5 * ay * dt ** 2) * 1000
    Z = (z0 + vz0 * dt + 0.5 * az * dt ** 2) * 1000
    return (X, Y, Z)


if __name__ == "__main__":
    from app.nav_parser import parse_nav_file
    from app.satellite_position import elevation_azimuth
    from datetime import timedelta

    NAV_PATH = "nav/BRDM00DLR_S_20262040000_01D_MN.rnx"
    GRAL_ECEF = (1540572.3390, 5095327.8950, 3502672.0477)

    data = parse_nav_file(NAV_PATH)

    print("=== GLONASS R01: raw broadcast position sanity check ===")
    r = data["R"][0]
    x0, y0, z0 = r["fields"]["X_km"], r["fields"]["Y_km"], r["fields"]["Z_km"]
    dist_raw = math.sqrt(x0**2 + y0**2 + z0**2)
    print(f"  Raw broadcast |distance from Earth center| = {dist_raw:.1f} km "
          f"(GLONASS orbit is ~25,500 km -- {'MATCHES' if 25000 < dist_raw < 26000 else 'MISMATCH'})")

    print("\n=== GLONASS R01: propagated across time (RK4 integration) ===")
    for minutes_offset in [0, 5, 10, 15, 30]:
        t = r["epoch"] + timedelta(minutes=minutes_offset)
        pos = glonass_ecef_position(r, t)
        dist = math.sqrt(sum(c**2 for c in pos)) / 1000
        elev, az = elevation_azimuth(pos, GRAL_ECEF)
        print(f"  +{minutes_offset:>3} min: dist={dist:>9.1f} km  elev={elev:>7.2f} deg  az={az:>7.2f} deg")

    print("\n=== SBAS S21: raw broadcast position sanity check ===")
    r2 = data["S"][0]
    x0, y0, z0 = r2["fields"]["X_km"], r2["fields"]["Y_km"], r2["fields"]["Z_km"]
    dist_raw2 = math.sqrt(x0**2 + y0**2 + z0**2)
    print(f"  Raw broadcast |distance from Earth center| = {dist_raw2:.1f} km "
          f"(geostationary orbit is ~42,164 km -- {'MATCHES' if 42000 < dist_raw2 < 42300 else 'MISMATCH'})")

    print("\n=== SBAS S21: extrapolated across time ===")
    for minutes_offset in [0, 15, 30, 60]:
        t = r2["epoch"] + timedelta(minutes=minutes_offset)
        pos = sbas_ecef_position(r2, t)
        dist = math.sqrt(sum(c**2 for c in pos)) / 1000
        elev, az = elevation_azimuth(pos, GRAL_ECEF)
        print(f"  +{minutes_offset:>3} min: dist={dist:>9.1f} km  elev={elev:>7.2f} deg  az={az:>7.2f} deg")
