const TONE_CLASSES = {
  success: 'bg-success/15 text-success border-success/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  danger: 'bg-danger/15 text-danger border-danger/30',
  accent: 'bg-accent/15 text-accent border-accent/30',
  muted: 'bg-white/5 text-text-muted border-border',
};
import "../../../dashboard/Stylesheet/ictp.css";
export default function Badge({ tone = 'muted', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium leading-4 whitespace-nowrap ${TONE_CLASSES[tone] || TONE_CLASSES.muted} ${className}`}
    >
      {children}
    </span>
  );
}
