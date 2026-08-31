
import {
  LayoutDashboard,
  Globe2,
  Radio,
  Satellite,
  Activity,
} from 'lucide-react';
import '../dashboardStyle.css';
const entries = [
  ['overview', 'Overview', LayoutDashboard],

  [
    'global',
    '01 — GNSS Constellations',
    Globe2,
    ' Global Perspective',
  ],

  [
    'ublox',
    '02 — GNSS Monitor',
    Radio,
    'u-blox Station',
  ],

  [
    'ictp',
    '03 — GNSS Insights',
    Satellite,
    ' ICTP Station',
  ],

  [
    'septentrio',
    '04 — GNSS Telemetry',
    Activity,
    ' Septentrio Station',
  ],
];

export default function Sidebar({
  receiver,
  active,
  setActive,
  open,
  setOpen,
}) {
  return (
    <aside className={`sidebar ${open ? 'side-open' : ''}`}>

      <div className="receiver-chip">
        <i />
        <span>GNSS OBSERVATORY</span>
        <b>{receiver?.name || 'Overview'}</b>
      </div>

      <nav>
        {entries.map(([id, label, Icon, subtitle]) => (
          <button
            key={id}
            className={active === id ? 'active' : ''}
            onClick={() => {
              setActive(id);
              setOpen(false);
            }}
          >
            <Icon size={17} />

            <span className="side-link-text">
              <strong>{label}</strong>

              {subtitle && (
                <small>{subtitle}</small>
              )}
            </span>
          </button>
        ))}
      </nav>

      <div className="side-meta">
        <span>SYSTEM STATUS</span>
        <b>
          <i /> ONLINE
        </b>
        <small>GNSS Observatory</small>
      </div>

    </aside>
  );
}