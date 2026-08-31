import React from "react";

function Stat({ label, value, unit }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span className="stat-label">{label}</span>
      <span className="stat-value" style={{ fontSize: 20 }}>
        {value ?? "--"}
        {unit && value != null && <span style={{ fontSize: 11, color: "var(--text-dim)", marginLeft: 3 }}>{unit}</span>}
      </span>
    </div>
  );
}

function fmt(n, digits = 2) {
  if (n == null || Number.isNaN(n)) return null;
  return Number(n).toFixed(digits);
}

export default function SatelliteHealth({ dop, pvt, receiverTime }) {
  const lat = pvt?.Latitude;
  const lon = pvt?.Longitude;
  const height = pvt?.Height;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      <div>
        <div className="stat-label" style={{ marginBottom: 8 }}>Dilution of Precision</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Stat label="PDOP" value={fmt(dop?.PDOP)} />
          <Stat label="TDOP" value={fmt(dop?.TDOP)} />
          <Stat label="HDOP" value={fmt(dop?.HDOP)} />
          <Stat label="VDOP" value={fmt(dop?.VDOP)} />
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--border-hairline)", paddingTop: 12 }}>
        <div className="stat-label" style={{ marginBottom: 8 }}>Position</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Row label="Latitude" value={lat != null ? `${fmt(lat, 6)}°N` : "--"} />
          <Row label="Longitude" value={lon != null ? `${fmt(lon, 6)}°E` : "--"} />
          <Row label="Height (ellip.)" value={height != null ? `${fmt(height, 3)} m` : "--"} />
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--border-hairline)", paddingTop: 12 }}>
        <div className="stat-label" style={{ marginBottom: 8 }}>Time</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Row label="Local Time" value={new Date().toLocaleString()} />
          <Row
            label="TOW / WNc"
            value={
              receiverTime
                ? `${receiverTime.TOW ?? "--"} / ${receiverTime.WNc ?? "--"}`
                : "--"
            }
          />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span className="stat-value" style={{ fontSize: 13 }}>{value}</span>
    </div>
  );
}
