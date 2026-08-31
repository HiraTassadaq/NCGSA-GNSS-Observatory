import { useMemo } from 'react';
import { geoEquirectangular, geoPath, geoGraticule } from 'd3-geo';
import { feature } from 'topojson-client';
import worldTopo from 'world-atlas/land-110m.json';

const WIDTH = 960;
const HEIGHT = 500;

/**
 * Builds a real, low-res (110m) world coastline outline projected onto a
 * flat equirectangular map, plus a lat/lon graticule and a project(lon,lat)
 * helper so callers can place satellite sub-points / ground tracks on it.
 * The topology only needs to be parsed and projected once -- everything
 * here is memoized with no dependencies since the world doesn't move.
 */
export function useWorldProjection() {
  return useMemo(() => {
    const projection = geoEquirectangular().fitSize([WIDTH, HEIGHT], { type: 'Sphere' });
    const pathGen = geoPath(projection);
    const land = feature(worldTopo, worldTopo.objects.land);

    const landPath = pathGen(land);
    const graticulePath = pathGen(geoGraticule().step([30, 30])());
    const outlinePath = pathGen({ type: 'Sphere' });

    const project = (lon, lat) => {
      if (typeof lon !== 'number' || typeof lat !== 'number') return null;
      const p = projection([lon, lat]);
      return p ? { x: p[0], y: p[1] } : null;
    };

    return { width: WIDTH, height: HEIGHT, landPath, graticulePath, outlinePath, project };
  }, []);
}
