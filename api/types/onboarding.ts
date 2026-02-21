// ============= Onboarding Types =============

import type { KYCStatusResponse } from './kyc';

export interface OnboardingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OnboardingCompleteRequest {
  password?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  country: string;
  address: OnboardingAddress;
  phone?: string;
  signedAgreementId?: string;
  email?: string;
}

export interface OnboardingCompleteResponse {
  user_id: string;
  bridge_customer_id: string;
  alpaca_account_id: string;
  message: string;
  next_steps: string[];
  onboarding: OnboardingStatusResponse;
  kyc?: KYCStatusResponse;
}

export interface OnboardingStatusResponse {
  userId: string;
  onboardingStatus: string;
  kycStatus: string;
  currentStep: string;
  completedSteps: string[];
  walletStatus: {
    totalWallets: number;
    createdWallets: number;
    pendingWallets: number;
    failedWallets: number;
    supportedChains: string[];
    walletsByChain: Record<string, string>;
  };
  canProceed: boolean;
  requiredActions: string[];
}
