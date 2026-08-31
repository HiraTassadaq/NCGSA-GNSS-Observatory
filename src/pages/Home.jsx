import { useState, useEffect } from 'react';
import Copilot from '../components/Copilot';
import { Link } from 'react-router-dom';
import '../dashboardStyle.css';
import {
  ArrowRight,
  Satellite,
  MapPin,
  Gauge,
  Radio,
  Orbit,
  Navigation,
  Database,
  CloudSun,
  Globe2,
} from 'lucide-react';
import Footer from '../components/Footer';

const capability = [
  [
    Satellite,
    'Satellites & Constellations',
    'Track visible GPS, GLONASS, Galileo, BeiDou & IRNSS satellites and distribution in real time.',
  ],
  [
    Radio,
    'Signal Strength & Quality',
    'Monitor Carrier-to-Noise ratio (C/N0), SNR metrics, and signal-level spectrum quality.',
  ],
  [
    Orbit,
    'Sky Plot Geometry',
    'Visualize satellite azimuth and elevation trajectories across local celestial coordinates.',
  ],
  [
    Gauge,
    'Dilution of Precision (DOP)',
    'Analyze geometric precision parameters including PDOP, HDOP, VDOP, and TDOP values.',
  ],
  [
    MapPin,
    'Precise Positioning',
    'Evaluate latitude, longitude, altitude deviations, and high-precision RTK fix statuses.',
  ],
  [
    CloudSun,
    'Atmospheric & TEC Insights',
    'Investigate ionospheric total electron content (TEC) delays, multipath, and space weather impact.',
  ],
];

const receivers = [
  {
    id: 'global',
    name: 'Global Perspective',
    description: 'Explore multi-GNSS constellations through 3D orbital propagation, satellite ground tracks, and positioning geometry.',
    color: '#38bdf8',
    image: '/assets/receivers/Global.jpeg',
    tags: ['Multi-GNSS', '3D Orbits', 'Ground Tracks', 'Visibility'],
  },
  {
    id: 'ublox',
    name: 'u-blox Station',
    description: 'Monitor real-time multi-band GNSS observations with sky plots, signal strength, and receiver telemetry.',
    color: '#10b981',
    image: '/assets/receivers/Ublox.jpeg',
    tags: ['ZED-F9P', 'Multi-Band', 'IST Islamabad', 'Live C/N0'],
  },
  {
    id: 'ictp',
    name: 'ICTP Scientific Station',
    description: 'Investigate ionospheric behavior and signal quality through delay estimation, multipath, and cycle-slip analysis.',
    color: '#6366f1',
    image: '/assets/receivers/ICTP.jpeg',
    tags: ['Ionosphere', 'Multipath', 'Delay Est.', 'Cycle-Slip'],
  },
  {
    id: 'septentrio',
    name: 'Septentrio Station',
    description: 'Access geodetic-grade GNSS telemetry with multi-frequency tracking, RF interference, and scintillation monitoring.',
    color: '#a855f7',
    image: '/assets/receivers/Septentrio.PNG',
    tags: ['PolaRx5', 'Geodetic', 'RF Scintillation', 'Multi-Freq'],
  },
];

const motionSlides = [
  {
    id: 'septentrio',
    title: 'Septentrio PolaRx5 Reference',
    hardware: 'Geodetic-Grade Multi-Frequency Telemetry',
    location: 'IST Islamabad',
    badge: 'LIVE GEODETIC FEED',
    image: '/assets/receivers/Septentrio.PNG',
    color: '#a855f7',
  },
  {
    id: 'ublox',
    title: 'u-blox ZED-F9P Station',
    hardware: 'Real-Time Multi-Band Tracking & C/N0',
    location: 'IST Islamabad',
    badge: 'MONITORING STATION',
    image: '/assets/receivers/Ublox.jpeg',
    color: '#10b981',
  },
  {
    id: 'ictp',
    title: 'ICTP Scientific Station',
    hardware: 'Ionospheric TEC & Multipath Diagnostics',
    location: 'GNSS Research Lab, IST',
    badge: 'SCIENTIFIC RESEARCH',
    image: '/assets/receivers/ICTP.jpeg',
    color: '#6366f1',
  },
  {
    id: 'global',
    title: 'Global Orbits Model',
    hardware: '3D Multi-GNSS Constellation Propagation',
    location: 'Global / Regional Coverage',
    badge: 'ORBITAL SIMULATION',
    image: '/assets/receivers/Global.jpeg',
    color: '#38bdf8',
  },
];

