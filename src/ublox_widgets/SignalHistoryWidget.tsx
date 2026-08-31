import React, { useEffect, useState, useMemo } from 'react'
import { useFilteredSatellites } from '../ublox_hooks/useFilteredSatellites'
import { useGNSSStore } from '../ublox_hooks/useGNSSStore'
import { SciFiPanel } from '../components/Ublox/SciFiPanel'
import { LineChart, Line, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts'
import { CONSTELLATION_COLORS } from '../ublox_utils/colors'
import { getSatelliteId, isAllConstellationsSelected } from '../ublox_utils/satelliteId'

interface SignalHistoryData {
  time: string
  [key: string]: number | string
}

interface SignalHistoryWidgetProps {
  chartHeight?: number | string
}

const CONSTELLATION_ORDER = ['GPS', 'GLONASS', 'Galileo', 'BeiDou', 'QZSS'] as const

function round(val: number) {
  return Math.round(val * 10) / 10
}

export function SignalHistoryWidget({ chartHeight = '100%' }: SignalHistoryWidgetProps) {
  const satellites = useFilteredSatellites()
  const selectedSatelliteId = useGNSSStore((state) => state.selectedSatelliteId)
  const selectedConstellations = useGNSSStore((state) => state.selectedConstellations)
  const [history, setHistory] = useState<SignalHistoryData[]>([])

  const activeConstellations = useMemo(() => {
    if (selectedSatelliteId && satellites.length === 1) {
      return [satellites[0].constellation]
    }
    if (!isAllConstellationsSelected(selectedConstellations)) {
      return CONSTELLATION_ORDER.filter((name) => (selectedConstellations ?? []).includes(name))
    }
    return [...CONSTELLATION_ORDER]
  }, [selectedSatelliteId, selectedConstellations, satellites])

  const chartLines = useMemo(() => {
    if (selectedSatelliteId && satellites.length === 1) {
      const sat = satellites[0]
      return [{
        key: getSatelliteId(sat),
        label: `${sat.constellation[0]}${sat.sv_id}`,
        color: CONSTELLATION_COLORS[sat.constellation] || '#94a3b8',
      }]
    }
    return activeConstellations.map((name) => ({
      key: name,
      label: name,
      color: CONSTELLATION_COLORS[name],
    }))
  }, [selectedSatelliteId, satellites, activeConstellations])

  const currentValues = useMemo(() => {
    if (selectedSatelliteId && satellites.length === 1) {
      const sat = satellites[0]
      const key = getSatelliteId(sat)
      return { [key]: sat.cno_dbhz > 0 ? round(sat.cno_dbhz) : 0 }
    }

    const sums: Record<string, number> = {}
    const counts: Record<string, number> = {}
    for (const name of activeConstellations) {
      sums[name] = 0
      counts[name] = 0
    }

    satellites.forEach((sat) => {
      const c = sat.constellation
      if (sums[c] !== undefined) {
        sums[c] += sat.cno_dbhz
        counts[c] += 1
      }
    })

    const result: Record<string, number> = {}
    for (const name of activeConstellations) {
      result[name] = counts[name] > 0 ? round(sums[name] / counts[name]) : 0
    }
    return result
  }, [satellites, selectedSatelliteId, activeConstellations])

  useEffect(() => {
    setHistory([])
  }, [selectedSatelliteId, selectedConstellations])

  useEffect(() => {
    const active = Object.values(currentValues).some((val) => val > 0)
    if (!active) return

    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

    setHistory((prev) => {
      const next = [...prev, { time: timeStr, ...currentValues }]
      if (next.length > 20) next.shift()
      return next
    })
  }, [currentValues])

  const sortedSatellites = useMemo(() => {
    return [...satellites].sort((a, b) => b.cno_dbhz - a.cno_dbhz)
  }, [satellites])

  const oldestLabel = history.length > 0 ? history[0].time : ''
  const middleLabel = history.length > 0 ? history[Math.floor(history.length / 2)].time : ''
  const newestLabel = history.length > 0 ? history[history.length - 1].time : ''

  return (
    <SciFiPanel title="Satellite Signal History" className="h-full" contentOverflow="visible">
      <div className="flex flex-col h-full font-mono">
        <div className="flex flex-wrap gap-3 text-[9px] text-slate-300 font-medium mb-2">
          {chartLines.map(({ key, label, color }) => (
            <span key={key} className="flex items-center gap-1.5">
              <span className="w-2 h-0.5 inline-block" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>

        <div className="relative w-full" style={{ height: Math.max(220, typeof chartHeight === 'number' ? chartHeight : 220) }}>
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 0, right: 20, left: 45, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                 <YAxis domain={[0, 60]} ticks={[0, 15, 30, 45, 60]} stroke="#52525b" fontSize={9} tickLine={false} width={40} label={{ value: 'dB-Hz', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 9, fontFamily: 'monospace', offset: -5 }} />
                {chartLines.map(({ key, color }) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-[8px] text-slate-500">WAITING FOR DATA</div>
          )}
        </div>

        <div className="flex justify-between pl-[65px] pr-[25px] text-[9px] text-slate-500 font-mono mt-2">
          <span>{oldestLabel}</span>
          <span>{middleLabel}</span>
          <span>{newestLabel}</span>
        </div>

        <div className="flex-1 overflow-auto min-h-0 mt-2">
           <table className="w-full font-mono text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-accent/20 text-slate-400 uppercase tracking-wider">
                <th className="py-1.5 px-2 text-left font-semibold">SV</th>
                <th className="py-1.5 px-2 text-center font-semibold">Const.</th>
                <th className="py-1.5 px-2 text-right font-semibold">C/N₀</th>
                <th className="py-1.5 px-2 text-right font-semibold">Elev</th>
                <th className="py-1.5 px-2 text-right font-semibold">Azim</th>
                <th className="py-1.5 px-2 text-center font-semibold">Fix</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accent/5">
              {sortedSatellites.map((sat) => {
                const satId = getSatelliteId(sat)
                return (
                  <tr key={satId} className="hover:bg-accent/5">
                     <td className="py-1.5 px-2 font-bold text-[11px]" style={{ color: CONSTELLATION_COLORS[sat.constellation] }}>
                      {sat.constellation[0]}{sat.sv_id}
                    </td>
                    <td className="py-1.5 px-2 text-center text-slate-300">{sat.constellation}</td>
                    <td className="py-1.5 px-2 text-right text-white font-semibold">
                      {sat.cno_dbhz > 0 ? `${sat.cno_dbhz.toFixed(1)} dBHz` : '--'}
                    </td>
                    <td className="py-1.5 px-2 text-right text-slate-300">{sat.elevation_deg.toFixed(1)}°</td>
                    <td className="py-1.5 px-2 text-right text-slate-300">{sat.azimuth_deg.toFixed(1)}°</td>
                    <td className="py-1.5 px-2 text-center">
                      {sat.used_in_fix
                        ? <span className="text-[#22c55e] font-bold text-sm">✓</span>
                        : <span className="text-slate-500 text-sm">✗</span>
                      }
                    </td>
                  </tr>
                )
              })}
              {sortedSatellites.length === 0 && (
                <tr>
                   <td colSpan={6} className="py-4 text-center text-slate-500 text-xs">
                    No satellite data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SciFiPanel>
  )
}
