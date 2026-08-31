import Panel from '../common/Panel';
import Badge from '../common/Badge';
import { EmptyState } from '../common/AsyncStates';
import { toneForBackendQuality } from '../constants/thresholds';
import { useSelection } from '../ictp_state/SelectionContext';
import "../../../dashboard/Stylesheet/ictp.css";
export default function QualityAlerts({ satellitesResponse }) {
  const { setSelectedPrn } = useSelection();
  const alerts = (satellitesResponse || [])
    .filter((s) => s.quality?.startsWith('Partial') || s.quality?.startsWith('Poor') || (s.cycle_slips || 0) > 0)
    .sort((a, b) => (b.cycle_slips || 0) - (a.cycle_slips || 0));

  return (
    <Panel title="Quality Alerts" subtitle={`${alerts.length} satellite(s) flagged`}>
      {!alerts.length && <EmptyState title="No alerts" detail="All tracked satellites are within normal quality bounds." />}
      {alerts.length > 0 && (
        <ul className="flex flex-col divide-y divide-border/60 max-h-56 overflow-y-auto -mx-1">
          {alerts.map((s) => (
            <li key={s.prn}>
              <button
                type="button"
                onClick={() => setSelectedPrn(s.prn)}
                className="w-full flex items-center justify-between gap-2 px-1 py-1.5 text-left hover:bg-white/5 rounded"
              >
                <span className="font-mono text-xs text-text-primary">{s.prn}</span>
                <span className="text-[11px] text-text-muted flex-1 truncate px-2">
                  {s.cycle_slips > 0 ? `${s.cycle_slips} cycle slip(s)` : s.quality}
                </span>
                <Badge tone={toneForBackendQuality(s.quality)}>{s.quality}</Badge>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
