import React from "react";
import "../../dashboard/Stylesheet/septentrio.css";
export default function AboutModal({ onClose }) {
  return (
    <div className="about-overlay">
      <div className="about-modal">

        <span className="panel-corner tl" />
        <span className="panel-corner tr" />
        <span className="panel-corner bl" />
        <span className="panel-corner br" />

        <div className="about-header">
          <div>
            <div className="about-kicker">NCGSA • GNSS OBSERVATORY</div>

            <h2 className="about-title">
              GNSS Telemetry
            </h2>
          </div>

          <button
            className="about-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="about-divider" />

        <div className="about-content">

          <p>
            <strong>GNSS Telemetry</strong> is one of the dashboards of the
            NCGSA GNSS Observatory, providing live visualization and analysis
            of GNSS observations from the Septentrio PolaRx5S GISTM GNSS
            Receiver installed at the GNSS Research Lab, NCGSA, Institute of
            Space Technology (IST), Islamabad, Pakistan.
          </p>

          <p>
            The dashboard provides a comprehensive view of the receiver's GNSS
            observations, including satellite visibility, signal strength
            (C/N₀), positioning information, timing, and satellite geometry.
            It enables users to monitor observed satellites, assess received
            signal quality, and examine the parameters contributing to the GNSS
            position solution.
          </p>

          <p>
            A key feature of the dashboard is the visualization of Total
            Electron Content (TEC) derived from GNSS observations. TEC provides
            valuable information about the state and variability of the
            ionosphere, allowing users to observe changes in ionospheric
            conditions and their potential influence on GNSS signal propagation
            and positioning.
          </p>

          <p>
            The portal brings together GNSS receiver telemetry, satellite
            observations, positioning parameters, signal quality, and
            ionospheric TEC measurements into a unified visualization
            environment, providing a real-time window into the GNSS system and
            ionospheric conditions observed at NCGSA-IST.
          </p>

        </div>

        <div className="about-footer">
          <div className="about-status">
            <span className="about-status-dot" />
            TELEMETRY SYSTEM
          </div>

          <button
            className="about-enter"
            onClick={onClose}
          >
            ENTER DASHBOARD
            <span>→</span>
          </button>
        </div>

      </div>
    </div>
  );
}