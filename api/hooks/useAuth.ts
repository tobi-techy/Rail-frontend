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
import { logger } from '../../lib/logger';
import { initActivationTracking, checkActivationWindow } from '../../utils/activation';
import { SESSION_DURATION_MS, PASSCODE_SESSION_MS } from '../../utils/sessionConstants';
import type {
  LoginRequest,
  RegisterRequest,
  VerifyCodeRequest,
  ResendCodeRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyResetCodeRequest,
  EmailOTPLoginRequest,
  EmailOTPLoginResponse,
} from '../types';

const getSessionExpiryIso = (sessionExpiresAt?: string): string => {
  if (sessionExpiresAt) return new Date(sessionExpiresAt).toISOString();

  return new Date(Date.now() + SESSION_DURATION_MS).toISOString();
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
 * Validates the expiry date to prevent silent failures if PASSCODE_SESSION_MS is invalid.
 */
const grantPostLoginPasscodeSession = () => {
  if (!Number.isFinite(PASSCODE_SESSION_MS)) {
    logger.warn('[Auth] PASSCODE_SESSION_MS is not a finite number; skipping passcode session grant', {
      component: 'useAuth',
      action: 'passcode-session-grant-skipped',
    });
    return;
  }
  const expiresAt = new Date(Date.now() + PASSCODE_SESSION_MS);
  const expiresAtIso = expiresAt.toISOString();
  if (expiresAtIso === 'Invalid Date') {
    logger.warn('[Auth] Computed passcode session expiry is invalid; skipping grant', {
      component: 'useAuth',
      action: 'passcode-session-grant-invalid-date',
    });
    return;
  }
  useAuthStore.getState().setPasscodeSession('login-granted', expiresAtIso);
};

/**
 * Login mutation
 */
export function useLogin() {
  const { track, identify, setUserProperties } = useAnalytics();

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
        pendingVerificationMode: null,
        onboardingStatus: response.user.onboardingStatus || null,
        lastActivityAt: nowIso,
        tokenIssuedAt: nowIso,
        tokenExpiresAt: getSessionExpiryIso(response.sessionExpiresAt),
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

      // Identify user in PostHog with rich person properties for cohort building
      if (response.user.id) {
        identify(response.user.id, {
          email: response.user.email,
          first_name: response.user.firstName,
          last_name: response.user.lastName,
          $created: response.user.createdAt || undefined,
          kyc_status: response.user.kycStatus || 'none',
          onboarding_status: response.user.onboardingStatus || 'unknown',
        });
        setUserProperties({
          last_login_at: new Date().toISOString(),
          lifecycle_stage: 'returning',
        });
      }

      // Invalidate and refetch relevant queries
      invalidateQueries.auth();
      invalidateQueries.wallet();
      invalidateQueries.user();

      // Check if activation window expired (non-blocking)
      checkActivationWindow(track);
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
        pendingVerificationMode: 'signup',
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
  const { track, identify, setUserProperties } = useAnalytics();

  return useMutation({
    mutationFn: (data: VerifyCodeRequest) => authService.verifyCode(data),
    onSuccess: (response) => {
      if (!response.user || !response.accessToken) {
        useAuthStore.setState({ pendingVerificationEmail: null, pendingVerificationMode: null });
        return;
      }

      const now = new Date();
      const tokenExpiresAt = getSessionExpiryIso(response.sessionExpiresAt);
      const refreshToken = response.refreshToken || useAuthStore.getState().refreshToken;

      useAuthStore.setState({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: refreshToken || null,
        isAuthenticated: true,
        pendingVerificationEmail: null,
        pendingVerificationMode: null,
        onboardingStatus:
          response.onboarding_status || response.user.onboardingStatus || DEFAULT_ONBOARDING_STATUS,
        currentOnboardingStep: response.onboarding?.currentStep ?? null,
        lastActivityAt: now.toISOString(),
        tokenIssuedAt: now.toISOString(),
        tokenExpiresAt,
      });

      void syncPasscodeStatus();

      // Identify the newly verified user in PostHog so all future events are tied to them
      if (response.user.id) {
        identify(response.user.id, {
          email: response.user.email,
          $created: now.toISOString(),
          signup_method: 'email',
        });
        setUserProperties({
          lifecycle_stage: 'new',
          account_age_days: 0,
          retention_cohort: `${now.getFullYear()}-W${String(Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7)).padStart(2, '0')}`,
        });
      }

      track(ANALYTICS_EVENTS.SIGN_UP_COMPLETED, {
        user_id: response.user.id,
        email: response.user.email,
        onboarding_status: response.user.onboardingStatus || DEFAULT_ONBOARDING_STATUS,
      });

      // Initialize activation tracking for this new user
      initActivationTracking(now.toISOString());
    },
  });
}

/**
 * Email OTP Login mutation (passwordless signin for existing users).
 * Validates the response before updating auth state, grants a passcode
 * session, syncs passcode status, and invalidates cached queries —
 * matching the post-login behavior of useLogin.
 */
export function useEmailOTPLogin() {
  const { track, identify, setUserProperties } = useAnalytics();

  return useMutation({
    mutationFn: (data: EmailOTPLoginRequest) => authService.emailOTPLogin(data),
    onSuccess: async (response: EmailOTPLoginResponse) => {
      // Validate response before touching auth state — malformed responses
      // must not mark the user as authenticated.
      if (!response.user || !response.accessToken || !response.refreshToken) {
        throw new Error('Email login response is missing required fields');
      }

      const nowIso = new Date().toISOString();

      useAuthStore.setState({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
        pendingVerificationEmail: null,
        pendingVerificationMode: null,
        onboardingStatus: response.user.onboardingStatus || null,
        lastActivityAt: nowIso,
        tokenIssuedAt: nowIso,
        tokenExpiresAt: getSessionExpiryIso(response.sessionExpiresAt),
      });

      grantPostLoginPasscodeSession();

      await syncPasscodeStatus();

      track(ANALYTICS_EVENTS.SIGN_IN_COMPLETED, {
        user_id: response.user.id,
        email: response.user.email,
        login_method: 'email_otp',
        onboarding_status: response.user.onboardingStatus,
      });

      if (response.user.id) {
        identify(response.user.id, {
          email: response.user.email,
          first_name: response.user.firstName,
          last_name: response.user.lastName,
          login_method: 'email_otp',
        });
        setUserProperties({
          last_login_at: nowIso,
          lifecycle_stage: 'returning',
        });
      } else {
        logger.warn('[Auth] User authenticated without ID; analytics tracking skipped', {
          component: 'useEmailOTPLogin',
          action: 'analytics-skipped-no-user-id',
        });
      }

      invalidateQueries.auth();
      invalidateQueries.wallet();
      invalidateQueries.user();
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
  const { track, reset } = useAnalytics();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Track logout event
      track(ANALYTICS_EVENTS.SIGN_OUT, {
        timestamp: new Date().toISOString(),
      });

      // Reset PostHog identity so next user gets a fresh anonymous ID
      reset();

      // Clear auth store
      useAuthStore.getState().reset();

      // Clear all cached data
      queryClient.clear();
    },
    onError: (error) => {
      track(ANALYTICS_EVENTS.ERROR_OCCURRED, {
        component: 'useLogout',
        error: error instanceof Error ? error.message : 'Logout failed',
      });
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
 * Verify reset code mutation
 */
export function useVerifyResetCode() {
  return useMutation({
    mutationFn: (data: VerifyResetCodeRequest) => authService.verifyResetCode(data),
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
  const { track, identify } = useAnalytics();

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
        pendingVerificationMode: null,
        onboardingStatus: response.user.onboardingStatus || null,
        lastActivityAt: nowIso,
        tokenIssuedAt: nowIso,
        tokenExpiresAt: getSessionExpiryIso(response.sessionExpiresAt),
      });

      grantPostLoginPasscodeSession();

      await syncPasscodeStatus();

      // Track analytics
      track(ANALYTICS_EVENTS.SIGN_IN_COMPLETED, {
        user_id: response.user.id,
        email: response.user.email,
        provider: 'apple',
        onboarding_status: response.user.onboardingStatus,
      });

      // Identify user in PostHog
      if (response.user.id) {
        identify(response.user.id, {
          email: response.user.email,
          first_name: response.user.firstName,
          last_name: response.user.lastName,
          auth_provider: 'apple',
        });
      }

      invalidateQueries.auth();
      invalidateQueries.wallet();
      invalidateQueries.user();
    },
  });
}

/**
 * Google Sign-In mutation (Android)
 * Requires EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to be set.
 */
export function useGoogleSignIn() {
  const { track, identify } = useAnalytics();

  return useMutation({
    mutationFn: async () => {
      const { GoogleSignin, statusCodes } =
        await import('@react-native-google-signin/google-signin');

      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      });

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const response = await GoogleSignin.signIn();

      if (response.type !== 'success') {
        throw Object.assign(new Error('Google Sign-In cancelled'), {
          code: statusCodes.SIGN_IN_CANCELLED,
        });
      }

      const idToken = response.data?.idToken;
      if (!idToken) {
        throw new Error('Google ID token missing');
      }

      return authService.socialLogin({
        provider: 'google',
        idToken,
        givenName: response.data?.user?.givenName ?? undefined,
        familyName: response.data?.user?.familyName ?? undefined,
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
        pendingVerificationMode: null,
        onboardingStatus: response.user.onboardingStatus || null,
        lastActivityAt: nowIso,
        tokenIssuedAt: nowIso,
        tokenExpiresAt: getSessionExpiryIso(response.sessionExpiresAt),
      });

      grantPostLoginPasscodeSession();
      await syncPasscodeStatus();

      track(ANALYTICS_EVENTS.SIGN_IN_COMPLETED, {
        user_id: response.user.id,
        email: response.user.email,
        provider: 'google',
        onboarding_status: response.user.onboardingStatus,
      });

      if (response.user.id) {
        identify(response.user.id, {
          email: response.user.email,
          first_name: response.user.firstName,
          last_name: response.user.lastName,
          auth_provider: 'google',
        });
      }

      invalidateQueries.auth();
      invalidateQueries.wallet();
      invalidateQueries.user();
    },
  });
}
