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
 * Returns session token for sensitive operations
 */
export function useVerifyPasscode() {
  return useMutation({
    mutationFn: (data: VerifyPasscodeRequest) => passcodeService.verifyPasscode(data),
    onSuccess: (response) => {
      // Store session token in auth store for sensitive operations
      if (response.verified && response.sessionToken) {
        useAuthStore.setState({
          passcodeSessionToken: response.sessionToken,
          passcodeSessionExpiresAt: response.expiresAt,
          isAuthenticated: true, // Mark user as authenticated after passcode verification
        });
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
