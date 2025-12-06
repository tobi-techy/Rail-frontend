import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, passcodeService } from '../api/services';
import type { User as ApiUser } from '../api/types';
import { secureStorage } from '../utils/secureStorage';
import { safeError } from '../utils/logSanitizer';

// Extend the API User type with additional local fields
export interface User extends Omit<ApiUser, 'phone'> {
  fullName?: string;
  phoneNumber?: string;
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
  onboardingStatus: string | null;
  currentOnboardingStep: string | null;
  
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

  // Loading & Error
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  // Authentication
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  
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
  setHasPasscode: (hasPasscode: boolean) => void;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Reset
  reset: () => void;
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
  onboardingStatus: null,
  currentOnboardingStep: null,
  pendingVerificationEmail: null,
  hasPasscode: false,
  isBiometricEnabled: false,
  passcodeSessionToken: undefined,
  passcodeSessionExpiresAt: undefined,
  loginAttempts: 0,
  lockoutUntil: null,
  isLoading: false,
  error: null,
};

// Custom storage adapter that uses SecureStore for sensitive data
const createSecureStorage = () => ({
  getItem: async (name: string) => {
    try {
      const data = await AsyncStorage.getItem(name);
      if (data) {
        const parsed = JSON.parse(data);
        // Load sensitive data from SecureStore
        if (parsed.accessToken) {
          parsed.accessToken = await secureStorage.getItem(`${name}_accessToken`);
        }
        if (parsed.refreshToken) {
          parsed.refreshToken = await secureStorage.getItem(`${name}_refreshToken`);
        }
        if (parsed.passcodeSessionToken) {
          parsed.passcodeSessionToken = await secureStorage.getItem(`${name}_passcodeSessionToken`);
        }
        return parsed;
      }
      return null;
    } catch (error) {
      console.error('Secure storage getItem parse error:', error);
      return null;
    }
  },
  setItem: async (name: string, value: any) => {
    try {
      // Store sensitive data in SecureStore
      if (value.accessToken) {
        await secureStorage.setItem(`${name}_accessToken`, value.accessToken);
        delete value.accessToken;
      }
      if (value.refreshToken) {
        await secureStorage.setItem(`${name}_refreshToken`, value.refreshToken);
        delete value.refreshToken;
      }
      if (value.passcodeSessionToken) {
        await secureStorage.setItem(`${name}_passcodeSessionToken`, value.passcodeSessionToken);
        delete value.passcodeSessionToken;
      }
      // Store non-sensitive data in AsyncStorage
      await AsyncStorage.setItem(name, JSON.stringify(value));
    } catch (error) {
      console.error('Secure storage setItem parse error:', error);
      // Skip storing if parsing fails to prevent crashes
    }
  },
  removeItem: async (name: string) => {
    try {
      await AsyncStorage.removeItem(name);
      await secureStorage.deleteItem(`${name}_accessToken`);
      await secureStorage.deleteItem(`${name}_refreshToken`);
      await secureStorage.deleteItem(`${name}_passcodeSessionToken`);
    } catch (error) {
      console.error('Secure storage removeItem error:', error);
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
          const remainingMinutes = Math.ceil((new Date(lockoutUntil).getTime() - Date.now()) / 60000);
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
            hasPasscode: response.user.hasPasscode || false,
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

          const errorMessage = error?.error?.message || error?.message || 'Login failed. Please check your credentials.';
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

      register: async (email: string, password: string, name: string) => {
        // Validate inputs
        if (!email || !password) {
          const error = new Error('Email and password are required');
          set({ error: error.message, isLoading: false });
          throw error;
        }

        if (password.length < 8) {
          const error = new Error('Password must be at least 8 characters');
          set({ error: error.message, isLoading: false });
          throw error;
        }

        set({ isLoading: true, error: null });
        try {
          const response = await authService.register({ email, password });
          
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
          const errorMessage = error?.error?.message || error?.message || 'Registration failed. Please try again.';
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
          
          set({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
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
          user: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          lastActivityAt: null,
          tokenIssuedAt: null,
          tokenExpiresAt: null,
          passcodeSessionToken: undefined,
          passcodeSessionExpiresAt: undefined,
          onboardingStatus: null,
          currentOnboardingStep: null,
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
        
        // Check if passcode session has expired (10 mins)
        const expiryTime = new Date(passcodeSessionExpiresAt).getTime();
        const now = new Date().getTime();
        
        return now >= expiryTime;
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

      setHasPasscode: (hasPasscode: boolean) => {
        set({ hasPasscode });
      },

      // Passcode/Biometric
      setPasscode: async (passcode: string) => {
        try {
          await passcodeService.createPasscode({ 
            passcode, 
            confirmPasscode: passcode 
          });
          set({ hasPasscode: true });
        } catch (error) {
          console.error('[AuthStore] Failed to set passcode:', error);
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
              : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
            
            
            // Store authentication tokens and passcode session
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
          console.error('[AuthStore] Failed to verify passcode:', error);
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

        // Passcode/Biometric
        isBiometricEnabled: state.isBiometricEnabled,
        passcodeSessionToken: state.passcodeSessionToken, // Will be stored securely
        passcodeSessionExpiresAt: state.passcodeSessionExpiresAt,

        // Security
        loginAttempts: state.loginAttempts,
        lockoutUntil: state.lockoutUntil,
        
        // Include loading and error to satisfy type
        isLoading: state.isLoading,
        error: state.error,
      }),
    }
  )
);
