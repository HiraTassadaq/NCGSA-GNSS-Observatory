import { useEffect, useState } from 'react';
import StatusPill from '../common/StatusPill';
import { formatDuration, formatLocalDateTime, formatLocalTime, parseBackendTime, toGpsTime } from '../ictp_lib/format';
import "../../../dashboard/Stylesheet/ictp.css";

function IconButton({ onClick, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="h-8 w-8 flex items-center justify-center rounded-md border border-border bg-white/5 text-text-muted hover:text-text-primary hover:border-white/20 transition-colors"
    >
      {children}
    </button>
  );
}

export default function Header({ systemStatus, wsStatus, onRefresh, onOpenSettings, onToggleFullscreen }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const apiOk = systemStatus?.api === 'ok';
  const wsOk = wsStatus === 'connected';
  const lastProcessed = parseBackendTime(systemStatus?.last_processed_at);

  // Data freshness, not just connectivity. The API/websocket can be
  // perfectly healthy while the underlying observation data is hours old
  // (e.g. the receiver stopped producing files) -- that's a DELAYED/OFFLINE
  // state, not "Live", even though the previous logic here only checked
  // apiOk && wsStatus, so it kept showing "Live" while "Last processed"
  // said hours ago. Thresholds mirror the backend's own staleness window
  // (systemStatus.stale_threshold_seconds, currently 1 hour): under 5 min
  // is LIVE, up to that threshold is DELAYED, beyond it (or no connection
  // at all) is OFFLINE.
  const dataAge = systemStatus?.data_age_seconds;
  const staleThreshold = systemStatus?.stale_threshold_seconds ?? 3600;
  const LIVE_THRESHOLD_SECONDS = 300;

  let connectionState;
  if (!apiOk || !wsOk) {
    connectionState = 'offline';
  } else if (dataAge == null) {
    connectionState = 'offline';
  } else if (dataAge <= LIVE_THRESHOLD_SECONDS) {
    connectionState = 'live';
  } else if (dataAge <= staleThreshold) {
    connectionState = 'delayed';
  } else {
    connectionState = 'offline';
  }

  const STATUS_CONFIG = {
    live: { tone: 'success', label: 'Live', pulse: true },
    delayed: { tone: 'warning', label: 'Delayed', pulse: false },
    offline: { tone: 'danger', label: 'Offline', pulse: false },
  };
  const { tone, label, pulse } = STATUS_CONFIG[connectionState];

  return (
    <header className="observatory-subbar shrink-0">
      <div className="observatory-subbar-left">
        <div>
          <h1 className="observatory-station-title">GNSS Insights</h1>
          <p className="observatory-station-subtitle">ICTP Research Node • IST Islamabad, Pakistan</p>
        </div>

        <div className="flex items-center gap-2">
          <StatusPill tone={tone} pulse={pulse} label={label} />
        </div>
      </div>

      <div className="observatory-subbar-right">
        <div className="hud-time-container">
          <div className="hud-time-item">
            <span className="hud-time-label">PKT</span>
            <span className="hud-time-val">{formatLocalTime(now)}</span>
          </div>
          <div className="hud-time-divider" />
          <div className="hud-time-item">
            <span className="hud-time-label">UTC</span>
            <span className="hud-time-val">{formatLocalTime(now, { timeZone: 'UTC' })}</span>
          </div>
          <div className="hud-time-divider" />
          <div className="hud-time-item">
            <span className="hud-time-label">GPS</span>
            <span className="hud-time-val">{formatLocalTime(toGpsTime(now))}</span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[11px] text-text-muted">
          <span>Processed:</span>
          <span className="text-cyan-300 font-mono font-medium">
            {lastProcessed ? formatLocalDateTime(lastProcessed) : '--'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh Data"
            className="hud-btn"
          >
            ⟳ Refresh
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            title="Settings"
            className="hud-btn"
          >
            ⚙
          </button>
          <button
            type="button"
            onClick={onToggleFullscreen}
            title="Fullscreen HUD"
            className="hud-btn"
          >
            ⛶
          </button>
        </div>
      </div>
    </header>
  );
}
