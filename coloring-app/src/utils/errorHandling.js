/**
 * Standardized Error Handling Utilities
 * 
 * CODE QUALITY IMPROVEMENTS:
 * - Consistent error handling patterns across the application
 * - Structured error classification and formatting
 * - User-friendly error messages with actionable feedback
 * - Development vs production error handling
 * - Error reporting and analytics integration ready
 * 
 * Addresses audit findings: Inconsistent error handling, generic error messages
 */

/**
 * Error severity levels for classification and handling
 */
export const ERROR_SEVERITY = {
  LOW: 'low',           // Non-critical errors, app continues normally
  MEDIUM: 'medium',     // Important errors, some features may be affected  
  HIGH: 'high',         // Critical errors, major functionality impacted
  CRITICAL: 'critical'  // System-breaking errors, app may be unusable
};

/**
 * Error categories for better organization and handling
 */
export const ERROR_CATEGORIES = {
  NETWORK: 'network',
  VALIDATION: 'validation', 
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  API: 'api',
  UI: 'ui',
  SYSTEM: 'system',
  USER_INPUT: 'user_input',
  GENERATION: 'generation',
  GALLERY: 'gallery'
};

/**
 * User-friendly error messages mapped to technical error patterns
 * Provides consistent, helpful messaging while hiding technical details
 */
const ERROR_MESSAGES = {
  // Network errors
  'Failed to fetch': 'Unable to connect to our servers. Please check your internet connection and try again.',
  'NetworkError': 'Connection problem detected. Please verify your internet connection.',
  'ERR_NETWORK': 'Network error occurred. Please try again in a moment.',
  'ERR_INTERNET_DISCONNECTED': 'You appear to be offline. Please check your internet connection.',
  
  // API errors
  'API_RATE_LIMIT': 'Too many requests at once. Please wait a moment before trying again.',
  'API_QUOTA_EXCEEDED': 'Daily usage limit reached. Please try again tomorrow or contact support.',
  'API_KEY_INVALID': 'Service temporarily unavailable. Please try again later.',
  'API_TIMEOUT': 'Request timed out. The service may be experiencing high load. Please try again.',
  
  // Authentication errors
  'AUTH_USER_NOT_FOUND': 'Account not found. Please check your credentials or create a new account.',
  'AUTH_WRONG_PASSWORD': 'Incorrect password. Please try again or reset your password.',
  'AUTH_TOO_MANY_REQUESTS': 'Too many failed login attempts. Please wait before trying again.',
  'AUTH_EMAIL_NOT_VERIFIED': 'Please verify your email address before continuing.',
  'AUTH_ACCOUNT_DISABLED': 'Your account has been disabled. Please contact support.',
  
  // Validation errors
  'VALIDATION_REQUIRED': 'Please fill in all required fields.',
  'VALIDATION_EMAIL': 'Please enter a valid email address.',
  'VALIDATION_PASSWORD': 'Password must be at least 8 characters long.',
  'VALIDATION_CONTENT': 'Please ensure your content is family-friendly and appropriate.',
  
  // Image generation errors
  'GENERATION_FAILED': 'Failed to generate your coloring page. Please try a different description.',
  'GENERATION_TIMEOUT': 'Image generation is taking longer than expected. Please try again.',
  'GENERATION_CONTENT_POLICY': 'Your description doesn\'t meet our family-friendly guidelines. Please try something different.',
  'GENERATION_QUOTA': 'You\'ve reached your generation limit. Please wait before creating more images.',
  
  // Gallery errors
  'GALLERY_SAVE_FAILED': 'Unable to save to your gallery. Please try again.',
  'GALLERY_DELETE_FAILED': 'Unable to delete the image. Please try again.',
  'GALLERY_LOAD_FAILED': 'Unable to load your gallery. Please refresh the page.',
  
  // PDF errors
  'PDF_GENERATION_FAILED': 'Unable to create PDF. Please try downloading again.',
  'PDF_TOO_LARGE': 'Image is too large for PDF generation. Please try a different image.',
  
  // Default fallbacks
  'UNKNOWN_ERROR': 'Something unexpected happened. Please try again.',
  'GENERIC_ERROR': 'An error occurred. Please try again or contact support if the problem persists.'
};

/**
 * Error classification rules for automatic categorization
 * Maps error patterns to categories and severity levels
 */
