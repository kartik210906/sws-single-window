// frontend/src/utils/aiValidation.ts

export interface KeywordMatch {
  passed: boolean;
  score: number;
  matched_text: string | null;
}

export interface NameMatch {
  verified: boolean;
  score: number;
  matched_segment: string | null;
  error: string | null;
}

export interface AIValidationResult {
  is_valid: boolean;
  keyword_validation: Record<string, KeywordMatch>;
  name_validation: NameMatch;
  summary: string;
  extracted_text_preview: string;
}

/**
 * Uploads a document (PDF or image) to the FastAPI AI microservice for compliance validation.
 * 
 * @param file The file object captured from input or drag-and-drop elements.
 * @param requiredKeywords String list of target words (e.g., ["Signature", "Aadhaar", "Stamp"]).
 * @param applicantName Optional name string to check matching presence.
 * @returns The structured AI Validation result response from the backend.
 */
export async function runAIDocumentPreValidation(
  file: File,
  requiredKeywords: string[],
  applicantName?: string
): Promise<AIValidationResult> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';
  const requestUrl = `${apiBaseUrl}/api/validate-document`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('required_keywords', JSON.stringify(requiredKeywords));

  if (applicantName) {
    formData.append('applicant_name', applicantName);
  }

  const response = await fetch(requestUrl, {
    method: 'POST',
    body: formData,
    // Note: Do not set Content-Type header manually. Fetch automatically configures
    // boundary details when handling a FormData body.
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.detail || `AI pre-validation failed with HTTP status ${response.status}`
    );
  }

  const data: AIValidationResult = await response.json();
  return data;
}
