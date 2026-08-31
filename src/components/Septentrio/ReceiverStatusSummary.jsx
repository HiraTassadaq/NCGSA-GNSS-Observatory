import React from "react";
import { CONSTELLATION_ORDER } from "../../lib/satellites";

// SBF PVTGeodetic "Mode" field, lower 4 bits -- standard Septentrio SBF ICD
// convention. Reasonably well-documented, but worth a quick cross-check
// against RxControl's own PVT Mode readout the first time you compare, in
// case your firmware version differs on any edge codes.
const PVT_MODE_LABELS = {
  0: "No PVT",
  1: "Standalone",
  2: "Differential",
  3: "Fixed Location",
  4: "RTK Fixed",
  5: "RTK Float",
  6: "SBAS",
  7: "Moving-Base RTK Fixed",
  8: "Moving-Base RTK Float",
  10: "PPP",
};

function decodeMode(modeRaw) {
  if (modeRaw == null) return "--";
  const base = modeRaw & 0x0f; // lower 4 bits
  return PVT_MODE_LABELS[base] ?? `Unknown (${base})`;
}

function fmt(n, digits = 2) {
  if (n == null || Number.isNaN(n)) return "N/A";
  return Number(n).toFixed(digits);
}

function Field({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
      <span style={{ color: "var(--text-dim)" }}>{label}</span>
      <span className="stat-value" style={{ fontSize: 11 }}>{value}</span>
    </div>
  );
}

export default function ReceiverStatusSummary({ pvt, dop, receiverTime, activeConstellations }) {
  const systemLabel =
    activeConstellations && activeConstellations.length > 0
      ? activeConstellations.join("+")
      : "--";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
      <div>
        <div className="stat-label" style={{ marginBottom: 4 }}>Time / RxClock</div>
        <Field label="WNc" value={receiverTime?.WNc ?? pvt?.WNc ?? "--"} />
        <Field label="TOW" value={receiverTime?.TOW ?? pvt?.TOW ?? "--"} />
        {/* Bias/Drift field names unconfirmed against a real PVTGeodetic
            payload -- if these show "N/A", paste a full PVTGeodetic row
            so the exact key names can be confirmed. */}
        <Field
          label="Clock Bias"
          value={pvt?.RxClkBias != null ? `${fmt(pvt.RxClkBias * 1000, 3)} ms` : "N/A"}
        />
        <Field
          label="Clock Drift"
          value={pvt?.RxClkDrift != null ? `${fmt(pvt.RxClkDrift * 1e6, 3)} ppm` : "N/A"}
        />
      </div>

      <div>
        <div className="stat-label" style={{ marginBottom: 4 }}>DOP / Integrity</div>
        <Field label="PDOP" value={fmt(dop?.PDOP)} />
        <Field label="HDOP" value={fmt(dop?.HDOP)} />
        <Field label="VDOP" value={fmt(dop?.VDOP)} />
        {/* PL/RAIM aren't currently ingested (no block for them yet) --
            shown honestly as N/A rather than fabricated, same as a
            standalone-mode receiver would genuinely show in RxControl. */}
        <Field label="RAIM" value="N/A" />
      </div>

      <div>
        <div className="stat-label" style={{ marginBottom: 4 }}>PVT</div>
        <Field label="Mode" value={decodeMode(pvt?.Mode)} />
        <Field label="System" value={systemLabel} />
        <Field label="Info" value="N/A" />
        <Field label="Corr Age" value="N/A" />
      </div>
    </div>
  );
}