import React, { useState, useEffect, useRef } from 'react';
import RinexUploader from './RinexUploader';
import CesiumGlobe from './CesiumGlobe';
import GlobalControls from './GlobalControls';
import SatelliteHealthPanel from './SatelliteHealthPanel';
import { parseRinexNav } from '../../utils/rinexParser';
import { SAMPLE_BRDC_RINEX, generateFullConstellationEphemerides } from '../../utils/sampleRinex';
import { propagateSatellite } from '../../utils/keplerPropagator';
import { Camera, X, ShieldAlert, Globe, Compass, Activity, Maximize, Minimize } from 'lucide-react';
import { saveAs } from 'file-saver';
import '../../dashboard/Stylesheet/global.css';
export default function GlobalGlobeDashboardTab() {
  const globeRef = useRef(null);

  const [navData, setNavData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(10);

  const [selectedSatellite, setSelectedSatellite] = useState(null);

  // Layer Toggles
  const [showSatellites, setShowSatellites] = useState(true);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showHealthWarnings, setShowHealthWarnings] = useState(true);
  const [showDOPMap, setShowDOPMap] = useState(true);
  const [dopType, setDopType] = useState('gdop');
  const [elevationMask, setElevationMask] = useState(10.0);
  const [showTECMap, setShowTECMap] = useState(false);

  const [constellationFilter, setConstellationFilter] = useState({
    GPS: true,
    GLONASS: true,
    Galileo: true,
    BeiDou: true,
    QZSS: true,
    SBAS: true,
    IRNSS: true
  });

  // Auto-initialize with full global constellation demo on first mount
  useEffect(() => {
    const parsed = parseRinexNav(SAMPLE_BRDC_RINEX);
    const fullSats = generateFullConstellationEphemerides(parsed);
    parsed.satellites = fullSats;
    parsed.totalCount = fullSats.length;
    parsed.healthyCount = fullSats.filter(s => s.isHealthy).length;
    parsed.degradedCount = fullSats.filter(s => !s.isHealthy).length;
    setNavData(parsed);
  }, []);

  // Time Animation Loop
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => new Date(prev.getTime() + speedMultiplier * 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, speedMultiplier]);

  // Compute live satellite positions for current epoch
  const satellitesPositions = React.useMemo(() => {
    if (!navData || !navData.satellites) return [];
    return navData.satellites.map(ephem => propagateSatellite(ephem, currentTime)).filter(Boolean);
  }, [navData, currentTime]);

  const handleStepTime = (deltaSeconds) => {
    setCurrentTime(prev => new Date(prev.getTime() + deltaSeconds * 1000));
  };

  const handleResetTime = () => {
    setCurrentTime(new Date());
  };

  const handleCaptureScreenshot = () => {
    if (globeRef.current) {
      const dataUrl = globeRef.current.captureScreenshot();
      if (dataUrl) {
        saveAs(dataUrl, `GNSS_Global_3D_Globe_${new Date().toISOString().slice(0, 19)}.png`);
      }
    }
  };

  const handleFlyToSat = (prn) => {
    if (globeRef.current) {
      globeRef.current.flyToSatellite(prn);
    }
  };

  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef(null);

  // Lock body scroll when fullscreen is active so the page cannot scroll behind the overlay
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      // Focus the fullscreen container so keyboard events stay inside it
      if (fullscreenRef.current) fullscreenRef.current.focus();
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isFullscreen]);

  // Prevent scroll keys (Page Up/Down, arrows, Space, Home, End) from reaching the page
  const handleFullscreenKeyDown = (e) => {
    const scrollKeys = ['PageUp', 'PageDown', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', ' '];
    if (scrollKeys.includes(e.key)) {
      e.stopPropagation();
    }
    // Escape exits fullscreen
    if (e.key === 'Escape') {
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={fullscreenRef}
      tabIndex={isFullscreen ? 0 : undefined}
      onKeyDown={isFullscreen ? handleFullscreenKeyDown : undefined}
      style={isFullscreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999,
        backgroundColor: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        outline: 'none'
      } : { display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. RINEX File Input Banner */}
      {!isFullscreen && (
        <RinexUploader onNavDataLoaded={setNavData} activeNavData={navData} />
      )}

      {/* 2. Global Controls Toolbar */}
      <GlobalControls
        currentTime={currentTime}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        speedMultiplier={speedMultiplier}
        setSpeedMultiplier={setSpeedMultiplier}
        onResetTime={handleResetTime}
        onStepTime={handleStepTime}
        showSatellites={showSatellites}
        setShowSatellites={setShowSatellites}
        showOrbits={showOrbits}
        setShowOrbits={setShowOrbits}
        showHealthWarnings={showHealthWarnings}
        setShowHealthWarnings={setShowHealthWarnings}
        showDOPMap={showDOPMap}
        setShowDOPMap={setShowDOPMap}
        dopType={dopType}
        setDopType={setDopType}
        elevationMask={elevationMask}
        setElevationMask={setElevationMask}
        showTECMap={showTECMap}
        setShowTECMap={setShowTECMap}
        constellationFilter={constellationFilter}
        setConstellationFilter={setConstellationFilter}
      />

      {/* 3. 3D Globe Visualization Container — flex:1 fills all space below toolbar in fullscreen */}
      <div style={{ position: 'relative', width: '100%', flex: isFullscreen ? '1 1 0%' : 'none', height: isFullscreen ? '0' : '620px', minHeight: 0, overflow: 'hidden' }}>
        
        {/* Fullscreen Toggle Button */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '180px',
            zIndex: 10,
            padding: '8px 14px',
            borderRadius: '10px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#fff',
            fontSize: '0.82rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          {isFullscreen ? <Minimize size={16} style={{ color: '#10b981' }} /> : <Maximize size={16} style={{ color: '#10b981' }} />}
          <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
        </button>

        {/* Screenshot Export Button */}
        <button
          onClick={handleCaptureScreenshot}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 10,
            padding: '8px 14px',
            borderRadius: '10px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#fff',
            fontSize: '0.82rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          <Camera size={16} style={{ color: '#3b82f6' }} />
          <span>Capture 3D View</span>
        </button>

        {/* Cesium Globe Component */}
        <CesiumGlobe
          ref={globeRef}
          satellitesPos={satellitesPositions}
          rawEphemerisList={navData ? navData.satellites : []}
          currentTime={currentTime}
          selectedSatellite={selectedSatellite}
          onSelectSatellite={setSelectedSatellite}
          showSatellites={showSatellites}
          showOrbits={showOrbits}
          showHealthWarnings={showHealthWarnings}
          showDOPMap={showDOPMap}
          dopType={dopType}
          elevationMask={elevationMask}
          showTECMap={showTECMap}
          ionoParams={navData ? navData.ionoParams : null}
          constellationFilter={constellationFilter}
        />

        {/* Selected Satellite Info Card Overlay */}
        {selectedSatellite && (
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            zIndex: 10,
            width: '300px',
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '14px',
            padding: '16px',
            color: '#fff',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={18} style={{ color: '#3b82f6' }} />
                <span style={{ fontWeight: '800', fontSize: '1rem', color: '#60a5fa' }}>{selectedSatellite.prn}</span>
                <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1' }}>{selectedSatellite.constellation}</span>
              </div>
              <button
                onClick={() => setSelectedSatellite(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Health Status:</span>
                <span style={{ fontWeight: '700', color: selectedSatellite.isHealthy ? '#34d399' : '#f87171' }}>
                  {selectedSatellite.healthText || (selectedSatellite.isHealthy ? 'Healthy' : 'Degraded')}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Latitude / Longitude:</span>
                <span style={{ fontFamily: 'monospace', color: '#f8fafc' }}>
                  {selectedSatellite.lat ? selectedSatellite.lat.toFixed(2) : '-'}°, {selectedSatellite.lon ? selectedSatellite.lon.toFixed(2) : '-'}°
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Orbital Altitude:</span>
                <span style={{ fontFamily: 'monospace', color: '#f8fafc' }}>
                  {selectedSatellite.alt ? (selectedSatellite.alt / 1000).toFixed(0) : '-'} km
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Inclination:</span>
                <span style={{ fontFamily: 'monospace', color: '#f8fafc' }}>
                  {selectedSatellite.inclinationDeg ? selectedSatellite.inclinationDeg.toFixed(1) : '-'}°
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Clock Bias (af0):</span>
                <span style={{ fontFamily: 'monospace', color: '#f8fafc' }}>
                  {selectedSatellite.clockBias ? selectedSatellite.clockBias.toExponential(4) : '0'} s
                </span>
              </div>

              <button
                onClick={() => handleFlyToSat(selectedSatellite.prn)}
                style={{
                  marginTop: '8px',
                  width: '100%',
                  padding: '8px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                Fly Camera to Satellite
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Satellite Health Summary & Detailed Table */}
      {!isFullscreen && (
        <SatelliteHealthPanel
          satellites={satellitesPositions}
          selectedSatellite={selectedSatellite}
          onSelectSatellite={setSelectedSatellite}
          onFlyToSatellite={handleFlyToSat}
        />
      )}
    </div>
  );
}
