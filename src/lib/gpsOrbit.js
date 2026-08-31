// GPS broadcast-ephemeris orbit propagation, following the standard
// ICD-200 Keplerian algorithm (the same public specification your
// original static-file orbit propagator in Python implements). This
// runs client-side so satellite positions update continuously via
// local computation, not by waiting on new database rows.

const MU = 3.986005e14; // WGS84 Earth gravitational parameter, m^3/s^2
const OMEGA_E_DOT = 7.2921151467e-5; // WGS84 Earth rotation rate, rad/s

// NOTE: field names below are best-guesses based on the standard GPS
// ICD-200 broadcast ephemeris parameter names. We don't have a confirmed
// real GPSNav payload sample yet -- once you paste one (same way we
// confirmed ChannelStatus/GEOIonoDelay), update FIELD_CANDIDATES below
// to match pysbf2's actual key casing if any of these don't resolve.
const FIELD_CANDIDATES = {
  sqrtA: ["SQRT_A", "sqrtA", "SqrtA"],
  e: ["e", "E", "Ecc"],
  i0: ["i0", "I0"],
  OMEGA0: ["OMEGA0", "Omega0", "OMEGA_0"],
  omega: ["omega", "Omega", "ArgOfPerigee"],
  M0: ["M0"],
  deltaN: ["Delta_n", "DeltaN", "deltaN"],
  OMEGADOT: ["OMEGADOT", "OmegaDot", "OMEGA_DOT"],
  iDot: ["IDOT", "iDot", "IDot"],
  Cuc: ["Cuc"],
  Cus: ["Cus"],
  Crc: ["Crc"],
  Crs: ["Crs"],
  Cic: ["Cic"],
  Cis: ["Cis"],
  t_oe: ["t_oe", "Toe", "T_OE"],
  WN: ["WN", "WNc"],
  SVID: ["SVID", "PRN"],
};

function getField(ephemeris, key) {
  for (const candidate of FIELD_CANDIDATES[key]) {
    if (ephemeris[candidate] !== undefined) return ephemeris[candidate];
  }
  return undefined;
}

export function ephemerisComplete(ephemeris) {
  return Object.keys(FIELD_CANDIDATES).every((k) => getField(ephemeris, k) !== undefined);
}

// gpsSeconds: seconds of GPS week (matches TOW/1000 from PVTGeodetic/ReceiverTime)
// Returns ECEF position in meters: { x, y, z }
export function propagateEcef(ephemeris, gpsSeconds) {
  const sqrtA = getField(ephemeris, "sqrtA");
  const e = getField(ephemeris, "e");
  const i0 = getField(ephemeris, "i0");
  const OMEGA0 = getField(ephemeris, "OMEGA0");
  const omega = getField(ephemeris, "omega");
  const M0 = getField(ephemeris, "M0");
  const deltaN = getField(ephemeris, "deltaN");
  const OMEGADOT = getField(ephemeris, "OMEGADOT");
  const iDot = getField(ephemeris, "iDot");
  const Cuc = getField(ephemeris, "Cuc");
  const Cus = getField(ephemeris, "Cus");
  const Crc = getField(ephemeris, "Crc");
  const Crs = getField(ephemeris, "Crs");
  const Cic = getField(ephemeris, "Cic");
  const Cis = getField(ephemeris, "Cis");
  const t_oe = getField(ephemeris, "t_oe");

  const A = sqrtA * sqrtA;
  const n0 = Math.sqrt(MU / (A * A * A));
  let tk = gpsSeconds - t_oe;
  if (tk > 302400) tk -= 604800;
  if (tk < -302400) tk += 604800;

  const n = n0 + deltaN;
  const Mk = M0 + n * tk;

  // Solve Kepler's equation for eccentric anomaly via Newton-Raphson
  let Ek = Mk;
  for (let i = 0; i < 10; i++) {
    Ek = Ek - (Ek - e * Math.sin(Ek) - Mk) / (1 - e * Math.cos(Ek));
  }

  const vk = Math.atan2(Math.sqrt(1 - e * e) * Math.sin(Ek), Math.cos(Ek) - e);
  const Phik = vk + omega;

  const duk = Cus * Math.sin(2 * Phik) + Cuc * Math.cos(2 * Phik);
  const drk = Crs * Math.sin(2 * Phik) + Crc * Math.cos(2 * Phik);
  const dik = Cis * Math.sin(2 * Phik) + Cic * Math.cos(2 * Phik);

  const uk = Phik + duk;
  const rk = A * (1 - e * Math.cos(Ek)) + drk;
  const ik = i0 + dik + iDot * tk;

  const xkPrime = rk * Math.cos(uk);
  const ykPrime = rk * Math.sin(uk);

  const OmegaK = OMEGA0 + (OMEGADOT - OMEGA_E_DOT) * tk - OMEGA_E_DOT * t_oe;

  const xk = xkPrime * Math.cos(OmegaK) - ykPrime * Math.cos(ik) * Math.sin(OmegaK);
  const yk = xkPrime * Math.sin(OmegaK) + ykPrime * Math.cos(ik) * Math.cos(OmegaK);
  const zk = ykPrime * Math.sin(ik);

  return { x: xk, y: yk, z: zk };
}

