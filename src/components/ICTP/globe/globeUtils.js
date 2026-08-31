import * as Cesium from 'cesium';

export function hexToCesiumColor(hex, alpha = 1) {
  return Cesium.Color.fromCssColorString(hex).withAlpha(alpha);
}

export function satelliteToCartesian(sat) {
  if (typeof sat.x === 'number' && typeof sat.y === 'number' && typeof sat.z === 'number') {
    return new Cesium.Cartesian3(sat.x, sat.y, sat.z);
  }
  if (typeof sat.latitude === 'number' && typeof sat.longitude === 'number') {
    return Cesium.Cartesian3.fromDegrees(sat.longitude, sat.latitude, sat.altitudeM || 0);
  }
  return null;
}

export function stationToCartesian(station) {
  if (!station) return null;
  return Cesium.Cartesian3.fromDegrees(station.longitude, station.latitude, station.heightM || 0);
}

export function pathToCartesianArray(points) {
  return points
    .filter((p) => typeof p.x === 'number' && typeof p.y === 'number' && typeof p.z === 'number')
    .map((p) => new Cesium.Cartesian3(p.x, p.y, p.z));
}

/**
 * DEVELOPMENT-ONLY simulated constellation, for exercising the globe UI
 * when the backend has no orbit-capable session loaded (no nav file
 * processed yet, or the API is unreachable during frontend dev). Every
 * entity built from this data is tagged `simulated: true` end-to-end so
 * GnssGlobe/SelectedSatellitePanel can render an unmistakable "SIMULATED"
 * watermark and refuse to let it be confused with live telemetry.
 *
 * Positions are coarse fictitious points spread across representative
 * orbital shells (GPS ~20,200km, GLONASS ~19,100km, Galileo ~23,222km,
 * BeiDou MEO ~21,528km) -- NOT propagated from any real ephemeris. Must
 * never be imported outside of import.meta.env.DEV code paths.
 */
export function generateMockGlobeData(station) {
  const shells = [
    { constellation: 'GPS', altitudeKm: 20200, count: 6 },
    { constellation: 'GLONASS', altitudeKm: 19100, count: 5 },
    { constellation: 'GALILEO', altitudeKm: 23222, count: 5 },
    { constellation: 'BEIDOU', altitudeKm: 21528, count: 5 },
  ];
  const satellites = [];
  let n = 1;
  for (const shell of shells) {
    for (let i = 0; i < shell.count; i += 1) {
      const lon = -180 + (360 / shell.count) * i + (shell.altitudeKm % 30);
      const lat = ((i * 37) % 140) - 70;
      satellites.push({
        prn: `${shell.constellation[0]}${String(n).padStart(2, '0')}`,
        constellation: shell.constellation,
        latitude: lat,
        longitude: lon,
        altitudeM: shell.altitudeKm * 1000,
        elevationDeg: null,
        azimuthDeg: null,
        visible: i % 2 === 0,
        quality: 'Simulated',
        simulated: true,
      });
      n += 1;
    }
  }
  return {
    timestamp: new Date().toISOString(),
    station,
    satellites,
    orbitPaths: [],
    orbitDataAvailable: false,
    simulated: true,
  };
}
