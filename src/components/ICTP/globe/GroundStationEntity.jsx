import * as Cesium from 'cesium';
import { Entity, LabelGraphics, PointGraphics } from 'resium';
import { stationToCartesian } from './globeUtils';

const STATION_COLOR = '#3EA6FF';
export default function GroundStationEntity({ station, name = 'ICTP/GRAL Islamabad, Pakistan' }) {
  const position = stationToCartesian(station);
  if (!position) return null;

  return (
    <Entity position={position} name={name}>
      <PointGraphics
        pixelSize={12}
        color={Cesium.Color.fromCssColorString(STATION_COLOR)}
        outlineColor={Cesium.Color.WHITE}
        outlineWidth={2}
        disableDepthTestDistance={Number.POSITIVE_INFINITY}
      />
      <LabelGraphics
        text={name}
        font="600 12px Inter, sans-serif"
        fillColor={Cesium.Color.WHITE}
        outlineColor={Cesium.Color.fromCssColorString('#070B14')}
        outlineWidth={3}
        style={Cesium.LabelStyle.FILL_AND_OUTLINE}
        verticalOrigin={Cesium.VerticalOrigin.TOP}
        pixelOffset={new Cesium.Cartesian2(0, 14)}
        disableDepthTestDistance={Number.POSITIVE_INFINITY}
      />
    </Entity>
  );
}
