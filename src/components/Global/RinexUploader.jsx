import React, { useState } from 'react';
import { UploadCloud, FileCheck, RefreshCw, Layers, ShieldCheck, Info } from 'lucide-react';
import { parseRinexNav } from '../../utils/rinexParser';
import { SAMPLE_BRDC_RINEX, generateFullConstellationEphemerides } from '../../utils/sampleRinex';
import '../../dashboard/Stylesheet/global.css';export default function RinexUploader({ onNavDataLoaded = () => {}, activeNavData = null }) {
  const [dragOver, setDragOver] = useState(false);
  const [filename, setFilename] = useState('sample_brdc.rnx (Bundled Demo)');
  const [loading, setLoading] = useState(false);

  const processFileText = (text, name) => {
    setLoading(true);
    try {
      const parsed = parseRinexNav(text);
      setFilename(name);
      onNavDataLoaded(parsed);
    } catch (err) {
      alert('Error parsing RINEX file: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      processFileText(event.target.result, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      processFileText(event.target.result, file.name);
    };
    reader.readAsText(file);
  };

  const handleLoadSampleBRDC = () => {
    processFileText(SAMPLE_BRDC_RINEX, 'sample_brdc.rnx (Bundled Sample)');
  };

  const handleLoadFullConstellation = () => {
    setLoading(true);
    const parsed = parseRinexNav(SAMPLE_BRDC_RINEX);
    const fullSats = generateFullConstellationEphemerides(parsed);
    
    parsed.satellites = fullSats;
    parsed.totalCount = fullSats.length;
    parsed.healthyCount = fullSats.filter(s => s.isHealthy).length;
    parsed.degradedCount = fullSats.filter(s => !s.isHealthy).length;

    setFilename('Global Full Constellation (131 Satellites)');
    onNavDataLoaded(parsed);
    setLoading(false);
  };

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '16px',
      padding: '20px',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, color: '#f8fafc' }}>
            RINEX Navigation Broadcast Input
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
            Upload RINEX v2/v3 navigation file (.nav, .n, .rnx, .24n, .26n) to calculate constellation ECEF orbits & global DOP/TEC.
          </p>
        </div>

        {/* Quick Demo Loader Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleLoadSampleBRDC}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60a5fa',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} />
            <span>Load BRDC Sample</span>
          </button>

          <button
            onClick={handleLoadFullConstellation}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
            }}
          >
            <Layers size={14} />
            <span>Load Full Global Constellation</span>
          </button>
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? '#3b82f6' : 'rgba(255, 255, 255, 0.2)'}`,
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          background: dragOver ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        onClick={() => document.getElementById('rinexFileInput').click()}
      >
        <input
          id="rinexFileInput"
          type="file"
          accept=".nav,.n,.rnx,.24n,.26n,.g,.l,.p"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <UploadCloud size={32} style={{ color: dragOver ? '#60a5fa' : '#94a3b8' }} />
          <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#e2e8f0' }}>
            {dragOver ? 'Drop RINEX navigation file here...' : 'Click to select or Drag & Drop RINEX NAV file'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Supports RINEX 2.xx and 3.xx Multi-GNSS (GPS, GLONASS, Galileo, BeiDou, QZSS, SBAS)
          </div>
        </div>
      </div>

      {/* Active Loaded Summary */}
      {activeNavData && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileCheck size={20} style={{ color: '#10b981' }} />
            <div>
              <span style={{ fontWeight: '700', color: '#34d399' }}>Loaded File:</span>{' '}
              <span style={{ color: '#f8fafc', fontWeight: '600' }}>{filename}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', color: '#cbd5e1', fontSize: '0.8rem' }}>
            <span>RINEX Version: <strong style={{ color: '#60a5fa' }}>{activeNavData.version}</strong></span>
            <span>Total Satellites: <strong style={{ color: '#34d399' }}>{activeNavData.totalCount}</strong></span>
            <span>Healthy: <strong style={{ color: '#34d399' }}>{activeNavData.healthyCount}</strong></span>
            <span>Degraded: <strong style={{ color: activeNavData.degradedCount > 0 ? '#f87171' : '#94a3b8' }}>{activeNavData.degradedCount}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