// Samples a full orbital period around t_oe for drawing the orbit path line.
export function computeOrbitPath(ephemeris, samples = 180) {
  const sqrtA = getField(ephemeris, "sqrtA");
  const t_oe = getField(ephemeris, "t_oe");
  const A = sqrtA * sqrtA;
  const period = 2 * Math.PI * Math.sqrt((A * A * A) / MU); // seconds, ~43080s for GPS MEO

  const points = [];
  for (let i = 0; i <= samples; i++) {
    const t = t_oe - period / 2 + (period * i) / samples;
    points.push(propagateEcef(ephemeris, t));
  }
  return points;
}

// Converts geodetic lat/lon/height (degrees, degrees, meters) to ECEF meters --
// used to place the receiver's own position marker on the globe.
const WGS84_A = 6378137.0;
const WGS84_F = 1 / 298.257223563;
const WGS84_E2 = WGS84_F * (2 - WGS84_F);

export function geodeticToEcef(latDeg, lonDeg, height) {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  const sinLat = Math.sin(lat);
  const N = WGS84_A / Math.sqrt(1 - WGS84_E2 * sinLat * sinLat);
  const x = (N + height) * Math.cos(lat) * Math.cos(lon);
  const y = (N + height) * Math.cos(lat) * Math.sin(lon);
  const z = (N * (1 - WGS84_E2) + height) * sinLat;
  return { x, y, z };
}

// ECEF -> geodetic lat/lon (degrees), using Bowring's closed-form method --
// a standard, well-established public algorithm. Used to find each
// satellite's sub-satellite point (the point directly below it on Earth's
// surface) for the 2D ground-track map.
const WGS84_B = WGS84_A * (1 - WGS84_F);
const WGS84_EP2 = (WGS84_A * WGS84_A - WGS84_B * WGS84_B) / (WGS84_B * WGS84_B);

export function ecefToGeodetic(x, y, z) {
  const lon = Math.atan2(y, x);
  const p = Math.sqrt(x * x + y * y);
  const theta = Math.atan2(z * WGS84_A, p * WGS84_B);
  const sinTheta = Math.sin(theta);
  const cosTheta = Math.cos(theta);

  const lat = Math.atan2(
    z + WGS84_EP2 * WGS84_B * sinTheta * sinTheta * sinTheta,
    p - WGS84_E2 * WGS84_A * cosTheta * cosTheta * cosTheta
  );

  const sinLat = Math.sin(lat);
  const N = WGS84_A / Math.sqrt(1 - WGS84_E2 * sinLat * sinLat);
  const height = p / Math.cos(lat) - N;

  return {
    lat: (lat * 180) / Math.PI,
    lon: (lon * 180) / Math.PI,
    height,
  };
}
