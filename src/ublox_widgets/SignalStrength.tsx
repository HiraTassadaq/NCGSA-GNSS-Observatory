import React, { useMemo } from 'react'
import { useFilteredSatellites } from '../ublox_hooks/useFilteredSatellites'
import { SciFiPanel } from '../components/Ublox/SciFiPanel'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export function SignalStrengthWidget() {
  const satellites = useFilteredSatellites()

  const histogramData = useMemo(() => {
    const bins: Record<string, number> = {}
    const binSize = 5

    satellites.forEach(sat => {
      if (sat.cno_dbhz <= 0) return
      const bin = Math.floor(sat.cno_dbhz / binSize) * binSize
      const key = `${bin}-${bin + binSize}`
      bins[key] = (bins[key] || 0) + 1
    })

    return Object.entries(bins)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([range, count]) => ({ range, count }))
  }, [satellites])

  const avgCno = satellites.length > 0
    ? (satellites.reduce((acc, s) => acc + (s.cno_dbhz > 0 ? s.cno_dbhz : 0), 0) / satellites.length).toFixed(1)
    : '0.0'

  return (
    <SciFiPanel title="SIGNAL STRENGTH (C/N₀)" className="h-full">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-end mb-3">
          <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Tracking</div>
            <div className="text-2xl font-bold font-mono text-white text-glow mt-0.5">{satellites.length} <span className="text-xs text-slate-400 font-medium">sats</span></div>
          </div>
          <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Avg C/N₀</div>
            <div className="text-2xl font-bold font-mono text-accent text-glow mt-0.5">{avgCno} <span className="text-xs text-slate-400 font-medium">dBHz</span></div>
          </div>
        </div>

        <div className="flex-1 w-full mt-2 relative">
          {histogramData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="range"
                  tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'monospace' }}
                  axisLine={false}
                  tickLine={false}
                  angle={-35}
                  textAnchor="end"
                  height={40}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: '#13223f' }}
                  contentStyle={{ backgroundColor: '#0a1120', borderColor: '#00f0ff', color: '#fff', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} satellites`, 'Count']}
                  labelFormatter={(label: any) => `${label} dBHz`}
                />
                <Bar dataKey="count" radius={[2, 2, 0, 0]} fill="#00f0ff" opacity={0.8}>
                  {histogramData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#00f0ff" opacity={0.6 + (entry.count / Math.max(...histogramData.map(d => d.count)) || 1) * 0.4} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 font-mono text-sm">
              Waiting for satellite data...
            </div>
          )}
        </div>
      </div>
    </SciFiPanel>
  )
}
