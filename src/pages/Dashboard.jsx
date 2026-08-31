import React from 'react';
import { Link } from 'react-router-dom';
import {
  Globe2,
  ArrowRight,
  MapPin,
  Cpu,
  Sparkles,
} from 'lucide-react';

const stations = [
  {
    id: 'global',
    name: 'GNSS Constellations Global Perspective',
    route: '/dashboards/global',
    badge: 'Global Perspective',
    hardware: 'Multi-GNSS Multi-Constellation Orbit Model',
    location: 'Global / Regional Coverage',
    status: 'LIVE',
    color: '#38bdf8',
    description:
      'Comprehensive 3D orbital propagation, world ground tracks, visibility contours, and multi-GNSS geometric dilution of precision.',
      },
  {
    id: 'ublox',
    name: 'GNSS Monitor u-block Station',
    route: '/dashboards/ublox',
    badge: 'GNSS MONITOR',
    hardware: 'u-blox ZED-F9P Multi-Band Receiver',
    location: 'IST Islamabad (33.6560° N, 73.1560° E)',
    status: 'LIVE',
    color: '#10b981',
    description:
      'Real-time multi-band observation streams, 2D polar sky plots, SNR histograms, positional deviation drift, and satellite health telemetry.',
      },
  {
    id: 'ictp',
    name: 'GNSS Insights ICTP Station',
    route: '/dashboards/ictp',
    badge: 'GNSS INSIGHTS',
    hardware: 'Abdus Salam ICTP Scientific GNSS Station',
    location: 'GNSS Research Lab, IST',
    status: 'LIVE',
    color: '#6366f1',
    description:
      'Ionospheric delay estimation, carrier phase multipath, cycle slip detection, data completeness metrics, and real-time space weather diagnostics.',
    
  },
  {
    id: 'septentrio',
    name: 'GNSS Telemetry Septentrio Station',
    route: '/dashboards/septentrio',
    badge: 'GNSS TELEMETRY',
    hardware: 'Septentrio PolaRx5 Geodetic Reference',
    location: 'Anchor Node IST Islamabad',
    status: 'LIVE',
    color: '#a855f7',
    description:
      'Geodetic-grade multi-frequency tracking, AIM+ RF spectrum interference mitigation, high-rate scintillation indices, and sub-centimeter positioning.',
      },
];

const constellations = [
  { name: 'GPS', origin: 'USA', color: '#00f0ff', count: '31 Active' },
  { name: 'GLONASS', origin: 'Russia', color: '#10b981', count: '24 Active' },
  { name: 'Galileo', origin: 'European Union', color: '#3b82f6', count: '26 Active' },
  { name: 'BeiDou', origin: 'China', color: '#f59e0b', count: '30+ Active' },
  { name: 'NavIC / IRNSS', origin: 'India', color: '#8b5cf6', count: '7 Regional' },
  { name: 'QZSS', origin: 'Japan', color: '#ec4899', count: '4 Regional' },
  { name: 'SBAS', origin: 'Augmentation', color: '#14b8a6', count: 'Multi-Node' },
];

