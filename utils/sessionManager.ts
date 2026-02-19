/**
 * Session Manager
 * Handles token refresh, expiry checks, and session lifecycle
 */

import { useAuthStore } from '../stores/authStore';
import { authService } from '../api/services';
import { logger } from '../lib/logger';

export class SessionManager {
  private static refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private static passcodeSessionTimer: ReturnType<typeof setTimeout> | null = null;
  private static initialized = false;
  private static readonly SESSION_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (for token expiry)
  private static readonly PASSCODE_SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

  /**
   * Check if token is expired
   */
  static isTokenExpired(expiresAt: string): boolean {
    const expiryTime = new Date(expiresAt).getTime();
    const now = new Date().getTime();
    return expiryTime <= now;
  }

  /**
   * Get time until token expires (in milliseconds)
   */
  static getTimeUntilExpiry(expiresAt: string): number {
    const expiryTime = new Date(expiresAt).getTime();
    const now = new Date().getTime();
    return Math.max(0, expiryTime - now);
  }

  /**
   * Refresh access token
   */
  static async refreshToken(): Promise<void> {
    const { refreshToken, isAuthenticated } = useAuthStore.getState();

    if (!refreshToken || !isAuthenticated) {
      logger.warn('[SessionManager] No refresh token available or not authenticated', {
        component: 'SessionManager',
        action: 'refresh-token-failed',
        hasRefreshToken: !!refreshToken,
        isAuthenticated,
      });
      this.handleSessionExpired();
      return;
    }

    try {
      const response = await authService.refreshToken({ refreshToken });
      const tokenExpiresAt = response.expiresAt
        ? new Date(response.expiresAt).toISOString()
        : useAuthStore.getState().tokenExpiresAt;

      useAuthStore.setState({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken || refreshToken,
        tokenExpiresAt,
      });

      if (response.expiresAt) {
        this.scheduleTokenRefresh(response.expiresAt);
      }

      logger.debug('[SessionManager] Token refreshed successfully', {
        component: 'SessionManager',
        action: 'token-refreshed',
      });
    } catch (error) {
      logger.error(
        '[SessionManager] Token refresh failed',
        error instanceof Error ? error : new Error(String(error))
      );
      this.handleSessionExpired();
    }
  }

