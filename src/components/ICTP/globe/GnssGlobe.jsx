import * as Cesium from 'cesium';
import { forwardRef, memo, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Viewer, Globe } from 'resium';
import GroundStationEntity from './GroundStationEntity';
import SatelliteEntity from './SatelliteEntity';
import OrbitPath from './OrbitPath';
import LineOfSight from './LineOfSight';

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
  } catch {
    return false;
  }
}

let baseLayerSingleton = null;
function getBaseLayer() {
  if (!baseLayerSingleton) {
    const provider = new Cesium.TileMapServiceImageryProvider({
      url: Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII'),
    });
    baseLayerSingleton = new Cesium.ImageryLayer(provider);
  }
  return baseLayerSingleton;
}
const ellipsoidTerrain = new Cesium.EllipsoidTerrainProvider();

const GnssGlobe = forwardRef(function GnssGlobe(
  {
    satellites,
    orbitPaths,
    station,
    selectedPrn,
    onSelectSatellite,
    visibleConstellations,
    showOrbits,
    showLabels,
    showLineOfSight,
  },
  ref,
) {
  const viewerRef = useRef(null);
  const hasFlownRef = useRef(false);
  const measureRef = useRef(null);
  const [ready, setReady] = useState(false);

  // Cesium's Viewer must never be constructed against a 0x0 container --
  // its own internal render loop will crash the very first time it tries to
  // draw a frame at zero size. Rather than construct it eagerly and patch
  // things up afterwards, just wait until this wrapper has a confirmed real
  // size before mounting <Viewer> at all.
  useEffect(() => {
    const el = measureRef.current;
    if (!el) return undefined;
    if (typeof ResizeObserver === 'undefined') {
      setReady(true);
      return undefined;
    }
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (box && box.width > 0 && box.height > 0) setReady(true);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const flyToStation = (duration = 1.2) => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) return;
    if (station) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(station.longitude, station.latitude, 14000000),
        duration,
      });
    } else {
      viewer.camera.flyHome(duration);
    }
  };

  useImperativeHandle(ref, () => ({ resetCamera: () => flyToStation(1.2) }));

  useEffect(() => {
    window.__debugViewer = viewerRef.current?.cesiumElement;
  });

  useEffect(() => {
    if (!hasFlownRef.current && station) {
      hasFlownRef.current = true;
      flyToStation(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(station)]);

  const visibleSats = useMemo(
    () => satellites.filter((s) => visibleConstellations.has(s.constellation)),
    [satellites, visibleConstellations],
  );
  const visiblePaths = useMemo(
    () => (showOrbits ? orbitPaths.filter((p) => visibleConstellations.has(p.constellation)) : []),
    [orbitPaths, visibleConstellations, showOrbits],
  );

  if (!supportsWebGL()) {
    return (
      <div className="flex items-center justify-center h-full text-center p-6 text-sm text-text-muted">
        WebGL is not available in this browser, so the 3D globe cannot render.
        Station and satellite data are still available in the table, skyplot,
        and charts below.
      </div>
    );
  }

  return (
    <div ref={measureRef} className="h-full w-full">
      {ready && (
        <Viewer
          ref={viewerRef}
          full
          timeline={false}
          animation={false}
          baseLayerPicker={false}
          geocoder={false}
          homeButton={false}
          sceneModePicker={false}
          navigationHelpButton={false}
          fullscreenButton={false}
          infoBox={false}
          selectionIndicator={false}
          baseLayer={getBaseLayer()}
          terrainProvider={ellipsoidTerrain}
        >
          <Globe enableLighting baseColor={Cesium.Color.fromCssColorString('#070B14')} />

          {station && <GroundStationEntity station={station} />}

          {visiblePaths.map((p) => (
            <OrbitPath
              key={p.prn}
              prn={p.prn}
              constellation={p.constellation}
              points={p.points}
              highlighted={p.prn === selectedPrn}
            />
          ))}

          {showLineOfSight &&
            station &&
            visibleSats
              .filter((s) => s.visible)
              .map((s) => (
                <LineOfSight key={`los-${s.prn}`} station={station} satellite={s} highlighted={s.prn === selectedPrn} />
              ))}

          {visibleSats.map((s) => (
            <SatelliteEntity
              key={s.prn}
              satellite={s}
              selected={s.prn === selectedPrn}
              showLabel={showLabels}
              onSelect={onSelectSatellite}
            />
          ))}
        </Viewer>
      )}
    </div>
  );
});

export default memo(GnssGlobe);
