import React from 'react'
import { useGNSSStore } from '../ublox_hooks/useGNSSStore'
import { SciFiPanel } from '../components/Ublox/SciFiPanel'

const safeFixed = (val: any, d: number) => {
  const n = Number(val)
  return isFinite(n) ? n.toFixed(d) : '--'
}

const AccuracyBar = ({ label, value, max, unit, color }: { label: string; value: number; max: number; unit: string; color?: string }) => {
  const v = isFinite(value) ? value : 0
  const pct = Math.min((v / max) * 100, 100)
  const barColor = color || (v < max * 0.3 ? '#22c55e' : v < max * 0.6 ? '#f59e0b' : '#ef4444')

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-baseline">
        <div className="text-[9px] text-slate-500 uppercase tracking-widest">{label}</div>
        <div className="text-sm font-mono font-bold" style={{ color: barColor, textShadow: `0 0 8px ${barColor}` }}>
          {safeFixed(v, 3)} <span className="text-[9px] text-slate-500">{unit}</span>
        </div>
      </div>
      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor, boxShadow: `0 0 6px ${barColor}` }}
        />
      </div>
    </div>
  )
}

export function AccuracyWidget() {
  const position = useGNSSStore((state) => state.position)
  const metrics = useGNSSStore((state) => state.metrics)

  const cep95 = metrics?.cep95_m ?? 0
  const sep95 = metrics?.sep95_m ?? 0
  const hAcc = position?.h_acc_m ?? 0
  const vAcc = position?.v_acc_m ?? 0
  const geoQuality = metrics?.geometry_quality || 'No Fix'

  const geoColor = geoQuality === 'Ideal' || geoQuality === 'Excellent' ? '#22c55e'
    : geoQuality === 'Good' ? '#4ade80'
    : geoQuality === 'Moderate' ? '#f59e0b'
    : geoQuality === 'Poor' ? '#f97316'
    : '#ef4444'

  return (
    <SciFiPanel title="ACCURACY" className="h-full">
      <div className="flex flex-col gap-3 py-1">
        <AccuracyBar label="Horizontal Acc (hAcc)" value={hAcc} max={10} unit="m" />
        <AccuracyBar label="Vertical Acc (vAcc)" value={vAcc} max={15} unit="m" />
        <div className="grid grid-cols-2 gap-3 mt-1 pt-2 border-t border-white/5">
          <div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest">CEP95</div>
            <div className="text-sm font-bold font-mono text-accent text-glow">{safeFixed(cep95, 3)} <span className="text-[9px] text-slate-500">m</span></div>
          </div>
          <div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest">SEP95</div>
            <div className="text-sm font-bold font-mono text-blue-400">{safeFixed(sep95, 3)} <span className="text-[9px] text-slate-500">m</span></div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <div className="text-[9px] text-slate-500 uppercase tracking-widest">Geometry</div>
          <div className="text-[11px] font-bold font-mono uppercase tracking-wide" style={{ color: geoColor }}>
            {geoQuality}
          </div>
        </div>
      </div>
    </SciFiPanel>
  )
}
