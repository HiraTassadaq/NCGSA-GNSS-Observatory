/**
 * Global Ionospheric TEC (Total Electron Content) Model
 * Implements Klobuchar Model (GPS ICD-200) to derive VTEC across global latitude/longitude.
 */

const DEG2RAD = Math.PI / 180;
const SPEED_OF_LIGHT = 299792458.0;

/**
 * Calculates Vertical TEC (VTEC in TECU) at given Lat/Lon for a specific UTC Time
 * @param {Number} latDeg - Latitude (-90 to 90)
 * @param {Number} lonDeg - Longitude (-180 to 180)
 * @param {Date} utcTime - Date object
 * @param {Object} ionoParams - { alpha: [4], beta: [4] }
 * @returns {Number} VTEC value in TECU (0 to 100+)
 */
export function calculateKlobucharVTEC(latDeg, lonDeg, utcTime, ionoParams) {
  const alpha = (ionoParams && ionoParams.alpha) || [0.1118e-07, 0.2235e-07, -0.5960e-07, -0.1192e-06];
  const beta  = (ionoParams && ionoParams.beta)  || [0.9830e+05, 0.6554e+05, -0.1966e+06, -0.6554e+05];

  // User position in semi-circles
  const phiU = latDeg / 180.0;
  const lambdaU = lonDeg / 180.0;

  // Geomagnetic latitude of sub-ionospheric point (semi-circles)
  const phiM = phiU + 0.064 * Math.cos((lambdaU - 1.617) * Math.PI);

  // Local solar time in seconds (43200 s = 12h)
  const utcSec = utcTime.getUTCHours() * 3600 + utcTime.getUTCMinutes() * 60 + utcTime.getUTCSeconds();
  let tLocal = 43200.0 * lambdaU + utcSec;
  tLocal = (tLocal % 86400 + 86400) % 86400;

  // Ionospheric Amplitude A_iono (seconds)
  let A = alpha[0] + alpha[1] * phiM + alpha[2] * Math.pow(phiM, 2) + alpha[3] * Math.pow(phiM, 3);
  if (A < 0) A = 0;

  // Ionospheric Period P_iono (seconds)
  let P = beta[0] + beta[1] * phiM + beta[2] * Math.pow(phiM, 2) + beta[3] * Math.pow(phiM, 3);
  if (P < 72000) P = 72000;

  // Phase X_iono (radians)
  const X = (2.0 * Math.PI * (tLocal - 50400.0)) / P;

  // Slant / Vertical Delay T_vtec (seconds of L1 delay)
  let delaySec = 5e-9; // Nighttime baseline delay (5 ns)
  if (Math.abs(X) < 1.57079632679) { // |X| < pi/2
    delaySec += A * (1.0 - Math.pow(X, 2) / 2.0 + Math.pow(X, 4) / 24.0);
  }

  // Convert L1 delay in seconds to L1 delay in meters
  const delayMeters = delaySec * SPEED_OF_LIGHT;

  // Convert L1 delay in meters to VTEC in TECU (1 TECU approx 0.162 m of L1 delay)
  const vtecTECU = delayMeters / 0.162;

  return Math.max(0, Math.min(120, vtecTECU));
}

/**
 * Computes global TEC grid
 */
export function computeGlobalTECGrid(utcTime, ionoParams, stepDeg = 6.0) {
  const grid = [];
  for (let lat = -80; lat < 80; lat += stepDeg) {
    for (let lon = -180; lon < 180; lon += stepDeg) {
      const vtec = calculateKlobucharVTEC(lat, lon, utcTime, ionoParams);
      grid.push({
        lat,
        lon,
        step: stepDeg,
        vtec
      });
    }
  }
  return grid;
}
