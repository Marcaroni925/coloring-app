import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import cors from 'cors'

// Mock OpenAI service
const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn()
    }
  },
  images: {
    generate: vi.fn()
  }
}

// Mock Firebase Admin
const mockFirebaseAdmin = {
  auth: vi.fn(() => ({
    verifyIdToken: vi.fn().mockResolvedValue({ uid: 'test-user' })
  })),
  firestore: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        set: vi.fn().mockResolvedValue({}),
        get: vi.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
        delete: vi.fn().mockResolvedValue({})
      })),
      where: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({ docs: [] })
      }))
    }))
  }))
}

// Mock services
vi.mock('openai', () => ({
  default: vi.fn(() => mockOpenAI)
}))

vi.mock('firebase-admin', () => ({
  default: mockFirebaseAdmin
}))

// Import app after mocking
import app from '../app.js'

describe('API Endpoints', () => {
  let server

  beforeAll(() => {
    server = app.listen(0) // Use random port for testing
  })

  afterAll(() => {
    server?.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Health Check', () => {
    it('returns healthy status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200)

      expect(response.body).toEqual({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        memory: expect.any(Object)
      })
    })

    it('includes system metrics in health response', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200)

      expect(response.body.memory).toHaveProperty('used')
      expect(response.body.memory).toHaveProperty('total')
      expect(response.body.uptime).toBeGreaterThan(0)
    })
  })

  describe('POST /api/refine-prompt', () => {
    const validRequest = {
      prompt: 'a friendly dinosaur',
      customizations: {
        complexity: 'medium',
        ageGroup: 'kids',
        lineThickness: 'medium',
        border: 'with',
        theme: 'animals'
      }
    }

    beforeEach(() => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: 'A friendly, smiling dinosaur with simple line art features, perfect for children to color. The dinosaur has large, gentle eyes and a happy expression, suitable for ages 4-8. Clean outlines with medium thickness, including a decorative border.'
          }
        }]
      })
    })

    it('successfully refines a basic prompt', async () => {
      const response = await request(app)
        .post('/api/refine-prompt')
        .send(validRequest)
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        originalPrompt: 'a friendly dinosaur',
        refinedPrompt: expect.stringContaining('friendly'),
        metadata: {
          category: 'animals',
          complexity: 'medium',
          ageGroup: 'kids',
          keywords: expect.any(Array)
        }
      })
    })

    it('adds key quality phrases to refined prompts', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: 'A cute cat in simple line art style, 300 DPI quality, family-friendly coloring page with bold outlines suitable for children.'
          }
        }]
      })

      const response = await request(app)
        .post('/api/refine-prompt')
        .send({
          prompt: 'a cat',
          customizations: { complexity: 'simple', ageGroup: 'kids' }
        })
        .expect(200)

      const refinedPrompt = response.body.refinedPrompt
      expect(refinedPrompt).toMatch(/line art|300 DPI|family-friendly/i)
    })

    it('validates required fields', async () => {
      const response = await request(app)
        .post('/api/refine-prompt')
        .send({})
        .expect(400)

      expect(response.body).toEqual({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'prompt',
            msg: expect.stringContaining('required')
          })
        ])
      })
    })

    it('validates prompt length constraints', async () => {
      const response = await request(app)
        .post('/api/refine-prompt')
        .send({
          prompt: 'a'.repeat(501), // Too long
          customizations: {}
        })
        .expect(400)

      expect(response.body.details).toContainEqual(
        expect.objectContaining({
          field: 'prompt',
          msg: expect.stringContaining('500 characters')
        })
      )
    })

    it('filters inappropriate content', async () => {
      const response = await request(app)
        .post('/api/refine-prompt')
        .send({
          prompt: 'violent scary monster',
          customizations: { ageGroup: 'kids' }
        })
        .expect(400)

      expect(response.body).toEqual({
        success: false,
        error: 'Content validation failed',
        message: expect.stringContaining('family-friendly')
      })
    })

    it('handles OpenAI API errors gracefully', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('OpenAI API rate limit exceeded')
      )

      const response = await request(app)
        .post('/api/refine-prompt')
        .send(validRequest)
        .expect(500)

      expect(response.body).toEqual({
        success: false,
        error: 'Service temporarily unavailable',
        code: 'OPENAI_ERROR'
      })
    })

    it('categorizes prompts correctly', async () => {
      const testCases = [
        { prompt: 'a butterfly', expectedCategory: 'animals' },
        { prompt: 'a fairy castle', expectedCategory: 'fantasy' },
        { prompt: 'a flower garden', expectedCategory: 'nature' },
        { prompt: 'geometric patterns', expectedCategory: 'mandalas' }
      ]

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/refine-prompt')
          .send({
            prompt: testCase.prompt,
            customizations: { complexity: 'medium', ageGroup: 'kids' }
          })
          .expect(200)

        expect(response.body.metadata.category).toBe(testCase.expectedCategory)
      }
    })

    it('adjusts complexity based on age group', async () => {
      const adultRequest = {
        prompt: 'intricate mandala',
        customizations: { complexity: 'complex', ageGroup: 'adults' }
      }

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: 'Highly detailed intricate mandala with complex geometric patterns, fine line work, and elaborate decorative elements suitable for adult coloring enthusiasts.'
          }
        }]
      })

      const response = await request(app)
        .post('/api/refine-prompt')
        .send(adultRequest)
        .expect(200)

      expect(response.body.refinedPrompt).toMatch(/intricate|detailed|complex/i)
    })
  })

  describe('POST /api/generate', () => {
    const validRequest = {
      prompt: 'a cute cat playing with yarn',
      customizations: {
        complexity: 'simple',
        ageGroup: 'kids',
        lineThickness: 'thick',
        border: 'without'
      }
    }

    beforeEach(() => {
      // Mock prompt refinement
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: 'A cute cat playing with yarn, simple line art, perfect for children to color.'
          }
        }]
      })

      // Mock image generation
      mockOpenAI.images.generate.mockResolvedValue({
        data: [{
          url: 'https://example.com/generated-image.png',
          revised_prompt: 'A cute cat playing with yarn in simple line art style'
        }]
      })
    })

    it('generates image successfully with prompt refinement', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send(validRequest)
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        imageUrl: 'https://example.com/generated-image.png',
        originalPrompt: 'a cute cat playing with yarn',
        refinedPrompt: expect.stringContaining('cute cat'),
        revisedPrompt: expect.stringContaining('cute cat'),
        metadata: {
          model: 'dall-e-3',
          size: '1024x1024',
          quality: 'standard',
          style: 'natural',
          category: expect.any(String),
          complexity: 'simple',
          ageGroup: 'kids',
          timestamp: expect.any(String)
        }
      })
    })

    it('falls back to DALL-E 2 when DALL-E 3 fails', async () => {
      mockOpenAI.images.generate
        .mockRejectedValueOnce(new Error('DALL-E 3 unavailable'))
        .mockResolvedValueOnce({
          data: [{
            url: 'https://example.com/dalle2-image.png'
          }]
        })

      const response = await request(app)
        .post('/api/generate')
        .send(validRequest)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.metadata.model).toBe('dall-e-2')
    })

    it('handles rate limiting with exponential backoff', async () => {
      mockOpenAI.images.generate.mockRejectedValue(
        Object.assign(new Error('Rate limit exceeded'), { status: 429 })
      )

      const response = await request(app)
        .post('/api/generate')
        .send(validRequest)
        .expect(429)

      expect(response.body).toEqual({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: expect.any(Number),
        code: 'RATE_LIMIT'
      })
    })

    it('validates prompt content for family-friendliness', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          prompt: 'inappropriate scary content',
          customizations: { ageGroup: 'kids' }
        })
        .expect(400)

      expect(response.body.error).toContain('family-friendly')
    })

    it('includes detailed metadata in response', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send(validRequest)
        .expect(200)

      const metadata = response.body.metadata
      expect(metadata).toHaveProperty('model')
      expect(metadata).toHaveProperty('size')
      expect(metadata).toHaveProperty('quality')
      expect(metadata).toHaveProperty('timestamp')
      expect(metadata).toHaveProperty('category')
      expect(metadata.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('handles content policy violations', async () => {
      mockOpenAI.images.generate.mockRejectedValue(
        Object.assign(new Error('Your request was rejected as a result of our safety system'), {
          status: 400,
          code: 'content_policy_violation'
        })
      )

      const response = await request(app)
        .post('/api/generate')
        .send(validRequest)
        .expect(400)

      expect(response.body).toEqual({
        success: false,
        error: 'Content policy violation',
        message: 'Please ensure your prompt is family-friendly and appropriate for coloring pages',
        code: 'CONTENT_POLICY'
      })
    })

    it('logs generation attempts for monitoring', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await request(app)
        .post('/api/generate')
        .send(validRequest)
        .expect(200)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[IMAGE_GENERATION]')
      )

      consoleSpy.mockRestore()
    })
  })

  describe('POST /api/generate-pdf', () => {
    it('generates PDF from image URL', async () => {
      const response = await request(app)
        .post('/api/generate-pdf')
        .send({
          imageUrl: 'https://example.com/test-image.png',
          fileName: 'test-coloring-page'
        })
        .expect(200)

      expect(response.headers['content-type']).toBe('application/pdf')
      expect(response.headers['content-disposition']).toContain('test-coloring-page.pdf')
    })

    it('validates required fields for PDF generation', async () => {
      const response = await request(app)
        .post('/api/generate-pdf')
        .send({})
        .expect(400)

      expect(response.body.error).toContain('required')
    })

    it('handles invalid image URLs gracefully', async () => {
      const response = await request(app)
        .post('/api/generate-pdf')
        .send({
          imageUrl: 'invalid-url',
          fileName: 'test'
        })
        .expect(400)

      expect(response.body.error).toContain('valid image URL')
    })
  })

  describe('Authentication Middleware', () => {
    it('requires authentication for protected routes', async () => {
      const response = await request(app)
        .post('/api/auth/save-image')
        .send({})
        .expect(401)

      expect(response.body.error).toContain('Authentication required')
    })

    it('validates Firebase ID tokens', async () => {
      const response = await request(app)
        .post('/api/auth/save-image')
        .set('Authorization', 'Bearer valid-token')
        .send({
          imageUrl: 'https://example.com/image.png',
          prompt: 'test prompt'
        })
        .expect(200)

      expect(mockFirebaseAdmin.auth().verifyIdToken).toHaveBeenCalledWith('valid-token')
    })

    it('handles invalid tokens gracefully', async () => {
      mockFirebaseAdmin.auth().verifyIdToken.mockRejectedValue(
        new Error('Invalid token')
      )

      const response = await request(app)
        .post('/api/auth/save-image')
        .set('Authorization', 'Bearer invalid-token')
        .send({})
        .expect(401)

      expect(response.body.error).toContain('Invalid authentication')
    })
  })

  describe('Gallery Management', () => {
    beforeEach(() => {
      mockFirebaseAdmin.auth().verifyIdToken.mockResolvedValue({ uid: 'test-user' })
    })

    it('saves images to user gallery', async () => {
      const response = await request(app)
        .post('/api/auth/save-image')
        .set('Authorization', 'Bearer valid-token')
        .send({
          imageUrl: 'https://example.com/image.png',
          prompt: 'test prompt',
          metadata: { complexity: 'simple' }
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.imageId).toBeDefined()
    })

    it('retrieves user gallery with pagination', async () => {
      const mockDocs = [
        { id: 'img1', data: () => ({ imageUrl: 'url1', prompt: 'prompt1' }) },
        { id: 'img2', data: () => ({ imageUrl: 'url2', prompt: 'prompt2' }) }
      ]

      mockFirebaseAdmin.firestore().collection().where().get.mockResolvedValue({
        docs: mockDocs,
        empty: false
      })

      const response = await request(app)
        .get('/api/auth/get-gallery')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.images).toHaveLength(2)
      expect(response.body.images[0]).toHaveProperty('id', 'img1')
    })

    it('deletes individual images from gallery', async () => {
      const response = await request(app)
        .delete('/api/auth/delete-image/test-image-id')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('deleted')
    })

    it('performs bulk delete operations', async () => {
      const response = await request(app)
        .post('/api/auth/delete-bulk')
        .set('Authorization', 'Bearer valid-token')
        .send({
          imageIds: ['img1', 'img2', 'img3']
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.deletedCount).toBe(3)
    })

    it('handles gallery access for non-existent users', async () => {
      mockFirebaseAdmin.firestore().collection().where().get.mockResolvedValue({
        docs: [],
        empty: true
      })

      const response = await request(app)
        .get('/api/auth/get-gallery')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)

      expect(response.body.images).toHaveLength(0)
      expect(response.body.total).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('handles database connection errors', async () => {
      mockFirebaseAdmin.firestore.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const response = await request(app)
        .post('/api/auth/save-image')
        .set('Authorization', 'Bearer valid-token')
        .send({
          imageUrl: 'https://example.com/image.png',
          prompt: 'test'
        })
        .expect(500)

      expect(response.body.error).toContain('Database error')
    })

    it('provides appropriate error codes for different failure types', async () => {
      const testCases = [
        {
          mockError: new Error('Rate limit exceeded'),
          expectedCode: 'RATE_LIMIT'
        },
        {
          mockError: new Error('Invalid API key'),
          expectedCode: 'AUTHENTICATION_ERROR'
        },
        {
          mockError: new Error('Service unavailable'),
          expectedCode: 'SERVICE_ERROR'
        }
      ]

      for (const testCase of testCases) {
        mockOpenAI.chat.completions.create.mockRejectedValue(testCase.mockError)

        const response = await request(app)
          .post('/api/refine-prompt')
          .send({
            prompt: 'test',
            customizations: {}
          })

        expect(response.body.code).toBe(testCase.expectedCode)
      }
    })

    it('logs errors for monitoring and debugging', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('Test error'))

      await request(app)
        .post('/api/refine-prompt')
        .send({
          prompt: 'test',
          customizations: {}
        })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]')
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Input Sanitization', () => {
    it('sanitizes prompt input to prevent injection attacks', async () => {
      const maliciousPrompt = '<script>alert("xss")</script>a cat'

      const response = await request(app)
        .post('/api/refine-prompt')
        .send({
          prompt: maliciousPrompt,
          customizations: {}
        })
        .expect(200)

      expect(response.body.originalPrompt).not.toContain('<script>')
      expect(response.body.originalPrompt).toContain('a cat')
    })

    it('validates and sanitizes customization parameters', async () => {
      const response = await request(app)
        .post('/api/refine-prompt')
        .send({
          prompt: 'a cat',
          customizations: {
            complexity: 'invalid-value',
            ageGroup: '<script>alert("xss")</script>',
            lineThickness: 'medium'
          }
        })
        .expect(400)

      expect(response.body.error).toContain('Validation failed')
    })

    it('enforces rate limiting per IP address', async () => {
      // Make multiple rapid requests
      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .post('/api/refine-prompt')
          .send({
            prompt: 'test',
            customizations: {}
          })
      )

      const responses = await Promise.all(requests)
      const rateLimitedResponses = responses.filter(r => r.status === 429)

      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })
  })
})