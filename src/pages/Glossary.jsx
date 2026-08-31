import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  BookOpen,
  Satellite,
  Radio,
  Database,
  CloudSun,
  Cpu,
  Orbit,
  Sparkles,
  Activity,
  Layers3,
  Signal,
  X,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Shuffle,
  Zap,
  Shield,
  Compass,
  Info,
  ChevronRight,
  Filter,
} from 'lucide-react';
import './Glossary.css';
import Footer from '../components/Footer';
const glossary = [
  {
    id: '1pps',
    term: '1PPS (One Pulse Per Second)',
    category: 'Hardware & Timing',
    icon: Cpu,
    dashboardLink: '/dashboards/septentrio',
    dashboardName: 'Septentrio Telemetry',
    formula: 'Δt < 15 ns (RMS relative to UTC)',
    definition:
      'A highly precise physical electrical pulse output by GNSS receivers once per second, aligned with UTC within nanoseconds. Used across the observatory network for hardware clock synchronization between heterogeneous nodes.',
    deepDive:
      'In high-precision geodesy and atmospheric sounding, 1PPS pulses drive time-tagging for carrier-phase observation epochs and trigger external frequency standards like rubidium atomic clocks.',
    related: ['TDOP (Time Dilution of Precision)', 'Heterogeneous Network Topology'],
  },
  {
    id: 'ictp-node',
    term: 'Abdus Salam ICTP Node',
    category: 'Station Architecture',
    icon: Satellite,
    dashboardLink: '/dashboards/ictp',
    dashboardName: 'ICTP Insights',
    formula: 'Sampling: 1 Hz | Dual-Frequency',
    definition:
      'A dedicated scientific GNSS observatory node configured in partnership with the Abdus Salam International Centre for Theoretical Physics (ICTP) for space weather monitoring, Total Electron Content (TEC) mapping, and upper atmospheric sounding over Pakistan.',
    deepDive:
      'The ICTP station processes real-time multi-frequency RINEX streams to detect low-latitude equatorial ionospheric anomalies and plasma bubble drift across South Asia.',
    related: ['Total Electron Content (TEC)', 'Vertical TEC (vTEC)', 'Ionospheric Pierce Point (IPP)'],
  },
  {
    id: 'aim-plus',
    term: 'AIM+ (Advanced Interference Mitigation)',
    category: 'Security & Signal Integrity',
    icon: Shield,
    dashboardLink: '/dashboards/septentrio',
    dashboardName: 'Septentrio AIM+ Monitor',
    formula: 'Dynamic Notch & Adaptive Bandpass Filtering',
    definition:
      'Septentrio proprietary RF spectrum monitoring, detection, and suppression technology. It actively monitors RF signals to detect, characterize, and suppress intentional jamming, spoofing, and continuous-wave chirp interference.',
    deepDive:
      'AIM+ evaluates the pre-correlation RF spectrum in real time, deploying notch filters and spectral blanking to ensure uninterrupted tracking even in contested RF environments.',
    related: ['Carrier-to-Noise Ratio (C/N0)', 'Septentrio Receiver'],
  },
  {
    id: 'apc',
    term: 'Antenna Phase Center (APC)',
    category: 'Geodesy & Coordinates',
    icon: Compass,
    dashboardLink: '/dashboards/septentrio',
    dashboardName: 'Septentrio Station',
    formula: 'PCO (Offset) + PCV (Variation)',
    definition:
      'The theoretical point in three-dimensional space within a GNSS antenna where incoming radio signals are received and measured. APC offsets vary with frequency (L1, L2, L5) and satellite elevation/azimuth.',
    deepDive:
      'Calibrated Antex (.atx) antenna models are applied in geodetic baseline calculations to correct for elevation-dependent Phase Center Variations (PCV) down to sub-millimeter precision.',
    related: ['Pseudorange', 'Carrier Phase'],
  },
  {
    id: 'carrier-phase',
    term: 'Carrier Phase',
    category: 'Signal Processing',
    icon: Radio,
    dashboardLink: '/dashboards/ictp',
    dashboardName: 'ICTP Dashboard',
    formula: 'Φ = (c / f) · (t_rx - t_tx) + Nλ + ε',
    definition:
      'A high-precision observable derived from counting fractional and whole cycles of the received RF carrier wave (e.g. 1575.42 MHz for L1). Enables millimeter-to-centimeter level positioning and high-sensitivity ionospheric sounding.',
    deepDive:
      'Because carrier wavelengths are very short (~19 cm for L1), phase measurements have millimeter-grade precision but require solving for the unknown integer cycle ambiguity (N).',
    related: ['Cycle Slip', 'Pseudorange', 'RTK (Real-Time Kinematic)'],
  },
  {
    id: 'cno',
    term: 'Carrier-to-Noise Ratio (C/N₀)',
    category: 'Signal Quality',
    icon: Signal,
    dashboardLink: '/dashboards/ublox',
    dashboardName: 'u-blox Signal Monitor',
    formula: 'Nominal Range: 35 – 52 dB-Hz',
    definition:
      'A fundamental metric of received signal strength and quality, expressed in decibel-Hertz (dB-Hz). It indicates the ratio of signal power to noise power spectral density in a 1 Hz bandwidth.',
    deepDive:
      'Tracking C/N₀ over time reveals antenna attenuation, multipath fading, cable losses, and atmospheric scintillation events. Values above 40 dB-Hz represent excellent signal reception.',
    related: ['S4 Index (Amplitude Scintillation)', 'AIM+ (Advanced Interference Mitigation)'],
  },
  {
    id: 'cycle-slip',
    term: 'Cycle Slip',
    category: 'Signal Processing',
    icon: Radio,
    dashboardLink: '/dashboards/ictp',
    dashboardName: 'ICTP Insights',
    formula: 'ΔN ≠ 0 (Integer Ambiguity Discontinuity)',
    definition:
      'An abrupt integer discontinuity or jump in the carrier phase measurement caused by temporary signal loss, strong multipath, ionospheric turbulence, or rapid antenna motion.',
    deepDive:
      'The observatory detects cycle slips using dual-frequency geometry-free (L1 - L2) and Melbourne-Wübbena linear combinations before processing ionospheric TEC.',
    related: ['Carrier Phase', 'Total Electron Content (TEC)'],
  },
  {
    id: 'dop',
    term: 'Dilution of Precision (DOP)',
    category: 'Geometry & Accuracy',
    icon: Satellite,
    dashboardLink: '/dashboards/global',
    dashboardName: 'Global DOP Grid',
    formula: 'GDOP² = PDOP² + TDOP² = HDOP² + VDOP² + TDOP²',
    definition:
      'A dimensionless geometric multiplier that quantifies how the spatial distribution and geometry of tracked satellites affect 3D positioning and timing error amplification.',
    deepDive:
      'A lower DOP value indicates superior satellite geometry: DOP < 2 is optimal, 2–5 is good, and > 8 indicates poor geometric distribution.',
    related: ['HDOP (Horizontal Dilution of Precision)', 'VDOP (Vertical Dilution of Precision)', 'TDOP (Time Dilution of Precision)'],
  },
  {
    id: 'ephemeris',
    term: 'Ephemeris (Broadcast & Precise)',
    category: 'Orbits & Propagation',
    icon: Orbit,
    dashboardLink: '/dashboards/global',
    dashboardName: 'Global 3D Orbits',
    formula: 'ICD-GPS-200 Keplerian Parameters (a, e, i, Ω, ω, M)',
    definition:
      'A dataset containing precise orbital parameters, clock corrections, and perturbation harmonics used by GNSS receivers to compute exact 3D satellite positions and velocities at any epoch.',
    deepDive:
      'Broadcast ephemeris is transmitted directly within the satellite navigation frame, while precise ephemeris (SP3 format) is calculated post-mission by the International GNSS Service (IGS).',
    related: ['Pseudorange', 'Dilution of Precision (DOP)'],
  },
  {
    id: 'hdop',
    term: 'HDOP (Horizontal Dilution of Precision)',
    category: 'Geometry & Accuracy',
    icon: Compass,
    dashboardLink: '/dashboards/ublox',
    dashboardName: 'u-blox Station',
    formula: 'HDOP = √(σ_x² + σ_y²) / σ_UERE',
    definition:
      'The component of Dilution of Precision that reflects the geometric contribution to 2D horizontal (latitude and longitude) positioning error.',
    deepDive:
      'Optimal HDOP is achieved when satellites are widely distributed in azimuth around the local horizon of the observatory.',
    related: ['VDOP (Vertical Dilution of Precision)', 'Dilution of Precision (DOP)'],
  },
  {
    id: 'heterogeneous-network',
    term: 'Heterogeneous Network Topology',
    category: 'Station Architecture',
    icon: Database,
    dashboardLink: '/dashboards',
    dashboardName: 'Observatory Command Center',
    formula: 'Reference + Scientific + OEM Sensor Array',
    definition:
      'The observatory multi-tiered infrastructure combining geodetic-grade Septentrio PolaRx5 receivers, scientific Abdus Salam ICTP nodes, and compact u-blox ZED-F9P sensor modules into a unified data pipeline.',
    deepDive:
      'This hybrid approach balances ultra-high reference precision, specialized atmospheric science, and scalable spatial sensor coverage under a single unified dashboard architecture.',
    related: ['Septentrio Receiver', 'u-blox Receiver', 'Abdus Salam ICTP Node'],
  },
  {
    id: 'iono-delay',
    term: 'Ionospheric Delay',
    category: 'Atmospheric Science',
    icon: CloudSun,
    dashboardLink: '/dashboards/septentrio',
    dashboardName: 'Septentrio Ionospheric Delay',
    formula: 'I = 40.3 · TEC / f² (meters)',
    definition:
      'The signal travel delay and phase advance experienced by satellite RF signals while traversing free electrons in the Earth ionosphere (approx. 60–1000 km altitude).',
    deepDive:
      'Because ionospheric delay is dispersive (inversely proportional to frequency squared), dual-frequency receivers can eliminate first-order ionospheric error (~99.9%) using ionosphere-free linear combinations.',
    related: ['Total Electron Content (TEC)', 'Vertical TEC (vTEC)', 'S4 Index (Amplitude Scintillation)'],
  },
  {
    id: 'ipp',
    term: 'Ionospheric Pierce Point (IPP)',
    category: 'Atmospheric Science',
    icon: CloudSun,
    dashboardLink: '/dashboards/ictp',
    dashboardName: 'ICTP IPP Trajectories',
    formula: 'Shell Height: h_iono = 350 km – 450 km',
    definition:
      'The intersection point where the direct line-of-sight ray between a ground receiver antenna and an orbiting satellite penetrates the assumed single-layer ionospheric shell model.',
    deepDive:
      'Plotting IPP ground tracks reveals the spatial trajectory of ionospheric sampling points as satellites move across the sky above Islamabad.',
    related: ['Total Electron Content (TEC)', 'Vertical TEC (vTEC)', 'Slant TEC (sTEC)'],
  },
  {
    id: 'multipath',
    term: 'Multipath Interference',
    category: 'Signal Quality',
    icon: Radio,
    dashboardLink: '/dashboards/septentrio',
    dashboardName: 'Septentrio Telemetry',
    formula: 'Path Difference: Δr = 2h · sin(θ_el)',
    definition:
      'The phenomenon where satellite RF signals reflect off surrounding structures, ground terrain, or water bodies before reaching the antenna, causing distorted pseudorange and phase measurements.',
    deepDive:
      'The observatory uses choke-ring antennas and APME (A Posteriori Multipath Estimator) algorithms to suppress ground-reflected multipath signals.',
    related: ['Carrier Phase', 'Carrier-to-Noise Ratio (C/N0)'],
  },
  {
    id: 'nmea',
    term: 'NMEA 0183 Protocol',
    category: 'Protocols & Streams',
    icon: Database,
    dashboardLink: '/dashboards/ublox',
    dashboardName: 'u-blox Data View',
    formula: 'Sentences: $GNGGA, $GNRMC, $GNGSA, $GPGSV',
    definition:
      'A widely adopted standard ASCII messaging specification for marine and navigation electronics. It outputs human-readable sentences containing 3D fix coordinates, active satellites, DOP, and UTC timestamps.',
    deepDive:
      'The observatory ingests NMEA sentences for lightweight real-time telemetry streaming alongside high-rate binary packets.',
    related: ['UBX Protocol', 'SBF (Septentrio Binary Format)'],
  },
  {
    id: 'ntrip',
    term: 'NTRIP (Networked Transport of RTCM)',
    category: 'Protocols & Streams',
    icon: Database,
    dashboardLink: '/dashboards/septentrio',
    dashboardName: 'Septentrio NTRIP Caster',
    formula: 'HTTP / TCP Port 2101 Streaming',
    definition:
      'An application-level protocol designed for streaming GNSS raw observations and differential corrections over the Internet (TCP/IP) to mobile rovers and processing networks.',
    deepDive:
      'NTRIP consists of three core components: NTRIP Source (observatory receiver), NTRIP Caster (distribution server), and NTRIP Client (end-user rover or analysis engine).',
    related: ['RTCM 3.x', 'RTK (Real-Time Kinematic)'],
  },
  {
    id: 'pseudorange',
    term: 'Pseudorange',
    category: 'Signal Processing',
    icon: Satellite,
    dashboardLink: '/dashboards/global',
    dashboardName: 'Global Telemetry',
    formula: 'ρ = c · (t_rx - t_tx) + c · (dt - dT) + I + T + ε',
    definition:
      'The raw estimated geometric distance between a satellite antenna and receiver, calculated by multiplying signal propagation transit time by the speed of light. Contains clock biases and atmospheric delays.',
    deepDive:
      'Four simultaneous pseudorange measurements from four different satellites are mathematically required to solve for 3D coordinates (X, Y, Z) and receiver clock bias (dt).',
    related: ['Carrier Phase', 'Dilution of Precision (DOP)', 'Ephemeris (Broadcast & Precise)'],
  },
  {
    id: 'rinex',
    term: 'RINEX (Receiver Independent Exchange Format)',
    category: 'Data Formats',
    icon: Database,
    dashboardLink: '/dashboards/global',
    dashboardName: 'RINEX Processing',
    formula: 'Standards: RINEX 2.11, 3.04, 4.00',
    definition:
      'The globally accepted, vendor-independent standard file format used to store raw GNSS observables (pseudorange, carrier phase, Doppler, SNR) and navigation ephemeris for open scientific exchange.',
    deepDive:
      'Observatory automated services archive daily 30-second and high-rate 1 Hz RINEX 3.04 files for geodetic research, plate tectonics, and space weather analysis.',
    related: ['SBF (Septentrio Binary Format)', 'UBX Protocol', 'RTCM 3.x'],
  },
  {
    id: 'rtcm',
    term: 'RTCM 3.x Differential Standard',
    category: 'Protocols & Streams',
    icon: Database,
    dashboardLink: '/dashboards/ublox',
    dashboardName: 'u-blox Station',
    formula: 'MSM (Multiple Signal Messages 1–7)',
    definition:
      'A compact, standardized binary messaging format developed by the Radio Technical Commission for Maritime Services to broadcast real-time differential corrections and raw observables.',
    deepDive:
      'RTCM 3.3 MSM messages support modern multi-constellation signals across GPS, GLONASS, Galileo, BeiDou, QZSS, and NavIC.',
    related: ['NTRIP (Networked Transport of RTCM)', 'RTK (Real-Time Kinematic)'],
  },
  {
    id: 'rtk',
    term: 'RTK (Real-Time Kinematic)',
    category: 'Geodesy & Coordinates',
    icon: Compass,
    dashboardLink: '/dashboards/ublox',
    dashboardName: 'u-blox RTK Fix',
    formula: 'Centimeter Precision: σ_horiz ≈ 1 cm + 1 ppm',
    definition:
      'A differential positioning technique that uses double-differenced carrier phase measurements from a stationary base station and rover to eliminate satellite clock, orbital, and atmospheric errors.',
    deepDive:
      'RTK achieves centimeter-level positioning accuracy in real time once integer carrier ambiguities are resolved (RTK Fixed status).',
    related: ['Carrier Phase', 'Pseudorange', 'RTCM 3.x'],
  },
  {
    id: 's4-index',
    term: 'S4 Index (Amplitude Scintillation)',
    category: 'Atmospheric Science',
    icon: CloudSun,
    dashboardLink: '/dashboards/septentrio',
    dashboardName: 'Septentrio Scintillation',
    formula: 'S4 = √[ ⟨I²⟩ - ⟨I⟩² ] / ⟨I⟩',
    definition:
      'The normalized standard deviation of received signal intensity over a 60-second window. It is the international standard metric for measuring ionospheric amplitude scintillation.',
    deepDive:
      'S4 < 0.2 indicates quiet conditions; S4 between 0.3 and 0.6 indicates moderate scintillation; S4 > 0.7 indicates severe plasma turbulence capable of causing receiver cycle slips and signal lock loss.',
    related: ['σϕ (Phase Scintillation / Phi60)', 'Total Electron Content (TEC)'],
  },
  {
    id: 'sbf',
    term: 'SBF (Septentrio Binary Format)',
    category: 'Data Formats',
    icon: Database,
    dashboardLink: '/dashboards/septentrio',
    dashboardName: 'Septentrio PolaRx5 Stream',
    formula: 'Block Architecture (Sync: 0x24, 0x40)',
    definition:
      'The native high-speed binary logging stream of Septentrio receivers. Encapsulates raw high-rate carrier phase (MeasEpoch), navigation frames (GPSNav), tracking state (ChannelStatus), and spectrum monitoring.',
    deepDive:
      'SBF delivers sub-millimeter raw observables with minimal bandwidth overhead and includes specialized blocks like GEOIonoDelay and ReceiverStatus.',
    related: ['Septentrio Receiver', 'RINEX (Receiver Independent Exchange Format)'],
  },
  {
    id: 'septentrio-rx',
    term: 'Septentrio PolaRx5 Reference Receiver',
    category: 'Station Architecture',
    icon: Satellite,
    dashboardLink: '/dashboards/septentrio',
    dashboardName: 'Septentrio Station',
    formula: 'Tracking: 544 Channels | All Constellations',
    definition:
      'A world-class multi-frequency, multi-constellation geodetic GNSS receiver deployed at IST Islamabad as the observatory primary reference anchor and ionospheric space weather monitoring engine.',
    deepDive:
      'Features 100 Hz tracking capability, AIM+ interference mitigation, rubidium clock connectivity, and dedicated ionospheric scintillation firmware.',
    related: ['Heterogeneous Network Topology', 'AIM+ (Advanced Interference Mitigation)', 'SBF (Septentrio Binary Format)'],
  },
  {
    id: 'sigma-phi',
    term: 'σϕ (Phase Scintillation / Phi60)',
    category: 'Atmospheric Science',
    icon: CloudSun,
    dashboardLink: '/dashboards/septentrio',
    dashboardName: 'Septentrio Scintillation',
    formula: 'σ_ϕ = √[ ⟨ϕ²⟩ - ⟨ϕ⟩² ] (radians)',
    definition:
      'The standard deviation of detrended high-rate carrier phase observations calculated over 60-second intervals. Quantifies rapid phase jitter induced by ionospheric plasma irregularities.',
    deepDive:
      'High σϕ values degrade GNSS carrier phase tracking loops and are a key diagnostic for space weather hazards over low-latitude equatorial anomaly regions.',
    related: ['S4 Index (Amplitude Scintillation)', 'Total Electron Content (TEC)'],
  },
  {
    id: 'stec',
    term: 'Slant TEC (sTEC)',
    category: 'Atmospheric Science',
    icon: CloudSun,
    dashboardLink: '/dashboards/ictp',
    dashboardName: 'ICTP sTEC Analysis',
    formula: 'sTEC = ∫ N_e(s) ds (along ray path)',
    definition:
      'The total number of free electrons integrated along the actual oblique line-of-sight ray path from an orbiting satellite to the ground receiver antenna.',
    deepDive:
      'sTEC increases significantly at low satellite elevation angles because the radio signal travels through a thicker column of ionosphere.',
    related: ['Total Electron Content (TEC)', 'Vertical TEC (vTEC)', 'Ionospheric Pierce Point (IPP)'],
  },
  {
    id: 'tdop',
    term: 'TDOP (Time Dilution of Precision)',
    category: 'Geometry & Accuracy',
    icon: Cpu,
    dashboardLink: '/dashboards/ublox',
    dashboardName: 'u-blox Navigation Solution',
    formula: 'TDOP = σ_t / σ_UERE',
    definition:
      'The component of Dilution of Precision that quantifies the geometric impact of tracked satellite configurations on receiver clock bias and UTC synchronization precision.',
    deepDive:
      'Low TDOP is critical for telecommunications, electrical grid synchronization, and financial timestamping infrastructure.',
    related: ['1PPS (One Pulse Per Second)', 'Dilution of Precision (DOP)'],
  },
  {
    id: 'tec',
    term: 'Total Electron Content (TEC)',
    category: 'Atmospheric Science',
    icon: CloudSun,
    dashboardLink: '/dashboards/ictp',
    dashboardName: 'ICTP Global TEC Map',
    formula: '1 TECU = 10¹⁶ electrons / m²',
    definition:
      'The integral of electron density along a 1 m² cross-section tube through the Earth ionosphere. It is the core physical variable used to model ionospheric delay and space weather disturbances.',
    deepDive:
      'TEC exhibits diurnal solar cycle, seasonal, and geomagnetic storm variations. Dual-frequency GNSS receivers calculate TEC from differential code and carrier phase delay.',
    related: ['Vertical TEC (vTEC)', 'Slant TEC (sTEC)', 'Ionospheric Delay'],
  },
  {
    id: 'ubx',
    term: 'UBX Protocol',
    category: 'Protocols & Streams',
    icon: Database,
    dashboardLink: '/dashboards/ublox',
    dashboardName: 'u-blox Telemetry Stream',
    formula: 'Sync Header: 0xB5 0x62 (Class / ID / Payload / CK)',
    definition:
      'The proprietary, high-efficiency binary communication protocol used by u-blox receivers. Transmits multi-band raw pseudoranges (UBX-RXM-RAWX), navigation ephemeris (UBX-RXM-SFRBX), and precision solution metrics.',
    deepDive:
      'UBX messages are parsed in real time by the observatory ingestion engine at 1–10 Hz rates for RTK positioning and signal health evaluation.',
    related: ['u-blox Receiver', 'NMEA 0183 Protocol'],
  },
  {
    id: 'ublox-rx',
    term: 'u-blox ZED-F9P Multi-Band Receiver',
    category: 'Station Architecture',
    icon: Radio,
    dashboardLink: '/dashboards/ublox',
    dashboardName: 'u-blox Station',
    formula: 'Concurrent Multi-Band: L1/L2/L5/E1/E5b/B1I/B2I',
    definition:
      'An industrial-grade, energy-efficient multi-band GNSS receiver module deployed at the observatory to provide continuous dual-frequency RTK observations, SNR histograms, and coordinate deviation telemetry.',
    deepDive:
      'The ZED-F9P delivers centimeter-level positioning accuracy with integrated multi-band RTK engine and fast convergence times under 10 seconds.',
    related: ['Heterogeneous Network Topology', 'UBX Protocol', 'RTK (Real-Time Kinematic)'],
  },
  {
    id: 'vdop',
    term: 'VDOP (Vertical Dilution of Precision)',
    category: 'Geometry & Accuracy',
    icon: Compass,
    dashboardLink: '/dashboards/global',
    dashboardName: 'Global View',
    formula: 'VDOP = σ_z / σ_UERE',
    definition:
      'The component of Dilution of Precision describing the geometric effect of satellite constellation distribution on vertical altitude (height) determination accuracy.',
    deepDive:
      'VDOP is typically 1.5 to 2.5 times higher than HDOP because the receiver cannot track satellites below the Earth horizon.',
    related: ['HDOP (Horizontal Dilution of Precision)', 'Dilution of Precision (DOP)'],
  },
  {
    id: 'vtec',
    term: 'Vertical TEC (vTEC)',
    category: 'Atmospheric Science',
    icon: CloudSun,
    dashboardLink: '/dashboards/ictp',
    dashboardName: 'ICTP Ionospheric Map',
    formula: 'vTEC = sTEC · cos(arcsin[ R_E · cos(θ_el) / (R_E + h_iono) ])',
    definition:
      'The equivalent vertical column Total Electron Content obtained by applying a modified single-layer mapping function to slant TEC at the Ionospheric Pierce Point.',
    deepDive:
      'vTEC normalizes measurements from satellites at varying elevation angles, allowing the observatory to generate regional 2D and 3D ionospheric electron density maps.',
    related: ['Total Electron Content (TEC)', 'Slant TEC (sTEC)', 'Ionospheric Pierce Point (IPP)'],
  },
];