export default function Dashboard() {
  return (
    <div className="observatory-dashboard-wrapper">

      <style>{`

        /* =====================================================
           SOFT GNSS OBSERVATORY DESIGN
        ===================================================== */

        .observatory-dashboard-wrapper {
          min-height: 100%;
          width: 100%;
          background:
            radial-gradient(
              circle at 10% 0%,
              rgba(56, 189, 248, 0.055),
              transparent 30%
            ),
            radial-gradient(
              circle at 90% 15%,
              rgba(99, 102, 241, 0.045),
              transparent 28%
            ),
            #07111f;
font-family: Arial, sans-serif;
          color: #e2e8f0;
        }

        /* =====================================================
           SUB HEADER
        ===================================================== */

        .observatory-subbar {
          min-height: 58px;
          padding: 0 28px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 20px;

          background: rgba(8, 20, 35, 0.78);

          border-bottom:
            1px solid rgba(148, 163, 184, 0.09);

          backdrop-filter: blur(18px);
        }

        .observatory-station-title {
          display: block;

          font-size: 13px;
          font-weight: 700;

          color: #f1f5f9;
        }

        .observatory-station-subtitle {
          display: block;

          margin-top: 3px;

          font-size: 10px;

          color: #718096;
        }

        .observatory-subbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* =====================================================
           LIVE BADGE
        ===================================================== */

        .hud-badge-live {
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: Arial, sans-serif;

          padding: 6px 10px;

          border-radius: 20px;

          background: rgba(16, 185, 129, 0.06);

          border:
            1px solid rgba(16, 185, 129, 0.15);

          color: #6ee7b7;

          font-size: 10px;
          font-weight: 600;
        }

        .pulse-indicator {
          width: 6px;
          height: 6px;

          border-radius: 50%;

          background: #34d399;

          box-shadow:
            0 0 0 4px rgba(52, 211, 153, 0.07);

          animation: softPulse 2s infinite;
        }

        @keyframes softPulse {
          0%, 100% {
            opacity: 1;
          }

          50% {
            opacity: 0.45;
          }
        }

        /* =====================================================
           COORDINATES
        ===================================================== */

        .hud-time-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .hud-time-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .hud-time-label {
          font-size: 8px;
          color: #64748b;
          letter-spacing: .12em;
        }

        .hud-time-val {
          font-family: "JetBrains Mono", monospace;

          font-size: 10px;

          color: #cbd5e1;
        }

        .hud-time-divider {
          width: 1px;
          height: 22px;

          background:
            rgba(148, 163, 184, 0.12);
        }

        /* =====================================================
           COPILOT
        ===================================================== */

        .hud-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          padding: 7px 12px;

          border-radius: 8px;

          background:
            rgba(56, 189, 248, 0.06);

          border:
            1px solid rgba(56, 189, 248, 0.15);

          color: #bae6fd;

          text-decoration: none;

          font-size: 10px;
          font-weight: 600;

          transition: all .2s ease;
        }

        .hud-btn:hover {
          transform: translateY(-1px);

          background:
            rgba(56, 189, 248, 0.11);

          border-color:
            rgba(56, 189, 248, 0.32);

          box-shadow:
            0 7px 22px rgba(56, 189, 248, .07);
        }

        /* =====================================================
           MAIN
        ===================================================== */

        .observatory-main {
          width: min(1440px, 100%);

          margin: 0 auto;

          padding: 28px 24px 40px;
        }

        /* =====================================================
           SUMMARY
        ===================================================== */

        .observatory-summary {
          position: relative;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 30px;

          padding: 27px 30px;

          margin-bottom: 30px;

          border-radius: 18px;

          background:
            linear-gradient(
              135deg,
              rgba(15, 32, 52, .76),
              rgba(8, 20, 35, .86)
            );

          border:
            1px solid rgba(148, 163, 184, .10);

          box-shadow:
            0 12px 35px rgba(0,0,0,.18);

          overflow: hidden;
        }

        .observatory-summary::before {
          content: "";

          position: absolute;

          top: 0;
          left: 30px;

          width: 130px;
          height: 1px;

          background:
            linear-gradient(
              90deg,
              rgba(56,189,248,.8),
              transparent
            );
        }

        .observatory-summary-content {
          max-width: 700px;
        }

        .observatory-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;

          margin-bottom: 9px;

          font-family:
            "JetBrains Mono", monospace;

          font-size: 9px;

          letter-spacing: .11em;

          color: #38bdf8;
        }

        .observatory-eyebrow-dot {
          width: 4px;
          height: 4px;

          border-radius: 50%;

          background: #38bdf8;
        }

        .observatory-summary h2 {
          margin: 0 0 9px;

          font-size: 25px;

          line-height: 1.2;

          font-weight: 750;

          letter-spacing: -.025em;

          color: #f8fafc;
        }

        .observatory-summary p {
          margin: 0;

          font-size: 12.5px;

          line-height: 1.7;

          color: #8b9aaf;
        }

        /* =====================================================
           SUMMARY METRICS
        ===================================================== */

        .observatory-metrics {
          display: grid;

          grid-template-columns:
            repeat(3, minmax(105px, 1fr));

          gap: 9px;

          min-width: 360px;
        }

        .observatory-metric {
          padding: 13px 15px;

          border-radius: 11px;

          background:
            rgba(3,12,23,.48);

          border:
            1px solid rgba(148,163,184,.08);

          transition: all .2s ease;
        }

        .observatory-metric:hover {
          transform: translateY(-2px);

          background:
            rgba(8,24,40,.65);

          border-color:
            rgba(56,189,248,.20);
        }

        .observatory-metric-label {
          display: block;

          margin-bottom: 5px;

          font-family:
            "JetBrains Mono", monospace;

          font-size: 8px;

          color: #64748b;

          text-transform: uppercase;
        }

        .observatory-metric-value {
          display: block;

          font-size: 21px;

          line-height: 1;

          font-weight: 750;

          color: #e2e8f0;
        }

        .cyan {
          color: #67e8f9;
        }

        .green {
          color: #6ee7b7;
        }

        .indigo {
          color: #a5b4fc;
        }

        /* =====================================================
           SECTION HEADER
        ===================================================== */

        .observatory-section-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;

          margin-bottom: 14px;
        }

        .observatory-section-label {
          display: block;

          font-family:
            "JetBrains Mono", monospace;

          font-size: 9px;

          letter-spacing: .1em;

          color: #38bdf8;
        }

        .observatory-section-title {
          margin: 4px 0 0;

          font-size: 18px;

          font-weight: 700;

          color: #e5edf7;
        }

        /* =====================================================
           STATION GRID
        ===================================================== */

        .station-grid {
          display: grid;

          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap: 14px;

          margin-bottom: 32px;
        }

        /* =====================================================
           STATION CARD
        ===================================================== */

        .station-card {
          position: relative;

          min-width: 0;

          min-height: 360px;

          padding: 20px;

          display: flex;
          flex-direction: column;
          justify-content: space-between;

          border-radius: 15px;

          background:
            linear-gradient(
              145deg,
              rgba(15,31,49,.78),
              rgba(7,17,30,.90)
            );

          border:
            1px solid rgba(148,163,184,.09);

          text-decoration: none;

          overflow: hidden;

          transition:
            transform .22s ease,
            border-color .22s ease,
            box-shadow .22s ease;
        }

        .station-card::before {
          content: "";

          position: absolute;

          top: 0;
          left: 20px;
          right: 20px;

          height: 1px;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(56,189,248,.35),
              transparent
            );
        }

        .station-card:hover {
          transform: translateY(-5px);

          border-color:
            rgba(56,189,248,.24);

          box-shadow:
            0 16px 35px rgba(0,0,0,.28),
            0 0 25px rgba(56,189,248,.04);
        }

        /* =====================================================
           CARD TOP
        ===================================================== */

        .station-card-top {
          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 8px;

          margin-bottom: 17px;
        }

        .station-badge {
          padding: 4px 7px;

          border-radius: 5px;

          background:
            rgba(56,189,248,.06);

          border:
            1px solid rgba(56,189,248,.14);

          color: #67e8f9;

          font-family:
            "JetBrains Mono", monospace;

          font-size: 8px;

          font-weight: 700;

          letter-spacing: .06em;
        }

        .station-live {
          display: flex;
          align-items: center;
          gap: 5px;

          color: #6ee7b7;

          font-family:
            "JetBrains Mono", monospace;

          font-size: 8px;

          font-weight: 600;
        }

        .station-live-dot {
          width: 5px;
          height: 5px;

          border-radius: 50%;

          background: #34d399;

          box-shadow:
            0 0 7px rgba(52,211,153,.55);
        }

        /* =====================================================
           CARD CONTENT
        ===================================================== */

        .station-card h4 {
          margin: 0 0 8px;

          font-size: 16px;

          line-height: 1.35;

          font-weight: 700;

          color: #f1f5f9;
        }

        .station-description {
          margin: 0 0 17px;

          font-size: 11.5px;

          line-height: 1.65;

          color: #8291a6;
        }

        .station-info {
          display: flex;

          flex-direction: column;

          gap: 8px;

          margin-bottom: 18px;
        }

        .station-info-row {
          display: flex;

          align-items: flex-start;

          gap: 7px;

          font-size: 9.5px;

          line-height: 1.45;

          color: #66758a;
        }

        .station-info-row svg {
          flex-shrink: 0;
          margin-top: 1px;
        }

        /* =====================================================
           CARD METRICS
        ===================================================== */

        .station-metrics {
          display: grid;

          grid-template-columns:
            repeat(3, 1fr);

          gap: 7px;

          padding: 11px 0;

          margin-bottom: 13px;

          border-top:
            1px solid rgba(148,163,184,.08);

          border-bottom:
            1px solid rgba(148,163,184,.08);
        }

        .station-metric-label {
          display: block;

          font-family:
            "JetBrains Mono", monospace;

          font-size: 7.5px;

          color: #59687c;
        }

        .station-metric-value {
          display: block;

          margin-top: 3px;

          font-size: 10px;

          font-weight: 700;

          color: #cbd5e1;
        }

        /* =====================================================
           LAUNCH
        ===================================================== */

        .station-launch {
          display: flex;

          align-items: center;

          justify-content: space-between;

          color: #67e8f9;

          font-size: 10px;

          font-weight: 700;
        }

        .station-launch svg {
          transition:
            transform .2s ease;
        }

        .station-card:hover
        .station-launch svg {
          transform:
            translateX(4px);
        }

        /* =====================================================
           CONSTELLATIONS
        ===================================================== */

        .constellation-panel {
          padding: 20px 22px;

          background:
            rgba(10,24,40,.62);

          border:
            1px solid rgba(148,163,184,.09);

          border-radius: 15px;
        }

        .constellation-header {
          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 15px;

          margin-bottom: 14px;
        }

        .constellation-title {
          display: flex;

          align-items: center;

          gap: 8px;

          font-size: 12px;

          font-weight: 700;

          color: #e2e8f0;
        }

        .constellation-frequency {
          font-family:
            "JetBrains Mono", monospace;

          font-size: 8px;

          color: #536277;
        }

        .constellation-grid {
          display: grid;

          grid-template-columns:
            repeat(7, minmax(0, 1fr));

          gap: 8px;
        }

        .constellation-item {
          padding: 10px 12px;

          background:
            rgba(4,13,24,.5);

          border:
            1px solid rgba(148,163,184,.07);

          border-radius: 9px;

          transition: all .18s ease;
        }

        .constellation-item:hover {
          transform: translateY(-2px);

          background:
            rgba(14,31,49,.72);

          border-color:
            rgba(56,189,248,.16);
        }

        .constellation-name-row {
          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 5px;
        }

        .constellation-name {
          font-size: 11px;

          font-weight: 700;
        }

        .constellation-origin {
          font-family:
            "JetBrains Mono", monospace;

          font-size: 7px;

          color: #526176;
        }

        .constellation-count {
          display: block;

          margin-top: 4px;

          font-family:
            "JetBrains Mono", monospace;

          font-size: 9px;

          color: #8291a6;
        }

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 1200px) {

          .station-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .constellation-grid {
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
          }

          .observatory-summary {
            flex-direction: column;
            align-items: flex-start;
          }

          .observatory-metrics {
            width: 100%;
            min-width: 0;
          }
        }

        @media (max-width: 800px) {

          .observatory-subbar {
            padding: 10px 16px;
          }

          .hud-time-container {
            display: none;
          }

          .observatory-main {
            padding: 20px 15px 30px;
          }

          .station-grid {
            grid-template-columns: 1fr;
          }

          .constellation-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 520px) {

          .observatory-subbar {
            flex-direction: column;
            align-items: flex-start;
          }

          .observatory-subbar-right {
            width: 100%;
            justify-content: space-between;
          }

          .observatory-metrics {
            grid-template-columns: 1fr;
          }

          .constellation-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }

      `}</style>

      {/* =====================================================
          SUBHEADER
      ===================================================== */}
{/* 
      <div className="observatory-subbar">

        <div>
          <span className="observatory-station-title">
            Observatory Command Center
          </span>

          <span className="observatory-station-subtitle">
            Unified Multi-Receiver Telemetry Hub • IST Islamabad
          </span>
        </div>

        <div className="observatory-subbar-right">

          <div className="hud-badge-live">
            <span className="pulse-indicator" />
            <span>4 Stations Active</span>
          </div>

          <div className="hud-time-container">

            <div className="hud-time-item">
              <span className="hud-time-label">LAT</span>
              <span className="hud-time-val">
                33.6560° N
              </span>
            </div>

            <div className="hud-time-divider" />

            <div className="hud-time-item">
              <span className="hud-time-label">LON</span>
              <span className="hud-time-val">
                73.1560° E
              </span>
            </div>

          </div>

          <Link to="/copilot" className="hud-btn">
            <Sparkles size={13} />
            <span>Ask Copilot</span>
          </Link>

        </div>
      </div>
 */}

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="observatory-main">

        {/* SUMMARY */}

        <section className="observatory-summary">

          <div className="observatory-summary-content">

            {/* <div className="observatory-eyebrow">
              <span>NCGSA RESEARCH INFRASTRUCTURE</span>

              <span className="observatory-eyebrow-dot" />

              <span style={{ color: '#718096' }}>
                Autonomous GNSS Ground Segment
              </span>
            </div> */}

            <h2>
              Multi-Receiver GNSS Observatory Network
            </h2>

            {/* <p>
              The National Center of GIS and Space Applications
              (NCGSA) GNSS Observatory at IST operates heterogeneous
              receiver tiers combining geodetic reference anchors,
              OEM sensor arrays, and space weather nodes for
              high-precision geodesy and atmospheric research.
            </p> */}

          </div>


          <div className="observatory-metrics">

            <div className="observatory-metric">
              <span className="observatory-metric-label">
                Total Satellites
              </span>

              <span className="observatory-metric-value cyan">
                80+
              </span>
            </div>

            <div className="observatory-metric">
              <span className="observatory-metric-label">
                Geometry PDOP
              </span>

              <span className="observatory-metric-value green">
                1.2
              </span>
            </div>

            <div className="observatory-metric">
              <span className="observatory-metric-label">
                Observatory State
              </span>

              <span className="observatory-metric-value indigo">
                Live
              </span>
            </div>

          </div>

        </section>


        {/* STATIONS */}

        <section>

          <div className="observatory-section-header">

            <div>

              <span className="observatory-section-label">
                LIVE OBSERVATORY PERSPECTIVES
              </span>

              <h3 className="observatory-section-title">
                Select a Receiver Station
              </h3>

            </div>

          </div>


          <div className="station-grid">

            {stations.map((station) => (

              <Link
                key={station.id}
                to={station.route}
                className="station-card"
              >

                <div>

                  <div className="station-card-top">

                    {/* <span
                      className="station-badge"
                      style={{
                        color: station.color,
                        borderColor: `${station.color}30`,
                        background: `${station.color}10`,
                      }}
                    >
                      {station.badge}
                    </span> */}

                    {/* <span className="station-live">
                      <span className="station-live-dot" />
                      {station.status}
                    </span> */}

                  </div>


                  <h4>
                    {station.name}
                  </h4>


                  <p className="station-description">
                    {station.description}
                  </p>


                  <div className="station-info">

                    <div className="station-info-row">
                      <Cpu size={12} color="#38bdf8" />
                      <span>
                        {station.hardware}
                      </span>
                    </div>

                    <div className="station-info-row">
                      <MapPin size={12} color="#34d399" />
                      <span>
                        {station.location}
                      </span>
                    </div>

                  </div>

                </div>


                <div>

                  <div className="station-metrics">

                    {station.metrics.map((metric) => (

                      <div key={metric.label}>

                        <span className="station-metric-label">
                          {metric.label}
                        </span>

                        <span className="station-metric-value">
                          {metric.value}
                        </span>

                      </div>

                    ))}

                  </div>


                  <div
                    className="station-launch"
                    style={{
                      color: station.color,
                    }}
                  >
                    <span>
                      Launch Dashboard
                    </span>

                    <ArrowRight size={15} />
                  </div>

                </div>

              </Link>

            ))}

          </div>

        </section>


        {/* CONSTELLATIONS */}

        <section className="constellation-panel">

          <div className="constellation-header">

            <div className="constellation-title">

              <Globe2
                size={16}
                color="#38bdf8"
              />

              <span>
                Monitored Satellite Constellations
              </span>

            </div>

            <span className="constellation-frequency">
              MULTI-CONSTELLATION FREQUENCY BANDS
              (L1/L2/L5/E1/E5/B1/B2)
            </span>

          </div>


          <div className="constellation-grid">

            {constellations.map((c) => (

              <div
                key={c.name}
                className="constellation-item"
              >

                <div className="constellation-name-row">

                  <span
                    className="constellation-name"
                    style={{ color: c.color }}
                  >
                    {c.name}
                  </span>

                  <span className="constellation-origin">
                    {c.origin}
                  </span>

                </div>

                <span className="constellation-count">
                  {c.count}
                </span>

              </div>

            ))}

          </div>

        </section>

      </main>

    </div>
  );
}