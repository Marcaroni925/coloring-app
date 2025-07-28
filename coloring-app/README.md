# Coloring Book Creator

A modern, AI-powered coloring book generator that transforms user descriptions into beautiful black-and-white line art perfect for coloring. Built with React, Node.js, and integrated with OpenAI's DALL-E API.

## ✨ Features

### 🎨 Image Generation
- **AI-Powered Creation**: Uses OpenAI GPT to refine prompts and DALL-E 3 to generate high-quality coloring pages
- **Smart Customization**: Complexity levels, age groups, line thickness, and themed options
- **Real-time Validation**: Interactive form with instant feedback and validation
- **Zoomable Preview**: Full zoom and pan capabilities using react-zoom-pan-pinch

### 📱 User Experience
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Accessibility**: ARIA labels, high contrast mode, reduced motion support
- **Interactive Animations**: Delightful confetti celebrations and smooth transitions
- **Progress Feedback**: Loading states and progress indicators

### 💾 Gallery & Export
- **Firebase Integration**: User authentication and personal gallery storage
- **PDF Export**: High-quality 300 DPI PDF generation for printing
- **Metadata Tracking**: Complete generation history with AI enhancement details
- **Gallery Management**: Save, organize, and manage your creations

### 🎭 Theming System
- **Pastel Color Palette**: Carefully crafted color system with accessibility in mind
- **Custom Animations**: Crayon-drawing effects, confetti celebrations, and micro-interactions
- **Dark Mode Support**: High contrast toggle for better accessibility
- **Consistent Typography**: Handlee font for playful, child-friendly appearance

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- OpenAI API key (for image generation)
- Firebase project (for authentication and storage)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd coloring-app
   npm install
   ```

2. **Environment Setup**
   Create `.env` file in the root directory:
   ```env
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   ```

3. **Start Development**
   ```bash
   # Start frontend (Vite dev server)
   npm run dev
   
   # Start backend server (in separate terminal)
   npm run server
   
   # Or start both simultaneously
   npm run dev:full
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## 🏗️ Project Architecture

### Folder Structure
```
src/
├── components/           # React components
│   ├── ui/              # Shadcn UI components
│   ├── PromptForm.jsx   # Form component with validation
│   ├── PreviewArea.jsx  # Image preview with zoom
│   └── PromptComponent.jsx # Main orchestrator component
├── hooks/               # Custom React hooks
│   ├── index.js         # Barrel exports
│   ├── useValidation.js # Form validation logic
│   ├── useGeneration.js # Image generation workflow
│   └── useResponsive.js # Responsive behavior
├── styles/              # Organized stylesheets
│   ├── index.css        # Main entry point
│   ├── globals.css      # Global styles and utilities
│   └── animations.css   # Animation definitions
├── utils/               # Utility functions and constants
│   ├── index.js         # Barrel exports
│   ├── constants.js     # App configuration
│   ├── validation.js    # Validation rules
│   ├── api.js          # API helpers
│   └── helpers.js       # General utilities
└── main.jsx            # Application entry point
```

### Component Architecture
- **Separation of Concerns**: Form logic, validation, and API calls separated into custom hooks
- **Reusable Components**: PromptForm and PreviewArea can be used independently
- **Custom Hooks**: Business logic abstracted into testable, reusable hooks
- **Responsive Design**: useResponsive hook handles viewport-specific behavior

### Design System
- **Pastel Color Palette**: Carefully crafted colors for child-friendly aesthetics
- **Typography System**: Handlee font with responsive sizing
- **Animation Framework**: Custom keyframes with accessibility considerations
- **Component Styling**: Consistent patterns using Tailwind CSS

## 🔧 Configuration

### Tailwind Configuration
The project uses an enhanced Tailwind setup with:
- **Custom Color Palette**: Pastel colors (pastel-pink, pastel-blue, etc.)
- **Animation System**: Custom keyframes and timing functions
- **Typography Scale**: Responsive font sizing with line heights
- **Accessibility**: Reduced motion and high contrast support

### API Endpoints
- `POST /api/generate` - Generate coloring page with AI enhancement
- `POST /api/generate-pdf` - Convert image to high-quality PDF
- `POST /api/auth/save-image` - Save image to user's gallery
- `GET /api/auth/gallery` - Retrieve user's saved images
- `DELETE /api/auth/gallery/:id` - Remove image from gallery

### Firebase Integration
- **Authentication**: Email/password and Google sign-in
- **Firestore**: User profiles and image metadata storage
- **Storage**: Generated image caching and organization

## 🧪 Development Workflow

### Code Quality
- **ESLint Configuration**: React and accessibility rules
- **Component Standards**: Functional components with hooks
- **TypeScript Ready**: JSDoc comments for type hints
- **Performance**: Memoization and code splitting

### Testing Strategy
- **Unit Tests**: Custom hooks and utility functions
- **Component Tests**: Form validation and user interactions
- **Integration Tests**: API endpoints and database operations
- **E2E Tests**: Complete user workflows

### Build Process
```bash
# Development build with hot reload
npm run dev

# Production build with optimization
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Type checking
npm run type-check
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px (stacked layout, mobile-optimized forms)
- **Tablet**: 768px - 1023px (hybrid layout with touch optimization)
- **Desktop**: 1024px+ (side-by-side layout with hover effects)

### Mobile Optimizations
- **Touch-Friendly**: Large tap targets and gesture support
- **Performance**: Lazy loading and optimized images
- **Navigation**: Mobile-first navigation patterns
- **Forms**: Mobile keyboard optimization

## 🔒 Security & Privacy

### API Security
- **Authentication**: Firebase Auth with JWT tokens
- **Rate Limiting**: OpenAI API usage limits and retry logic
- **Input Validation**: Server-side sanitization and validation
- **Error Handling**: Safe error messages without sensitive data

### Content Safety
- **Family-Friendly**: Content policy enforcement
- **Prompt Filtering**: Inappropriate content detection
- **User Guidelines**: Clear usage terms and guidelines

## 🚀 Deployment

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel/Netlify
npm run deploy

# Docker deployment
docker build -t coloring-app .
docker run -p 3000:3000 coloring-app
```

### Backend Deployment
- **Environment Variables**: Secure API key management
- **Database Setup**: Firebase Firestore configuration
- **CDN Integration**: Image serving and caching
- **Monitoring**: Error tracking and performance metrics

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install`
4. Make changes following code standards
5. Test your changes: `npm run test`
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Open Pull Request

### Code Standards
- **Component Structure**: Functional components with hooks
- **Styling**: Tailwind CSS with custom design tokens
- **Documentation**: JSDoc comments for complex functions
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Core Web Vitals optimization

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🙏 Acknowledgments

- **OpenAI**: DALL-E 3 and GPT API integration
- **Shadcn/ui**: Beautiful, accessible UI components
- **React Zoom Pan Pinch**: Image zoom functionality
- **Tailwind CSS**: Utility-first CSS framework
- **Firebase**: Authentication and data storage
- **Handlee Font**: Child-friendly typography

---

**Built with ❤️ for creative minds everywhere**

For detailed architecture documentation, see [architecture.md](docs/architecture.md)