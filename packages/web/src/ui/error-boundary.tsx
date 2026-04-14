import { Component, type ErrorInfo, type ReactNode } from "react";

export type ErrorBoundaryProps = {
  readonly children: ReactNode;
  readonly fallbackRender: (props: { error: Error; reset: () => void }) => ReactNode;
  readonly onError?: (error: Error, errorInfo: ErrorInfo) => void;
  readonly resetKeys?: ReadonlyArray<unknown>;
};

type ErrorBoundaryState = {
  error: Error | null;
};

function didResetKeysChange(
  prev: ReadonlyArray<unknown> | undefined,
  next: ReadonlyArray<unknown> | undefined,
): boolean {
  if (prev === undefined && next === undefined) {
    return false;
  }
  if (prev === undefined || next === undefined) {
    return true;
  }
  if (prev.length !== next.length) {
    return true;
  }
  return prev.some((key, i) => key !== next[i]);
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  override componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys } = this.props;
    if (this.state.error !== null && didResetKeysChange(prevProps.resetKeys, resetKeys)) {
      this.setState({ error: null });
    }
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    if (this.state.error !== null) {
      return this.props.fallbackRender({ error: this.state.error, reset: this.reset });
    }
    return this.props.children;
  }
}
