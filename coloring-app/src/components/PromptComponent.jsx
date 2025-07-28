/**
 * PromptComponent - Main Image Generation Component for Coloring Book Creator
 * 
 * This component implements the complete image generation flow with the new architecture:
 * - Uses extracted PromptForm and PreviewArea components
 * - Leverages custom hooks for business logic
 * - Follows separation of concerns principles
 * 
 * Evidence: architecture.md Section 3.2.1 Component Hierarchy
 * and PRD Section 4 Functional Requirements
 */

import React, { useState, useEffect, memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { PromptForm } from './PromptForm';
import { PreviewArea } from './PreviewArea';
import { useGeneration, useResponsive } from '../hooks';
import { DEFAULT_FORM_STATE } from '../utils';
import '../styles/index.css';

const PromptComponent = ({ user }) => {
  // Debug: Log component mount - Evidence: architecture.md Section 4.1 Debug Logging
  console.log('[PromptComponent] Component mounted/re-rendered', { user: !!user });
  
  // Remove duplicate validation - PromptForm handles all validation internally
  // Evidence: architecture.md Section 3.2.1 Component Separation of Concerns
  
  const {
    isGenerating,
    generatedImage,
    refinedPrompt,
    error,
    generateImage,
    downloadPDF,
    saveToGallery
  } = useGeneration({ user });
  
  const { isMobile, isDesktop, classes } = useResponsive();
  
  // Local state for UI
  const [showModal, setShowModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);

  // High contrast toggle handler
  const handleHighContrastToggle = () => {
    setIsHighContrast(!isHighContrast);
    document.body.classList.toggle('dark');
  };

  // Form submission handler - Evidence: architecture.md Section 3.2 Form Integration
  const handleSubmit = async (formValues) => {
    // Debug: Log form submission attempt
    console.log('[PromptComponent] handleSubmit called', { 
      formValues, 
      isGenerating,
      hasValues: !!formValues 
    });
    
    // Remove duplicate validation - PromptForm already validated
    // Trust that PromptForm has validated the data before calling onSubmit
    if (!formValues || isGenerating) {
      console.log('[PromptComponent] Submission blocked:', { formValues: !!formValues, isGenerating });
      return;
    }
    
    try {
      console.log('[PromptComponent] Calling generateImage...');
      const result = await generateImage(formValues);
      console.log('[PromptComponent] Generate result:', result);
      
      if (result.success) {
        console.log('[PromptComponent] Generation successful, showing modal');
        setShowModal(true);
      }
    } catch (err) {
      console.error('[PromptComponent] Generation error:', err);
      setShowErrorModal(true);
    }
  };

  // PDF download handler - Evidence: architecture.md Section 3.4 Modal Actions
  const handleDownloadPDF = async () => {
    console.log('[PromptComponent] PDF download clicked');
    try {
      const result = await downloadPDF();
      console.log('[PromptComponent] PDF download result:', result);
      if (result) {
        setShowModal(false);
      }
    } catch (err) {
      console.error('[PromptComponent] PDF download error:', err);
      setShowErrorModal(true);
    }
  };

  // Gallery save handler - Evidence: architecture.md Section 3.4 Modal Actions
  const handleSaveToGallery = async () => {
    console.log('[PromptComponent] Gallery save clicked', { user: !!user });
    try {
      const result = await saveToGallery(user);
      console.log('[PromptComponent] Gallery save result:', result);
      if (result) {
        setShowModal(false);
        alert('Image saved to your gallery!');
      }
    } catch (err) {
      console.error('[PromptComponent] Gallery save error:', err);
      setShowErrorModal(true);
    }
  };

  // Enhanced Crayon Icon for header
  const CrayonIcon = () => (
    <svg className="crayon-icon" fill="currentColor" viewBox="0 0 24 24" width="32" height="32">
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
      <circle cx="18" cy="6" r="2" fill="#A7C7E7"/>
    </svg>
  );

  return (
    <div className="w-full max-w-6xl mx-auto crayon-texture-bg">
      {/* Enhanced Header - Evidence: architecture.md Section 3.1 Component Structure */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-between mb-6">
          {/* Spacer for left alignment */}
          <div className="w-24"></div>
          
          {/* Center: Title with Crayon Icon */}
          <div className="flex items-center justify-center gap-4">
            <CrayonIcon />
            <h1 className="header-title">
              Coloring Book Creator
            </h1>
          </div>
          
          {/* Right: High Contrast Toggle */}
          <div className="flex justify-end w-24">
            <button
              className="contrast-toggle"
              onClick={(e) => {
                console.log('[PromptComponent] High contrast toggle clicked');
                handleHighContrastToggle();
              }}
              aria-label="Toggle high contrast mode"
              title="Switch to high contrast dark mode"
            >
              HC
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        {/* Form Section using extracted PromptForm component */}
        {/* Evidence: architecture.md Section 3.2.1 Component Integration */}
        <PromptForm
          onSubmit={handleSubmit}
          isGenerating={isGenerating}
          initialValues={DEFAULT_FORM_STATE}
        />

        {/* Preview Section using extracted PreviewArea component */}
        <PreviewArea
          imageUrl={generatedImage}
          isGenerating={isGenerating}
          refinedPrompt={refinedPrompt}
          formData={DEFAULT_FORM_STATE}
        />
      </div>

      {/* Enhanced Post-Generation Dialog - Evidence: architecture.md Section 3.4 Modal Interface */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto modal-backdrop">
          <DialogHeader>
            <DialogTitle className="card-title-enhanced">
              🎉 Your coloring page is ready!
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image Preview Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-handlee font-semibold text-gray-700">Preview</h4>
              <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
                <CardContent className="p-4">
                  {generatedImage ? (
                    <div className="relative">
                      <img
                        src={generatedImage}
                        alt="Generated coloring page preview"
                        className="w-full h-auto max-h-80 object-contain rounded-lg shadow-sm"
                        style={{ imageRendering: 'crisp-edges' }}
                      />
                      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        Ready for coloring
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p>Image preview unavailable</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Image Details */}
              <div className="text-sm text-gray-600 space-y-2">
                <div>
                  <span className="font-handlee font-medium">Generated image:</span>
                  <p className="italic font-handlee text-gray-500">Coloring page created successfully</p>
                </div>
                {refinedPrompt && (
                  <div>
                    <span className="font-handlee font-medium">Enhanced with AI:</span>
                    <p className="text-xs text-gray-500 truncate font-handlee" title={refinedPrompt}>
                      {refinedPrompt.length > 100 ? refinedPrompt.substring(0, 100) + '...' : refinedPrompt}
                    </p>
                  </div>
                )}
                {/* Image metadata tags removed since formData is no longer available */}
                {/* Evidence: architecture.md Section 3.4 Modal Simplification */}
              </div>
            </div>

            {/* Actions Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-handlee font-semibold text-gray-700">What would you like to do?</h4>
                  
              <div className="space-y-3">
                {/* Download PDF Option */}
                <Card className="border-gray-200 hover:bg-gray-50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <svg className="w-5 h-5 text-pastel-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-handlee font-medium text-gray-900">Download PDF</h5>
                        <p className="text-sm text-gray-600 font-handlee">Get a high-quality 300 DPI PDF perfect for printing</p>
                        <Button
                          onClick={(e) => {
                            console.log('[PromptComponent] Download PDF button clicked');
                            handleDownloadPDF();
                          }}
                          disabled={isGenerating}
                          className={`mt-2 w-full font-handlee transition-colors ${
                            isGenerating 
                              ? 'bg-muted-gray cursor-not-allowed opacity-50' 
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                          style={{ backgroundColor: '#D7E4BC' }}
                        >
                          {isGenerating ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Generating PDF...
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                              </svg>
                              Download PDF (300 DPI)
                            </div>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Save to Gallery Option */}
                <Card className="border-gray-200 hover:bg-gray-50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <svg className="w-5 h-5 text-pastel-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-handlee font-medium text-gray-900">Save to Gallery</h5>
                        <p className="text-sm text-gray-600 font-handlee">
                          {user ? 'Keep this creation in your personal gallery' : 'Sign in to save and organize your creations'}
                        </p>
                        <Button
                          onClick={(e) => {
                            console.log('[PromptComponent] Save to gallery button clicked');
                            handleSaveToGallery();
                          }}
                          disabled={isGenerating || !user}
                          className={`mt-2 w-full font-handlee transition-colors ${
                            isGenerating 
                              ? 'bg-muted-gray cursor-not-allowed opacity-50' 
                              : user
                              ? 'bg-purple-600 hover:bg-purple-700 text-white'
                              : 'bg-muted-gray text-gray-500 cursor-not-allowed'
                          }`}
                          style={{ backgroundColor: user ? '#C7A7E7' : undefined }}
                        >
                          {isGenerating ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Saving...
                            </div>
                          ) : user ? (
                            <div className="flex items-center justify-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                              Save to Gallery
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              Sign in to save
                            </div>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Actions */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      console.log('[PromptComponent] Close preview clicked');
                      setShowModal(false);
                    }}
                    className="flex-1 font-handlee text-gray-600 hover:text-gray-800"
                    style={{ backgroundColor: '#8A94A6', color: 'white' }}
                  >
                    Close Preview
                  </Button>
                  <Button
                    onClick={(e) => {
                      console.log('[PromptComponent] Back to edit clicked');
                      setShowModal(false);
                      document.querySelector('.min-h-96')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex-1 font-handlee bg-pastel-blue hover:bg-hover-blue text-white"
                  >
                    Back to Edit
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-handlee text-lg text-error-pink text-center">
              ⚠️ Oops! Something went wrong
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700 text-center font-handlee">
              {error || 'An unexpected error occurred. Please try again.'}
            </p>
            <Button
              onClick={(e) => {
                console.log('[PromptComponent] Error modal try again clicked');
                setShowErrorModal(false);
              }}
              className="w-full bg-error-pink hover:bg-red-600 text-white font-handlee"
            >
              Try Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(PromptComponent);