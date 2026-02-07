/**
 * Onboarding Hooks
 * React Query hooks for onboarding operations
 */

import { useMutation } from '@tanstack/react-query';
import { onboardingService } from '../services';
import { useAuthStore } from '../../stores/authStore';
import type { OnboardingCompleteRequest, KYCVerificationRequest } from '../types';

/**
 * Complete onboarding mutation
 */
export function useOnboardingComplete() {
  return useMutation({
    mutationFn: (data: OnboardingCompleteRequest) => onboardingService.complete(data),
    onSuccess: (response) => {
      useAuthStore.setState({
        onboardingStatus: response.onboarding?.onboardingStatus ?? null,
        currentOnboardingStep: response.onboarding?.currentStep ?? null,
      });
    },
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
