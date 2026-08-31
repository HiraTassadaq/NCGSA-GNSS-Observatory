import * as Cesium from 'cesium';
import { Entity, LabelGraphics, PointGraphics } from 'resium';
import { getConstellationColor } from '../constants/constellations';
import { satelliteToCartesian } from './globeUtils';

export default function SatelliteEntity({ satellite, selected, showLabel, onSelect }) {
  const position = satelliteToCartesian(satellite);
  if (!position) return null;

  const color = Cesium.Color.fromCssColorString(getConstellationColor(satellite.constellation));
  const isVisible = satellite.visible;

  return (
    <Entity
      position={position}
      name={satellite.prn}
      onClick={() => onSelect?.(satellite.prn)}
    >
      <PointGraphics
        pixelSize={selected ? 13 : 8}
        color={isVisible ? color : color.withAlpha(0.35)}
        outlineColor={selected ? Cesium.Color.WHITE : (isVisible ? Cesium.Color.fromCssColorString('#070B14') : color.withAlpha(0.6))}
        outlineWidth={selected ? 3 : 1}
        disableDepthTestDistance={Number.POSITIVE_INFINITY}
      />
      {showLabel && (
        <LabelGraphics
          text={satellite.prn}
          font={selected ? '700 12px "JetBrains Mono", monospace' : '500 10px "JetBrains Mono", monospace'}
          fillColor={selected ? Cesium.Color.WHITE : Cesium.Color.fromCssColorString('#C7D2E0')}
          outlineColor={Cesium.Color.fromCssColorString('#070B14')}
          outlineWidth={3}
          style={Cesium.LabelStyle.FILL_AND_OUTLINE}
          verticalOrigin={Cesium.VerticalOrigin.BOTTOM}
          pixelOffset={new Cesium.Cartesian2(0, -10)}
          disableDepthTestDistance={Number.POSITIVE_INFINITY}
          scaleByDistance={new Cesium.NearFarScalar(1.0e7, 1.0, 6.0e7, 0.55)}
        />
      )}
    </Entity>
  );
}
