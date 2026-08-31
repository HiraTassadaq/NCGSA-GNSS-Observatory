import React from 'react';
import PakistanVisibilityMap from './PakistanVisibilityMap';
import PakistanDopGrid from './PakistanDopGrid';
import PakistanTecMap from './PakistanTecMap';
import PakistanConstellationStatus from './PakistanConstellationStatus';
import '../../dashboard/Stylesheet/global.css';
export default function PakistanView({
  mask = 10.0,
  systemFilter = 'ALL',
  timeStr = '',
  telemetry
}) {
  return (
    <div className="view-grid-2x2">
      <div className="grid-cell">
        <PakistanVisibilityMap mask={mask} systemFilter={systemFilter} timeStr={timeStr} />
      </div>

      <div className="grid-cell">
        <PakistanDopGrid mask={mask} systemFilter={systemFilter} timeStr={timeStr} />
      </div>

      <div className="grid-cell">
        <PakistanTecMap mask={mask} timeStr={timeStr} />
      </div>

      <div className="grid-cell">
        <PakistanConstellationStatus telemetry={telemetry} />
      </div>
    </div>
  );
}
