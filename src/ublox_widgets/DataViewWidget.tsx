import React from 'react'
import { useGNSSStore } from '../ublox_hooks/useGNSSStore'
import { SciFiPanel } from '../components/Ublox/SciFiPanel'

export function DataViewWidget() {
  const position = useGNSSStore((state) => state.position)
  const receiver = useGNSSStore((state) => state.receiver)
  const dop = useGNSSStore((state) => state.dop || {})

  const latVal = position.latitude_deg || 0
  const latStr = `${Math.abs(latVal).toFixed(4)}° ${latVal >= 0 ? 'N' : 'S'}`
  const lonVal = position.longitude_deg || 0
  const lonStr = `${Math.abs(lonVal).toFixed(4)}° ${lonVal >= 0 ? 'E' : 'W'}`
  const heightVal = position.altitude_msl_m != null ? position.altitude_msl_m : '--'
  const heightStr = `${heightVal}${typeof heightVal === 'number' ? ' m' : ''}`

  const gdopVal = dop.gdop != null ? dop.gdop : '--'
  const vdopVal = dop.vdop != null ? dop.vdop : '--'
  const pdopVal = dop.pdop != null ? dop.pdop : '--'
  const hdopVal = dop.hdop != null ? dop.hdop : '--'
  const tdopVal = dop.tdop != null ? dop.tdop : '--'

  return (
   <SciFiPanel
  title="u-blox NAVIGATION SOLUTION"
  className="h-full static-panel"
>
      <div className="grid grid-cols-5 grid-rows-2 border border-accent/15 bg-black/20 text-center divide-x divide-y divide-accent/15 h-full">
        {/* Row 1 */}
        <div className="p-2 flex flex-col justify-center">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider font-medium mb-1">Latitude</span>
          <span className="text-white font-bold text-[11px] tracking-wide">{latStr}</span>
        </div>
        <div className="p-2 flex flex-col justify-center">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider font-medium mb-1">Longitude</span>
          <span className="text-white font-bold text-[11px] tracking-wide">{lonStr}</span>
        </div>
        <div className="p-2 flex flex-col justify-center">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider font-medium mb-1">Height</span>
          <span className="text-white font-bold text-[11px]">{heightStr}</span>
        </div>
        <div className="p-2 flex flex-col justify-center bg-accent/5 col-span-2">
          <span className="text-[9px] text-accent uppercase tracking-wider font-semibold mb-1">Fix Mode</span>
          <span className="text-accent font-extrabold text-[11px] text-glow uppercase tracking-wide">{receiver.fix_type || '--'}</span>
        </div>

        {/* Row 2 */}
        <div className="p-2 flex flex-col justify-center">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider font-medium mb-1">GDOP</span>
          <span className="text-white font-bold text-[11px]">{gdopVal}</span>
        </div>
        <div className="p-2 flex flex-col justify-center">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider font-medium mb-1">PDOP</span>
          <span className="text-white font-bold text-[11px]">{pdopVal}</span>
        </div>
        <div className="p-2 flex flex-col justify-center">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider font-medium mb-1">HDOP</span>
          <span className="text-white font-bold text-[11px]">{hdopVal}</span>
        </div>
        <div className="p-2 flex flex-col justify-center">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider font-medium mb-1">VDOP</span>
          <span className="text-white font-bold text-[11px]">{vdopVal}</span>
        </div>
        <div className="p-2 flex flex-col justify-center">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider font-medium mb-1">TDOP</span>
          <span className="text-white font-bold text-[11px]">{tdopVal}</span>
        </div>
      </div>
    </SciFiPanel>
  )
}
