/**
 * Helper Utilities for Coloring Book Generator Application
 * 
 * This file contains reusable utility functions for common operations
 * like validation, formatting, DOM manipulation, and data processing.
 * 
 * Evidence: architecture.md Section 4.4 - Utility Functions
 * Best Practice: DRY principle - Don't Repeat Yourself
 */

import { VALIDATION_CONFIG, ERROR_MESSAGES, BREAKPOINTS } from './constants.js';

/**
 * Form Validation Helpers
 * Evidence: architecture.md Section 3.2 Form Validation
 */

/**
 * Validates a single form field based on configuration
 * @param {string} fieldName - The name of the field to validate
 * @param {any} value - The value to validate
 * @param {Object} config - Validation configuration (optional, uses VALIDATION_CONFIG by default)
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validateField = (fieldName, value, config = VALIDATION_CONFIG) => {
  const fieldConfig = config[fieldName];
  
  if (!fieldConfig) {
    return { isValid: true, message: '' };
  }
  
  // Required field validation
  if (fieldConfig.required && (!value || value.toString().trim().length === 0)) {
    return { isValid: false, message: fieldConfig.errorMessage };
  }
  
  // Skip validation for optional fields that are empty
  if (!fieldConfig.required && (!value || value.toString().trim().length === 0)) {
    return { isValid: true, message: '' };
  }
  
  // String length validation
  if (typeof value === 'string') {
    if (fieldConfig.minLength && value.length < fieldConfig.minLength) {
      return { isValid: false, message: fieldConfig.errorMessage };
    }
    
    if (fieldConfig.maxLength && value.length > fieldConfig.maxLength) {
      return { isValid: false, message: `Maximum ${fieldConfig.maxLength} characters allowed` };
    }
  }
  
  // Options validation (for select fields)
  if (fieldConfig.options && value && !fieldConfig.options.includes(value)) {
    return { isValid: false, message: fieldConfig.errorMessage };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validates the entire form data object
 * @param {Object} formData - The form data to validate
 * @returns {Object} { isValid: boolean, errors: Object, summary: string }
 */
export const validateForm = (formData = {}) => {
  const errors = {};
  let isValid = true;
  
  // Apply defaults for empty optional fields - Evidence: architecture.md Section 3.2 Form Validation
  const formDataWithDefaults = {
    prompt: '',
    theme: '',
    complexity: 'medium',
    ageGroup: 'kids',
    border: false,
    lineThickness: 'medium',
    ...formData,
    // Override with defaults only if empty
    complexity: formData.complexity || 'medium',
    ageGroup: formData.ageGroup || 'kids', 
    lineThickness: formData.lineThickness || 'medium'
  };
  
  // Validate each field
  Object.keys(VALIDATION_CONFIG).forEach(fieldName => {
    const result = validateField(fieldName, formDataWithDefaults[fieldName]);
    if (!result.isValid) {
      errors[fieldName] = result;
      isValid = false;
    }
  });
  
  // Generate summary message
  const summary = isValid 
    ? 'All fields are valid' 
    : `${Object.keys(errors).length} field(s) need attention`;
  
  return { isValid, errors, summary };
};

/**
 * Responsive Design Helpers
 * Evidence: architecture.md Section 2.4 Responsive Design
 */

/**
 * Checks if the current viewport is mobile
 * @returns {boolean}
 */
export const isMobileViewport = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= BREAKPOINTS.mobile;
};

/**
 * Checks if the current viewport is tablet
 * @returns {boolean}
 */
export const isTabletViewport = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > BREAKPOINTS.mobile && window.innerWidth <= BREAKPOINTS.tablet;
};

/**
 * Checks if the current viewport is desktop
 * @returns {boolean}
 */
export const isDesktopViewport = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > BREAKPOINTS.tablet;
};

/**
 * Gets the current viewport type
 * @returns {string} 'mobile' | 'tablet' | 'desktop'
 */
