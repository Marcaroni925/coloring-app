/**
 * Express application setup for Coloring Book Creator API
 * Provides AI-powered prompt refinement and OpenAI image generation endpoints
 * 
 * Architecture Evidence: 
 * - Based on architecture.md Section 2.2 Backend Stack
 * - Implements RESTful APIs with JSON responses
 * - OpenAI SDK integration for gpt-image-1 model (upgraded from DALL-E for enhanced detail/quality)
 * - Express-validator for input sanitization
 * 
 * Model Change: Switched from dall-e-3 to gpt-image-1 for better detail and 300 DPI quality output
 * Reference: See architecture.md Section 4.1 for image generation requirements
 */

import express from 'express';
import cors from 'cors';
import { body, validationResult } from 'express-validator';
import OpenAI from 'openai';
import promptRefinementService from './services/promptRefinement.js';
import openaiImageService from './services/openaiService.js';
import pdfService from './services/pdfService.js';
import { apiLogger, loggerUtils } from './utils/logger.js';
import authRoutes from './routes/auth.js';
import admin from 'firebase-admin';

const app = express();

// Firebase Admin will be initialized by auth routes
let firebaseAdmin;
try {
  // Just check if already initialized by auth routes
  firebaseAdmin = admin.apps.length ? admin.app() : null;
  if (firebaseAdmin) {
    apiLogger.info('Firebase Admin already initialized', {
      projectId: firebaseAdmin.options.projectId
    });
  }
} catch (error) {
  apiLogger.warn('Firebase Admin check failed', {
    error: error.message,
    note: 'Gallery save may be disabled'
  });
}

/**
 * Helper function to save generated image to user's gallery
 */
const saveToGallery = async (userId, imageData) => {
  if (!firebaseAdmin || !userId) {
    return null; // Skip if no auth or admin not initialized
  }

  try {
    const db = firebaseAdmin.firestore();
    
    // Handle large imageUrl values that exceed Firestore's 1MB field limit
    let imageUrl = imageData.imageUrl;
    let imageUrlSize = 0;
    let isLargeImage = false;
    
    if (imageUrl) {
      imageUrlSize = Buffer.byteLength(imageUrl, 'utf8');
      // Firestore field limit is 1,048,487 bytes (1MB - 89 bytes)
      isLargeImage = imageUrlSize > 1000000; // Use 1MB threshold for safety
      
      if (isLargeImage) {
        // For large images, store a reference/placeholder instead of the full URL
        // This prevents the Firestore error while maintaining functionality
        imageUrl = '[Large Image - View in App]';
        
        apiLogger.warn('Large image URL detected, storing placeholder', {
          userId,
          originalSize: imageUrlSize,
          promptLength: imageData.originalPrompt?.length || 0
        });
      }
    }

    const imageDoc = {
      userId,
      imageUrl,
      originalPrompt: imageData.originalPrompt,
      refinedPrompt: imageData.refinedPrompt,
      metadata: {
        ...imageData.metadata || {},
        // Add metadata about image size for troubleshooting
        imageUrlSize,
        isLargeImage,
        // Store original URL info if it was too large
        ...(isLargeImage && {
          originalImageUrlSize: imageUrlSize,
          imageUrlTruncated: true,
          imageType: imageData.imageUrl?.startsWith('data:') ? 'base64' : 'url'
        })
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('user_images').add(imageDoc);
    
    apiLogger.info('Image saved to gallery', {
      userId,
      imageId: docRef.id,
      promptLength: imageData.originalPrompt?.length || 0,
      imageUrlSize,
      isLargeImage
    });

    return docRef.id;
  } catch (error) {
    apiLogger.error('Failed to save image to gallery', {
      userId,
      error: error.message,
      imageUrlSize: imageData.imageUrl ? Buffer.byteLength(imageData.imageUrl, 'utf8') : 0
    });
    return null;
  }
};

/**
 * Initialize OpenAI client with environment-based key selection
 * Evidence: architecture.md 6.1 - Mock keys for development, API cost mitigation
 * 
 * Development mode: Uses mock key to prevent API costs during testing
 * Production mode: Uses real OpenAI API key from environment variables
 */
function initializeOpenAI() {
  const hasRealKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-mock-key-for-testing' && process.env.OPENAI_API_KEY.startsWith('sk-');
  const apiKey = hasRealKey ? process.env.OPENAI_API_KEY : 'sk-mock-key-for-testing';
  
  apiLogger.info('OpenAI client initialized', {
    mode: hasRealKey ? 'Development (Real API)' : 'Development (Mock)',
    environment: process.env.NODE_ENV,
    hasApiKey: !!apiKey,
    keyStartsWith: process.env.OPENAI_API_KEY?.substring(0, 10) + '...',
    keyLength: process.env.OPENAI_API_KEY?.length,
    isRealKey: hasRealKey
  });
  
  return new OpenAI({ apiKey });
}

// Lazy initialize OpenAI client
let openai = null;
function getOpenAIClient() {
  if (!openai) {
    openai = initializeOpenAI();
  }
  return openai;
}

// Middleware setup
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Mount auth routes
app.use('/api/auth', authRoutes);

// Optional auth middleware for gallery integration
app.use(async (req, res, next) => {
  // Try to extract user information from Authorization header (optional)
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ') && firebaseAdmin) {
    try {
      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      // Add user info to request object for gallery integration
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.email
      };
    } catch (error) {
      // Invalid token, but don't block the request - just continue without user
      apiLogger.debug('Optional auth failed, continuing without user context', {
        error: error.message
      });
    }
  }
  
  next();
});

