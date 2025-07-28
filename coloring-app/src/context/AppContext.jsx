/**
 * Application Context Provider - Centralized State Management
 * 
 * CODE QUALITY IMPROVEMENTS:
 * - Replaces window object state storage (anti-pattern)
 * - Centralized error handling and user feedback
 * - Standardized state management patterns
 * - Type-safe context with proper defaults
 * - Memory leak prevention with cleanup
 * 
 * Addresses audit findings: Global state in window object, state management issues
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { auth } from '../../firebase-config.js';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Application state shape and initial values
 * Provides type safety and default state structure
 */
const initialState = {
  // User authentication state
  user: null,
  authLoading: true,
  
  // Image generation state
  generationState: {
    isGenerating: false,
    generatedImage: null,
    refinedPrompt: '',
    metadata: null,
    progress: 0
  },
  
  // UI state
  ui: {
    currentView: 'create', // 'create', 'gallery', 'auth'
    isHighContrast: false,
    theme: 'light',
    notifications: [],
    modals: {
      previewModal: false,
      errorModal: false
    }
  },
  
  // Error and feedback state
  errors: {
    global: null,
    generation: null,
    gallery: null,
    auth: null
  },
  
  // Settings and preferences
  settings: {
    autoSave: true,
    imageQuality: 'high',
    notifications: true,
    theme: 'pastel'
  }
};

/**
 * Action types for state management
 * Centralized action definitions prevent typos and improve maintainability
 */
export const ACTION_TYPES = {
  // Auth actions
  SET_USER: 'SET_USER',
  SET_AUTH_LOADING: 'SET_AUTH_LOADING',
  CLEAR_AUTH: 'CLEAR_AUTH',
  
  // Generation actions
  START_GENERATION: 'START_GENERATION',
  UPDATE_GENERATION_PROGRESS: 'UPDATE_GENERATION_PROGRESS',
  COMPLETE_GENERATION: 'COMPLETE_GENERATION',
  FAIL_GENERATION: 'FAIL_GENERATION',
  RESET_GENERATION: 'RESET_GENERATION',
  
  // UI actions
  SET_CURRENT_VIEW: 'SET_CURRENT_VIEW',
  TOGGLE_HIGH_CONTRAST: 'TOGGLE_HIGH_CONTRAST',
  SET_THEME: 'SET_THEME',
  SHOW_MODAL: 'SHOW_MODAL',
  HIDE_MODAL: 'HIDE_MODAL',
  
  // Notification actions
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',
  
  // Error actions
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  CLEAR_ALL_ERRORS: 'CLEAR_ALL_ERRORS',
  
  // Settings actions
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  RESET_SETTINGS: 'RESET_SETTINGS'
};

/**
 * State reducer with comprehensive action handling
 * Implements immutable state updates and error boundary protection
 * 
 * @param {Object} state - Current state
 * @param {Object} action - Dispatched action
 * @returns {Object} New state
 */
