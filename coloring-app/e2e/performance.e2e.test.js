import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import puppeteer from 'puppeteer'

describe('Performance and Network E2E Tests', () => {
  let browser
  let page
  const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173'
  const API_URL = process.env.E2E_API_URL || 'http://localhost:3001'
  
  // Performance metrics tracking
  const performanceMetrics = {
    generationTimes: [],
    networkTimes: [],
    throttledTimes: []
  }
  
  // Network configurations for testing
  const networkProfiles = {
    '3G': {
      downloadThroughput: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps
      uploadThroughput: 750 * 1024 / 8, // 750 Kbps
      latency: 150 // 150ms latency
    },
    'Slow3G': {
      downloadThroughput: 500 * 1024 / 8, // 500 Kbps
      uploadThroughput: 500 * 1024 / 8, // 500 Kbps
      latency: 400 // 400ms latency
    },
    'Fast3G': {
      downloadThroughput: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps
      uploadThroughput: 750 * 1024 / 8, // 750 Kbps
      latency: 150 // 150ms latency
    }
  }

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--no-first-run',
        '--disable-gpu'
      ],
      defaultViewport: { width: 1200, height: 800 }
    })
  }, 10000)

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
    
    // Log performance summary
    console.log('\n📊 Performance Test Results:')
    console.log(`  Generation Times: ${performanceMetrics.generationTimes.join('ms, ')}ms`)
    console.log(`  Network Times: ${performanceMetrics.networkTimes.join('ms, ')}ms`)
    console.log(`  Throttled Times: ${performanceMetrics.throttledTimes.join('ms, ')}ms`)
  })

  beforeEach(async () => {
    page = await browser.newPage()
    
    // Enable request interception for performance monitoring
    await page.setRequestInterception(true)
    
    // Track request timings
    const requestTimes = new Map()
    
    page.on('request', (request) => {
      requestTimes.set(request.url(), Date.now())
      
      // Allow real API calls for performance testing
      if (process.env.OPENAI_API_KEY && (request.url().includes('/api/generate') || request.url().includes('/api/refine-prompt'))) {
        request.continue()
      } else if (request.url().includes('/api/generate') || request.url().includes('/api/refine-prompt')) {
        // Mock response for tests without API key
        request.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
            refinedPrompt: 'A performance test image for coloring',
            originalPrompt: 'performance test',
            metadata: {
              category: 'test',
              complexity: 'simple',
              ageGroup: 'kids'
            }
          })
        })
      } else {
        request.continue()
      }
    })
    
    page.on('response', (response) => {
      const requestTime = requestTimes.get(response.url())
      if (requestTime && response.url().includes('/api/')) {
        const responseTime = Date.now() - requestTime
        performanceMetrics.networkTimes.push(responseTime)
      }
    })

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
  }, 5000)

  afterEach(async () => {
    if (page) {
      await page.close()
    }
  })

  describe('Image Generation Performance Tests', () => {
    it('generates image within 10 seconds', async () => {
      const startTime = Date.now()
      
      // Fill out form for generation
      await page.type('[data-testid="prompt-input"]', 'performance test image')
      await page.click('[data-testid="complexity-simple"]')
      await page.click('[data-testid="age-kids"]')
      await page.click('[data-testid="line-medium"]')
      
      // Start generation
      await page.click('[data-testid="generate-button"]')
      
      // Wait for loading spinner
      await page.waitForSelector('[data-testid="loading-spinner"]', { timeout: 2000 })
      
      // Wait for result with 10-second timeout
      await page.waitForSelector('[data-testid="generated-image"]', { timeout: 10000 })
      
      const generationTime = Date.now() - startTime
      performanceMetrics.generationTimes.push(generationTime)
      
      expect(generationTime).toBeLessThan(10000) // Must complete within 10 seconds
      
      console.log(`⏱️ Image generation completed in ${generationTime}ms`)
      
      // Verify image is actually loaded
      const imageLoaded = await page.evaluate(() => {
        const img = document.querySelector('[data-testid="generated-image"]')
        return img && img.complete && img.naturalHeight !== 0
      })
      
      expect(imageLoaded).toBe(true)
    }, 12000)

    it('maintains generation performance under load', async () => {
      const generations = []
      const maxConcurrent = 3
      
      // Create multiple concurrent generation requests
      for (let i = 0; i < maxConcurrent; i++) {
        const generationPromise = (async () => {
          const startTime = Date.now()
          
          await page.type('[data-testid="prompt-input"]', `load test ${i}`)
          await page.click('[data-testid="complexity-simple"]')
          await page.click('[data-testid="age-kids"]')
          await page.click('[data-testid="line-medium"]')
          await page.click('[data-testid="generate-button"]')
          
          await page.waitForSelector('[data-testid="loading-spinner"]', { timeout: 2000 })
          await page.waitForSelector('[data-testid="generated-image"]', { timeout: 12000 })
          
          return Date.now() - startTime
        })()
        
        generations.push(generationPromise)
      }
      
      const times = await Promise.all(generations)
      const maxTime = Math.max(...times)
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      
      performanceMetrics.generationTimes.push(...times)
      
      console.log(`📊 Load test - Max: ${maxTime}ms, Avg: ${avgTime}ms`)
      
      // Even under load, should complete within reasonable time
      expect(maxTime).toBeLessThan(15000)
      expect(avgTime).toBeLessThan(12000)
    }, 20000)
  })

  describe('3G Network Emulation Tests', () => {
    beforeEach(async () => {
      // Enable network throttling
      const client = await page.target().createCDPSession()
      await client.send('Network.enable')
    })

    it('performs well on 3G network', async () => {
      const client = await page.target().createCDPSession()
      
      // Apply 3G throttling
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: networkProfiles['3G'].downloadThroughput,
        uploadThroughput: networkProfiles['3G'].uploadThroughput,
        latency: networkProfiles['3G'].latency
      })
      
      const startTime = Date.now()
      
      // Test page load performance on 3G
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForSelector('h1', { timeout: 8000 })
      
      const loadTime = Date.now() - startTime
      performanceMetrics.throttledTimes.push(loadTime)
      
      console.log(`🌐 3G load time: ${loadTime}ms`)
      
      // Should load within reasonable time on 3G
      expect(loadTime).toBeLessThan(8000)
      
      // Test form interaction on 3G
      const formStartTime = Date.now()
      
      await page.type('[data-testid="prompt-input"]', '3G test')
      await page.click('[data-testid="complexity-simple"]')
      await page.click('[data-testid="age-kids"]')
      await page.click('[data-testid="line-medium"]')
      
      const formTime = Date.now() - formStartTime
      console.log(`📝 3G form interaction: ${formTime}ms`)
      
      // Form should remain responsive on 3G
      expect(formTime).toBeLessThan(3000)
    }, 15000)

    it('handles image generation on slow 3G', async () => {
      const client = await page.target().createCDPSession()
      
      // Apply Slow 3G throttling
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: networkProfiles['Slow3G'].downloadThroughput,
        uploadThroughput: networkProfiles['Slow3G'].uploadThroughput,
        latency: networkProfiles['Slow3G'].latency
      })
      
      const startTime = Date.now()
      
      await page.type('[data-testid="prompt-input"]', 'slow 3G test')
      await page.click('[data-testid="complexity-simple"]')
      await page.click('[data-testid="age-kids"]')
      await page.click('[data-testid="line-medium"]')
      await page.click('[data-testid="generate-button"]')
      
      // Wait for loading state (should appear quickly even on slow network)
      await page.waitForSelector('[data-testid="loading-spinner"]', { timeout: 3000 })
      
      // Wait for result (allow more time for slow network)
      await page.waitForSelector('[data-testid="generated-image"]', { timeout: 20000 })
      
      const generationTime = Date.now() - startTime
      performanceMetrics.throttledTimes.push(generationTime)
      
      console.log(`🐌 Slow 3G generation: ${generationTime}ms`)
      
      // Should complete even on slow network (with longer timeout)
      expect(generationTime).toBeLessThan(20000)
      
      // Verify UI remains responsive during slow network
      const retryButton = await page.$('[data-testid="retry-button"]')
      if (retryButton) {
        const isClickable = await page.evaluate(el => !el.disabled, retryButton)
        expect(isClickable).toBe(true)
      }
    }, 25000)

    it('compares performance across network conditions', async () => {
      const networkResults = {}
      
      for (const [networkName, profile] of Object.entries(networkProfiles)) {
        const client = await page.target().createCDPSession()
        
        // Apply network throttling
        await client.send('Network.emulateNetworkConditions', {
          offline: false,
          downloadThroughput: profile.downloadThroughput,
          uploadThroughput: profile.uploadThroughput,
          latency: profile.latency
        })
        
        const startTime = Date.now()
        
        // Reload page and measure load time
        await page.reload({ waitUntil: 'domcontentloaded' })
        await page.waitForSelector('h1', { timeout: 10000 })
        
        const loadTime = Date.now() - startTime
        networkResults[networkName] = loadTime
        
        console.log(`📊 ${networkName} load time: ${loadTime}ms`)
        
        // Reset for next test
        await client.send('Network.emulateNetworkConditions', {
          offline: false,
          downloadThroughput: -1,
          uploadThroughput: -1,
          latency: 0
        })
      }
      
      // Verify network conditions affect performance as expected
      expect(networkResults['Slow3G']).toBeGreaterThan(networkResults['Fast3G'])
      expect(networkResults['Fast3G']).toBeLessThan(15000)
      expect(networkResults['Slow3G']).toBeLessThan(20000)
      
      console.log('🌐 Network performance comparison:', networkResults)
    }, 45000)
  })

  describe('Progressive Web App Performance', () => {
    it('loads core functionality quickly on first visit', async () => {
      // Simulate first-time user with cleared cache
      await page.setCacheEnabled(false)
      
      const startTime = Date.now()
      await page.reload({ waitUntil: 'domcontentloaded' })
      
      // Core functionality should be available quickly
      await page.waitForSelector('[data-testid="prompt-input"]', { timeout: 5000 })
      await page.waitForSelector('[data-testid="generate-button"]', { timeout: 5000 })
      
      const loadTime = Date.now() - startTime
      console.log(`🆕 First visit load time: ${loadTime}ms`)
      
      expect(loadTime).toBeLessThan(5000)
    }, 8000)

    it('has fast subsequent page loads', async () => {
      // Enable cache for subsequent loads
      await page.setCacheEnabled(true)
      
      // Initial load
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForSelector('h1')
      
      // Measure subsequent load
      const startTime = Date.now()
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForSelector('h1', { timeout: 3000 })
      
      const cachedLoadTime = Date.now() - startTime
      console.log(`🚀 Cached load time: ${cachedLoadTime}ms`)
      
      // Cached loads should be much faster
      expect(cachedLoadTime).toBeLessThan(3000)
    }, 8000)
  })

  describe('Mobile Network Performance', () => {
    beforeEach(async () => {
      // Set mobile viewport
      await page.setViewport({ width: 375, height: 667 })
    })

    it('optimizes for mobile data usage', async () => {
      const client = await page.target().createCDPSession()
      
      // Enable network domain to track data usage
      await client.send('Network.enable')
      
      // Apply mobile 3G conditions
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: networkProfiles['3G'].downloadThroughput,
        uploadThroughput: networkProfiles['3G'].uploadThroughput,
        latency: networkProfiles['3G'].latency
      })
      
      const startTime = Date.now()
      
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForSelector('h1', { timeout: 8000 })
      
      // Test mobile form interaction
      await page.tap('[data-testid="prompt-input"]')
      await page.type('[data-testid="prompt-input"]', 'mobile test')
      await page.tap('[data-testid="complexity-simple"]')
      await page.tap('[data-testid="age-kids"]')
      await page.tap('[data-testid="line-medium"]')
      
      const mobileTime = Date.now() - startTime
      console.log(`📱 Mobile 3G interaction time: ${mobileTime}ms`)
      
      // Mobile should remain responsive on 3G
      expect(mobileTime).toBeLessThan(6000)
    }, 12000)

    it('handles offline scenarios gracefully', async () => {
      const client = await page.target().createCDPSession()
      
      // Go offline
      await client.send('Network.emulateNetworkConditions', {
        offline: true,
        downloadThroughput: 0,
        uploadThroughput: 0,
        latency: 0
      })
      
      // Try to interact with the app
      await page.type('[data-testid="prompt-input"]', 'offline test')
      await page.click('[data-testid="generate-button"]')
      
      // Should show appropriate offline message
      await page.waitForSelector('[data-testid="offline-message"]', { timeout: 5000 })
      
      const offlineMessage = await page.$('[data-testid="offline-message"]')
      expect(offlineMessage).toBeTruthy()
      
      console.log('📵 Offline scenario handled gracefully')
    }, 8000)
  })
})