// Enhanced request logging middleware with winston
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Log incoming request
  loggerUtils.logRequest(apiLogger, req);
  
  // Override res.end to capture response data
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    // Log response
    loggerUtils.logResponse(apiLogger, req, res, responseTime);
    
    originalEnd.apply(this, args);
  };
  
  next();
});

// Family-friendly content filter (updated to use same logic as OpenAIImageService)
const inappropriateKeywords = [
  'violence', 'blood', 'weapon', 'gun', 'knife', 'death', 'kill',
  'sexual', 'nude', 'naked', 'explicit', 'inappropriate',
  'drug', 'alcohol', 'beer', 'wine', 'cigarette', 'smoking',
  'scary', 'horror', 'demon', 'devil', 'evil', 'dark magic'
];

/**
 * Content filter to ensure family-friendly prompts with context awareness
 * @param {string} text - Text to validate
 * @returns {boolean} - True if content is appropriate
 */
function isContentAppropriate(text) {
  const lowerText = text.toLowerCase();
  
  // Check basic inappropriate keywords first
  const basicInappropriate = inappropriateKeywords.some(keyword => lowerText.includes(keyword));
  if (basicInappropriate) {
    return false;
  }
  
  // Handle "adult" context-sensitively
  if (lowerText.includes('adult')) {
    // Block patterns that are actually inappropriate
    const blockedPatterns = ['adult content', 'adult material', 'adult themes', 'adult entertainment'];
    const isBlocked = blockedPatterns.some(pattern => lowerText.includes(pattern));
    
    // Only block if it matches explicitly inappropriate patterns
    if (isBlocked) {
      return false;
    }
    
    // Allow all other uses of "adult" (including age group, adults, etc.)
    return true;
  }
  
  return true;
}

/**
 * Legacy functions removed - now using dedicated PromptRefinementService
 * Evidence: architecture.md 3.1.3 - Modular service architecture
 * 
 * The prompt refinement logic has been moved to:
 * server/services/promptRefinement.js
 * 
 * This provides better separation of concerns, testability, and maintainability
 * following the service layer pattern outlined in architecture.md Section 3.3.2
 */

// Validation middleware for API endpoints
const validateGenerateRequest = [
  body('prompt')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Prompt must be between 1 and 500 characters')
    .custom((value) => {
      if (!isContentAppropriate(value)) {
        throw new Error('Content must be family-friendly');
      }
      return true;
    }),
  body('customizations.complexity')
    .optional()
    .isIn(['simple', 'medium', 'detailed'])
    .withMessage('Complexity must be simple, medium, or detailed'),
  body('customizations.ageGroup')
    .optional()
    .isIn(['kids', 'teens', 'adults'])
    .withMessage('Age group must be kids, teens, or adults'),
  body('customizations.lineThickness')
    .optional()
    .isIn(['thin', 'medium', 'thick'])
    .withMessage('Line thickness must be thin, medium, or thick'),
  body('customizations.border')
    .optional()
    .isIn(['with', 'without'])
    .withMessage('Border must be with or without'),
  body('customizations.theme')
    .optional()
    .isIn(['animals', 'mandalas', 'fantasy', 'nature'])
    .withMessage('Theme must be animals, mandalas, fantasy, or nature')
];

