/**
 * API Client Configuration
 * Base Axios instance with interceptors, authentication, and error handling
 */

import axios, { AxiosError, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios';
import type { ApiError, ApiResponse, TransformedApiError } from './types';
import { safeWarn } from '../utils/logSanitizer';
import { logger } from '../lib/logger';
import { API_CONFIG } from './config';
import { generateRequestId } from '../utils/requestId';
import { useAuthStore } from '../stores/authStore';
import { sslPinningAdapter, SSL_PINNING_ACTIVE } from './sslPinningAdapter';

/**
 * SSL Certificate Pinning Configuration
 * In production with pins configured, all requests are routed through
 * react-native-ssl-pinning (AFNetworking on iOS, OkHttp on Android).
 *
 * Pins are SPKI SHA-256 hashes. Generate with:
 *   openssl s_client -connect api.userail.money:443 -servername api.userail.money 2>/dev/null \
 *     | sed -n '/-----BEGIN CERTIFICATE-----/,/-----END CERTIFICATE-----/p' > leaf.pem
 *   openssl x509 -in leaf.pem -pubkey -noout \
 *     | openssl pkey -pubin -outform der \
 *     | openssl dgst -sha256 -binary | openssl enc -base64
 *
 * Set EXPO_PUBLIC_CERT_PIN_1 (leaf) and EXPO_PUBLIC_CERT_PIN_2 (intermediate) in EAS.
 */
if (!__DEV__ && !SSL_PINNING_ACTIVE) {
  logger.error(
    '[ApiClient] SSL certificate pins not configured in production. ' +
      'Set EXPO_PUBLIC_CERT_PIN_1 and EXPO_PUBLIC_CERT_PIN_2 to enable pinning.',
    { component: 'ApiClient', action: 'ssl-pinning-missing' }
  );
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
  '/v1/auth/webauthn/login/begin',
  '/v1/auth/webauthn/login/finish',
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

function stripApiPrefix(path: string): string {
  if (path === '/api') return '/';
  if (path.startsWith('/api/')) return path.slice(4);
  return path;
}

function isAuthEndpoint(url?: string): boolean {
  const rawPath = normalizeRequestPath(url);
  if (!rawPath) return false;
  const path = stripApiPrefix(rawPath);

  return AUTH_ENDPOINTS.some(
    (endpoint) =>
      path === endpoint ||
      rawPath === endpoint ||
      path.endsWith(endpoint) ||
      rawPath.endsWith(endpoint)
  );
}

function isPasscodeProtectedEndpoint(method?: string, url?: string): boolean {
  const rawPath = normalizeRequestPath(url);
  if (!rawPath || !method) return false;
  const path = stripApiPrefix(rawPath);

  const normalizedMethod = method.toUpperCase();
  if (normalizedMethod === 'POST' && /^\/v1\/withdrawals(?:\/(?:crypto|fiat))?$/.test(path))
    return true;
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

/**
 * SECURITY: Atomic refresh promise getter/creator
 * Ensures only one refresh happens even with concurrent 401s
 * Uses a closure to prevent race conditions in the check-then-set pattern
 */
function getOrCreateRefreshPromise(): Promise<void> {
  if (!refreshPromise) {
    logger.debug('[API Client] Creating new refresh promise', {
      component: 'ApiClient',
      action: 'refresh-promise-created',
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
        refreshPromise = null; // Clear for next refresh attempt
      });
  } else {
    logger.debug('[API Client] Reusing existing refresh promise', {
      component: 'ApiClient',
      action: 'refresh-promise-reused',
    });
  }

  return refreshPromise;
}

/**
 * Create base axios instance
 */
const axiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'RailApp',
  },
  ...(SSL_PINNING_ACTIVE ? { adapter: sslPinningAdapter } : {}),
});

