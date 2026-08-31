import { useMemo } from 'react'
import { useGNSSStore } from './useGNSSStore'
import { filterSatellites, getSatelliteId, isAllConstellationsSelected } from '../ublox_utils/satelliteId'

/** Returns satellites filtered by the global selection (svId and/or constellation). */
export function useFilteredSatellites() {
  const satellites = useGNSSStore((state) => state.satellites)
  const selectedConstellations = useGNSSStore((state) => state.selectedConstellations)
  const selectedSatelliteId = useGNSSStore((state) => state.selectedSatelliteId)

  return useMemo(
    () => filterSatellites(satellites, selectedConstellations, selectedSatelliteId),
    [satellites, selectedConstellations, selectedSatelliteId],
  )
}

/** Constellation-only filter — used by Satellite Selection to list available SVs. */
export function useConstellationFilteredSatellites() {
  const satellites = useGNSSStore((state) => state.satellites)
  const selectedConstellations = useGNSSStore((state) => state.selectedConstellations)

  return useMemo(
    () => filterSatellites(satellites, selectedConstellations, null),
    [satellites, selectedConstellations],
  )
}

/** Returns the currently selected satellite object, or null when no SV is selected. */
export function useSelectedSatellite() {
  const satellites = useGNSSStore((state) => state.satellites)
  const selectedSatelliteId = useGNSSStore((state) => state.selectedSatelliteId)

  return useMemo(
    () => selectedSatelliteId
      ? satellites.find((sat) => getSatelliteId(sat) === selectedSatelliteId) ?? null
      : null,
    [satellites, selectedSatelliteId],
  )
}

/** Whether any global satellite filter is currently active. */
export function useIsSatelliteFilterActive(): boolean {
  const selectedConstellations = useGNSSStore((state) => state.selectedConstellations)
  const selectedSatelliteId = useGNSSStore((state) => state.selectedSatelliteId)
  return (
    selectedSatelliteId !== null ||
    !isAllConstellationsSelected(selectedConstellations)
  )
}
