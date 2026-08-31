// import { useMemo, useRef, useState } from 'react';

// import Header from '../components/ICTP/layout/Header';
// import DashboardLayout from '../components/ICTP/layout/DashboardLayout';
// import WorkspaceLauncher from '../components/ICTP/layout/WorkspaceLauncher';
// import FloatingWindow from '../components/ICTP/layout/FloatingWindow';
// import SettingsModal from '../components/ICTP/layout/SettingsModal';

// import KpiGrid from '../components/ICTP/kpi/KpiGrid';
// import StationPanel from '../components/ICTP/station/StationPanel';
// import GlobeSection from '../components/ICTP/globe/GlobeSection';
// import Skyplot from '../components/ICTP/skyplot/Skyplot';
// import SatelliteTable from '../components/ICTP/table/SatelliteTable';

// import SnrChart from '../components/ICTP/charts/SnrChart';
// import IonoDelayChart from '../components/ICTP/charts/IonoDelayChart';
// import MultipathChart from '../components/ICTP/charts/MultipathChart';
// import CompletenessChart from '../components/ICTP/charts/CompletenessChart';
// import CycleSlipsChart from '../components/ICTP/charts/CycleSlipsChart';
// import QualityAlerts from '../components/ICTP/charts/QualityAlerts';

// import SatelliteSelector from '../components/ICTP/common/SatelliteSelector';
// import SatellitesInViewChart from '../components/ICTP/charts/SatellitesInViewChart';
// import DopHistoryChart from '../components/ICTP/charts/DopHistoryChart';
// import ConstellationCountChart from '../components/ICTP/charts/ConstellationCountChart';

// import GroundTrackMap from '../components/ICTP/geomap/GroundTrackMap';
// import IonosphericMap from '../components/ICTP/geomap/IonosphericMap';

// import HelpGuide from '../components/ICTP/help/HelpGuide';

// import { SelectionProvider } from '../components/ICTP/ictp_state/SelectionContext';
// import { useDashboardData } from '../components/ICTP/hooks/useDashboardData';

// import "./Stylesheet/ictp.css";
// import Footer2 from '../components/Footer2';

// // ------------------------------------------------------------
// // Panels available from the launcher
// // ------------------------------------------------------------

// const LAUNCHABLE = [
//   {
//     id: 'snr',
//     label: 'SNR',
//     width: 440,
//     height: 300,
//     category: 'quality',
//   },
//   {
//     id: 'iono',
//     label: 'Iono Delay',
//     width: 440,
//     height: 300,
//     category: 'quality',
//   },
//   {
//     id: 'multipath',
//     label: 'Multipath',
//     width: 440,
//     height: 300,
//     category: 'quality',
//   },
//   {
//     id: 'completeness',
//     label: 'Completeness',
//     width: 440,
//     height: 300,
//     category: 'quality',
//   },
//   {
//     id: 'cycleslips',
//     label: 'Cycle Slips',
//     width: 420,
//     height: 300,
//     category: 'quality',
//   },
//   {
//     id: 'alerts',
//     label: 'Quality Alerts',
//     width: 340,
//     height: 360,
//     category: 'alerts',
//   },
//   {
//     id: 'inview',
//     label: 'Satellites in View',
//     width: 460,
//     height: 300,
//     category: 'timeseries',
//   },
//   {
//     id: 'dop',
//     label: 'DOP Trend',
//     width: 520,
//     height: 320,
//     category: 'timeseries',
//   },
//   {
//     id: 'constellation',
//     label: 'Constellation Count',
//     width: 480,
//     height: 300,
//     category: 'timeseries',
//   },
//   {
//     id: 'groundtrack',
//     label: '2D Orbit Map',
//     width: 620,
//     height: 420,
//     category: 'maps',
//   },
//   {
//     id: 'ionomap',
//     label: 'Iono Map',
//     width: 620,
//     height: 420,
//     category: 'maps',
//   },
//   {
//     id: 'table',
//     label: 'Satellite Table',
//     width: 800,
//     height: 480,
//     category: 'maps',
//   },
// ];


