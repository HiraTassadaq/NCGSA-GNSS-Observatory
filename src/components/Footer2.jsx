import React from "react";
import { Link } from "react-router-dom";
import {
  Globe2,
  MapPin,
  ArrowRight,
  ExternalLink,
  Satellite,
  Layers,
} from "lucide-react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="gnss-footer">
      {/* =====================================================
          PARTNER / INSTITUTION LOGOS
      ====================================================== */}
      <div className="gnss-footer-logos">
        <div className="gnss-footer-logo-item">
          <img
            src="/assets/GNSS-logo.png"
            alt="Institution Logo"
          />
        </div>
        <div className="gnss-footer-logo-divider" />

        <div className="gnss-footer-logo-item">
          <img
            src="/assets/NCGSA-logo.png"
            alt="NCGSA"
          />
        </div>

        <div className="gnss-footer-logo-divider" />

        <div className="gnss-footer-logo-item">
          <img
            src="/assets/IST-logo.png"
            alt="Institute of Space Technology"
          />
        </div>

        <div className="gnss-footer-logo-divider" />

        <div className="gnss-footer-logo-item">
          <img
            src="/assets/Ministry-logo.png"
            alt="Ministry"
          />
        </div>

        <div className="gnss-footer-logo-divider" />

        <div className="gnss-footer-logo-item">
          <img
            src="/assets/HEC-logo.png"
            alt="Higher Education Commission"
          />
        </div>
      </div>


      {/* =====================================================
          BOTTOM BAR
      ====================================================== */}
      <div className="gnss-footer-bottom">
        <p className="gnss-footer-copy">
          © 2026 NCGSA GNSS Observatory • Institute of Space Technology
        </p>

        </div>
    </footer>
  );
};

export default Footer;