import React from 'react';
import { FormSchema } from '../../../types/form';
import { DynamicForm } from '../../../components/DynamicForm/DynamicForm';

interface FormPageProps {
  params: {
    formId: string;
  };
}

// Next.js Server Component fetching the dynamic JSON schema
export default async function FormPage({ params }: FormPageProps) {
  const { formId } = params;

  // Let API_BASE_URL fall back to localhost if not specified in environment
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const schemaEndpoint = `${apiBaseUrl}/api/forms/${formId}/schema`;
  const submitEndpoint = `${apiBaseUrl}/api/forms/${formId}/submit`;

  let schema: FormSchema | null = null;
  let errorMsg: string | null = null;

  try {
    const res = await fetch(schemaEndpoint, { 
      cache: 'no-store' // Keep fetching fresh schema structures
    });

    if (!res.ok) {
      throw new Error(`Failed to load form config. Status code: ${res.status}`);
    }

    const payload = await res.json();
    schema = payload.data;
  } catch (err: any) {
    errorMsg = err.message || 'Error occurred connecting to backend.';
  }

  if (errorMsg || !schema) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-6 border border-red-200 rounded-xl shadow-md text-center">
          <div className="text-red-500 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Failed to Load Form</h3>
          <p className="text-sm text-gray-500">{errorMsg || 'Form config is empty.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <DynamicForm schema={schema} apiEndpoint={submitEndpoint} />
    </div>
  );
}
