import React, { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { classifyConstellation, CONSTELLATION_COLOR, satelliteLabel } from "../../lib/satellites";
import { subPointFromAzEl } from "../../lib/subpoint";

function cssVarToRgb(varString, fallback) {
  if (!varString?.startsWith?.("var(")) return varString || fallback;
  const name = varString.slice(4, -1).trim();
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return val || fallback;
}

// Replaces the old 3D dome/sphere view: plots the satellites currently in
// SatVisibility on a world map at their approximate ground sub-point,
// computed from azimuth/elevation + receiver position (see lib/subpoint.js).
export default function SkyplotSatMap({ satellites, receiverPosition }) {
  const receiverColor = "#ff5c9e";

  const plotted = useMemo(() => {
    if (!receiverPosition) return [];
    return (satellites || [])
      .filter((s) => typeof s.SVID === "number" && s.Elevation != null && s.Elevation >= 0 && s.Azimuth !== 511)
      .map((s) => {
        const constellation = classifyConstellation(s.SVID);
        const point = subPointFromAzEl({
          azDeg: s.Azimuth,
          elDeg: s.Elevation,
          receiverLat: receiverPosition.lat,
          receiverLon: receiverPosition.lon,
          constellation,
        });
        if (!point) return null;
        return { ...point, svid: s.SVID, constellation, elevation: s.Elevation, azimuth: s.Azimuth };
      })
      .filter(Boolean);
  }, [satellites, receiverPosition]);

  if (!receiverPosition) {
    return (
      <div style={emptyStyle}>Waiting for receiver position (PVTGeodetic) to place satellites on the map...</div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <MapContainer
        center={[receiverPosition.lat, receiverPosition.lon]}
        zoom={2}
        style={{ width: "100%", height: "100%", background: "var(--bg-inset)" }}
        worldCopyJump
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        <CircleMarker
          center={[receiverPosition.lat, receiverPosition.lon]}
          radius={6}
          pathOptions={{ color: receiverColor, fillColor: receiverColor, fillOpacity: 1, weight: 2 }}
        >
          <LeafletTooltip permanent direction="top" offset={[0, -8]} className="ground-track-label">
            Receiver
          </LeafletTooltip>
        </CircleMarker>

        {plotted.map((p) => {
          const color = cssVarToRgb(CONSTELLATION_COLOR[p.constellation], "#8a97a8");
          return (
            <CircleMarker
              key={p.svid}
              center={[p.lat, p.lon]}
              radius={5}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.9, weight: 1 }}
            >
              <LeafletTooltip permanent direction="top" offset={[0, -6]} className="ground-track-label">
                {satelliteLabel(p.svid)}
              </LeafletTooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          zIndex: 1000,
          fontSize: 10,
          color: plotted.length > 0 ? "var(--status-ok)" : "var(--status-warn)",
          fontFamily: "var(--font-data)",
          background: "rgba(10,14,20,0.75)",
          padding: "3px 6px",
          borderRadius: 4,
        }}
      >
        {plotted.length} satellites plotted (approx. sub-point from az/el)
      </div>
    </div>
  );
}

const emptyStyle = {
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--text-dim)",
  fontSize: 12,
  textAlign: "center",
  padding: 16,
};
