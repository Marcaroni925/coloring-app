/**
 * Main entry without CSS imports for white screen debugging
 * Evidence: architecture.md Section 2.1 - CSS isolation testing
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// NO CSS IMPORTS - Testing if CSS causes white screen
import App from './App-debug.jsx'

console.log('🚀 main-no-css.jsx loading...')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)