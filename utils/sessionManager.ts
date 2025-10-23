/**
 * Session Manager
 * Handles token refresh, expiry checks, and session lifecycle
 */

import { useAuthStore } from '../stores/authStore';
import { authService } from '../api/services';

export class SessionManager {
  private static refreshTimer: NodeJS.Timeout | null = null;
  private static initialized = false;

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
    const { refreshToken } = useAuthStore.getState();
    
    if (!refreshToken) {
      console.warn('[SessionManager] No refresh token available');
      this.handleSessionExpired();
      return;
    }

    try {
      console.log('[SessionManager] Refreshing access token...');
      const response = await authService.refreshToken({ refreshToken });
      
      useAuthStore.setState({
        accessToken: response.token,
        refreshToken: response.refreshToken,
      });

      console.log('[SessionManager] Token refreshed successfully');
      
      // Schedule next refresh
      this.scheduleTokenRefresh(response.expiresAt);
    } catch (error) {
      console.error('[SessionManager] Token refresh failed:', error);
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
      console.log(
        `[SessionManager] Scheduling token refresh in ${Math.round(refreshTime / 1000 / 60)} minutes`
      );
      
      this.refreshTimer = setTimeout(() => {
        this.refreshToken();
      }, refreshTime);
    } else {
      // Token is already expired or expires very soon
      console.log('[SessionManager] Token expired or expiring soon, refreshing immediately');
      this.refreshToken();
    }
  }

  /**
   * Handle session expiration
   */
  private static handleSessionExpired(): void {
    console.log('[SessionManager] Session expired, logging out user');
    
    // Clear any refresh timers
    this.cleanup();
    
    // Logout user
    const { logout } = useAuthStore.getState();
    logout();
  }

  /**
   * Initialize session management
   * Call this on app start
   */
  static initialize(): void {
    if (this.initialized) {
      console.log('[SessionManager] Already initialized');
      return;
    }

    const { accessToken, refreshToken, isAuthenticated } = useAuthStore.getState();
    
    if (!isAuthenticated || !accessToken || !refreshToken) {
      console.log('[SessionManager] No active session to initialize');
      return;
    }

    console.log('[SessionManager] Initializing session management');
    
    // Since we don't have expiresAt in store, we'll handle it in the API client
    // For now, schedule a check in 10 minutes
    this.scheduleHealthCheck();
    
    this.initialized = true;
  }

  /**
   * Schedule periodic health check
   */
  private static scheduleHealthCheck(): void {
    // Check session health every 10 minutes
    const CHECK_INTERVAL = 10 * 60 * 1000;
    
    setTimeout(() => {
      const { isAuthenticated, accessToken } = useAuthStore.getState();
      
      if (isAuthenticated && accessToken) {
        console.log('[SessionManager] Running session health check');
        // Attempt to refresh token to ensure it's still valid
        this.refreshToken();
      }
    }, CHECK_INTERVAL);
  }

  /**
   * Cleanup and reset session manager
   */
  static cleanup(): void {
    console.log('[SessionManager] Cleaning up');
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
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

// Auto-initialize on module load if there's an active session
if (typeof window !== 'undefined') {
  // Wait for store to hydrate from localStorage
  setTimeout(() => {
    SessionManager.initialize();
  }, 100);
}

export default SessionManager;
