import React, { useState, useEffect } from 'react';
import WorldDopGlobe from './WorldDopGlobe';
import '../../dashboard/Stylesheet/global.css';
export default function GlobalDopGrid({ height = 360 }) {
  return (
    <div className="panel-box" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <WorldDopGlobe height={height} compact={false} />
    </div>
  );
}
