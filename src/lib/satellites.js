// Septentrio SBF satellite numbering (SVID) -> constellation.
// These ranges follow the standard SBF ICD "Satellite Numbering" table.
// Double-check against your receiver's firmware version if a satellite
// ever shows up as "UNKNOWN" -- ranges have shifted slightly across
// firmware revisions (e.g. SBAS/QZSS boundaries).
export function classifyConstellation(svid) {
  if (svid >= 1 && svid <= 37) return "GPS";
  if (svid >= 38 && svid <= 61) return "GLONASS";
  if (svid >= 71 && svid <= 106) return "Galileo";
  if (svid >= 120 && svid <= 140) return "SBAS";
  if (svid >= 141 && svid <= 180) return "BeiDou";
  if (svid >= 181 && svid <= 187) return "QZSS";
  if (svid >= 191 && svid <= 197) return "IRNSS";
  return "UNKNOWN";
}

export const CONSTELLATION_COLOR = {
  GPS: "var(--gps)",
  GLONASS: "var(--glonass)",
  Galileo: "var(--galileo)",
  BeiDou: "var(--beidou)",
  QZSS: "var(--qzss)",
  SBAS: "var(--sbas)",
  IRNSS: "#66d9c9",
  UNKNOWN: "var(--text-dim)",
};

export const CONSTELLATION_ORDER = [
  "GPS",
  "GLONASS",
  "Galileo",
  "BeiDou",
  "QZSS",
  "SBAS",
];

// Human label for a satellite, e.g. G01, R11, E05, C07, J02, S120
export function satelliteLabel(svid) {
  const c = classifyConstellation(svid);
  const prefix =
    { GPS: "G", GLONASS: "R", Galileo: "E", BeiDou: "C", QZSS: "J", SBAS: "S", IRNSS: "I" }[
      c
    ] || "?";
  if (c === "SBAS") return `${prefix}${svid}`;
  return `${prefix}${String(svid).padStart(2, "0")}`;
}

export function formatAgo(ms) {
  if (ms == null) return "--";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s ago`;
}
