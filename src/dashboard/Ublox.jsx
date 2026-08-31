import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

import { SkyPlot2DWidget } from "../ublox_widgets/SkyPlot2D";
import { DeviationMapWidget } from "../ublox_widgets/DeviationMap";
import { WorldPositionViewWidget } from "../ublox_widgets/WorldPositionView";
import { DataViewWidget } from "../ublox_widgets/DataViewWidget";
import { TotalSatellitesWidget } from "../ublox_widgets/TotalSatellites";
import { SNRHistogramWidget } from "../ublox_widgets/SNRHistogram";
import { SatelliteHealthWidget } from "../ublox_widgets/SatelliteHealth";

import { useSupabaseRealtime } from "../ublox_hooks/useSupabaseRealtime";
import { useGNSSStore } from "../ublox_hooks/useGNSSStore";
import './Stylesheet/ublox.css';

/* =========================================================
   CONNECTION BADGE
========================================================= */

function ConnectionBadge() {
  const connected = useGNSSStore((s) => s.receiver.connected);
  const hasReceivedLiveData = useGNSSStore(
    (s) => s.hasReceivedLiveData
  );

  if (!hasReceivedLiveData) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 rounded border font-mono tracking-widest text-[10px] font-bold bg-[#162a20] border-[#224230] text-[#a1d6b2]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
          WAITING FOR LIVE DATA
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-2 px-3 py-1 rounded border font-mono tracking-widest text-[10px] font-bold ${
          connected
            ? "bg-[#162a20] border-[#224230] text-[#a1d6b2]"
            : "bg-danger/10 border-danger/40 text-danger"
        }`}
      >
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            connected
              ? "bg-[#4ade80] animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"
              : "bg-danger shadow-[0_0_8px_rgba(239,68,68,0.8)]"
          }`}
        />

        {connected ? "LIVE" : "OFFLINE"}
      </div>
    </div>
  );
}

/* =========================================================
   UTC TIME
========================================================= */

function GpsTime() {
  const utcTimeStr = useGNSSStore(
    (s) => s.receiver.utc_time
  );

  if (!utcTimeStr) {
    return <>--:--:--</>;
  }

  const time = new Date(utcTimeStr);

  if (Number.isNaN(time.getTime())) {
    return <>--:--:--</>;
  }

  const h = String(time.getUTCHours()).padStart(2, "0");
  const m = String(time.getUTCMinutes()).padStart(2, "0");
  const s = String(time.getUTCSeconds()).padStart(2, "0");

  return (
    <>
      {h}:{m}:{s}
    </>
  );
}

/* =========================================================
   PAKISTAN TIME
========================================================= */

function PktTime() {
  const utcTimeStr = useGNSSStore(
    (s) => s.receiver.utc_time
  );

  if (!utcTimeStr) {
    return <>--:--:--</>;
  }

  const time = new Date(utcTimeStr);

  if (Number.isNaN(time.getTime())) {
    return <>--:--:--</>;
  }

  const pktTime = new Date(
    time.getTime() + 5 * 60 * 60 * 1000
  );

  const h = String(pktTime.getUTCHours()).padStart(2, "0");
  const m = String(pktTime.getUTCMinutes()).padStart(2, "0");
  const s = String(pktTime.getUTCSeconds()).padStart(2, "0");

  return (
    <>
      {h}:{m}:{s}
    </>
  );
}

/* =========================================================
   UBLOX DASHBOARD
========================================================= */

