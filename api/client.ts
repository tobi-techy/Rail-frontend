/**
 * API Client Configuration
 * Base Axios instance with interceptors, authentication, and error handling
 */

import axios, { AxiosError, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios';
import type { ApiError, ApiResponse, TransformedApiError } from './types';
import { safeLog, safeError } from '../utils/logSanitizer';
import { API_CONFIG } from './config';
import { generateRequestId } from '../utils/requestId';

/**
 * Custom Axios instance type that returns unwrapped data
 */
interface ApiClient {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
  request<T = unknown>(config: AxiosRequestConfig): Promise<T>;
  interceptors: typeof axios.interceptors;
}

const AUTH_ENDPOINTS = [
  '/v1/auth/login',
  '/v1/auth/register',
  '/v1/auth/verify-code',
  '/v1/auth/refresh',
  '/v1/security/passcode/verify',
];

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  // Extract path from URL and check for exact match
  const path = url.startsWith('http') ? new URL(url).pathname : url;
  return AUTH_ENDPOINTS.some((endpoint) => path === endpoint || path.endsWith(endpoint));
}

// Token refresh state to prevent race conditions
let refreshPromise: Promise<void> | null = null;

/**
 * Create base axios instance
 */
const axiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Request interceptor - adds auth token and request ID
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { useAuthStore } = require('../stores/authStore');
    const { accessToken, isAuthenticated, updateLastActivity } = useAuthStore.getState();

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Add request ID for tracing
    config.headers['X-Request-ID'] = generateRequestId();

    if (isAuthenticated) updateLastActivity();

    return config;
  },
  (error: AxiosError) => {
    safeError('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handles token refresh and error transformation
 */
axiosInstance.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };
    const requestId = originalRequest?.headers?.['X-Request-ID'] as string | undefined;

    // Handle 429 Rate Limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const retryCount = originalRequest._retryCount || 0;

      if (retryCount < 3 && retryAfter) {
        originalRequest._retryCount = retryCount + 1;
        const delay = parseInt(retryAfter, 10) * 1000 || 5000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return axiosInstance.request(originalRequest);
      }
    }

    // Handle 401 - Token refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true;

      const { useAuthStore } = require('../stores/authStore');
      const { isAuthenticated, refreshToken, reset } = useAuthStore.getState();

      if (isAuthenticated && refreshToken) {
        try {
          // Prevent race condition - reuse existing refresh promise
          if (!refreshPromise) {
            refreshPromise = useAuthStore
              .getState()
              .refreshSession()
              .finally(() => {
                refreshPromise = null;
              });
          }
          await refreshPromise;

          const newAccessToken = useAuthStore.getState().accessToken;
          if (originalRequest.headers && newAccessToken) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axiosInstance.request(originalRequest);
          }
        } catch (refreshError) {
          safeLog('[API Client] Token refresh failed, clearing session');
          reset();
          return Promise.reject(refreshError);
        }
      }
    }

    if (__DEV__) {
      safeError('[API Error]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        requestId,
      });
    }

    return Promise.reject(transformError(error, requestId));
  }
);

/**
 * Transform axios error to consistent format
 */
function transformError(error: AxiosError<any>, requestId?: string): TransformedApiError {
  if (!error.response) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network error. Please check your connection.',
      status: 0,
      requestId,
    };
  }

  const { status, data } = error.response;

  // Backend error with code and message
  if (data?.code && data?.message) {
    return {
      code: data.code,
      message: data.message,
      details: data.details,
      status,
      requestId: data.requestId || requestId,
    };
  }

  // Legacy error format
  if (data?.error) {
    return {
      code: data.error.code || `HTTP_${status}`,
      message: data.error.message || getDefaultMessage(status),
      details: data.error.details,
      status,
      requestId,
    };
  }

  return {
    code: `HTTP_${status}`,
    message: data?.message || getDefaultMessage(status),
    details: data?.details,
    status,
    requestId,
  };
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

const apiClient = axiosInstance as unknown as ApiClient;

/**
 * Helper function to handle API responses with proper typing
 */
export async function handleApiRequest<T>(request: Promise<ApiResponse<T>>): Promise<T> {
  const response = await request;
  return response.data;
}

/**
 * Upload file helper
 */
export async function uploadFile(
  endpoint: string,
  file: File | Blob,
  fieldName: string = 'file',
  additionalData?: Record<string, unknown>
): Promise<unknown> {
  const formData = new FormData();
  formData.append(fieldName, file);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    });
  }

  return apiClient.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/**
 * Cancel token helper
 */
export const createCancelToken = () => {
  const source = axios.CancelToken.source();
  return { token: source.token, cancel: source.cancel };
};

export default apiClient;
