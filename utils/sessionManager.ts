/**
 * Session Manager
 * Handles token refresh, expiry checks, and session lifecycle
 */

import { useAuthStore } from '../stores/authStore';
import { authService } from '../api/services';

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
      if (__DEV__) {
        console.warn('[SessionManager] No refresh token available or not authenticated');
      }
      this.handleSessionExpired();
      return;
    }

    try {
      const response = await authService.refreshToken({ refreshToken });

      useAuthStore.setState({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });

      if (response.expiresAt) {
        this.scheduleTokenRefresh(response.expiresAt);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[SessionManager] Token refresh failed:', error);
      }
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

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken();
      }, refreshTime);
    } else {
      // Token is already expired or expires very soon
      this.refreshToken();
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
   * Check if passcode session is expired
   */
  static isPasscodeSessionExpired(): boolean {
    const { checkPasscodeSessionExpiry } = useAuthStore.getState();
    return checkPasscodeSessionExpiry();
  }

  /**
   * Schedule passcode session expiration check
   * Passcode session lasts 10 minutes
   */
  static schedulePasscodeSessionExpiry(expiresAt: string): void {
    // Clear existing timer
    if (this.passcodeSessionTimer) {
      clearTimeout(this.passcodeSessionTimer);
      this.passcodeSessionTimer = null;
    }

    const timeUntilExpiry = this.getTimeUntilExpiry(expiresAt);

    if (timeUntilExpiry > 0) {
      this.passcodeSessionTimer = setTimeout(() => {
        this.handlePasscodeSessionExpired();
      }, timeUntilExpiry);
    } else {
      // Passcode session is already expired
      this.handlePasscodeSessionExpired();
    }
  }

  /**
   * Initialize session management
   * Call this on app start
   */
  static initialize(): void {
    if (this.initialized) {
      return;
    }

    const state = useAuthStore.getState();
    const {
      accessToken,
      refreshToken,
      isAuthenticated,
      passcodeSessionExpiresAt,
      checkTokenExpiry,
      user,
    } = state;
    if (!isAuthenticated || !accessToken || !refreshToken) {
      return;
    }

    // Check if 7-day token has expired
    if (checkTokenExpiry()) {
      this.handleSessionExpired();
      return;
    }

    // Check if passcode session has expired
    if (passcodeSessionExpiresAt) {
      if (this.isPasscodeSessionExpired()) {
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
  }

  /**
   * Schedule periodic health check
   */
  private static scheduleHealthCheck(): void {
    // Check session health every 30 minutes for token expiry only
    const CHECK_INTERVAL = 30 * 60 * 1000;

    setTimeout(() => {
      const { isAuthenticated, accessToken, checkTokenExpiry } = useAuthStore.getState();

      if (isAuthenticated && accessToken) {
        // Check if 7-day token has expired
        if (checkTokenExpiry()) {
          this.handleSessionExpired();
          return;
        }

        // Attempt to refresh token to ensure it's still valid
        this.refreshToken();
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
