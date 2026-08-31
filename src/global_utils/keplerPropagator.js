/**
 * Keplerian Orbit Propagator derived from Broadcast Ephemeris
 * Computes ECEF position (X, Y, Z meters) and Geodetic (Lat, Lon, Alt) for any satellite at any epoch.
 */

// WGS-84 Constants
const MU = 3.986005e14;          // WGS-84 Earth gravitational constant (m^3/s^2)
const OMEGA_E = 7.2921151467e-5; // WGS-84 Earth rotation rate (rad/s)
const A_WGS84 = 6378137.0;       // Semi-major axis of Earth (m)
const F_WGS84 = 1 / 298.257223563; // Earth flattening factor
const B_WGS84 = A_WGS84 * (1 - F_WGS84);
const E2_WGS84 = (A_WGS84 * A_WGS84 - B_WGS84 * B_WGS84) / (A_WGS84 * A_WGS84);

/**
 * Solves Kepler's Equation for Eccentric Anomaly E:
 * M = E - e * sin(E)
 */
function solveKepler(M, e) {
  let E = M;
  for (let i = 0; i < 15; i++) {
    const f = E - e * Math.sin(E) - M;
    const fPrime = 1 - e * Math.cos(E);
    const delta = f / fPrime;
    E -= delta;
    if (Math.abs(delta) < 1e-12) break;
  }
  return E;
}

/**
 * Propagate Satellite ECEF position from Broadcast Ephemeris
 * @param {Object} ephem - Ephemeris object parsed from RINEX
 * @param {Date} targetTime - Date object for desired epoch
 * @returns {Object} { x, y, z, lat, lon, alt, velocity, prn, constellation, isHealthy, healthText }
 */
export function propagateSatellite(ephem, targetTime) {
  if (!ephem || !ephem.sqrtA || ephem.sqrtA === 0) {
    return null;
  }

  const sqrtA = ephem.sqrtA;
  const A = sqrtA * sqrtA; // Semi-major axis (m)
  const e = ephem.e;       // Eccentricity

  // 1. Mean Motion
  const n0 = Math.sqrt(MU / (A * A * A));
  const n = n0 + ephem.deltaN;

  // 2. Time difference tk from epoch (in seconds)
  // Ephemeris toe is in seconds of GPS week
  let tk = (targetTime.getTime() - ephem.epoch.getTime()) / 1000.0;
  
  // Account for week crossover (+- 302400 s)
  if (tk > 302400) tk -= 604800;
  if (tk < -302400) tk += 604800;

  // 3. Mean Anomaly
  let M = ephem.m0 + n * tk;
  M = (M + 2 * Math.PI) % (2 * Math.PI);

  // 4. Eccentric Anomaly E
  const E = solveKepler(M, e);

  // 5. True Anomaly nu
  const sinE = Math.sin(E);
  const cosE = Math.cos(E);
  const sinNu = (Math.sqrt(1 - e * e) * sinE) / (1 - e * cosE);
  const cosNu = (cosE - e) / (1 - e * cosE);
  const nu = Math.atan2(sinNu, cosNu);

  // 6. Argument of Latitude Phi
  const Phi = nu + ephem.omega;

  // 7. Second Harmonic Corrections
  const sin2Phi = Math.sin(2 * Phi);
  const cos2Phi = Math.cos(2 * Phi);

  const deltaU = ephem.cuc * cos2Phi + ephem.cus * sin2Phi;
  const deltaR = ephem.crc * cos2Phi + ephem.crs * sin2Phi;
  const deltaI = ephem.cic * cos2Phi + ephem.cis * sin2Phi;

  // 8. Corrected Argument of Latitude, Radius, and Inclination
  const u = Phi + deltaU;
  const r = A * (1 - e * cosE) + deltaR;
  const i = ephem.i0 + ephem.idot * tk + deltaI;

  // 9. Orbital Plane Position
  const xPrime = r * Math.cos(u);
  const yPrime = r * Math.sin(u);

  // 10. Corrected Longitude of Ascending Node Omega
  let Omega = ephem.omega0 + (ephem.omegaDot - OMEGA_E) * tk - OMEGA_E * ephem.toe;
  Omega = (Omega + 2 * Math.PI) % (2 * Math.PI);

  // 11. ECEF Position (X, Y, Z in meters)
  const cosOmega = Math.cos(Omega);
  const sinOmega = Math.sin(Omega);
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);

  const X = xPrime * cosOmega - yPrime * cosI * sinOmega;
  const Y = xPrime * sinOmega + yPrime * cosI * cosOmega;
  const Z = yPrime * sinI;

  // 12. Convert ECEF to Geodetic (Lat, Lon, Alt)
  const p = Math.sqrt(X * X + Y * Y);
  let lat = Math.atan2(Z, p * (1 - E2_WGS84));
  let lon = Math.atan2(Y, X);
  let N = A_WGS84;
  let alt = 0;

  for (let iter = 0; iter < 5; iter++) {
    const sinLat = Math.sin(lat);
    N = A_WGS84 / Math.sqrt(1 - E2_WGS84 * sinLat * sinLat);
    alt = p / Math.cos(lat) - N;
    lat = Math.atan2(Z, p * (1 - E2_WGS84 * (N / (N + alt))));
  }

  const latDeg = (lat * 180) / Math.PI;
  const lonDeg = (lon * 180) / Math.PI;

  return {
    prn: ephem.prn,
    constellation: ephem.constellation,
    isHealthy: ephem.isHealthy,
    healthText: ephem.healthText,
    x: X,
    y: Y,
    z: Z,
    lat: latDeg,
    lon: lonDeg,
    alt: alt, // meters
    epoch: ephem.epoch,
    clockBias: ephem.af0 + ephem.af1 * tk + ephem.af2 * tk * tk,
    inclinationDeg: (i * 180) / Math.PI
  };
}

/**
 * Generate ground track trail points for a satellite over a time window (+- hours)
 */
export function generateGroundTrack(ephem, currentTime, hoursBefore = 3, hoursAfter = 3, stepMinutes = 10) {
  const points = [];
  const startMs = currentTime.getTime() - hoursBefore * 3600 * 1000;
  const endMs = currentTime.getTime() + hoursAfter * 3600 * 1000;
  const stepMs = stepMinutes * 60 * 1000;

  for (let tMs = startMs; tMs <= endMs; tMs += stepMs) {
    const pos = propagateSatellite(ephem, new Date(tMs));
    if (pos) {
      points.push({ lat: pos.lat, lon: pos.lon, alt: pos.alt, x: pos.x, y: pos.y, z: pos.z, time: new Date(tMs) });
    }
  }
  return points;
}
