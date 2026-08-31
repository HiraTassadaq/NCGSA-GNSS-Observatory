import * as Cesium from 'cesium';
import { Entity, PolylineGraphics } from 'resium';
import { getConstellationColor } from '../constants/constellations';
import { satelliteToCartesian, stationToCartesian } from './globeUtils';

export default function LineOfSight({ station, satellite, highlighted }) {
  const stationPos = stationToCartesian(station);
  const satPos = satelliteToCartesian(satellite);
  if (!stationPos || !satPos || !satellite.visible) return null;

  const color = Cesium.Color.fromCssColorString(getConstellationColor(satellite.constellation));

  return (
    <Entity name={`${satellite.prn}-los`}>
      <PolylineGraphics
        positions={[stationPos, satPos]}
        width={highlighted ? 2 : 1}
        material={
          highlighted
            ? color
            : new Cesium.PolylineDashMaterialProperty({ color: color.withAlpha(0.45), dashLength: 12 })
        }
      />
    </Entity>
  );
}
