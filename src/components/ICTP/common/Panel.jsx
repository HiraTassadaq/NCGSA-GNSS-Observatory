import "../../../dashboard/Stylesheet/ictp.css";export default function Panel({ title, subtitle, actions, className = '', bodyClassName = 'p-4', children }) {
  return (
    <section
      className={`flex flex-col bg-panel border border-border rounded-panel shadow-panel ${className}`}
    >
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border shrink-0">
          <div className="min-w-0">
            {title && (
              <h2 className="text-[11px] font-semibold tracking-[0.08em] text-text-muted uppercase truncate">
                {title}
              </h2>
            )}
            {subtitle && <p className="text-xs text-text-muted mt-0.5 truncate">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}
      <div className={`flex-1 min-h-0 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
