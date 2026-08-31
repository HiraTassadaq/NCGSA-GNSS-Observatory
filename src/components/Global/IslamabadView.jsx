import React from 'react';
import IslamabadSkyPlot from './IslamabadSkyPlot';
import IslamabadDopGrid from './IslamabadDopGrid';
import IslamabadTecMap from './IslamabadTecMap';
import VisibilityTimeline from './VisibilityTimeline';
import '../../dashboard/Stylesheet/global.css';
export default function IslamabadView({
  satellites = [],
  mask = 10.0,
  systemFilter = 'ALL',
  timeStr = ''
}) {
  return (
    <div className="view-layout-top3-bottom">
      <div className="top-3-grid">
        <div className="grid-cell">
          <IslamabadSkyPlot satellites={satellites} />
        </div>
        <div className="grid-cell">
          <IslamabadDopGrid mask={mask} systemFilter={systemFilter} timeStr={timeStr} />
        </div>
        <div className="grid-cell">
          <IslamabadTecMap mask={mask} timeStr={timeStr} />
        </div>
      </div>

      <div className="bottom-full-cell">
        <VisibilityTimeline
          lat={33.6844}
          lng={73.0479}
          alt={540.0}
          mask={mask}
          systemFilter={systemFilter}
          timeStr={timeStr}
        />
      </div>
    </div>
  );
}
