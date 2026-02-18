import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, passcodeService } from '../api/services';
import type { User as ApiUser } from '../api/types';
import { secureStorage } from '../utils/secureStorage';
import { safeError, sanitizeForLog } from '../utils/logSanitizer';
import { logger } from '../lib/logger';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async <T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      await sleep(RETRY_DELAY_MS);
      return withRetry(operation, retries - 1);
    }
    throw error;
  }
};

// Extend the API User type with additional local fields
export interface User extends Omit<ApiUser, 'phone'> {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface RegistrationData {
  firstName: string;
  lastName: string;
  dob: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  password: string;
}

interface AuthState {
  // User & Session
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  lastActivityAt: string | null; // Track last user activity for session timeout
  tokenIssuedAt: string | null; // Track when token was issued (for 7-day expiry)
  tokenExpiresAt: string | null; // Track when token expires (7 days from issuance)

  // Onboarding State
  hasCompletedOnboarding: boolean;
  hasAcknowledgedDisclaimer: boolean;
  onboardingStatus: string | null;
  currentOnboardingStep: string | null;
  registrationData: RegistrationData;

  // Email Verification
  pendingVerificationEmail: string | null;

  // Passcode/Biometric
  hasPasscode: boolean;
  isBiometricEnabled: boolean;
  passcodeSessionToken?: string;
  passcodeSessionExpiresAt?: string;

  // Security
  loginAttempts: number;
  lockoutUntil: string | null;

  // Temp (not persisted)
  _pendingPasscode: string | null;

  // Loading & Error
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  // Authentication
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (reason?: string) => Promise<{ funds_swept: string; sweep_tx_hash?: string }>;
  register: (email: string) => Promise<void>;

  // Session management
  refreshSession: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  updateLastActivity: () => void;
  checkTokenExpiry: () => boolean; // Check if 7-day token has expired
  clearExpiredSession: () => void; // Clear session if 7-day token expired

  // Passcode session management
  clearPasscodeSession: () => void;
  checkPasscodeSessionExpiry: () => boolean;
  setPasscodeSession: (token: string, expiresAt: string) => void;

  // Passcode/Biometric
  setPasscode: (passcode: string) => Promise<void>;
  verifyPasscode: (passcode: string) => Promise<boolean>;
  enableBiometric: () => void;
  disableBiometric: () => void;

  // State Management
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setPendingEmail: (email: string | null) => void;
  setOnboardingStatus: (status: string, step?: string) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  setHasAcknowledgedDisclaimer: (acknowledged: boolean) => void;
  setHasPasscode: (hasPasscode: boolean) => void;

  // Registration Flow
  updateRegistrationData: (data: Partial<RegistrationData>) => void;
  clearRegistrationData: () => void;

  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;

