import React from 'react';
import GlobalView from './GlobalView';
import PakistanView from './PakistanView';
import IslamabadView from './IslamabadView';
import NcgsaObserverView from './NcgsaObserverView';
import AnalyticsStrip from './AnalyticsStrip';
import '../../dashboard/Stylesheet/global.css';
export default function MainDashboard({
  locationMode = 'GLOBAL',
  systemFilter = 'ALL',
  mask = 10.0,
  timeStr = '',
  telemetry,
  satellites = [],
  selectedSatellite,
  setSelectedSatellite,
  observer
}) {
  return (
    <div className="main-dashboard-container">
      {/* Dynamic Geographic View Level */}
      <div className="active-view-wrapper">
        {locationMode === 'GLOBAL' && (
          <GlobalView
            satellites={satellites}
            selectedSatellite={selectedSatellite}
            setSelectedSatellite={setSelectedSatellite}
            systemFilter={systemFilter}
            timeStr={timeStr}
          />
        )}

        {locationMode === 'PAKISTAN' && (
          <PakistanView
            mask={mask}
            systemFilter={systemFilter}
            timeStr={timeStr}
            telemetry={telemetry}
          />
        )}

        {locationMode === 'ISLAMABAD' && (
          <IslamabadView
            satellites={satellites}
            mask={mask}
            systemFilter={systemFilter}
            timeStr={timeStr}
          />
        )}

        {locationMode === 'NCGSA' && (
          <NcgsaObserverView
            satellites={satellites}
            telemetry={telemetry}
            mask={mask}
            systemFilter={systemFilter}
            timeStr={timeStr}
          />
        )}
      </div>

      {/* VIEW 5: Persistent 24-Hour Analytics Bottom Strip */}
      {/* <AnalyticsStrip
        lat={observer.lat}
        lng={observer.lng}
        alt={observer.alt}
        mask={mask}
        timeStr={timeStr}
      /> */}
    </div>
  );
}
