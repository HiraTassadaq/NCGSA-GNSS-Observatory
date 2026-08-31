import type { Satellite } from '../ublox_hooks/useGNSSStore'

/** Canonical satellite identifier used across all widgets (e.g. "GPS-12"). */
export function getSatelliteId(sat: Pick<Satellite, 'constellation' | 'sv_id'>): string {
  return `${sat.constellation}-${sat.sv_id}`
}

export function isAllConstellationsSelected(selected: string[] | null): boolean {
  return !selected || selected.length === 0 || selected.includes('All')
}

export function filterSatellites(
  satellites: Satellite[],
  selectedConstellations: string[] | null,
  selectedSatelliteId: string | null,
): Satellite[] {
  if (selectedSatelliteId) {
    return satellites.filter((sat) => getSatelliteId(sat) === selectedSatelliteId)
  }

  if (!isAllConstellationsSelected(selectedConstellations)) {
    const allowed = new Set(selectedConstellations ?? [])
    return satellites.filter((sat) => allowed.has(sat.constellation))
  }

  return satellites
}
