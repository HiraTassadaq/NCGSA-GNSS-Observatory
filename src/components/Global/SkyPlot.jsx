import React, { useRef, useEffect, useState } from 'react';
import { getConstellationColor } from './ColorHelper';
import { polarToCanvas } from './SkyPlotHelper';
import SkyPlotTooltip from './SkyPlotTooltip';
import '../../dashboard/Stylesheet/global.css';
const CONSTELLATIONS = ['GPS', 'GLONASS', 'Galileo', 'BeiDou', 'IRNSS', 'QZSS', 'Other'];
const HIT_RADIUS = 12;

export default function SkyPlot({ satellites = [], compact = false }) {
  const canvasRef = useRef(null);
  const [selectedSat, setSelectedSat] = useState(null);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [enabled, setEnabled] = useState(() =>
    Object.fromEntries(CONSTELLATIONS.map(c => [c, true]))
  );

  const toggle = (constellation) => {
    setEnabled(prev => ({ ...prev, [constellation]: !prev[constellation] }));
  };

  // Only satellites actually available (above the elevation mask) from the
  // observer's position belong on the sky plot.
  const filtered = satellites.filter(s => s.visible !== false && enabled[s.constellation]);

  // If the currently selected satellite drops out of view (filtered out or
  // no longer present in the latest data), clear the selection.
  useEffect(() => {
    if (selectedSat && !filtered.some(s => s.prn === selectedSat.prn)) {
      setSelectedSat(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const maxRadius = Math.min(cx, cy) - 25;
    ctx.clearRect(0, 0, rect.width, rect.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    [30, 60, 90].forEach(ringEl => {
      const r = maxRadius * (90 - ringEl) / 90;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '10px var(--font-sans)';
      ctx.fillText(`${ringEl}°`, cx + 4, cy - r + 12);
    });

    // Horizon ring (0° elevation) — white
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - maxRadius); ctx.lineTo(cx, cy + maxRadius);
    ctx.moveTo(cx - maxRadius, cy); ctx.lineTo(cx + maxRadius, cy);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 12px var(--font-sans)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('N', cx, cy - maxRadius - 12);
    ctx.fillText('S', cx, cy + maxRadius + 12);
    ctx.fillText('E', cx + maxRadius + 12, cy);
    ctx.fillText('W', cx - maxRadius - 12, cy);

    // Satellites — uniform styling, no hover/selection highlight, no labels.
    filtered.forEach(sat => {
      const { x, y } = polarToCanvas(sat.azimuth, sat.elevation, cx, cy, maxRadius);
      const color = getConstellationColor(sat.constellation);

      ctx.shadowColor = color;
      ctx.shadowBlur = 4;
      ctx.fillStyle = color + '22';
      ctx.beginPath(); ctx.arc(x, y, 8, 0, 2 * Math.PI); ctx.fill();

      ctx.fillStyle = color;
      ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(x, y, 4, 0, 2 * Math.PI); ctx.fill();
    });
  }, [filtered]);

  const findNearestSat = (mx, my) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2; const cy = rect.height / 2;
    const maxRadius = Math.min(cx, cy) - 25;

    let closestSat = null;
    let minDistance = HIT_RADIUS;
    let closestXY = null;
    filtered.forEach(sat => {
      const { x, y } = polarToCanvas(sat.azimuth, sat.elevation, cx, cy, maxRadius);
      const dist = Math.sqrt((x - mx) ** 2 + (y - my) ** 2);
      if (dist < minDistance) { minDistance = dist; closestSat = sat; closestXY = { x, y }; }
    });
    return closestSat ? { sat: closestSat, xy: closestXY, rect } : null;
  };

  // Position the details card so it always opens toward the free space in
  // the panel — below/right if the satellite is near the top/left, and
  // above/left if it's near the bottom/right — so it's never clipped.
  const computeTooltipStyle = (x, y, rect) => {
    const OFFSET = 14;
    const WIDTH = 240;
    let left = x + OFFSET;
    let top = y + OFFSET;
    if (left + WIDTH > rect.width) left = Math.max(0, rect.width - WIDTH - OFFSET);
    if (left < 0) left = 0;
    if (top < 0) top = 0;
    return { left, top };
  };

  const handleTooltipDrag = (left, top) => {
    const wrapper = canvasRef.current?.parentElement;
    if (wrapper) {
      const w = wrapper.getBoundingClientRect().width;
      const h = wrapper.getBoundingClientRect().height;
      left = Math.max(0, Math.min(left, w - 240));
      top = Math.max(0, Math.min(top, h - 60));
    }
    setTooltipStyle({ left, top });
  };

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = findNearestSat(mx, my);

    if (hit) {
      if (selectedSat && selectedSat.prn === hit.sat.prn) {
        setSelectedSat(null);
        return;
      }
      setSelectedSat(hit.sat);
      setTooltipStyle(computeTooltipStyle(hit.xy.x, hit.xy.y, rect));
    } else {
      setSelectedSat(null);
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    canvas.style.cursor = findNearestSat(mx, my) ? 'pointer' : 'default';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '4px' : '12px', height: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? '4px' : '8px', flexShrink: 0 }}>
        {CONSTELLATIONS.map(c => {
          const color = getConstellationColor(c);
          return (
            <label
              key={c}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
                opacity: enabled[c] ? 1 : 0.4,
                transition: 'opacity 0.15s',
                padding: '2px 8px', borderRadius: '6px',
                background: enabled[c] ? `${color}14` : 'transparent',
                border: `1px solid ${enabled[c] ? color + '33' : 'transparent'}`,
              }}
            >
              <input
                type="checkbox"
                checked={enabled[c]}
                onChange={() => toggle(c)}
                style={{ accentColor: color, margin: 0, width: compact ? '12px' : 'auto', height: compact ? '12px' : 'auto' }}
              />
              <span style={{ color, fontSize: compact ? '0.68rem' : undefined }}>{c}</span>
            </label>
          );
        })}
      </div>
      <div className="skyplot-wrapper" style={{ position: 'relative', width: '100%', flex: 1, minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%' }}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
        />
        <SkyPlotTooltip selectedSat={selectedSat} tooltipStyle={tooltipStyle} onClose={() => setSelectedSat(null)} onDrag={handleTooltipDrag} />
      </div>
    </div>
  );
}
