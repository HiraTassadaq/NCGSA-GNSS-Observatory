import React, { useRef, useEffect, useState } from 'react';
import '../../dashboard/Stylesheet/global.css';
export default function CustomLineChart({ 
  labels = [], 
  datasets = [], 
  fillArea = false, 
  valueSuffix = ''
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [hiddenDatasets, setHiddenDatasets] = useState({});

  // Reset hidden datasets when datasets change
  useEffect(() => {
    setHiddenDatasets({});
  }, [datasets.length]);

  const toggleDataset = (label) => {
    setHiddenDatasets(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const activeDatasets = datasets.filter(d => !hiddenDatasets[d.label]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const padding = { top: 25, right: 20, bottom: 35, left: 50 };
    const IW = W - padding.left - padding.right;
    const IH = H - padding.top - padding.bottom;

    ctx.clearRect(0, 0, W, H);

    if (labels.length === 0 || activeDatasets.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '13px var(--font-sans)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No active telemetry data', W / 2, H / 2);
      return;
    }

    // Determine Y scale bounds
    let allVals = activeDatasets.flatMap(d => d.data || []);
    let yMin = allVals.length > 0 ? Math.min(...allVals) : 0;
    let yMax = allVals.length > 0 ? Math.max(...allVals) : 10;

    // Add some padding to Y bounds
    const diff = yMax - yMin;
    if (diff === 0) {
      yMax += 1;
      yMin = Math.max(0, yMin - 1);
    } else {
      yMax += diff * 0.1;
      yMin = Math.max(0, yMin - diff * 0.05);
    }

    // Round Y labels
    yMin = Math.floor(yMin);
    yMax = Math.ceil(yMax);

    // Draw Grid Lines (Y-Axis)
    const gridCount = 4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '10px var(--font-mono)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= gridCount; i++) {
      const yVal = yMin + (i / gridCount) * (yMax - yMin);
      const yPos = padding.top + IH - (i / gridCount) * IH;

      // Draw grid line
      ctx.beginPath();
      ctx.moveTo(padding.left, yPos);
      ctx.lineTo(W - padding.right, yPos);
      ctx.stroke();

      // Draw label
      ctx.fillText(yVal.toFixed(0) + valueSuffix, padding.left - 10, yPos);
    }

    // Draw X-Axis labels (Subset to avoid overlapping)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const labelStep = Math.ceil(labels.length / 6);
    labels.forEach((label, idx) => {
      if (idx % labelStep === 0 || idx === labels.length - 1) {
        const xPos = padding.left + (idx / (labels.length - 1)) * IW;
        ctx.fillText(label, xPos, H - padding.bottom + 8);
      }
    });

    // Draw Hover Vertical Line
    if (hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < labels.length) {
      const xHover = padding.left + (hoveredIndex / (labels.length - 1)) * IW;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(xHover, padding.top);
      ctx.lineTo(xHover, H - padding.bottom);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Datasets
    activeDatasets.forEach((dataset) => {
      const color = dataset.color || 'var(--accent)';
      const pts = (dataset.data || []).map((val, idx) => {
        const x = padding.left + (idx / (labels.length - 1)) * IW;
        const y = padding.top + IH - ((val - yMin) / (yMax - yMin)) * IH;
        return { x, y, val };
      });

      if (pts.length === 0) return;

      // 1. Draw Area Fill if enabled
      if (fillArea || dataset.fill) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, padding.top + IH);
        pts.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(pts[pts.length - 1].x, padding.top + IH);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + IH);
        grad.addColorStop(0, color + '28');
        grad.addColorStop(1, color + '00');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // 2. Draw line
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // 3. Draw Hover Point
      if (hoveredIndex !== null && pts[hoveredIndex]) {
        const hp = pts[hoveredIndex];
        ctx.fillStyle = color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        
        ctx.beginPath();
        ctx.arc(hp.x, hp.y, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        ctx.shadowBlur = 0; // reset
      }
    });

  }, [labels, datasets, hiddenDatasets, hoveredIndex]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || labels.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    const padding = { top: 25, right: 20, bottom: 35, left: 50 };
    const IW = rect.width - padding.left - padding.right;

    // Find closest index
    const pct = (mx - padding.left) / IW;
    const rawIdx = Math.round(pct * (labels.length - 1));
    const idx = Math.max(0, Math.min(labels.length - 1, rawIdx));

    setHoveredIndex(idx);
    setTooltipPos({ x: mx + 15, y: my - 30 });
  };

  const getTooltipContent = () => {
    if (hoveredIndex === null || labels.length === 0) return null;
    const timeLabel = labels[hoveredIndex];
    return (
      <div style={{ pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <strong style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '3px', marginBottom: '3px', color: 'var(--accent)' }}>
          Time: {timeLabel}
        </strong>
        {activeDatasets.map((d, i) => {
          const val = d.data[hoveredIndex];
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: d.color }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>{d.label}:</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                {typeof val === 'number' ? val.toFixed(1) : 'N/A'}{valueSuffix}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Canvas */}
      <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
        <canvas 
          ref={canvasRef} 
          style={{ width: '100%', height: '100%' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIndex(null)}
        />
      </div>

      {/* HTML absolute tooltip */}
      {hoveredIndex !== null && activeDatasets.length > 0 && (
        <div style={{
          position: 'absolute',
          left: `${tooltipPos.x}px`,
          top: `${tooltipPos.y}px`,
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid var(--border-glow)',
          borderRadius: '8px',
          padding: '8px 12px',
          zIndex: 100,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
          backdropFilter: 'blur(8px)',
          minWidth: '150px'
        }}>
          {getTooltipContent()}
        </div>
      )}

      {/* Legend Container */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        flexWrap: 'wrap', 
        gap: '12px', 
        marginTop: '10px', 
        fontSize: '0.75rem',
        flexShrink: 0
      }}>
        {datasets.map((dataset, idx) => {
          const isHidden = hiddenDatasets[dataset.label];
          return (
            <div 
              key={idx} 
              onClick={() => toggleDataset(dataset.label)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                cursor: 'pointer',
                opacity: isHidden ? 0.35 : 1,
                background: isHidden ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: isHidden ? 'transparent' : 'rgba(255,255,255,0.06)',
                transition: 'var(--transition-fast)'
              }}
            >
              <span style={{ 
                width: '10px', 
                height: '3px', 
                backgroundColor: dataset.color,
                borderRadius: '2px',
                boxShadow: isHidden ? 'none' : `0 0 6px ${dataset.color}`
              }}></span>
              <span style={{ color: 'var(--text-secondary)', userSelect: 'none', fontWeight: '500' }}>
                {dataset.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
