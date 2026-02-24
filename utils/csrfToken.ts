/**
 * CSRF Token Management
 * Handles fetching, caching, and managing CSRF tokens for state-changing requests
 *
 * SECURITY: CSRF tokens are obtained from the backend and cached locally.
 * They are refreshed on logout and periodically as they expire.
 */

import { secureStorage } from './secureStorage';
import { logger } from '../lib/logger';

interface CSRFTokenData {
  token: string;
  expiresAt: string;
  fetchedAt: string;
}

const CSRF_TOKEN_KEY = 'csrf-token';
const CSRF_TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // Refresh 5 minutes before expiry
const CSRF_TOKEN_MAX_AGE = 30 * 60 * 1000; // Max 30 minutes without refresh

export const csrfTokenService = {
  csrfTokenCache: null as CSRFTokenData | null,

  /**
   * Get valid CSRF token, fetching from server if needed
   * SECURITY: Caches token but validates expiry before use
   */
  async getToken(): Promise<string> {
    try {
      // Check if cached token is still valid
      if (this.csrfTokenCache) {
        if (!this.isTokenExpired(this.csrfTokenCache)) {
          logger.debug('[CSRF] Using cached token', {
            component: 'CSRFToken',
            action: 'token-cached',
          });
          return this.csrfTokenCache.token;
        }
      }

      // Try to load from secure storage
      const stored = await secureStorage.getItem(CSRF_TOKEN_KEY);
      if (stored) {
        try {
          const parsed: CSRFTokenData = JSON.parse(stored);
          if (!this.isTokenExpired(parsed)) {
            this.csrfTokenCache = parsed;
            logger.debug('[CSRF] Using stored token', {
              component: 'CSRFToken',
              action: 'token-from-storage',
            });
            return parsed.token;
          }
        } catch (parseError) {
          logger.warn('[CSRF] Failed to parse stored token', {
            component: 'CSRFToken',
            action: 'parse-error',
            error: parseError instanceof Error ? parseError.message : String(parseError),
          });
          await secureStorage.deleteItem(CSRF_TOKEN_KEY);
        }
      }

      // Fetch fresh token from server
      logger.debug('[CSRF] Fetching fresh token from server', {
        component: 'CSRFToken',
        action: 'token-fetch-start',
      });

      const freshToken = await this.fetchTokenFromServer();
      this.csrfTokenCache = freshToken;

      // Store in secure storage
      try {
        await secureStorage.setItem(CSRF_TOKEN_KEY, JSON.stringify(freshToken));
      } catch (storageError) {
        logger.warn('[CSRF] Failed to store token in secure storage', {
          component: 'CSRFToken',
          action: 'storage-error',
          error: storageError instanceof Error ? storageError.message : String(storageError),
        });
        // Don't fail - memory cache still works
      }

      return freshToken.token;
    } catch (error) {
      logger.error('[CSRF] Failed to get token', {
        component: 'CSRFToken',
        action: 'get-token-error',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  /**
   * Fetch CSRF token from backend
   * SECURITY: Must be called over HTTPS and origin must be validated by backend
   */
  async fetchTokenFromServer(): Promise<CSRFTokenData> {
    // Import here to avoid circular dependency with api/client.ts
    const { default: apiClient } = await import('../api/client');

    try {
      const response = await apiClient.post<{
        token: string;
        expiresAt?: string;
      }>('/v1/csrf-token', {});

      const now = new Date();
      const expiresAt = response.expiresAt
        ? new Date(response.expiresAt)
        : new Date(now.getTime() + CSRF_TOKEN_MAX_AGE);

      const tokenData: CSRFTokenData = {
        token: response.token,
        expiresAt: expiresAt.toISOString(),
        fetchedAt: now.toISOString(),
      };

      logger.debug('[CSRF] Token fetched successfully', {
        component: 'CSRFToken',
        action: 'token-fetched',
        expiresAt: tokenData.expiresAt,
      });

      return tokenData;
    } catch (error) {
      logger.error('[CSRF] Failed to fetch token from server', {
        component: 'CSRFToken',
        action: 'server-fetch-error',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  /**
   * Check if token has expired or is expiring soon
   */
  isTokenExpired(tokenData: CSRFTokenData): boolean {
    try {
      const expiryTime = new Date(tokenData.expiresAt).getTime();
      const now = Date.now();
      const timeUntilExpiry = expiryTime - now;

      // Token expired
      if (timeUntilExpiry <= 0) {
        logger.debug('[CSRF] Token expired', {
          component: 'CSRFToken',
          action: 'token-expired',
        });
        return true;
      }

      // Token expiring soon - refresh to avoid race condition
      if (timeUntilExpiry < CSRF_TOKEN_EXPIRY_BUFFER) {
        logger.debug('[CSRF] Token expiring soon, needs refresh', {
          component: 'CSRFToken',
          action: 'token-expiring-soon',
          timeUntilExpiry,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('[CSRF] Error checking token expiry', {
        component: 'CSRFToken',
        action: 'expiry-check-error',
        error: error instanceof Error ? error.message : String(error),
      });
      return true; // Treat as expired for security
    }
  },

  /**
   * Clear cached and stored CSRF token
   * Called on logout
   */
  async clear(): Promise<void> {
    try {
      this.csrfTokenCache = null;
      await secureStorage.deleteItem(CSRF_TOKEN_KEY);

      logger.debug('[CSRF] Token cleared', {
        component: 'CSRFToken',
        action: 'token-cleared',
      });
    } catch (error) {
      logger.warn('[CSRF] Error clearing token', {
        component: 'CSRFToken',
        action: 'clear-error',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  /**
   * Force refresh of CSRF token
   * Useful for security-critical operations
   */
  async refresh(): Promise<string> {
    try {
      this.csrfTokenCache = null;
      await secureStorage.deleteItem(CSRF_TOKEN_KEY);
      return this.getToken();
    } catch (error) {
      logger.error('[CSRF] Failed to refresh token', {
        component: 'CSRFToken',
        action: 'refresh-error',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
};

export default csrfTokenService;
