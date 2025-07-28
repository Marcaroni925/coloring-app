import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{js,jsx,ts,tsx}',
        '**/*.spec.{js,jsx,ts,tsx}',
        'vite.config.js',
        'vitest.config.js',
        'server/config/',
        'e2e/',
        'test-coverage.js'
      ],
      thresholds: {
        global: {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80
        },
        'src/components/': {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85
        },
        'server/': {
          branches: 70,
          functions: 75,
          lines: 75,
          statements: 75
        }
      }
    },
    include: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'server/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'e2e/**/*.{test,spec}.{js,jsx,ts,tsx}'
    ],
    // Enhanced test reporting
    onConsoleLog: (log, type) => {
      if (log.includes('📊') || log.includes('⚡') || log.includes('🌐')) {
        return false // Don't suppress performance logs
      }
      return true
    },
    exclude: [
      'node_modules/',
      'dist/',
      '.git/',
      'coverage/',
      'test-results/'
    ],
    testTimeout: 10000, // Optimized for performance
    hookTimeout: 10000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 2
      }
    },
    // Performance optimizations for E2E tests
    fileParallelism: false, // Run E2E tests sequentially to avoid conflicts
    isolate: false, // Share context between tests for better performance
    reporters: ['verbose', 'json'],
    outputFile: {
      junit: './test-results/junit.xml',
      json: './test-results/results.json'
    },
    // Enhanced configuration for different test types
    env: {
      NODE_ENV: 'test',
      VITEST: 'true'
    }
  },
  define: {
    'process.env': process.env
  },
  // Performance optimization for different test environments
  esbuild: {
    target: 'node18'
  },
  // Optimize E2E test execution
  server: {
    deps: {
      inline: ['puppeteer', 'axe-puppeteer']
    }
  }
})