/**
 * Minimal Debug App for White Screen Investigation
 * Evidence: architecture.md Section 1.1 - Component isolation debugging
 */

function App() {
  console.log('🚀 App-debug component rendering')
  
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh',
      color: '#333'
    }}>
      <h1 style={{ color: 'red', fontSize: '32px' }}>🚨 DEBUG MODE</h1>
      <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
        If you can see this, React is working!
      </p>
      <div style={{ 
        backgroundColor: 'yellow', 
        border: '3px solid red',
        padding: '10px',
        margin: '10px 0'
      }}>
        <p>✅ HTML rendering works</p>
        <p>✅ Inline styles work</p>
        <p>✅ JavaScript is executing</p>
        <p>Current time: {new Date().toLocaleTimeString()}</p>
      </div>
      
      <button 
        onClick={() => alert('Button clicked!')}
        style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '15px 32px',
          fontSize: '16px',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '4px'
        }}
      >
        Test Interaction
      </button>
      
      <div style={{ marginTop: '20px', fontSize: '14px' }}>
        <p>🔧 Debug info:</p>
        <p>• Window location: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
        <p>• User agent: {typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'N/A'}</p>
      </div>
    </div>
  )
}

export default App