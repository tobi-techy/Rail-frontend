import { useCallback } from 'react';
import { router } from 'expo-router';
import { useKYCStatus } from '@/api/hooks/useKYC';
import { ROUTES } from '@/constants/routes';

/**
 * Gate features behind KYC approval.
 *
 * Usage:
 *   const { isApproved, requireKyc } = useKycGate();
 *   <Button onPress={() => requireKyc(() => router.push('/virtual-account'))} />
 *
 * If KYC is not approved, redirects to the KYC screen.
 * If approved, executes the callback immediately.
 */
export function useKycGate() {
  const { data: kycStatus, isLoading } = useKYCStatus();
  const isApproved = kycStatus?.status === 'approved';

  const requireKyc = useCallback(
    (onApproved: () => void) => {
      if (isApproved) {
        onApproved();
      } else {
        router.push(ROUTES.AUTH.KYC as any);
      }
    },
    [isApproved]
  );

  return { isApproved, isLoading, requireKyc };
}
