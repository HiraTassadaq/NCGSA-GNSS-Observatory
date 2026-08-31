import Panel from '../common/Panel';
import { getConstellationColor } from '../constants/constellations';

const CONSTELLATION_INFO = [
  { sys: 'GPS', letter: 'G', owner: 'United States', note: 'The original satellite navigation system, and usually the biggest source of satellites.' },
  { sys: 'GLONASS', letter: 'R', owner: 'Russia', note: "Russia's equivalent to GPS. Often tracked alongside GPS for a stronger fix." },
  { sys: 'GALILEO', letter: 'E', owner: 'European Union', note: "Europe's system. Civilian-run, and known for high positioning accuracy." },
  { sys: 'BEIDOU', letter: 'C', owner: 'China', note: "China's system. Fully global since 2020." },
  { sys: 'QZSS', letter: 'J', owner: 'Japan', note: 'A regional system that boosts GPS accuracy over Japan and the Asia-Pacific region.' },
  { sys: 'SBAS', letter: 'S', owner: 'Various', note: "Geostationary satellites that broadcast correction data. Not a full navigation system on their own." },
  { sys: 'NAVIC', letter: 'I', owner: 'India', note: "India's regional system, covering India and nearby areas." },
];

function Section({ id, title, tagline, children }) {
  return (
    <section id={id} className="scroll-mt-3">
      <div className="mb-3 border-b border-border/60 pb-2">
        <h3 className="text-[17px] font-bold text-text-primary leading-tight">{title}</h3>
        {tagline && <p className="text-[13px] text-text-muted leading-snug mt-0.5">{tagline}</p>}
      </div>
      <div className="text-[15px] leading-relaxed text-text-primary/95 space-y-3">{children}</div>
    </section>
  );
}

function Note({ children }) {
  return (
    <div className="rounded-md border border-border bg-white/[0.04] px-3.5 py-2.5 text-[14px] leading-relaxed text-text-muted">
      {children}
    </div>
  );
}

function Term({ children }) {
  return <span className="font-bold text-text-primary">{children}</span>;
}

function SubHeading({ children }) {
  return <p className="text-[15px] font-bold text-text-primary mt-3 mb-1">{children}</p>;
}

const TOC = [
  { id: 'start', label: 'Layout' },
  { id: 'header', label: 'Top bar' },
  { id: 'kpis', label: 'Summary numbers' },
  { id: 'station', label: 'Station panel' },
  { id: 'satpicker', label: 'Search / Satellite selector' },
  { id: 'globe', label: '3D globe' },
  { id: 'skyplot', label: 'Sky plot' },
  { id: 'panels', label: 'Chart panels' },
  { id: 'quality', label: 'Quality alerts' },
  { id: 'table', label: 'Satellite table' },
  { id: 'constellations', label: 'Constellations' },
  { id: 'colors', label: 'Colors and quality labels' },
  { id: 'offline', label: 'If the connection drops' },
  { id: 'settings', label: 'Settings and fullscreen' },
];

