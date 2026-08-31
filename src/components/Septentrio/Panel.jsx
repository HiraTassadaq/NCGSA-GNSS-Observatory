import React from "react";
import { formatAgo } from "../../lib/satellites";

export default function Panel({ eyebrow, title, status, ageMs, children, style, headerExtra }) {
  return (
    <div className="panel" style={style}>
      <span className="panel-corner tl" />
      <span className="panel-corner tr" />
      <span className="panel-corner bl" />
      <span className="panel-corner br" />
      <div className="panel-header">
        {eyebrow && <span className="panel-eyebrow">{eyebrow}</span>}
        <span className="panel-title">{title}</span>
        {headerExtra && <div style={{ marginLeft: status ? 0 : "auto" }}>{headerExtra}</div>}
        {status && (
          <div
            style={{
              marginLeft: headerExtra ? 10 : "auto",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            title={ageMs != null ? `Last update: ${formatAgo(ageMs)}` : undefined}
          >
            <span
              className="staleness-dot"
              style={{
                background:
                  status === "ok"
                    ? "var(--status-ok)"
                    : status === "warn"
                    ? "var(--status-warn)"
                    : "var(--status-stale)",
                boxShadow:
                  status === "ok"
                    ? "0 0 6px var(--status-ok)"
                    : status === "warn"
                    ? "0 0 6px var(--status-warn)"
                    : "none",
              }}
            />
          </div>
        )}
        <span className="panel-menu-dots" style={{ marginLeft: status || headerExtra ? 10 : "auto" }}>
          ⋯
        </span>
      </div>
      <div className="panel-body">{children}</div>
    </div>
  );
}