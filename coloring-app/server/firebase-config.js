/**
 * Firebase Admin SDK Configuration for Coloring Book Creator
 * 
 * This module initializes Firebase Admin SDK for server-side operations including:
 * - User authentication token verification  
 * - Firestore database operations for gallery management
 * - Cloud Storage for image uploads and management
 * 
 * SECURITY IMPLEMENTATION:
 * - Uses service account credentials for secure authentication
 * - Credentials file MUST be added to .gitignore to prevent exposure
 * - Environment variables used for configuration flexibility
 * 
 * Evidence: Firebase Admin SDK best practices from official documentation
 * https://firebase.google.com/docs/admin/setup#initialize-without-parameters
 * 
 * INTEGRATION FLOW:
 * 1. Service account key provides secure authentication
 * 2. Admin SDK initializes with project configuration
 * 3. Firestore and Storage instances exported for use in routes
 * 4. Auth middleware uses admin.auth() for token verification
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Initialize Firebase Admin SDK with service account credentials
 * 
 * SECURITY NOTE: The serviceAccountKey.json file contains sensitive credentials
 * and MUST be added to .gitignore. Never commit this file to version control.
 * 
 * Production deployment options:
 * 1. Use environment variables for service account JSON
 * 2. Use Google Application Default Credentials (ADC) on Google Cloud
 * 3. Use Firebase Functions built-in admin credentials
 */
let firebaseAdmin = null;

try {
  // Check if Firebase Admin is already initialized
  if (admin.apps.length === 0) {
    // Load service account key from file
    const serviceAccountPath = join(dirname(__dirname), 'serviceAccountKey.json');
    
    let serviceAccount;
    try {
      const serviceAccountData = readFileSync(serviceAccountPath, 'utf8');
      serviceAccount = JSON.parse(serviceAccountData);
    } catch (error) {
      console.warn('Service account key file not found, using environment variables');
      
      // Fallback to environment variables for production
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } else {
        throw new Error('Firebase service account credentials not found');
      }
    }

    // Initialize Firebase Admin SDK
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`,
      databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com/`
    });

    console.log('Firebase Admin SDK initialized successfully', {
      projectId: serviceAccount.project_id,
      environment: process.env.NODE_ENV || 'production'
    });
  } else {
    // Use existing app instance
    firebaseAdmin = admin.app();
    console.log('Firebase Admin SDK already initialized');
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error.message);
  
  // In development, we can continue without Firebase for core functionality
  if (process.env.NODE_ENV === 'development') {
    console.warn('Running in development mode without Firebase Admin - gallery features will be disabled');
  } else {
    // In production, Firebase is required
    throw error;
  }
}

/**
 * Firebase service instances
 * 
 * These instances provide access to Firebase services:
 * - db: Firestore database for storing user gallery data
 * - storage: Cloud Storage for image file management  
 * - auth: Authentication service for token verification
 */
const db = firebaseAdmin ? admin.firestore() : null;
const storage = firebaseAdmin ? admin.storage() : null;
const auth = firebaseAdmin ? admin.auth() : null;

/**
 * Health check function for Firebase services
 * 
 * @returns {Object} Status of Firebase services
 */
export const firebaseHealthCheck = async () => {
  try {
    if (!firebaseAdmin) {
      return {
        status: 'disabled',
        message: 'Firebase Admin SDK not initialized',
        services: {
          firestore: false,
          storage: false,
          auth: false
        }
      };
    }

    // Test Firestore connection
    let firestoreStatus = false;
    try {
      await db.collection('health').limit(1).get();
      firestoreStatus = true;
    } catch (error) {
      console.warn('Firestore health check failed:', error.message);
    }

    // Test Storage connection
    let storageStatus = false;
    try {
      await storage.bucket().getMetadata();
      storageStatus = true;
    } catch (error) {
      console.warn('Storage health check failed:', error.message);
    }

    return {
      status: 'connected',
      projectId: firebaseAdmin.options.projectId,
      services: {
        firestore: firestoreStatus,
        storage: storageStatus,
        auth: true // Auth is always available if admin is initialized
      }
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      services: {
        firestore: false,
        storage: false,
        auth: false
      }
    };
  }
};

/**
 * Export Firebase Admin SDK and service instances
 * 
 * Usage in routes:
 * import { admin, db, storage, auth } from './firebase-config.js';
 * 
 * - admin: Full Firebase Admin SDK instance
 * - db: Firestore database instance
 * - storage: Cloud Storage instance  
 * - auth: Authentication service instance
 */
export { admin, db, storage, auth, firebaseAdmin };
export default firebaseAdmin;