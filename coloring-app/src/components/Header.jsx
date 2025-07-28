import React, { memo, useMemo } from 'react'
import Navigation from './Navigation'
import UserInfo from './UserInfo'

// Memoized icon components
const CrayonIcon = () => (
  <svg 
    className="w-6 h-6 crayon-icon" 
    fill="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
      stroke="currentColor" 
      strokeWidth="2" 
      fill="none"
    />
  </svg>
)

const ContrastIcon = () => (
  <svg 
    className="w-5 h-5" 
    fill="currentColor" 
    viewBox="0 0 20 20"
    aria-hidden="true"
  >
    <path 
      fillRule="evenodd" 
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" 
      clipRule="evenodd" 
    />
  </svg>
)

const Header = ({ 
  user, 
  currentView, 
  onViewChange, 
  isHighContrast, 
  onToggleContrast 
}) => {
  const contrastButtonConfig = useMemo(() => ({
    className: `flex items-center space-x-2 px-3 py-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
      isHighContrast
        ? 'bg-black text-white border-white'
        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
    }`,
    text: isHighContrast ? 'Normal' : 'High Contrast'
  }), [isHighContrast])

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-20 h-15">
      <div className="flex items-center justify-between px-5 py-3 max-w-6xl mx-auto">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <CrayonIcon />
          <h1 className="text-2xl font-handlee font-bold text-gray-800">
            Coloring Book Creator
          </h1>
        </div>

        {/* Navigation and Controls */}
        <div className="flex items-center space-x-4">
          {/* Desktop Navigation */}
          <Navigation
            currentView={currentView}
            user={user}
            onViewChange={onViewChange}
            className="hidden md:flex items-center space-x-1 bg-gray-100 rounded-lg p-1"
          />

          {/* User Info */}
          <UserInfo 
            user={user} 
            className="hidden sm:flex"
          />

          {/* High Contrast Toggle */}
          <button
            onClick={onToggleContrast}
            className={contrastButtonConfig.className}
            title="Toggle High Contrast Mode"
            aria-label="Toggle high contrast mode"
            aria-pressed={isHighContrast}
          >
            <ContrastIcon />
            <span className="hidden lg:inline text-sm font-medium">
              {contrastButtonConfig.text}
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default memo(Header)