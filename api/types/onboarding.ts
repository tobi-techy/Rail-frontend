// ============= Onboarding Types =============

export interface OnboardingStartRequest {
  email: string;
  phone?: string;
}

export interface OnboardingStartResponse {
  userId: string;
  onboardingStatus: string;
  nextStep: string;
  sessionToken?: string;
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
