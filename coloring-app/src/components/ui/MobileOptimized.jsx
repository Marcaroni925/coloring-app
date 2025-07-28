/**
 * Mobile-Optimized Components - Enhanced Touch Experience
 * 
 * UI/UX ENHANCEMENTS:
 * - Touch-friendly button sizes (44px minimum)
 * - Gesture support for common interactions
 * - Haptic feedback integration
 * - Improved mobile navigation patterns
 * - Enhanced form inputs for mobile keyboards
 * - Responsive typography and spacing
 * 
 * Addresses audit findings: Mobile usability, touch targets, gesture support
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../../lib/utils';

/**
 * Mobile-optimized button component with enhanced touch interactions
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Button content
 * @param {string} props.variant - Button variant
 * @param {string} props.size - Button size
 * @param {boolean} props.haptic - Enable haptic feedback
 * @param {Function} props.onTouchStart - Touch start handler
 * @param {Function} props.onClick - Click handler
 * @returns {JSX.Element} Mobile-optimized button
 */
export function MobileButton({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  haptic = false,
  onTouchStart,
  onClick,
  className = '',
  disabled = false,
  ...props 
}) {
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef(null);

  /**
   * Button variant styles with mobile optimizations
   */
  const getVariantStyles = () => {
    const variants = {
      primary: 'bg-pastel-blue-500 hover:bg-pastel-blue-600 active:bg-pastel-blue-700 text-white shadow-lg',
      secondary: 'bg-pastel-green-500 hover:bg-pastel-green-600 active:bg-pastel-green-700 text-white shadow-lg',
      outline: 'border-2 border-pastel-blue-500 text-pastel-blue-700 hover:bg-pastel-blue-50 active:bg-pastel-blue-100',
      ghost: 'text-pastel-blue-700 hover:bg-pastel-blue-50 active:bg-pastel-blue-100',
      danger: 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-lg'
    };
    
    return variants[variant] || variants.primary;
  };

  /**
   * Button size styles with minimum touch targets
   */
  const getSizeStyles = () => {
    const sizes = {
      small: 'min-h-[44px] px-4 py-2 text-sm font-handlee',
      medium: 'min-h-[48px] px-6 py-3 text-base font-handlee',
      large: 'min-h-[52px] px-8 py-4 text-lg font-handlee',
      icon: 'min-h-[44px] min-w-[44px] p-2'
    };
    
    return sizes[size] || sizes.medium;
  };

  /**
   * Haptic feedback for supported devices
   */
  const triggerHaptic = useCallback((intensity = 'light') => {
    if (!haptic || !navigator.vibrate) return;
    
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };
    
    navigator.vibrate(patterns[intensity] || patterns.light);
  }, [haptic]);

  /**
   * Enhanced touch handlers with visual feedback
   */
  const handleTouchStart = useCallback((e) => {
    setIsPressed(true);
    triggerHaptic('light');
    onTouchStart?.(e);
  }, [onTouchStart, triggerHaptic]);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleClick = useCallback((e) => {
    if (disabled) return;
    
    triggerHaptic('medium');
    onClick?.(e);
  }, [onClick, disabled, triggerHaptic]);

  /**
   * Touch event cleanup
   */
  useEffect(() => {
    const handleGlobalTouchEnd = () => setIsPressed(false);
    
    document.addEventListener('touchend', handleGlobalTouchEnd);
    document.addEventListener('touchcancel', handleGlobalTouchEnd);
    
    return () => {
      document.removeEventListener('touchend', handleGlobalTouchEnd);
      document.removeEventListener('touchcancel', handleGlobalTouchEnd);
    };
  }, []);

  const buttonClasses = cn(
    // Base styles
    'relative inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-blue-500',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    
    // Touch optimizations
    'touch-manipulation select-none',
    'active:scale-95 active:transition-transform active:duration-75',
    
    // Pressed state
    isPressed && 'scale-95 brightness-90',
    
    // Variant and size styles
    getVariantStyles(),
    getSizeStyles(),
    
    className
  );

  return (
    <button
      ref={buttonRef}
      className={buttonClasses}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Mobile-optimized input component with enhanced keyboard support
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Mobile-optimized input
 */
export function MobileInput({ 
  type = 'text', 
  className = '',
  onFocus,
  onBlur,
  ...props 
}) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  /**
   * Input type configurations for mobile keyboards
   */
  const getInputProps = () => {
    const configs = {
      email: {
        inputMode: 'email',
        autoCapitalize: 'none',
        autoCorrect: 'off',
        spellCheck: false
      },
      url: {
        inputMode: 'url',
        autoCapitalize: 'none',
        autoCorrect: 'off',
        spellCheck: false
      },
      tel: {
        inputMode: 'tel',
        autoComplete: 'tel'
      },
      search: {
        inputMode: 'search',
        autoCapitalize: 'none',
        role: 'searchbox'
      },
      number: {
        inputMode: 'numeric',
        pattern: '[0-9]*'
      }
    };
    
    return configs[type] || {};
  };

  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    onFocus?.(e);
  }, [onFocus]);

  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    onBlur?.(e);
  }, [onBlur]);

  const inputClasses = cn(
    // Base styles
    'w-full px-4 py-3 min-h-[44px] rounded-lg border font-handlee',
    'transition-all duration-200 ease-in-out',
    'placeholder:text-gray-500 placeholder:font-handlee',
    
    // Touch optimizations
    'touch-manipulation',
    
    // Focus styles
    isFocused 
      ? 'border-pastel-blue-500 ring-2 ring-pastel-blue-200 ring-opacity-50' 
      : 'border-gray-300 hover:border-gray-400',
    
    // Error styles (could be passed via props)
    props.error && 'border-red-500 ring-2 ring-red-200',
    
    className
  );

  return (
    <input
      ref={inputRef}
      type={type}
      className={inputClasses}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...getInputProps()}
      {...props}
    />
  );
}

