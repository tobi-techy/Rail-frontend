import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, passcodeService } from '../api/services';
import type { User as ApiUser } from '../api/types';
import gleap from '@/utils/gleap';
import { secureStorage } from '../utils/secureStorage';
import { safeError, sanitizeForLog } from '../utils/logSanitizer';
import { isAuthSessionInvalidError } from '../utils/authErrorClassifier';
import { logger } from '../lib/logger';
import {
  INACTIVITY_LIMIT_MS,
  PASSCODE_SESSION_MS,
  SESSION_DURATION_MS,
} from '../utils/sessionConstants';

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;
const SECURE_VALUE_PLACEHOLDER = '__secure__';
const SENSITIVE_KEYS = ['accessToken', 'refreshToken', 'passcodeSessionToken'] as const;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async <T>(operation: () => Promise<T>, retries = MAX_RETRIES): Promise<T> => {
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

const nowIso = () => new Date().toISOString();
const sessionExpiry = (from = Date.now()) => new Date(from + SESSION_DURATION_MS).toISOString();

// ── Types ─────────────────────────────────────────────────────────────────────

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
  authMethod: 'password' | 'passkey';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  csrfToken: string | null;
  lastActivityAt: string | null;
  tokenIssuedAt: string | null;
  tokenExpiresAt: string | null;
  hasCompletedOnboarding: boolean;
  hasAcknowledgedDisclaimer: boolean;
  onboardingStatus: string | null;
  currentOnboardingStep: string | null;
  registrationData: RegistrationData;
  pendingVerificationEmail: string | null;
  hasPasscode: boolean;
  isBiometricEnabled: boolean;
  passcodeSessionToken?: string;
  passcodeSessionExpiresAt?: string;
  loginAttempts: number;
  lockoutUntil: string | null;
  _pendingPasscode: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (reason?: string) => Promise<{ funds_swept: string; sweep_tx_hash?: string }>;
  register: (email: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  updateLastActivity: () => void;
  checkTokenExpiry: () => boolean;
  clearExpiredSession: () => void;
  clearPasscodeSession: () => void;
  checkPasscodeSessionExpiry: () => boolean;
  setPasscodeSession: (token: string, expiresAt: string) => void;
  setPasscode: (passcode: string) => Promise<void>;
  verifyPasscode: (passcode: string) => Promise<boolean>;
  enableBiometric: () => void;
  disableBiometric: () => void;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setPendingEmail: (email: string | null) => void;
  setOnboardingStatus: (status: string, step?: string) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  setHasAcknowledgedDisclaimer: (acknowledged: boolean) => void;
  setHasPasscode: (hasPasscode: boolean) => void;
  updateRegistrationData: (data: Partial<RegistrationData>) => void;
  clearRegistrationData: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
  clearSession: () => void;
}

// ── Initial state ─────────────────────────────────────────────────────────────

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  csrfToken: null,
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
    authMethod: 'password',
  },
};

// ── Secure storage adapter ────────────────────────────────────────────────────

