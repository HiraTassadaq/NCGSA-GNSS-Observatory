import React, { useEffect, useRef, useState } from "react";

export default function AnalysisChartsMenu({ options, enabled, onToggle }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          fontSize: 11,
          fontFamily: "var(--font-ui)",
          fontWeight: 700,
          letterSpacing: "0.04em",
          padding: "8px 16px",
          borderRadius: 20,
          border: `1px solid ${open ? "var(--accent-cyan)" : "var(--border-hairline)"}`,
          background: open ? "rgba(78, 203, 255, 0.08)" : "rgba(78, 203, 255, 0.03)",
          boxShadow: open ? "0 0 14px rgba(78, 203, 255, 0.25)" : "none",
          color: "var(--text-primary)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        Analysis Charts
        <span style={{ fontSize: 9, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            minWidth: 240,
            background: "var(--bg-panel-raised)",
            border: "1px solid var(--border-hairline)",
            borderRadius: 8,
            boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
            padding: 8,
            zIndex: 50,
          }}
        >
          <div style={{ fontSize: 10, color: "var(--text-dim)", padding: "4px 8px", letterSpacing: "0.06em" }}>
            ADD TO DASHBOARD
          </div>
          {options.map((opt) => {
            const isOn = enabled.has(opt.id);
            return (
              <div
                key={opt.id}
                onClick={() => onToggle(opt.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 8px",
                  borderRadius: 5,
                  cursor: "pointer",
                  fontSize: 12,
                  color: "var(--text-primary)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    border: `1px solid ${isOn ? "var(--accent-cyan)" : "var(--border-hairline)"}`,
                    background: isOn ? "var(--accent-cyan)" : "transparent",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    color: "#04121c",
                  }}
                >
                  {isOn ? "✓" : ""}
                </span>
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}