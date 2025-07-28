import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import puppeteer from 'puppeteer'

describe('Gallery Bulk Operations E2E Tests (Network Performance Enhanced)', () => {
  let browser
  let page
  const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173'
  const API_URL = process.env.E2E_API_URL || 'http://localhost:3001'
  
  // Network performance metrics tracking
  const networkMetrics = {
    bulkDeleteTimes: [],
    networkConditions: []
  }
  
  // Network profiles for testing including extreme conditions
  const networkProfiles = {
    'WiFi': {
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 20
    },
    '3G': {
      downloadThroughput: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps
      uploadThroughput: 750 * 1024 / 8, // 750 Kbps
      latency: 150
    },
    'Slow3G': {
      downloadThroughput: 500 * 1024 / 8, // 500 Kbps
      uploadThroughput: 500 * 1024 / 8, // 500 Kbps
      latency: 400
    },
    'Extreme3G': {
      downloadThroughput: 100 * 1024 / 8, // 100 Kbps - extreme condition
      uploadThroughput: 50 * 1024 / 8, // 50 Kbps
      latency: 800 // 800ms latency
    }
  }
  
  // Performance-optimized browser config
  const browserOptions = {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-background-timer-throttling',
      '--no-first-run',
      '--single-process',
      '--disable-gpu'
    ],
    defaultViewport: { width: 1200, height: 800 }
  }

  beforeAll(async () => {
    browser = await puppeteer.launch(browserOptions)
  }, 5000)

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
    
    // Log network performance summary
    if (networkMetrics.bulkDeleteTimes.length > 0) {
      console.log('\n🌐 Network Performance Summary (Bulk Operations):')
      networkMetrics.networkConditions.forEach((condition, index) => {
        console.log(`  ${condition}: ${networkMetrics.bulkDeleteTimes[index]}ms`)
      })
    }
  })

  beforeEach(async () => {
    page = await browser.newPage()
    
    // Optimized performance settings
    await page.setDefaultTimeout(8000) // Increased for network tests
    await page.setDefaultNavigationTimeout(8000)
    
    // Mock authentication for fast gallery access
    await page.evaluateOnNewDocument(() => {
      window.mockAuth = {
        currentUser: { uid: 'test-user', email: 'test@example.com' },
        signedIn: true
      }
    })
    
    // Mock API responses with multiple gallery items
    await page.setRequestInterception(true)
    page.on('request', (request) => {
      if (request.url().includes('/api/auth/get-gallery')) {
        request.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            images: [
              {
                id: 'img1',
                imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAG5/',
                prompt: 'Test image 1',
                metadata: { complexity: 'simple', ageGroup: 'kids' },
                createdAt: '2024-01-01T10:00:00Z'
              },
              {
                id: 'img2',
                imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAG5/',
                prompt: 'Test image 2',
                metadata: { complexity: 'medium', ageGroup: 'teens' },
                createdAt: '2024-01-02T10:00:00Z'
              },
              {
                id: 'img3',
                imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAG5/',
                prompt: 'Test image 3',
                metadata: { complexity: 'detailed', ageGroup: 'adults' },
                createdAt: '2024-01-03T10:00:00Z'
              },
              {
                id: 'img4',
                imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAG5/',
                prompt: 'Test image 4',
                metadata: { complexity: 'simple', ageGroup: 'kids' },
                createdAt: '2024-01-04T10:00:00Z'
              },
              {
                id: 'img5',
                imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAG5/',
                prompt: 'Test image 5',
                metadata: { complexity: 'medium', ageGroup: 'teens' },
                createdAt: '2024-01-05T10:00:00Z'
              }
            ],
            total: 5
          })
        })
      } else if (request.url().includes('/api/auth/delete-bulk')) {
        // Mock successful bulk delete with realistic delay for network testing
        const body = JSON.parse(request.postData())
        setTimeout(() => {
          request.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              deletedCount: body.imageIds.length,
              message: `Successfully deleted ${body.imageIds.length} images`
            })
          })
        }, 200) // Small delay to simulate server processing
      } else {
        request.continue()
      }
    })

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
  }, 8000)

  afterEach(async () => {
    if (page) {
      await page.close()
    }
  })

  describe('Basic Gallery Navigation and Setup', () => {
    it('navigates to gallery and displays images with checkboxes', async () => {
      await page.click('[data-testid="nav-gallery"]')
      await page.waitForSelector('[data-testid="gallery-container"]', { timeout: 5000 })
      
      const galleryItems = await page.$$('[data-testid="gallery-item"]')
      expect(galleryItems.length).toBe(5)
      
      for (let i = 0; i < galleryItems.length; i++) {
        const checkbox = await galleryItems[i].$('[data-testid="item-checkbox"]')
        expect(checkbox).toBeTruthy()
        
        const isChecked = await page.evaluate(el => el.checked, checkbox)
        expect(isChecked).toBe(false)
      }
    }, 8000)

    it('displays bulk action controls when items are available', async () => {
      await page.click('[data-testid="nav-gallery"]')
      await page.waitForSelector('[data-testid="gallery-container"]')
      
      const selectAllButton = await page.$('[data-testid="select-all-button"]')
      const selectNoneButton = await page.$('[data-testid="select-none-button"]')
      const bulkDeleteButton = await page.$('[data-testid="bulk-delete-button"]')
      
      expect(selectAllButton).toBeTruthy()
      expect(selectNoneButton).toBeTruthy()
      expect(bulkDeleteButton).toBeTruthy()
      
      const isDisabled = await page.evaluate(el => el.disabled, bulkDeleteButton)
      expect(isDisabled).toBe(true)
    }, 6000)
  })

  describe('Bulk Delete Operations Under 3G Network', () => {
    beforeEach(async () => {
      await page.click('[data-testid="nav-gallery"]')
      await page.waitForSelector('[data-testid="gallery-container"]')
    })

    it('performs bulk delete under 3G network conditions', async () => {
      const client = await page.target().createCDPSession()
      
      // Apply 3G throttling
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: networkProfiles['3G'].downloadThroughput,
        uploadThroughput: networkProfiles['3G'].uploadThroughput,
        latency: networkProfiles['3G'].latency
      })
      
      const startTime = Date.now()
      
      // Select multiple items
      await page.click('[data-testid="gallery-item"]:nth-child(1) [data-testid="item-checkbox"]')
      await page.click('[data-testid="gallery-item"]:nth-child(2) [data-testid="item-checkbox"]')
      await page.click('[data-testid="gallery-item"]:nth-child(3) [data-testid="item-checkbox"]')
      
      // Verify selection responsiveness under 3G
      const selectionTime = Date.now() - startTime
      console.log(`📱 3G selection time: ${selectionTime}ms`)
      expect(selectionTime).toBeLessThan(3000) // Should remain responsive
      
      // Perform bulk delete
      const deleteStartTime = Date.now()
      await page.click('[data-testid="bulk-delete-button"]')
      await page.waitForSelector('[data-testid="bulk-delete-confirmation"]', { timeout: 6000 })
      await page.click('[data-testid="confirm-bulk-delete"]')
      
      // Wait for deletion to complete
      await page.waitForSelector('[data-testid="bulk-delete-success"]', { timeout: 10000 })
      
      const deleteTime = Date.now() - deleteStartTime
      networkMetrics.bulkDeleteTimes.push(deleteTime)
      networkMetrics.networkConditions.push('3G')
      
      console.log(`🗑️ 3G bulk delete time: ${deleteTime}ms`)
      
      // Should complete within reasonable time on 3G
      expect(deleteTime).toBeLessThan(8000)
      
      // Reset network conditions
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: -1,
        uploadThroughput: -1,
        latency: 0
      })
    }, 15000)

    it('handles form interactions smoothly under Slow 3G', async () => {
      const client = await page.target().createCDPSession()
      
      // Apply Slow 3G throttling
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: networkProfiles['Slow3G'].downloadThroughput,
        uploadThroughput: networkProfiles['Slow3G'].uploadThroughput,
        latency: networkProfiles['Slow3G'].latency
      })
      
      const startTime = Date.now()
      
      // Test select all functionality
      await page.click('[data-testid="select-all-button"]')
      
      // Verify all items are selected
      const checkboxes = await page.$$('[data-testid="item-checkbox"]')
      for (const checkbox of checkboxes) {
        const isChecked = await page.evaluate(el => el.checked, checkbox)
        expect(isChecked).toBe(true)
      }
      
      const selectAllTime = Date.now() - startTime
      console.log(`📋 Slow 3G select all time: ${selectAllTime}ms`)
      
      // Should remain responsive even on slow network
      expect(selectAllTime).toBeLessThan(4000)
      
      // Reset network
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: -1,
        uploadThroughput: -1,
        latency: 0
      })
    }, 12000)

    it('provides appropriate feedback during slow network operations', async () => {
      const client = await page.target().createCDPSession()
      
      // Apply 3G throttling
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: networkProfiles['3G'].downloadThroughput,
        uploadThroughput: networkProfiles['3G'].uploadThroughput,
        latency: networkProfiles['3G'].latency
      })
      
      // Select items and start delete process
      await page.click('[data-testid="gallery-item"]:first-child [data-testid="item-checkbox"]')
      await page.click('[data-testid="bulk-delete-button"]')
      await page.waitForSelector('[data-testid="bulk-delete-confirmation"]')
      await page.click('[data-testid="confirm-bulk-delete"]')
      
      // Check for loading indicator during network operation
      const loadingIndicator = await page.waitForSelector('[data-testid="bulk-delete-loading"]', { timeout: 3000 })
      expect(loadingIndicator).toBeTruthy()
      
      // Verify button is disabled during operation
      const bulkDeleteButton = await page.$('[data-testid="bulk-delete-button"]')
      const isDisabled = await page.evaluate(el => el.disabled, bulkDeleteButton)
      expect(isDisabled).toBe(true)
      
      // Reset network
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: -1,
        uploadThroughput: -1,
        latency: 0
      })
    }, 12000)
  })

  describe('Extreme Network Conditions (100kbps)', () => {
    beforeEach(async () => {
      await page.click('[data-testid="nav-gallery"]')
      await page.waitForSelector('[data-testid="gallery-container"]')
    })

    it('handles bulk operations under extreme 100kbps conditions', async () => {
      const client = await page.target().createCDPSession()
      
      // Apply extreme network throttling (100kbps)
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: networkProfiles['Extreme3G'].downloadThroughput,
        uploadThroughput: networkProfiles['Extreme3G'].uploadThroughput,
        latency: networkProfiles['Extreme3G'].latency
      })
      
      console.log('🐌 Testing under extreme 100kbps network conditions')
      
      const startTime = Date.now()
      
      // Test basic interaction first
      await page.click('[data-testid="gallery-item"]:first-child [data-testid="item-checkbox"]')
      
      const selectionTime = Date.now() - startTime
      console.log(`⚡ Extreme network selection time: ${selectionTime}ms`)
      
      // UI should remain responsive even under extreme conditions
      expect(selectionTime).toBeLessThan(5000)
      
      // Test bulk delete under extreme conditions
      const deleteStartTime = Date.now()
      await page.click('[data-testid="bulk-delete-button"]')
      await page.waitForSelector('[data-testid="bulk-delete-confirmation"]', { timeout: 10000 })
      
      // Verify confirmation dialog appears
      const confirmationDialog = await page.$('[data-testid="bulk-delete-confirmation"]')
      expect(confirmationDialog).toBeTruthy()
      
      await page.click('[data-testid="confirm-bulk-delete"]')
      
      // Wait for completion with extended timeout for extreme conditions
      await page.waitForSelector('[data-testid="bulk-delete-success"]', { timeout: 20000 })
      
      const extremeDeleteTime = Date.now() - deleteStartTime
      networkMetrics.bulkDeleteTimes.push(extremeDeleteTime)
      networkMetrics.networkConditions.push('Extreme (100kbps)')
      
      console.log(`🐢 Extreme network bulk delete time: ${extremeDeleteTime}ms`)
      
      // Should complete within extended timeout for extreme conditions
      expect(extremeDeleteTime).toBeLessThan(20000)
      
      // Reset network conditions
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: -1,
        uploadThroughput: -1,
        latency: 0
      })
    }, 25000)

    it('gracefully degrades functionality under extreme network stress', async () => {
      const client = await page.target().createCDPSession()
      
      // Apply extreme conditions
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: networkProfiles['Extreme3G'].downloadThroughput,
        uploadThroughput: networkProfiles['Extreme3G'].uploadThroughput,
        latency: networkProfiles['Extreme3G'].latency
      })
      
      // Test that critical functionality still works
      await page.click('[data-testid="select-all-button"]')
      
      // Verify select all still works under extreme conditions
      await page.waitForFunction(
        () => {
          const checkboxes = document.querySelectorAll('[data-testid="item-checkbox"]')
          return Array.from(checkboxes).every(cb => cb.checked)
        },
        { timeout: 8000 }
      )
      
      console.log('✅ Select all functionality works under extreme network conditions')
      
      // Test select none
      await page.click('[data-testid="select-none-button"]')
      
      await page.waitForFunction(
        () => {
          const checkboxes = document.querySelectorAll('[data-testid="item-checkbox"]')
          return Array.from(checkboxes).every(cb => !cb.checked)
        },
        { timeout: 8000 }
      )
      
      console.log('✅ Select none functionality works under extreme network conditions')
      
      // Reset network
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: -1,
        uploadThroughput: -1,
        latency: 0
      })
    }, 20000)

    it('provides appropriate timeout handling for extreme conditions', async () => {
      const client = await page.target().createCDPSession()
      
      // Mock a very slow server response
      await page.setRequestInterception(true)
      page.removeAllListeners('request')
      page.on('request', (request) => {
        if (request.url().includes('/api/auth/delete-bulk')) {
          // Simulate extremely slow response
          setTimeout(() => {
            request.respond({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                deletedCount: 1,
                message: 'Successfully deleted 1 image after extreme delay'
              })
            })
          }, 15000) // 15 second delay
        } else {
          request.continue()
        }
      })
      
      // Apply extreme network conditions
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: networkProfiles['Extreme3G'].downloadThroughput,
        uploadThroughput: networkProfiles['Extreme3G'].uploadThroughput,
        latency: networkProfiles['Extreme3G'].latency
      })
      
      await page.click('[data-testid="gallery-item"]:first-child [data-testid="item-checkbox"]')
      await page.click('[data-testid="bulk-delete-button"]')
      await page.waitForSelector('[data-testid="bulk-delete-confirmation"]')
      await page.click('[data-testid="confirm-bulk-delete"]')
      
      // Should show appropriate loading state for extended operation
      const loadingState = await page.waitForSelector('[data-testid="bulk-delete-loading"]', { timeout: 5000 })
      expect(loadingState).toBeTruthy()
      
      // Should eventually complete or show timeout handling
      const completionOrTimeout = await Promise.race([
        page.waitForSelector('[data-testid="bulk-delete-success"]', { timeout: 20000 }),
        page.waitForSelector('[data-testid="bulk-delete-timeout"]', { timeout: 20000 })
      ])
      
      expect(completionOrTimeout).toBeTruthy()
      
      console.log('⏰ Timeout handling works correctly under extreme conditions')
    }, 30000)
  })

  describe('Network Performance Comparison', () => {
    it('compares bulk delete performance across network conditions', async () => {
      const performanceResults = {}
      
      // Navigate to gallery once
      await page.click('[data-testid="nav-gallery"]')
      await page.waitForSelector('[data-testid="gallery-container"]')
      
      for (const [networkName, profile] of Object.entries(networkProfiles)) {
        const client = await page.target().createCDPSession()
        
        // Apply network throttling
        await client.send('Network.emulateNetworkConditions', {
          offline: false,
          downloadThroughput: profile.downloadThroughput,
          uploadThroughput: profile.uploadThroughput,
          latency: profile.latency
        })
        
        // Reset page state
        await page.reload({ waitUntil: 'domcontentloaded' })
        await page.click('[data-testid="nav-gallery"]')
        await page.waitForSelector('[data-testid="gallery-container"]', { timeout: 10000 })
        
        const startTime = Date.now()
        
        // Perform standardized operation
        await page.click('[data-testid="gallery-item"]:first-child [data-testid="item-checkbox"]')
        await page.click('[data-testid="bulk-delete-button"]')
        await page.waitForSelector('[data-testid="bulk-delete-confirmation"]', { timeout: 8000 })
        
        const operationTime = Date.now() - startTime
        performanceResults[networkName] = operationTime
        
        console.log(`🌐 ${networkName} bulk operation time: ${operationTime}ms`)
        
        // Cancel the operation to reset state
        await page.click('[data-testid="cancel-bulk-delete"]')
        
        // Reset network conditions
        await client.send('Network.emulateNetworkConditions', {
          offline: false,
          downloadThroughput: -1,
          uploadThroughput: -1,
          latency: 0
        })
      }
      
      // Verify performance expectations
      expect(performanceResults['WiFi']).toBeLessThan(performanceResults['3G'])
      expect(performanceResults['3G']).toBeLessThan(performanceResults['Slow3G'])
      expect(performanceResults['Slow3G']).toBeLessThan(performanceResults['Extreme3G'])
      
      console.log('📊 Network performance comparison:', performanceResults)
    }, 60000)
  })

  describe('Mobile Network Bulk Operations', () => {
    beforeEach(async () => {
      // Set mobile viewport
      await page.setViewport({ width: 375, height: 667 })
      await page.click('[data-testid="nav-gallery"]')
      await page.waitForSelector('[data-testid="gallery-container"]')
    })

    it('optimizes bulk operations for mobile 3G data usage', async () => {
      const client = await page.target().createCDPSession()
      
      // Apply mobile 3G conditions
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: networkProfiles['3G'].downloadThroughput,
        uploadThroughput: networkProfiles['3G'].uploadThroughput,
        latency: networkProfiles['3G'].latency
      })
      
      const startTime = Date.now()
      
      // Test touch interactions for bulk selection
      await page.tap('[data-testid="gallery-item"]:nth-child(1) [data-testid="item-checkbox"]')
      await page.tap('[data-testid="gallery-item"]:nth-child(2) [data-testid="item-checkbox"]')
      
      // Test mobile-optimized bulk actions
      await page.tap('[data-testid="bulk-delete-button"]')
      await page.waitForSelector('[data-testid="bulk-delete-confirmation"]', { timeout: 8000 })
      
      const mobileOperationTime = Date.now() - startTime
      console.log(`📱 Mobile 3G bulk operation time: ${mobileOperationTime}ms`)
      
      // Should remain responsive on mobile 3G
      expect(mobileOperationTime).toBeLessThan(6000)
      
      // Verify mobile-friendly confirmation dialog
      const confirmationDialog = await page.$('[data-testid="bulk-delete-confirmation"]')
      const dialogBounds = await confirmationDialog.boundingBox()
      
      // Dialog should fit mobile viewport
      expect(dialogBounds.width).toBeLessThanOrEqual(375)
      
      // Reset network
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: -1,
        uploadThroughput: -1,
        latency: 0
      })
    }, 15000)
  })
})