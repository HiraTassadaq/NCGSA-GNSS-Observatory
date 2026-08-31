import React from "react";
import { Link } from "react-router-dom";
import {
  Globe,
  MapPin,
  Phone,
  ChevronRight,
} from "lucide-react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="gnss-footer">
      {/* =====================================================
          PARTNER / INSTITUTION LOGOS
      ====================================================== */}
      {/* <div className="gnss-footer-logos">
        <div className="gnss-footer-logo-item">
          <img src="/assets/GNSS-logo.png" alt="GNSS Research Lab" />
        </div>
        <div className="gnss-footer-logo-divider" />

        <div className="gnss-footer-logo-item">
          <img src="/assets/IST-logo.png" alt="Institute of Space Technology" />
        </div>
        <div className="gnss-footer-logo-divider" />

        <div className="gnss-footer-logo-item">
          <img src="/assets/NCGSA-logo.png" alt="NCGSA" />
        </div>
        <div className="gnss-footer-logo-divider" />

        <div className="gnss-footer-logo-item">
          <img src="/assets/Ministry-logo.png" alt="Ministry" />
        </div>
        <div className="gnss-footer-logo-divider" />

        <div className="gnss-footer-logo-item">
          <img src="/assets/HEC-logo.png" alt="Higher Education Commission" />
        </div>
      </div> */}
      <div className="gnss-footer-logos">

  <div className="gnss-footer-logo-item">
    <a
      href="https://gnss.ncgsa.org.pk/wp/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GNSS Research Lab"
    >
      <img src="/assets/GNSS-logo.png" alt="GNSS Research Lab" />
    </a>
  </div>

  <div className="gnss-footer-logo-divider" />

  <div className="gnss-footer-logo-item">
    <a
      href="https://www.ist.edu.pk/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Institute of Space Technology"
    >
      <img src="/assets/IST-logo.png" alt="Institute of Space Technology" />
    </a>
  </div>

  <div className="gnss-footer-logo-divider" />

  <div className="gnss-footer-logo-item">
    <a
      href="https://ncgsa.org.pk/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="NCGSA"
    >
      <img src="/assets/NCGSA-logo.png" alt="NCGSA" />
    </a>
  </div>

  <div className="gnss-footer-logo-divider" />

  <div className="gnss-footer-logo-item">
    <a
      href="https://www.pc.gov.pk/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Ministry"
    >
      <img src="/assets/Ministry-logo.png" alt="Ministry" />
    </a>
  </div>

  <div className="gnss-footer-logo-divider" />

  <div className="gnss-footer-logo-item">
    <a
      href="https://www.hec.gov.pk/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Higher Education Commission"
    >
      <img
        src="/assets/HEC-logo.png"
        alt="Higher Education Commission"
      />
    </a>
  </div>

</div>

      {/* =====================================================
          MAIN FOOTER CONTENT
      ====================================================== */}
      <div className="gnss-footer-main">
        {/* ---------------------------------------------------
            COLUMN 1 — GNSS RESEARCH LAB - NCGSA
        ---------------------------------------------------- */}
        <div className="gnss-footer-brand">
          <div className="gnss-footer-kicker">
            GNSS RESEARCH LAB - NCGSA
          </div>

          <h2>
            NCGSA GNSS 
            <br />
            Observatory
          </h2>

          <div className="gnss-footer-title-line" />

          <div className="gnss-footer-subkicker">GNSS</div>

          <div className="gnss-footer-pills">
            <a
              href="https://www.linkedin.com/company/ncgsa/ "
              target="_blank"
              rel="noopener noreferrer"
              className="gnss-footer-pill-btn"
            >
              <span className="gnss-pill-icon">
                {/* <Linkedin size={13} /> */}
              </span>
              <span>LinkedIn</span>
            </a>

            <a
              href="https://ist.edu.pk"
              target="_blank"
              rel="noopener noreferrer"
              className="gnss-footer-pill-btn"
            >
              <span className="gnss-pill-icon">
                <Globe size={13} />
              </span>
              <span>Website</span>
            </a>
          </div>
        </div>

        {/* ---------------------------------------------------
            COLUMN 2 — NCGSA
        ---------------------------------------------------- */}
        <div className="gnss-footer-organization">
          <div className="gnss-footer-kicker">NCGSA</div>

          <div className="gnss-footer-address-item">
            <MapPin size={15} className="gnss-info-icon" />
            <span>1, Islamabad Expressway, Islamabad 44000</span>
          </div>

          <div className="gnss-footer-address-item">
            <Phone size={15} className="gnss-info-icon" />
            <span>(051) 9075799</span>
          </div>

          <div className="gnss-footer-pills">
            <a
              href="https://www.linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="gnss-footer-pill-btn"
            >
              <span className="gnss-pill-icon">
                {/* <Linkedin size={13} /> */}
              </span>
              <span>LinkedIn</span>
            </a>

            <a
              href="https://ncgsa.org.pk"
              target="_blank"
              rel="noopener noreferrer"
              className="gnss-footer-pill-btn"
            >
              <span className="gnss-pill-icon">
                <Globe size={13} />
              </span>
              <span>Website</span>
            </a>
          </div>
        </div>

        {/* ---------------------------------------------------
            COLUMN 3 — EXPLORE
        ---------------------------------------------------- */}
        <div className="gnss-footer-explore">
          <div className="gnss-footer-kicker">EXPLORE</div>

          <div className="gnss-footer-explore-grid">
            <div className="gnss-footer-explore-col">
              <Link to="/dashboards/global" className="gnss-explore-link">
                <span>Global Perspective</span>
                <ChevronRight size={13} />
              </Link>

              <Link to="/dashboards/ublox" className="gnss-explore-link">
                <span>u-blox Station</span>
                <ChevronRight size={13} />
              </Link>

              {/* <Link to="/glossary" className="gnss-explore-link">
                <span>Glossary</span>
                <ChevronRight size={13} />
              </Link> */}
            </div>

            <div className="gnss-footer-explore-col">
              <Link to="/dashboards/ictp" className="gnss-explore-link">
                <span>ICTP Station</span>
                <ChevronRight size={13} />
              </Link>

              <Link to="/dashboards/septentrio" className="gnss-explore-link">
                <span>Septentrio Station</span>
                <ChevronRight size={13} />
              </Link>

              {/* <Link to="/dashboards" className="gnss-explore-link">
                <span>All Dashboards</span>
                <ChevronRight size={13} />
              </Link> */}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          BOTTOM BAR
      ====================================================== */}
      <div className="gnss-footer-bottom">
        <p className="gnss-footer-copy">
          © 2026 NCGSA GNSS Observatory
        </p>
      </div>
    </footer>
  );
};

export default Footer;