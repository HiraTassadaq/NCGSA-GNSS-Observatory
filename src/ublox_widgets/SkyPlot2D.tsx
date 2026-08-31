import React from 'react'
import { useGNSSStore } from '../ublox_hooks/useGNSSStore'
import { useFilteredSatellites } from '../ublox_hooks/useFilteredSatellites'
import { SciFiPanel } from '../components/Ublox/SciFiPanel'
import { CONSTELLATION_COLORS } from '../ublox_utils/colors'
import { getSatelliteId } from '../ublox_utils/satelliteId'

export function SkyPlot2DWidget() {
  const satellites = useFilteredSatellites().filter(sat => (sat.elevation_deg || 0) >= 10)
  const hoveredSatelliteId = useGNSSStore((state) => state.hoveredSatelliteId)
  const selectedSatelliteId = useGNSSStore((state) => state.selectedSatelliteId)
  const setHoveredSatellite = useGNSSStore((state) => state.setHoveredSatellite)
  const setSelectedSatelliteId = useGNSSStore((state) => state.setSelectedSatelliteId)

  const getColor = (constellation: string) =>
    CONSTELLATION_COLORS[constellation] || '#94a3b8'

  // SVG dimensions for the sky plot - responsive
  const size = 200
  const center = size / 2
  const radius = (size - 24) / 2

  const elevationCircles = [
    { el: 0, r: radius, label: '0°' },
    { el: 30, r: radius * (2 / 3), label: '30°' },
    { el: 60, r: radius * (1 / 3), label: '60°' },
    { el: 90, r: 0, label: '' },
  ]

  const azimuthLines = Array.from({ length: 12 }, (_, i) => i * 30)

  // Degree labels around the rim
  const degreeLabels = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]

  return (
    <SciFiPanel title="Skyplot (Mask Angle: 10°)" className="h-full">
      <div className="flex h-full w-full justify-center">
        <div className="flex items-center justify-center w-full h-full p-2">
          <div className="relative aspect-square max-h-full max-w-full flex items-center justify-center">
            <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="overflow-visible select-none">
              {/* Background fill & subtle static cross-lines */}
              <circle cx={center} cy={center} r={radius} fill="rgba(0,240,255,0.03)" />

            {/* Elevation rings */}
            {elevationCircles.map((circle, i) => (
              <g key={`el-${i}`}>
                <circle
                  cx={center} cy={center} r={circle.r}
                  fill="transparent"
                  stroke="rgba(148, 163, 184, 0.15)"
                  strokeWidth="0.8"
                  strokeDasharray={i === 0 ? 'none' : '2 2'}
                />
                {circle.label && (
                   <text x={center + 2} y={center - circle.r + 7} fill="rgba(148,163,184,0.6)" fontSize="7" fontFamily="monospace" fontWeight="500">
                    {circle.label}
                  </text>
                )}
              </g>
            ))}

            {/* Mask angle ring */}
            <circle
              cx={center} cy={center}
              r={radius * (1 - 10 / 90)}
              fill="rgba(239, 68, 68, 0.05)"
              stroke="rgba(239, 68, 68, 0.6)"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
            <text x={center + 2} y={center - radius * (1 - 10 / 90) + 7} fill="rgba(239, 68, 68, 0.9)" fontSize="7" fontFamily="monospace" fontWeight="bold">
              10°
            </text>

            {/* Azimuth lines */}
            {azimuthLines.map((deg, i) => {
              const rad = (deg - 90) * (Math.PI / 180)
              const x2 = center + radius * Math.cos(rad)
              const y2 = center + radius * Math.sin(rad)
              return (
                <line key={`az-${i}`} x1={center} y1={center} x2={x2} y2={y2}
                  stroke="rgba(148, 163, 184, 0.08)" strokeWidth="0.8" />
              )
            })}

             {/* Degree labels around the rim */}
             {degreeLabels.map((deg) => {
               const rad = (deg - 90) * (Math.PI / 180)
               const lx = center + (radius + 10) * Math.cos(rad)
               const ly = center + (radius + 10) * Math.sin(rad)
               return (
                  <text key={`deg-${deg}`} x={lx} y={ly} fill="rgba(148,163,184,0.7)" fontSize="7" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle" fontWeight="500">
                   {deg}°
                 </text>
               )
             })}

            {/* Center crosshair */}
            <line x1={center - 4} y1={center} x2={center + 4} y2={center} stroke="rgba(0,240,255,0.3)" strokeWidth="0.8" />
            <line x1={center} y1={center - 4} x2={center} y2={center + 4} stroke="rgba(0,240,255,0.3)" strokeWidth="0.8" />

             {/* Satellite connector lines to center */}
               {satellites.map((sat) => {
                 const px = center + (radius * sat.sky_x)
                 const py = center - (radius * sat.sky_y)
                 const color = getColor(sat.constellation)
                 const satId = getSatelliteId(sat)
                 return (
                   <line key={`line-${satId}`} x1={center} y1={center} x2={px} y2={py}
                     stroke={`${color}30`} strokeWidth="0.6" />
                 )
               })}

               {/* Satellites */}
               {satellites.map((sat) => {
                const px = center + (radius * sat.sky_x)
                const py = center - (radius * sat.sky_y)
                const color = getColor(sat.constellation)
                const satId = getSatelliteId(sat)
                const isHovered = hoveredSatelliteId === satId
                const isSelected = selectedSatelliteId === satId

                return (
                  <g 
                    key={`sat-${satId}`} 
                    transform={`translate(${px}, ${py})`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredSatellite(satId)}
                    onMouseLeave={() => setHoveredSatellite(null)}
                    onClick={() => setSelectedSatelliteId(isSelected ? null : satId)}
                  >
                  {/* Invisible larger circle to make hover easier to trigger */}
                  <circle cx="0" cy="0" r="10" fill="transparent" />

                  {sat.used_in_fix && (
                    <circle 
                      cx="0" cy="0" r="4" 
                      fill={isHovered || isSelected ? `${color}40` : `${color}15`} 
                      stroke={color} strokeWidth="0.6" strokeDasharray="1 1" 
                    />
                  )}
                  {isSelected && (
                    <circle cx="0" cy="0" r="5" fill="none" stroke={color} strokeWidth="1.2" opacity="0.9" />
                  )}
                  <circle
                    cx="0" cy="0"
                    r={sat.used_in_fix || isHovered || isSelected ? '2.5' : '1.5'}
                    fill={sat.used_in_fix || isHovered || isSelected ? color : 'transparent'}
                    stroke={color}
                    strokeWidth={isHovered || isSelected ? "1.5" : "1"}
                    style={{ filter: sat.used_in_fix || isHovered || isSelected ? `drop-shadow(0 0 ${isHovered || isSelected ? 3 : 1}px ${color})` : 'none' }}
                  />
                  <text 
                    x="5" y="2.5" 
                    fill={isHovered ? "#ffffff" : "#cbd5e1"} 
                     fontSize={isHovered ? "6" : "5.5"} 
                    fontWeight={isHovered ? "bold" : "normal"}
                    fontFamily="monospace" 
                    className="pointer-events-none"
                  >
                    {sat.constellation[0]}{sat.sv_id}
                  </text>
                </g>
              )
            })}
            </svg>

              {/* HTML Tooltips for Hovered Satellites */}
               {satellites.map((sat) => {
                const satId = getSatelliteId(sat)
                const isHovered = hoveredSatelliteId === satId
                if (!isHovered) return null

               const px = center + (radius * sat.sky_x)
               const py = center - (radius * sat.sky_y)
               const color = getColor(sat.constellation)
               const left = (px / size) * 100
               const top = (py / size) * 100
               const isRight = px > center
               const isBottom = py > center

                return (
                  <div 
                    key={`tt-${satId}`}
                    className="absolute z-[100] bg-slate-900/95 border border-slate-700 p-2 rounded shadow-xl pointer-events-none min-w-max"
                   style={{ 
                     left: `${left}%`, 
                     top: `${top}%`,
                     transform: `translate(${isRight ? 'calc(-100% - 10px)' : '10px'}, ${isBottom ? 'calc(-100% - 10px)' : '10px'})`
                   }}
                 >
                   <div className="font-bold mb-1" style={{ color }}>
                     {sat.constellation[0]}{sat.sv_id} ({sat.constellation})
                   </div>
                    <div className="text-[10px] text-slate-300 grid grid-cols-2 gap-x-3 gap-y-0.5">
                     <span className="text-slate-500">Elev:</span>
                     <span className="text-right text-white">{sat.elevation_deg.toFixed(1)}°</span>
                     <span className="text-slate-500">Azim:</span>
                     <span className="text-right text-white">{sat.azimuth_deg.toFixed(1)}°</span>
                     <span className="text-slate-500">SNR:</span>
                     <span className="text-right text-white">{sat.cno_dbhz?.toFixed(1) ?? 'N/A'} dB-Hz</span>
                     <span className="text-slate-500">Status:</span>
                     <span className="text-right text-white">{sat.used_in_fix ? 'Used in Fix' : 'Tracked'}</span>
                   </div>
                 </div>
               )
             })}
          </div>
        </div>
      </div>
    </SciFiPanel>
  )
}
