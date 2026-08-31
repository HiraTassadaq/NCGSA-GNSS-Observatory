import { useMemo } from 'react';
import { useLiveSocket } from './useLiveSocket';
import { useSatellites, useSatellitesInView, useDopHistory, useSkyplot, useStation } from './useGnssData';
import { useLiveVersion } from './useLiveVersion';

/**
 * Single place every top-level REST poll happens for the endpoints shared
 * across multiple dashboard sections (station, satellites, skyplot,
 * satellites-in-view, status). Each is fetched exactly once here and
 * passed down as props, instead of every panel independently polling the
 * same endpoint. `/api/satellites/orbits` is the one exception -- it's
 * parameterized by the globe's own elevation-mask UI state, so GlobeSection
 * calls useOrbits itself.
 *
 * Refetching the heavy endpoints is gated on two independent signals so
 * neither one alone is a single point of failure:
 *  - a real websocket LIVE_UPDATE/NAV_UPDATE event (near-instant), and
 *  - useLiveVersion's cheap /api/status poll noticing `version` advanced
 *    (catches the case where the websocket drops).
 * Each hook still keeps its own long fallback interval (see useGnssData.js)
 * as a last-resort safety net -- but that interval no longer does the main
 * work of noticing new data, which used to mean every panel re-fetched its
 * full payload on a timer regardless of whether anything had changed.
 */
export function useDashboardData() {
  const { status: wsStatus, lastEvent } = useLiveSocket();
  const wsRefetchToken = useMemo(
    () => (lastEvent ? `${lastEvent.type}-${lastEvent.source_file || lastEvent.nav_file}` : null),
    [lastEvent],
  );

  const { systemStatus, versionToken } = useLiveVersion(wsRefetchToken);

  // Concatenated (not `||`) -- once wsRefetchToken is ever non-null, `||`
  // would permanently mask later versionToken changes.
  const refetchToken = `${wsRefetchToken ?? ''}|${versionToken ?? ''}`;

  const station = useStation(refetchToken);
  const satellites = useSatellites(refetchToken);
  const skyplot = useSkyplot(refetchToken);
  const satellitesInView = useSatellitesInView(refetchToken);
  const dopHistory = useDopHistory(refetchToken);

  return useMemo(
    () => ({ wsStatus, lastEvent, refetchToken, station, satellites, skyplot, satellitesInView, dopHistory, systemStatus }),
    [wsStatus, lastEvent, refetchToken, station, satellites, skyplot, satellitesInView, dopHistory, systemStatus],
  );
}
