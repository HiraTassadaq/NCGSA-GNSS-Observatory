import Panel from './Panel';
import { getConstellationColor, normalizeSystemName } from '../constants/constellations';
import { useSelection } from '../ictp_state/SelectionContext';
import "../../../dashboard/Stylesheet/ictp.css";
export default function SatelliteSelector({ satellitesResponse }) {
  const { selectedPrn, setSelectedPrn } = useSelection();
  const satellites = [...(satellitesResponse || [])].sort((a, b) => a.prn.localeCompare(b.prn));

  return (
    <Panel title="Satellite Selection" bodyClassName="flex items-center gap-2">
      <select
        value={selectedPrn || ''}
        onChange={(e) => setSelectedPrn(e.target.value || null)}
        className="flex-1 h-8 bg-panel border border-border rounded-md px-2 text-xs text-text-primary focus:outline-none focus:border-accent/60"
        style={{
          backgroundColor: 'var(--panel)',
          color: selectedPrn
            ? getConstellationColor(satellites.find((s) => s.prn === selectedPrn)?.system)
            : 'var(--text-primary)',
        }}
      >
        <option value="" style={{ backgroundColor: 'var(--panel-raised)', color: 'var(--text-primary)' }}>
          Select a satellite...
        </option>
        {satellites.map((s) => (
          <option
            key={s.prn}
            value={s.prn}
            style={{
              backgroundColor: 'var(--panel-raised)',
              color: getConstellationColor(s.system) || 'var(--text-primary)',
            }}
          >
            {s.prn} -- {normalizeSystemName(s.system)}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setSelectedPrn(null)}
        disabled={!selectedPrn}
        className="h-8 px-2.5 rounded-md text-[11px] border border-border bg-white/5 text-text-muted hover:text-text-primary disabled:opacity-30"
      >
        Clear
      </button>
    </Panel>
  );
}