/**
 * Enhanced health check endpoint with OpenAI connection validation
 * Evidence: architecture.md 6.3 - API connection validation for reliability
 * 
 * Returns comprehensive service status including:
 * - Service health status
 * - OpenAI API connectivity  
 * - Environment mode (development/production)
 * - Prompt refinement service status
 */
app.get('/api/health', async (req, res) => {
  try {
    apiLogger.info('Health check requested');
    
    // Get prompt refinement service health
    const refinementHealth = await promptRefinementService.healthCheck();
    
    // Basic service health
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Coloring Book Creator API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      openai: refinementHealth.openaiConnected ? 'connected' : 'mock',
      promptRefinement: refinementHealth.status,
      endpoints: {
        generate: '/api/generate',
        refinePrompt: '/api/refine-prompt',
        health: '/api/health'
      }
    };

    // Log health check result with structured data
    loggerUtils.logHealthCheck(apiLogger, 'Coloring Book API', healthData.status, {
      openaiStatus: healthData.openai,
      environment: healthData.environment,
      promptRefinementStatus: healthData.promptRefinement,
      features: refinementHealth.features
    });

    res.json(healthData);
    
  } catch (error) {
    loggerUtils.logError(apiLogger, error, {
      operation: 'health-check',
      component: 'api'
    });
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'Coloring Book Creator API',
      error: error.message,
      environment: process.env.NODE_ENV || 'production'
    });
  }
});

/**
 * Prompt refinement endpoint - Standalone prompt enhancement service
 * Evidence: architecture.md 3.2.4 - Prompt Testing (Development) endpoint
 * 
 * Uses the dedicated PromptRefinementService for intelligent enhancement
 * Returns refined prompt with detailed metadata for testing and validation
 */
