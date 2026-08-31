import { useRef, useState } from 'react';
import KpiCard from './KpiCard';
import StationHealth from './StationHealth';
import { satelliteKpis, stationHealthScore } from '../ictp_lib/selectors';
import { dopQualityLabel, snrQualityLabel, STATUS_TONE } from '../constants/thresholds';
import { formatNumber } from '../ictp_lib/format';

export default function KpiGrid({ satellitesResponse, skyplotResponse, stationResponse }) {
  const kpis = satelliteKpis(satellitesResponse, skyplotResponse);
  const snrLabel = snrQualityLabel(kpis.avgSnr);
  const pdopLabel = dopQualityLabel(stationResponse?.pdop);
  const gdopLabel = dopQualityLabel(stationResponse?.gdop);
  const hdopLabel = dopQualityLabel(stationResponse?.hdop);
  const tdopLabel = dopQualityLabel(stationResponse?.tdop);
  const health = stationHealthScore(kpis, pdopLabel);

  const containerRef = useRef(null);
  const [hover, setHover] = useState(null); // { index, left, top }

  const items = [
    {
      label: 'Satellites Visible',
      value: kpis.visibleCount ?? '--',
      unit: kpis.visibleCount !== null ? `/ ${kpis.totalTracked}` : undefined,
      statusLabel: kpis.visibleCount === null ? 'Unavailable' : undefined,
      tone: kpis.visibleCount === null ? 'muted' : 'success',
      blurb: 'Above your elevation mask and usable for a fix.',
    },
    {
      label: 'Tracked Satellites',
      value: kpis.totalTracked,
      tone: 'muted',
      blurb: 'All distinct satellites seen this session.',
    },
    {
      label: 'Average SNR',
      value: formatNumber(kpis.avgSnr, 1),
      unit: 'dB-Hz',
      statusLabel: snrLabel,
      tone: STATUS_TONE[snrLabel],
      blurb: 'Mean signal strength (C/N0). Higher is cleaner.',
    },
    {
      label: 'Completeness',
      value: formatNumber(kpis.avgCompleteness, 1),
      unit: '%',
      tone: 'muted',
      blurb: 'Average completeness: share of expected epochs actually recorded.',
    },
    {
      label: 'Healthy Sats',
      value: kpis.healthy,
      tone: 'success',
      statusLabel: 'Excellent / Good',
      blurb: 'Healthy satellites: rated Excellent or Good quality by the backend.',
    },
    {
      label: 'Warn / Poor',
      value: kpis.warningOrPoor,
      tone: kpis.warningOrPoor > 0 ? 'warning' : 'success',
      statusLabel: kpis.warningOrPoor > 0 ? 'Needs attention' : 'Clear',
      blurb: 'Warning / Poor: partial/poor quality \u2014 low elevation or a rise/set pass.',
    },
    {
      label: 'Cycle Slips',
      value: kpis.totalCycleSlips,
      tone: kpis.totalCycleSlips > 0 ? 'warning' : 'success',
      statusLabel: kpis.totalCycleSlips > 0 ? 'Present' : 'None',
      blurb: 'Cycle slips this session: carrier-phase interruptions.',
      breakdown: kpis.cycleSlipsBySystem?.length
        ? kpis.cycleSlipsBySystem.map((s) => `${s.system} \u2014 ${s.count}`)
        : undefined,
    },
    {
      label: 'GDOP',
      value: formatNumber(stationResponse?.gdop, 2),
      statusLabel: gdopLabel,
      tone: STATUS_TONE[gdopLabel],
      blurb: 'Position + time error from geometry. Lower is better.',
    },
    {
      label: 'PDOP',
      value: formatNumber(stationResponse?.pdop, 2),
      statusLabel: pdopLabel,
      tone: STATUS_TONE[pdopLabel],
      blurb: 'Position error from satellite geometry. Lower is better.',
    },
    {
      label: 'HDOP',
      value: formatNumber(stationResponse?.hdop, 2),
      statusLabel: hdopLabel,
      tone: STATUS_TONE[hdopLabel],
      blurb: 'Horizontal (lat/lon) position error from geometry. Lower is better.',
    },
    {
      label: 'TDOP',
      value: formatNumber(stationResponse?.tdop, 2),
      statusLabel: tdopLabel,
      tone: STATUS_TONE[tdopLabel],
      blurb: 'Clock-bias/time error from satellite geometry. Lower is better.',
    },
  ];

  const handleEnter = (index, el) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    setHover({ index, left: rect.left - containerRect.left + rect.width / 2, top: rect.bottom - containerRect.top });
  };

  const handleLeave = (index) => setHover((h) => (h?.index === index ? null : h));

  const active = hover ? items[hover.index] : null;

  return (
    <div ref={containerRef} className="relative flex items-stretch divide-x divide-border bg-panel border border-border rounded-panel">
      <StationHealth health={health} />
      {items.map((item, i) => (
        <KpiCard key={item.label} {...item} onEnter={(el) => handleEnter(i, el)} onLeave={() => handleLeave(i)} />
      ))}

      {active && (
        <div
          className="pointer-events-none absolute z-30 -translate-x-1/2"
          style={{ left: hover.left, top: hover.top + 6 }}
        >
          <div className="w-44 rounded-md border border-border bg-panel-raised shadow-panel px-2.5 py-1.5 text-[11px] leading-snug">
            <p className="text-text-primary">{active.blurb}</p>
            {active.statusLabel && (
              <p className="mt-1 text-text-muted">
                {active.value}
                {active.unit ? ` ${active.unit}` : ''} &mdash; {active.statusLabel}
              </p>
            )}
            {active.breakdown && (
              <div className="mt-1.5 pt-1.5 border-t border-border/60 space-y-0.5">
                {active.breakdown.map((line) => (
                  <p key={line} className="text-text-muted tabular-nums">{line}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

