const TONE_VAR = {
  success: '--success',
  warning: '--warning',
  danger: '--danger',
  accent: '--accent',
  muted: '--text-muted',
};

// A small neon "glass" dot -- a bright specular highlight over a solid tone
// color, wrapped in a layered colored glow, so status reads as a lit
// indicator rather than a plain dot.
function NeonDot({ tone }) {
  const varName = TONE_VAR[tone] || TONE_VAR.muted;
  const color = `var(${varName})`;
  return (
    <span
      className="relative inline-block h-3 w-3 rounded-full shrink-0"
      style={{
        backgroundColor: color,
        backgroundImage:
          'radial-gradient(circle at 32% 30%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.2) 38%, rgba(255,255,255,0) 62%)',
        boxShadow:
          `0 0 3px 1px ${color}, ` +
          `0 0 8px 2px color-mix(in srgb, ${color} 65%, transparent), ` +
          `0 0 14px 4px color-mix(in srgb, ${color} 35%, transparent)`,
      }}
    />
  );
}

// Compact single-line stat. Hover state (and the resulting tooltip) is owned
// by the parent KpiGrid -- this component just reports its own DOM node so
// exactly one small tooltip can be positioned right above whichever card is
// actually under the cursor.
export default function KpiCard({ label, value, unit, tone, statusLabel, onEnter, onLeave }) {
  return (
    <div
      className="flex flex-1 flex-col justify-center gap-0.5 px-2.5 py-2 min-w-[76px] overflow-hidden cursor-default"
      onMouseEnter={(e) => onEnter?.(e.currentTarget)}
      onMouseLeave={() => onLeave?.()}
    >
      <p className="text-[9px] font-medium text-text-muted uppercase tracking-tight truncate" title={label}>{label}</p>
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        <span className="text-base font-semibold text-text-primary tabular-nums leading-none">{value}</span>
        {unit && <span className="text-[10px] text-text-muted">{unit}</span>}
        {statusLabel && <NeonDot tone={tone} />}
      </div>
    </div>
  );
}
