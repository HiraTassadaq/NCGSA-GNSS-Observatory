const VIEW = 500;
const CENTER = VIEW / 2;
const RADIUS = 210;

// Standard sky-plot polar projection: elevation 90° (zenith) = center,
// elevation 0° (horizon) = outer ring, azimuth measured clockwise from N.
export function polarToXY(azimuthDeg, elevationDeg) {
  const clampedElevation = Math.max(-10, Math.min(90, elevationDeg));
  const distance = RADIUS * (1 - clampedElevation / 90);
  const angle = (azimuthDeg * Math.PI) / 180;
  return {
    x: CENTER + distance * Math.sin(angle),
    y: CENTER - distance * Math.cos(angle),
  };
}

export function elevationRingRadius(elevationDeg) {
  return RADIUS * (1 - elevationDeg / 90);
}

export const SKYPLOT_VIEW = VIEW;
export const SKYPLOT_CENTER = CENTER;
export const SKYPLOT_RADIUS = RADIUS;
export const ELEVATION_RINGS = [0, 30, 60, 90];
