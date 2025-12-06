/**
 * Authentication Hooks
 * React Query hooks for authentication operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services';
import { queryKeys, invalidateQueries } from '../queryClient';
import { useAuthStore } from '../../stores/authStore';
import type {
  LoginRequest,
  RegisterRequest,
  VerifyCodeRequest,
  ResendCodeRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  User,
} from '../types';

/**
 * Login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (response) => {
      // Update auth store with response data
      useAuthStore.setState({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
        onboardingStatus: response.user.onboardingStatus || null,
      });

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
  const TOKEN_EXPIRY_DAYS = 7;
  const DEFAULT_ONBOARDING_STATUS = 'wallets_pending';

  return useMutation({
    mutationFn: (data: VerifyCodeRequest) => authService.verifyCode(data),
    onSuccess: (response) => {
      const now = new Date();
      const defaultExpiryTime = new Date(now.getTime() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      const tokenExpiresAt = response.expiresAt 
        ? new Date(response.expiresAt)
        : defaultExpiryTime;
      
      useAuthStore.setState({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
        pendingVerificationEmail: null,
        onboardingStatus: response.user.onboardingStatus || DEFAULT_ONBOARDING_STATUS,
        lastActivityAt: now.toISOString(),
        tokenIssuedAt: now.toISOString(),
        tokenExpiresAt: tokenExpiresAt.toISOString(),
      });
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
 * Verify email mutation
 */
export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => authService.verifyEmail({ token }),
    onSuccess: () => {
      // Update user's email verified status
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.setState({
          user: { ...currentUser, emailVerified: true },
        });
      }
    },
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
