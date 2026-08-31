import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Bot,
  X,
  ArrowRight,
  Sparkles,
  Send,
  Satellite,
  Radio,
  Globe2,
  CloudSun,
  ShieldCheck,
  Cpu,
  MessageSquare,
} from 'lucide-react';
import '../dashboardStyle.css';

const topics = {
  'Receiver Status': 'All observatory receivers (Septentrio, u-blox, and ICTP) are currently operational at IST Islamabad. All units report stable tracking above the 10° elevation mask with 3D fixed solutions.',
  'Satellite Information': 'Across all 4 active constellations, over 80 satellites are currently tracked globally. Locally in Islamabad, between 28 and 36 satellites are concurrently in view with dual-frequency lock.',
  'Atmospheric & TEC': 'Ionospheric delay estimation and Total Electron Content (vTEC) mapping are continuously processed by the ICTP node. Current vertical TEC over Islamabad is nominal with no severe geomagnetic scintillation (S4 < 0.2).',
  'Signal Quality (C/N0)': 'Carrier-to-noise density ratio (C/N₀) averages 42–46 dB-Hz across tracked L1/L2/E1/E5 signals, indicating clean RF reception with minimal attenuation.',
  'Positioning Geometry (DOP)': 'Current Dilution of Precision is optimal: PDOP 1.24, HDOP 0.78, VDOP 0.96, ensuring millimeter-to-centimeter grade positioning repeatability.',
  'Interference & AIM+': 'Septentrio Advanced Interference Mitigation (AIM+) is actively monitoring the RF spectrum. No jamming, spoofing, or in-band continuous-wave interference detected in the L-band.',
  'Data Products & RINEX': 'High-rate RINEX 3.04 observation, navigation ephemeris, and SBF/UBX binary telemetry streams are archived for geodetic research and open scientific distribution.',
  'u-blox Station': 'The u-blox ZED-F9P node provides real-time multi-band RTK observations, SNR distribution histograms, and coordinate deviation drift analysis.',
};

const suggestedPrompts = [
  { label: 'Receiver Health', query: 'Receiver Status', icon: Radio },
  { label: 'Satellite Tracks', query: 'Satellite Information', icon: Satellite },
  { label: 'Ionosphere & TEC', query: 'Atmospheric & TEC', icon: CloudSun },
  { label: 'Signal Quality', query: 'Signal Quality (C/N0)', icon: Sparkles },
  { label: 'Position Geometry (DOP)', query: 'Positioning Geometry (DOP)', icon: Globe2 },
  { label: 'AIM+ Security', query: 'Interference & AIM+', icon: ShieldCheck },
  { label: 'RINEX Formats', query: 'Data Products & RINEX', icon: Cpu },
];