// // ------------------------------------------------------------
// // Help / Guide panel
// // ------------------------------------------------------------

// const GUIDE_PANEL = {
//   id: 'guide',
//   width: 480,
//   height: 560,
// };


// // ------------------------------------------------------------
// // ICTP Dashboard
// // ------------------------------------------------------------

// export default function ICTP() {

//   const {
//     wsStatus,
//     refetchToken,
//     station,
//     satellites,
//     skyplot,
//     satellitesInView,
//     dopHistory,
//     systemStatus,
//   } = useDashboardData();


//   const [settingsOpen, setSettingsOpen] = useState(false);

//   const [openPanels, setOpenPanels] = useState([]);

//   const zRef = useRef(10);


//   // ----------------------------------------------------------
//   // Open / close floating panel
//   // ----------------------------------------------------------

//   const togglePanel = (id) => {

//     setOpenPanels((prev) => {

//       const existing = prev.find((p) => p.id === id);

//       // Close if already open
//       if (existing) {
//         return prev.filter((p) => p.id !== id);
//       }

//       // Increase z-index
//       zRef.current += 1;

//       // Cascade windows
//       const cascade = (prev.length % 6) * 26;

//       return [
//         ...prev,
//         {
//           id,
//           x: 72 + cascade,
//           y: 24 + cascade,
//           z: zRef.current,
//         },
//       ];

//     });

//   };


//   // ----------------------------------------------------------
//   // Close panel
//   // ----------------------------------------------------------

//   const closePanel = (id) => {

//     setOpenPanels((prev) =>
//       prev.filter((p) => p.id !== id)
//     );

//   };


//   // ----------------------------------------------------------
//   // Bring panel to front
//   // ----------------------------------------------------------

//   const focusPanel = (id) => {

//     zRef.current += 1;

//     const z = zRef.current;

//     setOpenPanels((prev) =>
//       prev.map((p) =>
//         p.id === id
//           ? { ...p, z }
//           : p
//       )
//     );

//   };


//   // ----------------------------------------------------------
//   // Refresh all dashboard data
//   // ----------------------------------------------------------

//   const refreshAll = () => {

//     station.refetch();
//     satellites.refetch();
//     skyplot.refetch();
//     satellitesInView.refetch();
//     dopHistory.refetch();
//     systemStatus.refetch();

//   };


//   // ----------------------------------------------------------
//   // Fullscreen
//   // ----------------------------------------------------------

//   const toggleFullscreen = () => {

//     if (document.fullscreenElement) {

//       document.exitFullscreen();

//     } else {

//       document.documentElement.requestFullscreen?.();

//     }

//   };


//   // ----------------------------------------------------------
//   // Floating window contents
//   // ----------------------------------------------------------

//   const panelContent = useMemo(
//     () => ({

//       guide: <HelpGuide />,

//       snr: (
//         <SnrChart
//           satellitesResponse={satellites.data}
//           loading={satellites.loading}
//           error={satellites.error}
//         />
//       ),

//       iono: (
//         <IonoDelayChart
//           satellitesResponse={satellites.data}
//           loading={satellites.loading}
//           error={satellites.error}
//         />
//       ),

//       multipath: (
//         <MultipathChart
//           satellitesResponse={satellites.data}
//           loading={satellites.loading}
//           error={satellites.error}
//         />
//       ),

//       completeness: (
//         <CompletenessChart
//           satellitesResponse={satellites.data}
//           loading={satellites.loading}
//           error={satellites.error}
//         />
//       ),

//       cycleslips: (
//         <CycleSlipsChart
//           satellitesResponse={satellites.data}
//           loading={satellites.loading}
//           error={satellites.error}
//         />
//       ),

//       alerts: (
//         <QualityAlerts
//           satellitesResponse={satellites.data}
//         />
//       ),

//       inview: (
//         <SatellitesInViewChart
//           data={satellitesInView.data}
//           loading={satellitesInView.loading}
//           error={satellitesInView.error}
//         />
//       ),

