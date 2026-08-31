// Converts a satellite's azimuth/elevation as seen from the receiver into
// an approximate ground sub-point (lat/lon), so it can be plotted on a
// world map instead of an az/el dome. This is the standard "look angle ->
// sub-satellite point" formula used for antenna pointing, assuming a
// nominal orbital altitude per constellation (MEO ~20,200 km for
// GPS/Galileo/BeiDou/QZSS, ~19,100 km for GLONASS, GEO ~35,786 km for
// SBAS). It's an approximation (real orbits aren't perfectly circular)
// but is accurate to within a degree or two for visualization purposes.

const EARTH_RADIUS_KM = 6378.137;

const NOMINAL_ALT_KM = {
  GPS: 20200,
  Galileo: 23222,
  BeiDou: 21528,
  QZSS: 32000, // highly elliptical / geosynchronous inclined
  GLONASS: 19100,
  SBAS: 35786,
  IRNSS: 35786,
  UNKNOWN: 20200,
};

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

export function subPointFromAzEl({ azDeg, elDeg, receiverLat, receiverLon, constellation }) {
  if (elDeg == null || azDeg == null || receiverLat == null || receiverLon == null) return null;
  if (elDeg < 0) return null;

  const h = NOMINAL_ALT_KM[constellation] ?? NOMINAL_ALT_KM.UNKNOWN;
  const Re = EARTH_RADIUS_KM;
  const el = elDeg * D2R;
  const az = azDeg * D2R;
  const latR = receiverLat * D2R;
  const lonR = receiverLon * D2R;

  // Earth central angle between receiver and sub-satellite point
  const psi = Math.PI / 2 - el - Math.asin((Re / (Re + h)) * Math.cos(el));
  if (Number.isNaN(psi) || psi < 0) return null;

  const satLat = Math.asin(
    Math.sin(latR) * Math.cos(psi) + Math.cos(latR) * Math.sin(psi) * Math.cos(az)
  );
  const satLon =
    lonR +
    Math.atan2(
      Math.sin(az) * Math.sin(psi) * Math.cos(latR),
      Math.cos(psi) - Math.sin(latR) * Math.sin(satLat)
    );

  return { lat: satLat * R2D, lon: ((satLon * R2D + 540) % 360) - 180 };
}
