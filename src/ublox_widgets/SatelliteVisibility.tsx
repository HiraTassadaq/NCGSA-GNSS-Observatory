import React, { useMemo } from 'react'
import { useFilteredSatellites } from '../ublox_hooks/useFilteredSatellites'
import { SciFiPanel } from '../components/Ublox/SciFiPanel'
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ZAxis } from 'recharts'
import { CONSTELLATION_COLORS } from '../ublox_utils/colors'

export function SatelliteVisibilityWidget() {
  const satellites = useFilteredSatellites()

  const chartData = useMemo(() => {
    return satellites.map(sat => ({
      name: `${sat.constellation[0]}${sat.sv_id}`,
      elevation: sat.elevation_deg,
      azimuth: sat.azimuth_deg,
      cno: sat.cno_dbhz,
      constellation: sat.constellation,
      used: sat.used_in_fix,
      health: sat.signal_health,
    }))
  }, [satellites])

  const constellationColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    satellites.forEach(sat => {
      if (!map[sat.constellation]) {
        map[sat.constellation] = CONSTELLATION_COLORS[sat.constellation] || '#94a3b8'
      }
    })
    return map
  }, [satellites])

  return (
    <SciFiPanel title="Satellite Visibility (Elevation vs Azimuth)" className="h-full">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-end mb-2">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Tracked Satellites</div>
            <div className="text-xl font-bold font-mono text-white text-glow mt-0.5">{satellites.length}</div>
          </div>
          <div className="flex gap-2">
            {Object.entries(constellationColorMap).map(([name, color]) => (
              <div key={name} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }} />
                <span className="text-[9px] font-mono text-slate-300 font-medium">{name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full mt-1 relative" style={{ height: '300px' }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                <XAxis
                  type="number"
                  dataKey="azimuth"
                  name="Azimuth"
                  domain={[0, 360]}
                   tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                   axisLine={false}
                   tickLine={false}
                   label={{ value: 'Azimuth (°)', position: 'bottom', fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                />
                <YAxis
                  type="number"
                  dataKey="elevation"
                  name="Elevation"
                  domain={[0, 90]}
                   tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                   axisLine={false}
                   tickLine={false}
                   label={{ value: 'Elevation (°)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                />
                <ZAxis range={[40, 400]} />
                <Tooltip
                  cursor={{ fill: '#13223f' }}
                   contentStyle={{ backgroundColor: '#0a1120', borderColor: '#00f0ff', color: '#fff', fontSize: '12px' }}
                  formatter={(val: any, name: any) => {
                    if (name === 'Elevation') return [`${val.toFixed(1)}°`, 'Elevation']
                    if (name === 'Azimuth') return [`${val.toFixed(1)}°`, 'Azimuth']
                    return [val, name]
                  }}
                />
                <Scatter data={chartData} fill="#00f0ff">
                  {chartData.map((entry) => (
                    <Cell
                       key={`cell-${entry.constellation}-${entry.name}`}
                      fill={constellationColorMap[entry.constellation] || '#00f0ff'}
                      opacity={entry.used ? 1 : 0.5}
                      stroke={entry.used ? '#ffffff' : 'transparent'}
                      strokeWidth={entry.used ? 1 : 0}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
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