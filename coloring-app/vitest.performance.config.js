import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Performance-optimized Vitest configuration for E2E tests
 * Target: <3 second execution time for E2E test suite
 */
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    
    // Performance optimizations
    testTimeout: 3000, // Aggressive 3s timeout for <3s target
    hookTimeout: 2000,
    pool: 'threads', // Use threads for better performance
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 6, // Increased for performance
        minThreads: 3,
        isolate: false // Share context for speed
      }
    },
    
    // Fast execution settings
    reporter: ['minimal'], // Minimal output for speed
    fileParallelism: true, // Enable parallel file execution
    coverage: false, // Disable coverage for performance tests
    
    // Performance-specific includes
    include: [
      'e2e/**/*.{test,spec}.{js,jsx,ts,tsx}'
    ],
    exclude: [
      'node_modules/',
      'dist/',
      '.git/',
      'coverage/',
      'test-results/',
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}', // Exclude unit tests
      'server/**/*.{test,spec}.{js,jsx,ts,tsx}' // Exclude server tests
    ],
    
    // Environment optimizations
    env: {
      NODE_ENV: 'test',
      VITEST: 'true',
      PERFORMANCE_MODE: 'true',
      TEST_REAL_IMAGES: 'false' // Disable for performance tests
    },
    
    // Fast retry settings
    retry: 0, // No retries for speed
    bail: 5, // Stop after 5 failures
    
    // Output settings
    silent: false,
    passWithNoTests: true
  },
  
  define: {
    'process.env': process.env
  },
  
  // Optimizations for E2E performance
  esbuild: {
    target: 'node18',
    minify: false // Skip minification for speed
  },
  
  // Server optimizations
  server: {
    deps: {
      inline: ['puppeteer', 'axe-puppeteer'],
      external: ['sharp', 'canvas'] // Externalize heavy deps
    }
  }
})