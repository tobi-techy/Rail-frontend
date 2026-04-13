import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui';
import { type KYCStatusResponse, type KycStatus, isKycInReview } from '@/api/types/kyc';
import { useKYCStatus, useKycStatusPolling } from '@/api/hooks/useKYC';
import { useAuthStore } from '@/stores/authStore';
import { useKycStore } from '@/stores/kycStore';
import { Alert02Icon, Camera01Icon, CheckmarkCircle02Icon, Clock01Icon, File01Icon, RefreshIcon, ShieldKeyIcon, LockPasswordIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  NavigableBottomSheet,
  type BottomSheetScreen,
  useNavigableBottomSheet,
} from './NavigableBottomSheet';

interface KYCVerificationSheetProps {
  visible: boolean;
  onClose: () => void;
  kycStatus: KYCStatusResponse | undefined;
}

type ScreenStatusMode = 'not_started' | 'pending' | 'approved' | 'rejected';

const resolveStatusMode = (
  status: KYCStatusResponse | undefined,
  hasLocalPendingSubmission: boolean
): ScreenStatusMode => {
  const value = status?.status ?? 'not_started';
  if (value === 'approved') return 'approved';
  if (value === 'rejected' || value === 'expired') return 'rejected';
  // Only show pending if user has actually submitted; otherwise they may be retrying.
  if (isKycInReview(status)) return 'pending';
  if (hasLocalPendingSubmission) return 'pending';
  return 'not_started';
};

