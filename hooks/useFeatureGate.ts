import { useCallback } from 'react';
import { useKYCStatus } from '@/api/hooks/useKYC';
import { useAuthStore } from '@/stores/authStore';

/**
 * Gate features behind profile completion AND KYC approval.
 *
 * - If full profile not completed (DOB, address, phone, Bridge customer) → onProfileRequired
 * - If profile complete but KYC not approved → onKycRequired
 * - If both done → executes the action
 */
export function useFeatureGate() {
  const { data: kycStatus } = useKYCStatus();
  const hasCompletedOnboarding = useAuthStore((s) => s.hasCompletedOnboarding);
  const onboardingStatus = useAuthStore((s) => s.onboardingStatus);

  // Legacy users who completed onboarding before hasCompletedOnboarding was added
  // will have hasCompletedOnboarding=false but a KYC or advanced onboarding status.
  const isLegacyComplete =
    onboardingStatus === 'completed' ||
    onboardingStatus === 'kyc_pending' ||
    onboardingStatus === 'kyc_approved' ||
    onboardingStatus === 'kyc_rejected';

  const isProfileComplete = hasCompletedOnboarding || isLegacyComplete;
  const isKycApproved =
    kycStatus?.status === 'approved' ||
    kycStatus?.bridge?.status === 'active';

  const requireFeature = useCallback(
    (
      onApproved: () => void,
      opts?: { onProfileRequired?: () => void; onKycRequired?: () => void }
    ) => {
      if (!isProfileComplete) {
        opts?.onProfileRequired?.();
        return;
      }
      if (!isKycApproved) {
        opts?.onKycRequired?.();
        return;
      }
      onApproved();
    },
    [isProfileComplete, isKycApproved]
  );

  return { isProfileComplete, isKycApproved, requireFeature };
}
