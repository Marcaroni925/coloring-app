/**
 * Constants for Coloring Book Generator Application
 * 
 * This file contains all application constants, configuration values,
 * and reusable data structures to maintain consistency and enable
 * easy configuration management.
 * 
 * Evidence: architecture.md Section 4.3 - Configuration Management
 * Best Practice: Single source of truth for application constants
 */

// Application metadata
export const APP_CONFIG = {
  name: 'Coloring Book Creator',
  version: '1.0.0',
  description: 'AI-powered coloring book page generator with customization options'
};

// Theme colors - Evidence: architecture.md Section 2.1 Design System
export const THEME_COLORS = {
  // Primary palette
  pastelPink: '#F9F5F6',
  pastelBlue: '#A7C7E7',
  pastelGreen: '#D7E4BC',
  pastelPurple: '#C7A7E7',
  
  // Accent colors
  accentPink: '#FFE6E6',
  errorPink: '#FF6B81',
  hoverBlue: '#5067C9',
  darkMode: '#2D3A56',
  mutedGray: '#8A94A6',
  
  // UI states
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6'
};

// Form validation rules - Evidence: architecture.md Section 3.2 Form Validation
export const VALIDATION_CONFIG = {
  prompt: {
    minLength: 1,
    maxLength: 500,
    required: true,
    errorMessage: 'Please enter a description'
  },
  complexity: {
    required: false, // Made optional - will use medium as default
    options: ['simple', 'medium', 'detailed'],
    errorMessage: 'Select complexity'
  },
  ageGroup: {
    required: false, // Made optional - will use kids as default  
    options: ['kids', 'teens', 'adults'],
    errorMessage: 'Select age group'
  },
  lineThickness: {
    required: false, // Made optional - will use medium as default
    options: ['thin', 'medium', 'thick'],
    errorMessage: 'Select line thickness'
  }
};

// Theme options with metadata - Evidence: architecture.md Section 2.2 Theme System
export const THEME_OPTIONS = [
  {
    value: 'animals',
    label: 'Animals',
    description: 'Cute animals and pets',
    icon: 'paw'
  },
  {
    value: 'mandalas',
    label: 'Mandalas',
    description: 'Intricate circular patterns',
    icon: 'flower'
  },
  {
    value: 'fantasy',
    label: 'Fantasy',
    description: 'Magical creatures and scenes',
    icon: 'unicorn'
  },
  {
    value: 'nature',
    label: 'Nature',
    description: 'Trees, flowers, and landscapes',
    icon: 'leaf'
  }
];

// Animation configurations - Evidence: architecture.md Section 2.3 Animations
export const ANIMATION_CONFIG = {
  // Duration settings
  durations: {
    fast: '200ms',
    normal: '300ms',
    slow: '500ms',
    extraSlow: '800ms'
  },
  
  // Easing functions
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },
  
  // Specific animation settings
  crayonDraw: {
    duration: '2s',
    easing: 'ease-in',
    delay: '0s'
  },
  
  confetti: {
    duration: '3s',
    particleCount: 20,
    delayRange: [0.1, 1.1]
  }
};

// API configuration - Evidence: architecture.md Section 4.1 API Integration
export const API_CONFIG = {
  endpoints: {
    generate: '/api/generate',
    generatePdf: '/api/generate-pdf',
    saveImage: '/api/auth/save-image'
  },
  
  timeout: 120000, // 2 minutes
  
  retryConfig: {
    attempts: 3,
    delay: 1000
  }
};

// Responsive breakpoints - Evidence: architecture.md Section 2.4 Responsive Design
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
  wide: 1536
};

// Default form state
// Evidence: architecture.md Section 3.2 - Form Architecture provides sensible defaults for better UX
export const DEFAULT_FORM_STATE = {
  prompt: '',
  theme: '',
  complexity: 'medium', // Default to medium complexity for balanced detail
  ageGroup: 'kids', // Default to kid-friendly for family content
  border: false,
  lineThickness: 'medium' // Default to medium thickness for general use
};

// Error messages - Evidence: architecture.md Section 3.4 Error Handling
export const ERROR_MESSAGES = {
  // API errors
  apiGeneral: 'Failed to generate coloring page. Please try again.',
  apiTimeout: 'Request timed out. Please try again.',
  apiRateLimit: 'Too many requests. Please wait a moment and try again.',
  apiContentPolicy: 'Content violates AI safety guidelines. Please try a different prompt.',
  apiFamilyFriendly: 'Please use family-friendly content only.',
  
  // PDF errors
  pdfGeneration: 'Failed to generate PDF. Please try again.',
  pdfMissingImage: 'No image available for PDF generation',
  
  // Gallery errors
  galleryAuth: 'Please sign in to save images to your gallery',
  gallerySave: 'Failed to save image to gallery. Please try again.',
  
  // Form validation
  formInvalid: 'Please fill in all required fields',
  promptRequired: 'Please enter a description for your coloring page'
};

// Success messages
export const SUCCESS_MESSAGES = {
  imageGenerated: 'Your coloring page has been generated successfully!',
  pdfDownloaded: 'PDF downloaded successfully',
  imageSaved: 'Image saved to your gallery!',
  formValid: 'All fields completed correctly'
};

// Z-index layers - Evidence: architecture.md Section 2.5 Layout System
export const Z_INDEXES = {
  background: -2,
  base: 0,
  doodle: -1,
  content: 1,
  header: 10,
  modal: 50,
  tooltip: 100,
  mobileButton: 1000
};

// Performance configuration
export const PERFORMANCE_CONFIG = {
  imageOptimization: {
    quality: 0.8,
    format: 'webp',
    fallback: 'jpeg'
  },
  
  debounceDelay: 300,
  throttleDelay: 100,
  
  chunkSize: {
    small: 50,
    medium: 100,
    large: 200
  }
};

// Accessibility configuration - Evidence: architecture.md Section 2.6 Accessibility
export const A11Y_CONFIG = {
  focusOutlineWidth: '3px',
  minimumTouchTarget: '48px',
  colorContrastRatio: 4.5,
  
  ariaLabels: {
    generateButton: 'Generate coloring page',
    themeSelect: 'Select theme for coloring page',
    complexitySelect: 'Select detail complexity level',
    ageGroupSelect: 'Select target age group',
    highContrastToggle: 'Toggle high contrast mode',
    downloadPdf: 'Download coloring page as PDF',
    saveToGallery: 'Save coloring page to gallery'
  }
};

// Development configuration
export const DEV_CONFIG = {
  enableDebugMode: process.env.NODE_ENV === 'development',
  enablePerformanceLogging: false,
  enableAnimationDebugging: false,
  mockApiCalls: false
};