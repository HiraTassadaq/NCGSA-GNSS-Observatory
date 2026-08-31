import numpy as np

from app.satellite_position import ecef_to_geodetic


def _ecef_to_enu_rotation(lat, lon):
    """
    Builds the 3x3 rotation matrix that transforms an ECEF vector into the
    local East-North-Up (ENU) frame at geodetic latitude/longitude (radians).
    Same convention used in satellite_position.elevation_azimuth, so results
    stay consistent with the rest of the pipeline.
    """
    sin_lat, cos_lat = np.sin(lat), np.cos(lat)
    sin_lon, cos_lon = np.sin(lon), np.cos(lon)

    return np.array([
        [-sin_lon,            cos_lon,           0.0],
        [-sin_lat * cos_lon, -sin_lat * sin_lon, cos_lat],
        [ cos_lat * cos_lon,  cos_lat * sin_lon, sin_lat],
    ])


def compute_dop(receiver_pos, satellite_positions):
    """
    Computes GDOP, PDOP, HDOP, VDOP, TDOP based on receiver and satellite
    ECEF coordinates.
    receiver_pos: tuple or list (X, Y, Z) in meters.
    satellite_positions: list of tuples/lists [(X, Y, Z), ...] in meters.

    GDOP/PDOP/TDOP are rotation-invariant (they only depend on the trace of
    the covariance matrix / its individual diagonal terms in the original
    (x, y, z, clock-bias) basis). HDOP/VDOP are NOT rotation-invariant:
    "vertical" only means the local Up direction, which requires rotating
    the ECEF position-covariance block into the local East-North-Up (ENU)
    frame before reading off the diagonal.
    """
    A = []
    rx, ry, rz = receiver_pos

    for sat_pos in satellite_positions:
        sx, sy, sz = sat_pos

        # Calculate geometric range
        range_dist = np.sqrt((sx - rx)**2 + (sy - ry)**2 + (sz - rz)**2)
        if range_dist == 0:
            continue

        # Directional cosines for the design matrix A
        u_x = (sx - rx) / range_dist
        u_y = (sy - ry) / range_dist
        u_z = (sz - rz) / range_dist

        # Append [dx, dy, dz, 1 (for clock bias)]
        A.append([u_x, u_y, u_z, 1.0])

    # We need at least 4 satellites for a 3D position + time fix
    if len(A) < 4:
        return {"GDOP": 0.0, "PDOP": 0.0, "HDOP": 0.0, "VDOP": 0.0, "TDOP": 0.0}

    A = np.array(A)
    try:
        # Covariance matrix Q = (A^T A)^-1, in ECEF (x, y, z, clock-bias) order
        Q = np.linalg.inv(A.T @ A)

        gdop = np.sqrt(np.trace(Q))
        pdop = np.sqrt(Q[0, 0] + Q[1, 1] + Q[2, 2])
        # Clock-bias term is the 4th diagonal entry (index 3) of Q, in the
        # same range-equivalent units as the other DOP terms -- this is why
        # GDOP^2 == PDOP^2 + TDOP^2.
        tdop = np.sqrt(Q[3, 3])

        # Rotate the 3x3 position block into local ENU before reading
        # off horizontal/vertical components - Q[2,2] alone is only the
        # ECEF Z variance, which equals "Up" only exactly at the poles.
        lat, lon = ecef_to_geodetic(rx, ry, rz)
        R = _ecef_to_enu_rotation(lat, lon)
        Q_pos_ecef = Q[:3, :3]
        Q_enu = R @ Q_pos_ecef @ R.T

        hdop = np.sqrt(Q_enu[0, 0] + Q_enu[1, 1])
        vdop = np.sqrt(Q_enu[2, 2])

        return {
            "GDOP": round(float(gdop), 2),
            "PDOP": round(float(pdop), 2),
            "HDOP": round(float(hdop), 2),
            "VDOP": round(float(vdop), 2),
            "TDOP": round(float(tdop), 2),
        }
    except np.linalg.LinAlgError:
        # Failsafe if matrix is singular/non-invertible (bad satellite geometry)
        return {"GDOP": 0.0, "PDOP": 0.0, "HDOP": 0.0, "VDOP": 0.0, "TDOP": 0.0}