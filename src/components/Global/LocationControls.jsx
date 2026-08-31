import React from 'react';
import '../../dashboard/Stylesheet/global.css';
export default function LocationControls({
  searchQuery, setSearchQuery, showDropdown, setShowDropdown,
  cities, igsStations, observer, setObserver, autocompleteRef, handleSelectLocation
}) {
  const getFilteredLocations = () => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return [];

    const cityMatches = cities
      .filter(c => {
        const name = c.name ? c.name.toLowerCase() : '';
        return name.includes(query);
      })
      .map(c => ({ name: c.name || '', lat: c.lat || 0, lng: c.lng || 0, alt: c.alt || 0, code: 'CITY', type: 'City' }));

    const igsMatches = igsStations
      .filter(s => {
        const code = s.code ? s.code.toLowerCase() : '';
        const name = s.name ? s.name.toLowerCase() : '';
        return code.includes(query) || name.includes(query);
      })
      .map(s => ({ name: s.name || '', lat: s.lat || 0, lng: s.lng || 0, alt: s.alt || 0, code: s.code || '', type: 'IGS' }));

    return [...cityMatches, ...igsMatches].slice(0, 8);
  };

  const filtered = getFilteredLocations();

  return (
    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
      {/* Country / Station Auto-Search Input */}
      <div ref={autocompleteRef} className="autocomplete-container" style={{ width: '280px' }}>
        <input
          type="text"
          placeholder="🔍 SEARCH COUNTRY / CAPITAL..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          style={{
            width: '100%',
            background: 'rgba(15,23,42,0.85)',
            border: '2px solid var(--accent)',
            boxShadow: '0 0 15px rgba(56,189,248,0.25)',
            padding: '12px 18px',
            borderRadius: '10px',
            fontSize: '0.95rem',
            fontWeight: '800',
            color: '#fff',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            transition: 'var(--transition-fast)'
          }}
        />
        {showDropdown && searchQuery.trim().length > 0 && filtered.length > 0 && (
          <div className="autocomplete-dropdown">
            {filtered.map((loc, idx) => (
              <div key={idx} className="autocomplete-item" onClick={() => handleSelectLocation(loc)}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="autocomplete-item-name">{loc.name}</span>
                  <span className="autocomplete-item-type">{loc.type} • Lat: {loc.lat.toFixed(2)}, Lng: {loc.lng.toFixed(2)}</span>
                </div>
                <span className="autocomplete-item-code">{loc.code}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mask Slider */}
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', borderRadius: '12px' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mask:</span>
        <input
          type="range"
          min="0"
          max="30"
          value={observer.mask}
          onChange={(e) => setObserver({ ...observer, mask: parseFloat(e.target.value) })}
          style={{ cursor: 'pointer', width: '80px', accentColor: 'var(--accent)' }}
        />
        <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{observer.mask}°</span>
      </div>
    </div>
  );
}
