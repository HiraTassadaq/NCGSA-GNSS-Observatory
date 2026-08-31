import { useMemo, useState } from 'react';
import Panel from '../common/Panel';
import Badge from '../common/Badge';
import { EmptyState, LoadingState } from '../common/AsyncStates';
import { CONSTELLATIONS, getConstellationColor, normalizeSystemName } from '../constants/constellations';
import { toneForBackendQuality } from '../constants/thresholds';
import { formatLocalTime, formatNumber } from '../ictp_lib/format';
import { downloadCsv } from '../ictp_lib/csv';
import { mergedSatelliteRows } from '../ictp_lib/selectors';
import { useSelection } from '../ictp_state/SelectionContext';

const COLUMNS = [
  { key: 'prn', label: 'PRN', sortable: true },
  { key: 'system', label: 'Constellation', sortable: true },
  { key: 'visible', label: 'Visibility', sortable: true },
  { key: 'elevation_deg', label: 'Elevation', sortable: true, numeric: true, digits: 1, unit: '°' },
  { key: 'azimuth_deg', label: 'Azimuth', sortable: true, numeric: true, digits: 1, unit: '°' },
  { key: 'avg_snr', label: 'SNR', sortable: true, numeric: true, digits: 1, unit: ' dB-Hz' },
  { key: 'completeness_pct', label: 'Completeness', sortable: true, numeric: true, digits: 1, unit: '%' },
  { key: 'cycle_slips', label: 'Cycle Slips', sortable: true, numeric: true, digits: 0 },
  { key: 'multipath_mp1', label: 'MP1', sortable: true, numeric: true, digits: 3, unit: ' m' },
  { key: 'multipath_mp2', label: 'MP2', sortable: true, numeric: true, digits: 3, unit: ' m' },
  { key: 'iono_delay_l1', label: 'Iono Delay', sortable: true, numeric: true, digits: 2, unit: ' m' },
  { key: 'quality', label: 'Quality', sortable: true },
  { key: 'last_observation', label: 'Last Observation', sortable: true },
];

const PAGE_SIZES = [10, 25, 50, 100];

