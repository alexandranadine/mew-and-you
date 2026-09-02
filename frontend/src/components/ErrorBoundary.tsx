import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Catches render/lifecycle errors anywhere below it so one broken component can't blank the whole app. */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-cream-50 px-6 text-center">
          <span aria-hidden="true" className="text-4xl">
            🙀
          </span>
          <h1 className="font-display text-2xl font-semibold text-mauve-700">
            Something went sideways
          </h1>
          <p className="max-w-sm text-mauve-500">
            We hit an unexpected error. Refreshing usually fixes it — if it
            keeps happening, please check back later.
          </p>
          <button
            type="button"
            onClick={() => window.location.assign("/")}
            className="btn-primary"
          >
            Back to search
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
