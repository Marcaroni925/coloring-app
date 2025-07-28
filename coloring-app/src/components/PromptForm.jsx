/**
 * PromptForm Component
 * 
 * Dedicated form component for coloring page generation.
 * Handles user input, validation, and form submission logic.
 * 
 * Evidence: architecture.md Section 3.2 - Form Architecture
 * Best Practice: Component separation for better maintainability
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useValidation, useResponsive } from '../hooks';
import { THEME_OPTIONS, DEFAULT_FORM_STATE } from '../utils';

/**
 * Theme option icons
 */
const AnimalIcon = () => (
  <svg className="theme-icon" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 2L3 7v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7l-7-5zM10 4.5L15 8v9H5V8l5-3.5z"/>
    <circle cx="8" cy="11" r="1"/>
    <circle cx="12" cy="11" r="1"/>
    <path d="M8 14c0 1.1 1.3 2 3 2s3-.9 3-2"/>
  </svg>
);

const MandalaIcon = () => (
  <svg className="theme-icon" fill="currentColor" viewBox="0 0 20 20">
    <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2"/>
    <circle cx="10" cy="10" r="4" fill="none" stroke="currentColor" strokeWidth="1"/>
    <circle cx="10" cy="10" r="1" fill="currentColor"/>
    <path d="M10 2v2M10 16v2M2 10h2M16 10h2M5.05 5.05l1.41 1.41M13.54 13.54l1.41 1.41M5.05 14.95l1.41-1.41M13.54 6.46l1.41-1.41"/>
  </svg>
);

const FantasyIcon = () => (
  <svg className="theme-icon" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z"/>
    <circle cx="6" cy="8" r="1"/>
    <circle cx="14" cy="8" r="1"/>
  </svg>
);

const NatureIcon = () => (
  <svg className="theme-icon" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 2C8 2 6 4 6 6c0 1 0 2 1 3-1 0-2 0-3 1-1 1-1 3 0 4 1 1 2 1 3 1-1 1-1 2-1 3 0 2 2 4 4 4s4-2 4-4c0-1 0-2-1-3 1 0 2 0 3-1 1-1 1-3 0-4-1-1-2-1-3-1 1-1 1-2 1-3 0-2-2-4-4-4z"/>
  </svg>
);

const MagicWandIcon = () => (
  <svg className="w-4 h-4 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
    <path d="M11 2L9 6l-4-2 4 6H3l8 2v4l2-6 4 2-4-6h6L11 2z"/>
  </svg>
);

const PaintbrushIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 text-green-500 ml-2" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

/**
 * PromptForm Component
 * @param {Object} props - Component props
 * @param {Function} props.onSubmit - Form submission handler
 * @param {boolean} props.isGenerating - Loading state
 * @param {Object} props.initialValues - Initial form values
 */
