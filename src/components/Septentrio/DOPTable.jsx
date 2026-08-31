// import React from "react";

// // Lower DOP = better quality
// const BANDS = [
//   { max: 1, color: "#33e39b" },
//   { max: 2, color: "#8be33d" },
//   { max: 5, color: "#f7c948" },
//   { max: 10, color: "#ff9d42" },
//   { max: Infinity, color: "#ff5c7a" },
// ];

// function colorFor(value) {
//   return (
//     BANDS.find((band) => value <= band.max)?.color ??
//     "#ff5c7a"
//   );
// }

// export default function GaugeDial({
//   value,
//   label = "PDOP",
//   max = 10,
// }) {
//   const numericValue = value ?? 0;

//   const clamped = Math.max(
//     0,
//     Math.min(numericValue, max)
//   );

//   const percentage = (clamped / max) * 100;
//   const color = colorFor(numericValue);

//   return (
//     <div
//       style={{
//         width: "100%",
//         height: "100%",
//         minWidth: 0,
//         display: "flex",
//         flexDirection: "column",
//         justifyContent: "center",
//         margin: 0,
//         padding: "4px 8px",
//         fontFamily: "var(--font-ui)",
//       }}
//     >
//       {/* HEADER */}
//       <div
//         style={{
//           display: "flex",
//           alignItems: "baseline",
//           justifyContent: "space-between",
//           margin: 0,
//           padding: 0,
//         }}
//       >
//         <span
//           style={{
//             fontSize: 10,
//             fontWeight: 800,
//             letterSpacing: "0.1em",
//             color: "var(--text-secondary)",
//           }}
//         >
//           {label}
//         </span>

//         <span
//           style={{
//             fontFamily: "var(--font-data)",
//             fontSize: 20,
//             fontWeight: 800,
//             lineHeight: 1,
//             color,
//             textShadow: `0 0 10px ${color}55`,
//           }}
//         >
//           {value != null ? value.toFixed(2) : "--"}
//         </span>
//       </div>

//       {/* GAUGE */}
//       <div
//         style={{
//           position: "relative",
//           width: "100%",
//           height: 12,
//           marginTop: 8,
//           marginBottom: 5,
//         }}
//       >
//         {/* background */}
//         <div
//           style={{
//             position: "absolute",
//             inset: 0,
//             borderRadius: 10,
//             background:
//               "rgba(255,255,255,0.06)",
//             border:
//               "1px solid var(--border-hairline)",
//             overflow: "hidden",
//           }}
//         >
//           {/* quality zones */}
//           <div
//             style={{
//               position: "absolute",
//               inset: 0,
//               display: "flex",
//               opacity: 0.18,
//             }}
//           >
//             <span style={{ flex: 1, background: "#33e39b" }} />
//             <span style={{ flex: 1, background: "#8be33d" }} />
//             <span style={{ flex: 3, background: "#f7c948" }} />
//             <span style={{ flex: 5, background: "#ff9d42" }} />
//           </div>

//           {/* value */}
//           <div
//             style={{
//               position: "absolute",
//               left: 0,
//               top: 0,
//               bottom: 0,
//               width: `${percentage}%`,
//               borderRadius: 10,
//               background: color,
//               boxShadow: `0 0 10px ${color}88`,
//               transition:
//                 "width 0.4s ease, background 0.3s ease",
//             }}
//           />
//         </div>

//         {/* indicator */}
//         <div
//           style={{
//             position: "absolute",
//             top: -3,
//             left: `calc(${percentage}% - 4px)`,
//             width: 8,
//             height: 18,
//             borderRadius: 3,
//             background: "#ffffff",
//             boxShadow: `0 0 8px ${color}`,
//             transition: "left 0.4s ease",
//           }}
//         />
//       </div>

//       {/* SCALE */}
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           margin: 0,
//           padding: 0,
//           fontFamily: "var(--font-data)",
//           fontSize: 7,
//           color: "var(--text-dim)",
//         }}
//       >
//         <span>0</span>
//         <span>1</span>
//         <span>2</span>
//         <span>5</span>
//         <span>{max}</span>
//       </div>

//       {/* STATUS */}
//       <div
//         style={{
//           marginTop: 5,
//           fontSize: 7,
//           fontWeight: 700,
//           letterSpacing: "0.08em",
//           textTransform: "uppercase",
//           color,
//         }}
//       >
//         {numericValue <= 1
//           ? "Excellent"
//           : numericValue <= 2
//           ? "Good"
//           : numericValue <= 5
//           ? "Moderate"
//           : numericValue <= 10
//           ? "Poor"
//           : "Very Poor"}
//       </div>
//     </div>
//   );
// }

import React from "react";

function getStatus(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return "No Data";
  }

  const v = Number(value);

  if (v <= 1) return "Excellent";
  if (v <= 2) return "Good";
  if (v <= 5) return "Moderate";
  if (v <= 10) return "Poor";
  return "Very Poor";
}

function getStatusClass(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return "dop-neutral";
  }

  const v = Number(value);

  if (v <= 1) return "dop-excellent";
  if (v <= 2) return "dop-good";
  if (v <= 5) return "dop-moderate";
  if (v <= 10) return "dop-poor";

  return "dop-very-poor";
}

export default function DOPTable({ dop }) {
  const metrics = [
    { label: "PDOP", value: dop?.PDOP },
    { label: "HDOP", value: dop?.HDOP },
    { label: "VDOP", value: dop?.VDOP },
    { label: "GDOP", value: dop?.GDOP },
    { label: "TDOP", value: dop?.TDOP },
  ];

  return (
    <div className="dop-strip">

      <div className="dop-strip-title">
        <span className="dop-strip-kicker">
          DOP
        </span>

        <span className="dop-strip-label">
          POSITION QUALITY
        </span>
      </div>


      <div className="dop-metrics">

        {metrics.map((metric) => {
          const status = getStatus(metric.value);
          const statusClass = getStatusClass(metric.value);

          return (
            <div
              className={`dop-metric ${statusClass}`}
              key={metric.label}
            >

              <div className="dop-metric-label">
                {metric.label}
              </div>

              <div className="dop-metric-value">
                {metric.value != null
                  ? Number(metric.value).toFixed(2)
                  : "--"}
              </div>

              <div className="dop-metric-status">
                <span className="dop-status-dot" />
                {status}
              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}

