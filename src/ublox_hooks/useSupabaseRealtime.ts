/**
 * useSupabaseRealtime.ts
 *
 * Subscribes to gnss_live table via Supabase Realtime.
 * All GNSS data arrives through Supabase Realtime — no WebSocket dependency.
 *
 * Architecture: Serial → Backend → Supabase → This hook → Zustand store → Widgets
 *
 * Realtime event fires on every upsert to gnss_live (id=1), ~1 Hz.
 * Parses the full row including satellites_json, constellation_json, and metrics_json.
 */
import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useGNSSStore } from './useGNSSStore'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL_UBLOX || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY_UBLOX || ''
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '')

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 10 } },
})

export function useSupabaseRealtime() {
    const updateState = useGNSSStore((state) => state.updateState)
    const setFrozen = useGNSSStore((state) => state.setFrozen)
    const setReceivedLiveData = useGNSSStore((state) => state.setReceivedLiveData)

     useEffect(() => {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.warn('Supabase URL/Key not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')
            return
        }

        let lastValidTimestamp = Date.now()
        const DATA_TIMEOUT_MS = 5000
        let frozen = false
        let rafId: number | null = null
        let pendingSnapshot: any = null
        let flushTimeout: number | null = null

        const setFrozenState = (f: boolean) => {
          if (frozen !== f) {
            frozen = f
            setFrozen(f)
          }
        }

        const checkDataFreshness = () => {
          if (Date.now() - lastValidTimestamp > DATA_TIMEOUT_MS && !frozen) {
            setFrozenState(true)
            const currentReceiver = useGNSSStore.getState().receiver
            if (currentReceiver.connected) {
              updateState('receiver', {
                ...currentReceiver,
                connected: false,
              })
            }
          }
        }

        const freshnessInterval = setInterval(checkDataFreshness, 1000)

        const alertsInterval = setInterval(async () => {
          try {
            const res = await fetch(`${BACKEND_URL}/alerts`)
            if (res.ok) {
              const data = await res.json()
              updateState('alerts', data || [])
            }
          } catch (e) {
            // Backend not available yet; skip silently
          }
        }, 2000)

        const flushSnapshot = () => {
          if (!pendingSnapshot) return
          updateState('snapshot', pendingSnapshot)
          pendingSnapshot = null
          rafId = null
          flushTimeout = null
        }

        const scheduleFlush = (snapshot: any) => {
          pendingSnapshot = snapshot
          if (rafId === null && flushTimeout === null) {
            flushTimeout = window.setTimeout(() => {
              flushTimeout = null
              rafId = requestAnimationFrame(flushSnapshot)
            }, 30)
          }
        }

       const handlePayload = (payload: any) => {
            const row = payload.new as Record<string, any>
            if (!row) return

            lastValidTimestamp = Date.now()

            if (!useGNSSStore.getState().hasReceivedLiveData) {
              setReceivedLiveData()
            }

            if (frozen) {
              const hasRealData = (
                (Array.isArray(row.satellites_json) && row.satellites_json.length > 0) ||
                (typeof row.latitude_deg === 'number' && row.latitude_deg !== 0) ||
                (typeof row.longitude_deg === 'number' && row.longitude_deg !== 0) ||
                row.connected === true
              )
              if (!hasRealData) return
              setFrozenState(false)
            }

            const currentReceiver = useGNSSStore.getState().receiver
            if (!currentReceiver.connected) {
              updateState('receiver', {
                ...currentReceiver,
                connected: true,
              })
            }

            const satellites = Array.isArray(row.satellites_json)
              ? row.satellites_json
              : []

            const constellation = typeof row.constellation_json === 'object' && row.constellation_json !== null && Object.keys(row.constellation_json).length > 0
              ? row.constellation_json
              : {}

            const metrics = typeof row.metrics_json === 'object' && row.metrics_json !== null && Object.keys(row.metrics_json).length > 0
              ? row.metrics_json
              : {}

            const rawDop = {
              gdop: row.gdop,
              pdop: row.pdop,
              hdop: row.hdop,
              vdop: row.vdop,
              tdop: row.tdop,
              ndop: row.ndop,
              edop: row.edop,
            }

            const recordTimestamp = row.recorded_at
              ? new Date(row.recorded_at).getTime()
              : Date.now()

            const utcTimeValue = row.utc_time
            const utcTime = utcTimeValue instanceof Date
              ? utcTimeValue.toISOString()
              : typeof utcTimeValue === 'number'
                ? new Date(utcTimeValue).toISOString()
                : typeof utcTimeValue === 'string'
                  ? utcTimeValue
                  : undefined

            const snapshot: any = {
              _recordTimestamp: recordTimestamp,
              receiver: {
                connected:       row.connected ?? false,
                fix_type:        row.fix_type ?? 'No Fix',
                rtk_status:      row.rtk_status ?? 'None',
                utc_time:        utcTime,
                gps_week:        row.gps_week ?? undefined,
                satellites_used: row.satellites_used ?? 0,
                flags:           row.flags ?? 0,
                diff_soln:       row.diff_soln ?? false,
                carr_soln:       row.carr_soln ?? 0,
              },
              position: {
                latitude_deg:         row.latitude_deg ?? 0,
                longitude_deg:        row.longitude_deg ?? 0,
                altitude_msl_m:       row.altitude_msl_m ?? 0,
                altitude_ellipsoid_m: row.altitude_ellipsoid_m ?? 0,
                speed_ms:             row.speed_ms ?? 0,
                speed_kmh:            row.speed_kmh ?? 0,
                heading_deg:          row.heading_deg ?? 0,
                velocity_north_ms:    row.velocity_north_ms ?? 0,
                velocity_east_ms:     row.velocity_east_ms ?? 0,
                velocity_down_ms:     row.velocity_down_ms ?? 0,
                h_acc_m:              row.h_acc_m ?? 0,
                v_acc_m:              row.v_acc_m ?? 0,
                p_acc_m:              row.p_acc_m ?? 0,
                speed_acc_ms:         row.speed_acc_ms ?? 0,
                heading_acc_deg:      row.heading_acc_deg ?? 0,
                gnss_time_of_week_ms: row.gnss_time_of_week_ms ?? 0,
              },
              satellites: satellites,
              dop: rawDop,
              constellation: constellation,
              metrics: metrics,
              nav_status: row.nav_status_json || {},
              clock: row.nav_clock_json || {},
              signals: Array.isArray(row.nav_sig_json) ? row.nav_sig_json : [],
              hardware: row.mon_hw_json || {},
              rf: Array.isArray(row.mon_rf_json) ? row.mon_rf_json : [],
              rawx: Array.isArray(row.rxm_rawx_json) ? row.rxm_rawx_json : [],
            }

            scheduleFlush(snapshot)
        }

       // ── Supabase Realtime subscription ──────────────────────
       const channel = supabase
         .channel('gnss-live-channel')
         .on(
           'postgres_changes',
           {
             event: '*',
             schema: 'public',
             table: 'gnss_live',
             filter: 'id=eq.1',
           },
           (payload: any) => {
             handlePayload(payload)
           }
         )
         .subscribe((status) => {
            console.log('Supabase Realtime status:', status)
         })

        return () => {
          console.log('Cleaning up Supabase Realtime subscription')
          clearInterval(freshnessInterval)
          clearInterval(alertsInterval)
          if (rafId !== null) {
            cancelAnimationFrame(rafId)
          }
          if (flushTimeout !== null) {
            clearTimeout(flushTimeout)
          }
          supabase.removeChannel(channel)
        }
    }, [updateState, setFrozen, setReceivedLiveData])
}
