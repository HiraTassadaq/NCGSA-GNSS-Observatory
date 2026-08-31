import React, { useState, useEffect } from 'react';
import {
  Globe, MapPin, Navigation, Satellite, Clock, Play, Pause, RotateCcw,
  Layers, Filter, Eye, ChevronDown
} from 'lucide-react';
import '../../dashboard/Stylesheet/global.css';

export default function GlobalControlBar({
  system,
  setSystem,
  timeMode,
  setTimeMode,
  customTime,
  setCustomTime,
  isPlaying,
  setIsPlaying,
  mask,
  setMask,
  locationMode,
  setLocationMode,
  lastUpdated
}) {
  const handleTimeShift = (hours) => {
    const base = customTime ? new Date(customTime) : new Date();
    base.setHours(base.getHours() + hours);
    setCustomTime(base.toISOString());
    setTimeMode('HISTORICAL');
  };

  const handleResetNow = () => {
    setCustomTime(null);
    setTimeMode('NOW');
    setIsPlaying(false);
  };

  return (
    <div className="global-control-bar">
      {/* Location Selector (Geographic Hierarchy Drill-Down) */}
      <div className="control-group location-group">
        <label className="control-label">
          <Globe size={13} style={{ color: '#06b6d4' }} /> LOCATION
        </label>
        <div className="location-buttons">
          <button
            className={`loc-btn ${locationMode === 'GLOBAL' ? 'active' : ''}`}
            onClick={() => setLocationMode('GLOBAL')}
          >
            <span>🌍 GLOBAL</span>
          </button>
          <button
            className={`loc-btn ${locationMode === 'PAKISTAN' ? 'active' : ''}`}
            onClick={() => setLocationMode('PAKISTAN')}
          >
            <span>🇵🇰 PAKISTAN</span>
          </button>
          <button
            className={`loc-btn ${locationMode === 'ISLAMABAD' ? 'active' : ''}`}
            onClick={() => setLocationMode('ISLAMABAD')}
          >
            <span>📍 ISLAMABAD</span>
          </button>
          <button
            className={`loc-btn ${locationMode === 'NCGSA' ? 'active' : ''}`}
            onClick={() => setLocationMode('NCGSA')}
          >
            <span>🛰️ NCGSA/IST</span>
          </button>
        </div>
      </div>

      {/* System Selector */}
      <div className="control-group">
        <label className="control-label">
          <Filter size={13} style={{ color: '#38bdf8' }} /> SYSTEM
        </label>
        <select
          value={system}
          onChange={(e) => setSystem(e.target.value)}
          className="control-select"
        >
          <option value="ALL">ALL GNSS ▼</option>
          <option value="GPS">GPS</option>
          <option value="Galileo">Galileo</option>
          <option value="BeiDou">BeiDou</option>
          <option value="GLONASS">GLONASS</option>
          <option value="NavIC">NavIC (IRNSS)</option>
          <option value="QZSS">QZSS</option>
          <option value="SBAS">SBAS</option>
        </select>
      </div>

      {/* Elevation Mask */}
      <div className="control-group">
        <label className="control-label">
          <Eye size={13} style={{ color: '#10b981' }} /> ELEV MASK
        </label>
        <select
          value={mask}
          onChange={(e) => setMask(parseFloat(e.target.value))}
          className="control-select"
        >
          <option value={10}>10° (default) ▼</option>
          <option value={5}>5°</option>
          <option value={15}>15°</option>
          <option value={20}>20°</option>
        </select>
      </div>

      {/* Time Machine Controls */}
      <div className="control-group time-machine-group">
        <label className="control-label">
          <Clock size={13} style={{ color: '#f59e0b' }} /> TIME MACHINE
        </label>
        <div className="time-scrub-controls">
          <button
            title="Step Back 24h"
            className="time-step-btn"
            onClick={() => handleTimeShift(-24)}
          >
            ◀ 24h
          </button>
          <button
            title="Step Back 6h"
            className="time-step-btn"
            onClick={() => handleTimeShift(-6)}
          >
            ◀ 6h
          </button>
          <button
            title="Step Back 1h"
            className="time-step-btn"
            onClick={() => handleTimeShift(-1)}
          >
            ◀ 1h
          </button>
          <button
            title="Jump to NOW"
            className={`time-step-btn now-btn ${timeMode === 'NOW' ? 'active' : ''}`}
            onClick={handleResetNow}
          >
            ● NOW
          </button>
          <button
            title="Step Forward 1h"
            className="time-step-btn"
            onClick={() => handleTimeShift(1)}
          >
            1h ▶
          </button>
          <button
            title="Step Forward 6h"
            className="time-step-btn"
            onClick={() => handleTimeShift(6)}
          >
            6h ▶
          </button>
          <button
            title="Step Forward 24h"
            className="time-step-btn"
            onClick={() => handleTimeShift(24)}
          >
            24h ▶
          </button>
          <button
            title={isPlaying ? 'Pause Simulation' : 'Play Time Simulation'}
            className={`time-play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          </button>
        </div>
      </div>

      {/* Updated Live Timestamp */}
      <div className="control-group updated-badge">
        <span className="updated-label">Updated:</span>
        <span className="updated-time">{lastUpdated}</span>
      </div>
    </div>
  );
}