const ERROR_CLASSIFICATION = [
  // Network errors
  {
    patterns: ['fetch', 'network', 'connection', 'offline', 'ERR_NETWORK'],
    category: ERROR_CATEGORIES.NETWORK,
    severity: ERROR_SEVERITY.MEDIUM
  },
  
  // Authentication errors
  {
    patterns: ['auth', 'login', 'token', 'unauthorized', 'forbidden'],
    category: ERROR_CATEGORIES.AUTHENTICATION,
    severity: ERROR_SEVERITY.HIGH
  },
  
  // API errors
  {
    patterns: ['rate limit', 'quota', 'api key', 'timeout', '429', '503'],
    category: ERROR_CATEGORIES.API,
    severity: ERROR_SEVERITY.MEDIUM
  },
  
  // Validation errors
  {
    patterns: ['validation', 'required', 'invalid', 'format'],
    category: ERROR_CATEGORIES.VALIDATION,
    severity: ERROR_SEVERITY.LOW
  },
  
  // Generation errors
  {
    patterns: ['generation', 'dalle', 'openai', 'image'],
    category: ERROR_CATEGORIES.GENERATION,
    severity: ERROR_SEVERITY.MEDIUM
  }
];

/**
 * Enhanced Error class with additional context and metadata
 * Provides structured error information for better handling
 */