/**
 * Mobile-optimized textarea with auto-resize
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Mobile-optimized textarea
 */
export function MobileTextarea({ 
  className = '',
  autoResize = true,
  minRows = 3,
  maxRows = 8,
  onInput,
  ...props 
}) {
  const textareaRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  /**
   * Auto-resize functionality
   */
  const handleAutoResize = useCallback(() => {
    if (!autoResize || !textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const minHeight = minRows * 24; // Approximate line height
    const maxHeight = maxRows * 24;
    
    // Reset height to calculate scroll height
    textarea.style.height = 'auto';
    
    // Calculate new height
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
    
    textarea.style.height = `${newHeight}px`;
  }, [autoResize, minRows, maxRows]);

  const handleInput = useCallback((e) => {
    handleAutoResize();
    onInput?.(e);
  }, [onInput, handleAutoResize]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  useEffect(() => {
    handleAutoResize();
  }, [handleAutoResize]);

  const textareaClasses = cn(
    // Base styles
    'w-full px-4 py-3 rounded-lg border font-handlee resize-none',
    'transition-all duration-200 ease-in-out',
    'placeholder:text-gray-500 placeholder:font-handlee',
    
    // Touch optimizations
    'touch-manipulation',
    
    // Focus styles
    isFocused 
      ? 'border-pastel-blue-500 ring-2 ring-pastel-blue-200 ring-opacity-50' 
      : 'border-gray-300 hover:border-gray-400',
    
    className
  );

  return (
    <textarea
      ref={textareaRef}
      className={textareaClasses}
      onInput={handleInput}
      onFocus={handleFocus}
      onBlur={handleBlur}
      rows={minRows}
      {...props}
    />
  );
}

/**
 * Swipe gesture handler hook
 * 
 * @param {Object} options - Swipe configuration
 * @returns {Object} Swipe event handlers
 */
export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  preventScroll = false
} = {}) {
  const startTouch = useRef(null);
  const currentTouch = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (preventScroll) {
      e.preventDefault();
    }
    
    const touch = e.touches[0];
    startTouch.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  }, [preventScroll]);

  const handleTouchMove = useCallback((e) => {
    if (!startTouch.current) return;
    
    if (preventScroll) {
      e.preventDefault();
    }
    
    const touch = e.touches[0];
    currentTouch.current = {
      x: touch.clientX,
      y: touch.clientY
    };
  }, [preventScroll]);

  const handleTouchEnd = useCallback((e) => {
    if (!startTouch.current || !currentTouch.current) {
      startTouch.current = null;
      currentTouch.current = null;
      return;
    }

    const deltaX = currentTouch.current.x - startTouch.current.x;
    const deltaY = currentTouch.current.y - startTouch.current.y;
    const deltaTime = Date.now() - startTouch.current.time;

    // Minimum swipe speed (pixels per ms)
    const minSpeed = 0.3;
    const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;

    if (speed < minSpeed) {
      startTouch.current = null;
      currentTouch.current = null;
      return;
    }

    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          onSwipeRight?.(e);
        } else {
          onSwipeLeft?.(e);
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          onSwipeDown?.(e);
        } else {
          onSwipeUp?.(e);
        }
      }
    }

    startTouch.current = null;
    currentTouch.current = null;
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
}

/**
 * Mobile-optimized card component with swipe support
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Mobile-optimized card
 */
export function MobileCard({ 
  children, 
  onSwipeLeft, 
  onSwipeRight,
  className = '',
  ...props 
}) {
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft,
    onSwipeRight,
    threshold: 100
  });

  const cardClasses = cn(
    'bg-white rounded-lg shadow-sm border border-gray-200 p-4',
    'touch-manipulation select-none',
    'transition-transform duration-150 ease-in-out',
    'active:scale-[0.98]',
    className
  );

  return (
    <div
      className={cardClasses}
      {...swipeHandlers}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Mobile-optimized bottom sheet component
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Bottom sheet component
 */
export function MobileBottomSheet({ 
  isOpen, 
  onClose, 
  children, 
  title,
  className = '' 
}) {
  const sheetRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const swipeHandlers = useSwipeGesture({
    onSwipeDown: onClose,
    threshold: 100,
    preventScroll: true
  });

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className={cn(
          'absolute inset-0 bg-black transition-opacity duration-300',
          isOpen ? 'opacity-50' : 'opacity-0'
        )}
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div 
        ref={sheetRef}
        className={cn(
          'absolute bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-xl',
          'transform transition-transform duration-300 ease-out',
          'max-h-[90vh] overflow-hidden',
          isOpen ? 'translate-y-0' : 'translate-y-full',
          className
        )}
        {...swipeHandlers}
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        
        {/* Header */}
        {title && (
          <div className="px-4 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-handlee font-semibold text-gray-900">
              {title}
            </h3>
          </div>
        )}
        
        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

export default {
  MobileButton,
  MobileInput,
  MobileTextarea,
  MobileCard,
  MobileBottomSheet,
  useSwipeGesture
};