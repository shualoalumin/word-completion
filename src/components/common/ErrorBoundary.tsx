import React from 'react';

const isDev = import.meta.env.DEV;

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info);
    // Keep a console trace for preview debugging.
    console.error('[ErrorBoundary] Render error:', error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">
        <div className="max-w-xl mx-6 rounded-xl border border-gray-200 bg-gray-50 p-6">
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-600 mb-4">
            Please reload the page. If this persists, send the error details below.
          </p>
          {isDev && (
            <pre className="text-xs whitespace-pre-wrap break-words rounded-lg bg-white border border-gray-200 p-3 text-gray-800">
              {error.stack || error.message}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
