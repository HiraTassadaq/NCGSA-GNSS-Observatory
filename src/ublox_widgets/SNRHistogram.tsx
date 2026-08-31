import React, { useMemo } from 'react'
import { useFilteredSatellites } from '../ublox_hooks/useFilteredSatellites'
import { SciFiPanel } from '../components/Ublox/SciFiPanel'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { CONSTELLATION_COLORS } from '../ublox_utils/colors'

const CONSTELLATION_ORDER = ['GPS', 'GLONASS', 'Galileo', 'BeiDou', 'QZSS'] as const

export function SNRHistogramWidget() {
  const satellites = useFilteredSatellites()

  const chartData = useMemo(() => {
    return satellites
      .sort((a, b) => {
        const ao = CONSTELLATION_ORDER.indexOf(a.constellation as any)
        const bo = CONSTELLATION_ORDER.indexOf(b.constellation as any)
        if (ao !== bo) return (ao === -1 ? 99 : ao) - (bo === -1 ? 99 : bo)
        return a.sv_id - b.sv_id
      })
      .map(sat => ({
        svId: `${sat.constellation[0]}${sat.sv_id}`,
        constellation: sat.constellation,
        cno: sat.cno_dbhz,
        color: CONSTELLATION_COLORS[sat.constellation] || '#00f0ff',
      }))
  }, [satellites])

  return (
    <SciFiPanel title="SIGNAL STRENGTH (C/N₀)" className="h-full">
      <div className="flex flex-col h-full">
        <div className="w-full flex-1 min-h-0">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} margin={{ top: 8, right: 15, left: -10, bottom: 0 }}>
                 <XAxis
                   dataKey="svId"
                   tick={{ fill: '#94a3b8', fontSize: 8.5, fontFamily: 'monospace' }}
                   axisLine={false}
                   tickLine={false}
                   angle={-30}
                   textAnchor="end"
                   height={24}
                 />
                 <YAxis
                   domain={[0, 50]}
                   ticks={[0, 15, 30, 45]}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                   axisLine={false}
                   tickLine={false}
                   allowDecimals={false}
                      label={{ value: 'dB-Hz', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 9, fontFamily: 'monospace', offset: 10 }}
                 />
                <Tooltip
                  cursor={{ fill: '#13223f' }}
                   contentStyle={{ backgroundColor: '#0a1120', borderColor: '#00f0ff', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#ffffff' }}
                  formatter={(val: any) => [`${Number(val).toFixed(1)} dB-Hz`, 'SNR']}
                  labelFormatter={(label: any) => `Satellite ${label}`}
                />
                <Bar dataKey="cno" radius={[2, 2, 0, 0]}>
                  {chartData.map((entry) => (
                      <Cell key={`cell-${entry.svId}`} fill={entry.color} opacity={0.85} />
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

        <div className="flex flex-wrap gap-3 text-[9px] text-slate-300 font-medium mt-2">
          {CONSTELLATION_ORDER.map((name) => (
            <span key={name} className="flex items-center gap-1.5">
              <span className="w-2 h-0.5 inline-block" style={{ backgroundColor: CONSTELLATION_COLORS[name] }} />
              {name}
            </span>
          ))}
        </div>
      </div>
    </SciFiPanel>
  )
}
