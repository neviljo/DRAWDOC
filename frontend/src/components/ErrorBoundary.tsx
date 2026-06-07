import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback || (
          <div className="flex-1 flex items-center justify-center bg-surface-950 text-surface-400 text-sm p-4">
            <div className="text-center max-w-md">
              <p className="font-semibold text-surface-300 mb-2">Something went wrong</p>
              <p className="font-mono text-xs text-surface-500 break-all">
                {this.state.error.message}
              </p>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
