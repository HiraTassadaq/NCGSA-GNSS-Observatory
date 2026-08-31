const DOT_TONE = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  muted: 'bg-text-muted',
};
import "../../../dashboard/Stylesheet/ictp.css";
export default function StatusPill({ tone = 'muted', label, pulse = false }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full ${DOT_TONE[tone]} opacity-60 animate-ping`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${DOT_TONE[tone]}`} />
      </span>
      <span className="text-text-primary font-medium">{label}</span>
    </span>
  );
}
