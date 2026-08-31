/**
 * Global Dilution of Precision (DOP) Calculator
 * Computes GDOP, PDOP, HDOP, VDOP, TDOP across a global Lat/Lon grid.
 */

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/**
 * Convert Geodetic (lat, lon, alt) to ECEF (X, Y, Z)
 */
function geodeticToECEF(latDeg, lonDeg, altM = 0) {
  const lat = latDeg * DEG2RAD;
  const lon = lonDeg * DEG2RAD;
  const a = 6378137.0;
  const f = 1 / 298.257223563;
  const e2 = 2 * f - f * f;
  const N = a / Math.sqrt(1 - e2 * Math.sin(lat) * Math.sin(lat));

  const x = (N + altM) * Math.cos(lat) * Math.cos(lon);
  const y = (N + altM) * Math.cos(lat) * Math.sin(lon);
  const z = (N * (1 - e2) + altM) * Math.sin(lat);
  return { x, y, z };
}

/**
 * Invert 4x4 matrix using Gauss-Jordan elimination
 */
function invert4x4(m) {
  const inv = new Array(16);
  inv[0] = m[5]  * m[10] * m[15] - m[5]  * m[11] * m[14] - m[9]  * m[6]  * m[15] + m[9]  * m[7]  * m[14] +m[13] * m[6]  * m[11] - m[13] * m[7]  * m[10];
  inv[4] = -m[4]  * m[10] * m[15] + m[4]  * m[11] * m[14] + m[8]  * m[6]  * m[15] - m[8]  * m[7]  * m[14] -m[12] * m[6]  * m[11] + m[12] * m[7]  * m[10];
  inv[8] = m[4]  * m[9]  * m[15] - m[4]  * m[11] * m[13] - m[8]  * m[5]  * m[15] + m[8]  * m[7]  * m[13] +m[12] * m[5]  * m[11] - m[12] * m[7]  * m[9];
  inv[12] = -m[4] * m[9]  * m[14] + m[4]  * m[10] * m[13] + m[8]  * m[5]  * m[14] - m[8]  * m[6]  * m[13] -m[12] * m[5]  * m[10] + m[12] * m[6]  * m[9];
  inv[1] = -m[1]  * m[10] * m[15] + m[1]  * m[11] * m[14] + m[9]  * m[2]  * m[15] - m[9]  * m[3]  * m[14] -m[13] * m[2]  * m[11] + m[13] * m[3]  * m[10];
  inv[5] = m[0]  * m[10] * m[15] - m[0]  * m[11] * m[14] - m[8]  * m[2]  * m[15] + m[8]  * m[3]  * m[14] +m[12] * m[2]  * m[11] - m[12] * m[3]  * m[10];
  inv[9] = -m[0]  * m[9]  * m[15] + m[0]  * m[11] * m[13] + m[8]  * m[1]  * m[15] - m[8]  * m[3]  * m[13] -m[12] * m[1]  * m[11] + m[12] * m[3]  * m[9];
  inv[13] = m[0]  * m[9]  * m[14] - m[0]  * m[10] * m[13] - m[8]  * m[1]  * m[14] + m[8]  * m[2]  * m[13] +m[12] * m[1]  * m[10] - m[12] * m[2]  * m[9];
  inv[2] = m[1]  * m[6]  * m[15] - m[1]  * m[7]  * m[14] - m[5]  * m[2]  * m[15] + m[5]  * m[3]  * m[14] +m[13] * m[2]  * m[7]  - m[13] * m[3]  * m[6];
  inv[6] = -m[0]  * m[6]  * m[15] + m[0]  * m[7]  * m[14] + m[4]  * m[2]  * m[15] - m[4]  * m[3]  * m[14] -m[12] * m[2]  * m[7]  + m[12] * m[3]  * m[6];
  inv[10] = m[0]  * m[5]  * m[15] - m[0]  * m[7]  * m[13] - m[4]  * m[1]  * m[15] + m[4]  * m[3]  * m[13] +m[12] * m[1]  * m[7]  - m[12] * m[3]  * m[5];
  inv[14] = -m[0] * m[5]  * m[14] + m[0]  * m[6]  * m[13] + m[4]  * m[1]  * m[14] - m[4]  * m[2]  * m[13] -m[12] * m[1]  * m[6]  + m[12] * m[2]  * m[5];
  inv[3] = -m[1]  * m[6]  * m[11] + m[1]  * m[7]  * m[10] + m[5]  * m[2]  * m[11] - m[5]  * m[3]  * m[10] -m[9]  * m[2]  * m[7]  + m[9]  * m[3]  * m[6];
  inv[7] = m[0]  * m[6]  * m[11] - m[0]  * m[7]  * m[10] - m[4]  * m[2]  * m[11] + m[4]  * m[3]  * m[10] +m[8]  * m[2]  * m[7]  - m[8]  * m[3]  * m[6];
  inv[11] = -m[0] * m[5]  * m[11] + m[0]  * m[7]  * m[9]  + m[4]  * m[1]  * m[11] - m[4]  * m[3]  * m[9]  -m[8]  * m[1]  * m[7]  + m[8]  * m[3]  * m[5];
  inv[15] = m[0]  * m[5]  * m[10] - m[0]  * m[6]  * m[9]  - m[4]  * m[1]  * m[10] + m[4]  * m[2]  * m[9]  +m[8]  * m[1]  * m[6]  - m[8]  * m[2]  * m[5];

  let det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
  if (Math.abs(det) < 1e-12) return null;

  det = 1.0 / det;
  const result = new Array(16);
  for (let i = 0; i < 16; i++) result[i] = inv[i] * det;
  return result;
}