/**
 * Request interceptor - adds auth token, request ID, and CSRF token
 */
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const {
      accessToken,
      isAuthenticated,
      updateLastActivity,
      passcodeSessionToken,
      checkPasscodeSessionExpiry,
      clearPasscodeSession,
      csrfToken,
    } = useAuthStore.getState();

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    config.headers['X-Request-ID'] = generateRequestId();

    // Add CSRF token for state-changing requests
    // SECURITY: Only for authenticated, non-auth endpoints
    const needsCSRF = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
      (config.method || 'GET').toUpperCase()
    );

    if (needsCSRF && isAuthenticated && !isAuthEndpoint(config.url)) {
      if (csrfToken && config.headers) {
        config.headers['X-CSRF-Token'] = csrfToken;
        logger.debug('[API Client] CSRF token added to request', {
          component: 'ApiClient',
          action: 'csrf-token-added',
          method: config.method,
          path: normalizeRequestPath(config.url),
        });
      } else if (!config.headers?.['X-Requested-With']) {
        // Only warn when not using the native-client bypass header
        logger.warn('[API Client] Missing CSRF token for state-changing request', {
          component: 'ApiClient',
          action: 'csrf-token-missing',
          method: config.method,
          path: normalizeRequestPath(config.url),
        });
      }
    }

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
  (response) => {
    // Keep local passcode-session state in sync with one-time server validation middleware.
    if (isPasscodeProtectedEndpoint(response.config?.method, response.config?.url)) {
      useAuthStore.getState().clearPasscodeSession();
    }
    return response.data;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };
    const requestId = originalRequest?.headers?.['X-Request-ID'] as string | undefined;
    const statusCode = error.response?.status;

    if (isPasscodeProtectedEndpoint(originalRequest?.method, originalRequest?.url)) {
      const passcodeErrorCode = String(
        (error.response?.data as any)?.code ||
          (error.response?.data as any)?.error ||
          (error.response?.data as any)?.error?.code ||
          ''
      ).toUpperCase();

      if (
        statusCode === 401 ||
        statusCode === 403 ||
        passcodeErrorCode === 'PASSCODE_SESSION_REQUIRED' ||
        passcodeErrorCode === 'PASSCODE_SESSION_INVALID'
      ) {
        useAuthStore.getState().clearPasscodeSession();
        return Promise.reject(transformError(error, requestId));
      }
    }

    // Handle 429 Rate Limiting
    if (statusCode === 429) {
      const retryAfter = error.response?.headers?.['retry-after'];
      const retryCount = originalRequest._retryCount || 0;

      if (retryCount < 3 && retryAfter) {
        originalRequest._retryCount = retryCount + 1;
        const delay = parseInt(retryAfter, 10) * 1000 || 5000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return axiosInstance.request(originalRequest);
      }
    }

    // Handle 401 - Token refresh
    if (statusCode === 401 && !originalRequest._retry && !isAuthEndpoint(originalRequest.url)) {
      originalRequest._retry = true;

      const { isAuthenticated, refreshToken, clearSession, clearPasscodeSession } =
        useAuthStore.getState();

      // SECURITY: If this is a passcode-protected endpoint returning 401,
      // the passcode session is invalid and should be cleared
      if (isPasscodeProtectedEndpoint(originalRequest.method, originalRequest.url)) {
        logger.warn('[API Client] 401 on passcode-protected endpoint - clearing passcode session', {
          component: 'ApiClient',
          action: 'passcode-session-invalid-401',
          method: originalRequest.method,
          url: originalRequest.url,
        });
        clearPasscodeSession();
        // Return error - user needs to re-verify passcode
        return Promise.reject(transformError(error, requestId));
      }

      if (isAuthenticated && refreshToken) {
        try {
          // SECURITY: Atomic refresh using single promise
          // All concurrent 401s will wait for the same refresh
          await getOrCreateRefreshPromise();

          // SECURITY: Validate new token was actually refreshed
          const newAccessToken = useAuthStore.getState().accessToken;
          if (!newAccessToken) {
            logger.error('[API Client] Token refresh returned empty token', {
              component: 'ApiClient',
              action: 'no-token-returned',
            });
            // Only clear session if refresh token was actually invalid (not a network error)
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
          logger.error('[API Client] Token refresh error', {
            component: 'ApiClient',
            action: 'refresh-error',
            error: refreshError instanceof Error ? refreshError.message : String(refreshError),
          });

          // Only clear session if refresh token is invalid (401 from refresh endpoint)
          // Network errors should NOT clear session - user may still have valid tokens
          const isRefreshEndpoint = isAuthEndpoint(originalRequest.url);
          const isInvalidTokenError = error.response?.status === 401 && isRefreshEndpoint;

          if (isInvalidTokenError) {
            logger.debug('[API Client] Clearing session due to invalid refresh token', {
              component: 'ApiClient',
              action: 'clear-session-invalid-token',
            });
            clearSession();
          } else {
            logger.debug('[API Client] Not clearing session - network error or non-refresh 401', {
              component: 'ApiClient',
              action: 'skip-clear-session',
              isRefreshEndpoint,
              status: error.response?.status,
            });
          }

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
    data?.details ??
    data?.errors ??
    data?.validationErrors ??
    data?.fields ??
    (Array.isArray(data?.missing_fields) ? { missing_fields: data.missing_fields } : undefined);

  // Log server errors for monitoring
  if (status >= 500) {
    safeWarn('[API] Server error', {
      status,
      code: typeof data === 'object' ? data?.code : undefined,
      requestId,
      url: error.config?.url,
    });
  }

  if (typeof data === 'string') {
    const trimmed = data.trim().toLowerCase();
    const isHTMLResponse = trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html');
    if (isHTMLResponse) {
      return {
        code: `HTTP_${status}`,
        message: getDefaultMessage(status),
        status,
        requestId,
      };
    }
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

  // Legacy error format: { error: "message" } or { error: { code, message } }
  if (typeof data?.error === 'string') {
    return {
      code: `HTTP_${status}`,
      message: data.error,
      details,
      status,
      requestId,
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
