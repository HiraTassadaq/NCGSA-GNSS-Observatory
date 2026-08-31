import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Panel from '../common/Panel';
import Badge from '../common/Badge';
import { LoadingState, ErrorState } from '../common/AsyncStates';
import GlobeControls from './GlobeControls';
import SelectedSatellitePanel from './SelectedSatellitePanel';
import { adaptStation, buildGlobeData } from './globeAdapter';
import { generateMockGlobeData } from './globeUtils';
import { CONSTELLATIONS } from '../constants/constellations';
import { useSelection } from '../ictp_state/SelectionContext';
import { useOrbits } from '../hooks/useGnssData';

const GnssGlobe = lazy(() => import('./GnssGlobe'));

const ALLOW_DEV_MOCK = import.meta.env.DEV;

export default function GlobeSection({ stationResponse, satellitesResponse, refetchToken }) {
  const { selectedPrn, setSelectedPrn } = useSelection();
  const [minElevation, setMinElevation] = useState(10);
  const { data: orbitsResponse, loading, error } = useOrbits(minElevation, refetchToken);

  const [visibleConstellations, setVisibleConstellations] = useState(() => new Set(CONSTELLATIONS));
  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showLineOfSight, setShowLineOfSight] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useMock, setUseMock] = useState(false);

  const containerRef = useRef(null);
  const globeRef = useRef(null);

  const toggleConstellation = (sys) => {
    setVisibleConstellations((prev) => {
      const next = new Set(prev);
      if (next.has(sys)) next.delete(sys);
      else next.add(sys);
      return next;
    });
  };

  const globeData = useMemo(() => {
    if (useMock) return generateMockGlobeData(adaptStation(stationResponse));
    return buildGlobeData({ orbitsResponse, satellitesResponse, stationResponse, timeIndex: -1 });
  }, [useMock, orbitsResponse, satellitesResponse, stationResponse]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current?.requestFullscreen?.();
    }
  };

  const selectedSatellite = globeData.satellites.find((s) => s.prn === selectedPrn) || null;

  return (
    <Panel
      className="h-full"
      bodyClassName="p-0 relative"
      title="3D Constellation View"
      subtitle={globeData.station ? 'ICTP/GRAL Islamabad, Pakistan' : 'Station position unavailable'}
      actions={
        !globeData.orbitDataAvailable && !useMock ? (
          <Badge tone="warning">Orbit data unavailable</Badge>
        ) : useMock ? (
          <Badge tone="warning">Simulated (dev only)</Badge>
        ) : error && globeData.orbitDataAvailable ? (
          <Badge tone="warning" title={error.message}>Offline · last known data</Badge>
        ) : null
      }
    >
      <div ref={containerRef} className="relative h-full min-h-[420px] bg-black/40 flex flex-col">
        <GlobeControls
          visibleConstellations={visibleConstellations}
          onToggleConstellation={toggleConstellation}
          showOrbits={showOrbits}
          onToggleOrbits={() => setShowOrbits((v) => !v)}
          showLabels={showLabels}
          onToggleLabels={() => setShowLabels((v) => !v)}
          showLineOfSight={showLineOfSight}
          onToggleLineOfSight={() => setShowLineOfSight((v) => !v)}
          minElevation={minElevation}
          onMinElevationChange={setMinElevation}
          onResetCamera={() => globeRef.current?.resetCamera()}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />

        <div className="relative flex-1 min-h-0">
          {loading && !orbitsResponse && <LoadingState label="Loading orbit data..." />}
          {/* Only show the error overlay when we've never gotten orbit data
              at all -- a failed poll after the globe is already populated
              (e.g. connection dropped) should keep showing the last known
              satellite positions instead of covering the globe. */}
          {!orbitsResponse && !loading && error && <ErrorState detail={error.message} />}

          {!loading && !error && !globeData.orbitDataAvailable && !useMock && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6 z-10 pointer-events-none">
              <p className="text-sm font-medium text-text-primary">Orbit data unavailable</p>
              <p className="text-xs text-text-muted max-w-md">{globeData.unavailableReason}</p>
              {ALLOW_DEV_MOCK && (
                <button
                  type="button"
                  onClick={() => setUseMock(true)}
                  className="pointer-events-auto text-xs px-3 py-1.5 rounded-md border border-border bg-white/5 text-text-muted hover:text-text-primary"
                >
                  Show simulated constellation (dev only)
                </button>
              )}
            </div>
          )}

          {useMock && (
            <button
              type="button"
              onClick={() => setUseMock(false)}
              className="absolute bottom-3 left-3 z-10 text-xs px-3 py-1.5 rounded-md border border-warning/40 bg-warning/10 text-warning"
            >
              Exit simulated view
            </button>
          )}

          <Suspense fallback={<LoadingState label="Loading 3D globe..." />}>
            <GnssGlobe
              ref={globeRef}
              satellites={globeData.satellites}
              orbitPaths={globeData.orbitPaths}
              station={globeData.station}
              selectedPrn={selectedPrn}
              onSelectSatellite={setSelectedPrn}
              visibleConstellations={visibleConstellations}
              showOrbits={showOrbits}
              showLabels={showLabels}
              showLineOfSight={showLineOfSight}
            />
          </Suspense>

          <SelectedSatellitePanel satellite={selectedSatellite} onClose={() => setSelectedPrn(null)} />
        </div>
      </div>
    </Panel>
  );
}
