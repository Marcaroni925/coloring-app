import { useState } from 'react'

function App() {
  const [message, setMessage] = useState('Hello World!')

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🎨 Coloring Book Creator - Test Mode</h1>
      <p>{message}</p>
      <button 
        onClick={() => setMessage('Button clicked! React is working!')}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#4CAF50', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Test React
      </button>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h3>Debug Info:</h3>
        <p>✅ React is loading</p>
        <p>✅ JavaScript is working</p>
        <p>✅ Vite dev server is running</p>
        <p>Current time: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  )
}

export default App