#!/usr/bin/env node

/**
 * Express server entry point for the Coloring Book Creator API
 * Handles AI-powered prompt refinement and DALL-E image generation
 * 
 * Evidence-based implementation following architecture.md:
 * - Section 2.2: Node.js 18+ with Express.js backend
 * - Section 6.1: Mock keys for development, API cost mitigation  
 * - Section 3.3.1: Core API endpoints for generation flow
 */

import 'dotenv/config';
import app from './app.js';
import { serverLogger } from './utils/logger.js';

const PORT = process.env.PORT || 3001;

/**
 * Enhanced server startup with winston logging
 * Evidence: architecture.md 6.1 - Logging for monitoring and improvement
 */
app.listen(PORT, () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasRealKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-mock-key-for-testing' && process.env.OPENAI_API_KEY.startsWith('sk-');
  const apiMode = hasRealKey ? 'Development (Real API)' : 'Development (Mock)';
  
  serverLogger.info('Coloring Book Creator API Server Started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'production',
    openaiMode: apiMode,
    apiUrl: `http://localhost:${PORT}`
  });
  
  // Log available endpoints
  serverLogger.info('API Endpoints Available', {
    endpoints: [
      { method: 'POST', path: '/api/generate', purpose: 'Main generation flow with prompt refinement' },
      { method: 'POST', path: '/api/refine-prompt', purpose: 'Standalone prompt testing and validation' },
      { method: 'GET', path: '/api/health', purpose: 'Service status and OpenAI connectivity' }
    ]
  });
  
  // Log system information
  serverLogger.info('System Information', {
    service: 'Coloring Book Creator API',
    version: '1.0.0',
    port: PORT,
    environment: process.env.NODE_ENV || 'production',
    openaiKey: hasRealKey ? 'Real API Key' : 'Mock (Development)',
    promptRefinement: 'Active',
    features: {
      winstonLogging: true,
      inputSanitization: true,
      expandedPatterns: true,
      gptRefinement: hasRealKey
    }
  });
  
  serverLogger.info('Server initialization complete');
  
  // Still log to console for development visibility
  if (isDevelopment) {
    console.log('\n🎨 Coloring Book Creator API Server');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API available at http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log(`🔑 OpenAI Mode: ${apiMode}`);
    console.log('✅ Server initialization complete\n');
  }
});

/**
 * Graceful shutdown handlers with winston logging
 * Evidence: architecture.md - Production readiness and monitoring
 */
process.on('SIGTERM', () => {
  serverLogger.info('Received SIGTERM signal, initiating graceful shutdown');
  serverLogger.info('Coloring Book Creator API Server stopped');
  process.exit(0);
});

process.on('SIGINT', () => {
  serverLogger.info('Received SIGINT signal, initiating graceful shutdown');
  serverLogger.info('Coloring Book Creator API Server stopped');
  process.exit(0);
});

// Handle uncaught exceptions with winston
process.on('uncaughtException', (error) => {
  serverLogger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
    pid: process.pid
  });
  process.exit(1);
});

// Handle unhandled promise rejections with winston
process.on('unhandledRejection', (reason, promise) => {
  serverLogger.error('Unhandled Rejection', {
    reason: reason,
    promise: promise
  });
  process.exit(1);
});