  // Reset
  reset: () => void;
  /** Clear tokens/session but keep user identity so app routes to login-passcode */
  clearSession: () => void;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  lastActivityAt: null,
  tokenIssuedAt: null,
  tokenExpiresAt: null,
  hasCompletedOnboarding: false,
  hasAcknowledgedDisclaimer: false,
  onboardingStatus: null,
  currentOnboardingStep: null,
  pendingVerificationEmail: null,
  hasPasscode: false,
  isBiometricEnabled: false,
  passcodeSessionToken: undefined,
  passcodeSessionExpiresAt: undefined,
  loginAttempts: 0,
  lockoutUntil: null,
  _pendingPasscode: null,
  isLoading: false,
  error: null,
  registrationData: {
    firstName: '',
    lastName: '',
    dob: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phone: '',
    password: '',
  },
};

// Custom storage adapter that uses SecureStore for sensitive data
const createSecureStorage = () => ({
  getItem: async (name: string) => {
    try {
      const data = await withRetry(() => AsyncStorage.getItem(name));
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.accessToken) {
          parsed.accessToken = await withRetry(() => secureStorage.getItem(`${name}_accessToken`));
        }
        if (parsed.refreshToken) {
          parsed.refreshToken = await withRetry(() =>
            secureStorage.getItem(`${name}_refreshToken`)
          );
        }
        if (parsed.passcodeSessionToken) {
          parsed.passcodeSessionToken = await withRetry(() =>
            secureStorage.getItem(`${name}_passcodeSessionToken`)
          );
        }
        return parsed;
      }
      return null;
    } catch (error) {
      safeError('[SecureStorage] getItem error:', error);
      return null;
    }
  },
  setItem: async (name: string, value: any) => {
    try {
      const sensitiveKeys = ['accessToken', 'refreshToken', 'passcodeSessionToken'];
      const sensitiveData: Record<string, string> = {};

      for (const key of sensitiveKeys) {
        if (value[key]) {
          sensitiveData[key] = value[key];
          delete value[key];
        }
      }

      await withRetry(() => AsyncStorage.setItem(name, JSON.stringify(value)));

      for (const [key, val] of Object.entries(sensitiveData)) {
        await withRetry(() => secureStorage.setItem(`${name}_${key}`, val));
      }
    } catch (error) {
      safeError('[SecureStorage] setItem error:', error);
      throw error;
    }
  },
  removeItem: async (name: string) => {
    try {
      await withRetry(() => AsyncStorage.removeItem(name));
      await secureStorage.deleteItem(`${name}_accessToken`);
      await secureStorage.deleteItem(`${name}_refreshToken`);
      await secureStorage.deleteItem(`${name}_passcodeSessionToken`);
    } catch (error) {
      safeError('[SecureStorage] removeItem error:', error);
    }
  },
});

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Authentication
      login: async (email: string, password: string) => {
        // Validate inputs
        if (!email || !password) {
          const error = new Error('Email and password are required');
          set({ error: error.message, isLoading: false });
          throw error;
        }

        // Check if account is locked
        const { lockoutUntil } = get();
        if (lockoutUntil && new Date(lockoutUntil) > new Date()) {
          const remainingMinutes = Math.ceil(
            (new Date(lockoutUntil).getTime() - Date.now()) / 60000
          );
          const error = new Error(`Account locked. Try again in ${remainingMinutes} minute(s)`);
          set({ error: error.message, isLoading: false });
          throw error;
        }

        set({ isLoading: true, error: null });
        try {
          const response = await authService.login({ email, password });

          if (!response.user || !response.accessToken || !response.refreshToken) {
            throw new Error('Invalid response from authentication service');
          }

          const now = new Date();
          const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

          set({
            user: response.user,
            isAuthenticated: true,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            onboardingStatus: response.user.onboardingStatus || null,
            // Passcode status is fetched from /v1/security/passcode, not user payload.
            hasPasscode: false,
            lastActivityAt: now.toISOString(),
            tokenIssuedAt: now.toISOString(),
            tokenExpiresAt: response.expiresAt || expiresAt.toISOString(),
            loginAttempts: 0, // Reset on successful login
            lockoutUntil: null,
            isLoading: false,
          });
        } catch (error: any) {
          safeError('[AuthStore] Login failed:', error);

          // Increment failed attempts
          const currentAttempts = get().loginAttempts;
          const newAttempts = currentAttempts + 1;
          let lockoutUntil = null;

          if (newAttempts >= 5) {
            // Lock out for 15 minutes after 5 failed attempts
            lockoutUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
            set({ loginAttempts: newAttempts, lockoutUntil });
          } else {
            set({ loginAttempts: newAttempts });
          }

          // SECURITY: Sanitize error message before storing in state
          const rawErrorMessage =
            error?.error?.message ||
            error?.message ||
            'Login failed. Please check your credentials.';
          const errorMessage = sanitizeForLog(rawErrorMessage);

          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          // Call API to invalidate tokens on server
          await authService.logout().catch(() => {
            // Ignore errors - still clear local state
          });

          // Clear all auth state on logout
          set({
            ...initialState,
            hasPasscode: false,
            hasCompletedOnboarding: false,
          });
        } catch (error) {
          // Even if logout fails, clear local state
          set({
            ...initialState,
            hasPasscode: false,
            hasCompletedOnboarding: false,
            error: error instanceof Error ? error.message : 'Logout failed',
          });
        }
      },

      deleteAccount: async (reason?: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.deleteAccount(reason);

          // Clear all auth state after successful deletion
          set({
            ...initialState,
            hasPasscode: false,
            hasCompletedOnboarding: false,
          });

          return {
            funds_swept: response.funds_swept,
            sweep_tx_hash: response.sweep_tx_hash,
          };
        } catch (error: any) {
          safeError('[AuthStore] Delete account failed:', error);
          const errorMessage = error?.message || 'Failed to delete account';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      register: async (email: string) => {
        // Validate inputs
        if (!email) {
          const error = new Error('Email is required');
          set({ error: error.message, isLoading: false });
          throw error;
        }

        set({ isLoading: true, error: null });
        try {
          const response = await authService.register({ email });

          if (!response.identifier && !email) {
            throw new Error('Invalid response from registration service');
          }

          // Store pending email but DON'T authenticate yet - user needs to verify
          set({
            pendingVerificationEmail: email || response.identifier,
            isAuthenticated: false,
            user: null,
            isLoading: false,
          });
        } catch (error: any) {
          safeError('[AuthStore] Registration failed:', error);
          // SECURITY: Sanitize error message before storing in state
          const rawErrorMessage =
            error?.error?.message || error?.message || 'Registration failed. Please try again.';
          const errorMessage = sanitizeForLog(rawErrorMessage);
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      // Session management
      refreshSession: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        set({ isLoading: true });
        try {
          const response = await authService.refreshToken({ refreshToken });
          const nextTokenExpiry = response.expiresAt
            ? new Date(response.expiresAt).toISOString()
            : get().tokenExpiresAt;

          set({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken || refreshToken,
            isAuthenticated: true,
            tokenExpiresAt: nextTokenExpiry,
            error: null,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Session refresh failed',
            isLoading: false,
          });
          // If refresh fails, logout user
          get().logout();
          throw error;
        }
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },

      // Session activity tracking
      updateLastActivity: () => {
        set({ lastActivityAt: new Date().toISOString() });
      },

      // Check if 7-day token has expired
      checkTokenExpiry: () => {
        const { tokenExpiresAt, isAuthenticated } = get();

        // If not authenticated, no token to check
        if (!isAuthenticated) return false;

        // If no expiry time set, assume expired
        if (!tokenExpiresAt) return true;

        // Check if 7 days have passed since token issuance
        const expiryTime = new Date(tokenExpiresAt).getTime();
        const now = new Date().getTime();

        return now >= expiryTime;
      },

      // Clear session if 7-day token has expired
      clearExpiredSession: () => {
        set({
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          lastActivityAt: null,
          tokenIssuedAt: null,
          tokenExpiresAt: null,
          passcodeSessionToken: undefined,
          passcodeSessionExpiresAt: undefined,
        });
      },

      // Passcode session management
      clearPasscodeSession: () => {
        // Only clear passcode session tokens, keep access/refresh tokens and isAuthenticated
        // User still has valid 7-day tokens, they just need to verify passcode for UI access
        set({
          passcodeSessionToken: undefined,
          passcodeSessionExpiresAt: undefined,
        });
      },

      checkPasscodeSessionExpiry: () => {
        const { passcodeSessionToken, passcodeSessionExpiresAt, isAuthenticated } = get();

        // If not authenticated, no passcode session to check
        if (!isAuthenticated) return false;

        // If no passcode session token, it's expired/missing
        if (!passcodeSessionToken || !passcodeSessionExpiresAt) return true;

        // SECURITY: Validate passcode session timestamp format and value
        try {
          const expiryTime = new Date(passcodeSessionExpiresAt).getTime();
          const now = new Date().getTime();

          // SECURITY: Check for invalid timestamp (NaN indicates parsing failure)
          if (isNaN(expiryTime)) {
            logger.warn('[AuthStore] Invalid passcode session expiry timestamp', {
              component: 'AuthStore',
              action: 'invalid-expiry',
              expiresAt: passcodeSessionExpiresAt,
            });
            return true; // Treat as expired for security
          }

          // SECURITY: Check for suspicious clock skew (future date beyond 15 minutes)
          const MAX_CLOCK_SKEW = 15 * 60 * 1000; // 15 minute allowance for clock drift
          if (expiryTime > now + MAX_CLOCK_SKEW) {
            logger.warn('[AuthStore] Passcode session expiry timestamp beyond max clock skew', {
              component: 'AuthStore',
              action: 'clock-skew-detected',
              expiryTime,
              now,
              skewMs: expiryTime - now,
              maxAllowed: MAX_CLOCK_SKEW,
            });
            // Cap to 10 minutes from now (actual session duration)
            return now >= expiryTime - (15 * 60 * 1000 - 10 * 60 * 1000);
          }

          // Normal expiry check
          return now >= expiryTime;
        } catch (error) {
          logger.error('[AuthStore] Error checking passcode session expiry', {
            component: 'AuthStore',
            action: 'check-expiry-error',
            error: error instanceof Error ? error.message : String(error),
          });
          // Treat as expired if we can't validate
          return true;
        }
      },

      setPasscodeSession: (token: string, expiresAt: string) => {
        set({
          passcodeSessionToken: token,
          passcodeSessionExpiresAt: expiresAt,
        });
      },

      // State Management
      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
          lastActivityAt: now.toISOString(),
          tokenIssuedAt: now.toISOString(),
          tokenExpiresAt: expiresAt.toISOString(),
        });
      },

      setPendingEmail: (email: string | null) => {
        set({ pendingVerificationEmail: email });
      },

      setOnboardingStatus: (status: string, step?: string) => {
        set({
          onboardingStatus: status,
          currentOnboardingStep: step || null,
        });
      },

      setHasCompletedOnboarding: (completed: boolean) => {
        set({ hasCompletedOnboarding: completed });
      },

      setHasAcknowledgedDisclaimer: (acknowledged: boolean) => {
        set({ hasAcknowledgedDisclaimer: acknowledged });
      },

      setHasPasscode: (hasPasscode: boolean) => {
        set({ hasPasscode });
      },

      updateRegistrationData: (data: Partial<RegistrationData>) => {
        set((state) => ({
          registrationData: { ...state.registrationData, ...data },
        }));
      },

      clearRegistrationData: () => {
        set({
          registrationData: initialState.registrationData,
        });
      },

      // Passcode/Biometric
      setPasscode: async (passcode: string) => {
        try {
          await passcodeService.createPasscode({
            passcode,
            confirmPasscode: passcode,
          });
          set({ hasPasscode: true });
        } catch (error) {
          safeError('[AuthStore] Failed to set passcode:', error);
          throw error;
        }
      },

      verifyPasscode: async (passcode: string) => {
        try {
          const response = await passcodeService.verifyPasscode({ passcode });

          if (response.verified) {
            const now = new Date();
            const tokenExpiresAt = response.expiresAt
              ? new Date(response.expiresAt)
              : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

            set({
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              isAuthenticated: true,
              lastActivityAt: now.toISOString(),
              tokenIssuedAt: now.toISOString(),
              tokenExpiresAt: tokenExpiresAt.toISOString(),
              passcodeSessionToken: response.passcodeSessionToken,
              passcodeSessionExpiresAt: response.passcodeSessionExpiresAt,
            });
          }

          return response.verified;
        } catch (error) {
          safeError('[AuthStore] Failed to verify passcode:', error);
          return false;
        }
      },

      enableBiometric: () => {
        set({ isBiometricEnabled: true });
      },

      disableBiometric: () => {
        set({ isBiometricEnabled: false });
      },

      // Error handling
      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      // Reset
      reset: () => {
        set(initialState);
      },

      clearSession: () => {
        set({
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          tokenIssuedAt: null,
          tokenExpiresAt: null,
          lastActivityAt: null,
          passcodeSessionToken: undefined,
          passcodeSessionExpiresAt: undefined,
          error: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createSecureStorage(),
      partialize: (state) => ({
        // User & Session Data
        user: state.user,
        accessToken: state.accessToken, // Will be stored securely
        refreshToken: state.refreshToken, // Will be stored securely
        lastActivityAt: state.lastActivityAt,
        tokenIssuedAt: state.tokenIssuedAt,
        tokenExpiresAt: state.tokenExpiresAt,
        isAuthenticated: state.isAuthenticated,

        // Onboarding State
        hasPasscode: state.hasPasscode,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        onboardingStatus: state.onboardingStatus,
        currentOnboardingStep: state.currentOnboardingStep,

        // Email Verification
        pendingVerificationEmail: state.pendingVerificationEmail,

        // Registration Data (persist during flow, exclude password)
        registrationData: {
          ...state.registrationData,
          password: '',
        },

        // Passcode/Biometric
        isBiometricEnabled: state.isBiometricEnabled,
        passcodeSessionToken: state.passcodeSessionToken, // Will be stored securely
        passcodeSessionExpiresAt: state.passcodeSessionExpiresAt,

        // Security
        loginAttempts: state.loginAttempts,
        lockoutUntil: state.lockoutUntil,

        // Disclaimer
        hasAcknowledgedDisclaimer: state.hasAcknowledgedDisclaimer,

        // Include loading and error to satisfy type
        isLoading: state.isLoading,
        error: state.error,
      }),
    }
  )
);
