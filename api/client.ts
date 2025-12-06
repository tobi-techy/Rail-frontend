/**
 * API Client Configuration
 * Base Axios instance with interceptors, authentication, and error handling
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios';
import type { ApiError, ApiResponse } from './types';
import { safeLog, safeError } from '../utils/logSanitizer';
import { API_CONFIG } from './config';

/**
 * Custom Axios instance type that returns unwrapped data
 * Our response interceptor returns response.data directly
 */
interface ApiClient extends Omit<AxiosInstance, 'get' | 'post' | 'put' | 'patch' | 'delete'> {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

/**
 * Create base axios instance
 * Cast to ApiClient type since our interceptor unwraps responses
 */
const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
}) as ApiClient;

/**
 * Request interceptor
 * - Adds authentication token to requests
 * - Updates last activity timestamp for session tracking
 * - Logs requests in development
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get auth token from store - lazy import to break circular dependency
    const { useAuthStore } = require('../stores/authStore');
    const { accessToken, isAuthenticated, updateLastActivity } = useAuthStore.getState();

    // Add authorization header if token exists
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else if (__DEV__ && isAuthenticated) {
      // Warn if authenticated but no token (should not happen)
      safeLog('[API Client] User is authenticated but no accessToken found for', config.url);
      const fullState = useAuthStore.getState();
      safeLog('[API Client] Full auth state:', {
        hasUser: !!fullState.user,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!fullState.refreshToken,
        isAuthenticated: fullState.isAuthenticated,
        lastActivityAt: fullState.lastActivityAt,
      });
    }

    // Update last activity for authenticated requests
    // This tracks user activity and prevents session timeout while user is active
    if (isAuthenticated) {
      updateLastActivity();
    }

    // Log request in development (removed for production)

    return config;
  },
  (error: AxiosError) => {
    safeError('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * - Handles token refresh on 401
 * - Returns response data directly for successful responses
 * - Handles errors globally with consistent error structure
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development (removed for production)

    // Return the data directly for successful responses
    // The backend returns data directly without wrapping in { data: ... }
    return response.data;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

    // Handle 429 Rate Limiting with retry-after
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const retryCount = originalRequest._retryCount || 0;
      
      if (retryCount < 3 && retryAfter) {
        originalRequest._retryCount = retryCount + 1;
        const delay = parseInt(retryAfter, 10) * 1000 || 5000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return axios.request(originalRequest);
      }
    }

    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry for auth endpoints, refresh endpoint, or passcode verification
      const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
                             originalRequest.url?.includes('/auth/register') ||
                             originalRequest.url?.includes('/auth/verify-code') ||
                             originalRequest.url?.includes('/auth/refresh') ||
                             originalRequest.url?.includes('/security/passcode/verify');
      
      if (!isAuthEndpoint) {
        originalRequest._retry = true;

        try {
          // Attempt to refresh token - lazy import to break circular dependency
          const { useAuthStore } = require('../stores/authStore');
          const { refreshSession, isAuthenticated, refreshToken } = useAuthStore.getState();
          
          // Only try refresh if we have a refresh token
          if (isAuthenticated && refreshToken) {
            await refreshSession();

            // Retry original request with new token
            const newAccessToken = useAuthStore.getState().accessToken;
            if (originalRequest.headers && newAccessToken) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return axios.request(originalRequest);
            }
          } else {
            safeLog('[API Client] No refresh token available, cannot refresh session');
            // No refresh token means full re-authentication is needed
            return Promise.reject(error);
          }
        } catch (refreshError) {
          // Refresh failed, clear auth state
          safeLog('[API Client] Token refresh failed, clearing session');
          const { useAuthStore } = require('../stores/authStore');
          const { reset } = useAuthStore.getState();
          reset();
          return Promise.reject(refreshError);
        }
      }
    }

    // Log error in development
    if (__DEV__) {
      safeError('[API Error]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    }

    // Transform error for consistent handling
    return Promise.reject(transformError(error));
  }
);

/**
 * Transform axios error to application error
 * Handles both new error format (with code/message) and legacy formats
 */
function transformError(error: AxiosError<any>): ApiError {
  // Network error (no response)
  if (!error.response) {
    safeError('[API Client] Network error:', error.message);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection.',
      },
      timestamp: new Date().toISOString(),
    };
  }

  const responseData = error.response.data;
  const status = error.response.status;

  // Backend error response with code and message
  if (responseData && responseData.code && responseData.message) {
    return {
      success: false,
      error: {
        code: responseData.code,
        message: responseData.message,
        details: responseData.details,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Legacy error format or other error structures
  if (responseData && responseData.error) {
    return {
      success: false,
      error: responseData.error,
      timestamp: responseData.timestamp || new Date().toISOString(),
    };
  }

  // Handle specific HTTP status codes with user-friendly messages
  let message = responseData?.message || error.message;
  
  if (status === 400) {
    message = message || 'Invalid request. Please check your input.';
  } else if (status === 401) {
    message = message || 'Authentication required. Please log in.';
  } else if (status === 403) {
    message = message || 'Access denied. You do not have permission.';
  } else if (status === 404) {
    message = message || 'Resource not found.';
  } else if (status === 429) {
    message = message || 'Too many requests. Please try again later.';
  } else if (status >= 500) {
    message = message || 'Server error. Please try again later.';
  } else {
    message = message || `Request failed with status ${status}`;
  }

  // HTTP error without specific error structure
  return {
    success: false,
    error: {
      code: `HTTP_${status}`,
      message,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Helper function to handle API responses with proper typing
 */
export async function handleApiRequest<T>(
  request: Promise<ApiResponse<T>>
): Promise<T> {
  try {
    const response = await request;
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Upload file helper
 */
export async function uploadFile(
  endpoint: string,
  file: File | Blob,
  fieldName: string = 'file',
  additionalData?: Record<string, any>
): Promise<any> {
  const formData = new FormData();
  formData.append(fieldName, file);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
    });
  }

  return apiClient.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * Cancel token helper for cancelling requests
 */
export const createCancelToken = () => {
  const source = axios.CancelToken.source();
  return {
    token: source.token,
    cancel: source.cancel,
  };
};

export default apiClient;
