import { useState, useEffect, useCallback } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import PromptComponent from './components/PromptComponent'
import AuthComponent from './components/AuthComponent.jsx'
import GalleryComponent from './components/GalleryComponent.jsx'
import Header from './components/Header'
import Navigation from './components/Navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase-config.js'

function App() {
  const [isHighContrast, setIsHighContrast] = useState(false)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [currentView, setCurrentView] = useState('create') // 'create', 'gallery', 'auth'

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setAuthLoading(false)
      
      // Auto-switch to gallery if user just signed in
      if (user && currentView === 'auth') {
        setCurrentView('gallery')
      }
    })

    return () => unsubscribe()
  }, [currentView])

  // Redirect authenticated users from auth view - Evidence: architecture.md Section 3.1 Route Management
  useEffect(() => {
    if (currentView === 'auth' && user) {
      setCurrentView('gallery')
    }
  }, [currentView, user])

  // High contrast effect
  useEffect(() => {
    if (isHighContrast) {
      document.body.classList.add('high-contrast')
    } else {
      document.body.classList.remove('high-contrast')
    }
  }, [isHighContrast])

  // Memoized callbacks to prevent unnecessary re-renders
  const toggleHighContrast = useCallback(() => {
    setIsHighContrast(!isHighContrast)
  }, [isHighContrast])

  const handleViewChange = useCallback((view) => {
    setCurrentView(view)
  }, [])

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <Header
          user={user}
          currentView={currentView}
          onViewChange={handleViewChange}
          isHighContrast={isHighContrast}
          onToggleContrast={toggleHighContrast}
        />

      {/* Main Content */}
      <main className="pt-20 pb-10 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Mobile Navigation */}
          <div className="md:hidden mb-6">
            <Navigation
              currentView={currentView}
              user={user}
              onViewChange={handleViewChange}
              className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1"
              mobile={true}
            />
          </div>

          {/* Loading State */}
          {authLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading...</span>
            </div>
          )}

          {/* Content Views */}
          {!authLoading && (
            <>
              {/* Create View */}
              {currentView === 'create' && (
                <div>
                  <div className="text-center mb-8">
                    <h2 className="text-4xl font-handlee font-bold text-gray-800 mb-4">
                      Create Beautiful Coloring Pages
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                      Transform your ideas into stunning black-and-white line art perfect for coloring. 
                      Just describe what you'd like, customize the details, and let AI create the perfect coloring page for you!
                    </p>
                    {!user && (
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
                        <p className="text-blue-800 text-sm">
                          💡 <strong>Tip:</strong> Sign in to save your generated images to your personal gallery and access them anytime!
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <PromptComponent user={user} />
                </div>
              )}

              {/* Gallery View */}
              {currentView === 'gallery' && user && (
                <div>
                  <div className="text-center mb-8">
                    <h2 className="text-4xl font-handlee font-bold text-gray-800 mb-4">
                      Your Coloring Gallery
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                      Browse through all your generated coloring pages. Click on any image to view it full size, or use the delete options to manage your collection.
                    </p>
                  </div>
                  
                  <GalleryComponent user={user} />
                </div>
              )}

              {/* Auth View */}
              {currentView === 'auth' && !user && (
                <div>
                  <div className="text-center mb-8">
                    <h2 className="text-4xl font-handlee font-bold text-gray-800 mb-4">
                      Join Coloring Book Creator
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                      Create an account to save your generated coloring pages, build your personal gallery, and access your creations from anywhere.
                    </p>
                  </div>
                  
                  <AuthComponent onAuthStateChange={setUser} />
                </div>
              )}

              {/* Redirect authenticated users trying to access auth view - handled in useEffect above */}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            Built with ❤️ for creative minds everywhere
          </p>
        </div>
      </footer>
      </div>
    </ErrorBoundary>
  )
}

export default App
