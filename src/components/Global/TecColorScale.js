// Color ramp approximating the GDGPS NRTGIM ionospheric-delay palette:
// near-black/blue at 0, through blue -> cyan -> green -> yellow -> orange -> red -> dark red at max.
const STOPS = [
  { v: 0.0, c: [10, 10, 40] },     // near-black navy
  { v: 0.10, c: [20, 30, 120] },   // deep blue
  { v: 0.22, c: [30, 90, 200] },   // blue
  { v: 0.36, c: [0, 170, 210] },   // cyan
  { v: 0.50, c: [0, 200, 120] },   // green
  { v: 0.64, c: [170, 220, 40] },  // yellow-green
  { v: 0.76, c: [255, 220, 0] },   // yellow
  { v: 0.86, c: [255, 140, 0] },   // orange
  { v: 0.94, c: [230, 40, 30] },   // red
  { v: 1.0, c: [120, 20, 20] },    // dark red / brown
];

export function tecColor(value, min, max) {
  const t = max > min ? Math.min(Math.max((value - min) / (max - min), 0), 1) : 0;
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i], b = STOPS[i + 1];
    if (t >= a.v && t <= b.v) {
      const localT = (t - a.v) / (b.v - a.v || 1);
      const r = Math.round(a.c[0] + (b.c[0] - a.c[0]) * localT);
      const g = Math.round(a.c[1] + (b.c[1] - a.c[1]) * localT);
      const bl = Math.round(a.c[2] + (b.c[2] - a.c[2]) * localT);
      return `rgb(${r}, ${g}, ${bl})`;
    }
  }
  const last = STOPS[STOPS.length - 1].c;
  return `rgb(${last[0]}, ${last[1]}, ${last[2]})`;
}

export function getTecColor(value, min = 0, max = 60) {
  return tecColor(value, min, max);
}

export function tecColorStopsCss() {
  return STOPS.map(s => `rgb(${s.c[0]}, ${s.c[1]}, ${s.c[2]}) ${(1 - s.v) * 100}%`).join(', ');
}
