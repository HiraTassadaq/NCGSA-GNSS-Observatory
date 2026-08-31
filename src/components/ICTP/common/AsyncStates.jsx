import "../../../dashboard/Stylesheet/ictp.css";
export function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[120px] text-sm text-text-muted gap-2">
      <span className="h-3 w-3 rounded-full border-2 border-border border-t-accent animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({ title, detail }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[120px] text-center gap-1 px-4">
      <p className="text-sm font-medium text-text-primary">{title}</p>
      {detail && <p className="text-xs text-text-muted max-w-sm">{detail}</p>}
    </div>
  );
}

export function ErrorState({ title = 'Unable to load data', detail }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[120px] text-center gap-1 px-4">
      <p className="text-sm font-medium text-danger">{title}</p>
      {detail && <p className="text-xs text-text-muted max-w-sm">{String(detail)}</p>}
    </div>
  );
}