  /**
   * Schedule automatic token refresh
   * Refreshes 5 minutes before expiry
   */
  static scheduleTokenRefresh(expiresAt: string): void {
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    const timeUntilExpiry = this.getTimeUntilExpiry(expiresAt);

    // Refresh 5 minutes (300000ms) before expiry
    const REFRESH_BUFFER = 5 * 60 * 1000;
    const refreshTime = Math.max(0, timeUntilExpiry - REFRESH_BUFFER);

    logger.debug('[SessionManager] Token refresh scheduled', {
      component: 'SessionManager',
      action: 'schedule-refresh',
      expiresAt,
      timeUntilExpiry,
      refreshTime,
    });

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken().catch((error) => {
          logger.error(
            '[SessionManager] Token refresh in setTimeout failed',
            error instanceof Error ? error : new Error(String(error))
          );
          this.handleSessionExpired();
        });
      }, refreshTime);
    } else {
      // Token is already expired or expires very soon
      logger.warn('[SessionManager] Token expires very soon, refreshing immediately', {
        component: 'SessionManager',
        action: 'immediate-refresh',
        timeUntilExpiry,
      });
      this.refreshToken().catch((error) => {
        logger.error(
          '[SessionManager] Immediate token refresh failed',
          error instanceof Error ? error : new Error(String(error))
        );
        this.handleSessionExpired();
      });
    }
  }

  /**
   * Handle session expiration (7-day token expiry)
   * Clears ALL auth data including user data - requires full re-authentication
   */
  static handleSessionExpired(): void {
    // Clear any refresh timers
    this.cleanup();

    // Use the store's clearExpiredSession method
    const { clearExpiredSession } = useAuthStore.getState();
    clearExpiredSession();
  }

  /**
   * Handle passcode session expiration
   * Only clears the passcode session, not the full auth session
   */
  static handlePasscodeSessionExpired(): void {
    // Clear passcode session timer
    if (this.passcodeSessionTimer) {
      clearTimeout(this.passcodeSessionTimer);
      this.passcodeSessionTimer = null;
    }

    // Clear only the passcode session tokens
    const { clearPasscodeSession } = useAuthStore.getState();
    clearPasscodeSession();
  }

  /**
   * Check if passcode session is expired based on last activity
   * Passcode session expires after 10 minutes of INACTIVITY (not wall-clock time)
   */
  static isPasscodeSessionExpired(): boolean {
    const { checkPasscodeSessionExpiry } = useAuthStore.getState();
    return checkPasscodeSessionExpiry();
  }

  /**
   * Schedule passcode session expiration check
   * Passcode session lasts 10 minutes of INACTIVITY
   * SECURITY: Validates expiry timestamp to prevent bypass attacks
   */
  static schedulePasscodeSessionExpiry(expiresAt: string): void {
    // SECURITY: Validate expiresAt is a valid ISO string
    try {
      const expiryTime = new Date(expiresAt).getTime();
      if (isNaN(expiryTime)) {
        logger.error('[SessionManager] Invalid expiry timestamp format', {
          component: 'SessionManager',
          action: 'invalid-expiry-format',
          expiresAt,
        });
        this.handlePasscodeSessionExpired();
        return;
      }
    } catch (error) {
      logger.error('[SessionManager] Failed to parse expiry timestamp', {
        component: 'SessionManager',
        action: 'parse-error',
        error: error instanceof Error ? error.message : String(error),
      });
      this.handlePasscodeSessionExpired();
      return;
    }

    // Clear existing timer
    if (this.passcodeSessionTimer) {
      clearTimeout(this.passcodeSessionTimer);
      this.passcodeSessionTimer = null;
    }

    const timeUntilExpiry = this.getTimeUntilExpiry(expiresAt);

    // SECURITY: Cap timeout to prevent integer overflow or suspicious values
    const MAX_TIMEOUT = 10 * 60 * 1000; // 10 minutes max (actual passcode session duration)
    const MIN_TIMEOUT = 1000; // 1 second minimum

    let scheduledTimeout = timeUntilExpiry;
    if (scheduledTimeout > MAX_TIMEOUT) {
      logger.warn('[SessionManager] Expiry time exceeds 10 minute limit', {
        component: 'SessionManager',
        action: 'timeout-clamped',
        requested: scheduledTimeout,
        clamped: MAX_TIMEOUT,
      });
      scheduledTimeout = MAX_TIMEOUT;
    }

    if (scheduledTimeout < MIN_TIMEOUT) {
      // Passcode session is already expired or about to expire
      logger.debug('[SessionManager] Passcode session already expired', {
        component: 'SessionManager',
        action: 'already-expired',
        timeUntilExpiry,
      });
      this.handlePasscodeSessionExpired();
      return;
    }

    this.passcodeSessionTimer = setTimeout(() => {
      logger.debug('[SessionManager] Passcode session expired (scheduled)', {
        component: 'SessionManager',
        action: 'scheduled-expiry',
      });
      this.handlePasscodeSessionExpired();
    }, scheduledTimeout);

    logger.debug('[SessionManager] Passcode session expiry scheduled', {
      component: 'SessionManager',
      action: 'schedule-passcode-expiry',
      expiresAt,
      scheduledTimeoutMs: scheduledTimeout,
    });
  }

  /**
   * Reset passcode session timer on activity (app foreground)
   * Call this when app comes to foreground to extend session
   */
  static resetPasscodeSessionTimer(): void {
    const state = useAuthStore.getState();
    if (!state.passcodeSessionExpiresAt) {
      return;
    }

    const now = Date.now();
    const expiresAt = new Date(state.passcodeSessionExpiresAt).getTime();
    const timeUntilExpiry = Math.max(0, expiresAt - now);

    // Only reset if session is still valid (has at least 1 minute remaining)
    if (timeUntilExpiry < 60 * 1000) {
      logger.debug('[SessionManager] Passcode session expired, not resetting timer', {
        component: 'SessionManager',
        action: 'skip-reset-expired',
        timeUntilExpiry,
      });
      return;
    }

    // Extend session by 10 minutes from now (activity-based timeout)
    const newExpiresAt = new Date(now + 10 * 60 * 1000).toISOString();
    useAuthStore.setState({
      passcodeSessionExpiresAt: newExpiresAt,
    });

    this.schedulePasscodeSessionExpiry(newExpiresAt);

    logger.debug('[SessionManager] Passcode session timer reset on activity', {
      component: 'SessionManager',
      action: 'reset-timer',
      previousExpiry: state.passcodeSessionExpiresAt,
      newExpiry: newExpiresAt,
    });
  }

  /**
   * Initialize session management
   * MUST be called after auth store is hydrated from AsyncStorage
   * Call this on app start after store.hydrate() completes
   */
  static initialize(): void {
    if (this.initialized) {
      logger.debug('[SessionManager] Already initialized, skipping', {
        component: 'SessionManager',
        action: 'initialize-skip',
      });
      return;
    }

    const state = useAuthStore.getState();

    // CRITICAL: Validate store is hydrated before accessing auth state
    if (typeof (state as any)._hasHydrated !== 'undefined' && !(state as any)._hasHydrated) {
      logger.warn('[SessionManager] Cannot initialize - auth store not hydrated yet', {
        component: 'SessionManager',
        action: 'initialize-early',
      });
      return;
    }

    const {
      accessToken,
      refreshToken,
      isAuthenticated,
      passcodeSessionExpiresAt,
      checkTokenExpiry,
      user,
    } = state;

    if (!isAuthenticated || !accessToken || !refreshToken) {
      logger.debug('[SessionManager] No valid auth data - skipping initialization', {
        component: 'SessionManager',
        action: 'initialize-no-auth',
        isAuthenticated,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
      });
      return;
    }

    // Check if 7-day token has expired
    if (checkTokenExpiry()) {
      logger.warn('[SessionManager] Token expired during initialization', {
        component: 'SessionManager',
        action: 'token-expired-init',
      });
      this.handleSessionExpired();
      return;
    }

    // Check if passcode session has expired
    if (passcodeSessionExpiresAt) {
      if (this.isPasscodeSessionExpired()) {
        logger.info('[SessionManager] Passcode session expired during initialization', {
          component: 'SessionManager',
          action: 'passcode-expired-init',
        });
        this.handlePasscodeSessionExpired();
      } else {
        // Schedule passcode session expiry
        this.schedulePasscodeSessionExpiry(passcodeSessionExpiresAt);
      }
    }

    // Update last activity to current time since app is being opened
    const { updateLastActivity } = useAuthStore.getState();
    updateLastActivity();

    // Schedule periodic health check
    this.scheduleHealthCheck();

    this.initialized = true;

    logger.info('[SessionManager] Session management initialized successfully', {
      component: 'SessionManager',
      action: 'initialized',
      hasPasscodeSession: !!passcodeSessionExpiresAt,
    });
  }

  /**
   * Schedule periodic health check
   */
  private static scheduleHealthCheck(): void {
    // Check session health every 30 minutes for token expiry only
    const CHECK_INTERVAL = 30 * 60 * 1000;

    logger.debug('[SessionManager] Health check scheduled', {
      component: 'SessionManager',
      action: 'health-check-scheduled',
      interval: CHECK_INTERVAL,
    });

    setTimeout(() => {
      const { isAuthenticated, accessToken, checkTokenExpiry } = useAuthStore.getState();

      if (isAuthenticated && accessToken) {
        logger.debug('[SessionManager] Running health check', {
          component: 'SessionManager',
          action: 'health-check-run',
        });

        // Check if 7-day token has expired
        if (checkTokenExpiry()) {
          logger.warn('[SessionManager] Health check detected expired token', {
            component: 'SessionManager',
            action: 'health-check-expired-token',
          });
          this.handleSessionExpired();
          return;
        }

        // Attempt to refresh token to ensure it's still valid
        this.refreshToken().catch((error) => {
          logger.warn('[SessionManager] Health check token refresh failed', {
            component: 'SessionManager',
            action: 'health-check-refresh-failed',
            error: error instanceof Error ? error.message : String(error),
          });
        });
      }

      // Schedule next check if still initialized
      if (this.initialized) {
        this.scheduleHealthCheck();
      }
    }, CHECK_INTERVAL);
  }

  /**
   * Cleanup and reset session manager
   */
  static cleanup(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (this.passcodeSessionTimer) {
      clearTimeout(this.passcodeSessionTimer);
      this.passcodeSessionTimer = null;
    }

    this.initialized = false;
  }

  /**
   * Force refresh token now
   */
  static forceRefresh(): Promise<void> {
    return this.refreshToken();
  }

  /**
   * Check if session is valid
   */
  static isSessionValid(): boolean {
    const { isAuthenticated, accessToken, refreshToken } = useAuthStore.getState();
    return isAuthenticated && !!accessToken && !!refreshToken;
  }
}

// Remove auto-initialize - it causes crashes in production when store isn't hydrated yet
// SessionManager.initialize() should be called explicitly from app/_layout.tsx after store is ready
// See: https://github.com/pmndrs/zustand/blob/main/packages/middleware-persist/src/index.ts#L1-L50

export default SessionManager;