export function KYCVerificationSheet({ visible, onClose, kycStatus }: KYCVerificationSheetProps) {
  const { height: screenHeight } = useWindowDimensions();
  const contentMaxHeight = Math.max(280, Math.min(460, screenHeight * 0.56));

  const user = useAuthStore((state) => state.user);
  const localSubmissionPendingAt = useKycStore((state) => state.localSubmissionPendingAt);
  const hasLocalPendingSubmission = Boolean(localSubmissionPendingAt);
  const firstName = useMemo(() => {
    if (user?.firstName && user.firstName.trim()) return user.firstName.trim();
    if (user?.fullName && user.fullName.trim()) return user.fullName.trim().split(' ')[0];
    return 'there';
  }, [user?.firstName, user?.fullName]);

  // #7: Use polling with timeout recovery when pending
  const [pollingTimedOut, setPollingTimedOut] = useState(false);
  const [pollResetKey, setPollResetKey] = useState(0);
  const isPending = resolveStatusMode(kycStatus, hasLocalPendingSubmission) === 'pending';

  const handleTerminal = useCallback((status: KycStatus) => {
    setPollingTimedOut(false);
  }, []);

  const handleTimeout = useCallback(() => {
    setPollingTimedOut(true);
  }, []);

  const {
    data: polledStatus,
    refetch: refetchKycStatus,
    isRefetching: isRefetchingStatus,
  } = useKycStatusPolling(visible && isPending, handleTerminal, {
    onTimeout: handleTimeout,
    resetKey: pollResetKey,
  });

  // Fallback to non-polling query when not pending
  const { data: staticStatus } = useKYCStatus(visible && !isPending);

  const status = polledStatus ?? staticStatus ?? kycStatus;
  const statusMode = resolveStatusMode(status, hasLocalPendingSubmission);

  const navigation = useNavigableBottomSheet('intro');
  const { reset: resetNavigation } = navigation;
  const wasVisibleRef = useRef(false);

  const getInitialScreen = useCallback(() => {
    if (statusMode === 'approved') return 'approved';
    if (statusMode === 'pending') return 'pending';
    return 'intro';
  }, [statusMode]);

  useEffect(() => {
    if (!visible) {
      wasVisibleRef.current = false;
      resetNavigation('intro');
      setPollingTimedOut(false);
      return;
    }
    if (!wasVisibleRef.current) {
      wasVisibleRef.current = true;
      resetNavigation(getInitialScreen());
    }
  }, [visible, getInitialScreen, resetNavigation]);

  useEffect(() => {
    if (visible && statusMode === 'approved') resetNavigation('approved');
  }, [visible, statusMode, resetNavigation]);

  const handleStart = useCallback(() => {
    onClose();
    requestAnimationFrame(() => router.push('/kyc'));
  }, [onClose]);

  const handleContinue = useCallback(() => {
    const state = useKycStore.getState();
    const { taxId, employmentStatus, investmentPurposes, disclosuresConfirmed, diditSessionToken } = state;
    let screen = '/kyc/tax-id';
    if (diditSessionToken) screen = '/kyc/didit-sdk';
    else if (disclosuresConfirmed && taxId && employmentStatus && investmentPurposes.length > 0) screen = '/kyc/disclosures';
    else if (employmentStatus && investmentPurposes.length > 0 && taxId) screen = '/kyc/disclosures';
    else if (taxId) screen = '/kyc/about-you';
    onClose();
    requestAnimationFrame(() => router.push(screen as never));
  }, [onClose]);

  const handleCheckStatus = useCallback(async () => {
    setPollingTimedOut(false);
    setPollResetKey((k) => k + 1);
    const result = await refetchKycStatus();
    const nextMode = resolveStatusMode(result.data ?? status, hasLocalPendingSubmission);
    if (nextMode === 'approved') resetNavigation('approved');
    else if (nextMode === 'rejected') resetNavigation('intro');
  }, [hasLocalPendingSubmission, refetchKycStatus, status, resetNavigation]);

  const handleRetry = useCallback(() => {
    onClose();
    requestAnimationFrame(() => router.push('/kyc'));
  }, [onClose]);

  const closeSheet = useCallback(() => onClose(), [onClose]);

  const introTitle =
    statusMode === 'approved'
      ? `Thanks ${firstName}, you're all set!`
      : statusMode === 'pending'
        ? `Thanks ${firstName}, we're checking everything now`
        : statusMode === 'rejected'
          ? 'We need a quick retry'
          : 'Tell us about yourself';

  const introBody =
    statusMode === 'approved'
      ? 'Your identity is now verified.'
      : statusMode === 'pending'
        ? "We received your documents and are reviewing them. If your liveness check didn't complete, you can continue where you left off."
        : statusMode === 'rejected'
          ? status?.rejection_reason ||
            'Your last submission was not approved. You can retry now with clear ID photos.'
          : 'We use this info to confirm your identity and comply with financial regulations. Takes under 5 minutes.';

  const screens: BottomSheetScreen[] = [
    {
      id: 'intro',
      title: statusMode === 'not_started' ? '' : 'Verification Status',
      component: (
        <ScrollView style={{ maxHeight: contentMaxHeight }} showsVerticalScrollIndicator={false}>
          <View className="pb-1">
            <View className={statusMode === 'not_started' ? 'mb-8 mt-2' : 'mb-4 items-center'}>
              {statusMode !== 'not_started' && (
                <View
                  className="mb-4 size-16 items-center justify-center rounded-full"
                  style={{
                    backgroundColor:
                      statusMode === 'approved'
                        ? '#ECFDF3'
                        : statusMode === 'pending'
                          ? '#FFF7ED'
                          : '#FEF2F2',
                  }}>
                  {statusMode === 'approved' ? (
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={30} color="#10B981" />
                  ) : statusMode === 'pending' ? (
                    <HugeiconsIcon icon={Clock01Icon} size={30} color="#F59E0B" />
                  ) : (
                    <HugeiconsIcon icon={Alert02Icon} size={30} color="#EF4444" />
                  )}
                </View>
              )}
              <Text
                className={
                  statusMode === 'not_started'
                    ? 'font-display text-[26px] leading-8 text-gray-900'
                    : 'text-center font-subtitle text-[28px] leading-8 text-gray-900'
                }>
                {introTitle}
              </Text>
              <Text
                className={
                  statusMode === 'not_started'
                    ? 'mt-3 font-body text-[16px] leading-6 text-gray-500'
                    : 'mt-2 text-center font-body text-[15px] leading-6 text-gray-500'
                }>
                {introBody}
              </Text>
            </View>

            {statusMode === 'not_started' && (
              <>
                <View className="mb-4 rounded-3xl border border-gray-200 bg-white">
                  <View className="flex-row items-center gap-4 border-b border-gray-100 p-5">
                    <HugeiconsIcon icon={File01Icon} size={24} color="#111827" />
                    <View className="flex-1">
                      <Text className="font-subtitle text-[15px] text-gray-900">Your photo ID</Text>
                      <Text className="mt-1 font-body text-[13px] leading-5 text-gray-500">
                        We accept most common forms of ID.
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-4 p-5">
                    <HugeiconsIcon icon={Camera01Icon} size={24} color="#111827" />
                    <View className="flex-1">
                      <Text className="font-subtitle text-[15px] text-gray-900">
                        A quick scan of your face
                      </Text>
                      <Text className="mt-1 font-body text-[13px] leading-5 text-gray-500">
                        This is to confirm that you match your ID.
                      </Text>
                    </View>
                  </View>
                </View>
                <View className="mb-6 flex-row gap-3">
                  <View className="flex-1 flex-row items-center gap-2 rounded-2xl bg-gray-50 px-3 py-2.5">
                    <HugeiconsIcon icon={ShieldKeyIcon} size={16} color="#6B7280" />
                    <Text className="flex-1 font-body text-[12px] leading-4 text-gray-500">
                      256-bit encrypted & never sold
                    </Text>
                  </View>
                  <View className="flex-1 flex-row items-center gap-2 rounded-2xl bg-gray-50 px-3 py-2.5">
                    <HugeiconsIcon icon={LockPasswordIcon} size={16} color="#6B7280" />
                    <Text className="flex-1 font-body text-[12px] leading-4 text-gray-500">
                      Required by financial regulations
                    </Text>
                  </View>
                </View>
              </>
            )}

            {statusMode === 'pending' && pollingTimedOut && (
              <View className="mb-4 rounded-2xl bg-amber-50 px-4 py-3">
                <Text className="font-body text-[13px] leading-5 text-amber-800">
                  Verification is taking longer than usual. Tap &quot;Refresh status&quot; to check
                  manually.
                </Text>
              </View>
            )}

            {statusMode === 'approved' ? (
              <Button title="Close" onPress={closeSheet} />
            ) : statusMode === 'pending' ? (
              <View className="gap-y-3">
                <Button title="Continue verification" onPress={handleContinue} />
                <Button
                  title="Refresh status"
                  variant="white"
                  onPress={handleCheckStatus}
                  loading={isRefetchingStatus}
                  leftIcon={<HugeiconsIcon icon={RefreshIcon} size={16} color="#111827" />}
                />
              </View>
            ) : (
              <Button
                title={statusMode === 'rejected' ? 'Retry verification' : 'Get started'}
                onPress={statusMode === 'rejected' ? handleRetry : handleStart}
              />
            )}
          </View>
        </ScrollView>
      ),
    },
  ];

  return (
    <NavigableBottomSheet
      visible={visible}
      onClose={closeSheet}
      navigation={navigation}
      screens={screens}
    />
  );
}
