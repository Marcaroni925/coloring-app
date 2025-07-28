/**
 * useResponsive Hook
 * 
 * Custom React hook for managing responsive design state and breakpoints.
 * Handles window resize events, viewport detection, and responsive behavior.
 * 
 * Evidence: architecture.md Section 2.4 Responsive Design
 * Best Practice: Centralized responsive logic for consistent behavior
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  BREAKPOINTS, 
  isMobileViewport, 
  isTabletViewport, 
  isDesktopViewport, 
  getViewportType,
  debounce,
  createLogger 
} from '../utils';

const logger = createLogger('useResponsive');

/**
 * Custom hook for responsive design management
 * @param {Object} options - Configuration options
 * @returns {Object} Responsive state and utilities
 */
export const useResponsive = (options = {}) => {
  const {
    debounceDelay = 150,
    enableLogging = false
  } = options;

  // State for current viewport information
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  const [viewport, setViewport] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    type: 'desktop'
  });

  const [orientation, setOrientation] = useState({
    isPortrait: true,
    isLandscape: false
  });

  /**
   * Updates viewport state based on current window size
   */
  const updateViewport = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Update window size
    setWindowSize({ width, height });

    // Update viewport breakpoints
    const isMobile = isMobileViewport();
    const isTablet = isTabletViewport();
    const isDesktop = isDesktopViewport();
    const type = getViewportType();

    setViewport({
      isMobile,
      isTablet,
      isDesktop,
      type
    });

    // Update orientation
    const isPortrait = height > width;
    const isLandscape = width > height;

    setOrientation({
      isPortrait,
      isLandscape
    });

    if (enableLogging) {
      logger.log('Viewport updated:', {
        size: { width, height },
        type,
        orientation: isPortrait ? 'portrait' : 'landscape'
      });
    }
  }, [enableLogging]);

  // Debounced resize handler to improve performance
  const debouncedUpdateViewport = useCallback(
    debounce(updateViewport, debounceDelay),
    [updateViewport, debounceDelay]
  );

  // Setup resize listener - Evidence: architecture.md Section 2.4 Safe browser API usage
  useEffect(() => {
    // Guard against SSR and ensure window is available
    if (typeof window === 'undefined') return;
    
    // Initial update
    updateViewport();

    // Add resize listener
    window.addEventListener('resize', debouncedUpdateViewport);
    
    // Optional: Listen for orientation change on mobile devices
    if ('orientation' in window) {
      window.addEventListener('orientationchange', debouncedUpdateViewport);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', debouncedUpdateViewport);
        if ('orientation' in window) {
          window.removeEventListener('orientationchange', debouncedUpdateViewport);
        }
      }
    };
  }, [updateViewport, debouncedUpdateViewport]);

  /**
   * Checks if current viewport matches a specific breakpoint
   * @param {string} breakpoint - Breakpoint name ('mobile', 'tablet', 'desktop')
   * @returns {boolean}
   */
  const matches = useCallback((breakpoint) => {
    switch (breakpoint.toLowerCase()) {
      case 'mobile':
        return viewport.isMobile;
      case 'tablet':
        return viewport.isTablet;
      case 'desktop':
        return viewport.isDesktop;
      default:
        return false;
    }
  }, [viewport]);

  /**
   * Checks if viewport width is above a specific pixel value
   * @param {number} width - Minimum width in pixels
   * @returns {boolean}
   */
  const minWidth = useCallback((width) => {
    return windowSize.width >= width;
  }, [windowSize.width]);

  /**
   * Checks if viewport width is below a specific pixel value
   * @param {number} width - Maximum width in pixels
   * @returns {boolean}
   */
  const maxWidth = useCallback((width) => {
    return windowSize.width <= width;
  }, [windowSize.width]);

  /**
   * Checks if viewport is within a specific width range
   * @param {number} min - Minimum width
   * @param {number} max - Maximum width
   * @returns {boolean}
   */
  const between = useCallback((min, max) => {
    return windowSize.width >= min && windowSize.width <= max;
  }, [windowSize.width]);

  /**
   * Returns a value based on current viewport
   * @param {Object} values - Object with breakpoint keys and values
   * @returns {any} Value for current viewport
   */
  const choose = useCallback((values) => {
    if (viewport.isMobile && values.mobile !== undefined) {
      return values.mobile;
    }
    if (viewport.isTablet && values.tablet !== undefined) {
      return values.tablet;
    }
    if (viewport.isDesktop && values.desktop !== undefined) {
      return values.desktop;
    }
    return values.default;
  }, [viewport]);

  /**
   * Returns CSS classes based on current viewport
   * @param {Object} classes - Object with breakpoint keys and class strings
   * @returns {string} CSS classes for current viewport
   */
  const classes = useCallback((classMap) => {
    const result = [];
    
    // Base classes
    if (classMap.base) {
      result.push(classMap.base);
    }
    
    // Viewport-specific classes
    if (viewport.isMobile && classMap.mobile) {
      result.push(classMap.mobile);
    }
    if (viewport.isTablet && classMap.tablet) {
      result.push(classMap.tablet);
    }
    if (viewport.isDesktop && classMap.desktop) {
      result.push(classMap.desktop);
    }
    
    // Orientation classes
    if (orientation.isPortrait && classMap.portrait) {
      result.push(classMap.portrait);
    }
    if (orientation.isLandscape && classMap.landscape) {
      result.push(classMap.landscape);
    }
    
    return result.join(' ');
  }, [viewport, orientation]);

  /**
   * Returns inline styles based on current viewport
   * @param {Object} styles - Object with breakpoint keys and style objects
   * @returns {Object} Styles for current viewport
   */
  const styles = useCallback((styleMap) => {
    let result = {};
    
    // Base styles
    if (styleMap.base) {
      result = { ...result, ...styleMap.base };
    }
    
    // Viewport-specific styles
    if (viewport.isMobile && styleMap.mobile) {
      result = { ...result, ...styleMap.mobile };
    }
    if (viewport.isTablet && styleMap.tablet) {
      result = { ...result, ...styleMap.tablet };
    }
    if (viewport.isDesktop && styleMap.desktop) {
      result = { ...result, ...styleMap.desktop };
    }
    
    // Orientation styles
    if (orientation.isPortrait && styleMap.portrait) {
      result = { ...result, ...styleMap.portrait };
    }
    if (orientation.isLandscape && styleMap.landscape) {
      result = { ...result, ...styleMap.landscape };
    }
    
    return result;
  }, [viewport, orientation]);

  /**
   * Checks if touch is available (usually mobile devices)
   * @returns {boolean}
   */
  const isTouchDevice = useCallback(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  /**
   * Gets the current device pixel ratio
   * @returns {number}
   */
  const pixelRatio = useCallback(() => {
    return window.devicePixelRatio || 1;
  }, []);

  /**
   * Checks if the viewport has changed from the last render
   * @param {string} previousType - Previous viewport type
   * @returns {boolean}
   */
  const hasChanged = useCallback((previousType) => {
    return viewport.type !== previousType;
  }, [viewport.type]);

  return {
    // Window size
    windowSize,
    width: windowSize.width,
    height: windowSize.height,
    
    // Viewport breakpoints
    ...viewport,
    
    // Orientation
    ...orientation,
    
    // Breakpoint constants (for reference)
    breakpoints: BREAKPOINTS,
    
    // Utility functions
    matches,
    minWidth,
    maxWidth,
    between,
    choose,
    classes,
    styles,
    isTouchDevice,
    pixelRatio,
    hasChanged,
    
    // Device information
    deviceInfo: {
      isTouchDevice: isTouchDevice(),
      pixelRatio: pixelRatio(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      platform: typeof navigator !== 'undefined' ? navigator.platform : ''
    },
    
    // For debugging (development only)
    ...(process.env.NODE_ENV === 'development' && {
      _debug: {
        breakpoints: BREAKPOINTS,
        windowSize,
        viewport,
        orientation,
        updateCount: Math.random() // Changes on each update for debugging
      }
    })
  };
};