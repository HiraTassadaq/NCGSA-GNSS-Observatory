const LABEL_TONE = {
  Excellent: 'text-success',
  Good: 'text-success',
  Fair: 'text-warning',
  Poor: 'text-danger',
};

const RING_COLOR = {
  Excellent: 'var(--success)',
  Good: 'var(--success)',
  Fair: 'var(--warning)',
  Poor: 'var(--danger)',
};

// A single blended score (see stationHealthScore in lib/selectors.js for
// exactly what it combines) shown as the leading item in the KPI strip --
// meant to answer "is the station okay?" in one glance, before the person
// reads any individual number.
export default function StationHealth({ health }) {
  if (!health) {
    return (
      <div className="flex flex-col justify-center gap-0.5 px-4 py-2 min-w-[132px]">
        <span className="text-[10px] uppercase tracking-wide text-text-muted">Station Health</span>
        <span className="text-sm font-semibold text-text-muted">Unavailable</span>
      </div>
    );
  }

  const { score, label } = health;
  const circumference = 2 * Math.PI * 15;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="flex items-center gap-2.5 px-4 py-2 min-w-[168px]">
      <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0 -rotate-90">
        <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border)" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          stroke={RING_COLOR[label]}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <div className="flex flex-col justify-center gap-0.5 min-w-0">
        <span className="text-[10px] uppercase tracking-wide text-text-muted whitespace-nowrap">Station Health</span>
        <span className={`text-sm font-bold tabular-nums whitespace-nowrap ${LABEL_TONE[label]}`}>
          {score}% &middot; {label}
        </span>
      </div>
    </div>
  );
}
