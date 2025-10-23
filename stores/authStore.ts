import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  emailVerified: boolean;
  phoneVerified?: boolean;
  kycStatus?: 'pending' | 'processing' | 'approved' | 'rejected' | 'expired';
  onboardingStatus?: 'pending' | 'started' | 'kyc_pending' | 'kyc_processing' | 'kyc_rejected' | 'completed';
  hasPasscode?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  // User & Session
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  
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
  hasCompletedOnboarding: false,
  onboardingStatus: null,
  currentOnboardingStep: null,
  pendingVerificationEmail: null,
  hasPasscode: false,
  isBiometricEnabled: false,
  passcodeSessionToken: undefined,
  passcodeSessionExpiresAt: undefined,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Authentication
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Replace with actual API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock successful login
          const mockUser: User = {
            id: '1',
            email,
            fullName: 'John Doe',
            emailVerified: true,
          };
          
          set({
            user: mockUser,
            isAuthenticated: true,
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          // TODO: Replace with actual API call to invalidate tokens
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Clear all auth state on logout
          set({
            ...initialState,
            // Reset the store completely
            hasPasscode: false,
            hasCompletedOnboarding: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Logout failed',
            isLoading: false,
          });
        }
      },

      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Replace with actual API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const mockUser: User = {
            id: '1',
            email,
            fullName: name,
            emailVerified: false,
          };
          
          set({
            user: mockUser,
            isAuthenticated: true,
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
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
          // TODO: Replace with actual API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set({
            accessToken: 'new-mock-access-token',
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Session refresh failed',
            isLoading: false,
          });
          // If refresh fails, logout
          get().logout();
        }
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },

      // State Management
      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken, isAuthenticated: true });
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
        // TODO: Securely store passcode
        set({ hasPasscode: true });
      },

      verifyPasscode: async (passcode: string) => {
        // TODO: Verify against stored passcode
        return true;
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
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        hasPasscode: state.hasPasscode,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        isBiometricEnabled: state.isBiometricEnabled,
        isAuthenticated: state.isAuthenticated,
        onboardingStatus: state.onboardingStatus,
        pendingVerificationEmail: state.pendingVerificationEmail,
        passcodeSessionToken: state.passcodeSessionToken,
        passcodeSessionExpiresAt: state.passcodeSessionExpiresAt,
      }),
    }
  )
);
