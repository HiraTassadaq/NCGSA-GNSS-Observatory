/**
 * globeAdapter -- the ONE place backend responses get normalized into the
 * shape the globe (and, for consistency, the skyplot) render against:
 *
 *   {
 *     timestamp: string | null,
 *     station: { latitude, longitude, heightM } | null,
 *     satellites: [{
 *       prn, constellation,
 *       x?, y?, z?,                       // ECEF metres, real, from orbit propagation
 *       latitude?, longitude?, altitudeM?, // derived from the same ECEF fix
 *       elevationDeg?, azimuthDeg?,
 *       visible: boolean,
 *       quality?: string,
 *     }],
 *     orbitPaths: [{ prn, constellation, points: [{ x, y, z, time }] }],
 *     orbitDataAvailable: boolean,
 *     unavailableReason?: string,
 *   }
 *
 * IMPORTANT: a satellite only appears with x/y/z/latitude/longitude when
 * `/api/satellites/orbits` actually produced a broadcast-ephemeris fix for
 * it (gnss_backend persists these in LiveData.sat_x/y/z -- see
 * gnss_backend/app/main.py get_satellite_orbits()). This adapter never
 * derives a global position from azimuth/elevation alone -- a satellite
 * with only az/el (no nav-based fix) is left out of `satellites` entirely
 * here; it still belongs on the 2D skyplot, just not on the 3D globe.
 */
import { normalizeSystemName, systemFromPrn } from '../constants/constellations';

export function adaptStation(stationResponse) {
  if (!stationResponse) return null;
  const { lat_deg: latitude, lon_deg: longitude, height_m: heightM } = stationResponse;
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return null;
  }
  return { latitude, longitude, heightM: heightM ?? 0 };
}

export function buildGlobeData({ orbitsResponse, satellitesResponse, stationResponse, timeIndex = -1 }) {
  const qualityByPrn = new Map((satellitesResponse || []).map((s) => [s.prn, s.quality]));
  const station = adaptStation(stationResponse) || (orbitsResponse?.station
    ? { latitude: orbitsResponse.station.lat_deg, longitude: orbitsResponse.station.lon_deg, heightM: orbitsResponse.station.height_m ?? 0 }
    : null);

  if (!orbitsResponse || orbitsResponse.status !== 'ok' || !orbitsResponse.satellites?.length) {
    return {
      timestamp: null,
      station,
      satellites: [],
      orbitPaths: [],
      orbitDataAvailable: false,
      unavailableReason: orbitsResponse?.reason || 'No orbit data available yet.',
    };
  }

  let latestTimestamp = null;
  const satellites = [];
  const orbitPaths = [];

  for (const sat of orbitsResponse.satellites) {
    const constellation = normalizeSystemName(sat.system || systemFromPrn(sat.prn));
    const path = sat.path || [];
    if (!path.length) continue;

    const point = timeIndex >= 0 && timeIndex < path.length ? path[timeIndex] : sat.current || path[path.length - 1];
    if (!point) continue;
    if (!latestTimestamp || point.time > latestTimestamp) latestTimestamp = point.time;

    satellites.push({
      prn: sat.prn,
      constellation,
      x: point.x,
      y: point.y,
      z: point.z,
      latitude: point.latitude,
      longitude: point.longitude,
      altitudeM: point.altitude_m,
      elevationDeg: point.elevation_deg,
      azimuthDeg: point.azimuth_deg,
      visible: Boolean(point.visible),
      quality: qualityByPrn.get(sat.prn),
      time: point.time,
    });

    orbitPaths.push({
      prn: sat.prn,
      constellation,
      points: path.map((p) => ({ x: p.x, y: p.y, z: p.z, time: p.time })),
    });
  }

  return {
    timestamp: latestTimestamp,
    station,
    satellites,
    orbitPaths,
    orbitDataAvailable: true,
    sampleTimes: orbitsResponse.satellites[0]?.path?.map((p) => p.time) || [],
  };
}
