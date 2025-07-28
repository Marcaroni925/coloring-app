/**
 * Image Optimization Service for Coloring Book Creator
 * 
 * PERFORMANCE ENHANCEMENTS:
 * - Image compression using Sharp (mock implementation)
 * - Progressive loading support
 * - WebP conversion with fallbacks
 * - Memory optimization for large images
 * - Caching layer for processed images
 * 
 * Addresses audit findings: Large image handling, memory leaks, compression
 * Target: <3s load times, optimized memory usage
 */

import sharp from 'sharp'; // Mock: npm install sharp
import crypto from 'crypto';
import { apiLogger } from '../utils/logger.js';

/**
 * Image optimization configuration
 * Balances quality with performance for coloring book images
 */
const OPTIMIZATION_CONFIG = {
  // Output formats and quality settings
  formats: {
    webp: { quality: 85, effort: 4 }, // Best compression
    jpeg: { quality: 90, progressive: true }, // Fallback format
    png: { quality: 90, compressionLevel: 6 } // For line art
  },
  
  // Size constraints for different use cases
  sizes: {
    thumbnail: { width: 300, height: 300, fit: 'cover' },
    preview: { width: 800, height: 800, fit: 'inside' },
    full: { width: 1024, height: 1024, fit: 'inside' },
    print: { width: 2048, height: 2048, fit: 'inside' } // 300 DPI equivalent
  },
  
  // Memory management
  limits: {
    maxInputSize: 50 * 1024 * 1024, // 50MB max input
    maxOutputSize: 10 * 1024 * 1024, // 10MB max output
    concurrentProcessing: 3 // Limit concurrent operations
  }
};

/**
 * In-memory cache for processed images
 * Implements LRU eviction to prevent memory bloat
 */
class ImageCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  /**
   * Generates cache key from image data and options
   */
  generateKey(imageData, options) {
    const hash = crypto.createHash('sha256');
    hash.update(imageData);
    hash.update(JSON.stringify(options));
    return hash.digest('hex').substring(0, 16);
  }
  
  /**
   * Gets cached processed image
   */
  get(key) {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }
  
  /**
   * Stores processed image with LRU eviction
   */
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  
  /**
   * Clears cache and reports statistics
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    apiLogger.info('Image cache cleared', { clearedEntries: size });
  }
  
  /**
   * Gets cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      usage: Math.round((this.cache.size / this.maxSize) * 100)
    };
  }
}

// Global cache instance
const imageCache = new ImageCache(50); // Cache up to 50 processed images

/**
 * Validates input image data and size constraints
 * Prevents processing of oversized or invalid images
 * 
 * @param {Buffer|string} imageData - Image data buffer or base64 string
 * @returns {Object} Validation result
 */
function validateImageInput(imageData) {
  try {
    let buffer;
    let originalSize;
    
    if (typeof imageData === 'string') {
      // Handle base64 data URLs
      if (imageData.startsWith('data:image/')) {
        const base64Data = imageData.split(',')[1];
        buffer = Buffer.from(base64Data, 'base64');
      } else {
        return { isValid: false, error: 'Invalid image data format' };
      }
    } else if (Buffer.isBuffer(imageData)) {
      buffer = imageData;
    } else {
      return { isValid: false, error: 'Unsupported image data type' };
    }
    
    originalSize = buffer.length;
    
    // Check size limits
    if (originalSize > OPTIMIZATION_CONFIG.limits.maxInputSize) {
      return {
        isValid: false,
        error: `Image too large: ${Math.round(originalSize / 1024 / 1024)}MB (max: ${OPTIMIZATION_CONFIG.limits.maxInputSize / 1024 / 1024}MB)`
      };
    }
    
    if (originalSize < 1024) { // 1KB minimum
      return { isValid: false, error: 'Image too small' };
    }
    
    return {
      isValid: true,
      buffer,
      originalSize
    };
    
  } catch (error) {
    return { isValid: false, error: `Validation failed: ${error.message}` };
  }
}

/**
 * Optimizes image for web delivery with multiple format outputs
 * Implements progressive loading and WebP support with fallbacks
 * 
 * @param {Buffer|string} imageData - Input image data
 * @param {Object} options - Optimization options
 * @returns {Promise<Object>} Optimization results with multiple formats
 */
export async function optimizeImage(imageData, options = {}) {
  const startTime = Date.now();
  
  try {
    // Validate input
    const validation = validateImageInput(imageData);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    const { buffer, originalSize } = validation;
    
    // Generate cache key
    const cacheKey = imageCache.generateKey(buffer, options);
    
    // Check cache first
    const cached = imageCache.get(cacheKey);
    if (cached) {
      apiLogger.info('Image optimization cache hit', {
        cacheKey: cacheKey.substring(0, 8),
        originalSize,
        processingTime: 0
      });
      return cached;
    }
    
    // Default options
    const opts = {
      size: 'preview', // thumbnail, preview, full, print
      formats: ['webp', 'jpeg'], // Output formats
      progressive: true,
      ...options
    };
    
    // Get size configuration
    const sizeConfig = OPTIMIZATION_CONFIG.sizes[opts.size] || OPTIMIZATION_CONFIG.sizes.preview;
    
    apiLogger.info('Starting image optimization', {
      originalSize,
      targetSize: opts.size,
      formats: opts.formats,
      dimensions: `${sizeConfig.width}x${sizeConfig.height}`
    });
    
    // Initialize Sharp processor
    let processor = sharp(buffer)
      .resize(sizeConfig.width, sizeConfig.height, {
        fit: sizeConfig.fit,
        withoutEnlargement: true,
        background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
      });
    
    // Process multiple formats
    const results = {};
    const processingPromises = [];
    
    for (const format of opts.formats) {
      const formatConfig = OPTIMIZATION_CONFIG.formats[format];
      if (!formatConfig) continue;
      
      processingPromises.push(
        (async () => {
          try {
            let formatProcessor = processor.clone();
            
            switch (format) {
              case 'webp':
                formatProcessor = formatProcessor.webp({
                  quality: formatConfig.quality,
                  effort: formatConfig.effort
                });
                break;
                
              case 'jpeg':
                formatProcessor = formatProcessor.jpeg({
                  quality: formatConfig.quality,
                  progressive: formatConfig.progressive,
                  optimizeCoding: true
                });
                break;
                
              case 'png':
                formatProcessor = formatProcessor.png({
                  quality: formatConfig.quality,
                  compressionLevel: formatConfig.compressionLevel,
                  adaptiveFiltering: true
                });
                break;
                
              default:
                throw new Error(`Unsupported format: ${format}`);
            }
            
            const outputBuffer = await formatProcessor.toBuffer();
            const outputSize = outputBuffer.length;
            
            // Validate output size
            if (outputSize > OPTIMIZATION_CONFIG.limits.maxOutputSize) {
              apiLogger.warn('Output size too large, reducing quality', {
                format,
                outputSize,
                maxSize: OPTIMIZATION_CONFIG.limits.maxOutputSize
              });
              
              // Retry with reduced quality
              const reducedQuality = Math.max(60, formatConfig.quality - 20);
              const retryProcessor = processor.clone();
              
              const retryBuffer = await (format === 'webp' 
                ? retryProcessor.webp({ quality: reducedQuality, effort: formatConfig.effort })
                : format === 'jpeg'
                ? retryProcessor.jpeg({ quality: reducedQuality, progressive: true })
                : retryProcessor.png({ quality: reducedQuality })
              ).toBuffer();
              
              return {
                format,
                buffer: retryBuffer,
                size: retryBuffer.length,
                quality: reducedQuality,
                dataUrl: `data:image/${format};base64,${retryBuffer.toString('base64')}`
              };
            }
            
            return {
              format,
              buffer: outputBuffer,
              size: outputSize,
              quality: formatConfig.quality,
              dataUrl: `data:image/${format};base64,${outputBuffer.toString('base64')}`
            };
            
          } catch (error) {
            apiLogger.error(`Failed to process ${format} format`, {
              format,
              error: error.message
            });
            return null;
          }
        })()
      );
    }
    
    // Wait for all format processing to complete
    const formatResults = await Promise.all(processingPromises);
    
    // Compile results
    for (const result of formatResults) {
      if (result) {
        results[result.format] = {
          dataUrl: result.dataUrl,
          size: result.size,
          quality: result.quality,
          compressionRatio: Math.round((1 - result.size / originalSize) * 100)
        };
      }
    }
    
    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    
    const optimizationResult = {
      success: true,
      originalSize,
      metadata: {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        channels: metadata.channels,
        hasAlpha: metadata.hasAlpha
      },
      optimized: results,
      processingTime: Date.now() - startTime,
      cacheKey
    };
    
    // Cache the result
    imageCache.set(cacheKey, optimizationResult);
    
    // Log success with metrics
    apiLogger.info('Image optimization completed', {
      originalSize,
      formats: Object.keys(results),
      totalSavings: Math.round((1 - Math.min(...Object.values(results).map(r => r.size)) / originalSize) * 100),
      processingTime: optimizationResult.processingTime,
      cacheStats: imageCache.getStats()
    });
    
    return optimizationResult;
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    apiLogger.error('Image optimization failed', {
      error: error.message,
      processingTime,
      inputType: typeof imageData,
      inputSize: typeof imageData === 'string' ? imageData.length : imageData?.length || 0
    });
    
    return {
      success: false,
      error: error.message,
      processingTime
    };
  }
}

/**
 * Generates progressive loading placeholders
 * Creates low-quality placeholder for immediate display
 * 
 * @param {Buffer|string} imageData - Input image data
 * @returns {Promise<Object>} Placeholder generation result
 */
export async function generateProgressivePlaceholder(imageData) {
  try {
    const validation = validateImageInput(imageData);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    // Generate tiny placeholder (for immediate display)
    const placeholderBuffer = await sharp(validation.buffer)
      .resize(20, 20, { fit: 'cover' })
      .blur(2)
      .jpeg({ quality: 30 })
      .toBuffer();
    
    // Generate medium quality preview
    const previewBuffer = await sharp(validation.buffer)
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 70, progressive: true })
      .toBuffer();
    
    return {
      success: true,
      placeholder: `data:image/jpeg;base64,${placeholderBuffer.toString('base64')}`,
      preview: `data:image/jpeg;base64,${previewBuffer.toString('base64')}`,
      sizes: {
        placeholder: placeholderBuffer.length,
        preview: previewBuffer.length
      }
    };
    
  } catch (error) {
    apiLogger.error('Progressive placeholder generation failed', {
      error: error.message
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Batch image optimization for gallery processing
 * Optimizes multiple images with concurrency control
 * 
 * @param {Array} images - Array of image data
 * @param {Object} options - Batch processing options
 * @returns {Promise<Array>} Batch processing results
 */
export async function batchOptimizeImages(images, options = {}) {
  const { concurrency = OPTIMIZATION_CONFIG.limits.concurrentProcessing } = options;
  const results = [];
  
  apiLogger.info('Starting batch image optimization', {
    imageCount: images.length,
    concurrency
  });
  
  // Process images in batches to control memory usage
  for (let i = 0; i < images.length; i += concurrency) {
    const batch = images.slice(i, i + concurrency);
    
    const batchPromises = batch.map(async (imageData, index) => {
      try {
        const result = await optimizeImage(imageData, options);
        return {
          index: i + index,
          success: result.success,
          result
        };
      } catch (error) {
        return {
          index: i + index,
          success: false,
          error: error.message
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Small delay between batches to prevent overwhelming the system
    if (i + concurrency < images.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  
  apiLogger.info('Batch image optimization completed', {
    total: images.length,
    successful: successCount,
    failed: images.length - successCount
  });
  
  return results;
}

/**
 * Clears image cache and reports statistics
 */
export function clearImageCache() {
  const stats = imageCache.getStats();
  imageCache.clear();
  return stats;
}

/**
 * Gets current cache statistics
 */
export function getCacheStats() {
  return imageCache.getStats();
}

/**
 * Export optimization service
 */
export default {
  optimizeImage,
  generateProgressivePlaceholder,
  batchOptimizeImages,
  clearImageCache,
  getCacheStats,
  config: OPTIMIZATION_CONFIG
};