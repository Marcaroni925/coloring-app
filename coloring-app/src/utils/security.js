/**
 * Security Utilities for Coloring Book Creator
 * 
 * SECURITY ENHANCEMENTS:
 * - Client-side input sanitization with DOMPurify
 * - Content safety validation
 * - Authentication token management
 * - XSS protection utilities
 * 
 * Usage: Import and use throughout the application for consistent security
 */

import DOMPurify from 'dompurify';

/**
 * Client-side input sanitization utility
 * Sanitizes user input to prevent XSS and injection attacks
 * 
 * @param {string} input - Raw user input
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized input safe for display/processing
 */
export function sanitizeUserInput(input, options = {}) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const defaultOptions = {
    ALLOWED_TAGS: [], // No HTML tags by default
    ALLOWED_ATTR: [],
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    ...options
  };

  // Sanitize with DOMPurify
  const sanitized = DOMPurify.sanitize(input, defaultOptions);
  
  // Additional cleanup
  return sanitized
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .slice(0, 1000); // Reasonable length limit
}

/**
 * Enhanced content safety validator for family-friendly filtering
 * Provides detailed feedback for content moderation
 * 
 * @param {string} text - Text content to validate
 * @returns {Object} Detailed validation result
 */
export function validateContentSafety(text) {
  if (!text || typeof text !== 'string') {
    return {
      isAppropriate: false,
      issues: ['Empty or invalid content'],
      suggestions: ['Please provide valid text content']
    };
  }

  const lowerText = text.toLowerCase();
  const issues = [];
  const suggestions = [];

  // Family-friendly keyword filtering
  const inappropriateTerms = [
    'violence', 'blood', 'weapon', 'death', 'kill',
    'sexual', 'nude', 'explicit', 'inappropriate',
    'drug', 'alcohol', 'cigarette', 'smoking',
    'scary', 'horror', 'demon', 'evil'
  ];

  const foundInappropriate = inappropriateTerms.filter(term => 
    lowerText.includes(term)
  );

  if (foundInappropriate.length > 0) {
    issues.push(`Contains inappropriate terms: ${foundInappropriate.join(', ')}`);
    suggestions.push('Try using more family-friendly language');
  }

  // Check for excessive length
  if (text.length > 500) {
    issues.push('Content too long');
    suggestions.push('Please keep descriptions under 500 characters');
  }

  // Check for meaningful content
  if (text.trim().length < 3) {
    issues.push('Content too short');
    suggestions.push('Please provide a more detailed description');
  }

  // Positive content suggestions
  if (issues.length === 0) {
    const positiveKeywords = ['nature', 'animals', 'flowers', 'fantasy', 'magical', 'beautiful'];
    const hasPositive = positiveKeywords.some(keyword => lowerText.includes(keyword));
    
    if (!hasPositive) {
      suggestions.push('Consider adding themes like animals, nature, or fantasy for better results');
    }
  }

  return {
    isAppropriate: issues.length === 0,
    issues,
    suggestions,
    cleanText: sanitizeUserInput(text)
  };
}

/**
 * Secure authentication token validator
 * Validates JWT tokens and extracts safe user information
 * 
 * @param {string} token - Firebase ID token
 * @returns {Object} Validation result with user info
 */
export function validateAuthToken(token) {
  if (!token || typeof token !== 'string') {
    return {
      isValid: false,
      error: 'Invalid token format',
      user: null
    };
  }

  // Basic format validation
  if (!token.startsWith('ey') || token.split('.').length !== 3) {
    return {
      isValid: false,
      error: 'Malformed JWT token',
      user: null
    };
  }

  try {
    // Decode payload (without verification - server handles that)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return {
        isValid: false,
        error: 'Token expired',
        user: null
      };
    }

    // Extract safe user information
    const user = {
      uid: payload.sub || payload.user_id,
      email: payload.email,
      emailVerified: payload.email_verified || false,
      name: payload.name,
      picture: payload.picture
    };

    return {
      isValid: true,
      user,
      tokenAge: payload.iat ? Math.floor((Date.now() / 1000) - payload.iat) : null
    };

  } catch (error) {
    return {
      isValid: false,
      error: 'Token parsing failed',
      user: null
    };
  }
}

/**
 * Secure URL validator for image URLs
 * Validates URLs to prevent SSRF and malicious redirects
 * 
 * @param {string} url - URL to validate
 * @returns {Object} Validation result
 */
export function validateImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'Invalid URL' };
  }

  try {
    const urlObj = new URL(url);
    
    // Allow data URLs for generated images
    if (url.startsWith('data:image/')) {
      return { isValid: true, type: 'data-url' };
    }

    // Allow HTTPS URLs only
    if (urlObj.protocol !== 'https:') {
      return { isValid: false, error: 'Only HTTPS URLs allowed' };
    }

    // Block local/private IPs
    const hostname = urlObj.hostname;
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.includes('169.254.')
    ) {
      return { isValid: false, error: 'Local URLs not allowed' };
    }

    return { isValid: true, type: 'https-url' };

  } catch (error) {
    return { isValid: false, error: 'Malformed URL' };
  }
}

/**
 * Rate limiting helper for client-side throttling
 * Implements client-side rate limiting to reduce server load
 * 
 * @param {string} action - Action identifier
 * @param {number} limit - Max actions per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} Whether action is allowed
 */
export function checkRateLimit(action, limit = 5, windowMs = 60000) {
  const now = Date.now();
  const key = `rateLimit_${action}`;
  
  try {
    const stored = localStorage.getItem(key);
    const data = stored ? JSON.parse(stored) : { count: 0, resetTime: now + windowMs };
    
    // Reset if window expired
    if (now > data.resetTime) {
      data.count = 0;
      data.resetTime = now + windowMs;
    }
    
    // Check limit
    if (data.count >= limit) {
      return false;
    }
    
    // Increment and store
    data.count++;
    localStorage.setItem(key, JSON.stringify(data));
    
    return true;
    
  } catch (error) {
    // If localStorage fails, allow the action
    console.warn('Rate limiting storage failed:', error);
    return true;
  }
}

/**
 * Secure error message formatter
 * Prevents information leakage in error messages
 * 
 * @param {Error} error - Original error
 * @param {boolean} isDevelopment - Whether in development mode
 * @returns {string} Safe error message for user display
 */
export function formatSecureErrorMessage(error, isDevelopment = false) {
  // In development, show more details
  if (isDevelopment && process.env.NODE_ENV === 'development') {
    return error.message || 'Unknown error occurred';
  }

  // In production, show generic messages
  const errorTypes = {
    'Network Error': 'Connection failed. Please check your internet connection.',
    'TypeError': 'Invalid input provided. Please try again.',
    'ValidationError': 'Please check your input and try again.',
    'AuthError': 'Authentication failed. Please sign in again.',
    'RateLimitError': 'Too many requests. Please wait a moment and try again.',
    'ContentError': 'Content not suitable for family-friendly generation. Please modify your prompt.'
  };

  // Try to categorize the error
  for (const [type, message] of Object.entries(errorTypes)) {
    if (error.name?.includes(type) || error.message?.includes(type.toLowerCase())) {
      return message;
    }
  }

  // Generic fallback
  return 'Something went wrong. Please try again.';
}

/**
 * Content Security Policy nonce generator
 * Generates nonce for CSP-compliant inline scripts
 * 
 * @returns {string} Random nonce value
 */
export function generateCSPNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Export all security utilities
 */
export default {
  sanitizeUserInput,
  validateContentSafety,
  validateAuthToken,
  validateImageUrl,
  checkRateLimit,
  formatSecureErrorMessage,
  generateCSPNonce
};