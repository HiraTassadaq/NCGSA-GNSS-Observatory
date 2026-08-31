import React from 'react'

export function Card({ children, title, className = '' }: { children: React.ReactNode, title?: string, className?: string }) {
  return (
    <div className={`glass-panel p-4 flex flex-col ${className}`}>
      {title && (
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          {title}
        </h3>
      )}
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