/**
 * Calculate DOP at a specific ground location (lat, lon, alt) for active satellites
 */
export function calculateDOPAtLocation(latDeg, lonDeg, satPositions, maskDeg = 10.0) {
  const recECEF = geodeticToECEF(latDeg, lonDeg, 0);
  const lat = latDeg * DEG2RAD;
  const lon = lonDeg * DEG2RAD;

  const sinLat = Math.sin(lat);
  const cosLat = Math.cos(lat);
  const sinLon = Math.sin(lon);
  const cosLon = Math.cos(lon);

  // Rotation matrix from ECEF to local ENU (East, North, Up)
  const R = [
    [-sinLon,           cosLon,          0],
    [-sinLat * cosLon, -sinLat * sinLon, cosLat],
    [ cosLat * cosLon,  cosLat * sinLon, sinLat]
  ];

  const GRows = [];
  const maskRad = (maskDeg * Math.PI) / 180;

  for (const sat of satPositions) {
    if (!sat || !sat.isHealthy) continue;

    const dx = sat.x - recECEF.x;
    const dy = sat.y - recECEF.y;
    const dz = sat.z - recECEF.z;
    const range = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (range === 0) continue;

    // ECEF unit vector
    const uX = dx / range;
    const uY = dy / range;
    const uZ = dz / range;

    // Transform to local ENU
    const eEast  = R[0][0] * uX + R[0][1] * uY + R[0][2] * uZ;
    const eNorth = R[1][0] * uX + R[1][1] * uY + R[1][2] * uZ;
    const eUp    = R[2][0] * uX + R[2][1] * uY + R[2][2] * uZ;

    const elevation = Math.asin(Math.min(Math.max(eUp, -1), 1));
    if (elevation >= maskRad) {
      // Line of sight vector in ENU coordinates: [-eEast, -eNorth, -eUp, 1]
      GRows.push([-eEast, -eNorth, -eUp, 1.0]);
    }
  }

  if (GRows.length < 4) {
    return { gdop: 99.9, pdop: 99.9, hdop: 99.9, vdop: 99.9, tdop: 99.9, visibleCount: GRows.length };
  }

  // Form G^T * G (4x4 matrix)
  const GTG = new Array(16).fill(0);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      let sum = 0;
      for (let i = 0; i < GRows.length; i++) {
        sum += GRows[i][r] * GRows[i][c];
      }
      GTG[r * 4 + c] = sum;
    }
  }

  const Q = invert4x4(GTG);
  if (!Q) {
    return { gdop: 99.9, pdop: 99.9, hdop: 99.9, vdop: 99.9, tdop: 99.9, visibleCount: GRows.length };
  }

  const q11 = Math.max(0, Q[0]);  // East^2
  const q22 = Math.max(0, Q[5]);  // North^2
  const q33 = Math.max(0, Q[10]); // Up^2
  const q44 = Math.max(0, Q[15]); // Time^2

  const pdop = Math.sqrt(q11 + q22 + q33);
  const gdop = Math.sqrt(q11 + q22 + q33 + q44);
  const hdop = Math.sqrt(q11 + q22);
  const vdop = Math.sqrt(q33);
  const tdop = Math.sqrt(q44);

  return {
    gdop: Math.min(gdop, 99.9),
    pdop: Math.min(pdop, 99.9),
    hdop: Math.min(hdop, 99.9),
    vdop: Math.min(vdop, 99.9),
    tdop: Math.min(tdop, 99.9),
    visibleCount: GRows.length
  };
}

/**
 * Computes global DOP grid over latitude/longitude
 * @param {Array} satPositions - Array of current satellite positions
 * @param {Number} stepDeg - Grid step size in degrees (default 5.0 deg)
 * @param {Number} maskDeg - Elevation mask
 * @returns {Array} Array of grid cell objects { lat, lon, gdop, pdop, hdop, vdop, tdop, visibleCount }
 */
export function computeGlobalDOPGrid(satPositions, stepDeg = 5.0, maskDeg = 10.0) {
  const grid = [];
  for (let lat = -80; lat < 80; lat += stepDeg) {
    for (let lon = -180; lon < 180; lon += stepDeg) {
      const dop = calculateDOPAtLocation(lat, lon, satPositions, maskDeg);
      grid.push({
        lat,
        lon,
        step: stepDeg,
        ...dop
      });
    }
  }
  return grid;
}
