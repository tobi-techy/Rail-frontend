/**
 * Passcode Hooks
 * React Query hooks for passcode operations
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { passcodeService } from '../services';
import { queryKeys } from '../queryClient';
import { useAuthStore } from '../../stores/authStore';
import { logger } from '../../lib/logger';
import type {
  CreatePasscodeRequest,
  UpdatePasscodeRequest,
  VerifyPasscodeRequest,
  DeletePasscodeRequest,
} from '../types';

/**
 * Get passcode status query
 */
export function usePasscodeStatus() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.auth.passcode(),
    queryFn: () => passcodeService.getStatus(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Create passcode mutation
 * Requires 4-digit passcode and confirmation
 */
export function useCreatePasscode() {
  return useMutation({
    mutationFn: (data: CreatePasscodeRequest) => passcodeService.createPasscode(data),
    onSuccess: () => {
      useAuthStore.setState({
        hasPasscode: true,
      });
    },
  });
}

/**
 * Retry logic with exponential backoff for network errors
 */
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 500
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Only retry on network errors, not auth errors
      const isNetworkError =
        !(error as any)?.response ||
        (error as any)?.message?.includes('Network') ||
        (error as any)?.message?.includes('timeout');

      if (!isNetworkError || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff: 500ms, 1s, 2s
      const delayMs = initialDelayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
};

/**
 * Verify passcode mutation
 * Used for both authentication (login) and authorization (withdrawals)
 * - For login: Returns and stores accessToken + refreshToken
 * - For withdrawals: Returns optional sessionToken for sensitive operations
 * - Network errors are automatically retried with exponential backoff
 */
export function useVerifyPasscode() {
  return useMutation({
    mutationFn: (data: VerifyPasscodeRequest) =>
      retryWithBackoff(() => passcodeService.verifyPasscode(data)),
    onSuccess: (response) => {
      if (response.verified) {
        const now = new Date();

        // Store all tokens in a single setState call to ensure atomicity
        const updates: any = {
          isAuthenticated: true,
          hasPasscode: true,
          lastActivityAt: now.toISOString(),
          tokenIssuedAt: now.toISOString(),
        };

        // Add authentication tokens (for login flow)
        if (response.accessToken && response.refreshToken) {
          logger.debug('[useVerifyPasscode] Storing access and refresh tokens', {
            component: 'useVerifyPasscode',
            action: 'store-tokens',
          });
          updates.accessToken = response.accessToken;
          updates.refreshToken = response.refreshToken;

          // Set token expiry (7 days or from response)
          const tokenExpiresAt = response.expiresAt
            ? new Date(response.expiresAt)
            : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          updates.tokenExpiresAt = tokenExpiresAt.toISOString();
        }

        // Add passcode session tokens (for withdrawal/sensitive operations)
        if (response.passcodeSessionToken && response.passcodeSessionExpiresAt) {
          logger.debug('[useVerifyPasscode] Storing passcode session tokens', {
            component: 'useVerifyPasscode',
            action: 'store-passcode-tokens',
          });
          updates.passcodeSessionToken = response.passcodeSessionToken;
          updates.passcodeSessionExpiresAt = response.passcodeSessionExpiresAt;
        }

        logger.debug('[useVerifyPasscode] Applying updates to auth store', {
          component: 'useVerifyPasscode',
          action: 'apply-updates',
          hasAccessToken: !!updates.accessToken,
          hasRefreshToken: !!updates.refreshToken,
          hasPasscodeSessionToken: !!updates.passcodeSessionToken,
        });

        // Apply all updates atomically
        useAuthStore.setState(updates);
      }
    },
  });
}

/**
 * Update passcode mutation
 * Requires current passcode, new passcode, and confirmation
 */
export function useUpdatePasscode() {
  return useMutation({
    mutationFn: (data: UpdatePasscodeRequest) => passcodeService.updatePasscode(data),
  });
}

/**
 * Delete passcode mutation
 * Requires current passcode for confirmation
 */
export function useDeletePasscode() {
  return useMutation({
    mutationFn: (data: DeletePasscodeRequest) => passcodeService.deletePasscode(data),
    onSuccess: () => {
      // Clear passcode session from store
      useAuthStore.setState({
        passcodeSessionToken: undefined,
        passcodeSessionExpiresAt: undefined,
      });
    },
  });
}
