import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center" style={{ minHeight: '400px' }}>
          <AlertTriangle size={64} className="text-error mb-4" />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-secondary mb-6 max-w-md">
            {import.meta.env.DEV ? this.state.error?.message : 'An unexpected error occurred while rendering this page.'}
          </p>
          <div className="flex gap-4">
            <button 
              className="btn btn-secondary flex items-center gap-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={16} /> Retry
            </button>
            <button 
              className="btn btn-primary flex items-center gap-2"
              onClick={() => window.location.href = '/dashboard'}
            >
              <Home size={16} /> Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
