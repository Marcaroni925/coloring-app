/**
 * Shared Winston Logger Configuration for Coloring Book Creator API
 * 
 * Production-ready logging system with multiple levels, file rotation,
 * and structured output for monitoring and debugging.
 */

import winston from 'winston';
import path from 'path';

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

/**
 * Custom format for console output in development
 */
const consoleFormat = printf(({ timestamp, level, message, service, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
  return `${timestamp} [${service || 'app'}] ${level}: ${message} ${metaStr}`;
});

/**
 * Create logger instance with environment-based configuration
 */
const createLogger = (serviceName = 'app') => {
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
      timestamp(),
      errors({ stack: true }),
      json()
    ),
    defaultMeta: { service: serviceName },
    transports: [
      // Error logs
      new winston.transports.File({ 
        filename: path.join(process.cwd(), 'logs', 'error.log'), 
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        tailable: true
      }),
      
      // Combined logs
      new winston.transports.File({ 
        filename: path.join(process.cwd(), 'logs', 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        tailable: true
      })
    ],
    
    // Handle uncaught exceptions and rejections
    exceptionHandlers: [
      new winston.transports.File({ 
        filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
        maxsize: 5242880,
        maxFiles: 3
      })
    ],
    
    rejectionHandlers: [
      new winston.transports.File({ 
        filename: path.join(process.cwd(), 'logs', 'rejections.log'),
        maxsize: 5242880,
        maxFiles: 3
      })
    ],
    
    exitOnError: false
  });

  // Add console transport for development
  if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'HH:mm:ss' }),
        consoleFormat
      )
    }));
  }

  return logger;
};

/**
 * Application-wide logger instances
 */
export const appLogger = createLogger('app');
export const serverLogger = createLogger('server');
export const apiLogger = createLogger('api');
export const promptLogger = createLogger('prompt-refinement');

/**
 * Logger factory for creating service-specific loggers
 */
export const getLogger = (serviceName) => createLogger(serviceName);

/**
 * Enhanced logging methods with structured data
 */
export const loggerUtils = {
  /**
   * Log API request with structured data
   */
  logRequest: (logger, req, additionalData = {}) => {
    logger.info('API Request', {
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date().toISOString(),
      ...additionalData
    });
  },

  /**
   * Log API response with structured data
   */
  logResponse: (logger, req, res, responseTime, additionalData = {}) => {
    logger.info('API Response', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      ...additionalData
    });
  },

  /**
   * Log error with enhanced context
   */
  logError: (logger, error, context = {}) => {
    logger.error('Application Error', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString(),
      ...context
    });
  },

  /**
   * Log performance metrics
   */
  logPerformance: (logger, operation, duration, metadata = {}) => {
    logger.info('Performance Metric', {
      operation,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  },

  /**
   * Log health check results
   */
  logHealthCheck: (logger, component, status, details = {}) => {
    const level = status === 'healthy' ? 'info' : 'warn';
    logger[level]('Health Check', {
      component,
      status,
      timestamp: new Date().toISOString(),
      ...details
    });
  }
};

export default appLogger;