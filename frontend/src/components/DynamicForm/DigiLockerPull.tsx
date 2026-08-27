'use client';

import React, { useState } from 'react';
import { useDigiLocker, DigiLockerProfile } from '../../hooks/useDigiLocker';

interface DigiLockerPullProps {
  onPopulate: (mappedData: Record<string, string>) => void;
  // Allows mapping API Setu keys to target form field IDs dynamically
  fieldMapping?: {
    fullName?: string;
    dob?: string;
    address?: string;
    email?: string;
    phone?: string;
  };
}

export const DigiLockerPull: React.FC<DigiLockerPullProps> = ({
  onPopulate,
  fieldMapping = {
    fullName: 'applicantName',
    dob: 'dateOfBirth',
    address: 'residentialAddress',
    email: 'emailAddress',
    phone: 'contactNumber'
  }
}) => {
  const [docType, setDocType] = useState<'aadhaar' | 'pan'>('aadhaar');
  const [docNumber, setDocNumber] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);

  const handleFetchSuccess = (profile: DigiLockerProfile) => {
    // Map the government registry keys to the dynamic form fieldIds
    const mappedValues: Record<string, string> = {};
    
    if (profile.fullName && fieldMapping.fullName) {
      mappedValues[fieldMapping.fullName] = profile.fullName;
    }
    if (profile.dob && fieldMapping.dob) {
      mappedValues[fieldMapping.dob] = profile.dob;
    }
    if (profile.address && fieldMapping.address) {
      mappedValues[fieldMapping.address] = profile.address;
    }
    if (profile.email && fieldMapping.email) {
      mappedValues[fieldMapping.email] = profile.email;
    }
    if (profile.phone && fieldMapping.phone) {
      mappedValues[fieldMapping.phone] = profile.phone;
    }

    onPopulate(mappedValues);
  };

  const { fetchUserProfile, loading, error } = useDigiLocker({
    onSuccess: handleFetchSuccess,
  });

  const handlePull = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);

    // Basic format validation before calling API
    const cleanedNum = docNumber.trim().replace(/\s+/g, '');
    if (!cleanedNum) {
      setInputError('Document number is required.');
      return;
    }

    if (docType === 'aadhaar' && !/^\d{12}$/.test(cleanedNum)) {
      setInputError('Aadhaar number must be exactly 12 digits.');
      return;
    }

    if (docType === 'pan' && !/^[A-Z]{5}\d{4}[A-Z]{1}$/i.test(cleanedNum)) {
      setInputError('PAN number must follow standard alphanumeric structure (e.g. ABCDE1234F).');
      return;
    }

    try {
      await fetchUserProfile(docType, cleanedNum);
    } catch (err) {
      // Error handled by hook state
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="bg-blue-600 text-white p-2 rounded-lg font-bold text-xs uppercase tracking-wider">
          DigiLocker
        </div>
        <h3 className="text-sm font-bold text-blue-900">
          Auto-populate with API Setu Integration
        </h3>
      </div>
      
      <form onSubmit={handlePull} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-blue-800 mb-1">
              Document Type
            </label>
            <select
              value={docType}
              onChange={(e) => {
                setDocType(e.target.value as 'aadhaar' | 'pan');
                setDocNumber('');
                setInputError(null);
              }}
              className="w-full bg-white border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            >
              <option value="aadhaar">Aadhaar Card</option>
              <option value="pan">PAN Card</option>
            </select>
          </div>

          <div className="md:col-span-6">
            <label className="block text-xs font-semibold text-blue-800 mb-1 text-left">
              {docType === 'aadhaar' ? 'Aadhaar Number (12 digits)' : 'PAN Number (10 alphanumeric characters)'}
            </label>
            <input
              type="text"
              value={docNumber}
              placeholder={docType === 'aadhaar' ? '1234 5678 9012' : 'ABCDE1234F'}
              onChange={(e) => {
                setDocNumber(e.target.value);
                if (inputError) setInputError(null);
              }}
              className="w-full bg-white border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center space-x-2 shadow disabled:bg-blue-400"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Fetching...</span>
                </>
              ) : (
                <span>Fetch Profile</span>
              )}
            </button>
          </div>
        </div>

        {inputError && (
          <p className="text-xs text-red-600 font-medium mt-1">{inputError}</p>
        )}
        
        {error && (
          <p className="text-xs text-red-600 font-medium mt-1">{error}</p>
        )}
      </form>
    </div>
  );
};
