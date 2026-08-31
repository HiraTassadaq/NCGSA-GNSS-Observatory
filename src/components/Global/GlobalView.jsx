import React from 'react';
import Constellation3DGlobe from './Constellation3DGlobe';
import GroundTrackMap from './GroundTrackMap';
import GlobalDopGrid from './GlobalDopGrid';
import GlobalTecMap from './GlobalTecMap';
import '../../dashboard/Stylesheet/global.css';
export default function GlobalView({
  satellites = [],
  selectedSatellite,
  setSelectedSatellite,
  systemFilter = 'ALL',
  timeStr = ''
}) {
  return (
    <div className="view-grid-2x2">
      <div className="grid-cell">
        <Constellation3DGlobe
          satellites={satellites}
          selectedSatellite={selectedSatellite}
          onSelectSatellite={setSelectedSatellite}
          systemFilter={systemFilter}
        />
      </div>

      <div className="grid-cell">
        <GroundTrackMap
          systemFilter={systemFilter}
          selectedSatellite={selectedSatellite}
          timeStr={timeStr}
        />
      </div>

      <div className="grid-cell">
        <GlobalDopGrid />
      </div>

      <div className="grid-cell">
        <GlobalTecMap />
      </div>
    </div>
  );
}
