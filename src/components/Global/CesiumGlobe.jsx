import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as Cesium from 'cesium';
import { computeGlobalDOPGrid } from '../../utils/dopCalculator';
import { computeGlobalTECGrid } from '../../utils/tecCalculator';
import '../../dashboard/Stylesheet/global.css';// Constellation Colors
export const CONSTELLATION_COLORS = {
  GPS: '#3b82f6',     // Vibrant Blue
  GLONASS: '#ef4444', // Red
  Galileo: '#10b981', // Emerald Green
  BeiDou: '#f59e0b',  // Amber / Orange
  QZSS: '#8b5cf6',    // Purple
  SBAS: '#ec4899',    // Pink
  IRNSS: '#06b6d4'   // Cyan
};

export const DOP_COLORS = {
  excellent: '#10b981', // < 2.0 Green
  good: '#84cc16',      // 2.0 - 3.0 Lime
  moderate: '#eab308',  // 3.0 - 5.0 Yellow
  fair: '#f97316',      // 5.0 - 8.0 Orange
  poor: '#ef4444'       // > 8.0 Red
};

const CesiumGlobe = forwardRef(({
  satellitesPos = [],
  rawEphemerisList = [],
  currentTime = new Date(),
  selectedSatellite = null,
  onSelectSatellite = () => {},
  showSatellites = true,
  showOrbits = true,
  showHealthWarnings = true,
  showDOPMap = false,
  dopType = 'gdop',
  elevationMask = 10.0,
  showTECMap = false,
  ionoParams = null,
  constellationFilter = { GPS: true, GLONASS: true, Galileo: true, BeiDou: true, QZSS: true, SBAS: true, IRNSS: true }
}, ref) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const entitiesMapRef = useRef(new Map());
  const dopEntitiesRef = useRef([]);
  const tecEntitiesRef = useRef([]);

  const [cesiumReady, setCesiumReady] = useState(false);

  // Expose screenshot capture function to parent ref
  useImperativeHandle(ref, () => ({
    captureScreenshot: () => {
      if (!viewerRef.current) return null;
      viewerRef.current.render();
      const canvas = viewerRef.current.canvas;
      return canvas.toDataURL('image/png');
    },
    flyToSatellite: (prn) => {
      if (!viewerRef.current || !entitiesMapRef.current.has(prn)) return;
      const entity = entitiesMapRef.current.get(prn);
      viewerRef.current.flyTo(entity, { duration: 1.5, offset: new Cesium.HeadingPitchRange(0, -Math.PI / 4, 15000000) });
    }
  }));

  // 1. Initialize Cesium Viewer
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    // 1. Initialize Cesium Viewer with UrlTemplateImageryProvider (compatible with all CesiumJS versions)
    let viewer;
    try {
      const imageryProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        maximumLevel: 19,
        credit: '© OpenStreetMap contributors'
      });

      viewer = new Cesium.Viewer(containerRef.current, {
        animation: false,
        timeline: false,
        geocoder: false,
        homeButton: true,
        sceneModePicker: true,
        navigationHelpButton: false,
        baseLayerPicker: false,
        fullscreenButton: true,
        infoBox: false,
        selectionIndicator: true,
        shadows: false,
        shouldAnimate: false,
        baseLayer: new Cesium.ImageryLayer(imageryProvider),
        terrainProvider: new Cesium.EllipsoidTerrainProvider()
      });
    } catch (err) {
      console.warn('Fallback viewer initialization:', err);
      viewer = new Cesium.Viewer(containerRef.current, {
        animation: false,
        timeline: false,
        geocoder: false,
        homeButton: true,
        navigationHelpButton: false,
        baseLayerPicker: true,
        infoBox: false,
        selectionIndicator: true
      });
    }

    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.depthTestAgainstTerrain = false;
    viewer.scene.globe.atmosphereBrightnessShift = 0.2;

    // Adjust camera initial view to show full Earth
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(0, 20, 25000000), // 25,000 km altitude
      orientation: {
        heading: 0.0,
        pitch: Cesium.Math.toRadians(-85.0),
        roll: 0.0
      }
    });

    // Handle Click Selection
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click) => {
      const pickedObject = viewer.scene.pick(click.position);
      if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.satData) {
        onSelectSatellite(pickedObject.id.satData);
      } else {
        onSelectSatellite(null);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    viewerRef.current = viewer;
    setCesiumReady(true);

    return () => {
      handler.destroy();
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  // 2. Render & Update Satellites, Orbit Trails, Health Warnings
  useEffect(() => {
    if (!viewerRef.current || !cesiumReady) return;
    const viewer = viewerRef.current;

    // Filter active satellites
    const activeSats = satellitesPos.filter(s => s && constellationFilter[s.constellation]);

    // Track active PRNs
    const activePrns = new Set(activeSats.map(s => s.prn));

    // Remove obsolete satellite entities
    for (const [prn, entity] of entitiesMapRef.current.entries()) {
      if (!activePrns.has(prn) || !showSatellites) {
        viewer.entities.remove(entity);
        entitiesMapRef.current.delete(prn);
      }
    }

    if (!showSatellites) return;

    // Create or update entities
    activeSats.forEach((sat) => {
      const cartesian = Cesium.Cartesian3.fromElements(sat.x, sat.y, sat.z);
      const mainColorHex = CONSTELLATION_COLORS[sat.constellation] || '#ffffff';
      const color = Cesium.Color.fromCssColorString(mainColorHex);
      const isSelected = selectedSatellite && selectedSatellite.prn === sat.prn;

      if (!entitiesMapRef.current.has(sat.prn)) {
        // Create new Satellite Entity
        const entity = viewer.entities.add({
          id: sat.prn,
          name: `${sat.constellation} ${sat.prn}`,
          position: cartesian,
          point: {
            pixelSize: isSelected ? 16 : (sat.isHealthy ? 10 : 12),
            color: sat.isHealthy ? color : Cesium.Color.RED,
            outlineColor: isSelected ? Cesium.Color.YELLOW : (sat.isHealthy ? Cesium.Color.WHITE : Cesium.Color.YELLOW),
            outlineWidth: isSelected ? 3 : 2
          },
          label: {
            text: sat.prn,
            font: '12px sans-serif',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            outlineColor: Cesium.Color.BLACK,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -12),
            fillColor: sat.isHealthy ? color : Cesium.Color.RED
          },
          satData: sat
        });

        entitiesMapRef.current.set(sat.prn, entity);
      } else {
        // Update existing Entity
        const entity = entitiesMapRef.current.get(sat.prn);
        entity.position = cartesian;
        entity.satData = sat;
        entity.point.pixelSize = isSelected ? 16 : (sat.isHealthy ? 10 : 12);
        entity.point.color = sat.isHealthy ? color : Cesium.Color.RED;
        entity.point.outlineColor = isSelected ? Cesium.Color.YELLOW : (sat.isHealthy ? Cesium.Color.WHITE : Cesium.Color.YELLOW);
        entity.point.outlineWidth = isSelected ? 3 : 2;
        entity.label.fillColor = sat.isHealthy ? color : Cesium.Color.RED;
      }
    });

  }, [satellitesPos, showSatellites, selectedSatellite, constellationFilter, cesiumReady]);

  // 3. Render Global DOP Heatmap Layer
  useEffect(() => {
    if (!viewerRef.current || !cesiumReady) return;
    const viewer = viewerRef.current;

    // Clear old DOP grid entities
    dopEntitiesRef.current.forEach(e => viewer.entities.remove(e));
    dopEntitiesRef.current = [];

    if (!showDOPMap || satellitesPos.length === 0) return;

    // Compute DOP Grid (5 deg step for smooth performance)
    const dopGrid = computeGlobalDOPGrid(satellitesPos, 5.0, elevationMask);

    dopGrid.forEach((cell) => {
      const val = cell[dopType] || cell.gdop || 99.9;
      
      // Determine color
      let colorHex = DOP_COLORS.excellent;
      let alpha = 0.4;
      if (val > 8.0) { colorHex = DOP_COLORS.poor; alpha = 0.55; }
      else if (val > 5.0) { colorHex = DOP_COLORS.fair; alpha = 0.5; }
      else if (val > 3.0) { colorHex = DOP_COLORS.moderate; alpha = 0.45; }
      else if (val > 2.0) { colorHex = DOP_COLORS.good; alpha = 0.4; }

      const west = Math.max(-180, Math.min(179.9, cell.lon));
      const east = Math.max(-179.9, Math.min(180, cell.lon + cell.step));
      const south = Math.max(-89.9, Math.min(89.9, cell.lat));
      const north = Math.max(-89.9, Math.min(89.9, cell.lat + cell.step));

      const entity = viewer.entities.add({
        rectangle: {
          coordinates: Cesium.Rectangle.fromDegrees(west, south, east, north),
          material: Cesium.Color.fromCssColorString(colorHex).withAlpha(alpha),
          height: 5000 // 5km above surface
        }
      });
      dopEntitiesRef.current.push(entity);
    });

  }, [showDOPMap, dopType, satellitesPos, elevationMask, cesiumReady]);

  // 4. Render Global Ionospheric TEC Shell Layer
  useEffect(() => {
    if (!viewerRef.current || !cesiumReady) return;
    const viewer = viewerRef.current;

    // Clear old TEC shell entities
    tecEntitiesRef.current.forEach(e => viewer.entities.remove(e));
    tecEntitiesRef.current = [];

    if (!showTECMap) return;

    // Compute TEC Grid at ~350-400km altitude
    const tecGrid = computeGlobalTECGrid(currentTime, ionoParams, 6.0);

    tecGrid.forEach((cell) => {
      const tec = cell.vtec; // 0 to 100 TECU
      
      // Map VTEC to smooth blue-yellow-red scale
      let color;
      if (tec < 15) {
        color = Cesium.Color.fromCssColorString('#3b82f6').withAlpha(0.25); // Quiet ionosphere
      } else if (tec < 30) {
        color = Cesium.Color.fromCssColorString('#10b981').withAlpha(0.35);
      } else if (tec < 50) {
        color = Cesium.Color.fromCssColorString('#eab308').withAlpha(0.45);
      } else if (tec < 75) {
        color = Cesium.Color.fromCssColorString('#f97316').withAlpha(0.55);
      } else {
        color = Cesium.Color.fromCssColorString('#ef4444').withAlpha(0.65); // High TEC Peak
      }

      const west = Math.max(-180, Math.min(179.9, cell.lon));
      const east = Math.max(-179.9, Math.min(180, cell.lon + cell.step));
      const south = Math.max(-89.9, Math.min(89.9, cell.lat));
      const north = Math.max(-89.9, Math.min(89.9, cell.lat + cell.step));

      const entity = viewer.entities.add({
        rectangle: {
          coordinates: Cesium.Rectangle.fromDegrees(west, south, east, north),
          material: color,
          height: 350000 // 350 km altitude ionosphere F2 shell
        }
      });
      tecEntitiesRef.current.push(entity);
    });

  }, [showTECMap, currentTime, ionoParams, cesiumReady]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
      
      {/* Overlay Legend */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '12px',
        padding: '12px 16px',
        color: '#fff',
        zIndex: 10,
        fontSize: '0.82rem'
      }}>
        <div style={{ fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
          Constellations
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {Object.entries(CONSTELLATION_COLORS).map(([name, hex]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: hex, display: 'inline-block' }} />
              <span>{name}</span>
            </div>
          ))}
        </div>

        {showDOPMap && (
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ fontWeight: '700', marginBottom: '6px', color: '#94a3b8' }}>
              {dopType.toUpperCase()} Map Scale
            </div>
            <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem' }}>
              <span style={{ padding: '2px 6px', borderRadius: '4px', background: DOP_COLORS.excellent, color: '#000', fontWeight: '700' }}>&lt;2.0 Exc</span>
              <span style={{ padding: '2px 6px', borderRadius: '4px', background: DOP_COLORS.good, color: '#000', fontWeight: '700' }}>2-3 Good</span>
              <span style={{ padding: '2px 6px', borderRadius: '4px', background: DOP_COLORS.moderate, color: '#000', fontWeight: '700' }}>3-5 Mod</span>
              <span style={{ padding: '2px 6px', borderRadius: '4px', background: DOP_COLORS.poor, color: '#fff', fontWeight: '700' }}>&gt;8 Poor</span>
            </div>
          </div>
        )}

        {showTECMap && (
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ fontWeight: '700', marginBottom: '6px', color: '#94a3b8' }}>
              VTEC Ionosphere Shell (350 km)
            </div>
            <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem' }}>
              <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#3b82f6', color: '#fff' }}>0-15 Low</span>
              <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#10b981', color: '#000' }}>15-30 Med</span>
              <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#f97316', color: '#000' }}>30-50 High</span>
              <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#ef4444', color: '#fff' }}>&gt;50 Peak</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default CesiumGlobe;
