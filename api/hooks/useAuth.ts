/**
 * Authentication Hooks
 * React Query hooks for authentication operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as AppleAuthentication from 'expo-apple-authentication';
import { authService, passcodeService } from '../services';
import { queryKeys, invalidateQueries } from '../queryClient';
import { useAuthStore } from '../../stores/authStore';
import type {
  LoginRequest,
  RegisterRequest,
  VerifyCodeRequest,
  ResendCodeRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../types';

const TOKEN_EXPIRY_DAYS = 7;

const getTokenExpiryIso = (expiresAt?: string): string => {
  if (expiresAt) return new Date(expiresAt).toISOString();

  const now = new Date();
  return new Date(now.getTime() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
};

const syncPasscodeStatus = async () => {
  try {
    const status = await passcodeService.getStatus();
    useAuthStore.setState({ hasPasscode: Boolean(status.enabled) });
  } catch {
    useAuthStore.setState({ hasPasscode: false });
  }
};

/**
 * Login mutation
 */
export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: async (response) => {
      const nowIso = new Date().toISOString();

      // Update auth store with response data
      useAuthStore.setState({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
        pendingVerificationEmail: null,
        onboardingStatus: response.user.onboardingStatus || null,
        lastActivityAt: nowIso,
        tokenIssuedAt: nowIso,
        tokenExpiresAt: getTokenExpiryIso(response.expiresAt),
      });

      await syncPasscodeStatus();

      // Invalidate and refetch relevant queries
      invalidateQueries.auth();
      invalidateQueries.wallet();
      invalidateQueries.user();
    },
  });
}

/**
 * Register mutation
 * IMPORTANT: Does NOT set isAuthenticated - user must verify email first
 */
export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: (response, variables) => {
      // Store pending identifier (email or phone) for verification
      // DO NOT set isAuthenticated or user yet - wait for verification
      useAuthStore.setState({
        pendingVerificationEmail: variables.email || variables.phone || response.identifier,
        isAuthenticated: false, // Explicitly ensure not authenticated
        user: null, // No user object until verified
      });
    },
  });
}

/**
 * Verify email code mutation
 */
export function useVerifyCode() {
  const DEFAULT_ONBOARDING_STATUS = 'started';

  return useMutation({
    mutationFn: (data: VerifyCodeRequest) => authService.verifyCode(data),
    onSuccess: (response) => {
      if (!response.user || !response.accessToken) {
        useAuthStore.setState({ pendingVerificationEmail: null });
        return;
      }

      const now = new Date();
      const tokenExpiresAt = getTokenExpiryIso(response.expiresAt);
      const refreshToken = response.refreshToken || useAuthStore.getState().refreshToken;

      useAuthStore.setState({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: refreshToken || null,
        isAuthenticated: true,
        pendingVerificationEmail: null,
        onboardingStatus:
          response.onboarding_status || response.user.onboardingStatus || DEFAULT_ONBOARDING_STATUS,
        currentOnboardingStep: response.onboarding?.currentStep ?? null,
        lastActivityAt: now.toISOString(),
        tokenIssuedAt: now.toISOString(),
        tokenExpiresAt,
      });

      void syncPasscodeStatus();
    },
  });
}

/**
 * Resend verification code mutation
 */
export function useResendCode() {
  return useMutation({
    mutationFn: (data: ResendCodeRequest) => authService.resendCode(data),
  });
}

/**
 * Logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Clear auth store
      useAuthStore.getState().reset();

      // Clear all cached data
      queryClient.clear();
    },
  });
}

/**
 * Forgot password mutation
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authService.forgotPassword(data),
  });
}

/**
 * Reset password mutation
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => authService.resetPassword(data),
  });
}

/**
 * Get current user query
 */
export function useCurrentUser() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => authService.getCurrentUser(),
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Apple Sign-In mutation
 */
export function useAppleSignIn() {
  return useMutation({
    mutationFn: async () => {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('Apple identity token missing');
      }

      return authService.socialLogin({
        provider: 'apple',
        idToken: credential.identityToken,
        givenName: credential.fullName?.givenName ?? undefined,
        familyName: credential.fullName?.familyName ?? undefined,
      });
    },
    onSuccess: async (response) => {
      const nowIso = new Date().toISOString();

      useAuthStore.setState({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
        pendingVerificationEmail: null,
        onboardingStatus: response.user.onboardingStatus || null,
        lastActivityAt: nowIso,
        tokenIssuedAt: nowIso,
        tokenExpiresAt: response.expiresAt,
      });

      await syncPasscodeStatus();

      invalidateQueries.auth();
      invalidateQueries.wallet();
      invalidateQueries.user();
    },
  });
}
