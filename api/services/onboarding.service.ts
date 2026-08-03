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

export interface MissingKycFieldsResponse {
  missingFields: string[];
  /** Which complete-kyc step to start from: 'date_of_birth' | 'address' | 'phone' | 'none' */
  startStep: 'date_of_birth' | 'address' | 'phone' | 'none';
}

const ONBOARDING_ENDPOINTS = {
  BASIC_COMPLETE: '/v1/onboarding/basic-complete',
  COMPLETE: '/v1/onboarding/complete',
  KYC_SUBMIT: '/v1/onboarding/kyc/submit',
  KYC_MISSING_FIELDS: '/v1/onboarding/kyc/missing-fields',
};

export const onboardingService = {
  /**
   * Basic complete — slim signup with name only (OTP-only auth, no password)
   */
  async basicComplete(data: { firstName: string; middleName?: string; lastName: string }) {
    return apiClient.post<{ userId: string; onboardingStatus: string; message: string }>(
      ONBOARDING_ENDPOINTS.BASIC_COMPLETE,
      data
    );
  },

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

  /**
   * Get missing KYC profile fields from the backend.
   * Returns which fields the user still needs to fill before KYC submission.
   */
  async getMissingKycFields(): Promise<MissingKycFieldsResponse> {
    return apiClient.get<MissingKycFieldsResponse>(ONBOARDING_ENDPOINTS.KYC_MISSING_FIELDS);
  },
};

export default onboardingService;
