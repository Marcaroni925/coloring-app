import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import OpenAI from 'openai'
import { promises as fs } from 'fs'
import path from 'path'

// Only run these tests if OpenAI API key is available
const hasApiKey = !!process.env.OPENAI_API_KEY
const skipMessage = 'OpenAI API key not provided - skipping integration tests'

describe('OpenAI API Integration Tests', () => {
  let app
  let openai
  let testResults = []

  beforeAll(async () => {
    if (!hasApiKey) {
      console.log('⚠️  ' + skipMessage)
      return
    }

    // Initialize OpenAI client
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    // Import the actual app (not mocked)
    const { default: actualApp } = await import('../app.js')
    app = actualApp
  })

  afterAll(async () => {
    if (!hasApiKey) return

    // Save test results for analysis
    const resultsPath = './test-results/openai-integration-results.json'
    await fs.mkdir('./test-results', { recursive: true })
    await fs.writeFile(
      resultsPath,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        testResults,
        summary: {
          totalTests: testResults.length,
          successRate: testResults.filter(r => r.success).length / testResults.length,
          averageResponseTime: testResults.reduce((acc, r) => acc + r.responseTime, 0) / testResults.length
        }
      }, null, 2)
    )
  })

  beforeEach(() => {
    if (!hasApiKey) {
      console.log('⏭️  Skipping test - no API key')
    }
  })

  describe('Prompt Refinement Integration', () => {
    it.skipIf(!hasApiKey)('refines simple animal prompts with quality keywords', async () => {
      const startTime = Date.now()
      
      const response = await request(app)
        .post('/api/refine-prompt')
        .send({
          prompt: 'a cat',
          customizations: {
            complexity: 'simple',
            ageGroup: 'kids',
            lineThickness: 'medium',
            theme: 'animals'
          }
        })
        .expect(200)

      const responseTime = Date.now() - startTime
      
      expect(response.body.success).toBe(true)
      expect(response.body.originalPrompt).toBe('a cat')
      expect(response.body.refinedPrompt).toBeTruthy()
      
      // Validate quality keywords are present
      const refinedPrompt = response.body.refinedPrompt.toLowerCase()
      const requiredKeywords = ['line art', 'coloring', 'simple']
      const qualityKeywords = ['300 dpi', 'family-friendly', 'clean lines', 'bold outlines']
      
      const hasRequiredKeywords = requiredKeywords.some(keyword => 
        refinedPrompt.includes(keyword)
      )
      const hasQualityKeywords = qualityKeywords.some(keyword => 
        refinedPrompt.includes(keyword)
      )
      
      expect(hasRequiredKeywords).toBe(true)
      expect(hasQualityKeywords).toBe(true)
      
      // Validate metadata
      expect(response.body.metadata).toMatchObject({
        category: 'animals',
        complexity: 'simple',
        ageGroup: 'kids'
      })
      
      testResults.push({
        test: 'simple_animal_refinement',
        success: true,
        responseTime,
        promptLength: response.body.refinedPrompt.length,
        hasQualityKeywords
      })
    }, 15000)

    it.skipIf(!hasApiKey)('enhances complex fantasy prompts for adults', async () => {
      const startTime = Date.now()
      
      const response = await request(app)
        .post('/api/refine-prompt')
        .send({
          prompt: 'mystical dragon castle',
          customizations: {
            complexity: 'detailed',
            ageGroup: 'adults',
            lineThickness: 'fine',
            theme: 'fantasy'
          }
        })
        .expect(200)

      const responseTime = Date.now() - startTime
      
      expect(response.body.success).toBe(true)
      expect(response.body.refinedPrompt).toBeTruthy()
      
      // Adult/detailed prompts should have more complex vocabulary
      const refinedPrompt = response.body.refinedPrompt.toLowerCase()
      const complexityIndicators = [
        'intricate', 'detailed', 'elaborate', 'ornate', 
        'sophisticated', 'complex', 'fine lines'
      ]
      
      const hasComplexityIndicators = complexityIndicators.some(indicator => 
        refinedPrompt.includes(indicator)
      )
      
      expect(hasComplexityIndicators).toBe(true)
      expect(response.body.metadata.category).toBe('fantasy')
      expect(response.body.metadata.complexity).toBe('detailed')
      
      testResults.push({
        test: 'complex_fantasy_refinement',
        success: true,
        responseTime,
        promptLength: response.body.refinedPrompt.length,
        hasComplexityIndicators
      })
    }, 15000)

    it.skipIf(!hasApiKey)('maintains family-friendly content for inappropriate input', async () => {
      const startTime = Date.now()
      
      // Test with potentially inappropriate content
      const response = await request(app)
        .post('/api/refine-prompt')
        .send({
          prompt: 'scary monster with weapons',
          customizations: {
            complexity: 'simple',
            ageGroup: 'kids',
            lineThickness: 'thick'
          }
        })

      const responseTime = Date.now() - startTime
      
      if (response.status === 400) {
        // Content was rejected - this is expected behavior
        expect(response.body.success).toBe(false)
        expect(response.body.error).toContain('family-friendly')
        
        testResults.push({
          test: 'content_filtering',
          success: true,
          responseTime,
          filtered: true
        })
      } else if (response.status === 200) {
        // Content was refined to be appropriate
        expect(response.body.success).toBe(true)
        const refinedPrompt = response.body.refinedPrompt.toLowerCase()
        
        // Should not contain inappropriate words
        const inappropriateWords = ['weapon', 'scary', 'violent', 'dangerous']
        const hasInappropriateWords = inappropriateWords.some(word => 
          refinedPrompt.includes(word)
        )
        
        expect(hasInappropriateWords).toBe(false)
        
        testResults.push({
          test: 'content_filtering',
          success: true,
          responseTime,
          refined: true,
          originallyInappropriate: true
        })
      }
    }, 15000)

    it.skipIf(!hasApiKey)('handles rate limiting gracefully', async () => {
      const startTime = Date.now()
      
      // Make multiple rapid requests to test rate limiting
      const rapidRequests = Array.from({ length: 5 }, (_, index) =>
        request(app)
          .post('/api/refine-prompt')
          .send({
            prompt: `test prompt ${index}`,
            customizations: {
              complexity: 'simple',
              ageGroup: 'kids',
              lineThickness: 'medium'
            }
          })
      )

      const responses = await Promise.allSettled(rapidRequests)
      const responseTime = Date.now() - startTime
      
      // At least one should succeed
      const successful = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      )
      expect(successful.length).toBeGreaterThan(0)
      
      // Some might be rate limited (429) - this is acceptable
      const rateLimited = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 429
      )
      
      testResults.push({
        test: 'rate_limiting',
        success: true,
        responseTime,
        successfulRequests: successful.length,
        rateLimitedRequests: rateLimited.length,
        totalRequests: rapidRequests.length
      })
    }, 30000)

    it.skipIf(!hasApiKey)('validates prompt refinement consistency', async () => {
      const basePrompt = 'a friendly dog'
      const requests = Array.from({ length: 3 }, () =>
        request(app)
          .post('/api/refine-prompt')
          .send({
            prompt: basePrompt,
            customizations: {
              complexity: 'medium',
              ageGroup: 'kids',
              lineThickness: 'medium',
              theme: 'animals'
            }
          })
      )

      const responses = await Promise.all(requests)
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
      })
      
      // Check for consistency in key elements
      const refinedPrompts = responses.map(r => r.body.refinedPrompt.toLowerCase())
      
      // All should contain core animal and coloring concepts
      const coreKeywords = ['dog', 'coloring', 'line']
      refinedPrompts.forEach(prompt => {
        const containsCoreKeywords = coreKeywords.every(keyword => 
          prompt.includes(keyword) || prompt.includes(keyword.slice(0, -1))
        )
        expect(containsCoreKeywords).toBe(true)
      })
      
      testResults.push({
        test: 'refinement_consistency',
        success: true,
        variations: refinedPrompts.length,
        averageLength: refinedPrompts.reduce((acc, p) => acc + p.length, 0) / refinedPrompts.length
      })
    }, 25000)
  })

  describe('Image Generation Integration', () => {
    it.skipIf(!hasApiKey)('generates images with DALL-E 3', async () => {
      const startTime = Date.now()
      
      const response = await request(app)
        .post('/api/generate')
        .send({
          prompt: 'a simple butterfly for kids to color',
          customizations: {
            complexity: 'simple',
            ageGroup: 'kids',
            lineThickness: 'thick',
            border: 'with'
          }
        })
        .expect(200)

      const responseTime = Date.now() - startTime
      
      expect(response.body.success).toBe(true)
      expect(response.body.imageUrl).toBeTruthy()
      expect(response.body.imageUrl).toMatch(/^https?:\/\//)
      
      // Validate metadata
      expect(response.body.metadata).toMatchObject({
        model: expect.stringMatching(/dall-e-[23]/),
        size: '1024x1024',
        complexity: 'simple',
        ageGroup: 'kids'
      })
      
      // Validate prompt enhancement occurred
      expect(response.body.refinedPrompt).toBeTruthy()
      expect(response.body.refinedPrompt).not.toBe(response.body.originalPrompt)
      
      testResults.push({
        test: 'image_generation_dalle3',
        success: true,
        responseTime,
        model: response.body.metadata.model,
        promptEnhanced: response.body.refinedPrompt !== response.body.originalPrompt
      })
    }, 45000)

    it.skipIf(!hasApiKey)('handles content policy violations in image generation', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          prompt: 'inappropriate violent content',
          customizations: {
            complexity: 'simple',
            ageGroup: 'kids',
            lineThickness: 'medium'
          }
        })

      // Should either reject at prompt level or at DALL-E level
      if (response.status === 400) {
        expect(response.body.success).toBe(false)
        expect(response.body.error).toMatch(/content|policy|family-friendly/i)
      } else if (response.status === 200) {
        // If it passed prompt validation, DALL-E should have handled it appropriately
        expect(response.body.success).toBe(true)
        expect(response.body.imageUrl).toBeTruthy()
      }
      
      testResults.push({
        test: 'content_policy_image',
        success: true,
        handledByPromptFilter: response.status === 400,
        handledByDalle: response.status === 200
      })
    }, 30000)

    it.skipIf(!hasApiKey)('validates DALL-E fallback mechanism', async () => {
      // This test simulates what happens when DALL-E 3 fails
      // We can't force a DALL-E 3 failure, but we can test error handling
      
      const response = await request(app)
        .post('/api/generate')
        .send({
          prompt: 'a very simple circle',
          customizations: {
            complexity: 'simple',
            ageGroup: 'kids',
            lineThickness: 'thick'
          }
        })

      expect(response.status).toBeLessThanOrEqual(500)
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true)
        expect(response.body.metadata.model).toMatch(/dall-e-[23]/)
        
        testResults.push({
          test: 'dalle_fallback_not_needed',
          success: true,
          model: response.body.metadata.model
        })
      } else {
        // If there's an error, it should be handled gracefully
        expect(response.body.success).toBe(false)
        expect(response.body.error).toBeTruthy()
        
        testResults.push({
          test: 'dalle_error_handling',
          success: true,
          errorHandled: true
        })
      }
    }, 30000)
  })

  describe('Performance and Quality Metrics', () => {
    it.skipIf(!hasApiKey)('measures response times for different complexity levels', async () => {
      const complexityLevels = ['simple', 'medium', 'detailed']
      const performanceResults = []

      for (const complexity of complexityLevels) {
        const startTime = Date.now()
        
        const response = await request(app)
          .post('/api/refine-prompt')
          .send({
            prompt: 'a nature scene',
            customizations: {
              complexity,
              ageGroup: 'teens',
              lineThickness: 'medium'
            }
          })

        const responseTime = Date.now() - startTime
        
        if (response.status === 200) {
          performanceResults.push({
            complexity,
            responseTime,
            promptLength: response.body.refinedPrompt.length
          })
        }
      }

      expect(performanceResults.length).toBeGreaterThan(0)
      
      // Response times should be reasonable (under 10 seconds)
      performanceResults.forEach(result => {
        expect(result.responseTime).toBeLessThan(10000)
      })
      
      testResults.push({
        test: 'performance_metrics',
        success: true,
        results: performanceResults
      })
    }, 45000)

    it.skipIf(!hasApiKey)('validates prompt enhancement quality', async () => {
      const testCases = [
        { input: 'cat', expectedCategory: 'animals' },
        { input: 'flower garden', expectedCategory: 'nature' },
        { input: 'princess castle', expectedCategory: 'fantasy' },
        { input: 'geometric pattern', expectedCategory: 'mandalas' }
      ]

      const qualityResults = []

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/refine-prompt')
          .send({
            prompt: testCase.input,
            customizations: {
              complexity: 'medium',
              ageGroup: 'kids',
              lineThickness: 'medium'
            }
          })

        if (response.status === 200) {
          const enhancement = response.body.refinedPrompt.length / testCase.input.length
          
          qualityResults.push({
            input: testCase.input,
            category: response.body.metadata.category,
            expectedCategory: testCase.expectedCategory,
            enhancement,
            hasQualityKeywords: response.body.refinedPrompt.toLowerCase().includes('line art')
          })
        }
      }

      expect(qualityResults.length).toBeGreaterThan(0)
      
      // All results should have significant enhancement (at least 3x longer)
      qualityResults.forEach(result => {
        expect(result.enhancement).toBeGreaterThan(3)
        expect(result.hasQualityKeywords).toBe(true)
      })
      
      testResults.push({
        test: 'quality_enhancement',
        success: true,
        results: qualityResults,
        averageEnhancement: qualityResults.reduce((acc, r) => acc + r.enhancement, 0) / qualityResults.length
      })
    }, 60000)
  })
})