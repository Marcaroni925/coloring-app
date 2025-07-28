/**
 * Error Boundary Component for White Screen Prevention
 * Evidence: architecture.md Section 1.3 - Error handling and resilience
 */

import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI instead of white screen
      return (
        <div style={{ 
          padding: '20px', 
          fontFamily: 'Arial, sans-serif',
          backgroundColor: '#ffebee',
          border: '2px solid #f44336',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h1 style={{ color: '#d32f2f' }}>🚨 Application Error</h1>
          <div style={{ 
            backgroundColor: '#fff', 
            padding: '15px', 
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            <h3>Error Details:</h3>
            <p style={{ color: '#d32f2f', fontWeight: 'bold' }}>
              {this.state.error && this.state.error.toString()}
            </p>
            
            {this.state.errorInfo && (
              <details style={{ marginTop: '10px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  Stack Trace (Click to expand)
                </summary>
                <pre style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '10px', 
                  overflow: 'auto',
                  fontSize: '12px',
                  marginTop: '10px'
                }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              🔄 Reload Application
            </button>
            
            <button 
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🔄 Try Again
            </button>
          </div>
          
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: '#fff3e0',
            borderRadius: '4px'
          }}>
            <h3>🔧 Troubleshooting Tips:</h3>
            <ul style={{ margin: 0 }}>
              <li>Check browser console for additional error details</li>
              <li>Try clearing browser cache and reloading</li>
              <li>Verify all dependencies are properly installed</li>
              <li>Check if this is a component import or rendering issue</li>
            </ul>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary