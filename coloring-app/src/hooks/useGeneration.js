/**
 * useGeneration Hook
 * 
 * Custom React hook for managing image generation workflow.
 * Handles API calls, loading states, error management, and result processing.
 * 
 * Evidence: architecture.md Section 4.1 API Integration
 * Best Practice: Separation of concerns - API logic in custom hooks
 */

import { useState, useCallback, useRef } from 'react';
import { auth } from '../../firebase-config.js';
import { 
  API_CONFIG, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES,
  formatApiError, 
  retryWithBackoff,
  createLogger 
} from '../utils';

const logger = createLogger('useGeneration');

/**
 * Custom hook for image generation workflow
 * @param {Object} options - Configuration options
 * @returns {Object} Generation state and methods
 */
export const useGeneration = (options = {}) => {
  const {
    onSuccess,
    onError,
    enableRetry = true,
    maxRetries = API_CONFIG.retryConfig.attempts,
    retryDelay = API_CONFIG.retryConfig.delay
  } = options;

  // State management
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [refinedPrompt, setRefinedPrompt] = useState('');
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [progress, setProgress] = useState(0);

  // Refs for cleanup
  const abortControllerRef = useRef(null);

  /**
   * Calls the image generation API
   * @param {Object} formData - Form data for generation
   * @returns {Promise<Object>} API response
   */
  const callImageGenerationAPI = useCallback(async (formData) => {
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      logger.log('Starting image generation API call', { formData });
      
      // Debug API call - Evidence: architecture.md Section 4.1 API Integration debugging
      const requestData = {
        prompt: formData.prompt,
        customizations: {
          complexity: formData.complexity || 'medium',
          ageGroup: formData.ageGroup || 'kids',
          lineThickness: formData.lineThickness || 'medium',
          border: formData.border ? 'with' : 'without',
          theme: formData.theme || null
        }
      };
      
      console.log('[useGeneration] Making API call to:', API_CONFIG.endpoints.generate);
      console.log('[useGeneration] Request data:', requestData);

      const response = await fetch(API_CONFIG.endpoints.generate, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      logger.log('Image generation API response received', { 
        success: data.success,
        hasImage: !!data.imageUrl,
        hasRefinedPrompt: !!data.refinedPrompt
      });

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        logger.log('Image generation was cancelled');
        throw new Error('Generation cancelled');
      }
      
      logger.error('Image generation API error:', error);
      throw error;
    }
  }, []);

  /**
   * Main image generation handler
   * @param {Object} formData - Validated form data
   * @returns {Promise<Object>} Generation result
   */
  const generateImage = useCallback(async (formData) => {
    if (isGenerating) {
      logger.warn('Generation already in progress');
      return null;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      // Update progress
      setProgress(25);

      const operation = () => callImageGenerationAPI(formData);
      
      // Use retry logic if enabled
      const result = enableRetry 
        ? await retryWithBackoff(operation, maxRetries, retryDelay)
        : await operation();

      setProgress(75);

      if (result.success) {
        // Update state with successful result
        setRefinedPrompt(result.refinedPrompt || '');
        setGeneratedImage(result.imageUrl);
        setMetadata(result.metadata || null);
        setProgress(100);

        // Store metadata globally for PDF generation
        if (result.metadata) {
          window.lastGeneratedMetadata = result.metadata;
        }

        logger.log('Image generation completed successfully');
        
        // Call success callback
        onSuccess?.(result);

        return {
          success: true,
          image: result.imageUrl,
          refinedPrompt: result.refinedPrompt,
          metadata: result.metadata
        };
      } else {
        throw new Error(result.message || ERROR_MESSAGES.apiGeneral);
      }
    } catch (error) {
      const formattedError = formatApiError(error);
      setError(formattedError);
      
      logger.error('Image generation failed:', error);
      
      // Call error callback
      onError?.(formattedError, error);

      return {
        success: false,
        error: formattedError,
        originalError: error
      };
    } finally {
      setIsGenerating(false);
      setProgress(0);
      abortControllerRef.current = null;
    }
  }, [isGenerating, callImageGenerationAPI, enableRetry, maxRetries, retryDelay, onSuccess, onError]);

  /**
   * Cancels the current generation
   */
  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      logger.log('Generation cancelled by user');
    }
    
    setIsGenerating(false);
    setProgress(0);
    setError('Generation cancelled');
  }, []);

  /**
   * Downloads generated image as PDF
   * @returns {Promise<boolean>} Success status
   */
  const downloadPDF = useCallback(async () => {
    if (!generatedImage) {
      const error = ERROR_MESSAGES.pdfMissingImage;
      setError(error);
      onError?.(error);
      return false;
    }

    setIsGenerating(true);
    setError(null);

    try {
      logger.log('Starting PDF generation');
      
      const enhancedMetadata = window.lastGeneratedMetadata || {};
      const pdfMetadata = {
        originalPrompt: metadata?.originalPrompt || '',
        refinedPrompt: refinedPrompt,
        dalleRevisedPrompt: enhancedMetadata.revised_prompt || null,
        generatedAt: enhancedMetadata.generatedAt || new Date().toISOString(),
        apiMode: enhancedMetadata.apiMode || 'unknown',
        model: enhancedMetadata.model || 'dall-e-3',
        processingTime: enhancedMetadata.processingTime || null
      };

      const response = await fetch(API_CONFIG.endpoints.generatePdf, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: generatedImage,
          title: `Coloring Page: ${metadata?.originalPrompt || 'Generated'}`,
          metadata: pdfMetadata
        })
      });

      if (!response.ok) {
        throw new Error(`PDF generation failed: ${response.status}`);
      }

      const pdfBlob = await response.blob();
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `coloring-page-${Date.now()}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      logger.log('PDF downloaded successfully');
      return true;
    } catch (error) {
      const formattedError = formatApiError(error);
      setError(formattedError);
      onError?.(formattedError, error);
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, [generatedImage, refinedPrompt, metadata, onError]);

  /**
   * Saves generated image to user's gallery
   * @param {Object} user - User object
   * @returns {Promise<boolean>} Success status
   */
  const saveToGallery = useCallback(async (user) => {
    if (!user) {
      const error = ERROR_MESSAGES.galleryAuth;
      setError(error);
      onError?.(error);
      return false;
    }

    if (!generatedImage) {
      const error = ERROR_MESSAGES.pdfMissingImage;
      setError(error);
      onError?.(error);
      return false;
    }

    setIsGenerating(true);
    setError(null);

    try {
      logger.log('Starting gallery save');
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const idToken = await currentUser.getIdToken();
      const enhancedMetadata = window.lastGeneratedMetadata || {};
      
      const imageData = {
        imageUrl: generatedImage,
        originalPrompt: metadata?.originalPrompt || '',
        refinedPrompt: refinedPrompt,
        metadata: {
          ...metadata,
          dalleRevisedPrompt: enhancedMetadata.revised_prompt || null,
          apiMode: enhancedMetadata.apiMode || 'unknown',
          model: enhancedMetadata.model || 'dall-e-3',
          generatedAt: enhancedMetadata.generatedAt || new Date().toISOString(),
          processingTime: enhancedMetadata.processingTime || null,
          retryCount: enhancedMetadata.retryCount || 0,
          quality: enhancedMetadata.quality || 'standard'
        }
      };

      const response = await fetch(API_CONFIG.endpoints.saveImage, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(imageData)
      });

      if (!response.ok) {
        throw new Error(`Failed to save image: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        logger.log('Image saved to gallery successfully:', result.imageId);
        return true;
      } else {
        throw new Error(result.message || ERROR_MESSAGES.gallerySave);
      }
    } catch (error) {
      const formattedError = formatApiError(error);
      setError(formattedError);
      onError?.(formattedError, error);
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, [generatedImage, refinedPrompt, metadata, onError]);

  /**
   * Resets the generation state
   */
  const reset = useCallback(() => {
    setGeneratedImage(null);
    setRefinedPrompt('');
    setError(null);
    setMetadata(null);
    setProgress(0);
    
    // Cancel any ongoing generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setIsGenerating(false);
    logger.log('Generation state reset');
  }, []);

  /**
   * Clears only the error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isGenerating,
    generatedImage,
    refinedPrompt,
    error,
    metadata,
    progress,
    
    // Actions
    generateImage,
    cancelGeneration,
    downloadPDF,
    saveToGallery,
    reset,
    clearError,
    
    // Computed properties
    hasImage: !!generatedImage,
    hasError: !!error,
    canDownload: !!generatedImage && !isGenerating,
    canSave: !!generatedImage && !isGenerating,
    
    // For debugging (development only)
    ...(process.env.NODE_ENV === 'development' && {
      _debug: {
        abortController: abortControllerRef.current,
        apiConfig: API_CONFIG,
        lastMetadata: typeof window !== 'undefined' ? window.lastGeneratedMetadata : null
      }
    })
  };
};