export default function HelpGuide() {
  return (
    <Panel
      className="h-full"
      bodyClassName="p-0"
      title="Dashboard Guide"
      subtitle="What each panel and chart on GNSS Insights shows you"
    >
      <div className="h-full overflow-y-auto p-5 space-y-7">

        <div className="space-y-3">
  <p className="text-[15px] leading-relaxed text-text-primary">
    <Term>GNSS Insights</Term> is one of the dashboards of the <Term>NCGSA GNSS Observatory</Term>,
    providing live visualization and analysis of GNSS observations from the{' '}
    <Term>ICTP Station</Term>, equipped with a <Term>u-blox ZED-F9P GNSS receiver</Term>, at the
    GNSS Research Lab, NCGSA, Institute of Space Technology (IST), Islamabad, Pakistan.
  </p>
  <p className="text-[15px] leading-relaxed text-text-primary">
    The dashboard provides an insight into the GNSS environment observed by the ICTP Station,
    including satellite visibility, satellite geometry, signal strength (C/N₀), positioning
    information, and timing. It enables users to explore which satellites are being observed by
    the receiver, evaluate the quality of their received signals, and understand the satellite
    geometry contributing to the GNSS position solution.
  </p>
  <p className="text-[15px] leading-relaxed text-text-primary">
    The dashboard also presents the measured position, receiver height, UTC time, and DOP
    parameters, providing an integrated view of the accuracy and quality of the positioning
    solution. Visualizations such as the <Term>Sky Plot</Term> show the distribution of
    satellites in the receiver's sky, while the <Term>Ground Track</Term> illustrates the
    movement of observed satellites over the Earth.
  </p>
  <p className="text-[15px] leading-relaxed text-text-primary">
    Together, these visualizations provide a comprehensive insight into GNSS satellite
    observations, signal quality, positioning, timing, satellite geometry, and receiver
    performance, making GNSS Insights a dedicated window into the GNSS observations from the
    ICTP Station at NCGSA-IST. Below is a plain, complete explanation of every panel, chart, and
    number on screen, including how to use the sky plot and the 3D view.
  </p>
</div>

        <nav className="flex flex-wrap gap-2">
          {TOC.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className="text-[13px] px-2.5 py-1.5 rounded-md border border-border bg-white/5 text-text-muted hover:text-text-primary hover:border-white/20 transition-colors"
            >
              {t.label}
            </a>
          ))}
        </nav>

        <Section id="start" title="Layout" tagline="How the screen is organized">
          <p>
            The center of the screen is the main view: the <Term>Station</Term> panel on the
            left, the <Term>3D globe</Term> in the middle, and the <Term>Sky Plot</Term> on the
            right. Everything else, like SNR, Multipath, and the Satellite Table, opens as its
            own floating window from the <Term>Panels</Term> bar at the top. Open only the
            windows needed and arrange them however works best.
          </p>
          <Note>Drag a window by its top bar to move it, drag the bottom-right corner to resize it, and click the X to close it. Clicking a window brings it to the front.</Note>
        </Section>

        <Section id="header" title="Top bar" tagline="Connection status, time, and quick controls">
          <p>
            The status badge shows whether the dashboard is currently connected and how fresh
            the data is:
          </p>
          <ul className="list-disc list-inside space-y-1.5">
            <li><Term>Live</Term> (green): new data from the ICTP GRAL receiver is arriving within the last few minutes. This is the normal, healthy state.</li>
            <li><Term>Delayed</Term> (amber): the connection is fine, but the receiver hasn't produced a new file in a while.</li>
            <li><Term>Offline</Term> (red): either the dashboard can't reach the server, or the data is old enough that it should no longer be treated as current.</li>
          </ul>
          <p>
            Next to it is the current time in three formats: local time, UTC, and GPS time (GPS
            time runs a fixed number of seconds ahead of UTC). Further along is when the last
            data file was processed, and how long ago that was.
          </p>
          <p>
            The icons on the right are <Term>Refresh</Term> (pull everything again right now),{' '}
            <Term>Settings</Term>, and <Term>Fullscreen</Term> (expands the dashboard to fill
            the screen).
          </p>
        </Section>

        <Section id="kpis" title="Summary numbers" tagline="The row of stats near the top">
          <p>
            A quick overview of the whole session before looking at individual charts. Hover
            over any number for a short explanation.
          </p>
          <ul className="list-disc list-inside space-y-1.5">
            <li><Term>Station Health</Term>: one blended score (0-100%, shown as a ring) that answers "is the station okay?" at a glance. It combines the share of satellites currently rated healthy with how good the current PDOP is. Excellent / Good / Fair / Poor, colored green, green, amber, or red.</li>
            <li><Term>Satellites Visible</Term>: how many satellites are currently above the elevation cutoff and usable for a fix, out of the total being tracked.</li>
            <li><Term>Tracked Satellites</Term>: every distinct satellite seen this session, visible or not.</li>
            <li><Term>Average SNR</Term>: the average signal strength across all satellites. Higher is cleaner and stronger.</li>
            <li><Term>Completeness</Term>: roughly what percentage of the expected data actually came through, with no gaps.</li>
            <li><Term>Healthy Sats</Term>: how many are currently rated Excellent or Good.</li>
            <li><Term>Warn / Poor</Term>: how many need attention, usually because they're low on the horizon or just rising or setting.</li>
            <li><Term>Cycle Slips</Term>: how many brief signal interruptions have been detected across the whole session.</li>
            <li><Term>PDOP</Term> / <Term>GDOP</Term> / <Term>HDOP</Term> / <Term>TDOP</Term>: how good the current satellite geometry is for calculating a position, height, and time. Lower is better. See "Colors and quality labels" below for what the numbers mean.</li>
          </ul>
        </Section>

        <Section id="station" title="Station panel" tagline="Where the receiver is, and how good the fix is">
          <p>
            The top of this panel identifies the station: <Term>ICTP/GRAL, Islamabad</Term>,
            along with the receiver and antenna model currently in use.
          </p>
          <SubHeading>Station</SubHeading>
          <p>
            The receiver's position as <Term>latitude / longitude / height</Term> above the
            reference ellipsoid.
          </p>
          <SubHeading>Position (ECEF)</SubHeading>
          <p>
            The same position again, but as <Term>ECEF X / Y / Z</Term>: a 3D coordinate
            system measured in meters from the center of the Earth. It isn't necessary to
            understand ECEF to use the dashboard, it's the same coordinate system the 3D globe
            uses to place satellites, and is shown mainly for reference.
          </p>
          <SubHeading>Quality</SubHeading>
          <p>
            <Term>HDOP</Term>, <Term>VDOP</Term>, <Term>PDOP</Term>, <Term>TDOP</Term>, and{' '}
            <Term>GDOP</Term>, measures of how good the current satellite geometry is for
            computing a horizontal position, vertical position, 3D position, time, and combined
            position + time respectively (explained further down under "Colors and quality
            labels"). See the <Term>DOP Trend</Term> chart panel to see how these changed across
            the whole session rather than just the current snapshot shown here.
          </p>
          <SubHeading>Session</SubHeading>
          <p>
            When this observation session started and ended, and <Term>Data Freshness</Term>,
            how long ago the last update from the ICTP GRAL receiver arrived.
          </p>
          <SubHeading>Equipment</SubHeading>
          <p>The exact receiver and antenna model in use at the station.</p>
        </Section>

        <Section id="satpicker" title="Search / Satellite selector" tagline="Find and focus on one satellite across every panel">
          <p>
            This is how to search for a specific satellite. Open the dropdown and either scroll
            to find it, or start typing its ID (for example <Term>G12</Term> or{' '}
            <Term>E05</Term>) to jump straight to it. Every satellite in the list is labeled
            with its ID and which constellation it belongs to.
          </p>
          <p>
            Once picked, that satellite is highlighted everywhere at once: a brighter, larger
            marker with its line of sight on the 3D globe, and a highlighted point on the sky
            plot. The same thing happens by clicking a satellite directly in the sky plot, the
            3D globe, the table, or Quality Alerts, so there are several ways to reach the same
            result. Click <Term>Clear</Term>, or pick the satellite again, to go back to normal.
          </p>
        </Section>

        <Section id="globe" title="3D globe" tagline="A live 3D view of every satellite above the station">
          <p>
            This shows the ICTP GRAL station and every satellite it is currently tracking in
            3D, positioned roughly where they actually are relative to Earth right now. It's
            the most visual way to understand what the receiver can see at any given moment.
          </p>
          <SubHeading>How to move around</SubHeading>
          <ul className="list-disc list-inside space-y-1.5">
            <li><Term>Click and drag</Term> to rotate the view around the Earth.</li>
            <li><Term>Scroll</Term> to zoom in or out, or use the on-screen <Term>+ / -</Term> zoom buttons.</li>
            <li><Term>Reset camera</Term> flies the view back to a clean overhead shot centered on the station.</li>
            <li><Term>Fullscreen</Term> on this panel expands just the globe to fill the screen. Press Esc, or click it again, to exit.</li>
          </ul>
          <SubHeading>How to select a satellite</SubHeading>
          <p>
            Click any satellite marker directly on the globe to select it, exactly the same as
            picking it from the Satellite Selector search box above. Its marker becomes larger
            and brighter with a label, so it's easy to tell apart from the rest.
          </p>
          <SubHeading>Display options</SubHeading>
          <ul className="list-disc list-inside space-y-1.5">
            <li><Term>Orbits</Term>: draws each visible satellite's full orbital path, not just its current position, so it's possible to see where it came from and where it's heading.</li>
            <li><Term>LOS (Line of Sight)</Term>: draws a straight line from the station to every satellite it can currently see.</li>
            <li><Term>Labels</Term>: shows each satellite's ID next to its marker.</li>
            <li><Term>Elevation Mask</Term>: hides satellites below a chosen angle above the horizon. Satellites close to the horizon tend to have weaker, noisier signals, so raising this filters them out of the view.</li>
          </ul>
        </Section>

        <Section id="skyplot" title="Sky plot" tagline="What the sky over the station looks like right now, and how to read it">
          <p>
            The sky plot answers a simple question: if standing at the ICTP GRAL receiver and
            looking straight up, what would the sky look like? It flattens that view into a
            circle. The <Term>center</Term> of the circle is straight overhead, and the outer
            ring is the horizon in every direction around the station. Every dot on the plot is
            a satellite, positioned exactly where it currently sits in the sky, and colored by
            which constellation it belongs to.
          </p>
          <p>
            Satellites near the <Term>center</Term> are high in the sky and generally give a
            stronger, cleaner signal. Satellites near the <Term>edge</Term> are low on the
            horizon, where buildings, trees, and terrain are more likely to block or weaken the
            signal.
          </p>
          <SubHeading>2D vs. 3D view</SubHeading>
          <p>
            Use the <Term>2D / 3D</Term> switch in the top-right of the panel to change how the
            plot is drawn. <Term>2D</Term> is the classic flat circular chart described above,
            fastest to read at a glance. <Term>3D</Term> renders the same satellite positions on
            a rotatable dome, which can make it easier to see how satellites are spread across
            different parts of the sky at once. Click and drag inside the 3D view to rotate it,
            and scroll to zoom, the same as the 3D globe.
          </p>
          <SubHeading>Constellation filters</SubHeading>
          <p>
            The row of colored buttons (GPS, GLONASS, GALILEO, and so on) across the top toggles
            which constellations are shown. Click one to hide it, click again to bring it back.
            Use this to reduce clutter and focus on just one or two systems at a time.
          </p>
          <SubHeading>Elevation mask</SubHeading>
          <p>
            Use the <Term>0° / 5° / 10° / 15° / 20°</Term> preset buttons, or type an exact
            value into the <Term>Mask</Term> box, to hide every satellite below that angle above
            the horizon. A dashed circle appears on the plot showing exactly where that cutoff
            sits. This mirrors the same elevation mask on the 3D globe.
          </p>
          <SubHeading>Trails</SubHeading>
          <p>
            Turn on <Term>Trails</Term> to draw each satellite's recent path across the sky
            instead of showing only its current position, useful for seeing which direction a
            satellite is moving and how fast.
          </p>
          <SubHeading>Reading a satellite's details</SubHeading>
          <p>
            Hover over, or click, any dot to open a small info card showing its ID,
            constellation, exact elevation and azimuth angle, signal strength, and quality
            rating. Clicking pins that card in place and selects the satellite everywhere else
            on the dashboard; hovering shows it temporarily without changing the current
            selection.
          </p>
        </Section>

        <Section id="panels" title="Chart panels" tagline="Opened from the Panels bar at the top">
          <ul className="list-disc list-inside space-y-1.5">
            <li><Term>SNR</Term>: signal strength for each satellite. Taller bars mean a stronger signal.</li>
            <li><Term>Iono Delay</Term>: how much the Earth's upper atmosphere is bending and slowing each satellite's signal. Larger delays mean slightly less accuracy from that satellite.</li>
            <li><Term>Multipath</Term>: signal that bounced off a nearby surface before reaching the receiver, which can throw off accuracy. Lower is better.</li>
            <li><Term>Completeness</Term>: what percentage of the expected data from each satellite actually arrived, with no gaps. 100% is ideal.</li>
            <li><Term>Cycle Slips</Term>: brief interruptions in a satellite's signal this session, for example from a passing obstruction. Fewer is better.</li>
            <li><Term>Satellites in View</Term>: a timeline of how many satellites were visible above the elevation mask over time.</li>
            <li><Term>Constellation Count</Term>: the same idea, broken down by which GNSS system each visible satellite belongs to.</li>
            <li><Term>DOP Trend</Term>: how HDOP, VDOP, PDOP, TDOP, and GDOP each changed over the session, one line per DOP type. The KPI bar and Quality panel only ever show the single most recent value; this is the only place to see how satellite geometry &mdash; and therefore fix quality &mdash; evolved throughout the session. Lower is better for every line.</li>
            <li><Term>2D Orbit Map</Term>: a flat world map showing each satellite's ground track, the path directly below it on Earth's surface.</li>
            <li><Term>Iono Map</Term>: a flat world map version of the ionospheric delay data, useful for spotting patterns geographically.</li>
            <li><Term>Satellite Table</Term>: every number from every chart above, in one sortable table, one row per satellite.</li>
          </ul>
          <Note>Click any bar, point, or row in these panels to select that satellite. It highlights across the globe and sky plot too.</Note>
        </Section>

        <Section id="quality" title="Quality alerts" tagline="A shortlist of satellites worth a second look">
          <p>
            Automatically lists any satellite currently rated <Term>Partial</Term> or{' '}
            <Term>Poor</Term>, or that has had a cycle slip this session, so there's no need to
            scan the whole table to spot problems. If it's empty, everything currently being
            tracked is within normal range. Click any entry to jump to that satellite everywhere
            else on screen.
          </p>
        </Section>

        <Section id="table" title="Satellite table" tagline="The full raw data, one row per satellite">
          <p>
            Every measurement behind every chart, side by side in one place. Useful for
            comparing several satellites directly, sorting by a specific column, or checking an
            exact number rather than reading it off a bar chart.
          </p>
        </Section>

        <Section id="constellations" title="Constellations" tagline="Whose satellites the ICTP GRAL receiver is actually seeing">
          <p>
            A constellation is a country or region's satellite network. The receiver can usually
            see satellites from several of these at once, which is a good thing: more
            satellites from more angles generally means a better, more reliable fix. Each
            satellite's ID starts with a letter that identifies which constellation it belongs
            to.
          </p>
          <ul className="space-y-2.5">
            {CONSTELLATION_INFO.map((c) => (
              <li key={c.sys} className="flex items-start gap-2.5">
                <span
                  className="mt-1.5 h-3 w-3 rounded-full shrink-0"
                  style={{ background: getConstellationColor(c.sys) }}
                />
                <span>
                  <span className="font-bold">{c.sys}</span>{' '}
                  <span className="font-mono text-text-muted text-[12px]">({c.letter}xx IDs)</span>
                  <span className="text-text-muted">, {c.owner}. {c.note}</span>
                </span>
              </li>
            ))}
          </ul>
          <p>
            The same color is used for each constellation everywhere on the dashboard: the
            globe, the sky plot, every chart, and the table.
          </p>
        </Section>

        <Section id="colors" title="Colors and quality labels" tagline="What Good, Poor, green, and red mean">
          <p>
            Throughout the dashboard, satellites and numbers are labeled <Term>Excellent</Term>,{' '}
            <Term>Good</Term>, <Term>Moderate</Term> (or <Term>Fair</Term>), or{' '}
            <Term>Poor</Term>, usually shown as a green, amber, or red badge. Green means
            healthy, no action needed. Amber means worth keeping an eye on. Red means it's
            actively hurting accuracy right now.
          </p>
          <ul className="list-disc list-inside space-y-1.5">
            <li><Term>Signal strength (SNR)</Term>: 45 dB-Hz and up is Excellent, 35-45 is Good, 25-35 is Moderate, below 25 is Poor.</li>
            <li><Term>Position accuracy (HDOP / VDOP / PDOP / TDOP / GDOP)</Term>: under 2 is Excellent, 2-5 is Good, 5-10 is Moderate, above 10 is Poor. Lower always means a more reliable position.</li>
            <li><Term>Per-satellite quality</Term> (in the table and Quality Alerts) is based mainly on how complete and clean that satellite's data has been this session.</li>
          </ul>
        </Section>

        <Section id="offline" title="If the connection drops" tagline="Data stays on screen">
          <p>
            If the connection drops or gets flaky, every chart, the table, and the sky plot stay
            exactly as they were. Nothing disappears or resets. A small{' '}
            <Term>Offline, last known data</Term> badge appears on the affected panel, showing
            that this is the last data that loaded successfully rather than a live feed. Once
            the connection comes back, everything updates automatically. No need to refresh the
            page.
          </p>
        </Section>

        <Section id="settings" title="Settings and fullscreen" tagline="A couple of extra controls">
          <p>
            <Term>Settings</Term> shows the technical connection details for this dashboard,
            mostly useful for troubleshooting rather than day-to-day use. <Term>Fullscreen</Term>{' '}
            expands the dashboard to fill the screen. Press Esc, or click it again, to exit.
          </p>
        </Section>

      </div>
    </Panel>
  );
}
