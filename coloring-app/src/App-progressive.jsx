/**
 * Progressive App Component for White Screen Debugging
 * Evidence: architecture.md Section 1.1 - Progressive complexity testing
 */

import { useState, useEffect } from 'react'

// STEP 1: Test basic React with inline styles
function App() {
  const [step, setStep] = useState(1)
  const [error, setError] = useState(null)
  
  console.log('🚀 App-progressive rendering, step:', step)
  
  // Error boundary simulation
  useEffect(() => {
    const handleError = (event) => {
      console.error('🚨 Global error caught:', event.error)
      setError(event.error.message)
    }
    
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])
  
  if (error) {
    return (
      <div style={{ padding: '20px', backgroundColor: 'red', color: 'white' }}>
        <h1>🚨 ERROR DETECTED</h1>
        <p>{error}</p>
        <button onClick={() => { setError(null); setStep(1) }}>Reset</button>
      </div>
    )
  }
  
  const testCSS = () => {
    console.log('🎨 Testing CSS import...')
    try {
      // Try to import CSS dynamically
      import('./styles/index.css').then(() => {
        console.log('✅ CSS loaded successfully')
        setStep(3)
      }).catch(err => {
        console.error('❌ CSS loading failed:', err)
        setError('CSS loading failed: ' + err.message)
      })
    } catch (err) {
      console.error('❌ CSS import error:', err)
      setError('CSS import error: ' + err.message)
    }
  }
  
  const testComponents = () => {
    console.log('🧩 Testing component imports...')
    setStep(4)
  }
  
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: step >= 3 ? '' : '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: 'green' }}>🔍 Progressive White Screen Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Current Step: {step}</h2>
        <div style={{ backgroundColor: 'yellow', padding: '10px' }}>
          {step === 1 && (
            <>
              <p>✅ Step 1: Basic React rendering works!</p>
              <button onClick={() => setStep(2)}>Next: Test useState</button>
            </>
          )}
          
          {step === 2 && (
            <>
              <p>✅ Step 2: React hooks work!</p>
              <button onClick={testCSS}>Next: Test CSS Loading</button>
            </>
          )}
          
          {step === 3 && (
            <>
              <p>✅ Step 3: CSS loaded successfully!</p>
              <p className="text-green-500">If this text is green, Tailwind works!</p>
              <button onClick={testComponents}>Next: Test Components</button>
            </>
          )}
          
          {step === 4 && (
            <TestComponents />
          )}
        </div>
      </div>
      
      <div style={{ fontSize: '12px', color: '#666' }}>
        <p>Time: {new Date().toLocaleTimeString()}</p>
        <p>Step {step}/4 complete</p>
      </div>
    </div>
  )
}

// Test individual components
const TestComponents = () => {
  const [componentStep, setComponentStep] = useState(1)
  
  try {
    if (componentStep === 1) {
      return (
        <div>
          <p>✅ Step 4.1: Component rendering works!</p>
          <button onClick={() => setComponentStep(2)}>Test UI Components</button>
        </div>
      )
    }
    
    if (componentStep === 2) {
      // Test basic UI component
      const Button = ({ children, onClick }) => (
        <button 
          onClick={onClick}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#4CAF50', 
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {children}
        </button>
      )
      
      return (
        <div>
          <p>✅ Step 4.2: Custom components work!</p>
          <Button onClick={() => setComponentStep(3)}>Test Complex Components</Button>
        </div>
      )
    }
    
    if (componentStep === 3) {
      return (
        <div>
          <p>✅ Step 4.3: All tests passed!</p>
          <p style={{ color: 'green', fontWeight: 'bold' }}>
            🎉 React app is working correctly. The white screen issue is likely in the complex App.jsx
          </p>
          <TestFullApp />
        </div>
      )
    }
    
  } catch (error) {
    return (
      <div style={{ color: 'red' }}>
        <p>❌ Component test failed: {error.message}</p>
        <button onClick={() => setComponentStep(1)}>Restart Component Test</button>
      </div>
    )
  }
}

const TestFullApp = () => {
  const [showFullApp, setShowFullApp] = useState(false)
  
  if (showFullApp) {
    // Direct import test - this will show us the actual error
    try {
      const { useState, useEffect, useCallback } = React
      
      // Test the exact imports from App.jsx
      console.log('🚀 Testing App.jsx imports...')
      
      // This is a placeholder - the real test is switching to App.jsx directly
      return (
        <div style={{ color: 'orange', padding: '10px', border: '2px solid orange' }}>
          <h3>🔄 Ready to test full App.jsx</h3>
          <p>All components work! Now let's test the actual App.jsx file.</p>
          <p><strong>Next step:</strong> Switch main.jsx to import App.jsx</p>
          <button onClick={() => setShowFullApp(false)}>Back to Tests</button>
        </div>
      )
    } catch (error) {
      return (
        <div style={{ color: 'red', padding: '10px', border: '2px solid red' }}>
          <h3>❌ Import Test Failed</h3>
          <p>Error: {error.message}</p>
          <button onClick={() => setShowFullApp(false)}>Back to Tests</button>
        </div>
      )
    }
  }
  
  return (
    <div>
      <button 
        onClick={() => setShowFullApp(true)}
        style={{ 
          padding: '15px 30px', 
          backgroundColor: '#ff6b6b', 
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        🎯 Test Full App (This might cause white screen)
      </button>
    </div>
  )
}

export default App