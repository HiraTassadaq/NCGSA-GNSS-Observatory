import React from 'react'
import { useGNSSStore } from '../ublox_hooks/useGNSSStore'
import { useFilteredSatellites } from '../ublox_hooks/useFilteredSatellites'
import { SciFiPanel } from '../components/Ublox/SciFiPanel'
import { CONSTELLATION_COLORS } from '../ublox_utils/colors'
import { getSatelliteId } from '../ublox_utils/satelliteId'

function estimateSatLatLon(
  recLat: number, recLon: number,
  azDeg: number, elDeg: number
): { lat: number; lon: number } {
  const DEG = Math.PI / 180
  const angularDistDeg = (90 - Math.max(0, Math.min(90, elDeg))) * 0.78
  const d = angularDistDeg * DEG
  const lat1 = recLat * DEG
  const lon1 = recLon * DEG
  const az = azDeg * DEG

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) +
    Math.cos(lat1) * Math.sin(d) * Math.cos(az)
  )
  const lon2 = lon1 + Math.atan2(
    Math.sin(az) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
  )

  return { lat: lat2 / DEG, lon: lon2 / DEG }
}

export function WorldPositionViewWidget() {
  const position   = useGNSSStore((state) => state.position)
  const satellites = useFilteredSatellites()
  const hoveredSatelliteId = useGNSSStore((state) => state.hoveredSatelliteId)
  const selectedSatelliteId = useGNSSStore((state) => state.selectedSatelliteId)
  const setHoveredSatellite = useGNSSStore((state) => state.setHoveredSatellite)
  const setSelectedSatelliteId = useGNSSStore((state) => state.setSelectedSatelliteId)

  const getMapCoords = (lat: number, lon: number) => {
    const x = ((lon + 180) / 360) * 100 - 3
    const y = ((90 - lat) / 180) * 100 + 10
    return { x, y }
  }

  const receiverCoords = getMapCoords(position.latitude_deg || 0, position.longitude_deg || 0)
  const hasPosition = position.latitude_deg !== 0 || position.longitude_deg !== 0

  return (
    <SciFiPanel title="MEASURED POSITION" subtitle="NCGSA-IST | u-blox GNSS RECEIVER" className="h-full">
      <div className="relative w-full h-full bg-[#050B14] p-1 flex flex-col font-mono">
        <div className="flex-1 w-full relative overflow-hidden border border-[rgba(0,240,255,0.2)] rounded-sm">
          
          <div 
            className="absolute inset-0 w-full h-full bg-no-repeat"
            style={{ 
              backgroundImage: "url('/world-map.jpg')",
              backgroundSize: "100% 100%",
              backgroundPosition: "center center" 
            }}
          />

          <div className="absolute inset-0 w-full h-full">

            {hasPosition && satellites.map((sat) => {
              if (sat.azimuth_deg == null || sat.elevation_deg == null) return null

              const { lat, lon } = estimateSatLatLon(
                position.latitude_deg, position.longitude_deg,
                sat.azimuth_deg, sat.elevation_deg
              )
              const coords = getMapCoords(lat, lon)
              const color = CONSTELLATION_COLORS[sat.constellation] || '#aaaaaa'
              const satId = getSatelliteId(sat)
              const isHovered = hoveredSatelliteId === satId
              const isSelected = selectedSatelliteId === satId
              
              const baseSize = sat.used_in_fix ? 8 : 6
              const size = isHovered || isSelected ? baseSize + 4 : baseSize
              const opacity = sat.used_in_fix || isHovered || isSelected ? 1 : 0.6

              return (
                  <div
                   key={satId}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ left: `${coords.x}%`, top: `${coords.y}%`, zIndex: isHovered || isSelected ? 50 : 10 }}
                  onMouseEnter={() => setHoveredSatellite(satId)}
                  onMouseLeave={() => setHoveredSatellite(null)}
                  onClick={() => setSelectedSatelliteId(isSelected ? null : satId)}
                >
                  {isSelected && (
                    <div
                      className="absolute rounded-full border-2"
                      style={{
                        width: size + 12, height: size + 12,
                        top: -6, left: -6,
                        borderColor: color,
                        opacity: 0.8,
                      }}
                    />
                  )}
                  {sat.used_in_fix && (
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: size + 8, height: size + 8,
                        top: -(4), left: -(4),
                        border: `1px solid ${color}60`,
                        backgroundColor: `${color}15`,
                      }}
                    />
                  )}
                  <div
                    className="rounded-full transition-all duration-200"
                    style={{
                      width: size, height: size,
                      backgroundColor: color,
                      opacity,
                      boxShadow: `0 0 ${isHovered || sat.used_in_fix ? 8 : 4}px ${color}`,
                    }}
                  />
                  
                   {isHovered && (() => {
                     const isBottomHalf = coords.y > 60
                     
                     const yClass = isBottomHalf ? "bottom-full mb-2" : "top-full mt-2"
                     
                     let xClass = "left-1/2 -translate-x-1/2"
                     if (coords.x > 75) xClass = "right-1/2 -mr-2"
                     else if (coords.x < 25) xClass = "left-1/2 -ml-2"

                     return (
                       <div className={`absolute ${yClass} ${xClass} bg-slate-900/95 border border-slate-700 p-2 rounded shadow-xl min-w-max pointer-events-none z-[100]`}>
                         <div className="font-bold text-white mb-1" style={{ color }}>
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
                   })()}
                </div>
              )
            })}

            {hasPosition && (
              <div 
                className="absolute w-[24px] h-[24px] -ml-[12px] -mt-[12px] flex items-center justify-center pointer-events-none"
                style={{ left: `${receiverCoords.x}%`, top: `${receiverCoords.y}%`, zIndex: 10 }}
              >
                <div className="absolute w-full h-[2px]" style={{ backgroundColor: '#00ff00', opacity: 1, filter: 'drop-shadow(0 0 8px #00ff00)' }} />
                <div className="absolute h-full w-[2px]" style={{ backgroundColor: '#00ff00', opacity: 1, filter: 'drop-shadow(0 0 8px #00ff00)' }} />
                <div className="absolute w-[16px] h-[16px] border-[3px] rounded-full" style={{ borderColor: '#00ff00', backgroundColor: 'rgba(0,255,0,0.28)', boxShadow: '0 0 14px #00ff00' }} />
                <div className="absolute w-[6px] h-[6px] rounded-full" style={{ backgroundColor: '#00ff00', boxShadow: '0 0 8px #00ff00' }} />
              </div>
            )}
          </div>
          
          <div className="absolute bottom-3 left-4 flex flex-col text-[11px] font-mono leading-tight tracking-widest bg-black/50 p-1 rounded backdrop-blur-sm pointer-events-none">
             <span className="text-[#00f0ff]">LATITUDE</span>
             <span className="text-[#00f0ff]">LONGITUDE</span>
          </div>
          <div className="absolute bottom-3 right-4 flex flex-col text-[12px] text-white font-mono leading-tight tracking-wider text-right bg-black/50 p-1 rounded backdrop-blur-sm pointer-events-none">
             <span>{position.latitude_deg ? position.latitude_deg.toFixed(8) : '0.00000000'} °</span>
             <span>{position.longitude_deg ? position.longitude_deg.toFixed(8) : '0.00000000'} °</span>
          </div>

          <div className="absolute top-2 right-2 flex flex-wrap gap-x-2 gap-y-0.5 text-[8px] font-mono bg-black/60 px-1.5 py-1 rounded backdrop-blur-sm pointer-events-none">
            {Object.entries(CONSTELLATION_COLORS).slice(0, 4).map(([name, color]) => (
              <div key={name} className="flex items-center gap-1">
                <div className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: color }} />
                <span style={{ color }}>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SciFiPanel>
  )
}
