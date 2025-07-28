# Firebase Setup Guide for Coloring Book Creator

This guide will help you set up Firebase authentication and gallery functionality for the Coloring Book Creator app.

## 🔥 Firebase Console Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project" or "Add project"
3. Name your project (e.g., "coloring-book-creator")
4. Enable Google Analytics (optional)
5. Create the project

### 2. Enable Authentication

1. In the Firebase console, go to **Authentication** → **Sign-in method**
2. Enable the following providers:
   - **Email/Password**: Click Enable → Save
   - **Google**: Click Enable → Configure OAuth consent screen → Save
3. Add your domain to authorized domains (localhost is already included for development)

### 3. Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Choose **Start in test mode** (for development)
3. Select a location close to your users
4. Click **Done**

### 4. Set up Cloud Storage (Optional)

1. Go to **Storage** → **Get started**
2. Choose **Start in test mode**
3. Select the same location as Firestore
4. Click **Done**

### 5. Get Configuration Keys

1. Go to **Project settings** (gear icon) → **General**
2. Scroll down to "Your apps" section
3. Click **Add app** → Web app icon (`</>`)
4. Name your app (e.g., "coloring-app-web")
5. Copy the configuration object

## 🔧 Local Development Setup

### 1. Environment Variables

Create `.env.development` file in the project root:

```env
# Firebase Configuration (Replace with your actual values)
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Development settings
VITE_USE_FIREBASE_EMULATOR=false
NODE_ENV=development
```

### 2. Production Environment

Create `.env.production` file:

```env
# Firebase Configuration (Same as development but for production)
VITE_FIREBASE_API_KEY=your-production-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

NODE_ENV=production
```

### 3. Backend Service Account (Production)

For production backend authentication:

1. Go to **Project settings** → **Service accounts**
2. Click **Generate new private key**
3. Save the JSON file securely
4. Set environment variable:

```bash
export FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

## 🔒 Security Rules

### Firestore Security Rules

Replace the default rules in **Firestore Database** → **Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User images collection
    match /user_images/{imageId} {
      // Users can only read/write their own images
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      // Allow create if user is authenticated and userId matches
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // User profiles (if you add this feature later)
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other requests
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Cloud Storage Security Rules (Optional)

If using Cloud Storage for image uploads:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User images folder
    match /user_images/{userId}/{imageId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## 🧪 Testing

### Mock Users for Development

The app includes mock users for development testing. These are defined in `firebase-config.js`:

- **Test User 1**: test1@example.com
- **Test User 2**: test2@example.com  
- **Admin User**: admin@example.com

### Firebase Emulators (Optional)

For local development with emulators:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init emulators`
4. Select Auth, Firestore, and Storage emulators
5. Set `.env.development`:

```env
VITE_USE_FIREBASE_EMULATOR=true
```

6. Start emulators: `firebase emulators:start`

## 🚀 Installation and Setup

### 1. Install Dependencies

```bash
npm install firebase
```

### 2. Test Firebase Connection

The app includes configuration validation. Check browser console for:
- ✅ Firebase initialized successfully
- 🔧 Connected to Firebase emulators (if using emulators)

### 3. Test Authentication

1. Start the development server: `npm run dev`
2. Navigate to the Auth view
3. Try creating an account with email/password
4. Try Google sign-in
5. Check Firebase console → Authentication → Users

### 4. Test Gallery Functionality

1. Sign in to the app
2. Generate a coloring page
3. Click "Save to Gallery" 
4. Switch to Gallery view
5. Verify image appears
6. Test delete functionality

## 🔧 Troubleshooting

### Common Issues

**"Firebase configuration error"**
- Verify all environment variables are set correctly
- Check that API key is valid and project ID matches

**"Authentication failed"**
- Ensure Email/Password provider is enabled in Firebase console
- Check that domain is in authorized domains list

**"Permission denied" in Firestore**
- Verify security rules are set correctly
- Check that user is authenticated
- Ensure userId matches in document data

**Google Sign-in not working**
- Configure OAuth consent screen in Google Cloud Console
- Add authorized domains in Firebase console
- Check Google provider configuration

### Firebase Console Links

- [Authentication](https://console.firebase.google.com/project/_/authentication/users)
- [Firestore Database](https://console.firebase.google.com/project/_/firestore/data)
- [Project Settings](https://console.firebase.google.com/project/_/settings/general)
- [Usage and Billing](https://console.firebase.google.com/project/_/usage)

## 📚 Additional Resources

- [Firebase Web Documentation](https://firebase.google.com/docs/web/setup)
- [Firebase Authentication Guide](https://firebase.google.com/docs/auth/web/start)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

## 🎯 Next Steps

1. Set up Firebase project and configuration
2. Configure authentication providers
3. Set up Firestore database with security rules
4. Test authentication and gallery functionality
5. Deploy to production environment

---

**Note**: Keep your Firebase configuration and service account keys secure. Never commit them to version control.