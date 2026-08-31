import * as Cesium from 'cesium';
import { Entity, PolylineGraphics } from 'resium';
import { getConstellationColor } from '../constants/constellations';
import { pathToCartesianArray } from './globeUtils';

/**
 * Renders one satellite's REAL sampled orbit track (the same
 * broadcast-ephemeris points served by /api/satellites/orbits, sampled
 * every few minutes across the session -- see
 * gnss_backend/app/skyplot_data.py). Never a fabricated/idealized ellipse:
 * if fewer than 2 real samples exist for this PRN, nothing is drawn.
 */
export default function OrbitPath({ prn, constellation, points, highlighted }) {
  const positions = pathToCartesianArray(points || []);
  if (positions.length < 2) return null;

  const color = Cesium.Color.fromCssColorString(getConstellationColor(constellation));

  return (
    <Entity name={`${prn}-orbit`}>
      <PolylineGraphics
        positions={positions}
        width={highlighted ? 2.5 : 1}
        material={highlighted ? color.withAlpha(0.9) : color.withAlpha(0.28)}
        clampToGround={false}
      />
    </Entity>
  );
}
