/**
 * Firebase Test Component for White Screen Debugging
 * Evidence: architecture.md Section 4.2 - Firebase integration testing
 */

import { useState, useEffect } from 'react'

function App() {
  const [firebaseStatus, setFirebaseStatus] = useState('Testing...')
  const [error, setError] = useState(null)
  
  useEffect(() => {
    const testFirebase = async () => {
      try {
        console.log('🔥 Testing Firebase imports...')
        
        // Test 1: Check environment variables
        const hasEnvVars = !!(import.meta.env.VITE_FIREBASE_API_KEY)
        console.log('Environment variables available:', hasEnvVars)
        
        if (!hasEnvVars) {
          throw new Error('Firebase environment variables not found')
        }
        
        // Test 2: Try to import Firebase
        console.log('📦 Testing Firebase module imports...')
        const { initializeApp } = await import('firebase/app')
        const { getAuth } = await import('firebase/auth')
        
        console.log('✅ Firebase modules imported successfully')
        
        // Test 3: Try to import firebase config
        console.log('⚙️ Testing Firebase config...')
        const firebaseConfig = await import('../firebase-config.js')
        
        console.log('✅ Firebase config imported successfully')
        console.log('Firebase auth object:', firebaseConfig.auth ? 'Available' : 'Missing')
        
        setFirebaseStatus('✅ Firebase working correctly!')
        
      } catch (err) {
        console.error('❌ Firebase test failed:', err)
        setError(err.message)
        setFirebaseStatus('❌ Firebase failed to load')
      }
    }
    
    testFirebase()
  }, [])
  
  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#ffebee', 
        border: '2px solid #f44336',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h1 style={{ color: '#d32f2f' }}>🚨 Firebase Error Detected</h1>
        <p style={{ color: '#d32f2f', fontWeight: 'bold' }}>{error}</p>
        
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3e0' }}>
          <h3>🔧 Troubleshooting Steps:</h3>
          <ol>
            <li>Check if .env file exists and has VITE_FIREBASE_* variables</li>
            <li>Restart development server to load env changes</li>
            <li>Verify Firebase dependencies are installed</li>
            <li>Check firebase-config.js imports</li>
          </ol>
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
      <h1 style={{ color: '#4CAF50' }}>🔥 Firebase Integration Test</h1>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2>Status: {firebaseStatus}</h2>
        
        <div style={{ marginTop: '15px' }}>
          <h3>Environment Check:</h3>
          <p>🔑 API Key: {import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Present' : '❌ Missing'}</p>
          <p>🏠 Auth Domain: {import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Present' : '❌ Missing'}</p>
          <p>📁 Project ID: {import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Present' : '❌ Missing'}</p>
        </div>
      </div>
      
      {firebaseStatus.includes('✅') && (
        <div style={{ 
          backgroundColor: '#e8f5e8', 
          padding: '15px', 
          borderRadius: '8px',
          border: '2px solid #4CAF50'
        }}>
          <h3>🎉 Firebase is working! Now testing full app...</h3>
          <button 
            onClick={() => {
              // Try to load full app
              import('./App.jsx').then(module => {
                console.log('✅ Full app imported successfully')
                // This would typically cause the white screen if there's an issue
              }).catch(err => {
                console.error('❌ Full app import failed:', err)
                setError('Full app import failed: ' + err.message)
              })
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
            🎯 Load Full App (May cause white screen)
          </button>
        </div>
      )}
    </div>
  )
}

export default App