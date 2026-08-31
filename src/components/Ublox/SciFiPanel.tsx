import React from 'react'
import { motion } from 'framer-motion'
import { twMerge } from 'tailwind-merge'

interface SciFiPanelProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  delay?: number
  contentOverflow?: 'hidden' | 'visible'
}

const formatText = (text: string) => {
  if (!text) return text;
  const upper = text.toUpperCase();
  if (!upper.includes('U-BLOX')) return upper;
  
  const parts = upper.split('U-BLOX');
  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {part}
          {i < parts.length - 1 && <span className="lowercase">u-blox</span>}
        </React.Fragment>
      ))}
    </>
  );
};

export function SciFiPanel({ title, subtitle, children, className, delay = 0, contentOverflow = 'hidden' }: SciFiPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={twMerge(
        'relative bg-surface/90 backdrop-blur-sm border border-accent/20 flex flex-col',
        `overflow-${contentOverflow === 'visible' ? 'visible' : 'hidden'}`,
        'shadow-[0_0_15px_rgba(0,240,255,0.05)]',
        className
      )}
      style={{ padding: '6px 8px' }}
    >
      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-accent" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-accent" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-accent" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-accent" />

      {/* Title Header */}
      {(title || subtitle) && (
        <div className="flex-shrink-0 flex items-center justify-between" style={{ marginBottom: '4px' }}>
          <div>
            {title && (
              <h2 className="text-[12px] font-bold tracking-[0.1em] text-accent text-glow">
                {formatText(title)}
              </h2>
            )}
            {subtitle && (
              <div className="text-[9px] text-slate-400 tracking-wider font-medium">
                {formatText(subtitle)}
              </div>
            )}
          </div>
          {(title || subtitle) && (
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-accent/50 rounded-full animate-pulse" />
              <div className="w-1 h-1 bg-accent/50 rounded-full animate-pulse delay-75" />
              <div className="w-1 h-1 bg-accent/50 rounded-full animate-pulse delay-150" />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 relative z-10 min-h-0" style={{ overflow: contentOverflow === 'visible' ? 'visible' : 'hidden' }}>
        {children}
      </div>

      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-20 z-0" />
    </motion.div>
  )
}
