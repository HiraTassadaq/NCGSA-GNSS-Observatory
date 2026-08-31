// SBAS Ionospheric Grid Point (IGP) layout, used to place GEOIonoDelay
// (SBF block 5933 / MT26) readings on a world map the way RxControl's
// "SBAS Ionospheric Delay" view does.
//
// PLACEMENT ACCURACY: MT26 only carries an "IGPMaskNo" index -- the actual
// lat/lon each index refers to is defined by the PRN mask (MT18, decoded
// by Septentrio as SBF block "GEOIGPMask"). If the backend is logging that
// block, useGnssData.js resolves IGPMaskNo to its exact broadcast grid
// point using getBandPoints() below. If a matching mask hasn't arrived yet
// for some PRN/band (e.g. right after startup), it falls back to
// maskToLatLon()'s approximation: the *standard* band layout used by
// WAAS/EGNOS (RTCA DO-229 Annex A) -- 9 equatorial/mid-latitude bands
// (0-8, 40 deg wide, 5 deg spacing inside +-55 deg lat and 10 deg beyond)
// plus north/south polar bands (9, 10) -- with IGPMaskNo mapped onto that
// band's point list by ordinal position. That approximation reproduces
// the overall shape/coverage pattern but individual cells can be offset
// from the true point until a real mask is available.

const MID_LATS = [75, 65, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 0, -5, -10, -15, -20, -25, -30, -35, -40, -45, -50, -55, -65, -75];

function lonStepFor(lat) {
  return Math.abs(lat) > 55 ? 10 : 5;
}

// Builds the ordered list of {lat, lon} points for equatorial/mid bands
// 0-8. Each band is a 40 deg wide longitude sector; points are ordered
// north-to-south, west-to-east within each row (matches DO-229 ordering
// convention).
function buildMidBand(bandIndex) {
  const lonStart = -180 + 40 * bandIndex;
  const lonEnd = lonStart + 40;
  const points = [];
  for (const lat of MID_LATS) {
    const step = lonStepFor(lat);
    for (let lon = lonStart; lon < lonEnd; lon += step) {
      points.push({ lat, lon: ((lon + 540) % 360) - 180 });
    }
  }
  return points;
}

function buildPolarBand(hemisphereSign) {
  const lat85 = 85 * hemisphereSign;
  const points = [];
  for (let lon = -180; lon < 180; lon += 30) {
    points.push({ lat: lat85, lon });
  }
  points.push({ lat: 90 * hemisphereSign, lon: 0 });
  return points;
}

const BAND_POINTS = {};
for (let b = 0; b <= 8; b++) BAND_POINTS[b] = buildMidBand(b);
BAND_POINTS[9] = buildPolarBand(1); // north polar cap
BAND_POINTS[10] = buildPolarBand(-1); // south polar cap

export function maskToLatLon(band, maskNo) {
  const points = BAND_POINTS[band];
  if (!points || !points.length || maskNo == null) return null;
  const idx = (maskNo - 1) % points.length;
  return points[idx < 0 ? idx + points.length : idx];
}

// Full ordered point list for a band, exposed so callers with real MT18
// mask data (GEOIGPMask) can index into it directly instead of using the
// maskToLatLon() ordinal-fallback approximation above.
export function getBandPoints(band) {
  return BAND_POINTS[band] || [];
}

// Half-width/half-height (in degrees) of the grid cell centered on a given
// point, so the map view can draw abutting rectangles (a proper tiled
// heatmap) instead of floating circular blobs.
export function cellSizeFor(lat) {
  const isPolar = Math.abs(lat) >= 85;
  if (isPolar) return { halfLon: 15, halfLat: 5 };
  const lonStep = lonStepFor(lat);
  const latStep = Math.abs(lat) > 55 ? 10 : 5;
  return { halfLon: lonStep / 2, halfLat: latStep / 2 };
}

// GIVEI 15 means "not monitored" per WAAS/EGNOS MOPS (DO-229 Appendix A).
export function isNotMonitored(givei) {
  return givei === 15;
}

// 0-10m color ramp matching the reference SBAS ionospheric delay legend:
// deep blue (0m) -> cyan -> green -> yellow -> red (>=10m).
const STOPS = [
  { m: 0, c: [0, 0, 160] },
  { m: 2, c: [0, 190, 230] },
  { m: 4, c: [0, 210, 120] },
  { m: 6, c: [230, 220, 0] },
  { m: 8, c: [255, 140, 0] },
  { m: 10, c: [220, 20, 20] },
];

export function colorForDelay(meters) {
  if (meters == null || Number.isNaN(meters)) return "rgb(100,110,130)";
  const v = Math.max(0, Math.min(10, meters));
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (v >= a.m && v <= b.m) {
      const t = (v - a.m) / (b.m - a.m);
      const r = Math.round(a.c[0] + (b.c[0] - a.c[0]) * t);
      const g = Math.round(a.c[1] + (b.c[1] - a.c[1]) * t);
      const bl = Math.round(a.c[2] + (b.c[2] - a.c[2]) * t);
      return `rgb(${r},${g},${bl})`;
    }
  }
  return "rgb(220,20,20)";
}

export const IONO_LEGEND_STOPS = STOPS;