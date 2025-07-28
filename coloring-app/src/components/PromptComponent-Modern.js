/**
 * Modern Professional PromptComponent - 2025 Design Redesign
 * 
 * DESIGN PRINCIPLES:
 * - Bold minimalism with clean white/gray backgrounds
 * - Deep blue accent colors for professional trust
 * - Inter font family for modern typography
 * - Bento grid layout for customization options
 * - Progressive blur effects for loading states
 * - Enhanced accessibility and mobile optimization
 * 
 * IMPROVEMENTS FROM AUDIT:
 * ✅ Fixed button clickability issues with proper hover/focus/disabled states
 * ✅ Implemented radio/toggle components via shadcn-style patterns
 * ✅ Added validation tooltips with contextual positioning
 * ✅ Enhanced mobile responsiveness with touch-friendly targets
 * ✅ Improved loading states with subtle blur effects
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useGeneration } from '../hooks/useGeneration';
import { useToastHelpers } from './ui/Toast';
import { sanitizeUserInput, validateContentSafety } from '../utils/security';
import { createErrorHandler } from '../utils/errorHandling';

/**
 * Custom Radio Group Components (shadcn-inspired)
 * Professional styling with proper accessibility
 */
const RadioGroup = ({ value, onValueChange, children, className = '', ...props }) => {
  return (
    <div
      role="radiogroup"
      className={`space-y-3 ${className}`}
      {...props}
    >
      {React.Children.map(children, (child, index) =>
        React.cloneElement(child, {
          isSelected: child.props.value === value,
          onSelect: () => onValueChange(child.props.value),
          name: props.name || 'radio-group',
          tabIndex: child.props.value === value ? 0 : -1
        })
      )}
    </div>
  );
};

const RadioGroupItem = ({ 
  value, 
  id, 
  children, 
  isSelected, 
  onSelect, 
  name,
  tabIndex,
  disabled = false,
  className = '' 
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) onSelect();
    }
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <button
        type="button"
        role="radio"
        id={id}
        aria-checked={isSelected}
        disabled={disabled}
        tabIndex={tabIndex}
        onClick={onSelect}
        onKeyDown={handleKeyDown}
        className={`
          relative w-5 h-5 rounded-full border-2 transition-all duration-200 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isSelected 
            ? 'border-blue-600 bg-blue-600' 
            : 'border-slate-300 bg-white hover:border-slate-400'
          }
        `}
      >
        {isSelected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        )}
      </button>
      <label 
        htmlFor={id}
        className={`
          text-sm font-medium cursor-pointer select-none
          ${disabled ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 hover:text-slate-900'}
        `}
      >
        {children}
      </label>
    </div>
  );
};

/**
 * Validation Tooltip Component
 * Clean, contextual error messaging
 */
