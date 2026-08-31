import { useEffect, useRef } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: string
  maxHeight?: string
}

export function Modal({ open, onClose, title, children, maxWidth = '1000px', maxHeight = '85vh' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="relative w-full rounded-xl border border-[#1f2937] shadow-2xl flex flex-col"
        style={{
          maxWidth,
          maxHeight,
          backgroundColor: '#0b1016',
          boxShadow: '0 0 40px rgba(0,0,0,0.8), 0 0 20px rgba(0,240,255,0.1)',
          minHeight: '400px',
        }}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1f2937] flex-shrink-0">
          <h2 className="text-xs font-bold tracking-widest text-accent uppercase font-mono">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-[#1f2937] text-slate-400 hover:text-white hover:border-accent/40 hover:bg-accent/10 transition-all duration-200"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="2" y1="2" x2="10" y2="10" />
              <line x1="10" y1="2" x2="2" y2="10" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5 min-h-0 flex flex-col" style={{ minHeight: '350px' }}>
          <div className="flex-1 min-h-0 flex flex-col">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
