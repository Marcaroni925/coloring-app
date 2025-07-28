/**
 * useIntersectionObserver Hook - Performance-Optimized Viewport Detection
 * 
 * PERFORMANCE ENHANCEMENTS:
 * - Efficient viewport intersection detection
 * - Shared observer instances to reduce memory usage
 * - Configurable thresholds and margins
 * - Automatic cleanup and memory management
 * 
 * Used by LazyImage and other components for performance optimization
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Shared IntersectionObserver instances to reduce memory usage
 * Multiple components can share the same observer configuration
 */
const observerInstances = new Map();

/**
 * Creates or retrieves a shared IntersectionObserver instance
 * 
 * @param {Object} options - Observer configuration
 * @returns {IntersectionObserver} Shared observer instance
 */
function getSharedObserver(options) {
  const key = JSON.stringify(options);
  
  if (!observerInstances.has(key)) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // Each target element stores its callback
        const callback = entry.target.__intersectionCallback;
        if (callback) {
          callback(entry.isIntersecting, entry);
        }
      });
    }, options);
    
    // Store observer with cleanup tracking
    observerInstances.set(key, {
      observer,
      targets: new Set(),
      lastUsed: Date.now()
    });
  }
  
  const instance = observerInstances.get(key);
  instance.lastUsed = Date.now();
  
  return instance;
}

/**
 * Cleanup unused observer instances periodically
 * Prevents memory leaks from abandoned observers
 */
function cleanupObservers() {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  
  for (const [key, instance] of observerInstances.entries()) {
    if (now - instance.lastUsed > maxAge && instance.targets.size === 0) {
      instance.observer.disconnect();
      observerInstances.delete(key);
    }
  }
}

// Periodic cleanup every 5 minutes
setInterval(cleanupObservers, 5 * 60 * 1000);

/**
 * useIntersectionObserver Hook
 * 
 * Provides efficient intersection observation with shared instances
 * and automatic cleanup. Optimized for performance with multiple components.
 * 
 * @param {Object} options - Configuration options
 * @param {number|Array} options.threshold - Intersection threshold(s) [0-1]
 * @param {string} options.rootMargin - Margin around root (CSS format)
 * @param {Element} options.root - Root element (default: viewport)
 * @param {boolean} options.enabled - Whether observation is enabled
 * @param {boolean} options.once - Whether to observe only once
 * @param {Function} options.onIntersect - Callback for intersection events
 * @returns {Array} [isIntersecting, targetRef, observerEntry]
 */