function GNSSSpaceHeroVisual() {
  return (
    <div className="hero-visual">
      <div className="hero-visual-glow" />

      <div className="hero-visual-frame">
        <img
          src="/assets/hero section.jpeg"
          alt="GNSS Observatory"
          className="hero-visual-image"
        />

        <div className="hero-visual-overlay" />

        {/* <div className="hero-visual-label">
          <span className="hero-visual-dot" />
          GNSS OBSERVATORY
        </div> */}
      </div>
    </div>
  );
}
export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-copy">
         

          <h1>
            <span> <em>NCGSA  GNSS</em> 
           Observatory
            
            </span>
          </h1>

          <h2 className="hero-subtitle">
            Institute of Space Technology, Islamabad
          </h2>

          {/* <p className="hero-lead">
            High-precision multi-GNSS research platform tracking Septentrio, u-blox, and ICTP scientific receivers — delivering real-time positioning, carrier-to-noise signal intelligence, satellite visibility, and atmospheric TEC insights.
          </p> */}

          <div className="hero-actions">
            {/* <Link className="primary-btn" to="/dashboards">
              Enter Observatory 
              <ArrowRight size={17} />
            </Link> */}

            <a className="secondary-btn" href="#observatory">
              Explore Stations
            </a>
          </div>

          {/* Integrated Quick Metrics Strip */}
          {/* <div className="hero-quick-stats">
            <div className="quick-stat">
              <span className="stat-number">32+</span>
              <span className="stat-label">Active Satellites</span>
            </div>
            <div className="stat-divider" />
            <div className="quick-stat">
              <span className="stat-number">4</span>
              <span className="stat-label">Research Stations</span>
            </div>
            <div className="stat-divider" />
            <div className="quick-stat">
              <span className="stat-number">1.2 cm</span>
              <span className="stat-label">RTK Precision</span>
            </div>
            <div className="stat-divider" />
            <div className="quick-stat">
              <span className="stat-number">50 Hz</span>
              <span className="stat-label">Data Frequency</span>
            </div>
          </div> */}
        </div>

        <GNSSSpaceHeroVisual />
      </section>

      {/* OBSERVATORY */}
      <section id="observatory" className="section observatory">
        <div className="section-intro">
          <span className="eyebrow">
            UNIFIED RESEARCH ENVIRONMENT
          </span>

          <h2>
            One Observatory <em>Multiple GNSS Perspectives</em>
          </h2>
        </div>

        <div className="receiver-grid">
          {receivers.map((receiver) => (
            <Link
              className="receiver-card"
              key={receiver.id}
              to={`/dashboards/${receiver.id}`}
              style={{
                '--receiver': receiver.color,
                '--card-image': `url(${receiver.image})`,
              }}
              aria-label={`Open ${receiver.name} dashboard`}
            >
              {/* Visible Background Photo Layer */}
              <div className="card-photo" />

              {/* Text & Content Overlay */}
              <div className="card-content">
                <h3>{receiver.name}</h3>

                <p className="card-description">
                  {receiver.description}
                </p>

                {/* Pill Tags Row */}
                <div className="card-tags">
                  {receiver.tags.map((tag) => (
                    <span key={tag} className="tag-pill">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Circle Arrow Action Button */}
              <div className="card-arrow-btn">
                <ArrowRight size={18} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="section capabilities">
        <div className="section-intro">
          <span className="eyebrow">
            OBSERVE • ANALYZE • RESEARCH • NAVIGATE
          </span>

          <h2>
            What the <em>Observatory Explores</em>
          </h2>
        </div>

        <div className="capability-grid">
          {capability.map(([Icon, title, desc]) => (
            <article key={title}>
              <div className="capability-icon-wrap">
                <Icon size={22} color="#38bdf8" />
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </section>     
      {/* <Copilot /> */}
      <Footer />
    </>
  );
}
