/**
 * LoadingSkeleton Component - Enhanced Loading States
 * 
 * UI/UX ENHANCEMENTS:
 * - Multiple skeleton variants for different content types
 * - Smooth shimmer animations with pastel theme integration
 * - Accessibility support with proper ARIA labels
 * - Performance-optimized animations with GPU acceleration
 * - Responsive design with mobile-first approach
 * 
 * Addresses audit findings: Missing loading states, perceived performance
 */

import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Individual skeleton item with shimmer animation
 * Base building block for complex skeleton layouts
 * 
 * @param {Object} props - Component props
 * @param {string} props.className - CSS classes for styling
 * @param {Object} props.style - Inline styles
 * @param {string} props.width - Width (CSS value)
 * @param {string} props.height - Height (CSS value)
 * @param {string} props.radius - Border radius variant
 * @returns {JSX.Element} Skeleton item component
 */
export function SkeletonItem({ 
  className = '', 
  style = {}, 
  width, 
  height, 
  radius = 'md',
  ...props 
}) {
  const radiusClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  };

  return (
    <div
      className={cn(
        // Base skeleton styles
        'bg-gradient-to-r from-pastel-pink-100 via-pastel-blue-100 to-pastel-pink-100',
        'animate-pulse',
        'relative overflow-hidden',
        radiusClasses[radius],
        className
      )}
      style={{
        width,
        height,
        ...style,
        // GPU acceleration for smooth animations
        transform: 'translateZ(0)',
        willChange: 'transform'
      }}
      aria-hidden="true"
      {...props}
    >
      {/* Shimmer overlay effect */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}

/**
 * Form skeleton for input fields and form controls
 * Matches the structure of PromptForm component
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Form skeleton component
 */
export function FormSkeleton({ className = '' }) {
  return (
    <div 
      className={cn('space-y-6 p-6', className)}
      role="status"
      aria-label="Loading form..."
    >
      {/* Title skeleton */}
      <div className="space-y-3">
        <SkeletonItem height="32px" width="60%" radius="sm" />
        <SkeletonItem height="20px" width="80%" radius="sm" />
      </div>

      {/* Prompt input skeleton */}
      <div className="space-y-2">
        <SkeletonItem height="20px" width="30%" radius="sm" />
        <SkeletonItem height="120px" width="100%" radius="lg" />
      </div>

      {/* Customization options skeleton */}
      <div className="space-y-4">
        <SkeletonItem height="24px" width="40%" radius="sm" />
        
        {/* Grid of options */}
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="space-y-2">
              <SkeletonItem height="16px" width="70%" radius="sm" />
              <div className="flex space-x-2">
                <SkeletonItem width="20px" height="20px" radius="full" />
                <SkeletonItem height="16px" width="60%" radius="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generate button skeleton */}
      <div className="flex justify-center pt-4">
        <SkeletonItem height="48px" width="200px" radius="button" />
      </div>
    </div>
  );
}

/**
 * Image preview skeleton with progressive enhancement
 * Matches the PreviewArea component structure
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Image skeleton component
 */
export function ImageSkeleton({ className = '', showProgress = false }) {
  return (
    <div 
      className={cn('space-y-4 p-6', className)}
      role="status"
      aria-label="Loading image preview..."
    >
      {/* Header skeleton */}
      <div className="space-y-2">
        <SkeletonItem height="28px" width="50%" radius="sm" />
        <SkeletonItem height="16px" width="75%" radius="sm" />
      </div>

      {/* Main image area skeleton */}
      <div className="relative">
        <SkeletonItem 
          height="400px" 
          width="100%" 
          radius="lg"
          className="min-h-96"
        />
        
        {/* Center loading icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-full p-4">
            <div className="w-8 h-8 border-4 border-pastel-blue-300 border-t-pastel-blue-600 rounded-full animate-spin" />
          </div>
        </div>

        {/* Progress indicator if needed */}
        {showProgress && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 border-2 border-pastel-green-300 border-t-pastel-green-600 rounded-full animate-spin" />
                <SkeletonItem height="16px" width="60%" radius="sm" />
              </div>
              {/* Progress bar skeleton */}
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-pastel-blue-400 rounded-full animate-pulse" style={{ width: '45%' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons skeleton */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SkeletonItem height="40px" width="100%" radius="lg" className="sm:flex-1" />
        <SkeletonItem height="40px" width="100%" radius="lg" className="sm:flex-1" />
      </div>
    </div>
  );
}

/**
 * Gallery grid skeleton for gallery view
 * Provides loading state for image gallery
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Gallery skeleton component
 */
export function GallerySkeleton({ className = '', count = 12 }) {
  return (
    <div 
      className={cn('space-y-6', className)}
      role="status"
      aria-label="Loading gallery..."
    >
      {/* Header skeleton */}
      <div className="space-y-3">
        <SkeletonItem height="36px" width="40%" radius="sm" />
        <SkeletonItem height="20px" width="60%" radius="sm" />
      </div>

      {/* Controls skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2">
          <SkeletonItem width="20px" height="20px" radius="sm" />
          <SkeletonItem height="20px" width="100px" radius="sm" />
        </div>
        <SkeletonItem height="36px" width="120px" radius="lg" />
      </div>

      {/* Gallery grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="space-y-2">
            {/* Image thumbnail skeleton */}
            <SkeletonItem 
              height="200px" 
              width="100%" 
              radius="lg"
              className="aspect-square"
            />
            {/* Image info skeleton */}
            <div className="space-y-1">
              <SkeletonItem height="14px" width="80%" radius="sm" />
              <SkeletonItem height="12px" width="60%" radius="sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Navigation skeleton for mobile and desktop navigation
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Navigation skeleton component
 */
export function NavigationSkeleton({ className = '', variant = 'desktop' }) {
  if (variant === 'mobile') {
    return (
      <div 
        className={cn('flex items-center space-x-2 p-4', className)}
        role="status"
        aria-label="Loading navigation..."
      >
        {[1, 2, 3].map((item) => (
          <SkeletonItem key={item} height="40px" width="80px" radius="lg" />
        ))}
      </div>
    );
  }

  return (
    <div 
      className={cn('flex items-center justify-between p-4', className)}
      role="status"
      aria-label="Loading navigation..."
    >
      {/* Logo skeleton */}
      <div className="flex items-center space-x-3">
        <SkeletonItem width="32px" height="32px" radius="full" />
        <SkeletonItem height="24px" width="150px" radius="sm" />
      </div>

      {/* Navigation items skeleton */}
      <div className="hidden md:flex items-center space-x-6">
        {[1, 2, 3].map((item) => (
          <SkeletonItem key={item} height="20px" width="60px" radius="sm" />
        ))}
      </div>

      {/* User actions skeleton */}
      <div className="flex items-center space-x-3">
        <SkeletonItem width="24px" height="24px" radius="sm" />
        <SkeletonItem width="36px" height="36px" radius="full" />
      </div>
    </div>
  );
}

/**
 * Modal skeleton for dialog and modal loading states
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Modal skeleton component
 */
export function ModalSkeleton({ className = '' }) {
  return (
    <div 
      className={cn('space-y-6 p-6', className)}
      role="status"
      aria-label="Loading modal content..."
    >
      {/* Modal header skeleton */}
      <div className="space-y-2">
        <SkeletonItem height="28px" width="60%" radius="sm" />
        <SkeletonItem height="16px" width="80%" radius="sm" />
      </div>

      {/* Modal content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image side */}
        <div className="space-y-4">
          <SkeletonItem height="300px" width="100%" radius="lg" />
          <div className="space-y-2">
            <SkeletonItem height="16px" width="70%" radius="sm" />
            <SkeletonItem height="14px" width="90%" radius="sm" />
          </div>
        </div>

        {/* Actions side */}
        <div className="space-y-4">
          <SkeletonItem height="24px" width="50%" radius="sm" />
          
          {/* Action cards */}
          {[1, 2].map((item) => (
            <div key={item} className="p-4 border border-gray-200 rounded-lg space-y-3">
              <div className="flex items-start space-x-3">
                <SkeletonItem width="20px" height="20px" radius="sm" />
                <div className="flex-1 space-y-2">
                  <SkeletonItem height="18px" width="70%" radius="sm" />
                  <SkeletonItem height="14px" width="90%" radius="sm" />
                  <SkeletonItem height="36px" width="100%" radius="lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal footer skeleton */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
        <SkeletonItem height="40px" width="100%" radius="lg" className="sm:flex-1" />
        <SkeletonItem height="40px" width="100%" radius="lg" className="sm:flex-1" />
      </div>
    </div>
  );
}

/**
 * Main LoadingSkeleton component with variant selection
 * Provides easy access to different skeleton types
 * 
 * @param {Object} props - Component props
 * @param {string} props.variant - Skeleton variant type
 * @param {Object} props.variantProps - Props to pass to variant component
 * @returns {JSX.Element} Selected skeleton variant
 */
export function LoadingSkeleton({ variant = 'form', ...variantProps }) {
  const variants = {
    form: FormSkeleton,
    image: ImageSkeleton,
    gallery: GallerySkeleton,
    navigation: NavigationSkeleton,
    modal: ModalSkeleton,
    item: SkeletonItem
  };

  const SkeletonComponent = variants[variant] || FormSkeleton;
  
  return <SkeletonComponent {...variantProps} />;
}

// Export individual components for direct use
export default LoadingSkeleton;

/**
 * CSS for shimmer animation
 * Add to your global CSS or Tailwind configuration
 */
export const shimmerCSS = `
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
  
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
`;