//       dop: (
//         <DopHistoryChart
//           data={dopHistory.data}
//           loading={dopHistory.loading}
//           error={dopHistory.error}
//         />
//       ),

//       constellation: (
//         <ConstellationCountChart
//           skyplotResponse={skyplot.data}
//           loading={skyplot.loading}
//           error={skyplot.error}
//         />
//       ),

//       groundtrack: (
//         <GroundTrackMap
//           stationResponse={station.data}
//           refetchToken={refetchToken}
//         />
//       ),

//       ionomap: (
//         <IonosphericMap
//           satellitesResponse={satellites.data}
//           refetchToken={refetchToken}
//         />
//       ),

//       table: (
//         <SatelliteTable
//           satellitesResponse={satellites.data}
//           skyplotResponse={skyplot.data}
//           loading={satellites.loading}
//         />
//       ),

//     }),

//     [
//       satellites.data,
//       satellites.loading,
//       satellites.error,

//       satellitesInView.data,
//       satellitesInView.loading,
//       satellitesInView.error,

//       dopHistory.data,
//       dopHistory.loading,
//       dopHistory.error,

//       skyplot.data,
//       skyplot.loading,
//       skyplot.error,

//       station.data,
//       refetchToken,
//     ]
//   );


//   // ----------------------------------------------------------
//   // Render
//   // ----------------------------------------------------------

//   return (
//     <SelectionProvider>
//       <div className="observatory-dashboard-wrapper overflow-hidden flex flex-col bg-background text-text-primary" style={{ height: "calc(100vh - 70px)" }}>
//         {/* Header */}
//         <Header
//           systemStatus={systemStatus.data}
//           wsStatus={wsStatus}
//           onRefresh={refreshAll}
//           onOpenSettings={() => setSettingsOpen(true)}
//           onToggleFullscreen={toggleFullscreen}
//         />


//         {/* KPI Cards */}
//         <div className="px-3 pt-3 shrink-0">

//           <KpiGrid
//             satellitesResponse={satellites.data}
//             skyplotResponse={skyplot.data}
//             stationResponse={station.data}
//           />

//         </div>


//         {/* Workspace Launcher */}
//         <WorkspaceLauncher
//           items={LAUNCHABLE}
//           openIds={openPanels.map((p) => p.id)}
//           onToggle={togglePanel}
//           guideOpen={openPanels.some(
//             (p) => p.id === GUIDE_PANEL.id
//           )}
//           onToggleGuide={() =>
//             togglePanel(GUIDE_PANEL.id)
//           }
//         />


//         {/* Main Dashboard */}
//         <div className="relative flex-1 min-h-0 overflow-hidden">

//           <DashboardLayout

//             selector={
//               <SatelliteSelector
//                 satellitesResponse={satellites.data}
//               />
//             }


//             station={
//               <StationPanel
//                 station={station.data}
//                 loading={station.loading}
//                 error={station.error}
//                 dataAgeSeconds={
//                   systemStatus.data?.data_age_seconds
//                 }
//                 stale={
//                   systemStatus.data?.stale
//                 }
//               />
//             }


//             globe={
//               <GlobeSection
//                 stationResponse={station.data}
//                 satellitesResponse={satellites.data}
//                 refetchToken={refetchToken}
//               />
//             }


//             skyplot={
//               <Skyplot
//                 skyplotResponse={skyplot.data}
//                 satellitesResponse={satellites.data}
//                 loading={skyplot.loading}
//                 notFound={skyplot.notFound}
//                 error={skyplot.error}
//               />
//             }

//           />


//           {/* Floating Windows */}

//           {openPanels.map((p) => {

//             const cfg =
//               p.id === GUIDE_PANEL.id
//                 ? GUIDE_PANEL
//                 : LAUNCHABLE.find(
//                     (l) => l.id === p.id
//                   );


//             if (!cfg) return null;


//             return (

