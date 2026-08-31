import { geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import worldTopo from "world-atlas/countries-110m.json";

// A flat equirectangular (Plate Carree) world, matching the projection
// used by RxControl's ionospheric delay view: every degree of longitude
// is the same pixel width regardless of latitude, so a 2:1 canvas maps
// the whole globe with no distortion-driven size differences between
// grid cells (unlike Mercator, which was the problem before).
export const WORLD_W = 1000;
export const WORLD_H = 500;

// scale = width / (2*PI) and translate = [w/2, h/2] is the exact formula
// that maps lon -180..180, lat -90..90 onto pixel 0..W, 0..H -- the same
// math as projectLatLon() below, so the coastline and the IGP grid cells
// always line up pixel-for-pixel.
const projection = geoEquirectangular()
  .scale(WORLD_W / (2 * Math.PI))
  .translate([WORLD_W / 2, WORLD_H / 2]);

const pathGenerator = geoPath(projection);

let cachedWorldPath = null;
export function getWorldOutlinePath() {
  if (cachedWorldPath) return cachedWorldPath;
  const world = feature(worldTopo, worldTopo.objects.countries);
  cachedWorldPath = pathGenerator(world);
  return cachedWorldPath;
}

// Manual projection kept in lockstep with the d3 projection above -- used
// to place IGP grid cells so they align with the coastline exactly.
export function projectLatLon(lat, lon) {
  return [((lon + 180) / 360) * WORLD_W, ((90 - lat) / 180) * WORLD_H];
}