import React, { useState } from "react";

import { useGnssData } from "../Sep_hooks/useGnssData";

import TopBar from "../components/Septentrio/TopBar";
import Panel from "../components/Septentrio/Panel";
import ErrorBoundary from "../components/Septentrio/ErrorBoundary";

import SkyplotSatMap from "../components/Septentrio/SkyplotSatMap";
import SkyplotPolar from "../components/Septentrio/SkyplotPolar";
import Globe3D from "../components/Septentrio/Globe3D";

import ReceiverStatusPanel from "../components/Septentrio/ReceiverStatusPanel";
import ReceiverStatusSummary from "../components/Septentrio/ReceiverStatusSummary";

import PositionErrorPlot from "../components/Septentrio/PositionErrorPlot";
import CarrierToNoiseBar from "../components/Septentrio/CarrierToNoiseBar";
import IonoDelay from "../components/Septentrio/IonoDelay";
import DOPTable from "../components/Septentrio/DOPTable";
import SatelliteList from "../components/Septentrio/SatelliteList";
import SatCountGraph from "../components/Septentrio/SatCountGraph";
import PlanimetricPlot from "../components/Septentrio/PlanimetricPlot";

// import AboutModal from "../components/Septentrio/AboutModal";

import "./Stylesheet/septentrio.css";

import { CONSTELLATION_ORDER } from "../lib/satellites";


/* =========================================================
   OPTIONAL PANELS
========================================================= */

const EXTRA_OPTIONS = [
  {
    id: "satellite-list",
    label: "Satellite List",
  },
  {
    id: "planimetric",
    label: "Planimetric Plot",
  },
  {
    id: "position-error",
    label: "Position Error (RMS) vs Time",
  },
];


/* =========================================================
   MAIN DASHBOARD
========================================================= */