export const getViewportType = () => {
  if (isMobileViewport()) return 'mobile';
  if (isTabletViewport()) return 'tablet';
  return 'desktop';
};

/**
 * Animation and UI Helpers
 * Evidence: architecture.md Section 2.3 Animations
 */

/**
 * Creates a debounced function that delays execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Creates a throttled function that limits execution frequency
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Checks if the user prefers reduced motion
 * @returns {boolean}
 */
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * String and Text Helpers
 */

/**
 * Capitalizes the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Truncates a string to a specified length with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
export const truncateText = (str, maxLength) => {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
};

/**
 * Removes extra whitespace from a string
 * @param {string} str - String to clean
 * @returns {string} Cleaned string
 */
export const cleanText = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.trim().replace(/\s+/g, ' ');
};

/**
 * API and Error Handling Helpers
 * Evidence: architecture.md Section 4.1 API Integration
 */

/**
 * Formats API errors into user-friendly messages
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
export const formatApiError = (error) => {
  if (!error) return ERROR_MESSAGES.apiGeneral;
  
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('content_policy') || message.includes('content policy')) {
    return ERROR_MESSAGES.apiContentPolicy;
  }
  
  if (message.includes('rate_limit') || message.includes('429') || message.includes('too many')) {
    return ERROR_MESSAGES.apiRateLimit;
  }
  
  if (message.includes('timeout')) {
    return ERROR_MESSAGES.apiTimeout;
  }
  
  if (message.includes('family-friendly')) {
    return ERROR_MESSAGES.apiFamilyFriendly;
  }
  
  return ERROR_MESSAGES.apiGeneral;
};

/**
 * Creates a delay promise for retry logic
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retries an async operation with exponential backoff
 * @param {Function} operation - Async function to retry
 * @param {number} maxAttempts - Maximum retry attempts
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} Promise that resolves with operation result
 */
export const retryWithBackoff = async (operation, maxAttempts = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      const delayMs = baseDelay * Math.pow(2, attempt - 1);
      await delay(delayMs);
    }
  }
  
  throw lastError;
};

/**
 * DOM and Event Helpers
 */

/**
 * Smoothly scrolls an element into view
 * @param {string|Element} elementOrSelector - Element or CSS selector
 * @param {Object} options - Scroll options
 */
export const scrollToElement = (elementOrSelector, options = {}) => {
  const element = typeof elementOrSelector === 'string' 
    ? document.querySelector(elementOrSelector)
    : elementOrSelector;
    
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
      ...options
    });
  }
};

/**
 * Copies text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy text:', error);
    return false;
  }
};

/**
 * Downloads a blob as a file
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename for download
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Data Processing Helpers
 */

/**
 * Deep clones an object
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    Object.keys(obj).forEach(key => {
      clonedObj[key] = deepClone(obj[key]);
    });
    return clonedObj;
  }
};

/**
 * Checks if two objects are deeply equal
 * @param {any} a - First object
 * @param {any} b - Second object
 * @returns {boolean} True if objects are equal
 */
export const deepEqual = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'object') {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    
    if (aKeys.length !== bKeys.length) return false;
    
    return aKeys.every(key => deepEqual(a[key], b[key]));
  }
  
  return false;
};

/**
 * Performance and Debug Helpers
 */

/**
 * Measures execution time of a function
 * @param {Function} fn - Function to measure
 * @param {string} label - Label for the measurement
 * @returns {any} Function result
 */
export const measurePerformance = async (fn, label = 'Operation') => {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`${label} took ${(endTime - startTime).toFixed(2)}ms`);
  }
  
  return result;
};

/**
 * Creates a console logger with conditional output
 * @param {string} namespace - Logger namespace
 * @returns {Object} Logger object with log methods
 */
export const createLogger = (namespace) => ({
  log: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${namespace}]`, ...args);
    }
  },
  warn: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[${namespace}]`, ...args);
    }
  },
  error: (...args) => {
    console.error(`[${namespace}]`, ...args);
  }
});