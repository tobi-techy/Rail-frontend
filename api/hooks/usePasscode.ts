/**
 * Passcode Hooks
 * React Query hooks for passcode operations
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { passcodeService } from '../services';
import { queryKeys } from '../queryClient';
import { useAuthStore } from '../../stores/authStore';
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
    onSuccess: (response) => {
      // Update user state to reflect passcode creation
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.setState({
          user: { ...currentUser, hasPasscode: true },
          hasPasscode: true,
        });
      }
    },
  });
}

/**
 * Verify passcode mutation
 * Used for both authentication (login) and authorization (withdrawals)
 * - For login: Returns and stores accessToken + refreshToken
 * - For withdrawals: Returns optional sessionToken for sensitive operations
 */
export function useVerifyPasscode() {
  return useMutation({
    mutationFn: (data: VerifyPasscodeRequest) => passcodeService.verifyPasscode(data),
    onSuccess: (response) => {
      if (response.verified) {
        const now = new Date();
        
        // Store all tokens in a single setState call to ensure atomicity
        const updates: any = {
          isAuthenticated: true,
          lastActivityAt: now.toISOString(),
          tokenIssuedAt: now.toISOString(),
        };
        
        // Add authentication tokens (for login flow)
        if (response.accessToken && response.refreshToken) {
          console.log('[useVerifyPasscode] Storing access and refresh tokens');
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
          console.log('[useVerifyPasscode] Storing passcode session tokens');
          updates.passcodeSessionToken = response.passcodeSessionToken;
          updates.passcodeSessionExpiresAt = response.passcodeSessionExpiresAt;
        }
        
        console.log('[useVerifyPasscode] Applying updates to auth store:', {
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
