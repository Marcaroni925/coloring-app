import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import puppeteer from 'puppeteer'
import { injectAxe, checkA11y, getViolations } from 'axe-puppeteer'

describe('Screen Reader and Accessibility E2E Tests (Performance Optimized)', () => {
  let browser
  let page
  const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173'
  
  // Performance-optimized browser config for accessibility testing
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
  }, 3000)

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
  })

  beforeEach(async () => {
    page = await browser.newPage()
    
    // Optimized performance settings for accessibility testing
    await page.setDefaultTimeout(2500)
    await page.setDefaultNavigationTimeout(2500)
    
    // Disable non-essential resources for faster loading
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

    // Fast navigation for accessibility testing
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
    
    // Inject axe-core efficiently
    await injectAxe(page)
  }, 3000)

  afterEach(async () => {
    if (page) {
      await page.close()
    }
  })

  describe('Automated Accessibility Compliance', () => {
    it('meets WCAG 2.1 AA standards on main page', async () => {
      // Run optimized axe accessibility tests
      const results = await checkA11y(page, null, {
        axeOptions: {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21aa']
          },
          timeout: 2000 // Aggressive timeout for performance
        }
      })
      
      expect(results.violations).toHaveLength(0)
    }, 3000)

    it('maintains accessibility when customization panel is opened', async () => {
      // Open customization panel with fast timing
      await page.click('[data-testid="customization-toggle"]')
      await page.waitForSelector('[data-testid="customization-panel"]', { timeout: 1500 })
      
      // Quick accessibility check
      const results = await checkA11y(page)
      expect(results.violations).toHaveLength(0)
    })

    it('meets accessibility standards during image generation', async () => {
      // Fill form and start generation
      await page.type('[data-testid="prompt-input"]', 'a friendly cat')
      await page.click('[data-testid="customization-toggle"]')
      await page.click('[data-testid="complexity-simple"]')
      await page.click('[data-testid="age-kids"]')
      await page.selectOptions('[data-testid="line-thickness-select"]', 'medium')
      await page.click('[data-testid="generate-button"]')
      
      // Wait for loading state
      await page.waitForSelector('[data-testid="loading-spinner"]')
      
      // Check accessibility during loading
      const loadingResults = await checkA11y(page)
      expect(loadingResults.violations).toHaveLength(0)
      
      // Wait for completion
      await page.waitForSelector('[data-testid="generated-image"]', { timeout: 10000 })
      
      // Check accessibility with results
      const resultsPageResults = await checkA11y(page)
      expect(resultsPageResults.violations).toHaveLength(0)
    })

    it('maintains accessibility in gallery view', async () => {
      await page.click('[data-testid="nav-gallery"]')
      await page.waitForSelector('[data-testid="gallery-container"]')
      
      const results = await checkA11y(page)
      expect(results.violations).toHaveLength(0)
    })
  })

  describe('Semantic HTML Structure', () => {
    it('has proper heading hierarchy', async () => {
      // Check for h1
      const h1Elements = await page.$$('h1')
      expect(h1Elements.length).toBe(1)
      
      const h1Text = await page.$eval('h1', el => el.textContent)
      expect(h1Text).toContain('Coloring Book Creator')
      
      // Check heading order
      const headings = await page.evaluate(() => {
        const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
        return Array.from(headingElements).map(el => ({
          level: parseInt(el.tagName.charAt(1)),
          text: el.textContent.trim()
        }))
      })
      
      // Verify logical heading hierarchy
      for (let i = 1; i < headings.length; i++) {
        const currentLevel = headings[i].level
        const previousLevel = headings[i - 1].level
        
        // Each heading should not skip more than one level
        expect(currentLevel - previousLevel).toBeLessThanOrEqual(1)
      }
    })

    it('uses proper landmark roles', async () => {
      // Check for main landmark
      const main = await page.$('main')
      expect(main).toBeTruthy()
      
      // Check for navigation landmark
      const nav = await page.$('nav')
      expect(nav).toBeTruthy()
      
      // Verify ARIA landmarks
      const landmarks = await page.evaluate(() => {
        const elements = document.querySelectorAll('[role="main"], [role="navigation"], [role="region"], main, nav')
        return Array.from(elements).map(el => ({
          tagName: el.tagName.toLowerCase(),
          role: el.getAttribute('role') || el.tagName.toLowerCase(),
          ariaLabel: el.getAttribute('aria-label')
        }))
      })
      
      expect(landmarks.length).toBeGreaterThan(0)
      
      // Main content should have appropriate label
      const mainLandmark = landmarks.find(l => l.role === 'main' || l.tagName === 'main')
      expect(mainLandmark).toBeTruthy()
      expect(mainLandmark.ariaLabel).toBeTruthy()
    })

    it('provides proper form labeling', async () => {
      // Check prompt textarea
      const promptInput = await page.$('[data-testid="prompt-input"]')
      const promptLabel = await page.evaluate(el => {
        const id = el.getAttribute('id')
        const ariaLabel = el.getAttribute('aria-label')
        const ariaLabelledBy = el.getAttribute('aria-labelledby')
        
        if (ariaLabel) return ariaLabel
        if (ariaLabelledBy) {
          const labelElement = document.getElementById(ariaLabelledBy)
          return labelElement ? labelElement.textContent : null
        }
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`)
          return label ? label.textContent : null
        }
        
        return null
      }, promptInput)
      
      expect(promptLabel).toBeTruthy()
      expect(promptLabel.toLowerCase()).toContain('prompt')
      
      // Check customization form fields
      await page.click('[data-testid="customization-toggle"]')
      await page.waitForSelector('[data-testid="customization-panel"]', { timeout: 1500 })
      
      const formFields = await page.$$('input, select, textarea')
      
      for (const field of formFields) {
        const hasLabel = await page.evaluate(el => {
          const id = el.getAttribute('id')
          const ariaLabel = el.getAttribute('aria-label')
          const ariaLabelledBy = el.getAttribute('aria-labelledby')
          
          if (ariaLabel) return true
          if (ariaLabelledBy && document.getElementById(ariaLabelledBy)) return true
          if (id && document.querySelector(`label[for="${id}"]`)) return true
          
          // Check if wrapped in label
          return el.closest('label') !== null
        }, field)
        
        expect(hasLabel).toBe(true)
      }
    })
  })

  describe('Screen Reader Navigation', () => {
    it('provides logical tab order', async () => {
      const interactiveElements = await page.evaluate(() => {
        const selector = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        return Array.from(document.querySelectorAll(selector))
          .filter(el => {
            const style = window.getComputedStyle(el)
            return style.display !== 'none' && style.visibility !== 'hidden'
          })
          .map(el => ({
            tagName: el.tagName.toLowerCase(),
            type: el.type || null,
            ariaLabel: el.getAttribute('aria-label'),
            textContent: el.textContent?.trim().substring(0, 50),
            tabIndex: el.tabIndex
          }))
      })
      
      expect(interactiveElements.length).toBeGreaterThan(0)
      
      // Test actual tab navigation
      let tabCount = 0
      const maxTabs = Math.min(interactiveElements.length, 10) // Limit for performance
      
      for (let i = 0; i < maxTabs; i++) {
        await page.keyboard.press('Tab')
        tabCount++
        
        const activeElement = await page.evaluate(() => {
          const el = document.activeElement
          return {
            tagName: el.tagName.toLowerCase(),
            className: el.className,
            id: el.id,
            testId: el.getAttribute('data-testid')
          }
        })
        
        // Active element should be focusable
        expect(['button', 'input', 'select', 'textarea', 'a'].includes(activeElement.tagName)).toBe(true)
      }
      
      expect(tabCount).toBe(maxTabs)
    })

    it('supports keyboard navigation in customization panel', async () => {
      await page.click('[data-testid="customization-toggle"]')
      await page.waitForSelector('[data-testid="customization-panel"]', { timeout: 1500 })
      
      // Tab through radio button groups
      await page.focus('[data-testid="complexity-simple"]')
      
      // Use arrow keys to navigate radio buttons
      await page.keyboard.press('ArrowDown')
      
      const activeElement = await page.evaluate(() => {
        const el = document.activeElement
        return {
          name: el.getAttribute('name'),
          value: el.value,
          checked: el.checked
        }
      })
      
      expect(activeElement.name).toBe('complexity')
      expect(['simple', 'medium', 'detailed'].includes(activeElement.value)).toBe(true)
    })

    it('manages focus correctly in modal interactions', async () => {
      // Generate an image to trigger modal
      await page.type('[data-testid="prompt-input"]', 'test image')
      await page.click('[data-testid="customization-toggle"]')
      await page.click('[data-testid="complexity-simple"]')
      await page.click('[data-testid="age-kids"]')
      await page.selectOptions('[data-testid="line-thickness-select"]', 'medium')
      await page.click('[data-testid="generate-button"]')
      
      // Wait for result
      await page.waitForSelector('[data-testid="generated-image"]', { timeout: 10000 })
      
      // Check if download modal or other interactive elements have proper focus
      const downloadButton = await page.$('[data-testid="download-button"]')
      if (downloadButton) {
        await page.click('[data-testid="download-button"]')
        
        // Focus should be managed appropriately
        const activeElement = await page.evaluate(() => document.activeElement.getAttribute('data-testid'))
        expect(activeElement).toBeTruthy()
      }
    })
  })

  describe('ARIA Implementation', () => {
    it('uses appropriate ARIA labels for interactive elements', async () => {
      // Check main navigation
      const navButton = await page.$('[data-testid="nav-create"]')
      const navAriaLabel = await page.evaluate(el => el.getAttribute('aria-label'), navButton)
      expect(navAriaLabel).toBeTruthy()
      
      // Check generate button
      const generateButton = await page.$('[data-testid="generate-button"]')
      const generateAriaLabel = await page.evaluate(el => el.getAttribute('aria-label'), generateButton)
      expect(generateAriaLabel).toBeTruthy()
      expect(generateAriaLabel.toLowerCase()).toContain('generate')
      
      // Check prompt input
      const promptInput = await page.$('[data-testid="prompt-input"]')
      const promptAriaLabel = await page.evaluate(el => el.getAttribute('aria-label'), promptInput)
      expect(promptAriaLabel).toBeTruthy()
    })

    it('implements ARIA states correctly', async () => {
      // Test button states
      const generateButton = await page.$('[data-testid="generate-button"]')
      const initialAriaDisabled = await page.evaluate(el => el.getAttribute('aria-disabled'), generateButton)
      expect(initialAriaDisabled).toBe('true') // Should be disabled initially
      
      // Fill form to enable button
      await page.type('[data-testid="prompt-input"]', 'test prompt')
      await page.click('[data-testid="customization-toggle"]')
      await page.click('[data-testid="complexity-simple"]')
      await page.click('[data-testid="age-kids"]')
      await page.selectOptions('[data-testid="line-thickness-select"]', 'medium')
      
      // Button should now be enabled
      const enabledAriaDisabled = await page.evaluate(el => el.getAttribute('aria-disabled'), generateButton)
      expect(enabledAriaDisabled).toBe('false')
      
      // Test expandable sections
      const customizationToggle = await page.$('[data-testid="customization-toggle"]')
      const ariaExpanded = await page.evaluate(el => el.getAttribute('aria-expanded'), customizationToggle)
      expect(ariaExpanded).toBe('true') // Should be expanded after clicking
    })

    it('provides ARIA descriptions for complex interactions', async () => {
      // Check form validation messages
      await page.click('[data-testid="generate-button"]') // Try to submit empty form
      
      const promptInput = await page.$('[data-testid="prompt-input"]')
      const ariaDescribedBy = await page.evaluate(el => el.getAttribute('aria-describedby'), promptInput)
      
      if (ariaDescribedBy) {
        const errorElement = await page.$(`#${ariaDescribedBy}`)
        expect(errorElement).toBeTruthy()
        
        const errorText = await page.evaluate(el => el.textContent, errorElement)
        expect(errorText.toLowerCase()).toMatch(/required|enter|description/)
      }
      
      // Check for invalid state
      const ariaInvalid = await page.evaluate(el => el.getAttribute('aria-invalid'), promptInput)
      expect(ariaInvalid).toBe('true')
    })

    it('implements live regions for dynamic content', async () => {
      // Check for aria-live regions
      const liveRegions = await page.$$('[aria-live]')
      expect(liveRegions.length).toBeGreaterThan(0)
      
      // Test live region updates during image generation
      await page.type('[data-testid="prompt-input"]', 'test')
      await page.click('[data-testid="customization-toggle"]')
      await page.click('[data-testid="complexity-simple"]')
      await page.click('[data-testid="age-kids"]')
      await page.selectOptions('[data-testid="line-thickness-select"]', 'medium')
      await page.click('[data-testid="generate-button"]')
      
      // Check if live region is updated with status
      await page.waitForSelector('[data-testid="loading-spinner"]')
      
      const liveRegionContent = await page.evaluate(() => {
        const liveRegion = document.querySelector('[aria-live="polite"]') || 
                          document.querySelector('[aria-live="assertive"]')
        return liveRegion ? liveRegion.textContent : null
      })
      
      expect(liveRegionContent).toBeTruthy()
      expect(liveRegionContent.toLowerCase()).toMatch(/generating|loading|processing/)
    })
  })

  describe('Screen Reader Simulation', () => {
    it('provides meaningful content reading order', async () => {
      // Simulate screen reader traversal
      const readingOrder = await page.evaluate(() => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
          {
            acceptNode: (node) => {
              if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
              }
              
              const style = window.getComputedStyle(node)
              if (style.display === 'none' || style.visibility === 'hidden') {
                return NodeFilter.FILTER_REJECT
              }
              
              if (node.tagName && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LABEL', 'BUTTON'].includes(node.tagName)) {
                return NodeFilter.FILTER_ACCEPT
              }
              
              return NodeFilter.FILTER_SKIP
            }
          }
        )
        
        const content = []
        let currentNode
        
        while (currentNode = walker.nextNode()) {
          if (currentNode.nodeType === Node.TEXT_NODE) {
            content.push({
              type: 'text',
              content: currentNode.textContent.trim()
            })
          } else {
            content.push({
              type: 'element',
              tagName: currentNode.tagName,
              content: currentNode.textContent.trim()
            })
          }
        }
        
        return content
      })
      
      // Verify logical content order
      expect(readingOrder.length).toBeGreaterThan(0)
      
      // Should start with heading
      const firstHeading = readingOrder.find(item => item.tagName && item.tagName.startsWith('H'))
      expect(firstHeading).toBeTruthy()
      expect(firstHeading.content).toContain('Coloring Book Creator')
      
      // Should contain form labels and controls in logical order
      const formElements = readingOrder.filter(item => 
        item.tagName && ['LABEL', 'BUTTON'].includes(item.tagName)
      )
      expect(formElements.length).toBeGreaterThan(0)
    })

    it('announces form validation errors appropriately', async () => {
      // Try to submit form without required fields
      await page.click('[data-testid="generate-button"]')
      
      // Check for error announcements
      const errorAnnouncement = await page.evaluate(() => {
        const liveRegions = document.querySelectorAll('[aria-live], [role="alert"]')
        let announcement = ''
        
        liveRegions.forEach(region => {
          if (region.textContent.trim()) {
            announcement += region.textContent.trim() + ' '
          }
        })
        
        return announcement.trim()
      })
      
      expect(errorAnnouncement.toLowerCase()).toMatch(/error|required|validation|enter/)
    })

    it('provides appropriate feedback for successful actions', async () => {
      // Complete form and generate image
      await page.type('[data-testid="prompt-input"]', 'a happy cat')
      await page.click('[data-testid="customization-toggle"]')
      await page.click('[data-testid="complexity-simple"]')
      await page.click('[data-testid="age-kids"]')
      await page.selectOptions('[data-testid="line-thickness-select"]', 'medium')
      await page.click('[data-testid="generate-button"]')
      
      // Wait for completion
      await page.waitForSelector('[data-testid="generated-image"]', { timeout: 10000 })
      
      // Check for success announcement
      const successAnnouncement = await page.evaluate(() => {
        const liveRegions = document.querySelectorAll('[aria-live="polite"]')
        let announcement = ''
        
        liveRegions.forEach(region => {
          if (region.textContent.trim()) {
            announcement += region.textContent.trim() + ' '
          }
        })
        
        return announcement.trim()
      })
      
      expect(successAnnouncement.toLowerCase()).toMatch(/generated|complete|ready|success/)
    })
  })

  describe('High Contrast and Visual Accessibility', () => {
    it('maintains accessibility in high contrast mode', async () => {
      // Simulate high contrast mode
      await page.emulateMediaFeatures([
        { name: 'prefers-contrast', value: 'high' }
      ])
      
      await page.reload({ waitUntil: 'networkidle0' })
      await injectAxe(page)
      
      // Check accessibility in high contrast mode
      const results = await checkA11y(page, null, {
        axeOptions: {
          runOnly: {
            type: 'tag',
            values: ['wcag2aa']
          }
        }
      })
      
      expect(results.violations).toHaveLength(0)
    })

    it('supports reduced motion preferences', async () => {
      // Test reduced motion
      await page.emulateMediaFeatures([
        { name: 'prefers-reduced-motion', value: 'reduce' }
      ])
      
      await page.reload({ waitUntil: 'networkidle0' })
      
      // Check that animations are reduced
      const animationStyles = await page.evaluate(() => {
        const elements = document.querySelectorAll('*')
        const animatedElements = []
        
        elements.forEach(el => {
          const style = window.getComputedStyle(el)
          if (style.animationDuration !== '0s' || style.transitionDuration !== '0s') {
            animatedElements.push({
              animation: style.animationDuration,
              transition: style.transitionDuration
            })
          }
        })
        
        return animatedElements
      })
      
      // In reduced motion mode, animations should be minimal or disabled
      animatedElements.forEach(element => {
        expect(parseFloat(element.animation) || 0).toBeLessThan(1) // Less than 1 second
        expect(parseFloat(element.transition) || 0).toBeLessThan(1) // Less than 1 second
      })
    })

    it('provides sufficient color contrast', async () => {
      // Run color contrast specific tests
      const contrastResults = await checkA11y(page, null, {
        axeOptions: {
          runOnly: {
            type: 'tag',
            values: ['wcag2aa']
          },
          rules: {
            'color-contrast': { enabled: true }
          }
        }
      })
      
      const contrastViolations = contrastResults.violations.filter(v => v.id === 'color-contrast')
      expect(contrastViolations).toHaveLength(0)
    })
  })
})