export const PromptForm = ({
  onSubmit,
  isGenerating = false,
  initialValues = DEFAULT_FORM_STATE
}) => {
  // Custom hooks for form logic
  const {
    values,
    errors,
    updateField,
    touchField,
    validateAll,
    isValid,
    getFieldError,
    shouldShowError
  } = useValidation(initialValues);

  const { isMobile, classes } = useResponsive();

  /**
   * Handles form submission
   * @param {Event} e - Form event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Debug validation - Evidence: architecture.md Section 3.2 Form Validation debugging
    console.log('[PromptForm] Form submission attempt:', {
      values,
      isValid,
      errors: Object.keys(errors).length > 0 ? errors : 'No errors',
      onSubmitFunction: typeof onSubmit
    });
    
    const validationResult = validateAll();
    console.log('[PromptForm] Validation result:', validationResult);
    
    if (validationResult.isValid) {
      console.log('[PromptForm] Calling onSubmit with values:', values);
      if (typeof onSubmit === 'function') {
        onSubmit(values);
      } else {
        console.error('[PromptForm] onSubmit is not a function:', onSubmit);
      }
    } else {
      console.warn('[PromptForm] Form validation failed:', validationResult.errors);
    }
  };

  /**
   * Handles accordion state for desktop expansion
   */
  const [showCustomizations, setShowCustomizations] = React.useState(!isMobile);

  // Update accordion state when viewport changes
  React.useEffect(() => {
    setShowCustomizations(!isMobile);
  }, [isMobile]);

  // Debug validation changes - Evidence: architecture.md Section 3.2 Form Validation debugging
  React.useEffect(() => {
    console.log('[PromptForm] Validation state changed:', {
      isValid,
      values,
      errors: Object.keys(errors).filter(key => errors[key] && !errors[key].isValid)
    });
  }, [isValid, values, errors]);

  return (
    <Card className={classes({
      base: "rounded-2xl shadow-md doodle-border bg-white",
      desktop: "hover-scale-desktop form-desktop-width"
    })}>
      <CardHeader>
        <CardTitle className="card-title-enhanced">
          Create Your Coloring Page
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Prompt Input - Evidence: architecture.md Section 3.2.1 Input Fields */}
          <div>
            <label className="label-enhanced">
              Describe your coloring page *
            </label>
            <div className="relative">
              <textarea
                value={values.prompt}
                onChange={(e) => updateField('prompt', e.target.value)}
                onBlur={() => touchField('prompt')}
                placeholder="e.g., unicorn in a forest"
                className={`input-enhanced w-full h-24 p-3 border-2 resize-none ${
                  shouldShowError('prompt')
                    ? 'field-invalid'
                    : values.prompt && !shouldShowError('prompt')
                    ? 'field-valid'
                    : 'border-gray-300 focus:border-pastel-blue focus:ring-pastel-blue/30'
                } focus:ring-4 focus:outline-none`}
                style={{ minHeight: '100px' }}
                aria-invalid={shouldShowError('prompt')}
                aria-describedby="prompt-error"
                aria-label="Describe your coloring page"
                disabled={isGenerating}
              />
              {values.prompt && !shouldShowError('prompt') && (
                <div className="absolute top-2 right-2">
                  <CheckIcon />
                </div>
              )}
            </div>
            {shouldShowError('prompt') ? (
              <p id="prompt-error" className="error-message">
                {getFieldError('prompt')}
              </p>
            ) : values.prompt && !shouldShowError('prompt') ? (
              <p className="success-message">
                Great description!
              </p>
            ) : null}
          </div>

          {/* Theme Dropdown - Evidence: architecture.md Section 3.2.2 Theme Selection */}
          <div>
            <label className="label-enhanced flex items-center">
              <MagicWandIcon />
              Select Theme (optional)
            </label>
            <Select 
              value={values.theme} 
              onValueChange={(value) => updateField('theme', value)}
              disabled={isGenerating}
            >
              <SelectTrigger className="select-enhanced w-full">
                <SelectValue placeholder="Choose a theme (optional)" />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center">
                      {option.value === 'animals' && <AnimalIcon />}
                      {option.value === 'mandalas' && <MandalaIcon />}
                      {option.value === 'fantasy' && <FantasyIcon />}
                      {option.value === 'nature' && <NatureIcon />}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customization Accordion - Evidence: architecture.md Section 3.2.3 Customization Options */}
          <Accordion 
            type="single" 
            collapsible 
            className="w-full"
            value={showCustomizations ? "customizations" : undefined}
            onValueChange={(value) => setShowCustomizations(!!value)}
          >
            <AccordionItem value="customizations">
              <AccordionTrigger className="font-handlee text-gray-700 hover:text-pastel-blue">
                <span className="label-enhanced mb-0">Customization Options</span>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4">
                
                {/* Complexity Selection */}
                <div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <label className="label-enhanced cursor-help">
                          Detail Complexity *
                        </label>
                      </TooltipTrigger>
                      <TooltipContent className="tooltip-custom">
                        Choose complexity level appropriate for your target audience
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <RadioGroup 
                    value={values.complexity} 
                    onValueChange={(value) => updateField('complexity', value)}
                    className="flex flex-wrap gap-3"
                    disabled={isGenerating}
                  >
                    {['simple', 'medium', 'detailed'].map(option => (
                      <div key={option} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`complexity-${option}`} className="sr-only" />
                        <label 
                          htmlFor={`complexity-${option}`} 
                          className={`radio-enhanced ${
                            values.complexity === option ? 'selected' : ''
                          }`}
                        >
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                  {!shouldShowError('complexity') && values.complexity ? (
                    <div className="success-message mt-2">
                      Perfect choice!
                    </div>
                  ) : shouldShowError('complexity') ? (
                    <p className="error-message mt-1">{getFieldError('complexity')}</p>
                  ) : null}
                </div>

                {/* Age Group Selection */}
                <div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <label className="label-enhanced cursor-help">
                          Age Group *
                        </label>
                      </TooltipTrigger>
                      <TooltipContent className="tooltip-custom">
                        Choose for kid-friendly simplicity or adult complexity
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <RadioGroup 
                    value={values.ageGroup} 
                    onValueChange={(value) => updateField('ageGroup', value)}
                    className="flex flex-wrap gap-3"
                    disabled={isGenerating}
                  >
                    {['kids', 'teens', 'adults'].map(option => (
                      <div key={option} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`age-${option}`} className="sr-only" />
                        <label 
                          htmlFor={`age-${option}`} 
                          className={`radio-enhanced ${
                            values.ageGroup === option ? 'selected' : ''
                          }`}
                        >
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                  {!shouldShowError('ageGroup') && values.ageGroup ? (
                    <div className="success-message mt-2">
                      Great selection!
                    </div>
                  ) : shouldShowError('ageGroup') ? (
                    <p className="error-message mt-1">{getFieldError('ageGroup')}</p>
                  ) : null}
                </div>

                {/* Border Checkbox */}
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="border"
                    checked={values.border}
                    onCheckedChange={(checked) => updateField('border', checked)}
                    className="checkbox-enhanced"
                    disabled={isGenerating}
                  />
                  <label htmlFor="border" className="label-enhanced mb-0 cursor-pointer">
                    With Decorative Border
                  </label>
                </div>

                {/* Line Thickness Selection */}
                <div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <label className="label-enhanced cursor-help">
                          Line Thickness *
                        </label>
                      </TooltipTrigger>
                      <TooltipContent className="tooltip-custom">
                        Thicker lines are easier for younger children to color
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Select 
                    value={values.lineThickness} 
                    onValueChange={(value) => updateField('lineThickness', value)}
                    disabled={isGenerating}
                  >
                    <SelectTrigger className={`select-enhanced w-full ${
                      !shouldShowError('lineThickness') && values.lineThickness
                        ? 'field-valid'
                        : 'border-gray-300'
                    }`}>
                      <SelectValue placeholder="Select thickness" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thin">Thin Lines (Advanced)</SelectItem>
                      <SelectItem value="medium">Medium Lines (Standard)</SelectItem>
                      <SelectItem value="thick">Thick Lines (Kid-Friendly)</SelectItem>
                    </SelectContent>
                  </Select>
                  {!shouldShowError('lineThickness') && values.lineThickness ? (
                    <div className="success-message mt-2">
                      Excellent thickness choice!
                    </div>
                  ) : shouldShowError('lineThickness') ? (
                    <p className="error-message mt-1">{getFieldError('lineThickness')}</p>
                  ) : null}
                </div>

              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Generate Button - Evidence: architecture.md Section 3.2 Form Controls */}
          <div className={classes({
            base: "pt-4 generate-button-container",
            mobile: "generate-button-mobile-fixed",
            desktop: "generate-button-desktop"
          })}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    disabled={!isValid || isGenerating}
                    size="lg"
                    variant="default"
                    className={`w-full font-handlee text-lg py-6 rounded-xl transition-all duration-200 shadow-lg hover:scale-105 ${
                      !isValid || isGenerating 
                        ? 'opacity-60 cursor-not-allowed' 
                        : isValid && !isGenerating ? 'generate-button-valid' : ''
                    }`}
                    style={{
                      minHeight: '60px',
                      display: 'block',
                      backgroundColor: isValid && !isGenerating ? '#A7C7E7' : '#8A94A6',
                      color: 'white',
                      '--tw-shadow': '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      if (isValid && !isGenerating) {
                        e.target.style.backgroundColor = '#5067C9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isValid && !isGenerating) {
                        e.target.style.backgroundColor = '#A7C7E7';
                      }
                    }}
                    aria-label="Generate coloring page"
                    title={!isValid ? "Fill required fields to generate" : "Generate coloring page"}
                    onClick={(e) => {
                      // Debug button click - Evidence: architecture.md Section 3.2 Button debugging
                      console.log('[PromptForm] Generate button clicked:', {
                        isValid,
                        isGenerating,
                        disabled: !isValid || isGenerating,
                        formValues: values,
                        event: e.type
                      });
                      
                      // Ensure button is not disabled and form is valid
                      if (!isValid) {
                        console.warn('[PromptForm] Button clicked but form is invalid');
                        e.preventDefault();
                        return false;
                      }
                      
                      if (isGenerating) {
                        console.warn('[PromptForm] Button clicked but already generating');
                        e.preventDefault();
                        return false;
                      }
                      
                      console.log('[PromptForm] Button click will proceed to form submission');
                    }}
                  >
                    {isGenerating ? (
                      <div className="flex items-center justify-center">
                        <div className="loading-spinner mr-2"></div>
                        Generating Magic...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <PaintbrushIcon />
                        Generate Coloring Page
                      </div>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="tooltip-custom">
                  Create your masterpiece!
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

        </form>
      </CardContent>
    </Card>
  );
};