export default function Septentrio() {
  const data = useGnssData();

  const {
    latest,
    staleness,
    now,
    lastSeen,
    connectionStatus,
  } = data;


  /* =======================================================
     STATE
  ======================================================= */

  const [enabledExtras, setEnabledExtras] = useState(
    new Set()
  );

  // const [showAbout, setShowAbout] = useState(true);


  /* =======================================================
     TOGGLE OPTIONAL PANELS
  ======================================================= */

  const toggleExtra = (id) => {
    setEnabledExtras((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };


  /* =======================================================
     DATA AGE
  ======================================================= */

  const ageOf = (block) => {
    return lastSeen[block]
      ? now - lastSeen[block]
      : null;
  };


  /* =======================================================
     ACTIVE CONSTELLATIONS
  ======================================================= */

  const latestCounts =
    data.satCountHistory[
      data.satCountHistory.length - 1
    ];

  const activeConstellations = latestCounts
    ? CONSTELLATION_ORDER.filter(
        (constellation) =>
          (latestCounts[constellation] || 0) > 0
      )
    : [];


  /* =======================================================
     RECEIVER POSITION
  ======================================================= */

  const receiverPosition = latest.PVTGeodetic
    ? {
        lat: latest.PVTGeodetic.Latitude,
        lon: latest.PVTGeodetic.Longitude,
        height: latest.PVTGeodetic.Height,
      }
    : null;


  const hasExtras = enabledExtras.size > 0;


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="septentrio-dashboard">

      {/* ===================================================
          ABOUT MODAL
      =================================================== */}

      {/* {showAbout && (
        <AboutModal
          onClose={() => setShowAbout(false)}
        />
      )} */}


      {/* ===================================================
          TOP BAR
      =================================================== */}

      <TopBar
        connectionStatus={connectionStatus}
        extraOptions={EXTRA_OPTIONS}
        enabledExtras={enabledExtras}
        onToggleExtra={toggleExtra}
      />


      {/* ===================================================
          DASHBOARD CONTENT
      =================================================== */}

      <main className="septentrio-content">

        <div
          className="septentrio-dashboard-grid"
        >


          {/* =================================================
              ROW 01
          ================================================= */}

         <section className="septentrio-row septentrio-row-01">
            {/* 01 — 2D SKYplot */}

            <Panel
              eyebrow="01"
              title="2D Skyplot"
              status={staleness.SatVisibility}
              ageMs={ageOf("SatVisibility")}
              style={{ height: "100%" }}
            >
              <ErrorBoundary label="2D Skyplot">
                <div className="septentrio-panel-content">
                  <SkyplotPolar
                    satellites={
                      latest.SatVisibility?.satellites || []
                    }
                  />
                </div>
              </ErrorBoundary>
            </Panel>


            {/* 02 — WORLD VIEW */}

            <Panel
              eyebrow="02"
              title="World View"
              status={staleness.SatVisibility}
              ageMs={ageOf("SatVisibility")}
              style={{ height: "100%", minHeight: "0" }}
            >
              <ErrorBoundary label="World View Skyplot">
                <div className="septentrio-panel-content">
                  <SkyplotSatMap
                    satellites={
                      latest.SatVisibility?.satellites || []
                    }
                    receiverPosition={receiverPosition}
                  />
                </div>
              </ErrorBoundary>
            </Panel>


            {/* 03 — GLOBE */}

            <Panel
              eyebrow="03"
              title="Globe"
              status={staleness.SatVisibility}
              ageMs={ageOf("SatVisibility")}
              style={{ height: "100%", minHeight: "0" }}
            >
              <ErrorBoundary label="Globe">
                <div className="septentrio-panel-content">
                  <Globe3D
                    ephemerisBySvid={
                      data.ephemerisBySvid
                    }
                    gpsTimeAnchor={
                      data.gpsTimeAnchor
                    }
                    receiverPosition={
                      receiverPosition
                    }
                  />
                </div>
              </ErrorBoundary>
            </Panel>

          </section>
           <Panel>           
              <ErrorBoundary label="DOP Table">
                <DOPTable dop={latest.DOP} />
              </ErrorBoundary>
            </Panel>

         

          {/* =================================================
              ROW 02
          ================================================= */}

          <section className="septentrio-row septentrio-row-02">

            {/* 04 — IONOSPHERIC DELAY
                2/3 WIDTH
            */}

            <Panel
              eyebrow="04"
              title="Ionospheric Delay"
              status={staleness.GEOIonoDelay}
              ageMs={ageOf("GEOIonoDelay")}
              style={{ height: "100%",minHeight: "0" }}
            >
              <ErrorBoundary label="Ionospheric Delay">
                <div className="septentrio-panel-content">
                  <IonoDelay
                    ionoGrid={data.ionoGrid}
                  />
                </div>
              </ErrorBoundary>
            </Panel>


            {/* 05 — CARRIER TO NOISE
                1/3 WIDTH
            */}

            <Panel
              eyebrow="05"
              title="Carrier to Noise Ratio"
              status={staleness.MeasEpoch}
              ageMs={ageOf("MeasEpoch")}
              style={{ height: "100%" }}
            >
              <ErrorBoundary label="Carrier to Noise">
                <div className="septentrio-panel-content">
                  <CarrierToNoiseBar
                    measEpochPayload={
                      latest.MeasEpoch
                    }
                  />
                </div>
              </ErrorBoundary>
            </Panel>

          </section>


          {/* =================================================
              ROW 03
          ================================================= */}

          <section className="septentrio-row septentrio-row-03">

            {/* 06 — SPECTRUM
                2/3 WIDTH
            */}

            <Panel
              eyebrow="06"
              title="Spectrum View"
              status={staleness.ChannelStatus}
              ageMs={ageOf("ChannelStatus")}
              style={{ height: "100%" }}
            >
              <ErrorBoundary label="Spectrum View">
                <div className="septentrio-panel-content">
                  <SatCountGraph
                    history={
                      data.satCountHistory
                    }
                  />
                </div>
              </ErrorBoundary>
            </Panel>


            {/* 07 — RECEIVER STATUS
                1/3 WIDTH
            */}

            <Panel
              eyebrow="07"
              title="Receiver Status"
              status={staleness.ReceiverStatus}
              ageMs={ageOf("ReceiverStatus")}
              style={{ height: "100%" }}
            >
              <ErrorBoundary label="Receiver Status">

                <div className="receiver-status-content">

                  <ReceiverStatusSummary
                    pvt={latest.PVTGeodetic}
                    dop={latest.DOP}
                    receiverTime={
                      latest.ReceiverTime
                    }
                    activeConstellations={
                      activeConstellations
                    }
                  />

                  <div className="receiver-status-divider" />

                  <ReceiverStatusPanel
                    status={
                      latest.ReceiverStatus
                    }
                  />

                </div>

              </ErrorBoundary>
            </Panel>
           

          </section>
          


          {/* =================================================
              OPTIONAL PANELS
          ================================================= */}

          {enabledExtras.size > 0 && (
  <section className="septentrio-extra-grid">

              {enabledExtras.has(
                "satellite-list"
              ) && (
                <Panel
                  eyebrow="08"
                  title="Satellite List"
                  status={
                    staleness.ChannelStatus
                  }
                  ageMs={ageOf(
                    "ChannelStatus"
                  )}
                  style={{
                    minHeight: 360,
                  }}
                >
                  <ErrorBoundary label="Satellite List">
                    <SatelliteList
                      satVisibility={
                        latest.SatVisibility
                      }
                      channelStatus={
                        latest.ChannelStatus
                      }
                    />
                  </ErrorBoundary>
                </Panel>
              )}


              {enabledExtras.has(
                "planimetric"
              ) && (
                <Panel
                  eyebrow="09"
                  title="Planimetric Plot"
                  status={
                    staleness.PVTGeodetic
                  }
                  ageMs={ageOf(
                    "PVTGeodetic"
                  )}
                  style={{
                    minHeight: 360,
                  }}
                >
                  <ErrorBoundary label="Planimetric Plot">
                    <PlanimetricPlot
                      positionHistory={
                        data.positionHistory
                      }
                    />
                  </ErrorBoundary>
                </Panel>
              )}


              {enabledExtras.has(
                "position-error"
              ) && (
                <Panel
                  eyebrow="10"
                  title="Position Error (RMS) vs Time"
                  status={
                    staleness.PVTGeodetic
                  }
                  ageMs={ageOf(
                    "PVTGeodetic"
                  )}
                  style={{
                    minHeight: 360,
                  }}
                >
                  <ErrorBoundary label="Position Error">
                    <PositionErrorPlot
                      positionHistory={
                        data.positionHistory
                      }
                    />
                  </ErrorBoundary>
                </Panel>
              )}

            </section>
          )}

        </div>

      </main>

    </div>
  );
}