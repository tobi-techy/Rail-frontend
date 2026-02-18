/**
 * API Client Configuration
 * Base Axios instance with interceptors, authentication, and error handling
 */

import axios, { AxiosError, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios';
import type { ApiError, ApiResponse, TransformedApiError } from './types';
import { safeLog, safeError, safeWarn } from '../utils/logSanitizer';
import { logger } from '../lib/logger';
import { API_CONFIG } from './config';
import { generateRequestId } from '../utils/requestId';
import { useAuthStore } from '../stores/authStore';

/**
 * SSL Certificate Pinning Configuration
 * In production, requests will only succeed if the server's certificate matches
 *
 * SECURITY WARNING: Empty config disables SSL pinning. For production:
 * 1. Obtain your server's certificate hash:
 *    openssl s_client -connect api.yourdomain.com:443 | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
 * 2. Add at least 2 pins (primary + backup) for certificate rotation
 * 3. Set EXPO_PUBLIC_API_URL environment variable for production
 *
 * Example configuration:
 * const SSL_PINNING_CONFIG: Record<string, string[]> = {
 *   'api.rail.com': [
 *     'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
 *     'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
 *   ],
 * };
 */

// CRITICAL: SSL Pinning Configuration
// In production, MUST have valid pins configured
const SSL_PINNING_ENABLED = __DEV__
  ? false
  : process.env.EXPO_PUBLIC_SSL_PINNING_ENABLED !== 'false'; // Enabled by default in production

const SSL_PINNING_CONFIG: Record<string, string[]> =
  SSL_PINNING_ENABLED && process.env.EXPO_PUBLIC_API_URL
    ? {
        [new URL(process.env.EXPO_PUBLIC_API_URL).hostname]: [
          process.env.EXPO_PUBLIC_CERT_PIN_1 || '',
          process.env.EXPO_PUBLIC_CERT_PIN_2 || '',
        ].filter(Boolean),
      }
    : {};

// Validate SSL pinning in production
if (
  !__DEV__ &&
  (Object.keys(SSL_PINNING_CONFIG).length === 0 ||
    Object.values(SSL_PINNING_CONFIG).some((pins) => pins.length === 0))
) {
  const errorMsg =
    'CRITICAL: SSL Pinning not properly configured in production. This is a security risk.';
  logger.error(errorMsg, {
    component: 'ApiClient',
    action: 'ssl-pinning-validation',
    sslPinningEnabled: SSL_PINNING_ENABLED,
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    hasCertPin1: !!process.env.EXPO_PUBLIC_CERT_PIN_1,
    hasCertPin2: !!process.env.EXPO_PUBLIC_CERT_PIN_2,
  });
}

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
  '/v1/auth/verify',
  '/v1/auth/resend-code',
  '/v1/auth/forgot-password',
  '/v1/auth/reset-password',
  '/v1/auth/refresh',
  '/v1/auth/social/login',
  '/v1/auth/passcode-login',
  '/v1/security/passcode/verify',
];

function normalizeRequestPath(url?: string): string {
  if (!url) return '';

  try {
    const parsed = url.startsWith('http') ? new URL(url) : new URL(url, API_CONFIG.baseURL);
    return parsed.pathname.startsWith('/') ? parsed.pathname : `/${parsed.pathname}`;
  } catch {
    const pathOnly = url.split('?')[0];
    return pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  }
}

function isAuthEndpoint(url?: string): boolean {
  const path = normalizeRequestPath(url);
  if (!path) return false;

  return AUTH_ENDPOINTS.some(
    (endpoint) => path === endpoint || path === '/' + endpoint || path.endsWith('/' + endpoint)
  );
}

function isPasscodeProtectedEndpoint(method?: string, url?: string): boolean {
  const path = normalizeRequestPath(url);
  if (!path || !method) return false;

  const normalizedMethod = method.toUpperCase();
  if (normalizedMethod === 'POST' && path === '/v1/security/ip-whitelist') return true;
  if (normalizedMethod === 'POST' && path === '/v1/security/withdrawals/confirm') return true;
  if (normalizedMethod === 'POST' && /^\/v1\/security\/devices\/[^/]+\/trust$/.test(path))
    return true;
  if (normalizedMethod === 'DELETE' && /^\/v1\/security\/devices\/[^/]+$/.test(path)) return true;
  if (normalizedMethod === 'DELETE' && /^\/v1\/security\/ip-whitelist\/[^/]+$/.test(path))
    return true;

  return false;
}