export class AppError extends Error {
  constructor(message, options = {}) {
    super(message);
    
    this.name = 'AppError';
    this.category = options.category || ERROR_CATEGORIES.SYSTEM;
    this.severity = options.severity || ERROR_SEVERITY.MEDIUM;
    this.code = options.code;
    this.context = options.context || {};
    this.timestamp = new Date().toISOString();
    this.userMessage = options.userMessage;
    this.actionable = options.actionable || false;
    this.retryable = options.retryable || false;
    
    // Capture stack trace for debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
  
  /**
   * Converts error to JSON for logging/reporting
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
      userMessage: this.userMessage,
      actionable: this.actionable,
      retryable: this.retryable,
      stack: this.stack
    };
  }
}

/**
 * Classifies errors based on message content and patterns
 * Automatically categorizes and assigns severity levels
 * 
 * @param {Error|string} error - Error to classify
 * @returns {Object} Classification result
 */
export function classifyError(error) {
  const message = typeof error === 'string' ? error : (error.message || '');
  const lowerMessage = message.toLowerCase();
  
  // Check classification rules
  for (const rule of ERROR_CLASSIFICATION) {
    const matches = rule.patterns.some(pattern => 
      lowerMessage.includes(pattern.toLowerCase())
    );
    
    if (matches) {
      return {
        category: rule.category,
        severity: rule.severity,
        matched: rule.patterns
      };
    }
  }
  
  // Default classification
  return {
    category: ERROR_CATEGORIES.SYSTEM,
    severity: ERROR_SEVERITY.MEDIUM,
    matched: []
  };
}

/**
 * Formats errors into user-friendly messages with actionable guidance
 * Hides technical details while providing helpful information
 * 
 * @param {Error|string} error - Error to format
 * @param {Object} options - Formatting options
 * @returns {Object} Formatted error information
 */
export function formatError(error, options = {}) {
  const {
    includeStack = false,
    isDevelopment = process.env.NODE_ENV === 'development'
  } = options;
  
  let originalMessage = '';
  let errorCode = null;
  let stack = null;
  
  if (error instanceof Error) {
    originalMessage = error.message;
    errorCode = error.code;
    stack = error.stack;
  } else if (typeof error === 'string') {
    originalMessage = error;
  } else {
    originalMessage = 'Unknown error occurred';
  }
  
  // Classify the error
  const classification = classifyError(originalMessage);
  
  // Find user-friendly message
  let userMessage = ERROR_MESSAGES['UNKNOWN_ERROR'];
  
  for (const [pattern, message] of Object.entries(ERROR_MESSAGES)) {
    if (originalMessage.toLowerCase().includes(pattern.toLowerCase())) {
      userMessage = message;
      break;
    }
  }
  
  // Generate suggestions based on error category
  const suggestions = generateErrorSuggestions(classification.category, originalMessage);
  
  return {
    userMessage,
    originalMessage: isDevelopment ? originalMessage : undefined,
    category: classification.category,
    severity: classification.severity,
    code: errorCode,
    suggestions,
    timestamp: new Date().toISOString(),
    stack: (isDevelopment && includeStack) ? stack : undefined,
    retryable: isRetryableError(classification.category, originalMessage)
  };
}

/**
 * Generates contextual suggestions for error resolution
 * Provides actionable next steps based on error type
 * 
 * @param {string} category - Error category
 * @param {string} message - Original error message
 * @returns {Array} Array of suggestion strings
 */
function generateErrorSuggestions(category, message) {
  const suggestions = [];
  
  switch (category) {
    case ERROR_CATEGORIES.NETWORK:
      suggestions.push(
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a moment and try again'
      );
      break;
      
    case ERROR_CATEGORIES.AUTHENTICATION:
      suggestions.push(
        'Sign out and sign back in',
        'Check your email and password',
        'Clear your browser cache'
      );
      break;
      
    case ERROR_CATEGORIES.API:
      if (message.includes('rate limit')) {
        suggestions.push(
          'Wait a few minutes before trying again',
          'Reduce the frequency of your requests'
        );
      } else {
        suggestions.push(
          'Try again in a few moments',
          'Check the service status page'
        );
      }
      break;
      
    case ERROR_CATEGORIES.VALIDATION:
      suggestions.push(
        'Check all required fields are filled',
        'Verify your input format',
        'Ensure content is family-friendly'
      );
      break;
      
    case ERROR_CATEGORIES.GENERATION:
      suggestions.push(
        'Try a different description',
        'Make your prompt more specific',
        'Ensure content is appropriate for all ages'
      );
      break;
      
    case ERROR_CATEGORIES.GALLERY:
      suggestions.push(
        'Try refreshing your gallery',
        'Check your internet connection',
        'Make sure you\'re signed in'
      );
      break;
      
    default:
      suggestions.push(
        'Try refreshing the page',
        'Contact support if the problem persists'
      );
  }
  
  return suggestions;
}

/**
 * Determines if an error is retryable based on category and message
 * Helps UI components decide whether to show retry options
 * 
 * @param {string} category - Error category
 * @param {string} message - Error message
 * @returns {boolean} Whether the error is retryable
 */
function isRetryableError(category, message) {
  const nonRetryablePatterns = [
    'validation',
    'unauthorized',
    'forbidden',
    'not found',
    'invalid credentials',
    'account disabled'
  ];
  
  // Check if error is explicitly non-retryable
  const isNonRetryable = nonRetryablePatterns.some(pattern =>
    message.toLowerCase().includes(pattern)
  );
  
  if (isNonRetryable) {
    return false;
  }
  
  // Category-based retry logic
  switch (category) {
    case ERROR_CATEGORIES.NETWORK:
    case ERROR_CATEGORIES.API:
    case ERROR_CATEGORIES.GENERATION:
    case ERROR_CATEGORIES.GALLERY:
      return true;
      
    case ERROR_CATEGORIES.VALIDATION:
    case ERROR_CATEGORIES.AUTHENTICATION:
      return false;
      
    default:
      return true;
  }
}

/**
 * Error boundary helper for React error boundaries
 * Provides consistent error boundary functionality
 * 
 * @param {Error} error - React error boundary error
 * @param {Object} errorInfo - React error boundary info
 * @returns {Object} Processed error information
 */
export function handleReactError(error, errorInfo) {
  const formattedError = formatError(error, { includeStack: true });
  
  // Log error for debugging
  console.error('React Error Boundary:', {
    error: formattedError,
    componentStack: errorInfo.componentStack
  });
  
  // Create user-facing error
  return {
    ...formattedError,
    componentStack: errorInfo.componentStack,
    type: 'react_error'
  };
}

/**
 * Promise rejection handler for unhandled promise rejections
 * Provides global error handling for async operations
 * 
 * @param {Event} event - Unhandled rejection event
 */
export function handleUnhandledRejection(event) {
  const error = event.reason;
  const formattedError = formatError(error);
  
  console.error('Unhandled Promise Rejection:', formattedError);
  
  // Prevent default browser behavior
  event.preventDefault();
  
  return formattedError;
}

/**
 * Error logging utility for development and production
 * Provides structured error logging with context
 * 
 * @param {Error|string} error - Error to log
 * @param {Object} context - Additional context
 * @param {string} level - Log level (error, warn, info)
 */
export function logError(error, context = {}, level = 'error') {
  const formattedError = formatError(error, { includeStack: true });
  
  const logEntry = {
    ...formattedError,
    context,
    level,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };
  
  // Console logging based on level
  switch (level) {
    case 'error':
      console.error('Application Error:', logEntry);
      break;
    case 'warn':
      console.warn('Application Warning:', logEntry);
      break;
    case 'info':
      console.info('Application Info:', logEntry);
      break;
    default:
      console.log('Application Log:', logEntry);
  }
  
  // In production, this would integrate with error reporting service
  // Example: Sentry.captureException(error, { extra: logEntry });
  
  return logEntry;
}

/**
 * Creates a standardized error handler function
 * Useful for consistent error handling across components
 * 
 * @param {string} context - Context identifier for the error
 * @param {Function} onError - Optional error callback
 * @returns {Function} Error handler function
 */
export function createErrorHandler(context, onError) {
  return (error) => {
    const formattedError = formatError(error);
    
    // Log the error with context
    logError(error, { context }, 'error');
    
    // Call provided error handler
    if (onError && typeof onError === 'function') {
      onError(formattedError);
    }
    
    return formattedError;
  };
}

/**
 * Export all error handling utilities
 */
export default {
  AppError,
  ERROR_SEVERITY,
  ERROR_CATEGORIES,
  classifyError,
  formatError,
  handleReactError,
  handleUnhandledRejection,
  logError,
  createErrorHandler
};