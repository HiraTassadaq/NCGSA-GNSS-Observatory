// Small pure functions deriving aggregate/derived views from raw API
// responses. Centralized so KPI cards, charts, and alerts all compute the
// same numbers the same way instead of drifting.

export function mean(values) {
  const nums = values.filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function sum(values) {
  const nums = values.filter((v) => typeof v === 'number' && !Number.isNaN(v));
  return nums.reduce((a, b) => a + b, 0);
}

// A satellite's CURRENT visibility comes from the sky plot's latest sampled
// elevation for that PRN (real, time-varying) -- never inferred from the
// session-wide summary fields, which don't carry a "visible right now" flag.
export function currentVisibilityByPrn(skyplotResponse) {
  const map = new Map();
  for (const sat of skyplotResponse?.satellites || []) {
    const last = sat.path?.[sat.path.length - 1];
    if (last && typeof last.elevation_deg === 'number') {
      map.set(sat.prn, last.elevation_deg >= 0);
    }
  }
  return map;
}

export function satelliteKpis(satellitesResponse, skyplotResponse) {
  const satellites = satellitesResponse || [];
  const visibility = currentVisibilityByPrn(skyplotResponse);
  const visibleCount = satellites.filter((s) => visibility.get(s.prn)).length;
  const healthy = satellites.filter((s) => s.quality?.startsWith('Excellent') || s.quality?.startsWith('Good')).length;
  const warningOrPoor = satellites.filter((s) => s.quality?.startsWith('Partial') || s.quality?.startsWith('Poor')).length;

  return {
    totalTracked: satellites.length,
    visibleCount: visibility.size ? visibleCount : null,
    avgSnr: mean(satellites.map((s) => s.avg_snr)),
    avgCompleteness: mean(satellites.map((s) => s.completeness_pct)),
    healthy,
    warningOrPoor,
    totalCycleSlips: sum(satellites.map((s) => s.cycle_slips)),
    cycleSlipsBySystem: cycleSlipsByConstellation(satellites),
  };
}

// Table/chart rows: one per satellite, joining the session-summary fields
// from /api/satellites with the latest real elevation/azimuth/time sample
// from /api/skyplot. A satellite with no skyplot entry (no nav file yet)
// simply has null elevation/azimuth/visibility -- never backfilled.
export function mergedSatelliteRows(satellitesResponse, skyplotResponse) {
  const latestByPrn = new Map();
  for (const sat of skyplotResponse?.satellites || []) {
    const last = sat.path?.[sat.path.length - 1];
    if (last) latestByPrn.set(sat.prn, last);
  }
  return (satellitesResponse || []).map((s) => {
    const latest = latestByPrn.get(s.prn);
    return {
      ...s,
      elevation_deg: latest?.elevation_deg ?? null,
      azimuth_deg: latest?.azimuth_deg ?? null,
      visible: latest ? latest.elevation_deg >= 0 : null,
      last_observation: latest?.time ?? null,
    };
  });
}

// Real per-time, per-constellation satellite counts, derived directly from
// the sky plot's individual sampled rows (each row already carries its own
// `system`) -- the backend has no dedicated "count by constellation over
// time" endpoint, but every sample used here is a genuine tracked point,
// not an interpolation.
export function constellationCountsOverTime(skyplotResponse) {
  const byTime = new Map();
  for (const sat of skyplotResponse?.satellites || []) {
    const system = (sat.system || 'UNKNOWN').toUpperCase();
    for (const point of sat.path || []) {
      if (!byTime.has(point.time)) byTime.set(point.time, {});
      const row = byTime.get(point.time);
      row[system] = (row[system] || 0) + 1;
    }
  }
  return Array.from(byTime.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([time, counts]) => ({ time, ...counts }));
}

// Session-total cycle slips grouped by constellation, straight from each
// satellite's own `system` and `cycle_slips` fields in /api/satellites --
// no time dimension available (the backend only reports a session total
// per satellite, not a per-epoch slip log), so this is a breakdown of the
// same total the "Cycle Slips (session)" KPI already shows, not a new
// number.
export function cycleSlipsByConstellation(satellitesResponse) {
  const bySystem = new Map();
  for (const sat of satellitesResponse || []) {
    const slips = sat.cycle_slips;
    if (typeof slips !== 'number' || slips <= 0) continue;
    const system = sat.system || 'Unknown';
    bySystem.set(system, (bySystem.get(system) || 0) + slips);
  }
  return Array.from(bySystem.entries())
    .map(([system, count]) => ({ system, count }))
    .sort((a, b) => b.count - a.count);
}

// A single overall "how is this station doing" score, combining the two
// things an operator actually checks first: how many tracked satellites
// are in good shape, and how good the current position geometry is. Each
// half is weighted equally and blended into one 0-100 number -- this is a
// UI convenience for an at-a-glance read, not a metric the backend
// computes or a published GNSS standard, so it's deliberately simple and
// documented here rather than presented as an industry figure.
export function stationHealthScore({ healthy, warningOrPoor }, dopLabel) {
  const totalRated = healthy + warningOrPoor;
  if (totalRated === 0 && !dopLabel) return null;

  const satScore = totalRated > 0 ? (healthy / totalRated) * 100 : null;
  const dopScoreMap = { Excellent: 100, Good: 80, Moderate: 50, Poor: 15, Unavailable: null };
  const dopScore = dopScoreMap[dopLabel] ?? null;

  const parts = [satScore, dopScore].filter((v) => v !== null);
  if (!parts.length) return null;
  const score = Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);

  let label = 'Poor';
  if (score >= 85) label = 'Excellent';
  else if (score >= 65) label = 'Good';
  else if (score >= 40) label = 'Fair';

  return { score, label };
}