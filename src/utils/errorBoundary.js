/**
 * Enhanced Error Boundary for Wrfcoin Frontend
 * Provides comprehensive error handling and recovery
 */

import React from 'react';
import { WrfButton } from '../components/DesignSystem';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Report error to monitoring service if available
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>Something went wrong</h2>
            <p>
              An unexpected error occurred. Please try refreshing the page or
              contact support if the problem persists.
            </p>

            {this.state.retryCount < 3 && (
              <WrfButton
                onClick={this.handleRetry}
                variant="primary"
                sx={{ mr: 1 }}
              >
                Try Again
              </WrfButton>
            )}

            <WrfButton
              onClick={() => window.location.reload()}
              variant="secondary"
            >
              Refresh Page
            </WrfButton>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ marginTop: '20px' }}>
                <summary>Error Details (Development Only)</summary>
                <pre
                  style={{
                    background: '#f5f5f5',
                    padding: '10px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '12px',
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