//               <FloatingWindow
//                 key={p.id}
//                 x={p.x}
//                 y={p.y}
//                 width={cfg.width}
//                 height={cfg.height}
//                 zIndex={p.z}
//                 onClose={() =>
//                   closePanel(p.id)
//                 }
//                 onFocus={() =>
//                   focusPanel(p.id)
//                 }
//               >

//                 {panelContent[p.id]}

//               </FloatingWindow>

//             );

//           })}

//         </div>


//         {/* Settings */}

//         {settingsOpen && (

//           <SettingsModal
//             onClose={() =>
//               setSettingsOpen(false)
//             }
//           />

//         )}
//      {/* <Footer2/> */}
//       </div>

//     </SelectionProvider>
   
  
//   );
// }

import { useMemo, useRef, useState } from 'react';

import Header from '../components/ICTP/layout/Header';
import DashboardLayout from '../components/ICTP/layout/DashboardLayout';
import WorkspaceLauncher from '../components/ICTP/layout/WorkspaceLauncher';
import FloatingWindow from '../components/ICTP/layout/FloatingWindow';
import SettingsModal from '../components/ICTP/layout/SettingsModal';

import KpiGrid from '../components/ICTP/kpi/KpiGrid';
import StationPanel from '../components/ICTP/station/StationPanel';
import GlobeSection from '../components/ICTP/globe/GlobeSection';
import Skyplot from '../components/ICTP/skyplot/Skyplot';
import SatelliteTable from '../components/ICTP/table/SatelliteTable';

import SnrChart from '../components/ICTP/charts/SnrChart';
import IonoDelayChart from '../components/ICTP/charts/IonoDelayChart';
import MultipathChart from '../components/ICTP/charts/MultipathChart';
import CompletenessChart from '../components/ICTP/charts/CompletenessChart';
import CycleSlipsChart from '../components/ICTP/charts/CycleSlipsChart';
import QualityAlerts from '../components/ICTP/charts/QualityAlerts';

import SatelliteSelector from '../components/ICTP/common/SatelliteSelector';
import SatellitesInViewChart from '../components/ICTP/charts/SatellitesInViewChart';
import DopHistoryChart from '../components/ICTP/charts/DopHistoryChart';
import ConstellationCountChart from '../components/ICTP/charts/ConstellationCountChart';

import GroundTrackMap from '../components/ICTP/geomap/GroundTrackMap';
import IonosphericMap from '../components/ICTP/geomap/IonosphericMap';

import HelpGuide from '../components/ICTP/help/HelpGuide';

import { SelectionProvider } from '../components/ICTP/ictp_state/SelectionContext';
import { useDashboardData } from '../components/ICTP/hooks/useDashboardData';

import "./Stylesheet/ictp.css";
import Footer2 from '../components/Footer2';

// ------------------------------------------------------------
// Panels available from the launcher
// ------------------------------------------------------------

const LAUNCHABLE = [
  {
    id: 'snr',
    label: 'SNR',
    width: 440,
    height: 300,
    category: 'quality',
  },
  {
    id: 'iono',
    label: 'Iono Delay',
    width: 440,
    height: 300,
    category: 'quality',
  },
  {
    id: 'multipath',
    label: 'Multipath',
    width: 440,
    height: 300,
    category: 'quality',
  },
  {
    id: 'completeness',
    label: 'Completeness',
    width: 440,
    height: 300,
    category: 'quality',
  },
  {
    id: 'cycleslips',
    label: 'Cycle Slips',
    width: 420,
    height: 300,
    category: 'quality',
  },
  {
    id: 'alerts',
    label: 'Quality Alerts',
    width: 340,
    height: 360,
    category: 'alerts',
  },
  {
    id: 'inview',
    label: 'Satellites in View',
    width: 460,
    height: 300,
    category: 'timeseries',
  },
  {
    id: 'dop',
    label: 'DOP Trend',
    width: 520,
    height: 320,
    category: 'timeseries',
  },
  {
    id: 'constellation',
    label: 'Constellation Count',
    width: 480,
    height: 300,
    category: 'timeseries',
  },
  {
    id: 'groundtrack',
    label: '2D Orbit Map',
    width: 620,
    height: 420,
    category: 'maps',
  },
  {
    id: 'ionomap',
    label: 'Iono Map',
    width: 620,
    height: 420,
    category: 'maps',
  },
  {
    id: 'table',
    label: 'Satellite Table',
    width: 800,
    height: 480,
    category: 'maps',
  },
];


