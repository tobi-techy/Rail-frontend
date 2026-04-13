import { useEffect } from 'react';
import { router } from 'expo-router';
import { useKYCStatus } from '@/api/hooks/useKYC';

/**
 * Redirects to home if the user has not completed KYC.
 * Use at the top of any screen/layout that requires KYC approval.
 */
export function useKYCGate() {
  const { data: kycStatus, isLoading, isFetching } = useKYCStatus();

  useEffect(() => {
    if (!isLoading && !isFetching && kycStatus && !kycStatus.verified) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isFetching, kycStatus]);

  return { isLoading: isLoading || isFetching, isApproved: kycStatus?.verified ?? false };
}
