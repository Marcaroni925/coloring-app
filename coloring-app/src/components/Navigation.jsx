import React, { memo } from 'react'

const Navigation = ({ 
  currentView, 
  user, 
  onViewChange, 
  className = "",
  mobile = false
}) => {
  const getButtonClass = (view, isActive) => {
    const baseClass = mobile 
      ? "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors"
      : "px-3 py-2 rounded-md text-sm font-medium transition-colors"
    const activeClass = "bg-white text-blue-600 shadow-sm"
    const inactiveClass = mobile 
      ? "text-gray-600"
      : "text-gray-600 hover:text-gray-900"
    
    return `${baseClass} ${isActive ? activeClass : inactiveClass}`
  }

  return (
    <nav className={className}>
      <button
        onClick={() => onViewChange('create')}
        className={getButtonClass('create', currentView === 'create')}
      >
        Create
      </button>
      
      {user && (
        <button
          onClick={() => onViewChange('gallery')}
          className={getButtonClass('gallery', currentView === 'gallery')}
        >
          Gallery
        </button>
      )}
      
      {!user && (
        <button
          onClick={() => onViewChange('auth')}
          className={getButtonClass('auth', currentView === 'auth')}
        >
          Sign In
        </button>
      )}
    </nav>
  )
}

export default memo(Navigation)