function appReducer(state, action) {
  try {
    switch (action.type) {
      // Authentication state management
      case ACTION_TYPES.SET_USER:
        return {
          ...state,
          user: action.payload,
          authLoading: false,
          errors: { ...state.errors, auth: null }
        };
        
      case ACTION_TYPES.SET_AUTH_LOADING:
        return {
          ...state,
          authLoading: action.payload
        };
        
      case ACTION_TYPES.CLEAR_AUTH:
        return {
          ...state,
          user: null,
          authLoading: false,
          ui: { ...state.ui, currentView: 'create' }
        };
      
      // Image generation state management
      case ACTION_TYPES.START_GENERATION:
        return {
          ...state,
          generationState: {
            ...state.generationState,
            isGenerating: true,
            progress: 0,
            generatedImage: null,
            refinedPrompt: '',
            metadata: null
          },
          errors: { ...state.errors, generation: null }
        };
        
      case ACTION_TYPES.UPDATE_GENERATION_PROGRESS:
        return {
          ...state,
          generationState: {
            ...state.generationState,
            progress: action.payload
          }
        };
        
      case ACTION_TYPES.COMPLETE_GENERATION:
        return {
          ...state,
          generationState: {
            ...state.generationState,
            isGenerating: false,
            generatedImage: action.payload.imageUrl,
            refinedPrompt: action.payload.refinedPrompt,
            metadata: action.payload.metadata,
            progress: 100
          }
        };
        
      case ACTION_TYPES.FAIL_GENERATION:
        return {
          ...state,
          generationState: {
            ...state.generationState,
            isGenerating: false,
            progress: 0
          },
          errors: {
            ...state.errors,
            generation: action.payload
          }
        };
        
      case ACTION_TYPES.RESET_GENERATION:
        return {
          ...state,
          generationState: {
            ...initialState.generationState
          },
          errors: { ...state.errors, generation: null }
        };
      
      // UI state management
      case ACTION_TYPES.SET_CURRENT_VIEW:
        return {
          ...state,
          ui: {
            ...state.ui,
            currentView: action.payload
          }
        };
        
      case ACTION_TYPES.TOGGLE_HIGH_CONTRAST:
        const newContrastMode = !state.ui.isHighContrast;
        return {
          ...state,
          ui: {
            ...state.ui,
            isHighContrast: newContrastMode,
            theme: newContrastMode ? 'high-contrast' : 'light'
          }
        };
        
      case ACTION_TYPES.SET_THEME:
        return {
          ...state,
          ui: {
            ...state.ui,
            theme: action.payload
          }
        };
        
      case ACTION_TYPES.SHOW_MODAL:
        return {
          ...state,
          ui: {
            ...state.ui,
            modals: {
              ...state.ui.modals,
              [action.payload.modal]: action.payload.data || true
            }
          }
        };
        
      case ACTION_TYPES.HIDE_MODAL:
        return {
          ...state,
          ui: {
            ...state.ui,
            modals: {
              ...state.ui.modals,
              [action.payload]: false
            }
          }
        };
      
      // Notification management
      case ACTION_TYPES.ADD_NOTIFICATION:
        const notification = {
          id: Date.now() + Math.random(),
          timestamp: new Date().toISOString(),
          ...action.payload
        };
        
        return {
          ...state,
          ui: {
            ...state.ui,
            notifications: [...state.ui.notifications, notification]
          }
        };
        
      case ACTION_TYPES.REMOVE_NOTIFICATION:
        return {
          ...state,
          ui: {
            ...state.ui,
            notifications: state.ui.notifications.filter(
              n => n.id !== action.payload
            )
          }
        };
        
      case ACTION_TYPES.CLEAR_NOTIFICATIONS:
        return {
          ...state,
          ui: {
            ...state.ui,
            notifications: []
          }
        };
      
      // Error management
      case ACTION_TYPES.SET_ERROR:
        return {
          ...state,
          errors: {
            ...state.errors,
            [action.payload.type]: action.payload.error
          }
        };
        
      case ACTION_TYPES.CLEAR_ERROR:
        return {
          ...state,
          errors: {
            ...state.errors,
            [action.payload]: null
          }
        };
        
      case ACTION_TYPES.CLEAR_ALL_ERRORS:
        return {
          ...state,
          errors: {
            global: null,
            generation: null,
            gallery: null,
            auth: null
          }
        };
      
      // Settings management
      case ACTION_TYPES.UPDATE_SETTINGS:
        return {
          ...state,
          settings: {
            ...state.settings,
            ...action.payload
          }
        };
        
      case ACTION_TYPES.RESET_SETTINGS:
        return {
          ...state,
          settings: { ...initialState.settings }
        };
      
      default:
        console.warn(`Unknown action type: ${action.type}`);
        return state;
    }
  } catch (error) {
    console.error('AppReducer error:', error);
    // Return previous state on error to prevent app crash
    return state;
  }
}

/**
 * App context definition with type safety
 */
const AppContext = createContext({
  state: initialState,
  dispatch: () => {},
  actions: {}
});

/**
 * Custom hook for accessing app context
 * Provides type safety and usage validation
 * 
 * @returns {Object} Context value with state, dispatch, and actions
 */
export function useAppContext() {
  const context = useContext(AppContext);
  
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  
  return context;
}