export default function SatelliteTable({ satellitesResponse, skyplotResponse, loading }) {
  const { selectedPrn, setSelectedPrn } = useSelection();
  const [search, setSearch] = useState('');
  const [systemFilter, setSystemFilter] = useState(() => new Set(CONSTELLATIONS));
  const [sort, setSort] = useState({ key: 'prn', dir: 'asc' });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const rows = useMemo(() => mergedSatelliteRows(satellitesResponse, skyplotResponse), [satellitesResponse, skyplotResponse]);

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    return rows
      .filter((r) => systemFilter.has(normalizeSystemName(r.system)))
      .filter((r) => !q || r.prn.toUpperCase().includes(q) || (r.system || '').toUpperCase().includes(q));
  }, [rows, search, systemFilter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return sort.dir === 'asc' ? av - bv : bv - av;
      return sort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [filtered, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(clampedPage * pageSize, clampedPage * pageSize + pageSize);

  const toggleSort = (key) => {
    setPage(0);
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  };

  const toggleSystem = (sys) => {
    setPage(0);
    setSystemFilter((prev) => {
      const next = new Set(prev);
      if (next.has(sys)) next.delete(sys);
      else next.add(sys);
      return next;
    });
  };

  const exportCsv = () => {
    downloadCsv(
      `gral-satellites-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`,
      COLUMNS.map((c) => ({ label: c.label, value: (row) => row[c.key] })),
      sorted,
    );
  };

  return (
    <Panel
      title="Satellite Table"
      subtitle={`${sorted.length} of ${rows.length} satellites`}
      actions={
        <button
          type="button"
          onClick={exportCsv}
          disabled={!sorted.length}
          className="h-7 px-2.5 rounded-md text-[11px] font-medium border border-border bg-white/5 text-text-muted hover:text-text-primary disabled:opacity-40"
        >
          Export CSV
        </button>
      }
      bodyClassName="flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search PRN or constellation..."
          className="h-8 px-3 rounded-md bg-white/5 border border-border text-xs text-text-primary placeholder:text-text-muted w-56 focus:outline-none focus:border-accent/60"
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {CONSTELLATIONS.map((sys) => (
            <button
              key={sys}
              type="button"
              onClick={() => toggleSystem(sys)}
              className="h-6 px-2 rounded text-[10px] font-semibold border"
              style={{
                borderColor: `${getConstellationColor(sys)}55`,
                color: getConstellationColor(sys),
                background: `${getConstellationColor(sys)}1f`,
                opacity: systemFilter.has(sys) ? 1 : 0.35,
              }}
            >
              {sys}
            </button>
          ))}
        </div>
      </div>

      {loading && !rows.length && <LoadingState />}
      {!loading && !rows.length && <EmptyState title="No satellites tracked yet" />}

      {rows.length > 0 && (
        <div className="border border-border rounded-lg overflow-auto max-h-[420px]">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-panel-raised z-10">
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && toggleSort(col.key)}
                    className={`px-3 py-2 text-left font-medium text-text-muted whitespace-nowrap border-b border-border ${col.sortable ? 'cursor-pointer select-none hover:text-text-primary' : ''}`}
                  >
                    {col.label}
                    {sort.key === col.key && <span className="ml-1 text-accent">{sort.dir === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => {
                const selected = row.prn === selectedPrn;
                return (
                  <tr
                    key={row.prn}
                    onClick={() => setSelectedPrn(selected ? null : row.prn)}
                    className={`cursor-pointer border-b border-border/60 last:border-0 transition-colors ${selected ? 'bg-accent/10' : 'hover:bg-white/5'}`}
                  >
                    <td className="px-3 py-1.5 font-mono font-semibold" style={{ color: getConstellationColor(row.system) }}>{row.prn}</td>
                    <td className="px-3 py-1.5 text-text-primary">{normalizeSystemName(row.system)}</td>
                    <td className="px-3 py-1.5">
                      {row.visible === null ? (
                        <Badge tone="muted">Unknown</Badge>
                      ) : (
                        <Badge tone={row.visible ? 'success' : 'muted'}>{row.visible ? 'Visible' : 'Below horizon'}</Badge>
                      )}
                    </td>
                    <td className="px-3 py-1.5 tabular-nums text-text-primary">{row.elevation_deg != null ? `${formatNumber(row.elevation_deg, 1)}°` : '--'}</td>
                    <td className="px-3 py-1.5 tabular-nums text-text-primary">{row.azimuth_deg != null ? `${formatNumber(row.azimuth_deg, 1)}°` : '--'}</td>
                    <td className="px-3 py-1.5 tabular-nums text-text-primary">{formatNumber(row.avg_snr, 1)}</td>
                    <td className="px-3 py-1.5 tabular-nums text-text-primary">{formatNumber(row.completeness_pct, 1)}</td>
                    <td className="px-3 py-1.5 tabular-nums text-text-primary">{row.cycle_slips ?? '--'}</td>
                    <td className="px-3 py-1.5 tabular-nums text-text-primary">{formatNumber(row.multipath_mp1, 3)}</td>
                    <td className="px-3 py-1.5 tabular-nums text-text-primary">{formatNumber(row.multipath_mp2, 3)}</td>
                    <td className="px-3 py-1.5 tabular-nums text-text-primary">{formatNumber(row.iono_delay_l1, 2)}</td>
                    <td className="px-3 py-1.5"><Badge tone={toneForBackendQuality(row.quality)}>{row.quality || 'Unknown'}</Badge></td>
                    <td className="px-3 py-1.5 tabular-nums text-text-muted whitespace-nowrap">{row.last_observation ? formatLocalTime(row.last_observation) : '--'}</td>
                  </tr>
                );
              })}
              {!pageRows.length && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-3 py-6 text-center text-text-muted">No satellites match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <div className="flex items-center justify-between text-xs text-text-muted">
          <label className="flex items-center gap-1.5">
            Rows per page
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              className="h-7 bg-white/5 border border-border rounded px-1.5 text-text-primary"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <button type="button" disabled={clampedPage === 0} onClick={() => setPage((p) => p - 1)} className="h-7 px-2 rounded border border-border disabled:opacity-30">
              Prev
            </button>
            <span>Page {clampedPage + 1} / {pageCount}</span>
            <button type="button" disabled={clampedPage >= pageCount - 1} onClick={() => setPage((p) => p + 1)} className="h-7 px-2 rounded border border-border disabled:opacity-30">
              Next
            </button>
          </div>
        </div>
      )}
    </Panel>
  );
}
