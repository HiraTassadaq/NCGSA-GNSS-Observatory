import React, { useMemo, useState } from "react";

import {
  colorForDelay,
  isNotMonitored,
  cellSizeFor,
  IONO_LEGEND_STOPS,
} from "../../lib/igpGrid";

import {
  WORLD_W,
  WORLD_H,
  getWorldOutlinePath,
  projectLatLon,
} from "../../lib/worldOutline";
import "../../dashboard/Stylesheet/septentrio.css";
export default function IonoDelay({ ionoGrid }) {
  const points = useMemo(() => {
    return Object.entries(ionoGrid || {}).map(
      ([gridKey, point], index) => ({
        ...point,
        gridKey,
        originalIndex: index,
      })
    );
  }, [ionoGrid]);

  const worldPath = useMemo(
    () => getWorldOutlinePath(),
    []
  );

  const [hover, setHover] = useState(null);

  const cells = useMemo(() => {
    return points.map((p, index) => {
      const { halfLon, halfLat } = cellSizeFor(p.lat);

      const [x0, y0] = projectLatLon(
        p.lat + halfLat,
        p.lon - halfLon
      );

      const [x1, y1] = projectLatLon(
        p.lat - halfLat,
        p.lon + halfLon
      );

      const notMonitored = isNotMonitored(p.givei);

      const cellKey = [
        "iono",
        p.gridKey,
        p.band ?? "unknown-band",
        p.maskNo ?? "unknown-mask",
        p.lat ?? "unknown-lat",
        p.lon ?? "unknown-lon",
        index,
      ].join("_");

      return {
        ...p,
        cellKey,
        x: x0,
        y: y0,
        w: Math.max(1, x1 - x0),
        h: Math.max(1, y1 - y0),
        notMonitored,
      };
    });
  }, [points]);

  if (cells.length === 0) {
    return (
      <div className="iono-empty">
        <span>Waiting for GEOIonoDelay data...</span>
      </div>
    );
  }

  return (
    <div className="iono-container">

      {/* MAP AREA */}
      <div className="iono-map-wrapper">

        <svg
          viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
          preserveAspectRatio="none"
          className="iono-map"
          onMouseLeave={() => setHover(null)}
        >

          <defs>
            <pattern
              id="ionoNotMonitored"
              width="7"
              height="7"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect
                width="7"
                height="7"
                fill="#171c24"
              />

              <line
                x1="0"
                y1="0"
                x2="0"
                y2="7"
                stroke="#4c5668"
                strokeWidth="1.2"
              />
            </pattern>
          </defs>

          {/* LONGITUDE GRID */}
          {Array.from(
            { length: 13 },
            (_, i) => i * 30
          ).map((lon) => {
            const [x] = projectLatLon(
              0,
              lon - 180
            );

            return (
              <line
                key={`longitude-${lon}`}
                x1={x}
                y1={0}
                x2={x}
                y2={WORLD_H}
                className="iono-grid-line"
              />
            );
          })}

          {/* LATITUDE GRID */}
          {Array.from(
            { length: 5 },
            (_, i) => i * 30
          ).map((lat) => {
            const [, y] = projectLatLon(
              lat - 60,
              0
            );

            return (
              <line
                key={`latitude-${lat}`}
                x1={0}
                y1={y}
                x2={WORLD_W}
                y2={y}
                className="iono-grid-line"
              />
            );
          })}

          {/* IGP CELLS */}
          {cells.map((c) => (
            <rect
              key={c.cellKey}
              x={c.x}
              y={c.y}
              width={c.w}
              height={c.h}
              fill={
                c.notMonitored
                  ? "url(#ionoNotMonitored)"
                  : colorForDelay(c.delay)
              }
              fillOpacity={
                c.notMonitored ? 1 : 0.94
              }
              className="iono-cell"
              onMouseEnter={() => setHover(c)}
              onMouseMove={() => setHover(c)}
            />
          ))}

          {/* COASTLINES */}
          <path
            d={worldPath}
            fill="none"
            className="iono-coastline"
          />
        </svg>

        {/* TOP STATUS */}
        <div className="iono-status">
          <span className="iono-status-dot" />
          {points.length} IGPs tracked
        </div>

        {/* HOVER INFORMATION */}
        {hover && (
          <div className="iono-tooltip">
            <div className="iono-tooltip-title">
              IGP {hover.maskNo}
            </div>

            <div className="iono-tooltip-data">
              Band {hover.band}
              <span>•</span>

              {hover.notMonitored
                ? "Not monitored"
                : `${hover.delay?.toFixed(2)} m`}

              <span>•</span>

              S{hover.prn}
            </div>

            {!hover.notMonitored && (
              <div className="iono-tooltip-givei">
                GIVEI {hover.givei}
              </div>
            )}
          </div>
        )}
      </div>

      {/* LEGEND */}
      <div className="iono-legend">

        <div className="iono-legend-header">
          <span className="iono-legend-title">
            IONOSPHERIC DELAY
          </span>

          <span className="iono-legend-unit">
            metres
          </span>
        </div>

        <div className="iono-legend-row">

          <span className="iono-legend-value">
            0 m
          </span>

          <div
            className="iono-gradient"
            style={{
              background: `linear-gradient(
                90deg,
                ${IONO_LEGEND_STOPS.map(
                  (s) =>
                    `rgb(${s.c[0]},${s.c[1]},${s.c[2]})
                     ${(s.m / 10) * 100}%`
                ).join(", ")}
              )`,
            }}
          />

          <span className="iono-legend-value">
            10 m
          </span>

          <div className="iono-unmonitored">
            <span className="iono-unmonitored-box" />
            <span>Not monitored</span>
          </div>

        </div>

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
};