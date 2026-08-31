import React from 'react';
import '../../dashboard/Stylesheet/global.css';
export default function CompactLocationControls({
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
    <div className="compact-location-controls">
      <div ref={autocompleteRef} className="autocomplete-container" style={{ width: '170px' }}>
        <input
          type="text"
          placeholder="Location..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          className="compact-search-input"
        />
        {showDropdown && searchQuery.trim().length > 0 && filtered.length > 0 && (
          <div className="autocomplete-dropdown">
            {filtered.map((loc, idx) => (
              <div key={idx} className="autocomplete-item" onClick={() => handleSelectLocation(loc)}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="autocomplete-item-name">{loc.name}</span>
                  <span className="autocomplete-item-type">{loc.type}</span>
                </div>
                <span className="autocomplete-item-code">{loc.code}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="compact-mask-control">
        <span className="compact-mask-label">Mask</span>
        <input
          type="range"
          min="0"
          max="30"
          value={observer.mask}
          onChange={(e) => setObserver({ ...observer, mask: parseFloat(e.target.value) })}
          className="compact-mask-slider"
        />
        <span className="compact-mask-value">{observer.mask}°</span>
      </div>
    </div>
  );
}
