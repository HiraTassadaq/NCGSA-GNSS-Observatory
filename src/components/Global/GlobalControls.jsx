import React from 'react';
import { Play, Pause, RotateCcw, FastForward, Eye, ShieldAlert, Globe, Layers, Activity, Filter } from 'lucide-react';
import '../../dashboard/Stylesheet/global.css';
export default function GlobalControls({
  currentTime,
  isPlaying,
  setIsPlaying,
  speedMultiplier,
  setSpeedMultiplier,
  onResetTime,
  onStepTime,
  showSatellites,
  setShowSatellites,
  showOrbits,
  setShowOrbits,
  showHealthWarnings,
  setShowHealthWarnings,
  showDOPMap,
  setShowDOPMap,
  dopType,
  setDopType,
  elevationMask,
  setElevationMask,
  showTECMap,
  setShowTECMap,
  constellationFilter,
  setConstellationFilter
}) {
  const speeds = [1, 10, 60, 300, 3600];

  const handleToggleConstellation = (key) => {
    setConstellationFilter(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '16px',
      padding: '20px',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      marginBottom: '20px'
    }}>
      {/* Top Bar: Epoch Time & Playback Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} style={{ color: '#3b82f6' }} />
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Epoch Time (UTC)</div>
              <div style={{ fontSize: '0.98rem', fontWeight: '700', fontFamily: 'monospace', color: '#60a5fa' }}>
                {currentTime.toUTCString()}
              </div>
            </div>
          </div>
        </div>

        {/* Play / Pause & Time Stepping */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onStepTime(-3600)}
            style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}
          >
            -1h
          </button>
          
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{ padding: '10px 18px', borderRadius: '10px', background: isPlaying ? '#ef4444' : '#3b82f6', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={() => onStepTime(3600)}
            style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}
          >
            +1h
          </button>

          <button
            onClick={onResetTime}
            style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Reset to Epoch"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Speed Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginRight: '4px' }}>Speed:</span>
          {speeds.map((spd) => (
            <button
              key={spd}
              onClick={() => setSpeedMultiplier(spd)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: speedMultiplier === spd ? '#3b82f6' : 'rgba(255, 255, 255, 0.15)',
                background: speedMultiplier === spd ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                color: speedMultiplier === spd ? '#60a5fa' : '#cbd5e1',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Layer Controls & Overlays */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        
        {/* Visual Layer Toggles */}
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>
            3D Globe Layers
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={showSatellites} onChange={(e) => setShowSatellites(e.target.checked)} />
              <Eye size={15} style={{ color: '#3b82f6' }} />
              <span>Satellites (3D Primitives)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={showDOPMap} onChange={(e) => setShowDOPMap(e.target.checked)} />
              <Globe size={15} style={{ color: '#10b981' }} />
              <span>Global DOP Heatmap</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={showTECMap} onChange={(e) => setShowTECMap(e.target.checked)} />
              <Layers size={15} style={{ color: '#eab308' }} />
              <span>Ionosphere VTEC Shell</span>
            </label>
          </div>
        </div>

        {/* DOP Options */}
        {showDOPMap && (
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>
              DOP Options
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Metric:</span>
                <select
                  value={dopType}
                  onChange={(e) => setDopType(e.target.value)}
                  style={{ background: '#0f172a', color: '#60a5fa', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.82rem', fontWeight: '700' }}
                >
                  <option value="gdop">GDOP (Geometric)</option>
                  <option value="pdop">PDOP (Position)</option>
                  <option value="hdop">HDOP (Horizontal)</option>
                  <option value="vdop">VDOP (Vertical)</option>
                  <option value="tdop">TDOP (Time)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Elev Mask:</span>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="1"
                  value={elevationMask}
                  onChange={(e) => setElevationMask(parseFloat(e.target.value))}
                  style={{ width: '80px' }}
                />
                <span style={{ fontSize: '0.82rem', color: '#60a5fa', fontWeight: '700' }}>{elevationMask}°</span>
              </div>
            </div>
          </div>
        )}

        {/* Constellation Filters */}
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>
            Constellations
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.keys(constellationFilter).map((name) => (
              <button
                key={name}
                onClick={() => handleToggleConstellation(name)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: constellationFilter[name] ? '#3b82f6' : 'rgba(255, 255, 255, 0.15)',
                  background: constellationFilter[name] ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  color: constellationFilter[name] ? '#fff' : '#64748b',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
