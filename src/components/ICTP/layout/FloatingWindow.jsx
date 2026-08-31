import { useRef, useState } from 'react';
import "../../../dashboard/Stylesheet/ictp.css";
const MIN_WIDTH = 260;
const MIN_HEIGHT = 180;

/**
 * A lightweight floating "window" -- draggable by its thin top grip bar,
 * resizable from its bottom-right corner, maximizable, and closable. The
 * wrapped panel keeps its own title/header (Panel component), so this only
 * adds the chrome needed to move/resize/close it, not a second title bar.
 */
export default function FloatingWindow({ x, y, width = 420, height = 320, zIndex, onClose, onFocus, children }) {
  const [pos, setPos] = useState({ x, y });
  const [size, setSize] = useState({ width, height });
  const [maximized, setMaximized] = useState(false);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const preMaximizeRef = useRef(null);

  const startDrag = (e) => {
    if (maximized) return;
    onFocus?.();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onDragMove = (e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos({
      x: Math.max(4, dragRef.current.origX + dx),
      y: Math.max(4, dragRef.current.origY + dy),
    });
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const startResize = (e) => {
    if (maximized) return;
    e.stopPropagation();
    onFocus?.();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: size.width, origH: size.height };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onResizeMove = (e) => {
    if (!resizeRef.current) return;
    const dx = e.clientX - resizeRef.current.startX;
    const dy = e.clientY - resizeRef.current.startY;
    setSize({
      width: Math.max(MIN_WIDTH, resizeRef.current.origW + dx),
      height: Math.max(MIN_HEIGHT, resizeRef.current.origH + dy),
    });
  };

  const endResize = () => {
    resizeRef.current = null;
  };

  const toggleMaximize = () => {
    onFocus?.();
    if (!maximized) {
      preMaximizeRef.current = { ...pos, ...size };
      setMaximized(true);
    } else {
      setMaximized(false);
      if (preMaximizeRef.current) {
        setPos({ x: preMaximizeRef.current.x, y: preMaximizeRef.current.y });
        setSize({ width: preMaximizeRef.current.width, height: preMaximizeRef.current.height });
      }
    }
  };

  const style = maximized
    ? { position: 'absolute', inset: 6, zIndex }
    : { position: 'absolute', left: pos.x, top: pos.y, width: size.width, height: size.height, zIndex };

  return (
    <div
      className="flex flex-col bg-panel border border-accent/30 rounded-panel shadow-panel overflow-hidden"
      style={style}
      onMouseDownCapture={onFocus}
    >
      <div
        className="flex items-center justify-between px-2 h-5 bg-panel-raised border-b border-border shrink-0 select-none"
        style={{ cursor: maximized ? 'default' : 'move' }}
        onPointerDown={startDrag}
        onPointerMove={onDragMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onDoubleClick={toggleMaximize}
        title={maximized ? undefined : 'Drag to move \u00b7 double-click to maximize'}
      >
        <span className="text-text-muted text-[10px] tracking-widest">⋯⋯⋯</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={toggleMaximize}
            className="h-4 w-4 flex items-center justify-center rounded-sm text-text-muted hover:text-accent hover:bg-white/10 leading-none text-[11px]"
            title={maximized ? 'Restore' : 'Maximize'}
          >
            {maximized ? '❐' : '□'}
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
            className="h-4 w-4 flex items-center justify-center rounded-sm text-text-muted hover:text-danger hover:bg-white/10 leading-none"
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">{children}</div>

      {!maximized && (
        <div
          className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize"
          onPointerDown={startResize}
          onPointerMove={onResizeMove}
          onPointerUp={endResize}
          onPointerLeave={endResize}
          title="Drag to resize"
        >
          <svg viewBox="0 0 16 16" className="h-full w-full opacity-40">
            <path d="M14 2 L2 14 M14 7 L7 14 M14 12 L12 14" stroke="var(--text-muted)" strokeWidth="1.4" />
          </svg>
        </div>
      )}
    </div>
  );
}
