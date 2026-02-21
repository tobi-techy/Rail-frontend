/**
 * Authentication Hooks
 * React Query hooks for authentication operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as AppleAuthentication from 'expo-apple-authentication';
import { authService, passcodeService } from '../services';
import { queryKeys, invalidateQueries } from '../queryClient';
import { useAuthStore } from '../../stores/authStore';
import { useAnalytics, ANALYTICS_EVENTS } from '../../utils/analytics';
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
    // Keep the last known state on transient failures to avoid relaxing auth gates.
  }
};

/**
 * After a successful email/password login, grant a passcode session so the user
 * isn't immediately redirected to /login-passcode by useProtectedRoute.
 * The user already proved identity via credentials — requiring passcode again is redundant.
 */
const grantPostLoginPasscodeSession = () => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
  useAuthStore.getState().setPasscodeSession('login-granted', expiresAt.toISOString());
};

/**
 * Login mutation
 */
export function useLogin() {
  const { track, identify } = useAnalytics();

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

      // Grant passcode session BEFORE syncing status so routing doesn't bounce to /login-passcode
      grantPostLoginPasscodeSession();

      await syncPasscodeStatus();

      // Track analytics
      track(ANALYTICS_EVENTS.SIGN_IN_COMPLETED, {
        user_id: response.user.id,
        email: response.user.email,
        onboarding_status: response.user.onboardingStatus,
      });

      // Identify user in PostHog
      if (response.user.id) {
        identify(response.user.id, {
          email: response.user.email,
          first_name: response.user.firstName,
          last_name: response.user.lastName,
        });
      }

      // Invalidate and refetch relevant queries
      invalidateQueries.auth();
      invalidateQueries.wallet();
      invalidateQueries.user();
    },
    onError: (error) => {
      track(ANALYTICS_EVENTS.SIGN_IN_STARTED, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Register mutation
 * IMPORTANT: Does NOT set isAuthenticated - user must verify email first
 */
export function useRegister() {
  const { track } = useAnalytics();

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

      // Track signup started
      track(ANALYTICS_EVENTS.SIGN_UP_STARTED, {
        identifier_type: variables.email ? 'email' : 'phone',
        identifier: variables.email || variables.phone,
      });
    },
    onError: (error) => {
      track(ANALYTICS_EVENTS.ERROR_OCCURRED, {
        component: 'useRegister',
        error: error instanceof Error ? error.message : 'Registration failed',
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

      grantPostLoginPasscodeSession();

      await syncPasscodeStatus();

      invalidateQueries.auth();
      invalidateQueries.wallet();
      invalidateQueries.user();
    },
  });
}