export function useIntersectionObserver({
  threshold = 0.1,
  rootMargin = '0px',
  root = null,
  enabled = true,
  once = false,
  onIntersect
} = {}) {
  // State for intersection status
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [observerEntry, setObserverEntry] = useState(null);
  
  // Refs for target element and cleanup
  const targetRef = useRef(null);
  const callbackRef = useRef(null);
  const observerInstanceRef = useRef(null);
  const hasIntersectedRef = useRef(false);
  
  /**
   * Intersection callback with performance optimizations
   */
  const intersectionCallback = useCallback((intersecting, entry) => {
    // Update state only if changed to prevent unnecessary re-renders
    setIsIntersecting(current => {
      if (current !== intersecting) {
        setObserverEntry(entry);
        
        // Mark as intersected for 'once' behavior
        if (intersecting) {
          hasIntersectedRef.current = true;
        }
        
        // Call external callback
        onIntersect?.(intersecting, entry);
        
        return intersecting;
      }
      return current;
    });
    
    // Disconnect if 'once' and has intersected
    if (once && intersecting && observerInstanceRef.current) {
      const { observer, targets } = observerInstanceRef.current;
      const target = targetRef.current;
      
      if (target) {
        observer.unobserve(target);
        targets.delete(target);
        delete target.__intersectionCallback;
      }
    }
  }, [once, onIntersect]);
  
  // Store callback in ref for access in shared observer
  callbackRef.current = intersectionCallback;
  
  /**
   * Set up intersection observation
   */
  useEffect(() => {
    const target = targetRef.current;
    
    if (!enabled || !target) {
      return;
    }
    
    // Skip if already intersected and 'once' is true
    if (once && hasIntersectedRef.current) {
      return;
    }
    
    // Get or create shared observer instance
    const observerConfig = {
      threshold,
      rootMargin,
      root
    };
    
    const sharedInstance = getSharedObserver(observerConfig);
    observerInstanceRef.current = sharedInstance;
    
    const { observer, targets } = sharedInstance;
    
    // Store callback on target element for shared observer
    target.__intersectionCallback = callbackRef.current;
    
    // Start observing
    observer.observe(target);
    targets.add(target);
    
    // Cleanup function
    return () => {
      if (target && observer) {
        observer.unobserve(target);
        targets.delete(target);
        delete target.__intersectionCallback;
      }
    };
  }, [enabled, threshold, rootMargin, root, once]);
  
  /**
   * Additional cleanup on unmount
   */
  useEffect(() => {
    return () => {
      const target = targetRef.current;
      if (target && observerInstanceRef.current) {
        const { observer, targets } = observerInstanceRef.current;
        observer.unobserve(target);
        targets.delete(target);
        delete target.__intersectionCallback;
      }
    };
  }, []);
  
  /**
   * Manual trigger for programmatic intersection
   */
  const triggerIntersection = useCallback((intersecting = true) => {
    setIsIntersecting(intersecting);
    if (intersecting) {
      hasIntersectedRef.current = true;
    }
  }, []);
  
  /**
   * Reset intersection state
   */
  const reset = useCallback(() => {
    setIsIntersecting(false);
    setObserverEntry(null);
    hasIntersectedRef.current = false;
  }, []);
  
  return [
    isIntersecting,
    targetRef,
    observerEntry,
    {
      trigger: triggerIntersection,
      reset,
      hasIntersected: hasIntersectedRef.current
    }
  ];
}

/**
 * useIntersectionObserverEffect Hook
 * 
 * Simplified version that only runs an effect when element intersects
 * Useful for analytics, loading data, or triggering animations
 * 
 * @param {Function} effect - Effect to run on intersection
 * @param {Object} options - Observer options
 * @returns {Function} Target ref setter
 */
export function useIntersectionObserverEffect(effect, options = {}) {
  const [isIntersecting, targetRef] = useIntersectionObserver({
    once: true, // Default to once for effects
    ...options
  });
  
  useEffect(() => {
    if (isIntersecting) {
      effect();
    }
  }, [isIntersecting, effect]);
  
  return targetRef;
}

/**
 * useVisible Hook
 * 
 * Simple visibility detection with performance optimizations
 * Returns boolean indicating if element is currently visible
 * 
 * @param {Object} options - Observer options
 * @returns {Array} [isVisible, ref]
 */
export function useVisible(options = {}) {
  const [isVisible, ref] = useIntersectionObserver({
    threshold: 0.1,
    ...options
  });
  
  return [isVisible, ref];
}

/**
 * Performance monitoring for intersection observers
 * Useful for debugging and optimization
 */
export function getIntersectionObserverStats() {
  const stats = {
    activeObservers: observerInstances.size,
    totalTargets: 0,
    observerDetails: []
  };
  
  for (const [key, instance] of observerInstances.entries()) {
    stats.totalTargets += instance.targets.size;
    stats.observerDetails.push({
      config: JSON.parse(key),
      targets: instance.targets.size,
      lastUsed: new Date(instance.lastUsed).toISOString()
    });
  }
  
  return stats;
}

/**
 * Force cleanup of all observers (useful for testing)
 */
export function clearAllObservers() {
  for (const [key, instance] of observerInstances.entries()) {
    instance.observer.disconnect();
    observerInstances.delete(key);
  }
}

export default useIntersectionObserver;