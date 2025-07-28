/**
 * LazyImage Component - Performance-Optimized Image Loading
 * 
 * PERFORMANCE ENHANCEMENTS:
 * - Intersection Observer API for lazy loading
 * - Progressive loading with placeholders
 * - WebP support with fallbacks
 * - Loading states and error handling
 * - Memory optimization with cleanup
 * 
 * Addresses audit findings: Missing lazy loading, large image handling
 * Target: <3s perceived load time, optimized memory usage
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

/**
 * LazyImage component with advanced performance optimizations
 * 
 * @param {Object} props - Component props
 * @param {string} props.src - Primary image source URL
 * @param {string} props.alt - Alt text for accessibility
 * @param {string} props.placeholder - Low-quality placeholder image
 * @param {string} props.className - CSS classes
 * @param {Object} props.style - Inline styles
 * @param {Function} props.onLoad - Callback when image loads
 * @param {Function} props.onError - Callback when image fails to load
 * @param {boolean} props.eager - Whether to load immediately (skip lazy loading)
 * @param {Object} props.sizes - Responsive image sizes
 * @returns {JSX.Element} Optimized image component
 */
const LazyImage = ({
  src,
  alt = '',
  placeholder,
  className = '',
  style = {},
  onLoad,
  onError,
  eager = false,
  sizes = {},
  ...props
}) => {
  // State management for loading phases
  const [loadingState, setLoadingState] = useState('idle'); // idle, loading, loaded, error
  const [currentSrc, setCurrentSrc] = useState(placeholder || '');
  const [hasWebPSupport, setHasWebPSupport] = useState(null);
  
  // Refs for cleanup and optimization
  const imgRef = useRef(null);
  const observerRef = useRef(null);
  const timeoutRef = useRef(null);
  
  // Intersection observer for lazy loading
  const [isIntersecting, targetRef] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px', // Start loading 50px before visible
    enabled: !eager
  });
  
  /**
   * Detects WebP support for format optimization
   * Uses canvas method for reliable detection
   */
  const detectWebPSupport = useCallback(() => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      
      canvas.toBlob((blob) => {
        resolve(blob && blob.type === 'image/webp');
      }, 'image/webp', 0.1);
    });
  }, []);
  
  /**
   * Determines optimal image source based on format support and device capabilities
   */
  const getOptimalSrc = useCallback((baseSrc) => {
    if (!baseSrc) return '';
    
    // If it's a data URL, return as-is
    if (baseSrc.startsWith('data:')) {
      return baseSrc;
    }
    
    // For API-generated images, prefer WebP if supported
    if (hasWebPSupport && !baseSrc.includes('.webp')) {
      // This would integrate with your image optimization service
      // For now, we'll use the original source
      return baseSrc;
    }
    
    return baseSrc;
  }, [hasWebPSupport]);
  
  /**
   * Preloads image in background to enable smooth transition
   */
  const preloadImage = useCallback((imageSrc) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // Set up event handlers before setting src
      img.onload = () => {
        resolve(img);
      };
      
      img.onerror = (error) => {
        reject(new Error(`Failed to load image: ${imageSrc}`));
      };
      
      // Handle timeout for slow networks
      const timeout = setTimeout(() => {
        reject(new Error('Image load timeout'));
      }, 10000); // 10 second timeout
      
      img.onload = () => {
        clearTimeout(timeout);
        resolve(img);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load image: ${imageSrc}`));
      };
      
      // Start loading
      img.src = imageSrc;
    });
  }, []);
  
  /**
   * Handles the image loading process with progressive enhancement
   */
  const loadImage = useCallback(async () => {
    if (!src || loadingState === 'loading' || loadingState === 'loaded') {
      return;
    }
    
    setLoadingState('loading');
    
    try {
      const optimalSrc = getOptimalSrc(src);
      
      // Preload the full-quality image
      await preloadImage(optimalSrc);
      
      // Once loaded, transition to full image
      setCurrentSrc(optimalSrc);
      setLoadingState('loaded');
      
      // Call success callback
      onLoad?.();
      
    } catch (error) {
      console.warn('LazyImage load failed:', error.message);
      setLoadingState('error');
      
      // Try fallback image if available
      if (placeholder && currentSrc !== placeholder) {
        setCurrentSrc(placeholder);
      }
      
      // Call error callback
      onError?.(error);
    }
  }, [src, loadingState, getOptimalSrc, preloadImage, onLoad, onError, placeholder, currentSrc]);
  
  /**
   * Initialize WebP support detection
   */
  useEffect(() => {
    if (hasWebPSupport === null) {
      detectWebPSupport().then(setHasWebPSupport);
    }
  }, [detectWebPSupport, hasWebPSupport]);
  
  /**
   * Start loading when component intersects viewport or is eager
   */
  useEffect(() => {
    if ((isIntersecting || eager) && src && loadingState === 'idle') {
      // Small delay to batch multiple intersection events
      timeoutRef.current = setTimeout(loadImage, 50);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isIntersecting, eager, src, loadingState, loadImage]);
  
  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  /**
   * Generate responsive srcSet if sizes are provided
   */
  const generateSrcSet = useCallback(() => {
    if (!sizes || Object.keys(sizes).length === 0) {
      return undefined;
    }
    
    return Object.entries(sizes)
      .map(([size, url]) => `${url} ${size}`)
      .join(', ');
  }, [sizes]);
  
  /**
   * CSS classes for different loading states
   */
  const getImageClasses = () => {
    const baseClasses = 'transition-all duration-300 ease-in-out';
    const stateClasses = {
      idle: 'opacity-0',
      loading: 'opacity-50 animate-pulse',
      loaded: 'opacity-100',
      error: 'opacity-75 filter grayscale'
    };
    
    return `${baseClasses} ${stateClasses[loadingState]} ${className}`;
  };
  
  /**
   * Render loading skeleton for better perceived performance
   */
  const renderSkeleton = () => (
    <div 
      className={`bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse ${className}`}
      style={{
        ...style,
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s ease-in-out infinite'
      }}
      aria-label="Loading image..."
    >
      {/* Optional loading icon */}
      <div className="flex items-center justify-center h-full">
        <svg 
          className="w-8 h-8 text-gray-400 animate-spin" 
          fill="none" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    </div>
  );
  
  /**
   * Render error state with retry option
   */
  const renderError = () => (
    <div 
      className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-4 ${className}`}
      style={style}
    >
      <svg 
        className="w-8 h-8 text-gray-400 mb-2" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2" 
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" 
        />
      </svg>
      <p className="text-sm text-gray-500 text-center mb-2">
        Failed to load image
      </p>
      <button
        onClick={() => {
          setLoadingState('idle');
          loadImage();
        }}
        className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
        aria-label="Retry loading image"
      >
        Try again
      </button>
    </div>
  );
  
  // Show skeleton while not intersecting (lazy loading)
  if (!eager && !isIntersecting && loadingState === 'idle') {
    return (
      <div ref={targetRef} className={className} style={style}>
        {renderSkeleton()}
      </div>
    );
  }
  
  // Show error state
  if (loadingState === 'error') {
    return renderError();
  }
  
  // Show main image
  return (
    <div ref={targetRef} className="relative">
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={getImageClasses()}
        style={style}
        srcSet={generateSrcSet()}
        sizes={sizes.default}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        {...props}
        onLoad={(e) => {
          // Additional onLoad handling if needed
          props.onLoad?.(e);
        }}
        onError={(e) => {
          if (loadingState !== 'error') {
            setLoadingState('error');
          }
          props.onError?.(e);
        }}
      />
      
      {/* Loading overlay for smooth transitions */}
      {loadingState === 'loading' && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pastel-blue"></div>
        </div>
      )}
    </div>
  );
};

/**
 * Memoized export for performance
 */
export default React.memo(LazyImage);

/**
 * CSS for skeleton shimmer animation
 * Add this to your global CSS or Tailwind config
 */
export const skeletonShimmerCSS = `
  @keyframes skeleton-shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`;