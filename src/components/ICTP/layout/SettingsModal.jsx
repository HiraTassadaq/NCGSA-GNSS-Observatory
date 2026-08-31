import { API_BASE_URL } from '../ictp_lib/api';
import "../../../dashboard/Stylesheet/ictp.css";
export default function SettingsModal({ onClose }) {
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000/ws/live';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-panel-raised border border-border rounded-panel shadow-panel p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">Settings</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary text-sm">✕</button>
        </div>
        <dl className="flex flex-col gap-3 text-xs">
          <div>
            <dt className="text-text-muted mb-0.5">API base URL</dt>
            <dd className="font-mono text-text-primary break-all">{API_BASE_URL}</dd>
          </div>
          <div>
            <dt className="text-text-muted mb-0.5">WebSocket URL</dt>
            <dd className="font-mono text-text-primary break-all">{wsUrl}</dd>
          </div>
          <div>
            <dt className="text-text-muted mb-0.5">Configuration</dt>
            <dd className="text-text-muted">
              Set via <code className="font-mono">VITE_API_URL</code> / <code className="font-mono">VITE_WS_URL</code> in the frontend's <code className="font-mono">.env</code> file at build time.
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
