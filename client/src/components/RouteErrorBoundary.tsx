import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

type RouteErrorBoundaryProps = {
  children: ReactNode;
  routeKey: string;
};

type RouteErrorBoundaryState = {
  error: Error | null;
};

export default class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[route-error]", error, info.componentStack);
  }

  componentDidUpdate(prevProps: RouteErrorBoundaryProps) {
    if (prevProps.routeKey !== this.props.routeKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center px-4 pt-28">
        <div className="max-w-lg rounded-2xl border border-red-500/25 bg-red-500/10 p-6 text-center">
          <AlertTriangle size={34} className="mx-auto text-red-300" />
          <h1 className="mt-4 font-serif text-2xl text-white">Page failed to load</h1>
          <p className="mt-2 text-sm text-red-100/80">{this.state.error.message}</p>
        </div>
      </div>
    );
  }
}
