import React, { useMemo } from "react";
import { classifyConstellation, CONSTELLATION_COLOR, satelliteLabel } from "../../lib/satellites";

function isRealSatelliteEntry(sat) {
  return typeof sat.SVID === "number" && sat.Elevation !== -128 && sat.Azimuth !== 511;
}

export default function SatelliteList({ satVisibility, channelStatus }) {
  const rows = useMemo(() => {
    const visMap = new Map();
    (satVisibility?.satellites || []).filter(isRealSatelliteEntry).forEach((s) => visMap.set(s.SVID, s));

    const chanMap = new Map();
    (channelStatus?.satellites || []).filter(isRealSatelliteEntry).forEach((s) => chanMap.set(s.SVID, s));

    const allSvids = new Set([...visMap.keys(), ...chanMap.keys()]);

    return Array.from(allSvids)
      .map((svid) => {
        const vis = visMap.get(svid) || {};
        const chan = chanMap.get(svid) || {};
        return {
          svid,
          label: satelliteLabel(svid),
          constellation: classifyConstellation(svid),
          elevation: vis.Elevation,
          azimuth: vis.Azimuth,
          cn0: chan.CN0 ?? chan.MeanCN0 ?? chan.CN0_L1,
          tracked: chanMap.has(svid),
        };
      })
      .sort((a, b) => (b.elevation ?? -999) - (a.elevation ?? -999));
  }, [satVisibility, channelStatus]);

  if (rows.length === 0) {
    return (
      <div style={{ color: "var(--text-dim)", fontSize: 12, padding: 8 }}>
        Waiting for satellite data...
      </div>
    );
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Sat</th>
          <th>System</th>
          <th>Elev (°)</th>
          <th>Azim (°)</th>
          <th>CN0 (dB-Hz)</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.svid}>
            <td style={{ color: CONSTELLATION_COLOR[r.constellation], fontWeight: 600 }}>
              {r.label}
            </td>
            <td style={{ color: CONSTELLATION_COLOR[r.constellation] }}>{r.constellation}</td>
            <td>{r.elevation != null ? r.elevation.toFixed(0) : "--"}</td>
            <td>{r.azimuth != null ? r.azimuth.toFixed(0) : "--"}</td>
            <td>{r.cn0 != null ? r.cn0.toFixed(1) : "--"}</td>
            <td>
              <span
                className="staleness-dot"
                style={{
                  display: "inline-block",
                  background: r.tracked ? "var(--status-ok)" : "var(--status-stale)",
                  boxShadow: r.tracked ? "0 0 6px var(--status-ok)" : "none",
                }}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
