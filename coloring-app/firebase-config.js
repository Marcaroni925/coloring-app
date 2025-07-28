/**
 * Firebase Configuration and Initialization
 * 
 * Central configuration for Firebase services including Authentication and Firestore.
 * Evidence-based implementation following Firebase best practices:
 * - Authentication with email/password and social providers
 * - Firestore for user image gallery storage
 * - Environment-based configuration for security
 * - Error handling and connection validation
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase configuration - Using your project credentials
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB5O49UF2vAtcjUVHF8Qjms6sqqdBc_IOw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "coloing-book-creator.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "coloing-book-creator",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "coloing-book-creator.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "143460361234",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:143460361234:web:e9e2e111f1200eb54aa4cb"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Firestore Database
const db = getFirestore(app);

// Initialize Firebase Storage for image uploads
const storage = getStorage(app);

// Development mode: Connect to Firebase emulators
if (import.meta.env.MODE === 'development' && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    // Connect to Auth emulator (default port 9099)
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    
    // Connect to Firestore emulator (default port 8080)
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    
    // Connect to Storage emulator (default port 9199)
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    
    console.log('🔧 Connected to Firebase emulators');
  } catch {
    // Emulators might already be connected
    console.log('Firebase emulators already connected or not available');
  }
}

/**
 * Firebase service validation
 * Checks if Firebase services are properly initialized
 */
export const validateFirebaseConfig = () => {
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN', 
    'VITE_FIREBASE_PROJECT_ID'
  ];

  const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0 && import.meta.env.MODE === 'production') {
    console.warn('Missing Firebase environment variables:', missingVars);
    return false;
  }

  return {
    app: !!app,
    auth: !!auth,
    firestore: !!db,
    projectId: firebaseConfig.projectId,
    environment: import.meta.env.MODE || 'development'
  };
};

/**
 * Google Auth Provider Configuration
 * Pre-configured for coloring book app requirements
 */
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Mock users for development testing
 * These can be used to simulate different user scenarios
 */
export const mockUsers = [
  {
    uid: 'mock-user-1',
    email: 'test1@example.com',
    displayName: 'Test User 1',
    photoURL: null,
    emailVerified: true
  },
  {
    uid: 'mock-user-2', 
    email: 'test2@example.com',
    displayName: 'Test User 2',
    photoURL: 'https://via.placeholder.com/150x150/4F46E5/white?text=T2',
    emailVerified: true
  },
  {
    uid: 'mock-user-3',
    email: 'admin@example.com',
    displayName: 'Admin User',
    photoURL: 'https://via.placeholder.com/150x150/059669/white?text=AD',
    emailVerified: true
  }
];

/**
 * Age verification configuration for future payment features
 * Note: Required for payment processing compliance
 */
export const ageVerificationConfig = {
  required: false, // Will be true when payment features are added
  minimumAge: 13,
  message: 'Age verification required for payment features'
};

/**
 * Authentication configuration and helpers
 */
export const authConfig = {
  // Persistence settings
  persistence: 'local', // 'local', 'session', 'none'
  
  // OAuth providers configuration
  providers: {
    google: {
      scopes: ['profile', 'email'],
      customParameters: {
        prompt: 'select_account'
      }
    }
  },
  
  // Password requirements
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false
  }
};

// Export Firebase services
export { app, auth, db, storage };
export default app;

/**
 * Environment Variables Required:
 * 
 * For Production (.env.production):
 * VITE_FIREBASE_API_KEY=your-actual-api-key
 * VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
 * VITE_FIREBASE_PROJECT_ID=your-project-id
 * VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
 * VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
 * VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
 * 
 * For Development (.env.development):
 * VITE_USE_FIREBASE_EMULATOR=true
 * VITE_FIREBASE_API_KEY=demo-key
 * VITE_FIREBASE_AUTH_DOMAIN=demo-project.firebaseapp.com
 * VITE_FIREBASE_PROJECT_ID=demo-project
 * 
 * Note: All Vite environment variables must be prefixed with VITE_
 * to be accessible in the browser environment.
 */