'use client';

import React, { useState } from 'react';
import { FormSchema, Field } from '../../types/form';
import { FieldRenderer } from './FieldRenderer';

interface DynamicFormProps {
  schema: FormSchema;
  apiEndpoint: string;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({ schema, apiEndpoint }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmittedSuccessfully, setIsSubmittedSuccessfully] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const sections = schema.sections;
  const currentSection = sections[currentStep];

  // Client-side validator for a single field configuration
  const validateField = (field: Field, value: any): string | null => {
    const isRequired = field.validation?.required;
    const isValueEmpty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);

    if (isRequired && isValueEmpty) {
      return 'This field is required.';
    }

    if (!isValueEmpty) {
      if (field.type === 'number') {
        const num = Number(value);
        if (isNaN(num)) return 'Must be a valid number.';
        if (field.validation?.min !== undefined && num < field.validation.min) {
          return `Minimum value is ${field.validation.min}.`;
        }
        if (field.validation?.max !== undefined && num > field.validation.max) {
          return `Maximum value is ${field.validation.max}.`;
        }
      }

      if (field.type === 'text' || field.type === 'textarea') {
        if (field.validation?.min !== undefined && value.length < field.validation.min) {
          return `Must be at least ${field.validation.min} characters.`;
        }
        if (field.validation?.max !== undefined && value.length > field.validation.max) {
          return `Must not exceed ${field.validation.max} characters.`;
        }
      }

      if (field.validation?.pattern) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value)) {
          return field.validation.customMessage || 'Invalid input format.';
        }
      }

      if (field.type === 'file' && value instanceof File) {
        const reqs = field.fileRequirements;
        if (reqs) {
          const fileSizeMb = value.size / (1024 * 1024);
          if (fileSizeMb > reqs.maxSizeInMb) {
            return `File size limits exceeded (max ${reqs.maxSizeInMb}MB).`;
          }
          if (reqs.allowedTypes.length > 0 && !reqs.allowedTypes.includes(value.type)) {
            return `Unsupported file format. Please upload: ${reqs.allowedTypes.join(', ')}`;
          }
        }
      }
    }

    return null;
  };

  // Validate only the fields present in the current section step
  const validateCurrentSection = (): boolean => {
    const stepErrors: Record<string, string> = {};
    currentSection.fields.forEach((field) => {
      const error = validateField(field, formValues[field.fieldId]);
      if (error) {
        stepErrors[field.fieldId] = error;
      }
    });

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentSection()) {
      setCurrentStep((prev) => Math.min(prev + 1, sections.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleFieldValueChange = (fieldId: string, val: any) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: val }));
    // Clear validation error dynamically on user interaction
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentSection()) return;

    setIsSubmitting(true);
    setSubmissionError(null);

    // Build standard multi-part payload
    const formData = new FormData();
    
    // Add default test userId
    formData.append('userId', 'sih_user_test_99');

    // Append responses correctly
    Object.entries(formValues).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value); // Files
      } else if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value)); // Checkbox values stringified
      } else if (value !== null && value !== undefined) {
        formData.append(key, value.toString()); // Text/Number/Dates
      }
    });

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          // Bind server-side validation error reports directly back onto the inputs
          setErrors(result.errors);
          throw new Error(result.message || 'Server validation failed.');
        }
        throw new Error(result.message || 'Submission failed.');
      }

      setIsSubmittedSuccessfully(true);
    } catch (err: any) {
      setSubmissionError(err.message || 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmittedSuccessfully) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-8 bg-white border border-green-200 rounded-2xl shadow-lg text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Submitted!</h2>
        <p className="text-gray-600 mb-6">
          Your compliance approvals are currently processing. We will notify you on updates.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
      {/* Title Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-8 py-6 text-white">
        <h1 className="text-2xl font-bold">{schema.title}</h1>
        {schema.description && <p className="text-blue-100 mt-1 text-sm">{schema.description}</p>}
      </div>

      {/* Dynamic Section Stepper Progress Bar */}
      <div className="px-8 py-4 bg-gray-50 border-b border-gray-150 flex items-center space-x-2 overflow-x-auto">
        {sections.map((sec, idx) => (
          <div key={sec.sectionId} className="flex items-center space-x-2 flex-shrink-0">
            <span
              className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold ${
                idx === currentStep
                  ? 'bg-blue-600 text-white'
                  : idx < currentStep
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {idx < currentStep ? '✓' : idx + 1}
            </span>
            <span
              className={`text-xs font-medium ${
                idx === currentStep ? 'text-blue-700 font-bold' : 'text-gray-500'
              }`}
            >
              {sec.title}
            </span>
            {idx < sections.length - 1 && <span className="text-gray-300">/</span>}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-8">
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">{currentSection.title}</h2>
          {currentSection.description && (
            <p className="text-sm text-gray-500 mb-6">{currentSection.description}</p>
          )}

          {/* Grid Layout Engine */}
          <div className="grid grid-cols-12 gap-x-6 gap-y-2">
            {currentSection.fields.map((field) => {
              const gridSpan = field.layout?.gridCols || 12;
              
              // Tailwind grid spans mapping
              const gridSpanClass = {
                3: 'col-span-12 md:col-span-3',
                4: 'col-span-12 md:col-span-4',
                6: 'col-span-12 md:col-span-6',
                8: 'col-span-12 md:col-span-8',
                12: 'col-span-12',
              }[gridSpan] || 'col-span-12';

              return (
                <div key={field.fieldId} className={gridSpanClass}>
                  <FieldRenderer
                    field={field}
                    value={formValues[field.fieldId]}
                    onChange={(val) => handleFieldValueChange(field.fieldId, val)}
                    error={errors[field.fieldId]}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {submissionError && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-lg">
            {submissionError}
          </div>
        )}

        {/* Stepper Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-150">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
            className={`px-5 py-2 rounded-lg text-sm font-semibold border transition ${
              currentStep === 0
                ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Back
          </button>

          {currentStep < sections.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md transition"
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold shadow-md transition flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Application</span>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
