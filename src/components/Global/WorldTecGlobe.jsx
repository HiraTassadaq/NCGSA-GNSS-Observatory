import React, { useState, useEffect, useRef, useCallback } from 'react';
import { geoEquirectangular, geoPath } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import worldTopology from 'world-atlas/countries-110m.json';
import { fetchWorldTec } from '../../global_utils/api';
import { tecColor } from './TecColorScale';
import '../../dashboard/Stylesheet/global.css';
const LAND = feature(worldTopology, worldTopology.objects.land);
const BORDERS = mesh(worldTopology, worldTopology.objects.countries, (a, b) => a !== b);

const LAT_TICKS = [90, 60, 30, 0, -30, -60, -90];
const LON_TICKS = [-180, -120, -60, 0, 60, 120, 180];

function latLabel(lat) {
  if (lat === 0) return '0\u00b0';
  return `${Math.abs(lat)}\u00b0${lat > 0 ? 'N' : 'S'}`;
}
function lonLabel(lon) {
  if (lon === 0 || Math.abs(lon) === 180) return `${Math.abs(lon)}\u00b0`;
  return `${Math.abs(lon)}\u00b0${lon > 0 ? 'E' : 'W'}`;
}

export default function WorldTecGlobe({ height = 520, compact = false }) {
  const [data, setData] = useState(null);
  const [stepDeg, setStepDeg] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  const load = useCallback(async (step) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetchWorldTec(step);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load world TEC grid');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(stepDeg);
    const timer = setInterval(() => load(stepDeg), 60000);
    return () => clearInterval(timer);
  }, [stepDeg, load]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = wrap.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    // ctx.fillStyle = '#ffffff';
    // ctx.fillRect(0, 0, rect.width, rect.height);

    const points = data ? data.points : [];
    const values = points.map(p => p.vtec);
    const maxVal = values.length ? Math.max(20, Math.ceil(Math.max(...values) / 2) * 2) : 20;
    const minVal = 0;

    // --- layout / margins ---
    const marginLeft = compact ? 42 : 56;
    const marginBottom = compact ? 34 : 42;
    const marginTop = compact ? 22 : 30;
    const colorbarW = compact ? 34 : 46;
    const marginRight = colorbarW + (compact ? 44 : 60);

    const plotW = rect.width - marginLeft - marginRight;
    const plotH = rect.height - marginTop - marginBottom;
    if (plotW <= 10 || plotH <= 10) return;

    const projection = geoEquirectangular().fitExtent(
      [[marginLeft, marginTop], [marginLeft + plotW, marginTop + plotH]],
      { type: 'Sphere' }
    );
    const path = geoPath(projection, ctx);

    // --- title ---
    ctx.fillStyle = '#111111';
    ctx.font = `${compact ? '600 10px' : '600 12.5px'} var(--font-mono, monospace)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const ts = data && data.timestamp ? new Date(data.timestamp) : null;
    const tsLabel = ts ? `${ts.toISOString().slice(0, 10)} ${ts.toISOString().slice(11, 16)}z` : '';
    ctx.fillText(
      `GNSS Dashboard Vertical Ionospheric TEC  at: ${tsLabel}`,
      marginLeft + plotW / 2,
      Math.max(14, marginTop - 10)
    );

    // --- heatmap (offscreen, then blurred onto main canvas) ---
    if (points.length) {
      const off = document.createElement('canvas');
      off.width = Math.max(1, Math.round(plotW * dpr));
      off.height = Math.max(1, Math.round(plotH * dpr));
      const offCtx = off.getContext('2d');
      offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // pixels-per-degree in this (linear) projection
      const p0 = projection([0, 0]);
      const p1 = projection([1, 0]);
      const p2 = projection([0, 1]);
      const pxPerDegLon = Math.abs(p1[0] - p0[0]);
      const pxPerDegLat = Math.abs(p2[1] - p0[1]);
      const cellW = pxPerDegLon * stepDeg + 1.5;
      const cellH = pxPerDegLat * stepDeg + 1.5;

      points.forEach(pt => {
        const proj = projection([pt.lng, pt.lat]);
        if (!proj) return;
        const [px, py] = proj;
        offCtx.fillStyle = tecColor(pt.vtec, minVal, maxVal);
        offCtx.fillRect(px - marginLeft - cellW / 2, py - marginTop - cellH / 2, cellW, cellH);
      });

      ctx.save();
      ctx.beginPath();
      ctx.rect(marginLeft, marginTop, plotW, plotH);
      ctx.clip();
      ctx.filter = compact ? 'blur(4px)' : 'blur(6px)';
      ctx.drawImage(off, marginLeft, marginTop, plotW, plotH);
      ctx.filter = 'none';
      ctx.restore();
    }

    // --- graticule (dotted) ---
    ctx.save();
    ctx.beginPath();
    ctx.rect(marginLeft, marginTop, plotW, plotH);
    ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.setLineDash([1, 3]);
    ctx.lineWidth = 1;
    LAT_TICKS.forEach(lat => {
      const y = projection([0, lat])[1];
      ctx.beginPath();
      ctx.moveTo(marginLeft, y);
      ctx.lineTo(marginLeft + plotW, y);
      ctx.stroke();
    });
    LON_TICKS.forEach(lon => {
      const x = projection([lon, 0])[0];
      ctx.beginPath();
      ctx.moveTo(x, marginTop);
      ctx.lineTo(x, marginTop + plotH);
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.restore();

    // --- coastlines & country borders ---
    ctx.save();
    ctx.beginPath();
    ctx.rect(marginLeft, marginTop, plotW, plotH);
    ctx.clip();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = compact ? 0.5 : 0.7;
    ctx.beginPath();
    path(LAND);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    path(BORDERS);
    ctx.stroke();
    ctx.restore();

    // --- plot border box ---
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(marginLeft, marginTop, plotW, plotH);

    // --- axis ticks & labels ---
    ctx.fillStyle = '#111111';
    ctx.font = `${compact ? '9px' : '11px'} var(--font-sans, sans-serif)`;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    LAT_TICKS.forEach(lat => {
      const y = projection([0, lat])[1];
      ctx.beginPath();
      ctx.moveTo(marginLeft - 4, y);
      ctx.lineTo(marginLeft, y);
      ctx.stroke();
      ctx.fillText(latLabel(lat), marginLeft - 7, y);
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    LON_TICKS.forEach(lon => {
      const x = projection([lon, 0])[0];
      ctx.beginPath();
      ctx.moveTo(x, marginTop + plotH);
      ctx.lineTo(x, marginTop + plotH + 4);
      ctx.stroke();
      ctx.fillText(lonLabel(lon), x, marginTop + plotH + 7);
    });

    // axis titles
    ctx.font = `${compact ? '600 9px' : '600 11px'} var(--font-sans, sans-serif)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Longitude', marginLeft + plotW / 2, rect.height - 4);

    ctx.save();
    ctx.translate(compact ? 11 : 14, marginTop + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Latitude', 0, 0);
    ctx.restore();

    // --- colorbar ---
    const cbX = marginLeft + plotW + (compact ? 22 : 30);
    const cbY = marginTop;
    const cbH = plotH;
    const steps = 60;
    for (let i = 0; i < steps; i++) {
      const t0 = i / steps;
      const val = minVal + t0 * (maxVal - minVal);
      const y = cbY + cbH - (i / steps) * cbH;
      ctx.fillStyle = tecColor(val, minVal, maxVal);
      ctx.fillRect(cbX, y - cbH / steps - 0.5, colorbarW, cbH / steps + 1);
    }
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(cbX, cbY, colorbarW, cbH);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `${compact ? '9px' : '10.5px'} var(--font-sans, sans-serif)`;
    const numTicks = compact ? 5 : Math.min(10, maxVal / 2 + 1);
    const tickStep = maxVal / (Math.max(1, Math.round(numTicks) - 1));
    for (let v = 0; v <= maxVal + 0.001; v += tickStep) {
      const y = cbY + cbH - (v / maxVal) * cbH;
      ctx.beginPath();
      ctx.moveTo(cbX + colorbarW, y);
      ctx.lineTo(cbX + colorbarW + 4, y);
      ctx.stroke();
      ctx.fillText(Math.round(v).toString(), cbX + colorbarW + 7, y);
    }

    ctx.save();
    ctx.translate(rect.width - (compact ? 10 : 12), cbY + cbH / 2);
    ctx.rotate(Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `${compact ? '600 9px' : '600 10.5px'} var(--font-sans, sans-serif)`;
    ctx.fillText('Ionospheric TEC (TECU)', 0, 0);
    ctx.restore();
  }, [data, stepDeg, compact]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <div className="panel-box tec-map-panel">
      <div className="panel-box-header">
       <span
  className="panel-box-title"
  style={{ color: '#ffffff' }}
>
  Global TEC 
</span>
        <select
          value={stepDeg}
          onChange={(e) => setStepDeg(parseFloat(e.target.value))}
          className="globe-select"
        >
          <option value={10}>10° grid</option>
          <option value={5}>5° grid</option>
        </select>
      </div>

      {error && <div className="panel-error">{error}</div>}
      {loading && !data && <div className="panel-loading">Computing world TEC grid...</div>}

      <div
  className="panel-box-body"
  style={{ background: 'transparent' }}
>
        <div
  ref={wrapRef}
  className="tec-map-canvas-wrap"
  style={{
    height: compact ? '100%' : height,
    background: 'transparent',
  }}
>
          <canvas ref={canvasRef} style={{ display: 'block' }} />
        </div>
      </div>
    </div>
  );
}
