import React from 'react'
import { useGNSSStore } from '../ublox_hooks/useGNSSStore'
import { SciFiPanel } from '../components/Ublox/SciFiPanel'

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  critical: { color: '#ef4444', bg: '#ef444415', icon: '⚠' },
  warning:  { color: '#f59e0b', bg: '#f59e0b15', icon: '⚡' },
  info:     { color: '#00f0ff', bg: '#00f0ff10', icon: 'ℹ' },
}

export function AlertsWidget() {
  const alerts = useGNSSStore((state) => state.alerts || [])

  return (
    <SciFiPanel title="ALERTS">
      <div className="flex flex-col gap-1 h-40 overflow-hidden">
        {alerts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-[10px] text-slate-500 font-mono">
            No active alerts
          </div>
        ) : (
          [...alerts].reverse().map((alert: any, i) => {
            const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info
            return (
              <div
                key={alert.id || i}
                 className="flex items-start gap-2 px-2 py-1.5 rounded-sm text-[10px] font-mono border-l-2"
                style={{ borderColor: cfg.color, backgroundColor: cfg.bg }}
              >
                <span style={{ color: cfg.color }}>{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-slate-300 truncate block">{alert.message}</span>
                </div>
                <div className="flex-shrink-0 text-slate-600">{alert.time || alert.source}</div>
              </div>
            )
          })
        )}
      </div>
    </SciFiPanel>
  )
}
