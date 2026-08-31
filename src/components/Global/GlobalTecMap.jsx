import React from 'react';
import WorldTecGlobe from './WorldTecGlobe';
import '../../dashboard/Stylesheet/global.css';
export default function GlobalTecMap({ height = 360 }) {
  return (
    <div className="panel-box" 
    style={{ height: '100%', display: 'flex', 
    flexDirection: 'column' }}>
      <WorldTecGlobe height={height} compact={false} />
    </div>
  );
}
