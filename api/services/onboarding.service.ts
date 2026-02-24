/**
 * Onboarding API Service
 * Handles onboarding flow, status, and KYC submission
 */

import apiClient from '../client';
import type {
  OnboardingCompleteRequest,
  OnboardingCompleteResponse,
  KYCVerificationRequest,
  KYCVerificationResponse,
} from '../types';

const ONBOARDING_ENDPOINTS = {
  COMPLETE: '/v1/onboarding/complete',
  KYC_SUBMIT: '/v1/onboarding/kyc/submit',
};

export const onboardingService = {
  /**
   * Complete onboarding process for an authenticated user
   * Sets profile/password and triggers account provisioning
   */
  async complete(data: OnboardingCompleteRequest): Promise<OnboardingCompleteResponse> {
    return apiClient.post<OnboardingCompleteResponse>(ONBOARDING_ENDPOINTS.COMPLETE, data);
  },

  /**
   * Submit KYC documents and personal information
   * Requires email verification before submission
   * @returns Submission confirmation with next steps
   */
  async submitKYC(data: KYCVerificationRequest): Promise<KYCVerificationResponse> {
    return apiClient.post<KYCVerificationResponse>(ONBOARDING_ENDPOINTS.KYC_SUBMIT, data);
  },
};

export default onboardingService;
