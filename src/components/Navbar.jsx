
import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  const navItems = [
    // { to: '/dashboards', label: 'Overview' },
    { to: '/dashboards/global', label: 'Global Perspective' },
    { to: '/dashboards/ublox', label: 'u-Blox Station' },
    { to: '/dashboards/ictp', label: 'ICTP Station' },
    { to: '/dashboards/septentrio', label: 'Septentrio Station' },
    // { to: '/copilot', label: 'GNSS Copilot' },
    { to: '/contributor', label: 'Contributors' },
    { to: '/glossary', label: 'GNSS Glossary' },
  ];

  return (
    <header className="nav-wrap">
      <nav className="nav">
        {/* Logo / Brand */}
        <Link className="brand" to="/" onClick={closeMenu}>
          <img
            src="/assets/GNSS-logo.png"
            alt="NCGSA GNSS Observatory logo"
            className="brand-logo-img"
          />
          <span className="brand-title-wrap">
            NCGSA GNSS Observatory<b></b>
            <small>GNSS RESEARCH LAB<b/> IST, Islamabad</small>

          </span>
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="menu-btn"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Navigation */}
        <div className={`nav-links ${open ? 'show' : ''}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeMenu}
              className={({ isActive }) =>
                `nav-link-btn ${isActive ? 'active' : ''}`
              }
              end={item.to === '/dashboards'}
            >
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* System Status */}
          <div className="nav-online-status">
            <span className="pulse-indicator" />
            <span>Online</span>
          </div>
        </div>
      </nav>
    </header>
  );
}