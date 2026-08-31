import React, { useMemo } from 'react'
import { useFilteredSatellites } from '../ublox_hooks/useFilteredSatellites'
import { SciFiPanel } from '../components/Ublox/SciFiPanel'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const HEALTH_COLORS: Record<string, string> = {
  Healthy: '#22c55e',
  Degraded: '#f59e0b',
  Unhealthy: '#ef4444',
  Unknown: '#64748b',
}

export function SatelliteHealthWidget() {
  const satellites = useFilteredSatellites()

  const healthySatellites = useMemo(() => {
    return satellites.filter(sat => {
      const health = sat.signal_health || 'Unknown'
      return health === 'Healthy' || health === 'Degraded'
    })
  }, [satellites])

  const healthCounts = useMemo(() => {
    const counts: Record<string, number> = { Healthy: 0, Degraded: 0, Unhealthy: 0, Unknown: 0 }
    healthySatellites.forEach(sat => { counts[sat.signal_health || 'Unknown'] = (counts[sat.signal_health || 'Unknown'] || 0) + 1 })
    return counts
  }, [healthySatellites])

  const chartData = useMemo(() => {
    return healthySatellites
      .map(sat => ({
        name: `${sat.constellation[0]}${sat.sv_id}`,
        cno: sat.cno_dbhz,
        health: sat.signal_health || 'Unknown',
        color: HEALTH_COLORS[sat.signal_health || 'Unknown'],
      }))
      .sort((a, b) => a.cno - b.cno)
  }, [healthySatellites])

  return (
    <SciFiPanel title="Satellite Health Status" className="h-full overflow-visible">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-end mb-1">
          <div className="flex gap-2">
            {Object.entries(healthCounts).map(([status, count]) => (
              <div key={status} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: HEALTH_COLORS[status as keyof typeof HEALTH_COLORS] || '#64748b' }} />
                <span className="text-[8px] font-mono text-slate-400">{status}: <span className="text-white font-bold">{count}</span></span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full flex-1 min-h-0">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                 <XAxis
                   dataKey="name"
                   interval={0}
                   tick={{ fill: '#94a3b8', fontSize: 8.5, fontFamily: 'monospace' }}
                   axisLine={false}
                   tickLine={false}
                   angle={-35}
                   textAnchor="end"
                   height={28}
                 />
                <YAxis
                  domain={[0, 50]}
                  ticks={[0, 10, 20, 30, 40, 50]}
                   tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: '#13223f' }}
                   contentStyle={{ backgroundColor: '#0a1120', borderColor: '#00f0ff', color: '#fff', fontSize: '11px' }}
                   labelStyle={{ color: '#fff', fontFamily: 'monospace' }}
                   itemStyle={{ color: '#fff', fontFamily: 'monospace' }}
                  formatter={(val: any, name: any, props: any) => [`${val.toFixed(1)} dBHz`, props?.payload?.health || 'Health']}
                />
                <Bar dataKey="cno" radius={[2, 2, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 font-mono text-xs">
              Waiting for satellite data...
            </div>
          )}
        </div>
      </div>
    </SciFiPanel>
  )
}