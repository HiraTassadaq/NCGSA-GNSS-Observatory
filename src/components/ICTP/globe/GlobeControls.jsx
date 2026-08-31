import { CONSTELLATIONS, getConstellationColor } from '../constants/constellations';

function ToolButton({ active, onClick, children, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`h-7 px-2.5 rounded-md text-[11px] font-medium border transition-colors ${
        active
          ? 'bg-accent/15 border-accent/40 text-accent'
          : 'bg-white/5 border-border text-text-muted hover:text-text-primary hover:border-white/20'
      }`}
    >
      {children}
    </button>
  );
}

export default function GlobeControls({
  visibleConstellations,
  onToggleConstellation,
  showOrbits,
  onToggleOrbits,
  showLabels,
  onToggleLabels,
  showLineOfSight,
  onToggleLineOfSight,
  minElevation,
  onMinElevationChange,
  onResetCamera,
  isFullscreen,
  onToggleFullscreen,
}) {
  return (
    <div className="flex flex-col gap-2 px-3 py-2 border-b border-border bg-panel/60 shrink-0">
      <div className="flex flex-wrap items-center gap-1.5">
        {CONSTELLATIONS.map((sys) => {
          const active = visibleConstellations.has(sys);
          return (
            <button
              key={sys}
              type="button"
              onClick={() => onToggleConstellation(sys)}
              className={`h-6 px-2 rounded-md text-[10px] font-semibold tracking-wide border transition-colors ${
                active ? 'text-white' : 'text-text-muted border-border bg-white/5 opacity-50'
              }`}
              style={active ? { background: `${getConstellationColor(sys)}26`, borderColor: `${getConstellationColor(sys)}66`, color: getConstellationColor(sys) } : undefined}
            >
              {sys}
            </button>
          );
        })}

        <span className="w-px h-5 bg-border mx-1" />

        <ToolButton active={showOrbits} onClick={onToggleOrbits} title="Toggle orbit trails">Orbits</ToolButton>
        <ToolButton active={showLabels} onClick={onToggleLabels} title="Toggle PRN labels">Labels</ToolButton>
        <ToolButton active={showLineOfSight} onClick={onToggleLineOfSight} title="Toggle line-of-sight links">LOS</ToolButton>

        <span className="w-px h-5 bg-border mx-1" />

        <label className="flex items-center gap-1.5 text-[11px] text-text-muted">
          Mask
          <input
            type="number"
            min={-10}
            max={45}
            step={1}
            value={minElevation}
            onChange={(e) => onMinElevationChange(Number(e.target.value))}
            className="w-12 h-6 bg-white/5 border border-border rounded px-1 text-text-primary text-[11px] tabular-nums"
          />
          &deg;
        </label>

        <span className="flex-1" />

        <ToolButton onClick={onResetCamera} title="Reset camera">⟲ Reset</ToolButton>
        <ToolButton active={isFullscreen} onClick={onToggleFullscreen} title="Fullscreen">
          {isFullscreen ? 'Exit FS' : 'Fullscreen'}
        </ToolButton>
      </div>
    </div>
  );
}
