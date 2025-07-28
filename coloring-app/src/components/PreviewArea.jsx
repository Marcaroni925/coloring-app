/**
 * PreviewArea Component
 * 
 * Dedicated component for displaying generated coloring page images.
 * Handles image display, zoom functionality, and success animations.
 * 
 * Evidence: architecture.md Section 3.3 - Preview Display
 * Best Practice: Component separation for better maintainability
 */

import React from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useResponsive } from '../hooks';

/**
 * PreviewArea Component
 * @param {Object} props - Component props
 * @param {string|null} props.imageUrl - Generated image URL
 * @param {boolean} props.isGenerating - Loading state
 * @param {string} props.refinedPrompt - AI-refined prompt text
 * @param {Object} props.formData - Original form data for context
 */
export const PreviewArea = ({
  imageUrl = null,
  isGenerating = false,
  refinedPrompt = '',
  formData = {}
}) => {
  const { classes } = useResponsive();

  return (
    <Card className={classes({
      base: "min-h-96 bg-white doodle-border",
      desktop: "preview-desktop-height"
    })}>
      <CardHeader>
        <CardTitle className="card-title-enhanced">
          {imageUrl ? '🎉 Your Masterpiece' : '🎨 Preview Area'}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        {imageUrl ? (
          <GeneratedImageDisplay 
            imageUrl={imageUrl}
            refinedPrompt={refinedPrompt}
            formData={formData}
          />
        ) : (
          <PreviewPlaceholder isGenerating={isGenerating} />
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Generated Image Display with zoom functionality
 */
const GeneratedImageDisplay = ({ imageUrl, refinedPrompt, formData }) => {
  return (
    <div className="animate-fade-in relative celebrate-success">
      {/* Zoomable Image Container */}
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={3}
        centerOnInit={true}
      >
        <TransformComponent
          wrapperClass="w-full h-80 rounded-lg overflow-hidden"
          contentClass="flex items-center justify-center"
        >
          <img
            src={imageUrl}
            alt="Generated coloring page"
            className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
            aria-label="Generated coloring book page preview"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </TransformComponent>
      </TransformWrapper>

      {/* Success Confetti Animation - Evidence: architecture.md Section 2.3 Animations */}
      <div className="confetti-animation">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="confetti-particle"></div>
        ))}
      </div>

      {/* Zoom Instructions */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 font-handlee">
          ✨ Use mouse wheel or pinch to zoom ✨
        </p>
      </div>

      {/* Image Metadata Display */}
      {(refinedPrompt || Object.keys(formData).length > 0) && (
        <ImageMetadata 
          refinedPrompt={refinedPrompt}
          formData={formData}
        />
      )}
    </div>
  );
};

/**
 * Preview Placeholder for empty state
 */
const PreviewPlaceholder = ({ isGenerating }) => {
  return (
    <div className="preview-placeholder">
      <div className={`emoji ${isGenerating ? 'animate-spin' : ''}`}>
        {isGenerating ? '⏳' : '🎨'}
      </div>
      <p className="main-text">
        {isGenerating 
          ? 'Creating your magical coloring page...' 
          : 'Your magical coloring page will appear here'
        }
      </p>
      {!isGenerating && (
        <p className="sub-text">
          Fill out the form and click generate!
        </p>
      )}
      
      {/* Loading Progress Indicator */}
      {isGenerating && (
        <div className="mt-4 w-full max-w-xs mx-auto">
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-pastel-blue h-full rounded-full transition-all duration-1000 animate-pulse"
              style={{ width: '70%' }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2 font-handlee">
            AI is working its magic...
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Image Metadata Display Component
 */
const ImageMetadata = ({ refinedPrompt, formData }) => {
  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h4 className="font-handlee font-semibold text-gray-700 mb-3">
        Generation Details
      </h4>
      
      <div className="space-y-2 text-sm">
        {/* Original Prompt */}
        {formData.prompt && (
          <div>
            <span className="font-handlee font-medium text-gray-600">
              Your Description:
            </span>
            <p className="italic font-handlee text-gray-800 mt-1">
              "{formData.prompt}"
            </p>
          </div>
        )}
        
        {/* AI-Enhanced Prompt */}
        {refinedPrompt && refinedPrompt !== formData.prompt && (
          <div>
            <span className="font-handlee font-medium text-gray-600">
              AI Enhancement:
            </span>
            <p className="text-xs text-gray-500 font-handlee mt-1" title={refinedPrompt}>
              {refinedPrompt.length > 150 
                ? refinedPrompt.substring(0, 150) + '...' 
                : refinedPrompt
              }
            </p>
          </div>
        )}
        
        {/* Generation Settings Tags */}
        <div className="flex flex-wrap gap-2 mt-3">
          {formData.complexity && (
            <span className="inline-block bg-pastel-blue/20 text-pastel-blue text-xs px-2 py-1 rounded-full font-handlee">
              {formData.complexity} complexity
            </span>
          )}
          {formData.ageGroup && (
            <span className="inline-block bg-pastel-green/20 text-green-800 text-xs px-2 py-1 rounded-full font-handlee">
              {formData.ageGroup} style
            </span>
          )}
          {formData.lineThickness && (
            <span className="inline-block bg-pastel-purple/20 text-purple-800 text-xs px-2 py-1 rounded-full font-handlee">
              {formData.lineThickness} lines
            </span>
          )}
          {formData.theme && (
            <span className="inline-block bg-accent-pink/20 text-pink-800 text-xs px-2 py-1 rounded-full font-handlee">
              {formData.theme} theme
            </span>
          )}
          {formData.border && (
            <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-handlee">
              with border
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Export individual components for flexible usage
 */
export { GeneratedImageDisplay, PreviewPlaceholder, ImageMetadata };