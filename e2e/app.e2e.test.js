import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import puppeteer from 'puppeteer'

describe('Coloring Book Creator E2E Tests', () => {
  let browser
  let page
  const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173'
  const API_URL = process.env.E2E_API_URL || 'http://localhost:3001'

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    })
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
  })

  beforeEach(async () => {
    page = await browser.newPage()
    
    // Enable console logging for debugging
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text())
      }
    })

    // Set viewport for consistent testing
    await page.setViewport({ width: 1200, height: 800 })
    
    // Mock API responses to avoid actual OpenAI calls
    await page.setRequestInterception(true)
    page.on('request', (request) => {
      if (request.url().includes('/api/generate') || request.url().includes('/api/refine-prompt')) {
        request.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
            refinedPrompt: 'A cute test image for coloring',
            originalPrompt: 'test',
            metadata: {
              category: 'animals',
              complexity: 'simple',
              ageGroup: 'kids'
            }
          })
        })
      } else {
        request.continue()
      }
    })

    await page.goto(BASE_URL, { waitUntil: 'networkidle0' })
  })

  afterEach(async () => {
    if (page) {
      await page.close()
    }
  })

  describe('Application Loading and Navigation', () => {
    it('loads the application successfully', async () => {
      await page.waitForSelector('h1', { timeout: 10000 })
      const title = await page.$eval('h1', el => el.textContent)
      expect(title).toContain('Coloring Book Creator')
    })

    it('displays all main navigation elements', async () => {
      const createButton = await page.$('[data-testid="nav-create"]')
      const galleryButton = await page.$('[data-testid="nav-gallery"]')
      
      expect(createButton).toBeTruthy()
      expect(galleryButton).toBeTruthy()
    })

    it('switches between create and gallery views', async () => {
      // Start on create view
      const promptInput = await page.$('[data-testid="prompt-input"]')
      expect(promptInput).toBeTruthy()

      // Switch to gallery
      await page.click('[data-testid="nav-gallery"]')
      await page.waitForSelector('[data-testid="gallery-container"]', { timeout: 5000 })
      
      const galleryContainer = await page.$('[data-testid="gallery-container"]')
      expect(galleryContainer).toBeTruthy()

      // Switch back to create
      await page.click('[data-testid="nav-create"]')
      await page.waitForSelector('[data-testid="prompt-input"]', { timeout: 5000 })
      
      const promptInputAgain = await page.$('[data-testid="prompt-input"]')
      expect(promptInputAgain).toBeTruthy()
    })
  })

  describe('Image Generation Workflow', () => {
    it('completes full image generation flow', async () => {
      // Fill out the form
      await page.type('[data-testid="prompt-input"]', 'a friendly dinosaur')
      
      // Select complexity
      await page.click('[data-testid="complexity-medium"]')
      
      // Select age group
      await page.click('[data-testid="age-kids"]')
      
      // Select line thickness
      await page.click('[data-testid="line-medium"]')
      
      // Submit form
      await page.click('[data-testid="generate-button"]')
      
      // Wait for loading state
      await page.waitForSelector('[data-testid="loading-spinner"]', { timeout: 5000 })
      
      // Wait for result
      await page.waitForSelector('[data-testid="generated-image"]', { timeout: 15000 })
      
      const generatedImage = await page.$('[data-testid="generated-image"]')
      expect(generatedImage).toBeTruthy()
    })

    it('validates form before submission', async () => {
      // Try to submit without required fields
      await page.click('[data-testid="generate-button"]')
      
      // Should show validation errors
      const errorMessage = await page.$('[data-testid="validation-error"]')
      expect(errorMessage).toBeTruthy()
      
      const errorText = await page.$eval('[data-testid="validation-error"]', el => el.textContent)
      expect(errorText).toContain('required')
    })

    it('prevents submission when form is invalid', async () => {
      // Enter invalid prompt (too short)
      await page.type('[data-testid="prompt-input"]', 'a')
      
      const generateButton = await page.$('[data-testid="generate-button"]')
      const isDisabled = await page.evaluate(el => el.disabled, generateButton)
      
      expect(isDisabled).toBe(true)
    })

    it('shows refined prompt during generation', async () => {
      await page.type('[data-testid="prompt-input"]', 'a cat')
      await page.click('[data-testid="complexity-simple"]')
      await page.click('[data-testid="age-kids"]')
      await page.click('[data-testid="line-thick"]')
      
      await page.click('[data-testid="generate-button"]')
      
      // Wait for refined prompt to appear
      await page.waitForSelector('[data-testid="refined-prompt"]', { timeout: 10000 })
      
      const refinedPrompt = await page.$eval('[data-testid="refined-prompt"]', el => el.textContent)
      expect(refinedPrompt).toContain('cute test image')
    })

    it('allows downloading generated images', async () => {
      // Generate an image first
      await page.type('[data-testid="prompt-input"]', 'a butterfly')
      await page.click('[data-testid="complexity-simple"]')
      await page.click('[data-testid="age-kids"]')
      await page.click('[data-testid="line-medium"]')
      await page.click('[data-testid="generate-button"]')
      
      // Wait for image to be generated
      await page.waitForSelector('[data-testid="generated-image"]', { timeout: 15000 })
      
      // Click download button
      const downloadButton = await page.$('[data-testid="download-button"]')
      expect(downloadButton).toBeTruthy()
      
      // Verify download functionality is present
      const downloadHref = await page.$eval('[data-testid="download-button"]', el => el.href)
      expect(downloadHref).toBeTruthy()
    })
  })

  describe('Mobile Responsiveness', () => {
    beforeEach(async () => {
      // Set mobile viewport
      await page.setViewport({ width: 375, height: 667 }) // iPhone SE dimensions
    })

    it('displays mobile navigation correctly', async () => {
      const mobileNav = await page.$('[data-testid="mobile-navigation"]')
      expect(mobileNav).toBeTruthy()
    })

    it('handles touch interactions on mobile', async () => {
      // Touch the gallery button
      await page.tap('[data-testid="nav-gallery"]')
      
      await page.waitForSelector('[data-testid="gallery-container"]', { timeout: 5000 })
      const galleryContainer = await page.$('[data-testid="gallery-container"]')
      expect(galleryContainer).toBeTruthy()
    })

    it('adjusts form layout for mobile screens', async () => {
      const form = await page.$('[data-testid="generation-form"]')
      const formStyles = await page.evaluate(el => {
        const styles = window.getComputedStyle(el)
        return {
          flexDirection: styles.flexDirection,
          padding: styles.padding
        }
      }, form)
      
      expect(formStyles.flexDirection).toBe('column')
    })

    it('provides accessible touch targets on mobile', async () => {
      const buttons = await page.$$('[data-testid*="button"]')
      
      for (const button of buttons) {
        const boundingBox = await button.boundingBox()
        // Touch targets should be at least 44px for accessibility
        expect(boundingBox.height).toBeGreaterThanOrEqual(44)
        expect(boundingBox.width).toBeGreaterThanOrEqual(44)
      }
    })
  })

  describe('Device-Specific Testing', () => {
    const devices = [
      { name: 'iPhone 12', viewport: { width: 390, height: 844 } },
      { name: 'Samsung Galaxy S21', viewport: { width: 384, height: 854 } },
      { name: 'iPad', viewport: { width: 768, height: 1024 } }
    ]

    devices.forEach(device => {
      it(`works correctly on ${device.name}`, async () => {
        await page.setViewport(device.viewport)
        await page.reload({ waitUntil: 'networkidle0' })
        
        // Test basic functionality
        const title = await page.$eval('h1', el => el.textContent)
        expect(title).toContain('Coloring Book Creator')
        
        // Test form interaction
        await page.type('[data-testid="prompt-input"]', 'test prompt')
        const inputValue = await page.$eval('[data-testid="prompt-input"]', el => el.value)
        expect(inputValue).toBe('test prompt')
      })
    })
  })

  describe('Accessibility Testing', () => {
    it('supports keyboard navigation', async () => {
      // Test tab navigation
      await page.keyboard.press('Tab')
      let activeElement = await page.evaluate(() => document.activeElement.getAttribute('data-testid'))
      expect(activeElement).toBeTruthy()
      
      // Continue tabbing through elements
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      // Should be able to activate elements with Enter/Space
      await page.keyboard.press('Enter')
      
      // Verify focus management
      const focusedElement = await page.evaluate(() => document.activeElement.tagName)
      expect(['BUTTON', 'INPUT', 'SELECT'].includes(focusedElement)).toBe(true)
    })

    it('provides appropriate ARIA labels', async () => {
      const promptInput = await page.$('[data-testid="prompt-input"]')
      const ariaLabel = await page.evaluate(el => el.getAttribute('aria-label'), promptInput)
      expect(ariaLabel).toBeTruthy()
      expect(ariaLabel).toContain('prompt')
    })

    it('maintains focus within modal dialogs', async () => {
      // Trigger a modal (if any exist in the app)
      const helpButton = await page.$('[data-testid="help-button"]')
      if (helpButton) {
        await helpButton.click()
        
        // Focus should be trapped within modal
        await page.keyboard.press('Tab')
        const focusedElement = await page.evaluate(() => document.activeElement.closest('[role="dialog"]'))
        expect(focusedElement).toBeTruthy()
      }
    })

    it('supports screen reader announcements', async () => {
      // Test live regions for status updates
      await page.type('[data-testid="prompt-input"]', 'test')
      await page.click('[data-testid="complexity-simple"]')
      await page.click('[data-testid="age-kids"]')
      await page.click('[data-testid="line-medium"]')
      await page.click('[data-testid="generate-button"]')
      
      // Check for aria-live regions
      const liveRegion = await page.$('[aria-live="polite"]')
      expect(liveRegion).toBeTruthy()
    })
  })

  describe('Gallery Functionality', () => {
    beforeEach(async () => {
      // Navigate to gallery
      await page.click('[data-testid="nav-gallery"]')
      await page.waitForSelector('[data-testid="gallery-container"]', { timeout: 5000 })
    })

    it('displays empty gallery state', async () => {
      const emptyState = await page.$('[data-testid="empty-gallery"]')
      expect(emptyState).toBeTruthy()
      
      const emptyMessage = await page.$eval('[data-testid="empty-gallery"]', el => el.textContent)
      expect(emptyMessage).toContain('no images')
    })

    it('shows authentication prompt for gallery access', async () => {
      const authPrompt = await page.$('[data-testid="auth-required"]')
      expect(authPrompt).toBeTruthy()
    })

    it('handles gallery loading states', async () => {
      // Mock gallery loading
      await page.reload()
      
      const loadingSpinner = await page.$('[data-testid="gallery-loading"]')
      if (loadingSpinner) {
        expect(loadingSpinner).toBeTruthy()
      }
    })
  })

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      // Mock network failure
      await page.setRequestInterception(true)
      page.removeAllListeners('request')
      page.on('request', (request) => {
        if (request.url().includes('/api/')) {
          request.abort()
        } else {
          request.continue()
        }
      })

      await page.type('[data-testid="prompt-input"]', 'test prompt')
      await page.click('[data-testid="complexity-simple"]')
      await page.click('[data-testid="age-kids"]')
      await page.click('[data-testid="line-medium"]')
      await page.click('[data-testid="generate-button"]')
      
      // Should show error message
      await page.waitForSelector('[data-testid="error-message"]', { timeout: 10000 })
      const errorMessage = await page.$('[data-testid="error-message"]')
      expect(errorMessage).toBeTruthy()
    })

    it('provides retry functionality on errors', async () => {
      // Trigger error first
      await page.setRequestInterception(true)
      page.removeAllListeners('request')
      page.on('request', (request) => {
        if (request.url().includes('/api/generate')) {
          request.respond({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ success: false, error: 'Server error' })
          })
        } else {
          request.continue()
        }
      })

      await page.type('[data-testid="prompt-input"]', 'test')
      await page.click('[data-testid="complexity-simple"]')
      await page.click('[data-testid="age-kids"]')
      await page.click('[data-testid="line-medium"]')
      await page.click('[data-testid="generate-button"]')
      
      // Wait for error and retry button
      await page.waitForSelector('[data-testid="retry-button"]', { timeout: 10000 })
      const retryButton = await page.$('[data-testid="retry-button"]')
      expect(retryButton).toBeTruthy()
    })

    it('handles content policy violations appropriately', async () => {
      await page.setRequestInterception(true)
      page.removeAllListeners('request')
      page.on('request', (request) => {
        if (request.url().includes('/api/')) {
          request.respond({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ 
              success: false, 
              error: 'Content policy violation',
              code: 'CONTENT_POLICY'
            })
          })
        } else {
          request.continue()
        }
      })

      await page.type('[data-testid="prompt-input"]', 'inappropriate content')
      await page.click('[data-testid="complexity-simple"]')
      await page.click('[data-testid="age-kids"]')
      await page.click('[data-testid="line-medium"]')
      await page.click('[data-testid="generate-button"]')
      
      await page.waitForSelector('[data-testid="policy-error"]', { timeout: 10000 })
      const policyError = await page.$('[data-testid="policy-error"]')
      expect(policyError).toBeTruthy()
    })
  })

  describe('Performance Testing', () => {
    it('loads within acceptable time limits', async () => {
      const startTime = Date.now()
      
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' })
      await page.waitForSelector('h1')
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(5000) // Should load within 5 seconds
    })

    it('handles large images without memory issues', async () => {
      // Mock large image response
      await page.setRequestInterception(true)
      page.removeAllListeners('request')
      page.on('request', (request) => {
        if (request.url().includes('/api/generate')) {
          request.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              imageUrl: 'data:image/png;base64,' + 'A'.repeat(100000), // Large mock image
              refinedPrompt: 'Large test image',
              originalPrompt: 'test'
            })
          })
        } else {
          request.continue()
        }
      })

      await page.type('[data-testid="prompt-input"]', 'large image test')
      await page.click('[data-testid="complexity-complex"]')
      await page.click('[data-testid="age-adults"]')
      await page.click('[data-testid="line-fine"]')
      await page.click('[data-testid="generate-button"]')
      
      // Should handle large image without crashing
      await page.waitForSelector('[data-testid="generated-image"]', { timeout: 20000 })
      const image = await page.$('[data-testid="generated-image"]')
      expect(image).toBeTruthy()
    })

    it('maintains responsiveness during image generation', async () => {
      await page.type('[data-testid="prompt-input"]', 'responsiveness test')
      await page.click('[data-testid="complexity-simple"]')
      await page.click('[data-testid="age-kids"]')
      await page.click('[data-testid="line-medium"]')
      await page.click('[data-testid="generate-button"]')
      
      // Should be able to interact with other elements during generation
      await page.waitForSelector('[data-testid="loading-spinner"]')
      
      // Try clicking gallery tab during loading
      await page.click('[data-testid="nav-gallery"]')
      
      // Should switch views even during generation
      const galleryContainer = await page.$('[data-testid="gallery-container"]')
      expect(galleryContainer).toBeTruthy()
    })
  })
})