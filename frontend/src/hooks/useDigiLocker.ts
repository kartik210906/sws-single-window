import { useState } from 'react';

export interface DigiLockerProfile {
  fullName: string;
  dob: string;
  gender?: string;
  address: string;
  phone?: string;
  email?: string;
  verified: boolean;
  issuedBy: string;
}

interface UseDigiLockerProps {
  onSuccess: (data: DigiLockerProfile) => void;
}

export function useDigiLocker({ onSuccess }: UseDigiLockerProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async (docType: 'aadhaar' | 'pan', docNumber: string) => {
    setLoading(true);
    setError(null);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/digilocker/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ docType, docNumber }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'DigiLocker retrieval failed.');
      }

      onSuccess(result.data);
      return result.data;
    } catch (err: any) {
      setError(err.message || 'Failed to connect to API Setu gateway.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchUserProfile,
    loading,
    error,
  };
}
