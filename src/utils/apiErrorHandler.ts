// Centralized API Error Handling Utility
import { trackError } from '../services/analytics';

// Standard error response structure from Edge Functions
export interface StandardErrorResponse {
  error: string;
  details?: string;
  code?: string;
  reason?: string;
  suggestion?: string;
}

// Custom error class for API-related errors
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: string;
  public readonly suggestion?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: string,
    suggestion?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.suggestion = suggestion;
  }
}

/**
 * Centralized API error handler for fetch responses
 * @param response - The fetch Response object
 * @param context - Additional context for error logging
 * @returns Promise that resolves if response is ok, rejects with ApiError if not
 */
export async function handleApiResponse(
  response: Response,
  context: {
    operation: string;
    url?: string;
    method?: string;
    additionalContext?: Record<string, any>;
  }
): Promise<Response> {
  if (response.ok) {
    return response;
  }

  let errorData: StandardErrorResponse;
  let errorMessage = `${context.operation} failed`;

  try {
    // Try to parse error response as JSON
    errorData = await response.json();
    errorMessage = errorData.error || errorMessage;
  } catch (parseError) {
    // If response isn't JSON, use status text or generic message
    errorMessage = response.statusText || errorMessage;
    errorData = {
      error: errorMessage,
      details: 'Failed to parse error response',
    };
  }

  // Create detailed error for logging
  const apiError = new ApiError(
    errorMessage,
    response.status,
    errorData.code,
    errorData.details,
    errorData.suggestion
  );

  // Log the error for monitoring
  trackError(apiError, {
    operation: context.operation,
    url: context.url || response.url,
    method: context.method || 'unknown',
    statusCode: response.status,
    responseHeaders: Object.fromEntries(response.headers.entries()),
    ...context.additionalContext,
  });

  throw apiError;
}

/**
 * Creates a user-friendly error message from an ApiError
 * @param error - The ApiError instance
 * @returns User-friendly error message
 */
export function getUserFriendlyErrorMessage(error: ApiError): string {
  // Map common error scenarios to user-friendly messages
  if (error.statusCode === 401) {
    return 'Please sign in to continue';
  }
  
  if (error.statusCode === 403) {
    return 'You don\'t have permission to perform this action';
  }
  
  if (error.statusCode === 404) {
    return 'The requested resource was not found';
  }
  
  if (error.statusCode === 429) {
    return 'Too many requests. Please wait a moment and try again';
  }
  
  if (error.statusCode >= 500) {
    return error.suggestion || 'A server error occurred. Please try again';
  }

  // For other errors, use the original message if it's user-friendly
  // Otherwise, provide a generic message
  return error.message || 'An unexpected error occurred';
}

/**
 * Wrapper for fetch calls that automatically handles errors
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param context - Context for error handling
 * @returns Promise<Response>
 */
export async function safeFetch(
  url: string,
  options: RequestInit = {},
  context: {
    operation: string;
    additionalContext?: Record<string, any>;
  }
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    return await handleApiResponse(response, {
      ...context,
      url,
      method: options.method || 'GET',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors or other fetch-related errors
    const networkError = new ApiError(
      'Network error occurred',
      0,
      'NETWORK_ERROR',
      error instanceof Error ? error.message : 'Unknown network error',
      'Check your internet connection and try again'
    );

    trackError(networkError, {
      operation: context.operation,
      url,
      method: options.method || 'GET',
      errorType: 'network',
      ...context.additionalContext,
    });

    throw networkError;
  }
}