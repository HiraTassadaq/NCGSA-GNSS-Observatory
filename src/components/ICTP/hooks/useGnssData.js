import { useMemo } from 'react';
import { api } from '../ictp_lib/api';
import { useApiResource } from './useApiResource';

// Thin, named wrappers around useApiResource so each dashboard section
// only depends on the one endpoint it actually needs, and so the polling
// cadence per endpoint is declared in one obvious place.
//
// The heavy endpoints below (everything except status) now get their
// freshness primarily from useDashboardData's websocket + version-gate
// refetchToken (see useDashboardData.js / useLiveVersion.js) -- this fixed
// interval is only a safety net for the case where BOTH the websocket and
// the status poll miss an update, so it's deliberately long rather than
// driving the main refresh cadence itself.

export function useStation(refetchToken) {
  return useApiResource(api.station, { intervalMs: 120000, refetchToken, cacheKey: 'station' });
}

export function useSatellites(refetchToken) {
  return useApiResource(api.satellites, { intervalMs: 120000, refetchToken, cacheKey: 'satellites' });
}

export function useSkyplot(refetchToken) {
  return useApiResource(api.skyplot, { intervalMs: 120000, refetchToken, cacheKey: 'skyplot' });
}

export function useSatellitesInView(refetchToken) {
  return useApiResource(api.satellitesInView, { intervalMs: 120000, refetchToken, cacheKey: 'satellites-in-view' });
}

export function useDopHistory(refetchToken) {
  return useApiResource(api.dopHistory, { intervalMs: 120000, refetchToken, cacheKey: 'dop-history' });
}

export function useOrbits(minElevationDeg, refetchToken) {
  const fetchFn = useMemo(() => (opts) => api.orbits(minElevationDeg, opts), [minElevationDeg]);
  // Cached per elevation value so the 2D Orbit Map / Iono Map / 3D globe all
  // show their last-known orbit data immediately -- even on a first-ever
  // mount while offline (e.g. opening the "2D Orbit Map" floating panel for
  // the first time after the connection already dropped) -- instead of a
  // blank/empty panel with nothing to fall back on.
  return useApiResource(fetchFn, { intervalMs: 120000, refetchToken, cacheKey: `orbits-${minElevationDeg}` });
}

// This IS the cheap poll useLiveVersion relies on to detect new data -- kept
// short and unchanged. Not cached to disk since it's cheap to refetch and
// its `version` field is what everything else keys off of.
export function useSystemStatus(refetchToken) {
  return useApiResource(api.status, { intervalMs: 10000, refetchToken });
}
