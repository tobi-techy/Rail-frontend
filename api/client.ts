/**
 * API Client Configuration
 * Base Axios instance with interceptors, authentication, and error handling
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';
import type { ApiError, ApiResponse } from './types';

// Environment-based configuration
const API_CONFIG = {
  baseURL: process.env.API_BASE_URL || 'http://localhost:8080/api',
  timeout: parseInt(process.env.API_TIMEOUT || '30000'),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

/**
 * Create base axios instance
 */
const apiClient: AxiosInstance = axios.create(API_CONFIG);

/**
 * Request interceptor
 * - Adds authentication token to requests
 * - Logs requests in development
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get auth token from store
    const accessToken = useAuthStore.getState().accessToken;

    // Add authorization header if token exists
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Log request in development
    if (__DEV__) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('[API Request Error]', error);
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
    // Log response in development
    if (__DEV__) {
      console.log(`[API Response] ${response.config.url}`, response.data);
    }

    // Return the data directly for successful responses
    // The backend returns data directly without wrapping in { data: ... }
    return response.data;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry for login/register/verify endpoints
      const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
                             originalRequest.url?.includes('/auth/register') ||
                             originalRequest.url?.includes('/auth/verify-code');
      
      if (!isAuthEndpoint) {
        originalRequest._retry = true;

        try {
          // Attempt to refresh token
          const { refreshSession } = useAuthStore.getState();
          await refreshSession();

          // Retry original request with new token
          const newAccessToken = useAuthStore.getState().accessToken;
          if (originalRequest.headers && newAccessToken) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          const { logout } = useAuthStore.getState();
          await logout();
          return Promise.reject(refreshError);
        }
      }
    }

    // Log error in development
    if (__DEV__) {
      console.error('[API Error]', {
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

  // HTTP error without specific error structure
  return {
    success: false,
    error: {
      code: `HTTP_${error.response.status}`,
      message: responseData?.message || error.message || `Request failed with status ${error.response.status}`,
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
