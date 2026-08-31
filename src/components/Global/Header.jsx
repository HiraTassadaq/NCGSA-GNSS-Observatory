import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, BarChart3, Globe2 } from 'lucide-react';
import '../../dashboard/Stylesheet/global.css';

const ANALYSIS_OPTIONS = [
  { id: 'satellites', label: 'Number of Satellites' },
  { id: 'dop', label: 'Dilution of Precision (DOP)' },
  { id: 'elevation', label: 'Satellite Elevation Angle' },
  { id: 'altitude', label: 'Satellite Orbital Altitude' }
];

export default function Header({ onSelectAnalysis }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const utcStr = now.toLocaleTimeString('en-US', {
    timeZone: 'UTC',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const pktStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now);

  return (
    <header className="observatory-subbar">
      <div className="observatory-subbar-left">
        <div>
          <span className="observatory-station-title">
            GNSS Constellations Global Perspective
          </span>
          {/* <span className="observatory-station-subtitle">
            Global Perspective
          </span> */}
        </div>

        {/* <div className="hud-badge-live">
          <span className="pulse-indicator" />
           <span>Multi-Constellation Active</span> 
        </div> */}
      </div>

      <div className="observatory-subbar-right">
        <div className="hud-time-container">
          <div className="hud-time-item">
            <span className="hud-time-label">PKT</span>
            <span className="hud-time-val">{pktStr}</span>
          </div>

          <div className="hud-time-divider" />

          <div className="hud-time-item">
            <span className="hud-time-label">UTC</span>
            <span className="hud-time-val">{utcStr}</span>
          </div>
        </div>

        {/* <div className="panel-menu" ref={menuRef} style={{ position: 'relative' }}>
          <button className="hud-btn" onClick={() => setMenuOpen(o => !o)}>
            <BarChart3 size={14} />
            <span>Analysis Charts</span>
            <ChevronDown size={14} style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'var(--transition-fast)' }} />
          </button>

          {menuOpen && (
            <div className="panel-menu-list" style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 100 }}>
              {ANALYSIS_OPTIONS.map(item => (
                <div
                  key={item.id}
                  className="panel-menu-item"
                  onClick={() => { onSelectAnalysis(item.id); setMenuOpen(false); }}
                >
                  {item.label}
                </div>
              ))}
            </div>
          )}
        </div> */}
      </div>
    </header>
  );
}
