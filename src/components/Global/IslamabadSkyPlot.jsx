import React from 'react';
import SkyPlot from './SkyPlot';
import '../../dashboard/Stylesheet/global.css';
export default function IslamabadSkyPlot({ satellites = [] }) {
  return (
    <div className="panel-box" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-box-header">
        <span className="panel-box-title">Panel A: Islamabad Polar Sky Plot</span>
        <span className="badge-cyan">Az/El Coordinates</span>
      </div>
      <div className="panel-box-body" style={{ flex: 1, padding: '8px' }}>
        <SkyPlot satellites={satellites} compact={true} />
      </div>
    </div>
  );
}
