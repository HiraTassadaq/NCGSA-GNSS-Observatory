import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(`[ErrorBoundary${this.props.label ? `: ${this.props.label}` : ""}]`, error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 12, fontSize: 12, color: "var(--status-error)", fontFamily: "var(--font-data)" }}>
          {this.props.label ? `${this.props.label} crashed: ` : "Crashed: "}
          {this.state.error.message || String(this.state.error)}
          <div style={{ color: "var(--text-dim)", marginTop: 6, fontSize: 10 }}>
            Check the browser console for the full stack trace.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}