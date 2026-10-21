import React, { Component } from 'react';

/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays fallback UI
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  getUserFriendlyMessage(error) {
    if (!error) return 'Something went wrong.';

    const msg = error.message || error.toString();

    // Network errors
    if (
      msg.includes('fetch') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('NetworkError') ||
      msg.includes('Failed to fetch')
    ) {
      return 'Cannot reach the WRFCoin backend. Check that all services are running.';
    }

    // Data format errors
    if (
      msg.includes('Cannot read properties') ||
      msg.includes('undefined') ||
      msg.includes('is not a function')
    ) {
      return 'This component received unexpected data. A backend service may need attention.';
    }

    // Generic fallback
    return 'Something went wrong.';
  }

  render() {
    if (this.state.hasError) {
      const friendlyMessage = this.getUserFriendlyMessage(this.state.error);

      // Render fallback UI
      return (
        <div
          className="error-boundary"
          style={{
            padding: 'var(--spacing-lg)',
            margin: 'var(--spacing-lg)',
            background: 'var(--bg-color)',
            border: '1px solid var(--danger-color)',
            borderRadius: 'var(--border-radius-md)',
            color: 'var(--text-color)',
          }}
        >
          <h2 style={{ color: 'var(--danger-color)' }}>{friendlyMessage}</h2>
          <p>We're having trouble rendering this component.</p>
          
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <details
              style={{
                whiteSpace: 'pre-wrap',
                marginTop: 'var(--spacing-md)',
                background: 'rgba(0,0,0,0.05)',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '0.85em',
              }}
            >
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Technical details (for developers)</summary>
              <div style={{ marginTop: '10px', overflowX: 'auto' }}>
                <p><strong>Error:</strong> {this.state.error && this.state.error.toString()}</p>
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </div>
            </details>
          </div>

          <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() =>
                this.setState({ hasError: false, error: null, errorInfo: null })
              }
              style={{
                background: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                borderRadius: 'var(--border-radius-sm)',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            
            <a
              href="/"
              style={{
                color: 'var(--primary-color)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
