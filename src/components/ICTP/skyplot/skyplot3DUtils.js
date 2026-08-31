// 3D dome/hemisphere projection for the sky plot.
//
// Model: the station sits at the origin. A satellite at (azimuthDeg,
// elevationDeg) is a point on a unit hemisphere of radius R:
//   E (east)  = R * cos(elevation) * sin(azimuth)
//   N (north) = R * cos(elevation) * cos(azimuth)
//   U (up)    = R * sin(elevation)
// elevation=90 (zenith) -> the top of the dome. elevation=0 (horizon) -> the
// rim circle. This matches the 2D skyplot's convention (azimuth clockwise
// from N) so both views agree on where a satellite sits.
//
// The scene is then rotated by a user-controlled yaw (spin around the
// vertical axis) and pitch (tilt, 90 deg = looking straight down like the
// 2D plot, lower values = looking at the dome from a shallower, more
// oblique angle) before being projected onto the 2D screen plane. Depth
// (distance toward/away from the viewer after rotation) is returned
// alongside each point so the caller can fade/scale near vs far points.

export const DOME_VIEW = 500;
export const DOME_CENTER = DOME_VIEW / 2;
export const DOME_RADIUS = 210;

export const DEFAULT_YAW = 25;
export const DEFAULT_PITCH = 52;
export const PITCH_MIN = 20;
export const PITCH_MAX = 88;

const toRad = (deg) => (deg * Math.PI) / 180;

/** Rotate an ENU point by yaw (around U) then pitch (around E). Returns {e, n, u}. */
function rotatePoint(E, N, U, yawDeg, pitchDeg) {
  const yaw = toRad(yawDeg);
  const pitch = toRad(pitchDeg);

  const e1 = E * Math.cos(yaw) - N * Math.sin(yaw);
  const n1 = E * Math.sin(yaw) + N * Math.cos(yaw);
  const u1 = U;

  const n2 = n1 * Math.cos(pitch) - u1 * Math.sin(pitch);
  const u2 = n1 * Math.sin(pitch) + u1 * Math.cos(pitch);

  return { e: e1, n: n2, u: u2 };
}

/** Core projection, no elevation clamping -- used for the sphere shell/wireframe. */
function projectRaw(azimuthDeg, elevationDeg, yawDeg, pitchDeg, radius) {
  const el = toRad(elevationDeg);
  const az = toRad(azimuthDeg);

  const E = radius * Math.cos(el) * Math.sin(az);
  const N = radius * Math.cos(el) * Math.cos(az);
  const U = radius * Math.sin(el);

  const { e, n, u } = rotatePoint(E, N, U, yawDeg, pitchDeg);

  return {
    x: DOME_CENTER + e,
    y: DOME_CENTER - u,
    depth: radius === 0 ? 0 : n / radius,
  };
}

/**
 * Project an (azimuthDeg, elevationDeg) sky position to screen coordinates.
 * Returns { x, y, depth } where depth is normalized roughly to [-1, 1]
 * (negative = far side of the sphere, positive = near side / toward viewer).
 * Elevation is clamped to [-10, 90] -- real satellite data never belongs
 * below the horizon by more than a hair, so this guards against bad values.
 */
export function domeProject(azimuthDeg, elevationDeg, yawDeg, pitchDeg, radius = DOME_RADIUS) {
  const clampedElevation = Math.max(-10, Math.min(90, elevationDeg));
  return projectRaw(azimuthDeg, clampedElevation, yawDeg, pitchDeg, radius);
}

/** Same projection with no clamp -- for drawing the full sphere shell (both hemispheres). */
export function sphereProject(azimuthDeg, elevationDeg, yawDeg, pitchDeg, radius = DOME_RADIUS) {
  return projectRaw(azimuthDeg, elevationDeg, yawDeg, pitchDeg, radius);
}

/** Sample a full ring at a fixed elevation (e.g. the equator, or a +/-30 deg ring) as an SVG path. */
export function ringPath(elevationDeg, yawDeg, pitchDeg, radius = DOME_RADIUS, steps = 72) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const az = (360 * i) / steps;
    pts.push(sphereProject(az, elevationDeg, yawDeg, pitchDeg, radius));
  }
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

/** Sample a full meridian (fixed azimuth, pole to pole: -90 to +90 elevation) as an SVG path. */
export function meridianPath(azimuthDeg, yawDeg, pitchDeg, radius = DOME_RADIUS, steps = 36) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const el = -90 + (180 * i) / steps;
    pts.push(sphereProject(azimuthDeg, el, yawDeg, pitchDeg, radius));
  }
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

export const DOME_ELEVATION_RINGS = [-60, -30, 0, 30, 60];
export const DOME_MERIDIANS = [0, 45, 90, 135, 180, 225, 270, 315];
export const DOME_CARDINALS = [
  { label: 'N', az: 0 },
  { label: 'E', az: 90 },
  { label: 'S', az: 180 },
  { label: 'W', az: 270 },
];