/**
 * App Context Provider Component
 * Provides centralized state management and action creators
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components
 * @returns {JSX.Element} Context provider wrapper
 */
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  /**
   * Authentication action creators
   */
  const authActions = {
    setUser: useCallback((user) => {
      dispatch({ type: ACTION_TYPES.SET_USER, payload: user });
    }, []),
    
    setAuthLoading: useCallback((loading) => {
      dispatch({ type: ACTION_TYPES.SET_AUTH_LOADING, payload: loading });
    }, []),
    
    clearAuth: useCallback(() => {
      dispatch({ type: ACTION_TYPES.CLEAR_AUTH });
    }, [])
  };
  
  /**
   * Generation action creators
   */
  const generationActions = {
    startGeneration: useCallback(() => {
      dispatch({ type: ACTION_TYPES.START_GENERATION });
    }, []),
    
    updateProgress: useCallback((progress) => {
      dispatch({ type: ACTION_TYPES.UPDATE_GENERATION_PROGRESS, payload: progress });
    }, []),
    
    completeGeneration: useCallback((result) => {
      dispatch({ type: ACTION_TYPES.COMPLETE_GENERATION, payload: result });
    }, []),
    
    failGeneration: useCallback((error) => {
      dispatch({ type: ACTION_TYPES.FAIL_GENERATION, payload: error });
    }, []),
    
    resetGeneration: useCallback(() => {
      dispatch({ type: ACTION_TYPES.RESET_GENERATION });
    }, [])
  };
  
  /**
   * UI action creators
   */
  const uiActions = {
    setCurrentView: useCallback((view) => {
      dispatch({ type: ACTION_TYPES.SET_CURRENT_VIEW, payload: view });
    }, []),
    
    toggleHighContrast: useCallback(() => {
      dispatch({ type: ACTION_TYPES.TOGGLE_HIGH_CONTRAST });
    }, []),
    
    setTheme: useCallback((theme) => {
      dispatch({ type: ACTION_TYPES.SET_THEME, payload: theme });
    }, []),
    
    showModal: useCallback((modal, data) => {
      dispatch({ type: ACTION_TYPES.SHOW_MODAL, payload: { modal, data } });
    }, []),
    
    hideModal: useCallback((modal) => {
      dispatch({ type: ACTION_TYPES.HIDE_MODAL, payload: modal });
    }, [])
  };
  
  /**
   * Notification action creators
   */
  const notificationActions = {
    addNotification: useCallback((notification) => {
      dispatch({ type: ACTION_TYPES.ADD_NOTIFICATION, payload: notification });
      
      // Auto-remove notifications after delay
      if (notification.autoRemove !== false) {
        const delay = notification.duration || 5000;
        setTimeout(() => {
          dispatch({ type: ACTION_TYPES.REMOVE_NOTIFICATION, payload: notification.id });
        }, delay);
      }
    }, []),
    
    removeNotification: useCallback((id) => {
      dispatch({ type: ACTION_TYPES.REMOVE_NOTIFICATION, payload: id });
    }, []),
    
    clearNotifications: useCallback(() => {
      dispatch({ type: ACTION_TYPES.CLEAR_NOTIFICATIONS });
    }, [])
  };
  
  /**
   * Error action creators
   */
  const errorActions = {
    setError: useCallback((type, error) => {
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: { type, error } });
    }, []),
    
    clearError: useCallback((type) => {
      dispatch({ type: ACTION_TYPES.CLEAR_ERROR, payload: type });
    }, []),
    
    clearAllErrors: useCallback(() => {
      dispatch({ type: ACTION_TYPES.CLEAR_ALL_ERRORS });
    }, [])
  };
  
  /**
   * Settings action creators
   */
  const settingsActions = {
    updateSettings: useCallback((settings) => {
      dispatch({ type: ACTION_TYPES.UPDATE_SETTINGS, payload: settings });
    }, []),
    
    resetSettings: useCallback(() => {
      dispatch({ type: ACTION_TYPES.RESET_SETTINGS });
    }, [])
  };
  
  /**
   * Consolidated action creators
   */
  const actions = {
    auth: authActions,
    generation: generationActions,
    ui: uiActions,
    notifications: notificationActions,
    errors: errorActions,
    settings: settingsActions
  };
  
  /**
   * Firebase auth state listener with error handling
   */
  useEffect(() => {
    let unsubscribe = null;
    
    try {
      unsubscribe = onAuthStateChanged(auth, 
        (user) => {
          authActions.setUser(user);
          
          // Auto-switch to gallery if user just signed in
          if (user && state.ui.currentView === 'auth') {
            uiActions.setCurrentView('gallery');
          }
        },
        (error) => {
          console.error('Auth state change error:', error);
          errorActions.setError('auth', 'Authentication error occurred');
          authActions.setAuthLoading(false);
        }
      );
    } catch (error) {
      console.error('Auth listener setup failed:', error);
      errorActions.setError('auth', 'Failed to initialize authentication');
      authActions.setAuthLoading(false);
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [state.ui.currentView]); // Dependencies for auth effect
  
  /**
   * High contrast DOM effect
   */
  useEffect(() => {
    if (state.ui.isHighContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('high-contrast');
    };
  }, [state.ui.isHighContrast]);
  
  /**
   * Settings persistence
   */
  useEffect(() => {
    try {
      localStorage.setItem('coloring-app-settings', JSON.stringify(state.settings));
    } catch (error) {
      console.warn('Failed to persist settings:', error);
    }
  }, [state.settings]);
  
  /**
   * Load persisted settings on mount
   */
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('coloring-app-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        settingsActions.updateSettings(parsed);
      }
    } catch (error) {
      console.warn('Failed to load saved settings:', error);
    }
  }, []); // Run only on mount
  
  /**
   * Context value with memoization for performance
   */
  const contextValue = React.useMemo(() => ({
    state,
    dispatch,
    actions
  }), [state, actions]);
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Higher-order component for providing app context
 * Useful for testing and isolated component development
 * 
 * @param {React.Component} Component - Component to wrap
 * @returns {React.Component} Wrapped component with context
 */
export function withAppContext(Component) {
  return function WrappedComponent(props) {
    return (
      <AppProvider>
        <Component {...props} />
      </AppProvider>
    );
  };
}

export default AppContext;