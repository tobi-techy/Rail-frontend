import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui';
import { type KYCStatusResponse, type KycStatus } from '@/api/types/kyc';
import { useKYCStatus, useKycStatusPolling } from '@/api/hooks/useKYC';
import { useAuthStore } from '@/stores/authStore';
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

const resolveStatusMode = (status?: KYCStatusResponse): ScreenStatusMode => {
  const value = status?.status ?? 'not_started';
  if (value === 'approved') return 'approved';
  if (value === 'rejected' || value === 'expired') return 'rejected';
  if (value === 'processing' || (value === 'pending' && status?.has_submitted)) return 'pending';
  return 'not_started';
};

export function KYCVerificationSheet({ visible, onClose, kycStatus }: KYCVerificationSheetProps) {
  const { height: screenHeight } = useWindowDimensions();
  const contentMaxHeight = Math.max(280, Math.min(460, screenHeight * 0.56));

  const user = useAuthStore((state) => state.user);
  const firstName = useMemo(() => {
    if (user?.firstName && user.firstName.trim()) return user.firstName.trim();
    if (user?.fullName && user.fullName.trim()) return user.fullName.trim().split(' ')[0];
    return 'there';
  }, [user?.firstName, user?.fullName]);

  // #7: Use polling with timeout recovery when pending
  const [pollingTimedOut, setPollingTimedOut] = useState(false);
  const [pollResetKey, setPollResetKey] = useState(0);
  const isPending = resolveStatusMode(kycStatus) === 'pending';

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
  const statusMode = resolveStatusMode(status);

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

  const handleCheckStatus = useCallback(async () => {
    setPollingTimedOut(false);
    setPollResetKey((k) => k + 1);
    const result = await refetchKycStatus();
    const nextMode = resolveStatusMode(result.data ?? status);
    if (nextMode === 'approved') resetNavigation('approved');
    else if (nextMode === 'rejected') resetNavigation('intro');
  }, [refetchKycStatus, status, resetNavigation]);

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
        ? 'This usually takes a few minutes. You can close this and come back later.'
        : statusMode === 'rejected'
          ? status?.rejection_reason ||
            'Your last submission was not approved. You can retry now with clear ID photos.'
          : 'We use this info to confirm your identity and comply with legal requirements.';

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
                    <CheckCircle2 size={30} color="#10B981" />
                  ) : statusMode === 'pending' ? (
                    <Clock3 size={30} color="#F59E0B" />
                  ) : (
                    <AlertTriangle size={30} color="#EF4444" />
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
              <View className="mb-6 rounded-3xl border border-gray-200 bg-white">
                <View className="flex-row items-center gap-4 border-b border-gray-100 p-5">
                  <FileText size={24} color="#111827" />
                  <View className="flex-1">
                    <Text className="font-subtitle text-[15px] text-gray-900">Your photo ID</Text>
                    <Text className="mt-1 font-body text-[13px] leading-5 text-gray-500">
                      We accept most common forms of ID.
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-4 p-5">
                  <Camera size={24} color="#111827" />
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
            )}

            {statusMode === 'rejected' && (
              <View className="mb-4 rounded-2xl bg-red-50 px-4 py-3">
                <Text className="font-body text-[13px] text-red-700">{introBody}</Text>
              </View>
            )}

            {/* #7: Polling timeout recovery */}
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
                <Button
                  title="Refresh status"
                  onPress={handleCheckStatus}
                  loading={isRefetchingStatus}
                  leftIcon={<RefreshCw size={16} color="#FFF" />}
                />
                <Button title="Close" variant="white" onPress={closeSheet} />
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
