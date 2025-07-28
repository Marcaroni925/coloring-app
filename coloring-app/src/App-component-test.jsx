/**
 * Component Import Test for White Screen Debugging
 * Tests each App.jsx import individually to find the failing component
 */

import { useState, useEffect } from 'react'

function App() {
  const [testStep, setTestStep] = useState(1)
  const [error, setError] = useState(null)
  const [loadedComponents, setLoadedComponents] = useState([])

  const testComponent = async (name, importPath) => {
    try {
      console.log(`🧩 Testing import: ${name} from ${importPath}`)
      const module = await import(importPath)
      console.log(`✅ ${name} imported successfully:`, module.default ? 'Has default export' : 'No default export')
      setLoadedComponents(prev => [...prev, name])
      return { success: true, component: module.default }
    } catch (err) {
      console.error(`❌ ${name} import failed:`, err)
      setError(`${name} import failed: ${err.message}`)
      return { success: false, error: err }
    }
  }

  const runTests = async () => {
    const tests = [
      { name: 'PromptComponent', path: './components/PromptComponent' },
      { name: 'AuthComponent', path: './components/AuthComponent.jsx' },
      { name: 'GalleryComponent', path: './components/GalleryComponent.jsx' },
      { name: 'Header', path: './components/Header' },
      { name: 'Navigation', path: './components/Navigation' },
      { name: 'Firebase Auth', path: 'firebase/auth' },
      { name: 'Firebase Config', path: '../firebase-config.js' }
    ]

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i]
      setTestStep(i + 1)
      
      const result = await testComponent(test.name, test.path)
      if (!result.success) {
        return // Stop on first failure
      }
      
      // Small delay to see progress
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setTestStep(8) // All tests completed
  }

  useEffect(() => {
    runTests()
  }, [])

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#ffebee', 
        border: '3px solid #f44336',
        borderRadius: '8px',
        margin: '20px',
        fontFamily: 'Arial'
      }}>
        <h1 style={{ color: '#d32f2f' }}>🚨 Component Import Error Found!</h1>
        <div style={{ 
          backgroundColor: '#fff', 
          padding: '15px', 
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          <p style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: '16px' }}>
            {error}
          </p>
        </div>
        
        <h3>✅ Successfully Loaded Components:</h3>
        <ul>
          {loadedComponents.map((comp, idx) => (
            <li key={idx} style={{ color: 'green' }}>✅ {comp}</li>
          ))}
        </ul>
        
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3e0' }}>
          <h3>🔧 This is the exact component causing the white screen!</h3>
          <p>The error above shows which import is failing in App.jsx</p>
        </div>
        
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: '15px',
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry Test
        </button>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#4CAF50' }}>🧩 Component Import Testing</h1>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2>Testing Step: {testStep}/7</h2>
        
        <div style={{ marginTop: '15px' }}>
          <h3>Component Loading Progress:</h3>
          {loadedComponents.map((comp, idx) => (
            <p key={idx} style={{ color: 'green', margin: '5px 0' }}>
              ✅ {comp}
            </p>
          ))}
          
          {testStep <= 7 && (
            <p style={{ color: 'orange', margin: '5px 0' }}>
              🔄 Testing component {testStep}/7...
            </p>
          )}
        </div>
      </div>
      
      {testStep === 8 && (
        <div style={{ 
          backgroundColor: '#e8f5e8', 
          padding: '15px', 
          borderRadius: '8px',
          border: '2px solid #4CAF50'
        }}>
          <h3>🎉 All components loaded successfully!</h3>
          <p>The white screen issue is NOT in component imports.</p>
          <p>The issue must be in component rendering or logic.</p>
          
          <button 
            onClick={() => {
              // Load the actual components
              console.log('🚀 Now testing component rendering...')
              setTestStep(9)
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🎯 Test Component Rendering
          </button>
        </div>
      )}
      
      {testStep === 9 && <RenderTest />}
    </div>
  )
}

// Test actual component rendering
const RenderTest = () => {
  const [renderStep, setRenderStep] = useState(1)
  const [renderError, setRenderError] = useState(null)
  
  try {
    if (renderStep === 1) {
      return (
        <div style={{ border: '2px solid blue', padding: '15px', marginTop: '10px' }}>
          <h3>🎨 Render Test Step 1: Basic State</h3>
          <p>✅ Component rendering works</p>
          <button onClick={() => setRenderStep(2)}>Test useState</button>
        </div>
      )
    }
    
    if (renderStep === 2) {
      // Test useState pattern from App.jsx
      const [isHighContrast, setIsHighContrast] = useState(false)
      const [user, setUser] = useState(null)
      
      return (
        <div style={{ border: '2px solid green', padding: '15px', marginTop: '10px' }}>
          <h3>🎨 Render Test Step 2: useState Pattern</h3>
          <p>✅ useState hooks work (isHighContrast: {String(isHighContrast)}, user: {String(user)})</p>
          <button onClick={() => setRenderStep(3)}>Test useEffect</button>
        </div>
      )
    }
    
    if (renderStep === 3) {
      return <UseEffectTest />
    }
    
  } catch (err) {
    return (
      <div style={{ border: '2px solid red', padding: '15px', marginTop: '10px' }}>
        <h3>❌ Render Test Failed</h3>
        <p>Error: {err.message}</p>
      </div>
    )
  }
}

const UseEffectTest = () => {
  const [effectTest, setEffectTest] = useState('testing...')
  
  useEffect(() => {
    // Test the useEffect patterns from App.jsx
    console.log('🔄 Testing useEffect...')
    setEffectTest('✅ useEffect works!')
  }, [])
  
  return (
    <div style={{ border: '2px solid purple', padding: '15px', marginTop: '10px' }}>
      <h3>🎨 Render Test Step 3: useEffect Pattern</h3>
      <p>{effectTest}</p>
      <p><strong>Result:</strong> All basic React patterns work!</p>
      <p><strong>Conclusion:</strong> The white screen is in complex component interactions or Firebase calls.</p>
    </div>
  )
}

export default App