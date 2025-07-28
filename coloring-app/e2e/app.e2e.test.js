import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import puppeteer from 'puppeteer'
import { promises as fs } from 'fs'
import path from 'path'

describe('Coloring Book Creator E2E Tests (Performance Optimized)', () => {
  let browser
  let page
  const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173'
  const API_URL = process.env.E2E_API_URL || 'http://localhost:3001'
  
  // Performance-optimized browser configuration
  const browserOptions = {
    headless: 'new', // Use new headless mode for better performance
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--disable-ipc-flooding-protection',
      '--no-first-run',
      '--single-process', // Faster startup
      '--disable-gpu',
      '--disable-web-security' // For testing only
    ],
    defaultViewport: { width: 1200, height: 800 }, // Set once
    ignoreDefaultArgs: ['--disable-extensions']
  }

  beforeAll(async () => {
    browser = await puppeteer.launch(browserOptions)
    
    // Create downloads directory for real image testing
    await fs.mkdir('./test-downloads', { recursive: true })
  }, 5000)

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
    
    // Cleanup test downloads
    try {
      await fs.rmdir('./test-downloads', { recursive: true })
    } catch (error) {
      console.warn('Could not cleanup test downloads:', error.message)
    }
  })

  beforeEach(async () => {
    page = await browser.newPage()
    
    // Optimized performance settings
    await page.setDefaultTimeout(2500) // Aggressive timeout for <3s performance
    await page.setDefaultNavigationTimeout(2500)
    
    // Enable downloads for real image testing
    const downloadPath = path.resolve('./test-downloads')
    await page._client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: downloadPath
    })
    
    // Conditional request interception for performance
    const testRealImages = process.env.TEST_REAL_IMAGES === 'true'
    
    if (!testRealImages) {
      // Disable images and CSS for faster loading (except when testing real images)
      await page.setRequestInterception(true)
      page.on('request', (request) => {
        const resourceType = request.resourceType()
        if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font') {
          request.abort()
        } else if (request.url().includes('/api/generate') || request.url().includes('/api/refine-prompt')) {
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
    }

    // Fast navigation - don't wait for all network activity
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
  }, 3000)

  afterEach(async () => {
    if (page) {
      await page.close()
    }
  })

  describe('Fast Application Loading', () => {
    it('loads the application successfully', async () => {
      await page.waitForSelector('h1', { timeout: 1500 })
      const title = await page.$eval('h1', el => el.textContent)
      expect(title).toContain('Coloring Book Creator')
    }, 2500)

    it('displays main navigation elements', async () => {
      const [createButton, galleryButton] = await Promise.all([
        page.$('[data-testid="nav-create"]'),
        page.$('[data-testid="nav-gallery"]')
      ])
      
      expect(createButton).toBeTruthy()
      expect(galleryButton).toBeTruthy()
    }, 2000)

    it('switches between views rapidly', async () => {
      // Start on create view
      const promptInput = await page.$('[data-testid="prompt-input"]')
      expect(promptInput).toBeTruthy()

      // Switch to gallery
      await page.click('[data-testid="nav-gallery"]')
      await page.waitForSelector('[data-testid="gallery-container"]', { timeout: 1500 })
      
      // Switch back to create
      await page.click('[data-testid="nav-create"]')
      await page.waitForSelector('[data-testid="prompt-input"]', { timeout: 1000 })
      
      const promptInputAgain = await page.$('[data-testid="prompt-input"]')
      expect(promptInputAgain).toBeTruthy()
    }, 3000)
  })

  describe('Optimized Image Generation Workflow', () => {
    it('completes image generation flow quickly', async () => {
      // Parallel form filling for speed
      await Promise.all([
        page.type('[data-testid="prompt-input"]', 'fast test'),
        page.waitForSelector('[data-testid="complexity-medium"]')
      ])
      
      // Quick selections
      await page.click('[data-testid="complexity-medium"]')
      await page.click('[data-testid="age-kids"]')
      await page.click('[data-testid="line-medium"]')
      
      // Submit form
      await page.click('[data-testid="generate-button"]')
      
      // Wait for results with aggressive timeout
      await page.waitForSelector('[data-testid="loading-spinner"]', { timeout: 1000 })
      await page.waitForSelector('[data-testid="generated-image"]', { timeout: 2000 })
      
      const generatedImage = await page.$('[data-testid="generated-image"]')
      expect(generatedImage).toBeTruthy()
    }, 3000)

    it('validates form instantly', async () => {
      // Try to submit without required fields
      await page.click('[data-testid="generate-button"]')
      
      // Should show validation errors quickly
      const errorMessage = await page.waitForSelector('[data-testid="validation-error"]', { timeout: 1000 })
      expect(errorMessage).toBeTruthy()
      
      const errorText = await page.$eval('[data-testid="validation-error"]', el => el.textContent)
      expect(errorText).toContain('required')
    }, 2000)
  })

  describe('Real Image Save and Download Testing', () => {
    it('generates and saves a real image file', async () => {
      // Set environment to allow real image testing
      process.env.TEST_REAL_IMAGES = 'true'
      
      // Fill out form for real image generation
      await page.type('[data-testid="prompt-input"]', 'a simple circle for coloring')
      await page.click('[data-testid="complexity-simple"]')
      await page.click('[data-testid="age-kids"]')
      await page.click('[data-testid="line-thick"]')
      
      // Generate image
      await page.click('[data-testid="generate-button"]')
      
      // Wait for real image generation (longer timeout for actual API call)
      await page.waitForSelector('[data-testid="generated-image"]', { timeout: 8000 })
      
      // Test download functionality
      const downloadButton = await page.$('[data-testid="download-button"]')
      expect(downloadButton).toBeTruthy()
      
      // Click download and verify file creation
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="download-button"]')
      ])
      
      // Save the file
      const fileName = `test-image-${Date.now()}.png`
      const downloadPath = path.join('./test-downloads', fileName)
      await download.saveAs(downloadPath)
      
      // Verify file exists and has content
      const stats = await fs.stat(downloadPath)
      expect(stats.size).toBeGreaterThan(0)
      expect(stats.isFile()).toBe(true)
      
      // Verify it's a valid PNG file (check header)
      const buffer = await fs.readFile(downloadPath)
      const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47
      expect(isPNG).toBe(true)
    }, 10000) // Allow more time for real image generation
    
    it('validates image dimensions and quality', async () => {
      process.env.TEST_REAL_IMAGES = 'true'
      
      await page.type('[data-testid="prompt-input"]', 'quality test image')
      await page.click('[data-testid="complexity-medium"]')
      await page.click('[data-testid="age-kids"]')
      await page.click('[data-testid="line-medium"]')
      
      await page.click('[data-testid="generate-button"]')
      await page.waitForSelector('[data-testid="generated-image"]', { timeout: 8000 })
      
      // Check image properties
      const imageProperties = await page.evaluate(() => {
        const img = document.querySelector('[data-testid="generated-image"]')
        return {
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          complete: img.complete,
          src: img.src.substring(0, 50) // First 50 chars to verify data URL
        }
      })
      
      expect(imageProperties.naturalWidth).toBeGreaterThan(0)
      expect(imageProperties.naturalHeight).toBeGreaterThan(0)
      expect(imageProperties.complete).toBe(true)
      expect(imageProperties.src).toContain('data:image')
    }, 10000)
  })

  describe('Mobile Performance Testing', () => {
    it('handles mobile viewport changes quickly', async () => {
      // Test multiple viewport changes rapidly
      const viewports = [
        { width: 375, height: 667 }, // iPhone SE
        { width: 390, height: 844 }, // iPhone 12
        { width: 384, height: 854 }  // Galaxy S21
      ]
      
      for (const viewport of viewports) {
        await page.setViewport(viewport)
        
        // Quick verification
        const title = await page.$eval('h1', el => el.textContent)
        expect(title).toContain('Coloring Book Creator')
      }
    }, 3000)

    it('supports touch interactions rapidly', async () => {
      await page.setViewport({ width: 375, height: 667 })
      
      // Touch the gallery button
      await page.tap('[data-testid="nav-gallery"]')
      await page.waitForSelector('[data-testid="gallery-container"]', { timeout: 1500 })
      
      const galleryContainer = await page.$('[data-testid="gallery-container"]')
      expect(galleryContainer).toBeTruthy()
    }, 2500)
  })

  describe('Performance Benchmarking', () => {
    it('measures page load performance', async () => {
      const startTime = Date.now()
      
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
      await page.waitForSelector('h1')
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(3000) // Must load within 3 seconds
      
      console.log(`Page load time: ${loadTime}ms`)
    }, 3500)

    it('measures form interaction performance', async () => {
      const startTime = Date.now()
      
      // Rapid form completion
      await page.type('[data-testid="prompt-input"]', 'performance test')
      await page.click('[data-testid="complexity-simple"]')
      await page.click('[data-testid="age-kids"]')
      await page.click('[data-testid="line-medium"]')
      await page.click('[data-testid="generate-button"]')
      
      await page.waitForSelector('[data-testid="loading-spinner"]')
      
      const interactionTime = Date.now() - startTime
      expect(interactionTime).toBeLessThan(2000) // Form interaction under 2s
      
      console.log(`Form interaction time: ${interactionTime}ms`)
    }, 2500)

    it('tests navigation performance', async () => {
      const startTime = Date.now()
      
      // Rapid navigation between views
      await page.click('[data-testid="nav-gallery"]')
      await page.waitForSelector('[data-testid="gallery-container"]')
      await page.click('[data-testid="nav-create"]')
      await page.waitForSelector('[data-testid="prompt-input"]')
      
      const navigationTime = Date.now() - startTime
      expect(navigationTime).toBeLessThan(1500) // Navigation under 1.5s
      
      console.log(`Navigation time: ${navigationTime}ms`)
    }, 2000)
  })

  describe('Error Handling Performance', () => {
    it('handles network errors quickly', async () => {
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

      await page.type('[data-testid="prompt-input"]', 'error test')
      await page.click('[data-testid="complexity-simple"]')
      await page.click('[data-testid="age-kids"]')
      await page.click('[data-testid="line-medium"]')
      await page.click('[data-testid="generate-button"]')
      
      // Should show error message quickly
      await page.waitForSelector('[data-testid="error-message"]', { timeout: 2000 })
      const errorMessage = await page.$('[data-testid="error-message"]')
      expect(errorMessage).toBeTruthy()
    }, 3000)
  })

  describe('Network Performance Integration', () => {
    it('measures baseline performance metrics', async () => {
      const startTime = Date.now()
      
      // Navigate and measure basic load time
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
      await page.waitForSelector('h1')
      
      const loadTime = Date.now() - startTime
      console.log(`📊 Baseline load time: ${loadTime}ms`)
      
      expect(loadTime).toBeLessThan(3000)
      
      // Store metric for visual reporting
      if (typeof globalThis.performanceMetrics === 'undefined') {
        globalThis.performanceMetrics = {}
      }
      globalThis.performanceMetrics.baselineLoad = loadTime
    }, 4000)

    it('validates performance with simulated slow connection', async () => {
      const client = await page.target().createCDPSession()
      
      // Apply 3G throttling
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps
        uploadThroughput: 750 * 1024 / 8, // 750 Kbps
        latency: 150 // 150ms latency
      })
      
      const startTime = Date.now()
      
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForSelector('h1', { timeout: 8000 })
      
      const throttledLoadTime = Date.now() - startTime
      console.log(`🌐 3G load time: ${throttledLoadTime}ms`)
      
      // Should still load within reasonable time on 3G
      expect(throttledLoadTime).toBeLessThan(8000)
      
      // Reset network conditions
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: -1,
        uploadThroughput: -1,
        latency: 0
      })
      
      if (typeof globalThis.performanceMetrics === 'undefined') {
        globalThis.performanceMetrics = {}
      }
      globalThis.performanceMetrics.throttledLoad = throttledLoadTime
    }, 12000)

    it('tests form responsiveness under network constraints', async () => {
      const client = await page.target().createCDPSession()
      
      // Apply Slow 3G conditions
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 500 * 1024 / 8, // 500 Kbps
        uploadThroughput: 500 * 1024 / 8, // 500 Kbps  
        latency: 400 // 400ms latency
      })
      
      const formStartTime = Date.now()
      
      // Test form interaction speed
      await page.type('[data-testid="prompt-input"]', 'network constraint test')
      await page.click('[data-testid="complexity-medium"]')
      await page.click('[data-testid="age-kids"]')
      await page.click('[data-testid="line-medium"]')
      
      const formInteractionTime = Date.now() - formStartTime
      console.log(`📝 Slow network form interaction: ${formInteractionTime}ms`)
      
      // Form should remain responsive even on slow network
      expect(formInteractionTime).toBeLessThan(5000)
      
      // Reset network
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: -1,
        uploadThroughput: -1,
        latency: 0
      })
    }, 10000)
  })
})

// Global teardown to save performance metrics
process.on('exit', () => {
  if (typeof globalThis.performanceMetrics !== 'undefined') {
    console.log('\n📊 Performance Metrics Summary:')
    Object.entries(globalThis.performanceMetrics).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}ms`)
    })
  }
})