const categories = ['All', ...new Set(glossary.map((item) => item.category))];

const alphabetList = [
  'All',
  ...new Set(
    glossary
      .map((item) => item.term[0].toUpperCase())
      .filter((char) => /[A-Z]/.test(char))
      .sort()
  ),
];

const receiverTiers = [
  {
    receiver: 'Septentrio PolaRx5',
    tier: 'Geodetic Reference Node',
    hardware: 'Septentrio PolaRx5 Geodetic Anchor',
    protocol: 'SBF / RINEX 3.04 / RTCM 3.3',
    output: '544 Channels, Raw Phase, 100Hz SNR, S4, σϕ',
    role: 'Primary Baseline Anchor, Scintillation & Interference Monitoring',
    icon: Satellite,
    code: '01',
    link: '/dashboards/septentrio',
    badge: 'GEODETIC GRADE',
    color: '#a855f7',
  },
  {
    receiver: 'u-blox ZED-F9P',
    tier: 'Compact Multi-Band OEM Node',
    hardware: 'u-blox ZED-F9P Multi-Band Module',
    protocol: 'UBX (RAWX / SFRBX) & NMEA 0183',
    output: 'Dual-Frequency Code/Phase, SNR Histograms, RTK Fix',
    role: 'Dense Spatial Mapping, Deviation Drift & Centimeter Positioning',
    icon: Radio,
    code: '02',
    link: '/dashboards/ublox',
    badge: 'OEM SENSOR',
    color: '#10b981',
  },
  {
    receiver: 'Abdus Salam ICTP Node',
    tier: 'Scientific Atmospheric Sounder',
    hardware: 'ICTP Space Weather Research Station',
    protocol: 'SBF / UBX / RINEX / TCP Streams',
    output: 'sTEC, vTEC Grids, IPP Trajectories, Cycle Slips',
    role: 'Ionospheric Science, Space Weather & TEC Regional Mapping',
    icon: CloudSun,
    code: '03',
    link: '/dashboards/ictp',
    badge: 'ATMOSPHERIC SCIENCE',
    color: '#6366f1',
  },
];

