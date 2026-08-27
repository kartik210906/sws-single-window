'use client';

import React from 'react';
import { Field } from '../../types/form';

interface FieldRendererProps {
  field: Field;
  value: any;
  onChange: (val: any) => void;
  error?: string;
}

export const FieldRenderer: React.FC<FieldRendererProps> = ({ field, value, onChange, error }) => {
  const baseInputStyle = `w-full px-4 py-2 border rounded-lg shadow-sm transition duration-150 ease-in-out focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
    error ? 'border-red-500 bg-red-50' : 'border-gray-300'
  }`;

  const renderInput = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'date':
      case 'number':
        return (
          <input
            type={field.type}
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputStyle}
          />
        );

      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder}
            value={value || ''}
            rows={4}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputStyle}
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputStyle}
          >
            <option value="">Choose an option...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2 mt-2">
            {field.options?.map((opt) => (
              <label key={opt.value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={field.fieldId}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={() => onChange(opt.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-gray-700 text-sm font-medium">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox': {
        const currentSelection: string[] = Array.isArray(value) ? value : [];
        const handleCheckChange = (optValue: string, checked: boolean) => {
          if (checked) {
            onChange([...currentSelection, optValue]);
          } else {
            onChange(currentSelection.filter((v) => v !== optValue));
          }
        };

        return (
          <div className="space-y-2 mt-2">
            {field.options?.map((opt) => (
              <label key={opt.value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={currentSelection.includes(opt.value)}
                  onChange={(e) => handleCheckChange(opt.value, e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
                <span className="text-gray-700 text-sm font-medium">{opt.label}</span>
              </label>
            ))}
          </div>
        );
      }

      case 'file': {
        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          if (e.target.files && e.target.files.length > 0) {
            onChange(e.target.files[0]);
          }
        };

        return (
          <div className="mt-1">
            <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-500 transition duration-150">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h16l12-12V12a4 4 0 00-4-4zm-4 18v-8h-8v8H12L24 38l12-12h-8z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Upload a file</span>
                    <input
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      accept={field.fileRequirements?.allowedTypes.join(',')}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  Max size: {field.fileRequirements?.maxSizeInMb || 5}MB. Allowed: {field.fileRequirements?.allowedTypes.map(t => t.split('/')[1]).join(', ').toUpperCase()}
                </p>
                {value && (
                  <div className="mt-2 text-sm text-green-600 font-semibold truncate max-w-xs mx-auto">
                    Selected: {value.name || 'document_uploaded'}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-gray-800 mb-1">
        {field.label}
        {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
};
