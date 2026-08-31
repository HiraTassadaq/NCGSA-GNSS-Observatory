import React, { useRef } from 'react';
import { X, GripHorizontal } from 'lucide-react';
import { getConstellationColor } from './ColorHelper';
import '../../dashboard/Stylesheet/global.css';
export default function SkyPlotTooltip({ selectedSat, tooltipStyle, onClose, onDrag }) {
  const startRef = useRef(null);
  if (!selectedSat) return null;
  const color = getConstellationColor(selectedSat.constellation);

  const onPointerDown = (e) => {
    if (!onDrag) return;
    e.preventDefault();
    e.stopPropagation();
    startRef.current = {
      startLeft: tooltipStyle.left ?? 0,
      startTop: tooltipStyle.top ?? 0,
      startX: e.clientX,
      startY: e.clientY
    };
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

  const onPointerMove = (e) => {
    if (!startRef.current) return;
    const dx = e.clientX - startRef.current.startX;
    const dy = e.clientY - startRef.current.startY;
    onDrag(
      startRef.current.startLeft + dx,
      startRef.current.startTop + dy
    );
  };

  const onPointerUp = () => {
    startRef.current = null;
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
  };

  return (
    <div
      className="glass-panel"
      style={{
        position: 'absolute',
        left: tooltipStyle.left ?? 0,
        top: tooltipStyle.top ?? 0,
        transform: 'translate(0, 0)',
        zIndex: 100,
        padding: '12px 16px',
        fontSize: '0.85rem',
        width: '240px',
        pointerEvents: 'auto',
        cursor: onDrag ? 'grab' : 'default',
        userSelect: onDrag ? 'none' : 'auto',
        touchAction: 'none',
        border: `1px solid ${color}`,
        boxShadow: `0 4px 20px ${color}1a`
      }}
      onPointerDown={onPointerDown}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onDrag && <GripHorizontal size={14} style={{ color: 'var(--text-secondary)' }} />}
          {selectedSat.prn}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`constellation-tag const-${selectedSat.constellation.toLowerCase()}`} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
            {selectedSat.constellation}
          </span>
          <button
            onClick={onClose}
            aria-label="Close satellite details"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', display: 'flex', padding: 0
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontFamily: 'var(--font-mono)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Az / El:</span>
          <span style={{ color: '#fff' }}>{selectedSat.azimuth}° / {selectedSat.elevation}°</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Range:</span>
          <span style={{ color: '#fff' }}>{selectedSat.range_km} km</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>SNR (C/N0):</span>
          <span style={{ color: '#10b981', fontWeight: 'bold' }}>{selectedSat.snr} dB-Hz</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Doppler L1:</span>
          <span style={{ color: selectedSat.doppler.doppler_l1 >= 0 ? '#10b981' : '#ef4444' }}>
            {selectedSat.doppler.doppler_l1 >= 0 ? '+' : ''}{selectedSat.doppler.doppler_l1} Hz
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Iono Delay L1:</span>
          <span style={{ color: '#f59e0b' }}>
            {selectedSat.tec.delay_l1_m} m ({selectedSat.tec.delay_l1_ns} ns)
          </span>
        </div>
      </div>
    </div>
  );
}
