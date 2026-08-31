import React from 'react'
import { useGNSSStore } from '../ublox_hooks/useGNSSStore'
import { SciFiPanel } from '../components/Ublox/SciFiPanel'

const safe = (val: any, decimals: number = 4, fallback: string = '--') => {
  const n = Number(val)
  return isFinite(n) ? n.toFixed(decimals) : fallback
}

export function PositionWidget() {
  const position = useGNSSStore((state) => state.position)

  const lat = Number(position?.latitude_deg) || 0
  const lon = Number(position?.longitude_deg) || 0
  const alt = Number(position?.altitude_msl_m) || 0
  const spd = Number(position?.speed_kmh) || 0

  const formatCoord = (val: number, isLat: boolean) => {
    const abs = Math.abs(val)
    const deg = Math.floor(abs)
    const min = ((abs - deg) * 60).toFixed(4)
    const dir = isLat ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W')
    return `${deg}° ${min}' ${dir}`
  }

  return (
    <SciFiPanel title="POSITION">
      <div className="flex flex-col gap-3 py-1">
        <div>
           <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-0.5">Latitude</div>
           <div className="text-base font-bold font-mono text-white">{formatCoord(lat, true)}</div>
           <div className="text-[10px] font-mono text-slate-500">{safe(lat, 7)}°</div>
        </div>
        <div>
           <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-0.5">Longitude</div>
           <div className="text-base font-bold font-mono text-white">{formatCoord(lon, false)}</div>
           <div className="text-[10px] font-mono text-slate-500">{safe(lon, 7)}°</div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div>
             <div className="text-[9px] text-slate-500 uppercase tracking-widest">Altitude MSL</div>
            <div className="text-sm font-bold font-mono text-accent text-glow">{safe(alt, 2)} <span className="text-[10px] text-slate-500">m</span></div>
          </div>
          <div>
             <div className="text-[9px] text-slate-500 uppercase tracking-widest">Speed</div>
            <div className="text-sm font-bold font-mono text-accent text-glow">{safe(spd, 1)} <span className="text-[10px] text-slate-500">km/h</span></div>
          </div>
        </div>
      </div>
    </SciFiPanel>
  )
}