const ValidationTooltip = ({ message, isVisible, children }) => {
  if (!isVisible || !message) return children;

  return (
    <div className="relative">
      {children}
      <div className="absolute top-full left-0 mt-1 z-50 animate-in fade-in-0 duration-200">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg max-w-xs">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
            </svg>
            <p className="text-sm text-red-700 font-medium">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Bento Card Component
 * Clean card design for customization options
 */
const BentoCard = ({ title, icon, children, className = '' }) => {
  return (
    <div className={`
      bg-white border border-slate-200 rounded-xl p-6 transition-all duration-200
      hover:shadow-md hover:border-slate-300 group
      ${className}
    `}>
      <div className="flex items-center space-x-3 mb-4">
        {icon && <div className="text-slate-600 group-hover:text-slate-800 transition-colors">{icon}</div>}
        <h3 className="text-lg font-semibold text-slate-800 font-inter">{title}</h3>
      </div>
      {children}
    </div>
  );
};

/**
 * Modern Professional Button Component
 * Enhanced states and accessibility
 */
const ModernButton = ({ 
  children, 
  variant = 'primary', 
  size = 'default',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...props 
}) => {
  const baseClasses = `
    inline-flex items-center justify-center rounded-xl font-semibold font-inter
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
    transform active:scale-95
  `;

  const variants = {
    primary: `
      bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:shadow-md
      focus:ring-blue-500 active:bg-blue-800
    `,
    secondary: `
      bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 
      hover:border-slate-300 focus:ring-slate-500 active:bg-slate-300
    `,
    outline: `
      bg-transparent text-blue-600 border border-blue-600 hover:bg-blue-50
      focus:ring-blue-500 active:bg-blue-100
    `
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm min-h-[36px]',
    default: 'px-6 py-3 text-base min-h-[44px]',
    lg: 'px-8 py-4 text-lg min-h-[52px]'
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <div className="w-5 h-5 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
};

/**
 * Main PromptComponent with Modern Professional Design
 */
export default function PromptComponent({ user }) {
  // Generation hook and state
  const { generateImage, isGenerating, generatedImage, error: generationError } = useGeneration();
  const toast = useToastHelpers();
  
  // Form state
  const [prompt, setPrompt] = useState('');
  const [complexity, setComplexity] = useState('detailed');
  const [ageGroup, setAgeGroup] = useState('6-8');
  const [borderStyle, setBorderStyle] = useState('simple');
  const [lineThickness, setLineThickness] = useState('medium');
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState({});
  const [showValidation, setShowValidation] = useState(false);
  
  // Refs
  const textareaRef = useRef(null);
  const generateButtonRef = useRef(null);

  // Error handler
  const handleError = createErrorHandler('PromptComponent', (error) => {
    toast.error(error.userMessage);
  });

  /**
   * Enhanced prompt validation with security checks
   */
  const validateForm = useCallback(() => {
    const errors = {};
    
    // Prompt validation
    if (!prompt.trim()) {
      errors.prompt = 'Please describe what you\'d like in your coloring page';
    } else if (prompt.trim().length < 10) {
      errors.prompt = 'Please provide a more detailed description (at least 10 characters)';
    } else if (prompt.trim().length > 500) {
      errors.prompt = 'Description is too long (maximum 500 characters)';
    } else {
      // Content safety validation
      const safetyCheck = validateContentSafety(prompt);
      if (!safetyCheck.isValid) {
        errors.prompt = safetyCheck.message;
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [prompt]);

  /**
   * Enhanced form submission with validation and error handling
   */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setShowValidation(true);
    
    try {
      // Validate form
      if (!validateForm()) {
        generateButtonRef.current?.focus();
        return;
      }

      // Sanitize input
      const sanitizedPrompt = sanitizeUserInput(prompt);
      
      // Prepare generation parameters
      const generationParams = {
        prompt: sanitizedPrompt,
        complexity,
        ageGroup,
        borderStyle,
        lineThickness,
        user: user || null
      };

      // Show loading toast
      const loadingToastId = toast.loading('Creating your coloring page...', {
        title: 'AI Magic in Progress'
      });

      // Generate image
      const result = await generateImage(generationParams);
      
      // Dismiss loading toast
      toast.dismiss(loadingToastId);
      
      if (result.success) {
        toast.success('Your coloring page is ready!', {
          title: 'Success!',
          action: {
            label: 'Download',
            onClick: () => {
              // Trigger download functionality
              const link = document.createElement('a');
              link.href = result.imageUrl;
              link.download = `coloring-page-${Date.now()}.png`;
              link.click();
            }
          }
        });
      }
      
    } catch (error) {
      handleError(error);
    }
  }, [prompt, complexity, ageGroup, borderStyle, lineThickness, user, validateForm, generateImage, toast, handleError]);

  /**
   * Auto-resize textarea functionality
   */
  const handleTextareaChange = useCallback((e) => {
    const value = e.target.value;
    setPrompt(value);
    
    // Auto-resize
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
    
    // Clear validation error when user starts typing
    if (validationErrors.prompt && value.trim().length > 0) {
      setValidationErrors(prev => ({ ...prev, prompt: undefined }));
    }
  }, [validationErrors.prompt]);

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isGenerating) {
          handleSubmit(e);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit, isGenerating]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <h3 className="text-lg font-semibold text-slate-800 font-inter mb-2">
                Creating Your Coloring Page
              </h3>
              <p className="text-sm text-slate-600">
                AI is working its magic... This usually takes 5-10 seconds.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Prompt Input */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <label htmlFor="prompt-input" className="block text-lg font-semibold text-slate-800 font-inter mb-3">
                Describe Your Coloring Page
              </label>
              <ValidationTooltip 
                message={validationErrors.prompt} 
                isVisible={showValidation}
              >
                <textarea
                  ref={textareaRef}
                  id="prompt-input"
                  value={prompt}
                  onChange={handleTextareaChange}
                  placeholder="A friendly dragon playing in a magical garden with flowers and butterflies..."
                  className={`
                    w-full min-h-[120px] max-h-[200px] p-4 rounded-xl border font-inter
                    transition-all duration-200 resize-none focus:outline-none focus:ring-2
                    placeholder:text-slate-400
                    ${validationErrors.prompt && showValidation
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-200'
                    }
                  `}
                  disabled={isGenerating}
                />
              </ValidationTooltip>
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-slate-500">
                  Tip: Be specific about what you want to see in your coloring page
                </p>
                <span className={`text-sm ${prompt.length > 450 ? 'text-red-500' : 'text-slate-400'}`}>
                  {prompt.length}/500
                </span>
              </div>
            </div>

            {/* Bento Grid - Customization Options */}
            <div>
              <h2 className="text-xl font-semibold text-slate-800 font-inter mb-6">
                Customize Your Design
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Complexity Card */}
                <BentoCard 
                  title="Complexity Level"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  }
                >
                  <RadioGroup 
                    value={complexity} 
                    onValueChange={setComplexity}
                    name="complexity"
                  >
                    <RadioGroupItem value="simple" id="complexity-simple">
                      Simple & Easy
                    </RadioGroupItem>
                    <RadioGroupItem value="detailed" id="complexity-detailed">
                      Detailed & Fun
                    </RadioGroupItem>
                    <RadioGroupItem value="intricate" id="complexity-intricate">
                      Very Detailed
                    </RadioGroupItem>
                  </RadioGroup>
                </BentoCard>

                {/* Age Group Card */}
                <BentoCard 
                  title="Perfect For"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  }
                >
                  <RadioGroup 
                    value={ageGroup} 
                    onValueChange={setAgeGroup}
                    name="ageGroup"
                  >
                    <RadioGroupItem value="3-5" id="age-preschool">
                      Ages 3-5 (Preschool)
                    </RadioGroupItem>
                    <RadioGroupItem value="6-8" id="age-school">
                      Ages 6-8 (School Age)
                    </RadioGroupItem>
                    <RadioGroupItem value="9-12" id="age-tween">
                      Ages 9-12 (Tweens)
                    </RadioGroupItem>
                    <RadioGroupItem value="teen-adult" id="age-teen">
                      Teen & Adult
                    </RadioGroupItem>
                  </RadioGroup>
                </BentoCard>

                {/* Border Style Card */}
                <BentoCard 
                  title="Border Style"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                  }
                >
                  <RadioGroup 
                    value={borderStyle} 
                    onValueChange={setBorderStyle}
                    name="borderStyle"
                  >
                    <RadioGroupItem value="none" id="border-none">
                      No Border
                    </RadioGroupItem>
                    <RadioGroupItem value="simple" id="border-simple">
                      Simple Border
                    </RadioGroupItem>
                    <RadioGroupItem value="decorative" id="border-decorative">
                      Decorative Border
                    </RadioGroupItem>
                  </RadioGroup>
                </BentoCard>

                {/* Line Thickness Card */}
                <BentoCard 
                  title="Line Thickness"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  }
                >
                  <RadioGroup 
                    value={lineThickness} 
                    onValueChange={setLineThickness}
                    name="lineThickness"
                  >
                    <RadioGroupItem value="thin" id="thickness-thin">
                      Thin Lines
                    </RadioGroupItem>
                    <RadioGroupItem value="medium" id="thickness-medium">
                      Medium Lines
                    </RadioGroupItem>
                    <RadioGroupItem value="thick" id="thickness-thick">
                      Thick Lines
                    </RadioGroupItem>
                  </RadioGroup>
                </BentoCard>

              </div>
            </div>
          </div>

          {/* Right Column - Preview Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 font-inter mb-4">
                  Preview
                </h3>
                
                {generatedImage ? (
                  <div className="space-y-4">
                    <div className="relative group cursor-pointer">
                      <img 
                        src={generatedImage} 
                        alt="Generated coloring page"
                        className="w-full h-auto rounded-lg border border-slate-200 transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                          <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <ModernButton variant="primary" size="default">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download PNG
                      </ModernButton>
                      
                      {user && (
                        <ModernButton variant="outline" size="default">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          Save to Gallery
                        </ModernButton>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-slate-500 text-sm font-inter">
                      Your coloring page will appear here once generated
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="text-center pt-6 border-t border-slate-200">
          <ModernButton
            ref={generateButtonRef}
            type="submit"
            variant="primary"
            size="lg"
            loading={isGenerating}
            disabled={isGenerating || !prompt.trim()}
            className="min-w-[240px]"
          >
            {isGenerating ? 'Creating Magic...' : 'Generate Coloring Page'}
          </ModernButton>
          
          <p className="text-sm text-slate-500 mt-3 font-inter">
            Press <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">Ctrl+Enter</kbd> to generate quickly
          </p>
        </div>
      </form>
    </div>
  );
}