// ------------------------------------------------------------
// Help / Guide panel
// ------------------------------------------------------------

const GUIDE_PANEL = {
  id: 'guide',
  width: 480,
  height: 560,
};


// ------------------------------------------------------------
// ICTP Dashboard
// ------------------------------------------------------------

export default function ICTP() {

  const {
    wsStatus,
    refetchToken,
    station,
    satellites,
    skyplot,
    satellitesInView,
    dopHistory,
    systemStatus,
  } = useDashboardData();


  const [settingsOpen, setSettingsOpen] = useState(false);

  const [openPanels, setOpenPanels] = useState([]);

  const zRef = useRef(10);


  // ----------------------------------------------------------
  // Open / close floating panel
  // ----------------------------------------------------------

  const togglePanel = (id) => {

    setOpenPanels((prev) => {

      const existing = prev.find((p) => p.id === id);

      // Close if already open
      if (existing) {
        return prev.filter((p) => p.id !== id);
      }

      // Increase z-index
      zRef.current += 1;

      // Cascade windows
      const cascade = (prev.length % 6) * 26;

      return [
        ...prev,
        {
          id,
          x: 72 + cascade,
          y: 24 + cascade,
          z: zRef.current,
        },
      ];

    });

  };


  // ----------------------------------------------------------
  // Close panel
  // ----------------------------------------------------------

  const closePanel = (id) => {

    setOpenPanels((prev) =>
      prev.filter((p) => p.id !== id)
    );

  };


  // ----------------------------------------------------------
  // Bring panel to front
  // ----------------------------------------------------------

  const focusPanel = (id) => {

    zRef.current += 1;

    const z = zRef.current;

    setOpenPanels((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, z }
          : p
      )
    );

  };


  // ----------------------------------------------------------
  // Refresh all dashboard data
  // ----------------------------------------------------------

  const refreshAll = () => {

    station.refetch();
    satellites.refetch();
    skyplot.refetch();
    satellitesInView.refetch();
    dopHistory.refetch();
    systemStatus.refetch();

  };


  // ----------------------------------------------------------
  // Fullscreen
  // ----------------------------------------------------------

  const toggleFullscreen = () => {

    if (document.fullscreenElement) {

      document.exitFullscreen();

    } else {

      document.documentElement.requestFullscreen?.();

    }

  };


  // ----------------------------------------------------------
  // Floating window contents
  // ----------------------------------------------------------

  const panelContent = useMemo(
    () => ({

      guide: <HelpGuide />,

      snr: (
        <SnrChart
          satellitesResponse={satellites.data}
          loading={satellites.loading}
          error={satellites.error}
        />
      ),

      iono: (
        <IonoDelayChart
          satellitesResponse={satellites.data}
          loading={satellites.loading}
          error={satellites.error}
        />
      ),

      multipath: (
        <MultipathChart
          satellitesResponse={satellites.data}
          loading={satellites.loading}
          error={satellites.error}
        />
      ),

      completeness: (
        <CompletenessChart
          satellitesResponse={satellites.data}
          loading={satellites.loading}
          error={satellites.error}
        />
      ),

      cycleslips: (
        <CycleSlipsChart
          satellitesResponse={satellites.data}
          loading={satellites.loading}
          error={satellites.error}
        />
      ),

      alerts: (
        <QualityAlerts
          satellitesResponse={satellites.data}
        />
      ),

      inview: (
        <SatellitesInViewChart
          data={satellitesInView.data}
          loading={satellitesInView.loading}
          error={satellitesInView.error}
        />
      ),

      dop: (
        <DopHistoryChart
          data={dopHistory.data}
          loading={dopHistory.loading}
          error={dopHistory.error}
        />
      ),

      constellation: (
        <ConstellationCountChart
          skyplotResponse={skyplot.data}
          loading={skyplot.loading}
          error={skyplot.error}
        />
      ),

      groundtrack: (
        <GroundTrackMap
          stationResponse={station.data}
          refetchToken={refetchToken}
        />
      ),

      ionomap: (
        <IonosphericMap
          satellitesResponse={satellites.data}
          refetchToken={refetchToken}
        />
      ),

      table: (
        <SatelliteTable
          satellitesResponse={satellites.data}
          skyplotResponse={skyplot.data}
          loading={satellites.loading}
        />
      ),

    }),

    [
      satellites.data,
      satellites.loading,
      satellites.error,

      satellitesInView.data,
      satellitesInView.loading,
      satellitesInView.error,

      dopHistory.data,
      dopHistory.loading,
      dopHistory.error,

      skyplot.data,
      skyplot.loading,
      skyplot.error,

      station.data,
      refetchToken,
    ]
  );


  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <SelectionProvider>
      <div
        className="observatory-dashboard-wrapper overflow-hidden flex flex-col bg-background text-text-primary font-sans"
        style={{ height: "calc(100vh - 70px)", fontFamily: "'Outfit', 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif" }}
      >
        {/* Header */}
        <Header
          systemStatus={systemStatus.data}
          wsStatus={wsStatus}
          onRefresh={refreshAll}
          onOpenSettings={() => setSettingsOpen(true)}
          onToggleFullscreen={toggleFullscreen}
        />


        {/* KPI Cards */}
        <div className="px-4 pt-4 pb-2 shrink-0">

          <KpiGrid
            satellitesResponse={satellites.data}
            skyplotResponse={skyplot.data}
            stationResponse={station.data}
          />

        </div>


        {/* Workspace Launcher */}
        <div className="px-4 pb-4 shrink-0">

          <WorkspaceLauncher
            items={LAUNCHABLE}
            openIds={openPanels.map((p) => p.id)}
            onToggle={togglePanel}
            guideOpen={openPanels.some(
              (p) => p.id === GUIDE_PANEL.id
            )}
            onToggleGuide={() =>
              togglePanel(GUIDE_PANEL.id)
            }
          />

        </div>


        {/* Main Dashboard */}
        <div className="relative flex-1 min-h-0 overflow-hidden px-4 pb-4">

          <DashboardLayout

            selector={
              <SatelliteSelector
                satellitesResponse={satellites.data}
              />
            }


            station={
              <StationPanel
                station={station.data}
                loading={station.loading}
                error={station.error}
                dataAgeSeconds={
                  systemStatus.data?.data_age_seconds
                }
                stale={
                  systemStatus.data?.stale
                }
              />
            }


            globe={
              <GlobeSection
                stationResponse={station.data}
                satellitesResponse={satellites.data}
                refetchToken={refetchToken}
              />
            }


            skyplot={
              <Skyplot
                skyplotResponse={skyplot.data}
                satellitesResponse={satellites.data}
                loading={skyplot.loading}
                notFound={skyplot.notFound}
                error={skyplot.error}
              />
            }

          />


          {/* Floating Windows */}

          {openPanels.map((p) => {

            const cfg =
              p.id === GUIDE_PANEL.id
                ? GUIDE_PANEL
                : LAUNCHABLE.find(
                    (l) => l.id === p.id
                  );


            if (!cfg) return null;


            return (

              <FloatingWindow
                key={p.id}
                x={p.x}
                y={p.y}
                width={cfg.width}
                height={cfg.height}
                zIndex={p.z}
                onClose={() =>
                  closePanel(p.id)
                }
                onFocus={() =>
                  focusPanel(p.id)
                }
              >

                {panelContent[p.id]}

              </FloatingWindow>

            );

          })}

        </div>


        {/* Settings */}

        {settingsOpen && (

          <SettingsModal
            onClose={() =>
              setSettingsOpen(false)
            }
          />

        )}
     {/* <Footer2/> */}
      </div>

    </SelectionProvider>
   
  
  );
}
