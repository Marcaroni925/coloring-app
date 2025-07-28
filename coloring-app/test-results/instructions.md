# Performance-Optimized Test Suite Instructions

> 🚀 **NEW**: Performance-optimized test suite with <3s E2E execution target
> 🖼️ **NEW**: Real image generation, save, and validation testing
> ⚡ **NEW**: Parallel execution with thread pools for maximum speed

## Performance Metrics

- **Target E2E Execution Time**: <3 seconds
- **Actual E2E Performance**: 2318ms
- **Total Test Execution**: 41638ms
- **Success Rate**: NaN%
- **Parallel Execution**: Enabled with thread pools

## Quick Start

### All Tests (Performance Optimized - Recommended)
```bash
npm run test:all:fast        # Fast execution of all test types
npm run test:coverage:full   # Comprehensive coverage with performance tracking
```

### Individual Test Types (Performance Optimized)
```bash
npm run test:coverage:fast    # Unit tests with fast coverage generation
npm run test:api              # API tests (optimized mocking)
npm run test:integration:fast # Real OpenAI API tests (fast mode)
npm run test:performance      # E2E tests optimized for <3s execution
npm run test:real-images      # Real image generation and validation
npm run test:e2e:fast         # All E2E tests with parallel execution
npm run test:accessibility    # Screen reader and WCAG compliance
npm run test:e2e:gallery      # Gallery bulk operations tests
npm run test:coverage:report  # Enhanced coverage report with performance metrics
```

### Watch Mode
```bash
npm run test:watch
```

## Test Files Overview

### 1. Unit Tests (src/__tests__/app.test.js)
- **Focus**: React component behavior with WCAG 2.1 AA compliance
- **Framework**: Vitest + React Testing Library + jest-axe
- **Key Tests**: 
  - Navigation and view switching with focus management
  - Mobile responsiveness with viewport testing
  - Authentication state management
  - Accessibility features (ARIA, keyboard navigation, screen readers)
  - High contrast and reduced motion support
  - Automated accessibility validation with axe-core

### 2. API Tests (server/__tests__/api.test.js)  
- **Focus**: Backend functionality with mocked OpenAI responses
- **Framework**: Vitest + Supertest
- **Key Tests**:
  - Prompt refinement with quality phrase validation
  - Image generation with DALL-E fallback handling
  - Authentication middleware and token validation
  - Gallery CRUD operations with bulk support
  - Error handling, rate limiting, and content filtering

### 3. OpenAI Integration Tests (server/__tests__/openai-integration.test.js)
- **Focus**: Real API integration testing
- **Framework**: Vitest + Supertest + Real OpenAI API
- **Requirements**: OPENAI_API_KEY environment variable
- **Key Tests**:
  - Actual prompt refinement quality validation
  - DALL-E 3 image generation with real responses
  - Rate limiting and API error handling
  - Content policy violation testing
  - Performance benchmarking and response time validation

### 4. E2E Tests (e2e/app.e2e.test.js)
- **Focus**: Full user workflows and browser compatibility
- **Framework**: Vitest + Puppeteer
- **Key Tests**:
  - Complete image generation flow
  - Mobile device testing (iPhone SE, 12, Samsung Galaxy S21, iPad)
  - Form validation and error states
  - Performance and load testing
  - Cross-browser compatibility

### 5. Accessibility E2E Tests (e2e/accessibility.e2e.test.js)
- **Focus**: Screen reader compatibility and WCAG compliance
- **Framework**: Vitest + Puppeteer + axe-puppeteer
- **Standards**: WCAG 2.1 AA, Section 508
- **Key Tests**:
  - Automated accessibility scanning with axe-core
  - Screen reader navigation simulation
  - Keyboard-only navigation testing
  - ARIA implementation validation
  - High contrast and reduced motion support
  - Live region announcements for dynamic content

### 6. Gallery Bulk Operations E2E Tests (e2e/gallery-bulk-operations.e2e.test.js)
- **Focus**: Multi-selection and bulk operations
- **Framework**: Vitest + Puppeteer
- **Key Tests**:
  - Checkbox selection and visual feedback
  - Select all/none functionality
  - Confirmation dialog interactions
  - Bulk deletion with error handling
  - Keyboard navigation through selections
  - Accessibility of bulk operations

