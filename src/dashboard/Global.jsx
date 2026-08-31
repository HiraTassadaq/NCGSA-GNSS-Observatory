import React, { useState, useEffect, useRef } from 'react';
import { fetchVisibleSatellites } from '../global_utils/api';
import Header from '../components/Global/Header';
import GlobalControlBar from '../components/Global/GlobalControlBar';
import StatusStrip from '../components/Global/StatusStrip';
import MainDashboard from '../components/Global/MainDashboard';
import AnalysisChartModal from '../components/Global/AnalysisChartModal';
import { AlertCircle } from 'lucide-react';
import './Stylesheet/global.css';
import Footer2 from '../components/Footer2';
export default function Global() {

  // Navigation & View State
  const [locationMode, setLocationMode] = useState('GLOBAL'); // 'GLOBAL', 'PAKISTAN', 'ISLAMABAD', 'NCGSA'
  const [systemFilter, setSystemFilter] = useState('ALL');
  const [elevationMask, setElevationMask] = useState(10.0);

  // Time Machine State
  const [timeMode, setTimeMode] = useState('NOW'); // 'NOW' or 'HISTORICAL'
  const [customTime, setCustomTime] = useState(null); // ISO string when scrubbing
  const [isPlaying, setIsPlaying] = useState(false);

  // System Active Toggle Pills
  const [activeSystems, setActiveSystems] = useState({
    GPS: true, Galileo: true, BeiDou: true, GLONASS: true, NavIC: true, QZSS: true, SBAS: true
  });

  // Selected Satellite Highlight State
  const [selectedSatellite, setSelectedSatellite] = useState(null);
  const [activeAnalysisChart, setActiveAnalysisChart] = useState(null);

  // Observer coordinates based on active location view
  const [observer, setObserver] = useState({
    lat: 33.6560, lng: 73.1560, alt: 540, mask: 10.0, name: 'NCGSA / IST Islamabad'
  });

  const [telemetry, setTelemetry] = useState(null);
  const [satellites, setSatellites] = useState([]);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  const pollTimerRef = useRef(null);
  const playTimerRef = useRef(null);

  // Sync observer coordinates when locationMode changes
  useEffect(() => {
    if (locationMode === 'GLOBAL') {
      setObserver({ lat: 20.0, lng: 0.0, alt: 0, mask: elevationMask, name: 'Global Observer' });
    } else if (locationMode === 'PAKISTAN') {
      setObserver({ lat: 30.0, lng: 69.5, alt: 200, mask: elevationMask, name: 'Pakistan Region' });
    } else if (locationMode === 'ISLAMABAD') {
      setObserver({ lat: 33.6844, lng: 73.0479, alt: 540, mask: elevationMask, name: 'Islamabad Capital Territory' });
    } else if (locationMode === 'NCGSA') {
      setObserver({ lat: 33.6560, lng: 73.1560, alt: 540, mask: elevationMask, name: 'NCGSA / IST Reference Point' });
    }
  }, [locationMode, elevationMask]);

  // Update Telemetry Data
  const updateTelemetry = async () => {
    try {
      setError('');
      const timeStr = timeMode === 'HISTORICAL' && customTime ? customTime : '';
      const data = await fetchVisibleSatellites(observer.lat, observer.lng, observer.alt, elevationMask, timeStr);
      setTelemetry(data);
      setSatellites(data.satellites || []);

      const now = new Date();
      setLastUpdated(now.toTimeString().slice(0, 8));

      if (selectedSatellite) {
        const updated = (data.satellites || []).find(s => s.prn === selectedSatellite.prn);
        setSelectedSatellite(updated || null);
      }
    } catch (err) {
      setError(err.message || 'Server calculation error');
    }
  };

  // Poll timer for live data updates
  useEffect(() => {
    updateTelemetry();
    pollTimerRef.current = setInterval(() => updateTelemetry(), 1500);
    return () => clearInterval(pollTimerRef.current);
  }, [observer.lat, observer.lng, elevationMask, timeMode, customTime]);

  // Simulation Playback Timer (advance 2 minutes every second when playing)
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCustomTime(prev => {
          const base = prev ? new Date(prev) : new Date();
          base.setMinutes(base.getMinutes() + 2);
          return base.toISOString();
        });
        setTimeMode('HISTORICAL');
      }, 1000);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => { if (playTimerRef.current) clearInterval(playTimerRef.current); };
  }, [isPlaying]);

  const handleToggleSystemPill = (sysName) => {
    setActiveSystems(prev => ({ ...prev, [sysName]: !prev[sysName] }));
  };

  // Filter satellites by active system pills and dropdown system filter
  const filteredSatellites = satellites.filter(s => {
    const sys = s.constellation === 'IRNSS' ? 'NavIC' : s.constellation;
    if (activeSystems[sys] === false) return false;
    if (systemFilter !== 'ALL' && s.constellation !== systemFilter) return false;
    return true;
  });

  return (
    <div className="observatory-dashboard-wrapper" style={{ minHeight: 'calc(100vh - 70px)' }}>
      <div className="app-bg-glow" />
      <div className="app-grid-overlay" />

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%' }}>
        <Header onSelectAnalysis={setActiveAnalysisChart} />

        {/* Global Control Bar (Persistent Across All Views) */}
        <GlobalControlBar
          system={systemFilter}
          setSystem={setSystemFilter}
          timeMode={timeMode}
          setTimeMode={setTimeMode}
          customTime={customTime}
          setCustomTime={setCustomTime}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          mask={elevationMask}
          setMask={setElevationMask}
          locationMode={locationMode}
          setLocationMode={setLocationMode}
          lastUpdated={lastUpdated}
        />

        {/* Dynamic GNSS Status Strip */}
        <StatusStrip
          telemetry={telemetry}
          activeSystems={activeSystems}
          onToggleSystem={handleToggleSystemPill}
        />

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171', borderRadius: '10px', padding: '12px 16px', margin: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={18} />
            <span>Calculation Alert: {error}. Running on orbital analytical propagation fallback.</span>
          </div>
        )}

        {/* Active Geographic View Level */}
        <main className="main-content main-content-dashboard" style={{ flex: 1 }}>
          <MainDashboard
            locationMode={locationMode}
            systemFilter={systemFilter}
            mask={elevationMask}
            timeStr={timeMode === 'HISTORICAL' ? customTime : ''}
            telemetry={telemetry}
            satellites={filteredSatellites}
            selectedSatellite={selectedSatellite}
            setSelectedSatellite={setSelectedSatellite}
            observer={observer}
          />
        </main>
      </div>

      {activeAnalysisChart && (
        <AnalysisChartModal
          chartId={activeAnalysisChart}
          observer={observer}
          onClose={() => setActiveAnalysisChart(null)}
        />
      )}
     
      <Footer2 />
    </div>
  );
}