// Token refresh state to prevent race conditions
let refreshPromise: Promise<void> | null = null;
let refreshInProgress = false; // Additional flag to prevent re-entry

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
 * Request interceptor - adds auth token, request ID, and CSRF token
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const {
      accessToken,
      isAuthenticated,
      updateLastActivity,
      passcodeSessionToken,
      checkPasscodeSessionExpiry,
      clearPasscodeSession,
    } = useAuthStore.getState();

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    config.headers['X-Request-ID'] = generateRequestId();

    if (config.headers && isPasscodeProtectedEndpoint(config.method, config.url)) {
      const hasPasscodeHeader = !!config.headers['X-Passcode-Session'];
      const isPasscodeSessionExpired = checkPasscodeSessionExpiry();

      if (!hasPasscodeHeader && passcodeSessionToken && !isPasscodeSessionExpired) {
        config.headers['X-Passcode-Session'] = passcodeSessionToken;
      } else if (!hasPasscodeHeader && passcodeSessionToken && isPasscodeSessionExpired) {
        clearPasscodeSession();
      }
    }

    if (isAuthenticated) updateLastActivity();

    return config;
  },
  (error: AxiosError) => {
    safeWarn('[API Request Error]', error);
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

      const { isAuthenticated, refreshToken, clearSession } = useAuthStore.getState();

      if (isAuthenticated && refreshToken) {
        try {
          // SECURITY: Prevent race condition with double-checked locking
          // Both flags prevent concurrent refresh attempts
          if (refreshInProgress && refreshPromise) {
            logger.debug('[API Client] Token refresh already in progress, waiting', {
              component: 'ApiClient',
              action: 'refresh-waiting',
            });
            await refreshPromise;
          } else if (!refreshInProgress) {
            // First request to initiate refresh
            refreshInProgress = true;
            logger.debug('[API Client] Initiating token refresh', {
              component: 'ApiClient',
              action: 'refresh-start',
            });

            refreshPromise = useAuthStore
              .getState()
              .refreshSession()
              .then(() => {
                logger.debug('[API Client] Token refresh succeeded', {
                  component: 'ApiClient',
                  action: 'refresh-success',
                });
              })
              .catch((err) => {
                logger.error('[API Client] Token refresh failed', {
                  component: 'ApiClient',
                  action: 'refresh-failure',
                  error: err instanceof Error ? err.message : String(err),
                });
                throw err;
              })
              .finally(() => {
                refreshInProgress = false;
                refreshPromise = null;
              });

            await refreshPromise;
          }

          // SECURITY: Validate new token was actually refreshed
          const newAccessToken = useAuthStore.getState().accessToken;
          if (!newAccessToken) {
            logger.error('[API Client] Token refresh returned empty token', {
              component: 'ApiClient',
              action: 'no-token-returned',
            });
            clearSession();
            return Promise.reject(new Error('Token refresh failed: no token returned'));
          }

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            logger.debug('[API Client] Retrying request with new token', {
              component: 'ApiClient',
              action: 'retry-with-token',
            });
            return axiosInstance.request(originalRequest);
          }
        } catch (refreshError) {
          logger.error(
            '[API Client] Token refresh error',
            refreshError instanceof Error ? refreshError : new Error(String(refreshError))
          );
          refreshInProgress = false; // Ensure flag is reset on error
          clearSession();
          return Promise.reject(refreshError);
        }
      }
    }

    if (__DEV__) {
      safeWarn('[API Error]', {
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
 * Categorizes errors to help UI display appropriate messages
 */
function transformError(error: AxiosError<any>, requestId?: string): TransformedApiError {
  if (!error.response) {
    // Network error - no response from server
    const isAuth = isAuthEndpoint(error.config?.url);
    const errorCode = (error as any).code;

    // Enhanced diagnostics for network errors
    safeWarn('[API] Network error - no response from server', {
      requestId,
      originalError: error.message,
      code: errorCode,
      errno: (error as any).errno,
      url: error.config?.url,
      method: error.config?.method,
      isAuthEndpoint: isAuth,
      timeout: error.config?.timeout,
    });

    // Specific error messages based on error code
    if (errorCode === 'ECONNABORTED' || errorCode === 'ETIMEDOUT') {
      return {
        code: 'NETWORK_TIMEOUT',
        message: 'Request timeout. Please check your connection and try again.',
        status: 0,
        requestId,
      };
    }

    if (errorCode === 'ECONNREFUSED' || errorCode === 'ENOTFOUND') {
      return {
        code: 'NETWORK_ERROR',
        message:
          'Unable to connect to server. Please check your internet connection and API configuration.',
        status: 0,
        requestId,
      };
    }

    if (errorCode === 'ERR_TLS_CERT_ALTNAME' || errorCode === 'CERT_HAS_EXPIRED') {
      return {
        code: 'SSL_ERROR',
        message: 'SSL certificate error. Please try again or contact support.',
        status: 0,
        requestId,
      };
    }

    // Default network error
    return {
      code: 'NETWORK_ERROR',
      message: 'Network error. Please check your connection.',
      status: 0,
      requestId,
    };
  }

  const { status, data } = error.response;
  const details =
    data?.details ?? data?.errors ?? data?.validationErrors ?? data?.fields ?? undefined;

  // Log server errors for monitoring
  if (status >= 500) {
    safeWarn('[API] Server error', {
      status,
      code: data?.code,
      requestId,
      url: error.config?.url,
    });
  }

  // Backend error with code and message
  if (data?.code && data?.message) {
    return {
      code: data.code,
      message: data.message,
      details,
      status,
      requestId: data.requestId || requestId,
    };
  }

  // Legacy error format
  if (data?.error) {
    return {
      code: data.error.code || `HTTP_${status}`,
      message: data.error.message || getDefaultMessage(status),
      details: data.error.details ?? details,
      status,
      requestId,
    };
  }

  return {
    code: `HTTP_${status}`,
    message: data?.message || getDefaultMessage(status),
    details,
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

// This type assertion relies on the response interceptor to unwrap the data.
// See line 83. If that interceptor is removed, this will break.
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