## Coverage Targets

- **Statements**: ≥80%
- **Branches**: ≥75% 
- **Functions**: ≥80%
- **Lines**: ≥80%

## Quality Standards

### Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Touch targets ≥44px on mobile

### Performance  
- Page load time <5 seconds
- Responsive during image generation
- Memory-efficient large image handling

### Security
- Input sanitization and validation
- Firebase authentication token verification
- Content policy compliance checking

### Mobile Responsiveness
- iPhone SE, 12, Samsung Galaxy S21, iPad testing
- Touch interaction support
- Responsive layouts and navigation

## Environment Setup

### Required Environment Variables
Create a `.env.test.local` file for integration testing:

```bash
# Optional - Integration tests will skip if not provided
OPENAI_API_KEY=your_openai_api_key_here

# Test URLs (default values shown)
E2E_BASE_URL=http://localhost:5173
E2E_API_URL=http://localhost:3001

# Firebase test configuration (optional)
VITE_FIREBASE_API_KEY=test-api-key
VITE_FIREBASE_PROJECT_ID=test-project
```

## Enhanced Quality Standards (Performance Optimized)

### Performance Targets 🎯
- **E2E Test Execution**: <3 seconds (aggressive optimization)
- **Total Test Suite**: <30 seconds for full coverage
- **Page Load Time**: <3 seconds (optimized from 5s)
- **Form Interaction**: <2 seconds
- **View Navigation**: <1.5 seconds

### Real Image Testing 🖼️
- **Actual Image Generation**: Real OpenAI API calls for validation
- **File Save Verification**: PNG format validation and integrity checking
- **Download Functionality**: End-to-end file download and storage testing
- **Image Quality Validation**: Dimension and format verification

### Performance Optimizations ⚡
- **Parallel Execution**: Thread-based test running
- **Resource Optimization**: Selective asset loading
- **Aggressive Timeouts**: 1-3 second timeouts for fast feedback
- **Viewport Caching**: Reduced viewport change overhead
- **Request Interception**: Optimized mock responses

### Accessibility Compliance
- **WCAG 2.1 AA** compliance with performance optimization
- **Section 508** compatibility (fast execution)
- Screen reader compatibility testing
- Keyboard-only navigation support
- High contrast and reduced motion support

### Integration Testing (Performance Mode)
- Real OpenAI API prompt enhancement validation (fast mode)
- Quality phrase injection verification
- Rate limiting and error handling with actual API
- Content policy compliance testing
- **NEW**: Real image file generation and validation

### Bulk Operations
- Multi-selection with visual feedback (performance optimized)
- Confirmation dialogs with proper focus management
- Error recovery and user feedback
- Keyboard accessibility throughout workflow

## Running in CI/CD (Performance Optimized)

```bash
# Install dependencies
npm install

# Fast core test suite (optimized for CI)
npm run test:all:fast

# Performance testing without real API calls
npm run test:performance

# Full suite with integration tests (requires API keys)
npm run test:coverage:full

# Real image testing (requires OpenAI API key)
OPENAI_API_KEY=your_key npm run test:real-images

# Comprehensive coverage with performance metrics
npm run test:coverage:report
```

## Troubleshooting

### Common Issues
1. **Puppeteer fails**: Ensure Chrome/Chromium is installed
2. **Accessibility tests fail**: Update axe-core rules or fix WCAG violations
3. **Integration tests timeout**: Check OpenAI API key and rate limits
4. **E2E tests flaky**: Increase timeouts or improve element selectors

### Environment Setup
- Node.js ≥18
- Chrome/Chromium for Puppeteer E2E tests
- OpenAI API key for integration testing (optional)
- Firebase project credentials (for full integration)

### Performance Optimization (Enhanced)
- **<3s E2E Execution**: Aggressive timeout and resource optimization
- **Thread Pools**: Parallel test execution for maximum speed
- **Selective Loading**: Conditional asset loading based on test type
- **Fast Navigation**: DOM-ready instead of network-idle waiting
- **Optimized Puppeteer**: New headless mode with single-process option
- **Real Image Caching**: Smart caching for actual image generation tests
- **Performance Monitoring**: Built-in execution time tracking and reporting