app.post('/api/refine-prompt', 
  validateGenerateRequest,
  async (req, res) => {
    const startTime = Date.now();
    
    try {
      apiLogger.info('Prompt refinement requested', {
        bodySize: JSON.stringify(req.body).length
      });
      
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        apiLogger.warn('Validation failed for refine-prompt', {
          errors: errors.array(),
          input: req.body.prompt?.substring(0, 50)
        });
        
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { prompt, customizations } = req.body;

      // Use dedicated prompt refinement service - architecture.md 3.1.3
      const refinementResult = await promptRefinementService.refinePrompt(prompt, customizations);
      
      const processingTime = Date.now() - startTime;

      // Enhanced logging with performance metrics
      loggerUtils.logPerformance(apiLogger, 'prompt-refinement', processingTime, {
        originalLength: prompt.length,
        refinedLength: refinementResult.refinedPrompt.length,
        category: refinementResult.detectedCategory,
        success: refinementResult.success,
        method: refinementResult.metadata?.method
      });

      res.json({
        success: refinementResult.success,
        refinedPrompt: refinementResult.refinedPrompt,
        originalPrompt: prompt,
        customizations: customizations || {},
        metadata: {
          detectedCategory: refinementResult.detectedCategory,
          appliedSettings: refinementResult.appliedSettings,
          timestamp: refinementResult.timestamp,
          error: refinementResult.error,
          processingTime
        }
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      loggerUtils.logError(apiLogger, error, {
        operation: 'refine-prompt',
        processingTime,
        input: req.body.prompt?.substring(0, 100)
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to refine prompt',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Main image generation endpoint
app.post('/api/generate',
  validateGenerateRequest,
  async (req, res) => {
    const startTime = Date.now();
    
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        apiLogger.warn('Validation failed for image generation', {
          errors: errors.array(),
          input: req.body.prompt?.substring(0, 50)
        });
        
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { prompt, customizations } = req.body;
      
      apiLogger.info('Image generation started', {
        prompt: prompt.substring(0, 100),
        customizations,
        requestId: req.ip + '_' + Date.now()
      });

      // Step 1: Refine the prompt using dedicated service with GPT enhancement - architecture.md 4.1
      // FLOW STEP 2: "Send to backend to create/refine an enhanced image prompt 
      // (using OpenAI GPT model with the existing API key from .env, adding subtle details for quality coloring book style)"
      apiLogger.info('Starting prompt refinement with GPT enhancement');
      const refinementResult = await promptRefinementService.refinePrompt(prompt, customizations, {
        useGPT: true, // Enable GPT-based refinement as specified in requirements
        requestId: req.ip + '_' + Date.now()
      });
      const refinedPrompt = refinementResult.refinedPrompt;

      // Step 2: Generate image using OpenAI Image Service (gpt-image-1 with dall-e-3 fallback)
      // FLOW STEP 3: "Use the refined prompt for OpenAI image generation (with the same API key)"
      // Reference: https://platform.openai.com/docs/models/gpt-image-1
      // Architecture: Enhanced service-based approach with intelligent model selection
      apiLogger.info('Starting OpenAI image generation with refined prompt', {
        promptLength: refinedPrompt.length,
        promptPreview: refinedPrompt.substring(0, 100) + '...'
      });
      
      try {
        // Use the new OpenAI Image Service with intelligent model selection
        // Primary: gpt-image-1 ($0.167/image, 300 DPI equivalent quality: "high")
        // Fallback: dall-e-3 ($0.040/image, quality: "standard")  
        // Reference: https://platform.openai.com/docs/models/gpt-image-1
        const imageGenerationResult = await openaiImageService.generateImage(refinedPrompt, {
          requestId: req.ip + '_' + Date.now(),
          size: '1024x1024'
          // Note: gpt-image-1 doesn't use quality/style parameters
        });

        if (!imageGenerationResult.success) {
          throw new Error('Image generation service returned failure');
        }

        const { imageUrl, model: usedModel, metadata: imageMetadata } = imageGenerationResult;
        const processingTime = Date.now() - startTime;

        // Prepare comprehensive image data for gallery save with cost tracking
        const imageData = {
          imageUrl,
          originalPrompt: prompt,
          refinedPrompt,
          metadata: {
            ...imageMetadata,
            // Enhanced metadata with refinement context
            refinementData: {
              category: refinementResult.detectedCategory,
              success: refinementResult.success,
              appliedSettings: refinementResult.appliedSettings,
              method: refinementResult.metadata?.method
            },
            // Cost analysis and usage tracking
            totalProcessingTime: processingTime,
            apiEndpointUsed: '/api/generate'
          }
        };

        // Save to gallery if user is authenticated
        let galleryImageId = null;
        if (req.user) {
          galleryImageId = await saveToGallery(req.user.uid, imageData);
        }

        // Enhanced response with comprehensive metadata and cost tracking
        const response = {
          success: true,
          imageUrl,
          refinedPrompt,
          originalPrompt: prompt,
          customizations: customizations || {},
          metadata: imageData.metadata,
          galleryImageId,
          savedToGallery: !!galleryImageId
        };

        // Log successful generation with comprehensive metrics
        loggerUtils.logPerformance(apiLogger, 'image-generation-service', processingTime, {
          modelUsed: usedModel,
          category: refinementResult.detectedCategory,
          promptLength: prompt.length,
          refinedLength: refinedPrompt.length,
          imageGenerated: !!imageUrl,
          savedToGallery: !!galleryImageId,
          userId: req.user?.uid,
          costs: imageMetadata.costs,
          attemptCount: imageMetadata.attemptCount
        });

        res.json(response);

      } catch (imageError) {
        // Enhanced error handling with fallback information
        apiLogger.error('Image generation service failed', {
          error: imageError.message,
          promptLength: refinedPrompt.length,
          userId: req.user?.uid,
          processingTime: Date.now() - startTime
        });
        
        throw imageError; // Re-throw to be handled by main error handler
      }

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Enhanced error logging with structured data - Evidence: architecture.md 6.3
      loggerUtils.logError(apiLogger, error, {
        operation: 'image-generation',
        processingTime,
        errorType: error.name,
        statusCode: error.status,
        input: req.body.prompt?.substring(0, 100)
      });
      
      // Handle rate limiting - Evidence: architecture.md 6.3 Exponential backoff
      if (error.status === 429) {
        apiLogger.warn('Rate limit exceeded', {
          retryAfter: 60,
          processingTime
        });
        
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: 60,
          timestamp: new Date().toISOString()
        });
      }

      // Handle other OpenAI API errors - Evidence: architecture.md 6.3 Error handling
      if (error.status >= 400 && error.status < 500) {
        apiLogger.warn('Client error during image generation', {
          statusCode: error.status,
          message: error.message
        });
        
        return res.status(error.status).json({
          success: false,
          error: 'API error',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }

      // Generic server error with enhanced logging
      apiLogger.error('Internal server error during image generation', {
        processingTime,
        errorMessage: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Image generation failed',
        message: 'An unexpected error occurred during image generation',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * PDF Generation Endpoint
 * Evidence: architecture.md Section 3.3.1 - PDF generation endpoint
 * 
 * FLOW STEP 4: Part of "Return image to frontend for zoomable preview, 
 * with modal options to download as 300 DPI PDF or save to Firebase gallery"
 * 
 * Converts generated coloring page images to high-quality 300 DPI PDFs
 * suitable for printing. Supports both authenticated and guest users.
 */
app.post('/api/generate-pdf',
  // Validation for PDF generation
  [
    body('imageUrl')
      .notEmpty()
      .withMessage('Image URL is required')
      .isURL({ protocols: ['http', 'https', 'data'] })
      .withMessage('Must be a valid URL or data URI'),
    body('title')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Title must be 100 characters or less'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object')
  ],
  async (req, res) => {
    const startTime = Date.now();
    
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        apiLogger.warn('Validation failed for PDF generation', {
          errors: errors.array(),
          imageUrl: req.body.imageUrl ? 'provided' : 'missing'
        });
        
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { imageUrl, title, metadata = {} } = req.body;
      
      apiLogger.info('PDF generation requested', {
        hasImageUrl: !!imageUrl,
        hasTitle: !!title,
        hasMetadata: Object.keys(metadata).length > 0,
        userAuthenticated: !!req.user,
        requestId: req.ip + '_' + Date.now()
      });

      // Prepare PDF metadata
      const pdfMetadata = {
        title: title || metadata.originalPrompt || 'Coloring Page',
        originalPrompt: metadata.originalPrompt,
        refinedPrompt: metadata.refinedPrompt,
        generatedAt: metadata.generatedAt || new Date().toISOString(),
        complexity: metadata.complexity,
        ageGroup: metadata.ageGroup,
        theme: metadata.theme
      };

      // Generate PDF using the PDF service
      apiLogger.info('Starting PDF generation with pdfService');
      const pdfBuffer = await pdfService.generatePDF(imageUrl, pdfMetadata, {
        orientation: 'portrait',
        format: 'letter',
        compress: true
      });

      const processingTime = Date.now() - startTime;

      // Log successful PDF generation
      loggerUtils.logPerformance(apiLogger, 'pdf-generation', processingTime, {
        pdfSize: pdfBuffer.length,
        hasTitle: !!title,
        userAuthenticated: !!req.user,
        metadata: Object.keys(pdfMetadata).length
      });

      // Set response headers for PDF download
      const filename = `coloring-page-${Date.now()}.pdf`;
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length,
        'Cache-Control': 'no-cache'
      });

      // Send PDF buffer
      res.send(pdfBuffer);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      loggerUtils.logError(apiLogger, error, {
        operation: 'pdf-generation',
        processingTime,
        imageUrl: req.body.imageUrl ? req.body.imageUrl.substring(0, 50) + '...' : 'missing'
      });
      
      res.status(500).json({
        success: false,
        error: 'PDF generation failed',
        message: 'Unable to generate PDF. Please try again.',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Enhanced error handling middleware with winston
app.use((err, req, res, _next) => {
  loggerUtils.logError(apiLogger, err, {
    operation: 'unhandled-error',
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

// Enhanced 404 handler with winston
app.use('*', (req, res) => {
  apiLogger.warn('Endpoint not found', {
    method: req.method,
    path: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} is not a valid endpoint`,
    timestamp: new Date().toISOString()
  });
});

export default app;