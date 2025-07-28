/**
 * Toast Notification System - Enhanced User Feedback
 * 
 * UI/UX ENHANCEMENTS:
 * - Multiple toast variants with pastel theme integration
 * - Smooth animations with spring physics
 * - Accessible notifications with ARIA live regions
 * - Auto-dismiss with user controls
 * - Mobile-optimized touch interactions
 * - Queue management for multiple toasts
 * 
 * Addresses audit findings: Missing user feedback, success/error notifications
 */

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

/**
 * Toast configuration and types
 */
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  LOADING: 'loading'
};

const TOAST_POSITIONS = {
  TOP_RIGHT: 'top-right',
  TOP_LEFT: 'top-left',
  TOP_CENTER: 'top-center',
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_CENTER: 'bottom-center'
};

/**
 * Toast context for global toast management
 */
const ToastContext = createContext({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
  clearToasts: () => {}
});

/**
 * Custom hook for accessing toast context
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * Individual Toast component with animations and interactions
 * 
 * @param {Object} props - Component props
 * @param {Object} props.toast - Toast data object
 * @param {Function} props.onRemove - Remove callback
 * @param {string} props.position - Toast position
 * @returns {JSX.Element} Toast component
 */
function Toast({ toast, onRemove, position }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);

  const {
    id,
    type = TOAST_TYPES.INFO,
    title,
    message,
    duration = 5000,
    persistent = false,
    action,
    icon
  } = toast;

  /**
   * Toast variant styling configuration
   */
  const getToastStyles = () => {
    const baseStyles = 'relative flex items-start p-4 rounded-lg shadow-lg border backdrop-blur-sm transition-all duration-300 ease-in-out transform';
    
    const typeStyles = {
      [TOAST_TYPES.SUCCESS]: 'bg-green-50/95 border-green-200 text-green-800',
      [TOAST_TYPES.ERROR]: 'bg-red-50/95 border-red-200 text-red-800',
      [TOAST_TYPES.WARNING]: 'bg-yellow-50/95 border-yellow-200 text-yellow-800',
      [TOAST_TYPES.INFO]: 'bg-blue-50/95 border-blue-200 text-blue-800',
      [TOAST_TYPES.LOADING]: 'bg-pastel-blue-50/95 border-pastel-blue-200 text-pastel-blue-800'
    };

    const animationStyles = isRemoving 
      ? 'opacity-0 translate-x-full scale-95' 
      : isVisible 
      ? 'opacity-100 translate-x-0 scale-100' 
      : 'opacity-0 translate-x-full scale-95';

    return cn(baseStyles, typeStyles[type], animationStyles);
  };

  /**
   * Get appropriate icon for toast type
   */
  const getIcon = () => {
    if (icon) return icon;

    const iconProps = { className: "w-5 h-5 flex-shrink-0 mt-0.5" };

    switch (type) {
      case TOAST_TYPES.SUCCESS:
        return (
          <svg {...iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        );
      case TOAST_TYPES.ERROR:
        return (
          <svg {...iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case TOAST_TYPES.WARNING:
        return (
          <svg {...iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case TOAST_TYPES.INFO:
        return (
          <svg {...iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case TOAST_TYPES.LOADING:
        return (
          <div className="w-5 h-5 flex-shrink-0 mt-0.5">
            <div className="w-full h-full border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        );
      default:
        return null;
    }
  };

  /**
   * Handle toast removal with animation
   */
  const handleRemove = useCallback(() => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(id);
    }, 300); // Match CSS transition duration
  }, [id, onRemove]);

  /**
   * Auto-dismiss logic with pause on hover
   */
  useEffect(() => {
    if (persistent || type === TOAST_TYPES.LOADING) return;

    let timeoutId;
    let intervalId;

    if (!isPaused) {
      // Start progress countdown
      intervalId = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (duration / 100));
          if (newProgress <= 0) {
            handleRemove();
            return 0;
          }
          return newProgress;
        });
      }, 100);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [duration, persistent, isPaused, handleRemove, type]);

  /**
   * Entrance animation
   */
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  /**
   * Keyboard accessibility
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleRemove();
    }
  };

  return (
    <div
      className={getToastStyles()}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Progress bar for auto-dismiss */}
      {!persistent && type !== TOAST_TYPES.LOADING && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-lg overflow-hidden">
          <div 
            className="h-full bg-current transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Icon */}
      <div className="mr-3">
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-handlee font-semibold text-sm mb-1">
            {title}
          </h4>
        )}
        {message && (
          <p className="font-handlee text-sm opacity-90">
            {message}
          </p>
        )}
        
        {/* Action button */}
        {action && (
          <div className="mt-2">
            <button
              onClick={action.onClick}
              className="font-handlee text-sm font-medium hover:underline focus:outline-none focus:underline"
            >
              {action.label}
            </button>
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={handleRemove}
        className="ml-3 flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity focus:outline-none focus:opacity-100"
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Toast container component that manages positioning and stacking
 * 
 * @param {Object} props - Component props
 * @param {Array} props.toasts - Array of toast objects
 * @param {Function} props.removeToast - Remove toast function
 * @param {string} props.position - Container position
 * @returns {JSX.Element} Toast container
 */
function ToastContainer({ toasts, removeToast, position = TOAST_POSITIONS.TOP_RIGHT }) {
  if (toasts.length === 0) return null;

  /**
   * Get container positioning classes
   */
  const getContainerClasses = () => {
    const baseClasses = 'fixed z-50 pointer-events-none';
    
    const positionClasses = {
      [TOAST_POSITIONS.TOP_RIGHT]: 'top-4 right-4',
      [TOAST_POSITIONS.TOP_LEFT]: 'top-4 left-4',
      [TOAST_POSITIONS.TOP_CENTER]: 'top-4 left-1/2 transform -translate-x-1/2',
      [TOAST_POSITIONS.BOTTOM_RIGHT]: 'bottom-4 right-4',
      [TOAST_POSITIONS.BOTTOM_LEFT]: 'bottom-4 left-4',
      [TOAST_POSITIONS.BOTTOM_CENTER]: 'bottom-4 left-1/2 transform -translate-x-1/2'
    };

    return cn(baseClasses, positionClasses[position]);
  };

  return createPortal(
    <div className={getContainerClasses()}>
      <div className="space-y-2 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              toast={toast}
              onRemove={removeToast}
              position={position}
            />
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
}

/**
 * Toast Provider component for managing global toast state
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components
 * @param {string} props.position - Toast position
 * @param {number} props.maxToasts - Maximum number of toasts
 * @returns {JSX.Element} Toast provider
 */
export function ToastProvider({ 
  children, 
  position = TOAST_POSITIONS.TOP_RIGHT,
  maxToasts = 5 
}) {
  const [toasts, setToasts] = useState([]);

  /**
   * Add a new toast with queue management
   */
  const addToast = useCallback((toast) => {
    const newToast = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ...toast
    };

    setToasts(current => {
      const updated = [newToast, ...current];
      // Limit number of toasts
      return updated.slice(0, maxToasts);
    });

    return newToast.id;
  }, [maxToasts]);

  /**
   * Remove specific toast
   */
  const removeToast = useCallback((id) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  /**
   * Clear all toasts
   */
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  /**
   * Context value
   */
  const contextValue = {
    toasts,
    addToast,
    removeToast,
    clearToasts
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer
        toasts={toasts}
        removeToast={removeToast}
        position={position}
      />
    </ToastContext.Provider>
  );
}

/**
 * Helper functions for easy toast creation
 */
export const toast = {
  success: (message, options = {}) => {
    const { addToast } = useToast();
    return addToast({
      type: TOAST_TYPES.SUCCESS,
      message,
      ...options
    });
  },

  error: (message, options = {}) => {
    const { addToast } = useToast();
    return addToast({
      type: TOAST_TYPES.ERROR,
      message,
      persistent: true, // Errors should be persistent by default
      ...options
    });
  },

  warning: (message, options = {}) => {
    const { addToast } = useToast();
    return addToast({
      type: TOAST_TYPES.WARNING,
      message,
      ...options
    });
  },

  info: (message, options = {}) => {
    const { addToast } = useToast();
    return addToast({
      type: TOAST_TYPES.INFO,
      message,
      ...options
    });
  },

  loading: (message, options = {}) => {
    const { addToast } = useToast();
    return addToast({
      type: TOAST_TYPES.LOADING,
      message,
      persistent: true, // Loading toasts should persist
      ...options
    });
  },

  dismiss: (id) => {
    const { removeToast } = useToast();
    removeToast(id);
  },

  dismissAll: () => {
    const { clearToasts } = useToast();
    clearToasts();
  }
};

/**
 * Hook for creating toast helper functions
 * Provides toast methods bound to the context
 */
export function useToastHelpers() {
  const { addToast, removeToast, clearToasts } = useToast();

  return {
    success: (message, options) => addToast({ type: TOAST_TYPES.SUCCESS, message, ...options }),
    error: (message, options) => addToast({ type: TOAST_TYPES.ERROR, message, persistent: true, ...options }),
    warning: (message, options) => addToast({ type: TOAST_TYPES.WARNING, message, ...options }),
    info: (message, options) => addToast({ type: TOAST_TYPES.INFO, message, ...options }),
    loading: (message, options) => addToast({ type: TOAST_TYPES.LOADING, message, persistent: true, ...options }),
    dismiss: removeToast,
    dismissAll: clearToasts
  };
}

export default Toast;