const createSecureStorage = () => ({
  getItem: async (name: string) => {
    try {
      const data = await withRetry(() => AsyncStorage.getItem(name));
      if (!data) return null;
      const parsed = JSON.parse(data);
      if (!parsed || typeof parsed !== 'object') return null;
      const [accessToken, refreshToken, passcodeSessionToken] = await Promise.all([
        withRetry(() => secureStorage.getItem(`${name}_accessToken`)),
        withRetry(() => secureStorage.getItem(`${name}_refreshToken`)),
        withRetry(() => secureStorage.getItem(`${name}_passcodeSessionToken`)),
      ]);
      parsed.accessToken = accessToken ?? null;
      parsed.refreshToken = refreshToken ?? null;
      parsed.passcodeSessionToken = passcodeSessionToken ?? undefined;
      return parsed;
    } catch (error) {
      safeError('[SecureStorage] getItem error:', error);
      return null;
    }
  },
  setItem: async (name: string, value: Record<string, unknown>) => {
    try {
      const toStore = { ...value };
      for (const key of SENSITIVE_KEYS) {
        const secureKey = `${name}_${key}`;
        const keyValue = toStore[key];
        if (typeof keyValue === 'string' && keyValue.length > 0) {
          await withRetry(() => secureStorage.setItem(secureKey, keyValue));
          toStore[key] = SECURE_VALUE_PLACEHOLDER;
        } else {
          await secureStorage.deleteItem(secureKey);
          toStore[key] = key === 'passcodeSessionToken' ? undefined : null;
        }
      }
      await withRetry(() => AsyncStorage.setItem(name, JSON.stringify(toStore)));
    } catch (error) {
      safeError('[SecureStorage] setItem error:', error);
      throw error;
    }
  },
  removeItem: async (name: string) => {
    try {
      await withRetry(() => AsyncStorage.removeItem(name));
      await Promise.all(SENSITIVE_KEYS.map((k) => secureStorage.deleteItem(`${name}_${k}`)));
    } catch (error) {
      safeError('[SecureStorage] removeItem error:', error);
    }
  },
});

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: async (email, password) => {
        if (!email || !password) {
          const msg = 'Email and password are required';
          set({ error: msg, isLoading: false });
          throw new Error(msg);
        }
        const { lockoutUntil } = get();
        if (lockoutUntil && new Date(lockoutUntil) > new Date()) {
          const mins = Math.ceil((new Date(lockoutUntil).getTime() - Date.now()) / 60000);
          const msg = `Account locked. Try again in ${mins} minute(s)`;
          set({ error: msg, isLoading: false });
          throw new Error(msg);
        }
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login({ email, password });
          if (!response.user || !response.accessToken || !response.refreshToken) {
            throw new Error('Invalid response from authentication service');
          }
          const expiresAt = response.sessionExpiresAt
            ? new Date(response.sessionExpiresAt).toISOString()
            : sessionExpiry();
          set({
            user: response.user,
            isAuthenticated: true,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            csrfToken: response.csrfToken || null,
            onboardingStatus: response.user.onboardingStatus || null,
            hasPasscode: false,
            lastActivityAt: nowIso(),
            tokenIssuedAt: nowIso(),
            tokenExpiresAt: expiresAt,
            loginAttempts: 0,
            lockoutUntil: null,
            isLoading: false,
          });
          gleap.identifyContact(response.user.id, {
            email: response.user.email,
            name: response.user.firstName
              ? `${response.user.firstName} ${response.user.lastName ?? ''}`.trim()
              : undefined,
          });
        } catch (error: any) {
          safeError('[AuthStore] Login failed:', error);
          const attempts = get().loginAttempts + 1;
          set({
            loginAttempts: attempts,
            lockoutUntil:
              attempts >= MAX_LOGIN_ATTEMPTS
                ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString()
                : null,
            error: sanitizeForLog(
              error?.error?.message ||
                error?.message ||
                'Login failed. Please check your credentials.'
            ),
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        let logoutFailed = false;
        try {
          await authService.logout();
        } catch (error) {
          logoutFailed = true;
          logger.error('[AuthStore] Backend logout failed', {
            component: 'AuthStore',
            action: 'logout-api-error',
            error: error instanceof Error ? error.message : String(error),
          });
        }
        try {
          const { cleanup } = await import('../utils/sessionManager').then((m) => ({
            cleanup: m.default.cleanup,
          }));
          cleanup();
        } catch (e) {
          logger.warn('[AuthStore] SessionManager cleanup failed', {
            component: 'AuthStore',
            action: 'session-manager-cleanup-error',
            error: e instanceof Error ? e.message : String(e),
          });
        }
        try {
          const { default: csrfTokenService } = await import('../utils/csrfToken');
          await csrfTokenService.clear();
        } catch (e) {
          logger.warn('[AuthStore] CSRF token cleanup failed', {
            component: 'AuthStore',
            action: 'csrf-cleanup-error',
            error: e instanceof Error ? e.message : String(e),
          });
        }
        set({
          ...initialState,
          hasPasscode: false,
          hasCompletedOnboarding: false,
          isLoading: false,
        });
        gleap.clearIdentity();
        logger[logoutFailed ? 'warn' : 'info'](
          `[AuthStore] Logout ${logoutFailed ? 'completed with backend failure' : 'completed successfully'}`,
          {
            component: 'AuthStore',
            action: logoutFailed ? 'logout-partial-success' : 'logout-success',
          }
        );
      },

      deleteAccount: async (reason?) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.deleteAccount(reason);
          set({ ...initialState, hasPasscode: false, hasCompletedOnboarding: false });
          return { funds_swept: response.funds_swept, sweep_tx_hash: response.sweep_tx_hash };
        } catch (error: any) {
          safeError('[AuthStore] Delete account failed:', error);
          set({ error: error?.message || 'Failed to delete account', isLoading: false });
          throw error;
        }
      },

      register: async (email) => {
        if (!email) {
          set({ error: 'Email is required', isLoading: false });
          throw new Error('Email is required');
        }
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register({ email });
          set({
            pendingVerificationEmail: email || response.identifier,
            isAuthenticated: false,
            user: null,
            isLoading: false,
          });
        } catch (error: any) {
          safeError('[AuthStore] Registration failed:', error);
          set({
            error: sanitizeForLog(
              error?.error?.message || error?.message || 'Registration failed. Please try again.'
            ),
            isLoading: false,
          });
          throw error;
        }
      },

      refreshSession: async () => {
        const { refreshToken } = get();
        if (!refreshToken) throw new Error('No refresh token available');
        set({ isLoading: true });

        const applyTokens = (
          response: {
            accessToken: string;
            refreshToken: string;
            expiresAt: string;
            csrfToken?: string;
          },
          fallbackToken: string
        ) => {
          const now = Date.now();
          const nextExpiry = Math.max(
            get().tokenExpiresAt ? new Date(get().tokenExpiresAt!).getTime() : 0,
            response.expiresAt ? new Date(response.expiresAt).getTime() : 0,
            now + INACTIVITY_LIMIT_MS
          );
          set({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken || fallbackToken,
            csrfToken: response.csrfToken || get().csrfToken,
            isAuthenticated: true,
            lastActivityAt: new Date(now).toISOString(),
            tokenExpiresAt: new Date(nextExpiry).toISOString(),
            error: null,
            isLoading: false,
          });
        };

        try {
          applyTokens(await authService.refreshToken({ refreshToken }), refreshToken);
        } catch (error) {
          const latestToken = get().refreshToken;
          const tokenRotated = !!latestToken && latestToken !== refreshToken;

          if (isAuthSessionInvalidError(error) && tokenRotated) {
            logger.warn('[AuthStore] Refresh token rotated during refresh; retrying', {
              component: 'AuthStore',
              action: 'refresh-token-rotated-retry',
            });
            try {
              applyTokens(
                await authService.refreshToken({ refreshToken: latestToken! }),
                latestToken!
              );
              return;
            } catch (retryError) {
              set({
                error: retryError instanceof Error ? retryError.message : 'Session refresh failed',
                isLoading: false,
              });
              if (isAuthSessionInvalidError(retryError)) get().logout();
              throw retryError;
            }
          }

          set({
            error: error instanceof Error ? error.message : 'Session refresh failed',
            isLoading: false,
          });
          if (isAuthSessionInvalidError(error)) {
            logger.warn('[AuthStore] Session refresh rejected; logging out', {
              component: 'AuthStore',
              action: 'refresh-auth-invalid',
            });
            get().logout();
          }
          throw error;
        }
      },

      updateUser: (userData) => {
        const { user } = get();
        if (user) set({ user: { ...user, ...userData } });
      },

      updateLastActivity: () => {
        const now = Date.now();
        const currentExpiry = get().tokenExpiresAt ? new Date(get().tokenExpiresAt!).getTime() : 0;
        set({
          lastActivityAt: new Date(now).toISOString(),
          tokenExpiresAt: new Date(
            Math.max(currentExpiry, now + INACTIVITY_LIMIT_MS)
          ).toISOString(),
        });
      },

      checkTokenExpiry: () => {
        const { tokenExpiresAt, isAuthenticated, lastActivityAt } = get();
        if (!isAuthenticated) return false;
        const now = Date.now();
        if (lastActivityAt && now - new Date(lastActivityAt).getTime() >= INACTIVITY_LIMIT_MS)
          return true;
        if (!tokenExpiresAt) return true;
        return now >= new Date(tokenExpiresAt).getTime();
      },

      clearExpiredSession: () =>
        set({
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          csrfToken: null,
          lastActivityAt: null,
          tokenIssuedAt: null,
          tokenExpiresAt: null,
          passcodeSessionToken: undefined,
          passcodeSessionExpiresAt: undefined,
        }),

      clearPasscodeSession: () =>
        set({ passcodeSessionToken: undefined, passcodeSessionExpiresAt: undefined }),

      checkPasscodeSessionExpiry: () => {
        const { passcodeSessionToken, passcodeSessionExpiresAt, isAuthenticated, lastActivityAt } =
          get();
        if (!isAuthenticated) return false;
        if (!passcodeSessionToken || !passcodeSessionExpiresAt) return true;
        if (
          lastActivityAt &&
          Date.now() - new Date(lastActivityAt).getTime() >= PASSCODE_SESSION_MS
        )
          return true;
        try {
          const expiry = new Date(passcodeSessionExpiresAt).getTime();
          if (isNaN(expiry)) return true;
          // Guard against suspicious clock skew (>15 min in future)
          if (expiry > Date.now() + 15 * 60 * 1000) return true;
          return Date.now() >= expiry;
        } catch {
          return true;
        }
      },

      setPasscodeSession: (token, expiresAt) =>
        set({ passcodeSessionToken: token, passcodeSessionExpiresAt: expiresAt }),

      setUser: (user) => set({ user, isAuthenticated: true }),

      setTokens: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
          lastActivityAt: nowIso(),
          tokenIssuedAt: nowIso(),
          tokenExpiresAt: sessionExpiry(),
        }),

      setPendingEmail: (email) => set({ pendingVerificationEmail: email }),
      setOnboardingStatus: (status, step?) =>
        set({ onboardingStatus: status, currentOnboardingStep: step || null }),
      setHasCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }),
      setHasAcknowledgedDisclaimer: (acknowledged) =>
        set({ hasAcknowledgedDisclaimer: acknowledged }),
      setHasPasscode: (hasPasscode) => set({ hasPasscode }),

      updateRegistrationData: (data) =>
        set((s) => ({ registrationData: { ...s.registrationData, ...data } })),
      clearRegistrationData: () => set({ registrationData: initialState.registrationData }),

      setPasscode: async (passcode) => {
        try {
          await passcodeService.createPasscode({ passcode, confirmPasscode: passcode });
          set({ hasPasscode: true });
        } catch (error) {
          safeError('[AuthStore] Failed to set passcode:', error);
          throw error;
        }
      },

      verifyPasscode: async (passcode) => {
        try {
          const response = await passcodeService.verifyPasscode({ passcode });
          if (response.verified) {
            const expiresAt = response.sessionExpiresAt
              ? new Date(response.sessionExpiresAt).toISOString()
              : sessionExpiry();
            set({
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              isAuthenticated: true,
              lastActivityAt: nowIso(),
              tokenIssuedAt: nowIso(),
              tokenExpiresAt: expiresAt,
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

      enableBiometric: () => set({ isBiometricEnabled: true }),
      disableBiometric: () => set({ isBiometricEnabled: false }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      reset: () => set(initialState),

      clearSession: () =>
        set({
          accessToken: null,
          refreshToken: null,
          csrfToken: null,
          isAuthenticated: false,
          tokenIssuedAt: null,
          tokenExpiresAt: null,
          lastActivityAt: null,
          passcodeSessionToken: undefined,
          passcodeSessionExpiresAt: undefined,
          error: null,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createSecureStorage(),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        csrfToken: state.csrfToken,
        lastActivityAt: state.lastActivityAt,
        tokenIssuedAt: state.tokenIssuedAt,
        tokenExpiresAt: state.tokenExpiresAt,
        isAuthenticated: state.isAuthenticated,
        hasPasscode: state.hasPasscode,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        onboardingStatus: state.onboardingStatus,
        currentOnboardingStep: state.currentOnboardingStep,
        pendingVerificationEmail: state.pendingVerificationEmail,
        registrationData: { ...state.registrationData, password: '' },
        isBiometricEnabled: state.isBiometricEnabled,
        passcodeSessionToken: state.passcodeSessionToken,
        passcodeSessionExpiresAt: state.passcodeSessionExpiresAt,
        loginAttempts: state.loginAttempts,
        lockoutUntil: state.lockoutUntil,
        hasAcknowledgedDisclaimer: state.hasAcknowledgedDisclaimer,
        isLoading: state.isLoading,
        error: state.error,
      }),
    }
  )
);
