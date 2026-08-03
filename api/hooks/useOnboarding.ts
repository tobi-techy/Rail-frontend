/**
 * Onboarding Hooks
 * React Query hooks for onboarding operations
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { onboardingService } from '../services';
import { useAuthStore } from '../../stores/authStore';
import { queryKeys } from '../queryClient';
import type { OnboardingCompleteRequest, KYCVerificationRequest } from '../types';

/**
 * Basic complete onboarding mutation (slim signup — name only, OTP-only auth)
 */
export function useOnboardingBasicComplete() {
  return useMutation({
    mutationFn: (data: { firstName: string; middleName?: string; lastName: string }) =>
      onboardingService.basicComplete(data),
    onSuccess: (response, variables) => {
      const firstName = variables.firstName.trim();
      const lastName = variables.lastName.trim();
      const fullName = [firstName, variables.middleName, lastName].filter(Boolean).join(' ');

      useAuthStore.setState((state) => ({
        user: state.user ? { ...state.user, firstName, lastName, fullName } : state.user,
        hasCompletedOnboarding: true,
        onboardingStatus: response.onboardingStatus ?? 'basic_complete',
      }));
    },
  });
}

/**
 * Complete onboarding mutation
 */
export function useOnboardingComplete() {
  return useMutation({
    mutationFn: (data: OnboardingCompleteRequest) => onboardingService.complete(data),
    onSuccess: (response, variables) => {
      const firstName = variables.firstName?.trim();
      const lastName = variables.lastName?.trim();
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

      useAuthStore.setState((state) => ({
        user: state.user
          ? {
              ...state.user,
              firstName: firstName || state.user.firstName,
              lastName: lastName || state.user.lastName,
              fullName: fullName || state.user.fullName,
              phoneNumber: variables.phone || state.user.phoneNumber,
            }
          : state.user,
        hasCompletedOnboarding: true,
        onboardingStatus: response.onboarding?.onboardingStatus ?? null,
        currentOnboardingStep: response.onboarding?.currentStep ?? null,
      }));
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
        onboardingStatus: 'kyc_pending',
      });
    },
  });
}

/**
 * Fetch missing KYC profile fields from backend.
 * Used to determine which complete-kyc steps to show.
 */
export function useMissingKycFields(enabled = true) {
  return useQuery({
    queryKey: queryKeys.onboarding.missingKycFields(),
    queryFn: () => onboardingService.getMissingKycFields(),
    enabled,
    staleTime: 30_000,
  });
}