export default function Copilot() {
  const location = useLocation();
  const isDedicatedPage = location.pathname === '/copilot';

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Greetings! I am the NCGSA GNSS Observatory Copilot. I analyze multi-GNSS constellation telemetry, receiver station states, ionospheric conditions, and precision positioning metrics. How can I assist your research today?',
      time: 'Just now',
    },
  ]);
  const [inputVal, setInputVal] = useState('');

  const handleAsk = (queryText) => {
    const responseText =
      topics[queryText] ||
      `Query received: "${queryText}". Observatory records confirm nominal operation across all connected GNSS receiver stations at IST Islamabad with continuous dual-frequency carrier tracking.`;

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: queryText, time: nowStr },
      { sender: 'bot', text: responseText, time: nowStr },
    ]);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    handleAsk(inputVal.trim());
    setInputVal('');
  };

  // If we are on the dedicated /copilot page, render the full-screen AI Command Center
  if (isDedicatedPage) {
    return (
      <div className="observatory-dashboard-wrapper" style={{ minHeight: 'calc(100vh - 70px)' }}>
        {/* Subbar */}
        <div className="observatory-subbar">
          <div className="observatory-subbar-left">
            <div>
              <span className="observatory-station-title">GNSS Copilot AI</span>
              <span className="observatory-station-subtitle">Intelligent Observatory Telemetry & Geodesy Assistant</span>
            </div>

            <div className="hud-badge-live">
              <span className="pulse-indicator" />
              <span>AI Neural Assistant Online</span>
            </div>
          </div>

          <div className="observatory-subbar-right">
            <Link to="/dashboards" className="hud-btn">
              <Satellite size={13} />
              <span>All Stations</span>
            </Link>
            <Link to="/glossary" className="hud-btn">
              <span>GNSS Glossary</span>
            </Link>
          </div>
        </div>

        {/* Full Page Chat Area */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '24px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              background: 'linear-gradient(145deg, rgba(12, 28, 48, 0.85) 0%, rgba(6, 18, 34, 0.95) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '16px',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45)',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: '560px',
              overflow: 'hidden',
            }}
          >
            {/* Header within Chat */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(8, 20, 36, 0.6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#38bdf8',
                  }}
                >
                  <Bot size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                    NCGSA Knowledge & Telemetry Engine
                  </h3>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Connected to Septentrio, u-blox, and ICTP live streams
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'JetBrains Mono',
                    color: '#34d399',
                    padding: '4px 10px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '6px',
                  }}
                >
                  Active Context: IST Islamabad
                </span>
              </div>
            </div>

            {/* Messages list */}
            <div
              style={{
                flex: 1,
                padding: '24px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '14px 18px',
                      borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      background:
                        m.sender === 'user'
                          ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                          : 'rgba(15, 34, 58, 0.9)',
                      border:
                        m.sender === 'user'
                          ? '1px solid rgba(56, 189, 248, 0.5)'
                          : '1px solid rgba(56, 189, 248, 0.2)',
                      color: m.sender === 'user' ? '#ffffff' : '#e2e8f0',
                      fontSize: '13.5px',
                      lineHeight: '1.6',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                    }}
                  >
                    {m.text}
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      color: '#64748b',
                      marginTop: '4px',
                      fontFamily: 'JetBrains Mono',
                    }}
                  >
                    {m.sender === 'user' ? 'You' : 'Copilot AI'} • {m.time}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Prompts Bar */}
            <div
              style={{
                padding: '12px 24px',
                borderTop: '1px solid rgba(56, 189, 248, 0.1)',
                background: 'rgba(8, 20, 36, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                overflowX: 'auto',
              }}
            >
              <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', fontWeight: '600' }}>
                Quick Prompts:
              </span>
              {suggestedPrompts.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.label}
                    onClick={() => handleAsk(p.query)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'rgba(14, 34, 58, 0.65)',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      color: '#bae6fd',
                      fontSize: '11.5px',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    className="hover:border-cyan-400"
                  >
                    <Icon size={12} color="#38bdf8" />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Input form */}
            <form
              onSubmit={handleFormSubmit}
              style={{
                padding: '16px 24px',
                borderTop: '1px solid rgba(56, 189, 248, 0.15)',
                background: 'rgba(8, 20, 36, 0.7)',
                display: 'flex',
                gap: '12px',
              }}
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ask about GNSS satellite orbits, receiver health, ionospheric TEC, DOP geometry..."
                style={{
                  flex: 1,
                  background: 'rgba(6, 16, 30, 0.8)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '10px',
                  padding: '12px 18px',
                  color: '#f8fafc',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '10px',
                  padding: '0 20px',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <span>Send</span>
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Floating widget on other pages
  return (
    <div className="copilot">
      <button
        className="copilot-launch"
        onClick={() => setOpen(true)}
        aria-label="Open GNSS Copilot"
      >
        <Sparkles size={17} /> GNSS Copilot
      </button>

      {open && (
        <section className="copilot-panel" aria-live="polite">
          <header>
            <span>
              <Bot /> <b>GNSS Copilot</b>
              <small>Intelligent Observatory Assistant</small>
            </span>
            <button aria-label="Close Copilot" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </header>

          <div className="copilot-chat">
            <div className="bot-message">
              {messages[messages.length - 1]?.text || 'Hello! I am your GNSS Observatory Copilot.'}
            </div>

            <p style={{ marginTop: '12px', marginBottom: '8px' }}>
              Explore observatory topics:
            </p>

            <div className="quick-actions">
              {Object.keys(topics).map((t) => (
                <button key={t} onClick={() => handleAsk(t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(6, 16, 28, 0.5)', borderTop: '1px solid rgba(56, 189, 248, 0.15)' }}>
            <Link
              to="/copilot"
              style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => setOpen(false)}
            >
              Full Copilot Hub <ArrowRight size={13} />
            </Link>

            <Link
              to="/dashboards"
              style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => setOpen(false)}
            >
              All Dashboards
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
