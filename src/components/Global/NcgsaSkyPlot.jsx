import React from 'react';
import SkyPlot from './SkyPlot';
import '../../dashboard/Stylesheet/global.css';
export default function NcgsaSkyPlot({ satellites = [] }) {
  return (
    <div className="panel-box" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-box-header">
        <span className="panel-box-title">Panel B: NCGSA/IST Polar Sky Plot (Observer View)</span>
        <span className="badge-cyan">33.6560° N, 73.1560° E</span>
      </div>
      <div className="panel-box-body" style={{ flex: 1, padding: '8px' }}>
        <SkyPlot satellites={satellites} compact={false} />
      </div>
    </div>
  );
}
