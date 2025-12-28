/**
 * Auth Interceptor
 * Handles authentication token injection and automatic token refresh
 */

import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import { secureStorage } from '../../utils/secureStorage';
import { generateRequestId } from '../../utils/requestId';

const AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/verify-code',
  '/auth/refresh',
  '/security/passcode/verify',
];

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

export const authInterceptor = {
  request: async (config: InternalAxiosRequestConfig) => {
    // Lazy import to break circular dependency
    const { useAuthStore } = require('../../stores/authStore');
    const { accessToken, isAuthenticated, updateLastActivity } = useAuthStore.getState();

    // Add authorization header if token exists
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Add request ID for tracing
    config.headers['X-Request-ID'] = generateRequestId();

    // Update last activity for authenticated requests
    if (isAuthenticated) {
      updateLastActivity();
    }

    return config;
  },

  responseError: async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true;

      const { useAuthStore } = require('../../stores/authStore');
      const { refreshToken, isAuthenticated, refreshSession, reset } = useAuthStore.getState();

      if (isAuthenticated && refreshToken) {
        try {
          await refreshSession();
          const newAccessToken = useAuthStore.getState().accessToken;
          if (originalRequest.headers && newAccessToken) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios.request(originalRequest);
          }
        } catch {
          reset();
        }
      }
    }

    return Promise.reject(error);
  },
};
