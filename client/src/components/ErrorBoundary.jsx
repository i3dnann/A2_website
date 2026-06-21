import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error, info) {
    console.error("[ui]", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-lg border border-a2-danger/40 bg-a2-danger/10 p-6">
          <p className="text-sm font-black uppercase tracking-wide text-a2-danger">Page error</p>
          <h1 className="mt-2 text-3xl font-black">This page failed to render.</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">The website caught the error instead of showing a blank page. Reload once after the latest deploy finishes.</p>
          <p className="mt-4 break-all rounded bg-black/35 p-3 text-xs text-white/45">{this.state.error.message}</p>
        </div>
      </main>
    );
  }
}
