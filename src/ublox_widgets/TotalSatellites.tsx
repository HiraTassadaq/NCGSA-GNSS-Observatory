import React, { useMemo } from 'react'
import { useGNSSStore } from '../ublox_hooks/useGNSSStore'
import { useFilteredSatellites } from '../ublox_hooks/useFilteredSatellites'
import { SciFiPanel } from '../components/Ublox/SciFiPanel'
import { CONSTELLATION_COLORS } from '../ublox_utils/colors'

const ALL_CONSTELLATIONS = ['GPS', 'GLONASS', 'Galileo', 'BeiDou', 'QZSS', 'NavIC']

export function TotalSatellitesWidget() {
  const satellites = useFilteredSatellites()
  const selectedConstellations = useGNSSStore((state) => state.selectedConstellations)
  const setSelectedConstellations = useGNSSStore((state) => state.setSelectedConstellations)

  const counts = useMemo(() => {
    const c: Record<string, { total: number; visible: number; avg_cno: number }> = {}
    satellites.forEach((sat) => {
      const name = sat.constellation
      if (!c[name]) {
        c[name] = { total: 0, visible: 0, avg_cno: 0 }
      }
      c[name].visible += 1
      if (sat.used_in_fix) c[name].total += 1
      c[name].avg_cno += sat.cno_dbhz || 0
    })
    for (const name of Object.keys(c)) {
      c[name].avg_cno = c[name].visible > 0 ? c[name].avg_cno / c[name].visible : 0
    }
    return c
  }, [satellites])

  const isAllSelected = !selectedConstellations || selectedConstellations.length === 0 || selectedConstellations.includes('All')

  const handleConstellationChange = (name: string) => {
    if (name === 'All') {
      setSelectedConstellations(isAllSelected ? ['All'] : null)
      return
    }

    const current = selectedConstellations && !selectedConstellations.includes('All') ? selectedConstellations : []
    const next = current.includes(name)
      ? current.filter((c) => c !== name)
      : [...current, name]

    if (next.length === 0) {
      setSelectedConstellations(['All'])
    } else {
      setSelectedConstellations(next)
    }
  }

  return (
    <SciFiPanel title="CONSTELLATION STATUS & VISIBILITY" className="h-full">
      <div className="flex flex-col h-full font-mono text-[9px]">
        <div className="flex items-center justify-between px-1 pt-1">
          <div className="flex items-center gap-1">
            <input
              type="checkbox"
              id="sel-all"
              checked={isAllSelected}
              onChange={() => handleConstellationChange('All')}
              className="w-3 h-3 rounded-sm border border-accent/30 bg-black text-accent accent-accent focus:ring-0 focus:outline-none"
            />
            <label htmlFor="sel-all" className="text-[9px] font-bold text-slate-200 cursor-pointer select-none">
              All
            </label>
          </div>
        </div>

        <div className="h-px bg-accent/10 mt-1" />

        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full text-left select-none">
            <thead>
              <tr className="border-b border-accent/15 text-slate-400 text-[8px] uppercase tracking-wider pb-1">
                <th className="pb-1 font-semibold">Sel Constellation</th>
                <th className="pb-1 text-center font-semibold">Active</th>
                <th className="pb-1 text-center font-semibold">Visible</th>
                <th className="pb-1 text-right font-semibold">Avg C/N₀</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accent/5">
              {ALL_CONSTELLATIONS.map((cName) => {
                const data = counts[cName] || { total: 0, visible: 0, avg_cno: 0 }
                const color = CONSTELLATION_COLORS[cName] || '#94a3b8'
                const checked = isAllSelected || (selectedConstellations || []).includes(cName)

                return (
                  <tr key={cName} className={`hover:bg-accent/5 ${checked ? '' : 'opacity-60'}`}>
                    <td className="py-1 flex items-center gap-1">
                      <input
                        type="checkbox"
                        id={`sel-${cName}`}
                        checked={checked}
                        onChange={() => handleConstellationChange(cName)}
                        className="w-3 h-3 rounded-sm border border-accent/30 bg-black text-accent accent-accent focus:ring-0 focus:outline-none"
                      />
                      <span className="w-2 h-2 rounded-sm inline-block flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-slate-200 font-semibold">{cName}</span>
                    </td>
                    <td className="py-1 text-center text-white font-bold text-[11px]">{data.total}</td>
                    <td className="py-1 text-center text-white font-bold text-[11px]">{data.visible}</td>
                    <td className="py-1 text-right text-slate-300">{data.avg_cno > 0 ? `${data.avg_cno.toFixed(1)} dBHz` : '--'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </SciFiPanel>
  )
}
