/**
 * Onboarding API Service
 * Handles onboarding flow, status, and KYC submission
 */

import apiClient from '../client';
import type {
  OnboardingStartRequest,
  OnboardingStartResponse,
  OnboardingStatusResponse,
  KYCVerificationRequest,
  KYCVerificationResponse,
} from '../types';

const ONBOARDING_ENDPOINTS = {
  START: '/v1/onboarding/start',
  STATUS: '/v1/onboarding/status',
  KYC_SUBMIT: '/v1/onboarding/kyc/submit',
};

export const onboardingService = {
  /**
   * Start onboarding process for a user
   * Creates user if needed and initializes onboarding steps
   * @returns User ID, onboarding status, and next step
   */
  async start(data: OnboardingStartRequest): Promise<OnboardingStartResponse> {
    return apiClient.post<OnboardingStartResponse>(
      ONBOARDING_ENDPOINTS.START,
      data
    );
  },

  /**
   * Get comprehensive onboarding status
   * Includes KYC status, wallet provisioning, and required actions
   * @param userId - Optional user ID (defaults to authenticated user)
   * @returns Detailed onboarding status
   */
  async getStatus(userId?: string): Promise<OnboardingStatusResponse> {
    const params = userId ? { user_id: userId } : {};
    return apiClient.get<OnboardingStatusResponse>(
      ONBOARDING_ENDPOINTS.STATUS,
      { params }
    );
  },

  /**
   * Submit KYC documents and personal information
   * Requires email verification before submission
   * @returns Submission confirmation with next steps
   */
  async submitKYC(data: KYCVerificationRequest): Promise<KYCVerificationResponse> {
    return apiClient.post<KYCVerificationResponse>(
      ONBOARDING_ENDPOINTS.KYC_SUBMIT,
      data
    );
  },
};

export default onboardingService;
