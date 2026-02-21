import { useCallback } from 'react';
import { useKYCStatus } from '@/api/hooks/useKYC';

/**
 * Gate features behind KYC approval.
 *
 * Usage:
 *   const { isApproved, requireKyc } = useKycGate();
 *   <Button onPress={() => requireKyc(() => router.push('/virtual-account'), () => setShowKycSheet(true))} />
 *
 * If KYC is not approved, invokes the unverified callback.
 * If approved, executes the callback immediately.
 */
export function useKycGate() {
  const { data: kycStatus, isLoading } = useKYCStatus();
  const isApproved = kycStatus?.status === 'approved';

  const requireKyc = useCallback(
    (onApproved: () => void, onUnverified?: () => void) => {
      if (isApproved) {
        onApproved();
      } else {
        onUnverified?.();
      }
    },
    [isApproved]
  );

  return { isApproved, isLoading, requireKyc };
}
