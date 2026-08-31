import React, { useRef, useEffect, useState } from 'react'
import { useGNSSStore } from '../ublox_hooks/useGNSSStore'
import { SciFiPanel } from '../components/Ublox/SciFiPanel'

export function DeviationMapWidget() {
  const position = useGNSSStore((state) => state.position)
  const receiver = useGNSSStore((state) => state.receiver)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Keep history of coordinates relative to running mean or first coordinate
  const [history, setHistory] = useState<{ x: number; y: number }[]>([])
  const [refCoord, setRefCoord] = useState<{ lat: number; lon: number } | null>(null)

  useEffect(() => {
    if (position.latitude_deg === 0 && position.longitude_deg === 0) return

    // Set first valid coordinate as reference
    if (!refCoord) {
      setRefCoord({ lat: position.latitude_deg, lon: position.longitude_deg })
      return
    }

    // Convert lat/lon offset to meters
    // 1 deg lat ~= 111111 m
    const dy = (position.latitude_deg - refCoord.lat) * 111111
    const dx = (position.longitude_deg - refCoord.lon) * 111111 * Math.cos((refCoord.lat * Math.PI) / 180)

    setHistory((prev) => {
      const next = [...prev, { x: dx, y: dy }]
      // Limit history to last 200 points
      if (next.length > 200) next.shift()
      return next
    })
  }, [position.latitude_deg, position.longitude_deg, refCoord])

  // Clear button helper
  const handleReset = () => {
    setHistory([])
    if (position.latitude_deg !== 0) {
      setRefCoord({ lat: position.latitude_deg, lon: position.longitude_deg })
    } else {
      setRefCoord(null)
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw background concentric gradient/heatmap circles (as in the reference image)
    // The image has a blue/indigo center, surrounded by cyan, green, yellow, orange, red bands.
    const maxRadius = Math.min(centerX, centerY) - 20
    const numBands = 8
    
    // Draw concentric color circles
    // From outer to inner: Red -> Orange -> Yellow -> Green -> Cyan -> Blue -> Purple -> Dark Blue
    const colors = [
      'rgba(239, 68, 68, 0.15)',   // Red
      'rgba(249, 115, 22, 0.18)',  // Orange
      'rgba(234, 179, 8, 0.22)',   // Yellow
      'rgba(34, 197, 94, 0.25)',   // Green
      'rgba(6, 182, 212, 0.28)',   // Cyan
      'rgba(59, 130, 246, 0.35)',  // Blue
      'rgba(99, 102, 241, 0.45)',  // Indigo
      'rgba(67, 56, 202, 0.6)'     // Center violet-blue
    ]

    for (let i = 0; i < numBands; i++) {
      const r = maxRadius * ((numBands - i) / numBands)
      ctx.beginPath()
      ctx.arc(centerX, centerY, r, 0, 2 * Math.PI)
      ctx.fillStyle = colors[i]
      ctx.fill()
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Draw Grid lines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)'
    ctx.lineWidth = 1
    // Vertical grid lines
    for (let x = centerX - maxRadius; x <= centerX + maxRadius; x += maxRadius / 4) {
      ctx.beginPath()
      ctx.moveTo(x, centerY - maxRadius)
      ctx.lineTo(x, centerY + maxRadius)
      ctx.stroke()
    }
    // Horizontal grid lines
    for (let y = centerY - maxRadius; y <= centerY + maxRadius; y += maxRadius / 4) {
      ctx.beginPath()
      ctx.moveTo(centerX - maxRadius, y)
      ctx.lineTo(centerX + maxRadius, y)
      ctx.stroke()
    }

    // Axes
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(centerX - maxRadius, centerY)
    ctx.lineTo(centerX + maxRadius, centerY)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - maxRadius)
    ctx.lineTo(centerX, centerY + maxRadius)
    ctx.stroke()

    // Determine scale based on RTK status
    // If RTK is fixed, accuracy is cm level (scale +/- 0.1m). Otherwise +/- 2m.
    const isRTK = receiver.rtk_status === 'RTK Fixed'
    const limit = isRTK ? 0.2 : 2.0 // meters
    const scale = maxRadius / limit

    // Labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)'
    ctx.font = '8px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    // X Labels
    ctx.fillText(`-${limit}m`, centerX - maxRadius, centerY + 4)
    ctx.fillText(`0`, centerX, centerY + 4)
    ctx.fillText(`+${limit}m`, centerX + maxRadius, centerY + 4)

    // Y Labels
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillText(`+${limit}m`, centerX - 4, centerY - maxRadius)
    ctx.fillText(`-${limit}m`, centerX - 4, centerY + maxRadius)

    // Plot scatter points
    history.forEach((pt, idx) => {
      // Scale point coordinates
      const px = centerX + pt.x * scale
      const py = centerY - pt.y * scale

      // Check boundary bounds
      if (Math.abs(pt.x * scale) > maxRadius || Math.abs(pt.y * scale) > maxRadius) return

      const isLast = idx === history.length - 1
      ctx.beginPath()
      ctx.arc(px, py, isLast ? 4 : 2, 0, 2 * Math.PI)
      
      if (isLast) {
        ctx.fillStyle = '#00f0ff'
        ctx.shadowColor = '#00f0ff'
        ctx.shadowBlur = 8
      } else {
        // Fade older points
        const alpha = Math.max(0.1, idx / history.length)
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.7})`
        ctx.shadowBlur = 0
      }
      ctx.fill()
    })
    
    // Reset shadow
    ctx.shadowBlur = 0

  }, [history, receiver.rtk_status])

  return (
    <SciFiPanel title="Position Scatter Plot" className="h-full">
      <div className="relative w-full h-full flex flex-col items-center justify-between">
        <div className="flex justify-between items-center w-full mb-1">
            <span className="text-[9px] font-mono text-slate-300 uppercase font-semibold tracking-wide">
            REF: {refCoord ? `${refCoord.lat.toFixed(5)}°, ${refCoord.lon.toFixed(5)}°` : 'WAITING FOR LOCK'}
          </span>
          <button 
            onClick={handleReset}
            className="text-[10px] font-mono border border-accent/30 bg-accent/10 hover:bg-accent/20 text-accent px-2 py-0.5 rounded-sm transition-all font-semibold"
          >
            RESET REF
          </button>
        </div>
        
        <div className="flex items-center justify-center gap-3 flex-1 w-full">
          <div className="relative border border-accent/20 p-1 bg-black/40">
            <canvas ref={canvasRef} width={180} height={180} className="block" />
          </div>
          
          {/* Vertical Color Scale Legend */}
          <div className="flex flex-col items-center h-[180px] justify-between text-[9px] font-mono text-slate-300 py-1 font-medium">
            <div className="w-3 h-[140px] bg-gradient-to-t from-indigo-700 via-green-500 to-red-500 border border-slate-600" />
            <div className="flex flex-col justify-between h-[140px] pl-1.5 select-none font-bold">
              <span>0.5</span>
              <span>0.3</span>
              <span>0.1</span>
              <span>-0.1</span>
              <span>-0.3</span>
              <span>-0.5</span>
            </div>
          </div>
        </div>

        <div className="text-[9px] text-slate-300 text-center font-mono mt-1 w-full flex justify-between px-2 font-medium">
            <span>Deviation: Y Offset</span>
            <span>Poettering Error: X Offset</span>
        </div>
      </div>
    </SciFiPanel>
  )
}
