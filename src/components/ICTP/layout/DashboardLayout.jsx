/**
 * Fixed, non-scrolling workspace shell -- everything here fits in one
 * viewport, no page-level scroll. The KPI strip lives above this now (see
 * App.jsx), so this only lays out: Station + Satellite Selector (left),
 * Globe and Sky Plot side by side (main). Every other panel (per-satellite
 * charts, quality alerts, time-series charts, the satellite table) is
 * opened on demand as a floating window from the launcher bar above this
 * -- see App.jsx.
 */
import "../../../dashboard/Stylesheet/ictp.css";
export default function DashboardLayout({ station, selector, globe, skyplot }) {
  return (
    <div className="h-full min-h-0 p-3 flex flex-col gap-3 overflow-y-auto lg:overflow-y-hidden">
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3">
        <div className="lg:w-[240px] lg:min-w-[190px] lg:shrink flex flex-col gap-3 min-h-0">
          <div className="shrink-0">{selector}</div>
          <div className="flex-1 min-h-0 overflow-y-auto">{station}</div>
        </div>

        <div className="flex-[3] min-w-0 min-h-[360px] lg:min-h-0">{globe}</div>
        <div className="flex-[2] min-w-0 min-h-[360px] lg:min-h-0">{skyplot}</div>
      </div>
    </div>
  );
}