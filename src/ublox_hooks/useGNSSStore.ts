import { create } from 'zustand'

export type FixType = 'No Fix' | 'Dead Reckoning' | '2D Fix' | '3D Fix' | 'GNSS + Dead Reckoning' | 'Time Only'
export type RTKStatus = 'None' | 'RTK Float' | 'RTK Fixed' | 'DGPS' | 'Single'

export interface ReceiverStatus {
  connected: boolean
  fix_type: FixType
  rtk_status: RTKStatus
  utc_time?: string
  gps_week?: number | null
  satellites_used?: number
  flags?: number
  diff_soln?: boolean
  carr_soln?: number
  gnss_time_of_week_ms?: number
}

export interface Position {
  latitude_deg: number
  longitude_deg: number
  altitude_msl_m: number
  altitude_ellipsoid_m: number
  speed_ms: number
  speed_kmh: number
  heading_deg: number
  velocity_north_ms: number
  velocity_east_ms: number
  velocity_down_ms: number
  h_acc_m: number
  v_acc_m: number
  p_acc_m: number
  speed_acc_ms: number
  heading_acc_deg: number
  gnss_time_of_week_ms: number
}

export interface Satellite {
  sv_id: number
  constellation: string
  azimuth_deg: number
  elevation_deg: number
  cno_dbhz: number
  used_in_fix: boolean
  signal_health: string
  sky_x: number
  sky_y: number
  pos_x: number
  pos_y: number
  pos_z: number
}

export interface ConstellationSummary {
  [key: string]: {
    total: number
    used: number
    avg_cno: number
    min_cno: number
    max_cno: number
    avg_elevation: number
    avg_azimuth: number
  }
}

export interface Metrics {
  geometry_quality: string
  hdop_rating: string
  pdop: number
  vdop: number
  gdop: number
  tdop: number
  ndop: number
  edop: number
  cep95_m: number
  sep95_m: number
  h_acc_m: number
  v_acc_m: number
  fix_type: string
  signal_quality: {
    total_sats: number
    used_sats: number
    avg_cno: number
    min_cno: number
    max_cno: number
  }
  constellation_summary: ConstellationSummary
}

interface GNSSState {
  receiver: ReceiverStatus
  position: Position
  satellites: Satellite[]
  dop: any
  alerts: any[]
  hoveredSatelliteId: string | null
  selectedSatelliteId: string | null
  selectedConstellations: string[] | null
  isFrozen: boolean
  hasReceivedLiveData: boolean
  lastRecordTimestamp: number
  nav_status: Record<string, any>
  clock: Record<string, any>
  signals: any[]
  hardware: Record<string, any>
  rf: any[]
  rawx: any[]
  constellation: ConstellationSummary
  metrics: Metrics
  updateState: (slice: string, data: any) => void
  setFrozen: (frozen: boolean) => void
  setHoveredSatellite: (id: string | null) => void
  setSelectedSatelliteId: (id: string | null) => void
  setSelectedConstellations: (constellations: string[] | null) => void
  setReceivedLiveData: () => void
}

export const useGNSSStore = create<GNSSState>((set) => ({
  receiver: { connected: false, fix_type: 'No Fix', rtk_status: 'None' },
  position: { latitude_deg: 0, longitude_deg: 0, altitude_msl_m: 0, altitude_ellipsoid_m: 0, speed_ms: 0, speed_kmh: 0, heading_deg: 0, velocity_north_ms: 0, velocity_east_ms: 0, velocity_down_ms: 0, h_acc_m: 0, v_acc_m: 0, p_acc_m: 0, speed_acc_ms: 0, heading_acc_deg: 0, gnss_time_of_week_ms: 0 },
  satellites: [],
  dop: {},
  alerts: [],
  hoveredSatelliteId: null,
  selectedSatelliteId: null,
  selectedConstellations: null,
  isFrozen: false,
  hasReceivedLiveData: false,
  lastRecordTimestamp: 0,
  nav_status: {},
  clock: {},
  signals: [],
  hardware: {},
  rf: [],
  rawx: [],
  constellation: {},
  metrics: {
    geometry_quality: 'No Fix',
    hdop_rating: 'No Fix',
    pdop: 0,
    vdop: 0,
    gdop: 0,
    tdop: 0,
    ndop: 0,
    edop: 0,
    cep95_m: 0,
    sep95_m: 0,
    h_acc_m: 0,
    v_acc_m: 0,
    fix_type: 'No Fix',
    signal_quality: { total_sats: 0, used_sats: 0, avg_cno: 0, min_cno: 0, max_cno: 0 },
    constellation_summary: {},
  },

  updateState: (slice, data) => set((state) => {
    if (slice === 'snapshot' || slice === 'nav_pvt') {
      const recordTimestamp = data._recordTimestamp ?? 0
      if (recordTimestamp > 0 && recordTimestamp <= state.lastRecordTimestamp) {
        return state
      }

      const nextReceiver = data.receiver
        ? { ...state.receiver, ...data.receiver }
        : state.receiver
      const nextPosition = data.position
        ? { ...state.position, ...data.position }
        : state.position
      const nextSatellites = Array.isArray(data.satellites)
        ? data.satellites
        : state.satellites
      const nextDop = data.dop && typeof data.dop === 'object' && Object.keys(data.dop).length > 0
        ? data.dop
        : state.dop
      const nextConstellation = data.constellation && typeof data.constellation === 'object' && Object.keys(data.constellation).length > 0
        ? data.constellation
        : state.constellation
      const nextMetrics = data.metrics && typeof data.metrics === 'object' && Object.keys(data.metrics).length > 0
        ? data.metrics
        : state.metrics

      return {
        receiver: nextReceiver,
        position: nextPosition,
        satellites: nextSatellites,
        dop: nextDop,
        constellation: nextConstellation,
        metrics: nextMetrics,
        nav_status: data.nav_status && typeof data.nav_status === 'object' && Object.keys(data.nav_status).length > 0
          ? data.nav_status
          : state.nav_status,
        clock: data.clock && typeof data.clock === 'object' && Object.keys(data.clock).length > 0
          ? data.clock
          : state.clock,
        signals: Array.isArray(data.signals) ? data.signals : state.signals,
        hardware: data.hardware && typeof data.hardware === 'object' && Object.keys(data.hardware).length > 0
          ? data.hardware
          : state.hardware,
        rf: Array.isArray(data.rf) ? data.rf : state.rf,
        rawx: Array.isArray(data.rawx) ? data.rawx : state.rawx,
        lastRecordTimestamp: recordTimestamp || state.lastRecordTimestamp,
      }
    }
    if (slice === 'receiver') {
      return {
        receiver: { ...state.receiver, ...data },
      }
    }
    if (slice === 'position') {
      return {
        position: { ...state.position, ...data },
      }
    }
    return { [slice]: data }
  }),

  setFrozen: (frozen) => set({ isFrozen: frozen }),
  setHoveredSatellite: (id) => set({ hoveredSatelliteId: id }),
  setSelectedSatelliteId: (id) => set({ selectedSatelliteId: id }),
  setSelectedConstellations: (constellations) => set({ selectedConstellations: constellations }),
  setReceivedLiveData: () => set({ hasReceivedLiveData: true }),
}))
