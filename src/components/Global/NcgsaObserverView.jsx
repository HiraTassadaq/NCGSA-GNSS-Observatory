import React from 'react';
import WhatsOverheadTable from './WhatsOverheadTable';
import NcgsaSkyPlot from './NcgsaSkyPlot';
import CurrentDopPanel from './CurrentDopPanel';
import UpcomingPassesTable from './UpcomingPassesTable';
import '../../dashboard/Stylesheet/global.css';
export default function NcgsaObserverView({
  satellites = [],
  telemetry,
  mask = 10.0,
  systemFilter = 'ALL',
  timeStr = ''
}) {
  return (
    <div className="view-layout-top3-bottom">
      <div className="top-3-grid">
        <div className="grid-cell">
          <WhatsOverheadTable satellites={satellites} />
        </div>
        <div className="grid-cell">
          <NcgsaSkyPlot satellites={satellites} />
        </div>
        <div className="grid-cell">
          <CurrentDopPanel telemetry={telemetry} />
        </div>
      </div>

      <div className="bottom-full-cell">
        <UpcomingPassesTable mask={mask} systemFilter={systemFilter} timeStr={timeStr} />
      </div>
    </div>
  );
}
