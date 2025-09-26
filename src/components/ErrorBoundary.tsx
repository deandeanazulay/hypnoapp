import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { trackError } from '../services/analytics';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log the error to analytics service
    trackError(error, {
      component: 'ErrorBoundary',
      errorInfo: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });

    // Also log to console for development
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-xl rounded-3xl p-8 border border-red-500/30">
              {/* Error Icon */}
              <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} className="text-red-400" />
              </div>

              {/* Error Title */}
              <h1 className="text-white text-2xl font-light mb-4">Something went wrong</h1>
              
              {/* Error Description */}
              <p className="text-white/70 text-sm mb-6 leading-relaxed">
                Libero encountered an unexpected error. Don't worry - your data is safe, and we're working to resolve this.
              </p>

              {/* Error Details for Development */}
              {import.meta.env.DEV && this.state.error && (
                <div className="bg-black/40 rounded-xl p-4 mb-6 text-left border border-white/10">
                  <h3 className="text-red-400 font-medium text-sm mb-2">Error Details (Development Only)</h3>
                  <pre className="text-red-300 text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                    {this.state.error.message}
                    {this.state.error.stack && `\n\nStack:\n${this.state.error.stack}`}
                    {this.state.errorInfo?.componentStack && `\n\nComponent Stack:${this.state.errorInfo.componentStack}`}
                  </pre>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={this.handleReload}
                  className="w-full px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200 flex items-center justify-center space-x-2"
                >
                  <RefreshCw size={16} />
                  <span>Reload App</span>
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="w-full px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-medium hover:bg-white/20 transition-all hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <Home size={16} />
                  <span>Go to Home</span>
                </button>
              </div>

              {/* Support Information */}
              <p className="text-white/50 text-xs mt-6">
                Error logged automatically. If this persists, please contact support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}