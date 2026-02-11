import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { AuthGradient, StaggeredChild } from '@/components';
import { Button } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { useBridgeKYCLink, useKYCStatus } from '@/api/hooks/useKYC';
import { useAuthStore } from '@/stores/authStore';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';

type KYCDisplayStatus = 'pending' | 'approved' | 'rejected';

const normalizeKYCStatus = (status?: string, verified?: boolean): KYCDisplayStatus => {
  if (verified || status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  return 'pending';
};

export default function KYCVerificationScreen() {
  const onboardingStatus = useAuthStore((state) => state.onboardingStatus);
  const setOnboardingStatus = useAuthStore((state) => state.setOnboardingStatus);
  const [isPolling, setIsPolling] = useState(onboardingStatus === 'kyc_pending');
  const [isOpeningKYC, setIsOpeningKYC] = useState(false);
  const [screenError, setScreenError] = useState('');
  const { showError } = useFeedbackPopup();

  const {
    data: bridgeKYCLink,
    isLoading: isBridgeLinkLoading,
    isFetching: isBridgeLinkFetching,
    error: bridgeLinkError,
    refetch: refetchBridgeLink,
  } = useBridgeKYCLink(true);

  const {
    data: kycStatus,
    isFetching: isKYCStatusFetching,
    refetch: refetchKYCStatus,
    error: kycStatusError,
  } = useKYCStatus(isPolling);

  const status = useMemo(
    () => normalizeKYCStatus(kycStatus?.status, kycStatus?.verified),
    [kycStatus?.status, kycStatus?.verified]
  );

  useEffect(() => {
    if (!kycStatus) return;

    if (status === 'approved') {
      setIsPolling(false);
      setOnboardingStatus('completed');
      router.replace(ROUTES.TABS as any);
      return;
    }

    if (status === 'rejected') {
      setIsPolling(false);
      setOnboardingStatus('kyc_rejected');
      return;
    }

    setOnboardingStatus('kyc_pending');
  }, [kycStatus, status, setOnboardingStatus]);

  const openKYCFlow = useCallback(async () => {
    setScreenError('');
    setIsOpeningKYC(true);

    try {
      let kycLink = bridgeKYCLink?.kycLink;
      if (!kycLink) {
        const linkResponse = await refetchBridgeLink();
        kycLink = linkResponse.data?.kycLink;
      }

      if (!kycLink) {
        setScreenError('Unable to generate KYC link. Please try again.');
        return;
      }

      setIsPolling(true);
      await WebBrowser.openBrowserAsync(kycLink);
      await refetchKYCStatus();
    } catch (error: any) {
      setScreenError(error?.message || 'Unable to launch KYC verification.');
    } finally {
      setIsOpeningKYC(false);
    }
  }, [bridgeKYCLink?.kycLink, refetchBridgeLink, refetchKYCStatus]);

  const handleCheckStatus = useCallback(async () => {
    try {
      await refetchKYCStatus();
    } catch {
      showError('Unable to refresh KYC status', 'Please try again.');
    }
  }, [refetchKYCStatus, showError]);

  const statusText =
    status === 'approved'
      ? 'KYC approved.'
      : status === 'rejected'
        ? 'KYC was rejected.'
        : 'Verification pending.';

  const rejectionReason = kycStatus?.rejectionReason || undefined;

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1 px-6 pb-8">
        <StatusBar barStyle="dark-content" />

        <StaggeredChild index={0}>
          <View className="mt-16">
            <Text className="font-subtitle text-[48px] leading-[1.05] text-black">Verify ID</Text>
            <Text className="mt-4 font-body text-base leading-6 text-black/60">
              Complete identity verification to unlock funding and investing.
            </Text>
          </View>
        </StaggeredChild>

        <StaggeredChild index={1}>
          <View className="mt-10 rounded-3xl border border-black/10 bg-black/5 p-5">
            <Text className="font-button text-base text-black">Status</Text>
            <Text className="mt-2 font-body text-sm text-black/70">{statusText}</Text>
            {rejectionReason ? (
              <Text className="mt-3 font-body text-sm text-[#B91C1C]">{rejectionReason}</Text>
            ) : null}
            {screenError ? (
              <Text className="mt-3 font-body text-sm text-[#B91C1C]">{screenError}</Text>
            ) : null}
            {bridgeLinkError ? (
              <Text className="mt-3 font-body text-sm text-[#B91C1C]">
                Failed to fetch KYC link. Please retry.
              </Text>
            ) : null}
            {kycStatusError ? (
              <Text className="mt-3 font-body text-sm text-[#B91C1C]">
                Failed to fetch latest status. You can retry.
              </Text>
            ) : null}
          </View>
        </StaggeredChild>

        <View className="flex-1" />

        <StaggeredChild index={2} delay={80}>
          <View className="gap-y-4 pb-3">
            <Button
              title={status === 'rejected' ? 'Retry Verification' : 'Start Verification'}
              onPress={openKYCFlow}
              loading={isOpeningKYC || isBridgeLinkLoading || isBridgeLinkFetching}
            />
            <Button
              title={isKYCStatusFetching ? 'Checking...' : 'Check Status'}
              onPress={handleCheckStatus}
              variant="white"
              loading={isKYCStatusFetching}
            />
          </View>
        </StaggeredChild>
      </SafeAreaView>
    </AuthGradient>
  );
}
