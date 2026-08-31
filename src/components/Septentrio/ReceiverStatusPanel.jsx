import React from "react";

function fmtUptime(seconds) {
  if (seconds == null) return "--";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

function Flag({ label, value, invert = false }) {
  const ok = invert ? !value : !!value;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span
          className="staleness-dot"
          style={{
            display: "inline-block",
            background: ok ? "var(--status-ok)" : "var(--status-error)",
            boxShadow: ok ? "0 0 6px var(--status-ok)" : "none",
          }}
        />
        <span className="stat-value" style={{ fontSize: 12 }}>{value ?? "--"}</span>
      </span>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span className="stat-value" style={{ fontSize: 12 }}>{value ?? "--"}</span>
    </div>
  );
}

export default function ReceiverStatusPanel({ status }) {
  if (!status) {
    return (
      <div style={{ color: "var(--text-dim)", fontSize: 12 }}>Waiting for ReceiverStatus...</div>
    );
  }

  const gains = Object.keys(status)
    .filter((k) => /^Gain_\d+$/.test(k))
    .sort()
    .map((k) => ({ label: k.replace("Gain_", "Ch "), value: status[k] }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: "var(--font-data)" }}>
      <div>
        <div className="stat-label" style={{ marginBottom: 6 }}>General</div>
        <Row label="Uptime" value={fmtUptime(status.UpTime)} />
        <Row label="CPU Load" value={status.CPULoad != null ? `${status.CPULoad}%` : "--"} />
        <Row label="Temperature" value={status.Temperature != null ? `${status.Temperature}°C` : "--"} />
      </div>

      <div style={{ borderTop: "1px solid var(--border-hairline)", paddingTop: 10 }}>
        <div className="stat-label" style={{ marginBottom: 6 }}>Clock / Sync</div>
        <Flag label="Reference Out Locked" value={status.RefOutLocked} />
        <Flag label="External Time" value={status.ExtTime} />
        <Flag label="External Freq" value={status.ExtFreq} />
        <Flag label="PPS In Cal" value={status.PpsInCal} />
      </div>

      <div style={{ borderTop: "1px solid var(--border-hairline)", paddingTop: 10 }}>
        <div className="stat-label" style={{ marginBottom: 6 }}>Antenna</div>
        <Flag label="Internal Antenna" value={status.IntAnt} />
        <Flag label="Antenna Error" value={status.AntennaError} invert />
      </div>

      {gains.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border-hairline)", paddingTop: 10 }}>
          <div className="stat-label" style={{ marginBottom: 6 }}>AGC Gain per Channel (dB)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px 12px" }}>
            {gains.map((g) => (
              <Row key={g.label} label={g.label} value={g.value} />
            ))}
          </div>
        </div>
      )}

      <div style={{ borderTop: "1px solid var(--border-hairline)", paddingTop: 10 }}>
        <div className="stat-label" style={{ marginBottom: 6 }}>Diagnostics</div>
        <Flag label="Setup Error" value={status.SetupError} invert />
        <Flag label="Diff. Corrections In" value={status.DiffCorrIn} />
        <Row label="Command Count" value={status.CmdCount} />
      </div>
    </div>
  );
}