export const polarToCanvas = (az, el, cx, cy, maxRadius) => {
  const r = maxRadius * (90 - el) / 90;
  const theta = (az * Math.PI / 180) - (Math.PI / 2);
  return {
    x: cx + r * Math.cos(theta),
    y: cy + r * Math.sin(theta),
    r: r
  };
};
