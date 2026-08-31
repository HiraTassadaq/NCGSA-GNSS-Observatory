// Single source of truth for constellation identity: colors, display names,
// and PRN-letter mapping. Every component (globe, skyplot, charts, table,
// filters) imports from here so the mapping never drifts between views.

export const CONSTELLATION_COLORS = {
  GPS: '#35D07F',
  GLONASS: '#FF5A65',
  GALILEO: '#3EA6FF',
  BEIDOU: '#F4B942',
  QZSS: '#F4E04D',
  SBAS: '#B26EFF',
  NAVIC: '#37E4E0',
  IRNSS: '#37E4E0', // backend labels this system "IRNSS"; treated as NAVIC
};

export const CONSTELLATION_FALLBACK_COLOR = '#8b93a1';

// RINEX PRN first-letter -> full system name, matching the backend's own
// SYS_NAME / SYS_LETTER_TO_NAME mapping (gnss_backend/app/parser.py,
// gnss_backend/app/skyplot_data.py) so labels always agree with the API.
export const PRN_LETTER_TO_SYSTEM = {
  G: 'GPS',
  R: 'GLONASS',
  E: 'GALILEO',
  C: 'BEIDOU',
  J: 'QZSS',
  S: 'SBAS',
  I: 'NAVIC',
};

export const CONSTELLATIONS = ['GPS', 'GLONASS', 'GALILEO', 'BEIDOU', 'QZSS', 'SBAS', 'NAVIC'];

export function normalizeSystemName(system) {
  if (!system) return 'UNKNOWN';
  const upper = system.toUpperCase();
  if (upper === 'IRNSS') return 'NAVIC';
  return upper;
}

export function systemFromPrn(prn) {
  if (!prn) return 'UNKNOWN';
  return PRN_LETTER_TO_SYSTEM[prn[0]?.toUpperCase()] || 'UNKNOWN';
}

export function getConstellationColor(system) {
  const key = normalizeSystemName(system);
  return CONSTELLATION_COLORS[key] || CONSTELLATION_FALLBACK_COLOR;
}
