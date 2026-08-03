import { useCallback } from 'react';
import { useKYCStatus } from '@/api/hooks/useKYC';
import { useAuthStore } from '@/stores/authStore';
import { getTierCapabilities } from '@/api/types/kyc';

type GateCapability = 'receive_ngn' | 'deposit_fiat_usd' | 'use_card' | 'invest';

/**
 * Gate features behind profile completion AND the tier capability that a given
 * action needs. The point of the tier model is to only ask for heavy KYC when
 * the user actually reaches for a gated feature:
 *
 * - Profile incomplete (DOB, address, phone) → onProfileRequired
 * - NGN account (Tier 2) needed but missing → onNgnKycRequired (BVN + NIN)
 * - USD / cards / investing (Tier 3) needed but missing → onKycRequired (Bridge)
 */
export function useFeatureGate() {
  const { data: kycStatus } = useKYCStatus();
  const hasCompletedOnboarding = useAuthStore((s) => s.hasCompletedOnboarding);
  const onboardingStatus = useAuthStore((s) => s.onboardingStatus);

  // Legacy users who completed onboarding before hasCompletedOnboarding was added
  // will have hasCompletedOnboarding=false but a KYC or advanced onboarding status.
  const isLegacyComplete =
    onboardingStatus === 'completed' ||
    onboardingStatus === 'basic_complete' ||
    onboardingStatus === 'kyc_pending' ||
    onboardingStatus === 'kyc_approved' ||
    onboardingStatus === 'kyc_rejected';

  const isProfileComplete = hasCompletedOnboarding || isLegacyComplete;
  const capabilities = getTierCapabilities(kycStatus);

  const canReceiveNgn = capabilities.can_receive_ngn;
  const canUseUsd = capabilities.can_deposit_fiat_usd;
  const canUseCard = capabilities.can_use_card;
  const canInvest = capabilities.can_invest;
  // Tier 3 covers USD / cards / investing — treat any of them as "advanced".
  const isKycApproved = canUseCard || canInvest || canUseUsd;

  const hasCapability = useCallback(
    (cap: GateCapability): boolean => {
      switch (cap) {
        case 'receive_ngn':
          return capabilities.can_receive_ngn;
        case 'deposit_fiat_usd':
          return capabilities.can_deposit_fiat_usd;
        case 'use_card':
          return capabilities.can_use_card;
        case 'invest':
          return capabilities.can_invest;
      }
    },
    [capabilities]
  );

  /**
   * Run `onAllowed` when the capability is present, otherwise route to the
   * correct next step. NGN-gated actions route to BVN+NIN; everything else
   * (USD/cards/investing) routes to Bridge KYC.
   */
  const requireCapability = useCallback(
    (
      cap: GateCapability,
      onAllowed: () => void,
      opts?: {
        onProfileRequired?: () => void;
        onNgnKycRequired?: () => void;
        onKycRequired?: () => void;
      }
    ) => {
      if (hasCapability(cap)) {
        onAllowed();
        return;
      }
      if (cap === 'receive_ngn') {
        opts?.onNgnKycRequired?.();
        return;
      }
      if (!isProfileComplete) {
        opts?.onProfileRequired?.();
        return;
      }
      opts?.onKycRequired?.();
    },
    [hasCapability, isProfileComplete]
  );

  const requireFeature = useCallback(
    (
      onApproved: () => void,
      opts?: { onProfileRequired?: () => void; onKycRequired?: () => void; kycOptional?: boolean }
    ) => {
      if (!isProfileComplete) {
        opts?.onProfileRequired?.();
        return;
      }
      if (!opts?.kycOptional && !isKycApproved) {
        opts?.onKycRequired?.();
        return;
      }
      onApproved();
    },
    [isProfileComplete, isKycApproved]
  );

  return {
    isProfileComplete,
    isKycApproved,
    capabilities,
    canReceiveNgn,
    canUseUsd,
    canUseCard,
    canInvest,
    requireCapability,
    requireFeature,
  };
}