export default function Glossary() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedLetter, setSelectedLetter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [activeModalTerm, setActiveModalTerm] = useState(null);
  const [copiedTermId, setCopiedTermId] = useState(null);
  const searchInputRef = useRef(null);

  // Keyboard shortcut listener ('/' to focus search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setActiveModalTerm(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCopyDefinition = (item, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(`${item.term}: ${item.definition}`);
    setCopiedTermId(item.id);
    setTimeout(() => setCopiedTermId(null), 2000);
  };

  const handleRandomTerm = () => {
    const randomIndex = Math.floor(Math.random() * glossary.length);
    const chosen = glossary[randomIndex];
    setActiveModalTerm(chosen);
  };

  const filteredTerms = useMemo(() => {
    const query = search.trim().toLowerCase();

    return glossary.filter((item) => {
      const matchesSearch =
        !query ||
        item.term.toLowerCase().includes(query) ||
        item.definition.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        (item.formula && item.formula.toLowerCase().includes(query));

      const matchesCategory = category === 'All' || item.category === category;

      const firstChar = item.term[0].toUpperCase();
      const matchesLetter =
        selectedLetter === 'All' || firstChar === selectedLetter;

      return matchesSearch && matchesCategory && matchesLetter;
    });
  }, [search, category, selectedLetter]);

  const clearAllFilters = () => {
    setSearch('');
    setCategory('All');
    setSelectedLetter('All');
  };

  return (
    <div className="glossary-page">
      {/* =====================================================
          HERO / COMMAND HEADER
      ====================================================== */}
      <header className="glossary-hero">
        <div className="glossary-hero-grid-lines" />

        <div className="glossary-hero-copy">
          <div className="glossary-hero-eyebrow">
            <span className="glossary-eyebrow-line" />
            <BookOpen size={14} />
            <span>NCGSA SPACE GEODESY REFERENCE LIBRARY</span>
            <span className="glossary-eyebrow-line" />
          </div>

          <h1>
            GNSS Technical <em>Glossary</em>
          </h1>

          {/* <p className="glossary-hero-description">
            Explore the specialized terminology of multi-GNSS constellation telemetry,
            carrier phase tracking, ionospheric physics, and geodetic reference architecture.
          </p> */}

          {/* Interactive Search Bar */}
          <div className="glossary-search-container">
            <div className="glossary-search-box">
              <Search size={18} className="text-cyan-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search technical terms, formulas, protocols, observables... (Press '/' to focus)"
                aria-label="Search GNSS glossary"
              />

              {search && (
                <button
                  type="button"
                  className="glossary-search-clear"
                  onClick={() => setSearch('')}
                  aria-label="Clear search query"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="glossary-random-btn"
              onClick={handleRandomTerm}
              title="Explore a random GNSS concept"
            >
              <Shuffle size={15} />
              <span>Random Discovery</span>
            </button>
          </div>

          {/* Metrics Strip */}
          {/* <div className="glossary-hero-metrics">
            <div className="glossary-hero-metric">
              <strong>{glossary.length}</strong>
              <span>TECHNICAL TERMS</span>
            </div>

            <div className="glossary-metric-divider" />

            <div className="glossary-hero-metric">
              <strong>{categories.length - 1}</strong>
              <span>KNOWLEDGE DOMAINS</span>
            </div>

            <div className="glossary-metric-divider" />

            <div className="glossary-hero-metric">
              <strong>03</strong>
              <span>RECEIVER TIERS</span>
            </div>

            <div className="glossary-metric-divider" />

            <div className="glossary-hero-metric">
              <strong>7</strong>
              <span>CONSTELLATIONS</span>
            </div>
          </div> */}
        </div>
      </header>

      {/* =====================================================
          CONTROLS BAR (CATEGORIES, A-Z SCRUBBER, VIEW SWITCHER)
      ====================================================== */}
      <nav className="glossary-nav-bar">
        <div className="glossary-nav-inner">
          {/* Category Filter Chips */}
          <div className="glossary-categories-wrap">
            <span className="glossary-filter-label">
              <Filter size={13} />
              <span>DOMAIN:</span>
            </span>

            <div className="glossary-category-scroll">
              {categories.map((cat) => {
                const count =
                  cat === 'All'
                    ? glossary.length
                    : glossary.filter((g) => g.category === cat).length;

                return (
                  <button
                    key={cat}
                    type="button"
                    className={`glossary-category-chip ${
                      category === cat ? 'active' : ''
                    }`}
                    onClick={() => setCategory(cat)}
                  >
                    <span>{cat}</span>
                    <span className="chip-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* A-Z Alphabet Quick Jump */}
          <div className="glossary-alpha-wrap">
            <div className="glossary-alpha-list">
              {alphabetList.map((letter) => (
                <button
                  key={letter}
                  type="button"
                  className={`glossary-alpha-btn ${
                    selectedLetter === letter ? 'active' : ''
                  }`}
                  onClick={() => setSelectedLetter(letter)}
                >
                  {letter}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="glossary-view-switcher">
              <button
                type="button"
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Card Grid View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Compact Table View"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* =====================================================
          RESULTS BAR
      ====================================================== */}
      <main className="glossary-main">
        <div className="glossary-status-row">
          <div className="glossary-results-info">
            <Activity size={15} className="text-cyan-400" />
            <span>
              Displaying <strong>{filteredTerms.length}</strong> of{' '}
              {glossary.length} entries
            </span>

            {(search || category !== 'All' || selectedLetter !== 'All') && (
              <button
                type="button"
                className="glossary-clear-filters-btn"
                onClick={clearAllFilters}
              >
                Reset All Filters <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* =====================================================
            GRID VIEW
        ====================================================== */}
        {viewMode === 'grid' && (
          <section className="glossary-cards-grid">
            {filteredTerms.map((item, index) => {
              const Icon = item.icon;
              const isCopied = copiedTermId === item.id;

              return (
                <article
                  key={item.id}
                  className="glossary-term-card"
                  onClick={() => setActiveModalTerm(item)}
                >
                  <div className="glossary-card-top">
                    <div className="glossary-term-badge">
                      <Icon size={14} className="text-cyan-400" />
                      <span>{item.category}</span>
                    </div>

                    <span className="glossary-index-tag">
                      #{String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <h3 className="glossary-card-title">{item.term}</h3>

                  {item.formula && (
                    <div className="glossary-formula-box">
                      <code>{item.formula}</code>
                    </div>
                  )}

                  <p className="glossary-card-definition">
                    {item.definition}
                  </p>

                  <div className="glossary-card-footer">
                    <button
                      type="button"
                      className="glossary-card-action-btn"
                      onClick={(e) => handleCopyDefinition(item, e)}
                      title="Copy definition"
                    >
                      {isCopied ? (
                        <>
                          <Check size={13} className="text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <span className="glossary-details-link">
                      <span>Details</span>
                      <ChevronRight size={14} />
                    </span>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* =====================================================
            LIST / TABLE VIEW
        ====================================================== */}
        {viewMode === 'list' && (
          <div className="glossary-table-container">
            <table className="glossary-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th style={{ width: '260px' }}>Term</th>
                  <th style={{ width: '180px' }}>Knowledge Domain</th>
                  <th>Technical Definition & Parameters</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTerms.map((item, index) => {
                  const Icon = item.icon;
                  const isCopied = copiedTermId === item.id;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setActiveModalTerm(item)}
                      className="glossary-table-row"
                    >
                      <td className="table-index">
                        {String(index + 1).padStart(2, '0')}
                      </td>
                      <td className="table-term">
                        <div className="table-term-name">
                          <Icon size={15} className="text-cyan-400 shrink-0" />
                          <span>{item.term}</span>
                        </div>
                      </td>
                      <td className="table-category">
                        <span className="table-category-pill">
                          {item.category}
                        </span>
                      </td>
                      <td className="table-def">
                        <p>{item.definition}</p>
                        {item.formula && (
                          <code className="table-formula">{item.formula}</code>
                        )}
                      </td>
                      <td className="table-actions" style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="table-action-btn"
                          onClick={(e) => handleCopyDefinition(item, e)}
                          title="Copy definition"
                        >
                          {isCopied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                        </button>
                        <button
                          type="button"
                          className="table-action-btn"
                          onClick={() => setActiveModalTerm(item)}
                          title="View complete details"
                        >
                          <Info size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* =====================================================
            NO RESULTS STATE
        ====================================================== */}
        {filteredTerms.length === 0 && (
          <div className="glossary-empty-box">
            <div className="glossary-empty-icon">
              <Search size={36} />
            </div>
            <h3>No Matching Knowledge Entries</h3>
            <p>
              No technical concepts match your current search query or active category filters.
            </p>
            <button
              type="button"
              className="primary-btn"
              onClick={clearAllFilters}
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* =====================================================
            RECEIVER ARCHITECTURE ECOSYSTEM
        ====================================================== */}
        <section className="glossary-ecosystem-section">
          <div className="glossary-section-header">
            <div>
              <span className="kicker">OBSERVATORY HARDWARE ARCHITECTURE</span>
              <h2>
                Receiver <em>Ecosystem Tiers</em>
              </h2>
              <p>
                Three integrated hardware tiers supply reference positioning,
                spatial sensor coverage, and atmospheric research diagnostics.
              </p>
            </div>

            <div className="glossary-arch-badge">
              <Layers3 size={18} />
              <span>HETEROGENEOUS NETWORK</span>
            </div>
          </div>

          <div className="glossary-ecosystem-grid">
            {receiverTiers.map((row) => {
              const Icon = row.icon;

              return (
                <article
                  key={row.receiver}
                  className="glossary-ecosystem-card"
                  style={{ '--tier-color': row.color }}
                >
                  <div className="ecosystem-card-top">
                    <div className="ecosystem-badge" style={{ color: row.color, borderColor: `${row.color}40`, backgroundColor: `${row.color}15` }}>
                      <Icon size={14} />
                      <span>{row.badge}</span>
                    </div>
                    <span className="ecosystem-code">TIER {row.code}</span>
                  </div>

                  <h3 className="ecosystem-title">{row.receiver}</h3>
                  <span className="ecosystem-tier-desc">{row.tier}</span>

                  <div className="ecosystem-spec-box">
                    <div>
                      <small>PRIMARY PROTOCOL</small>
                      <code>{row.protocol}</code>
                    </div>
                    <div>
                      <small>KEY OBSERVABLES</small>
                      <p>{row.output}</p>
                    </div>
                    <div>
                      <small>OBSERVATORY ROLE</small>
                      <p>{row.role}</p>
                    </div>
                  </div>

                  <Link to={row.link} className="ecosystem-launch-btn">
                    <span>Launch Station Dashboard</span>
                    <ArrowRight size={14} />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      {/* =====================================================
          INTERACTIVE TERM DEEP-DIVE MODAL
      ====================================================== */}
      {activeModalTerm && (
        <div
          className="glossary-modal-backdrop"
          onClick={() => setActiveModalTerm(null)}
        >
          <div
            className="glossary-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glossary-modal-header">
              <div className="flex items-center gap-2">
                <span className="glossary-term-badge">
                  {React.createElement(activeModalTerm.icon, { size: 14 })}
                  <span>{activeModalTerm.category}</span>
                </span>
              </div>

              <button
                type="button"
                className="glossary-modal-close"
                onClick={() => setActiveModalTerm(null)}
                aria-label="Close modal dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="glossary-modal-body">
              <h2 className="glossary-modal-title">{activeModalTerm.term}</h2>

              {activeModalTerm.formula && (
                <div className="glossary-modal-formula">
                  <small>MATHEMATICAL / PROTOCOL SPECIFICATION</small>
                  <code>{activeModalTerm.formula}</code>
                </div>
              )}

              <div className="glossary-modal-section">
                <h4>Core Definition</h4>
                <p className="glossary-modal-text">{activeModalTerm.definition}</p>
              </div>

              {activeModalTerm.deepDive && (
                <div className="glossary-modal-section">
                  <h4>Observatory Deep Dive & Context</h4>
                  <p className="glossary-modal-text">{activeModalTerm.deepDive}</p>
                </div>
              )}

              {activeModalTerm.related && activeModalTerm.related.length > 0 && (
                <div className="glossary-modal-section">
                  <h4>Interconnected Concepts</h4>
                  <div className="glossary-related-chips">
                    {activeModalTerm.related.map((relName) => {
                      const targetObj = glossary.find((g) => g.term.startsWith(relName) || g.term === relName);
                      return (
                        <button
                          key={relName}
                          type="button"
                          className="glossary-related-chip"
                          onClick={() => {
                            if (targetObj) setActiveModalTerm(targetObj);
                          }}
                        >
                          <Sparkles size={11} />
                          <span>{relName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="glossary-modal-footer">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => handleCopyDefinition(activeModalTerm)}
              >
                {copiedTermId === activeModalTerm.id ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span>Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Full Definition</span>
                  </>
                )}
              </button>

              {activeModalTerm.dashboardLink && (
                <Link
                  to={activeModalTerm.dashboardLink}
                  className="primary-btn"
                  onClick={() => setActiveModalTerm(null)}
                >
                  <span>Explore in {activeModalTerm.dashboardName || 'Dashboard'}</span>
                  <ExternalLink size={14} />
                </Link>
              )}
            </div>
          </div>
        </div>
        
      )}
      <Footer />
    
    </div>
    
  );
}