function Ublox() {
  const [aboutOpen, setAboutOpen] = useState(false);

  const aboutRef = useRef(null);

  /*
   * Start Supabase Realtime connection.
   *
   * This replaces the previous WebSocket approach.
   */
  useSupabaseRealtime();

  /* =======================================================
     CLOSE ABOUT PANEL WHEN CLICKING OUTSIDE
  ======================================================= */

  useEffect(() => {
    function handleClick(e) {
      if (
        aboutRef.current &&
        !aboutRef.current.contains(e.target)
      ) {
        setAboutOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClick
      );
    };
  }, []);

  return (
    <div
      className="h-screen w-screen bg-bg-navy font-sans text-slate-300 overflow-hidden flex flex-col select-none"
      style={{
        padding: "6px",
        gap: "4px",
      }}
    >

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="flex-shrink-0 flex items-center justify-between bg-[#0b1016] border-[1.5px] border-[#1f2937] rounded-[10px] px-3 py-1.5 mx-0.5 mt-0.5 shadow-2xl z-50">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-4">

          <div className="flex items-center gap-2.5">

            <div className="flex items-start gap-0.5 pb-0.5 flex-col">

              <span
                className="text-[18px] font-black tracking-[-0.05em] bg-gradient-to-b from-[#e5e5e5] via-[#8a8a8a] to-[#d4d4d4] bg-clip-text text-transparent drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
                style={{
                  fontFamily: "Arial, sans-serif",
                }}
              >
                GNSS Monitor
              </span>

              <span className="text-[11px] font-mono text-slate-400 tracking-[0.2em] font-bold">
                u-blox RECEIVER, NCGSA IST, ISLAMABAD, PAKISTAN
              </span>

            </div>

          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3 font-mono text-[10px] tracking-widest font-bold">

          <ConnectionBadge />

          {/* TIME PANEL */}
          <div className="bg-[#0f2218] border border-[#1f4a2f] rounded-md px-2.5 py-0.5 flex items-center gap-2.5 font-mono text-[10px] tracking-widest font-bold">

            {/* UTC */}
            <div className="flex items-center gap-1.5">

              <span className="text-[9px] text-[#4ade80]/70 uppercase tracking-wider font-semibold">
                UTC
              </span>

              <span className="text-[#4ade80] text-sm font-bold">
                <GpsTime />
              </span>

            </div>

            <div className="w-px h-3.5 bg-[#1f4a2f]" />

            {/* PKT */}
            <div className="flex items-center gap-1.5">

              <span className="text-[9px] text-[#4ade80]/70 uppercase tracking-wider font-semibold">
                PKT
              </span>

              <span className="text-[#4ade80] text-sm font-bold">
                <PktTime />
              </span>

            </div>

          </div>

          {/* ABOUT */}
          <div
            className="relative"
            ref={aboutRef}
          >

            <button
              onClick={() =>
                setAboutOpen((previous) => !previous)
              }
              className="px-3 py-1 rounded flex items-center gap-2 transition-all duration-200 bg-[#1e3a2f] border border-[#2d4a3e] text-white hover:bg-accent/10 hover:border-accent/30"
            >

              <Info size={12} />

              <span className="tracking-widest text-[10px] font-bold">
                ABOUT
              </span>

              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                className={`transition-transform duration-200 ${
                  aboutOpen ? "rotate-180" : ""
                }`}
              >
                <path
                  d="M1 1l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

            </button>

            {/* ABOUT DROPDOWN */}

            {aboutOpen && (
              <div
                className="absolute right-0 top-full mt-2 bg-[#0b1016] border border-[#1f2937] rounded-[10px] shadow-2xl p-4 z-[100] w-[520px]"
                style={{
                  boxShadow:
                    "0 0 20px rgba(0,240,255,0.1), 0 8px 32px rgba(0,0,0,0.5)",
                }}
              >

                <div className="flex items-center gap-2 mb-3">

                  <Info
                    size={14}
                    className="text-accent"
                  />

                  <span className="text-[10px] font-bold tracking-widest text-accent uppercase">
                    About
                  </span>

                </div>

                <div className="text-[10px] text-slate-400 leading-relaxed space-y-2">

                  <p>
                    <span className="text-slate-300 font-semibold">
                      GNSS Monitor
                    </span>{" "}
                    is one of the dashboards of the{" "}
                    <span className="text-slate-300">
                      NCGSA GNSS Observatory
                    </span>
                    , providing a live visualization of GNSS
                    observations from the{" "}
                    <span className="text-slate-300">
                      u-blox ZED-F9P receiver
                    </span>{" "}
                    installed at the{" "}
                    <span className="text-slate-300">
                      GNSS Research Lab, NCGSA, Institute of
                      Space Technology (IST), Islamabad,
                      Pakistan
                    </span>
                    .
                  </p>

                  <p>
                    The dashboard provides a comprehensive view
                    of how the receiver observes GNSS satellites
                    and determines its position in real time.
                    It shows the satellites visible to the
                    receiver, those above the 10° elevation
                    mask, and the satellites used for the
                    position solution.
                  </p>

                  <p>
                    The resulting 3D position fix, including
                    latitude, longitude, height, and UTC time,
                    is presented together with DOP values to
                    indicate positioning geometry and quality.
                  </p>

                  <p>
                    The dashboard also visualizes{" "}
                    <span className="text-slate-300">
                      C/N₀ (carrier-to-noise density ratio)
                    </span>{" "}
                    of individual satellite signals, providing
                    an indication of their received signal
                    strength and quality.
                  </p>

                  <p>
                    The Sky Plot presents a 2D view of satellites
                    in the receiver's sky, while the Ground
                    Track illustrates their movement over the
                    Earth. The world map simultaneously shows
                    the measured position of the NCGSA-IST
                    receiver.
                  </p>

                  <p>
                    Together, these visualizations provide a
                    real-time picture of satellite visibility,
                    signal strength, positioning, timing,
                    receiver height, positioning geometry, and
                    satellite movement.
                  </p>

                </div>

              </div>
            )}

          </div>

        </div>

      </header>

      {/* =====================================================
          MAIN DASHBOARD
      ===================================================== */}

      <main
        className="flex-1 min-h-0 flex flex-col"
        style={{
          gap: "4px",
        }}
      >

        <div
          className="flex-1 min-h-0 flex flex-col"
          style={{
            gap: "4px",
          }}
        >

          {/* =================================================
              TOP ROW
          ================================================= */}

          <div
            className="flex min-h-0"
            style={{
              height: "55%",
              gap: "4px",
            }}
          >

            {/* SKY PLOT */}

            <div
              style={{
                width: "25%",
              }}
              className="min-h-0"
            >
              <SkyPlot2DWidget />
            </div>

            {/* WORLD POSITION */}

            <div
              style={{
                width: "50%",
              }}
              className="min-h-0"
            >
              <WorldPositionViewWidget />
            </div>

            {/* SATELLITE HEALTH */}

            <div
              style={{
                width: "25%",
              }}
              className="min-h-0"
            >
              <SatelliteHealthWidget />
            </div>

          </div>

          {/* =================================================
              BOTTOM ROW
          ================================================= */}

          <div
            className="flex min-h-0"
            style={{
              height: "45%",
              gap: "4px",
            }}
          >

            {/* DEVIATION MAP */}

            <div
              style={{
                width: "25%",
              }}
              className="min-h-0"
            >
              <DeviationMapWidget />
            </div>

            {/* CENTER COLUMN */}

            <div
              style={{
                width: "50%",
              }}
              className="min-h-0 flex flex-col"
            >

              {/* DATA VIEW */}

              <div
                style={{
                  height: "40%",
                  paddingBottom: "3px",
                }}
              >
                <DataViewWidget />
              </div>

              {/* SNR */}

              <div
                style={{
                  height: "60%",
                }}
                className="flex min-h-0 w-full"
              >

                <div
                  style={{
                    width: "100%",
                  }}
                  className="h-full"
                >
                  <SNRHistogramWidget />
                </div>

              </div>

            </div>

            {/* TOTAL SATELLITES */}

            <div
              style={{
                width: "25%",
              }}
              className="min-h-0 flex flex-col"
            >
              <TotalSatellitesWidget />
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

export default Ublox;