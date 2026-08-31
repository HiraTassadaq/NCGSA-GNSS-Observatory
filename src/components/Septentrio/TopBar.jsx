import React, { useEffect, useState } from "react";
import AnalysisChartsMenu from "./AnalysisChartsMenu";
import "../../dashboard/Stylesheet/septentrio.css";

export default function TopBar({
  connectionStatus,
  receiverName = "PolaRx5 Reference",
  extraOptions,
  enabledExtras,
  onToggleExtra,
}) {
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const statusMeta = {
    connecting: {
      color: "#f59e0b",
      label: "Connecting",
    },
    live: {
      color: "#10b981",
      label: "Connected",
    },
    stale: {
      color: "#64748b",
      label: "Disconnected",
    },
    error: {
      color: "#ef4444",
      label: "Connection Error",
    },
  }[connectionStatus] || {
    color: "#64748b",
    label: "Offline",
  };

  const utc = clock.toLocaleTimeString("en-US", {
    timeZone: "UTC",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const pktParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Karachi",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(clock);

  return (
    <div className="observatory-subbar">
      {/* Station Identity */}
      <div className="observatory-subbar-left">
        <div>
          <span className="observatory-station-title">GNSS Telemetry</span>
          <span className="observatory-station-subtitle">
            Septentrio Station • Geodetic Reference • IST Islamabad
          </span>
        </div>

        {/* Connection Status */}
        <div
          className="hud-badge-live"
          style={{
            background: `color-mix(in srgb, ${statusMeta.color} 15%, transparent)`,
            borderColor: `color-mix(in srgb, ${statusMeta.color} 35%, transparent)`,
            color: statusMeta.color,
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: statusMeta.color,
              boxShadow: `0 0 6px ${statusMeta.color}`,
              display: "inline-block",
            }}
          />
          <span>{statusMeta.label}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="observatory-subbar-right">
        {/* Dual Clocks */}
        <div className="hud-time-container">
          <div className="hud-time-item">
            <span className="hud-time-label">PKT</span>
            <span className="hud-time-val">{pktParts}</span>
          </div>

          <div className="hud-time-divider" />

          <div className="hud-time-item">
            <span className="hud-time-label">UTC</span>
            <span className="hud-time-val">{utc}</span>
          </div>
        </div>

        {/* Receiver Label */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[11px] font-mono">
          <span className="text-slate-400">NODE:</span>
          <span className="text-cyan-300 font-semibold">{receiverName}</span>
        </div>

        {/* Analysis Charts Dropdown */}
        <AnalysisChartsMenu
          options={extraOptions}
          enabled={enabledExtras}
          onToggle={onToggleExtra}
        />
      </div>
    </div>
  );
}