/**
 * Onboarding Hooks
 * React Query hooks for onboarding operations
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { onboardingService } from '../services';
import { queryKeys } from '../queryClient';
import { useAuthStore } from '../../stores/authStore';
import type {
  OnboardingStartRequest,
  KYCVerificationRequest,
} from '../types';

/**
 * Start onboarding mutation
 */
export function useOnboardingStart() {
  return useMutation({
    mutationFn: (data: OnboardingStartRequest) => onboardingService.start(data),
    onSuccess: (response) => {
      useAuthStore.setState({
        onboardingStatus: response.onboardingStatus,
        currentOnboardingStep: response.nextStep,
      });
    },
  });
}

/**
 * Get onboarding status query
 */
export function useOnboardingStatus() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.user.all,
    queryFn: () => onboardingService.getStatus(user?.id),
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Submit KYC mutation (onboarding flow)
 */
export function useOnboardingSubmitKYC() {
  return useMutation({
    mutationFn: (data: KYCVerificationRequest) => onboardingService.submitKYC(data),
    onSuccess: () => {
      // Update onboarding status
      useAuthStore.setState({
        onboardingStatus: 'kyc_processing',
      });
    },
  });
}
