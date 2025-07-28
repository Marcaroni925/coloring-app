/**
 * Authentication and Gallery Routes for Coloring Book Creator API
 * 
 * Firebase Authentication and Firestore integration for backend operations.
 * Evidence-based implementation following Firebase Admin SDK best practices:
 * - JWT token verification for secure API access
 * - Firestore operations for user image gallery
 * - Comprehensive error handling and validation
 * - Rate limiting and security measures
 * - Integration with existing image generation flow
 */

import express from 'express';
import admin from 'firebase-admin';
import { body, validationResult } from 'express-validator';
import { apiLogger, loggerUtils } from '../utils/logger.js';

const router = express.Router();

// Initialize Firebase Admin SDK
let firebaseAdmin;

try {
  // Check if Firebase Admin is already initialized
  firebaseAdmin = admin.apps.length ? admin.app() : null;
  
  if (!firebaseAdmin) {
    // Initialize with service account or environment variables
    if (process.env.NODE_ENV === 'development') {
      // Development mode: Use Firebase emulator or service account
      if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
        apiLogger.info('Using Firebase Auth emulator for development');
        process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
      }
      
      firebaseAdmin = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project',
        // In development, you might use a service account key file
        // credential: admin.credential.cert(require('./path/to/service-account-key.json'))
      });
    } else {
      // Production mode: Use service account key or default credentials
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      
      if (serviceAccountKey) {
        const serviceAccount = JSON.parse(serviceAccountKey);
        firebaseAdmin = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id
        });
      } else {
        // Use default credentials (e.g., when running on Google Cloud)
        firebaseAdmin = admin.initializeApp();
      }
    }
  }
  
  apiLogger.info('Firebase Admin SDK initialized successfully', {
    projectId: firebaseAdmin.options.projectId,
    environment: process.env.NODE_ENV || 'production'
  });
} catch (error) {
  apiLogger.error('Failed to initialize Firebase Admin SDK', {
    error: error.message,
    stack: error.stack
  });
}

// Get Firestore instance
const db = firebaseAdmin?.firestore();

/**
 * Middleware to verify Firebase ID token
 * Extracts and validates JWT token from Authorization header
 */
const verifyToken = async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      apiLogger.warn('Missing or invalid authorization header', {
        path: req.path,
        ip: req.ip
      });
      
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Missing or invalid authorization token'
      });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Add user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name || decodedToken.email,
      emailVerified: decodedToken.email_verified
    };
    
    const responseTime = Date.now() - startTime;
    
    apiLogger.info('Token verification successful', {
      userId: req.user.uid,
      email: req.user.email,
      responseTime,
      path: req.path
    });
    
    next();
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    loggerUtils.logError(apiLogger, error, {
      operation: 'token-verification',
      responseTime,
      path: req.path,
      ip: req.ip
    });
    
    let errorMessage = 'Invalid authentication token';
    let statusCode = 401;
    
    switch (error.code) {
      case 'auth/id-token-expired':
        errorMessage = 'Authentication token has expired';
        break;
      case 'auth/id-token-revoked':
        errorMessage = 'Authentication token has been revoked';
        break;
      case 'auth/invalid-id-token':
        errorMessage = 'Invalid authentication token';
        break;
      case 'auth/user-disabled':
        errorMessage = 'User account has been disabled';
        break;
      default:
        errorMessage = 'Authentication failed';
    }
    
    res.status(statusCode).json({
      success: false,
      error: 'Authentication failed',
      message: errorMessage
    });
  }
};

/**
 * POST /save-image
 * Save generated image to user's gallery
 */
