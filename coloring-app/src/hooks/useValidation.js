/**
 * useValidation Hook
 * 
 * Custom React hook for form validation logic.
 * Provides real-time validation, error management, and form state tracking.
 * 
 * Evidence: architecture.md Section 3.2 Form Validation
 * Best Practice: Separation of concerns - business logic in custom hooks
 */

import { useState, useCallback, useMemo } from 'react';
import { validateField, validateForm, VALIDATION_CONFIG } from '../utils';

/**
 * Custom hook for form validation
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationConfig - Validation configuration (optional)
 * @returns {Object} Validation state and methods
 */
export const useValidation = (initialValues = {}, validationConfig = VALIDATION_CONFIG) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  /**
   * Validates a single field and updates error state
   * @param {string} fieldName - Name of the field to validate
   * @param {any} value - Value to validate
   */
  const validateSingleField = useCallback((fieldName, value) => {
    const result = validateField(fieldName, value, validationConfig);
    
    setErrors(prev => ({
      ...prev,
      [fieldName]: result.isValid ? undefined : result
    }));
    
    return result;
  }, [validationConfig]);

  /**
   * Updates a field value and triggers validation
   * @param {string} fieldName - Name of the field to update
   * @param {any} value - New value
   */
  const updateField = useCallback((fieldName, value) => {
    setValues(prev => {
      const newValues = { ...prev, [fieldName]: value };
      
      // Mark field as touched
      setTouched(prevTouched => ({ ...prevTouched, [fieldName]: true }));
      
      // Mark form as dirty
      setIsDirty(true);
      
      // Validate the field if it has been touched
      if (touched[fieldName] || value !== initialValues[fieldName]) {
        validateSingleField(fieldName, value);
      }
      
      return newValues;
    });
  }, [touched, initialValues, validateSingleField]);

  /**
   * Updates multiple field values at once
   * @param {Object} newValues - Object with field names and values
   */
  const updateMultipleFields = useCallback((newValues) => {
    setValues(prev => {
      const updatedValues = { ...prev, ...newValues };
      
      // Mark all updated fields as touched
      const updatedFields = Object.keys(newValues);
      setTouched(prevTouched => ({
        ...prevTouched,
        ...updatedFields.reduce((acc, field) => ({ ...acc, [field]: true }), {})
      }));
      
      setIsDirty(true);
      
      // Validate all updated fields
      const newErrors = { ...errors };
      updatedFields.forEach(fieldName => {
        const result = validateSingleField(fieldName, newValues[fieldName]);
        newErrors[fieldName] = result.isValid ? undefined : result;
      });
      setErrors(newErrors);
      
      return updatedValues;
    });
  }, [errors, validateSingleField]);

  /**
   * Marks a field as touched (for blur events)
   * @param {string} fieldName - Name of the field
   */
  const touchField = useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    // Validate the field when it's touched
    const currentValue = values[fieldName];
    validateSingleField(fieldName, currentValue);
  }, [values, validateSingleField]);

  /**
   * Validates the entire form
   * @returns {Object} Validation result
   */
  const validateAll = useCallback(() => {
    const result = validateForm(values, validationConfig);
    
    // Mark all fields as touched
    const allFields = Object.keys(validationConfig);
    setTouched(allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));
    
    // Update errors
    setErrors(result.errors);
    
    return result;
  }, [values, validationConfig]);

  /**
   * Resets the form to initial state
   */
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsDirty(false);
  }, [initialValues]);

  /**
   * Resets only the errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Sets form values without triggering validation
   * @param {Object} newValues - New form values
   */
  const setFormValues = useCallback((newValues) => {
    setValues(newValues);
    setIsDirty(true);
  }, []);

  // Computed properties
  const isValid = useMemo(() => {
    return Object.keys(errors).every(key => !errors[key] || errors[key].isValid);
  }, [errors]);

  const hasErrors = useMemo(() => {
    return Object.keys(errors).some(key => errors[key] && !errors[key].isValid);
  }, [errors]);

  const touchedFields = useMemo(() => {
    return Object.keys(touched).filter(key => touched[key]);
  }, [touched]);

  const dirtyFields = useMemo(() => {
    return Object.keys(values).filter(key => values[key] !== initialValues[key]);
  }, [values, initialValues]);

  /**
   * Gets error message for a specific field
   * @param {string} fieldName - Name of the field
   * @returns {string|null} Error message or null
   */
  const getFieldError = useCallback((fieldName) => {
    const error = errors[fieldName];
    return error && !error.isValid && touched[fieldName] ? error.message : null;
  }, [errors, touched]);

  /**
   * Checks if a specific field is valid
   * @param {string} fieldName - Name of the field
   * @returns {boolean} True if field is valid
   */
  const isFieldValid = useCallback((fieldName) => {
    const error = errors[fieldName];
    return !error || error.isValid;
  }, [errors]);

  /**
   * Checks if a field should show error state
   * @param {string} fieldName - Name of the field
   * @returns {boolean} True if should show error
   */
  const shouldShowError = useCallback((fieldName) => {
    return touched[fieldName] && !isFieldValid(fieldName);
  }, [touched, isFieldValid]);

  return {
    // Form state
    values,
    errors,
    touched,
    isDirty,
    isValid,
    hasErrors,
    touchedFields,
    dirtyFields,
    
    // Actions
    updateField,
    updateMultipleFields,
    touchField,
    validateAll,
    validateSingleField,
    reset,
    clearErrors,
    setFormValues,
    
    // Helpers
    getFieldError,
    isFieldValid,
    shouldShowError,
    
    // For debugging (development only)
    ...(process.env.NODE_ENV === 'development' && {
      _debug: {
        validationConfig,
        initialValues,
        currentState: { values, errors, touched, isDirty, isValid }
      }
    })
  };
};