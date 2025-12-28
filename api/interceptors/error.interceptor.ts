/**
 * Error Interceptor
 * Transforms API errors to consistent format with logging
 */

import type { AxiosError } from 'axios';
import { safeError } from '../../utils/logSanitizer';

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  status: number;
  requestId?: string;
}

export function errorInterceptor(error: AxiosError<any>): Promise<never> {
  const requestId = error.config?.headers?.['X-Request-ID'] as string | undefined;
  const apiError = error.response?.data;

  // Log error for debugging
  if (__DEV__) {
    safeError('[API Error]', {
      url: error.config?.url,
      status: error.response?.status,
      code: apiError?.code,
      message: apiError?.message,
      requestId,
    });
  }

  // Network error (no response)
  if (!error.response) {
    return Promise.reject({
      code: 'NETWORK_ERROR',
      message: 'Network error. Please check your connection.',
      status: 0,
      requestId,
    } as ApiErrorResponse);
  }

  const status = error.response.status;

  // Backend error with code and message
  if (apiError?.code && apiError?.message) {
    return Promise.reject({
      code: apiError.code,
      message: apiError.message,
      details: apiError.details,
      status,
      requestId: apiError.requestId || requestId,
    } as ApiErrorResponse);
  }

  // Legacy error format
  if (apiError?.error) {
    return Promise.reject({
      code: apiError.error.code || `HTTP_${status}`,
      message: apiError.error.message || getDefaultMessage(status),
      details: apiError.error.details,
      status,
      requestId,
    } as ApiErrorResponse);
  }

  // Fallback error
  return Promise.reject({
    code: `HTTP_${status}`,
    message: apiError?.message || getDefaultMessage(status),
    status,
    requestId,
  } as ApiErrorResponse);
}

function getDefaultMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'Authentication required. Please log in.',
    403: 'Access denied. You do not have permission.',
    404: 'Resource not found.',
    429: 'Too many requests. Please try again later.',
    500: 'Server error. Please try again later.',
  };
  return messages[status] || `Request failed with status ${status}`;
}