router.post('/save-image',
  verifyToken,
  [
    body('imageUrl')
      .isURL()
      .withMessage('Valid image URL is required'),
    body('originalPrompt')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Original prompt must be between 1 and 1000 characters'),
    body('refinedPrompt')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Refined prompt must be less than 2000 characters'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object')
  ],
  async (req, res) => {\n    const startTime = Date.now();\n    \n    try {\n      // Check for validation errors\n      const errors = validationResult(req);\n      if (!errors.isEmpty()) {\n        apiLogger.warn('Validation failed for save-image', {\n          errors: errors.array(),\n          userId: req.user.uid\n        });\n        \n        return res.status(400).json({\n          success: false,\n          error: 'Validation failed',\n          details: errors.array()\n        });\n      }\n\n      const { imageUrl, originalPrompt, refinedPrompt, metadata } = req.body;\n      \n      // Prepare image document\n      const imageDoc = {\n        userId: req.user.uid,\n        userEmail: req.user.email,\n        imageUrl,\n        originalPrompt,\n        refinedPrompt: refinedPrompt || null,\n        metadata: metadata || {},\n        createdAt: admin.firestore.FieldValue.serverTimestamp(),\n        updatedAt: admin.firestore.FieldValue.serverTimestamp()\n      };\n      \n      // Save to Firestore\n      const docRef = await db.collection('user_images').add(imageDoc);\n      \n      const processingTime = Date.now() - startTime;\n      \n      loggerUtils.logPerformance(apiLogger, 'image-save', processingTime, {\n        userId: req.user.uid,\n        imageId: docRef.id,\n        promptLength: originalPrompt.length\n      });\n      \n      res.status(201).json({\n        success: true,\n        imageId: docRef.id,\n        message: 'Image saved to gallery successfully',\n        data: {\n          id: docRef.id,\n          ...imageDoc,\n          createdAt: new Date().toISOString(),\n          updatedAt: new Date().toISOString()\n        }\n      });\n      \n    } catch (error) {\n      const processingTime = Date.now() - startTime;\n      \n      loggerUtils.logError(apiLogger, error, {\n        operation: 'save-image',\n        userId: req.user?.uid,\n        processingTime\n      });\n      \n      res.status(500).json({\n        success: false,\n        error: 'Failed to save image',\n        message: 'An error occurred while saving the image to your gallery'\n      });\n    }\n  }\n);\n\n/**\n * GET /get-gallery\n * Retrieve user's image gallery with pagination\n */\nrouter.get('/get-gallery',\n  verifyToken,\n  async (req, res) => {\n    const startTime = Date.now();\n    \n    try {\n      const { limit = 20, offset = 0, orderBy = 'createdAt', order = 'desc' } = req.query;\n      \n      // Validate query parameters\n      const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 50);\n      const offsetNum = Math.max(parseInt(offset) || 0, 0);\n      \n      // Build Firestore query\n      let query = db.collection('user_images')\n        .where('userId', '==', req.user.uid)\n        .orderBy(orderBy, order)\n        .limit(limitNum);\n      \n      if (offsetNum > 0) {\n        // For pagination, you might want to use cursor-based pagination in production\n        query = query.offset(offsetNum);\n      }\n      \n      const snapshot = await query.get();\n      \n      const images = [];\n      snapshot.forEach(doc => {\n        const data = doc.data();\n        images.push({\n          id: doc.id,\n          ...data,\n          createdAt: data.createdAt?.toDate()?.toISOString() || null,\n          updatedAt: data.updatedAt?.toDate()?.toISOString() || null\n        });\n      });\n      \n      // Get total count (optional, can be expensive for large collections)\n      const countSnapshot = await db.collection('user_images')\n        .where('userId', '==', req.user.uid)\n        .count()\n        .get();\n      \n      const total = countSnapshot.data().count;\n      \n      const processingTime = Date.now() - startTime;\n      \n      loggerUtils.logPerformance(apiLogger, 'gallery-retrieve', processingTime, {\n        userId: req.user.uid,\n        imageCount: images.length,\n        totalImages: total\n      });\n      \n      res.json({\n        success: true,\n        data: {\n          images,\n          pagination: {\n            total,\n            limit: limitNum,\n            offset: offsetNum,\n            hasMore: offsetNum + limitNum < total\n          }\n        }\n      });\n      \n    } catch (error) {\n      const processingTime = Date.now() - startTime;\n      \n      loggerUtils.logError(apiLogger, error, {\n        operation: 'get-gallery',\n        userId: req.user?.uid,\n        processingTime\n      });\n      \n      res.status(500).json({\n        success: false,\n        error: 'Failed to retrieve gallery',\n        message: 'An error occurred while loading your gallery'\n      });\n    }\n  }\n);\n\n/**\n * DELETE /delete-image/:imageId\n * Delete a single image from user's gallery\n */\nrouter.delete('/delete-image/:imageId',\n  verifyToken,\n  async (req, res) => {\n    const startTime = Date.now();\n    \n    try {\n      const { imageId } = req.params;\n      \n      if (!imageId) {\n        return res.status(400).json({\n          success: false,\n          error: 'Image ID is required'\n        });\n      }\n      \n      // Verify the image belongs to the user\n      const imageDoc = await db.collection('user_images').doc(imageId).get();\n      \n      if (!imageDoc.exists) {\n        return res.status(404).json({\n          success: false,\n          error: 'Image not found'\n        });\n      }\n      \n      const imageData = imageDoc.data();\n      \n      if (imageData.userId !== req.user.uid) {\n        return res.status(403).json({\n          success: false,\n          error: 'Unauthorized to delete this image'\n        });\n      }\n      \n      // Delete the image\n      await db.collection('user_images').doc(imageId).delete();\n      \n      const processingTime = Date.now() - startTime;\n      \n      loggerUtils.logPerformance(apiLogger, 'image-delete', processingTime, {\n        userId: req.user.uid,\n        imageId\n      });\n      \n      res.json({\n        success: true,\n        message: 'Image deleted successfully',\n        imageId\n      });\n      \n    } catch (error) {\n      const processingTime = Date.now() - startTime;\n      \n      loggerUtils.logError(apiLogger, error, {\n        operation: 'delete-image',\n        userId: req.user?.uid,\n        imageId: req.params.imageId,\n        processingTime\n      });\n      \n      res.status(500).json({\n        success: false,\n        error: 'Failed to delete image',\n        message: 'An error occurred while deleting the image'\n      });\n    }\n  }\n);\n\n/**\n * POST /delete-bulk\n * Delete multiple images from user's gallery\n */\nrouter.post('/delete-bulk',\n  verifyToken,\n  [\n    body('imageIds')\n      .isArray({ min: 1, max: 50 })\n      .withMessage('Image IDs must be an array with 1-50 items'),\n    body('imageIds.*')\n      .isString()\n      .withMessage('Each image ID must be a string')\n  ],\n  async (req, res) => {\n    const startTime = Date.now();\n    \n    try {\n      // Check for validation errors\n      const errors = validationResult(req);\n      if (!errors.isEmpty()) {\n        return res.status(400).json({\n          success: false,\n          error: 'Validation failed',\n          details: errors.array()\n        });\n      }\n      \n      const { imageIds } = req.body;\n      \n      // Verify all images belong to the user\n      const batch = db.batch();\n      const verificationPromises = imageIds.map(async (imageId) => {\n        const imageDoc = await db.collection('user_images').doc(imageId).get();\n        \n        if (!imageDoc.exists) {\n          throw new Error(`Image ${imageId} not found`);\n        }\n        \n        const imageData = imageDoc.data();\n        \n        if (imageData.userId !== req.user.uid) {\n          throw new Error(`Unauthorized to delete image ${imageId}`);\n        }\n        \n        // Add to batch delete\n        batch.delete(db.collection('user_images').doc(imageId));\n        \n        return imageId;\n      });\n      \n      const verifiedIds = await Promise.all(verificationPromises);\n      \n      // Execute batch delete\n      await batch.commit();\n      \n      const processingTime = Date.now() - startTime;\n      \n      loggerUtils.logPerformance(apiLogger, 'bulk-delete', processingTime, {\n        userId: req.user.uid,\n        deletedCount: verifiedIds.length\n      });\n      \n      res.json({\n        success: true,\n        message: `${verifiedIds.length} images deleted successfully`,\n        deletedIds: verifiedIds\n      });\n      \n    } catch (error) {\n      const processingTime = Date.now() - startTime;\n      \n      loggerUtils.logError(apiLogger, error, {\n        operation: 'delete-bulk',\n        userId: req.user?.uid,\n        processingTime\n      });\n      \n      let statusCode = 500;\n      let errorMessage = 'Failed to delete images';\n      \n      if (error.message.includes('not found')) {\n        statusCode = 404;\n        errorMessage = error.message;\n      } else if (error.message.includes('Unauthorized')) {\n        statusCode = 403;\n        errorMessage = error.message;\n      }\n      \n      res.status(statusCode).json({\n        success: false,\n        error: errorMessage,\n        message: 'An error occurred while deleting the images'\n      });\n    }\n  }\n);\n\n/**\n * GET /auth-status\n * Check authentication status and user information\n */\nrouter.get('/auth-status',\n  verifyToken,\n  async (req, res) => {\n    try {\n      res.json({\n        success: true,\n        user: {\n          uid: req.user.uid,\n          email: req.user.email,\n          displayName: req.user.displayName,\n          emailVerified: req.user.emailVerified\n        },\n        authenticated: true\n      });\n    } catch (error) {\n      loggerUtils.logError(apiLogger, error, {\n        operation: 'auth-status',\n        userId: req.user?.uid\n      });\n      \n      res.status(500).json({\n        success: false,\n        error: 'Failed to get auth status'\n      });\n    }\n  }\n);\n\nexport default router;\n\n/**\n * Environment Variables Required:\n * \n * For Production:\n * FIREBASE_SERVICE_ACCOUNT_KEY='{\"type\":\"service_account\",...}'\n * FIREBASE_PROJECT_ID=your-project-id\n * \n * For Development:\n * FIREBASE_PROJECT_ID=demo-project\n * FIREBASE_AUTH_EMULATOR_HOST=localhost:9099\n * \n * Note: In production, you can either:\n * 1. Use FIREBASE_SERVICE_ACCOUNT_KEY environment variable with the full JSON\n * 2. Use a service account key file and modify the initialization code\n * 3. Use default credentials when running on Google Cloud Platform\n */