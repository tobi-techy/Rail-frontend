import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
} from 'lucide-react-native';
import { Button } from '@/components/ui';
import { type KYCStatusResponse } from '@/api/types/kyc';
import { useKYCStatus } from '@/api/hooks/useKYC';
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

  const {
    data: liveKycStatus,
    refetch: refetchKycStatus,
    isRefetching: isRefetchingStatus,
  } = useKYCStatus(visible);

  const status = liveKycStatus ?? kycStatus;
  const statusMode = resolveStatusMode(status);

  const navigation = useNavigableBottomSheet('intro');
  const { reset: resetNavigation } = navigation;
  const wasVisibleRef = useRef(false);

  const resetFlow = useCallback(() => {
    // Legacy state resets removed since we use Zustand & screens now
  }, []);

  const getInitialScreen = useCallback(() => {
    if (statusMode === 'approved') return 'approved';
    if (statusMode === 'pending') return 'pending';
    return 'intro';
  }, [statusMode]);

  useEffect(() => {
    if (!visible) {
      wasVisibleRef.current = false;
      resetNavigation('intro');
      resetFlow();
      return;
    }

    if (!wasVisibleRef.current) {
      wasVisibleRef.current = true;
      resetNavigation(getInitialScreen());
    }
  }, [visible, getInitialScreen, resetNavigation, resetFlow]);

  useEffect(() => {
    if (!visible) return;

    if (statusMode === 'approved') {
      resetNavigation('approved');
      return;
    }
  }, [visible, statusMode, resetNavigation]);

  const handleStart = useCallback(() => {
    onClose();
    // Using simple setTimeout to ensure modal completes close animation cleanly
    setTimeout(() => {
      import('expo-router').then(({ router }) => router.push('/kyc'));
    }, 100);
  }, [onClose]);

  const handleCheckStatus = useCallback(async () => {
    const result = await refetchKycStatus();
    const nextMode = resolveStatusMode(result.data ?? status);

    if (nextMode === 'approved') {
      resetNavigation('approved');
      return;
    }

    if (nextMode === 'rejected') {
      resetNavigation('intro');
    }
  }, [refetchKycStatus, status, resetNavigation]);

  const handleRetry = useCallback(() => {
    onClose();
    setTimeout(() => {
      import('expo-router').then(({ router }) => router.push('/kyc'));
    }, 100);
  }, [onClose]);

  const closeSheet = useCallback(() => {
    onClose();
  }, [onClose]);

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
                onPress={handleStart}
              />
            )}
          </View>
        </ScrollView>
      ),
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={closeSheet}>
      <View className="flex-1 justify-end bg-black/40">
        <Pressable className="flex-1" onPress={closeSheet} />
        <NavigableBottomSheet navigation={navigation} screens={screens} />
      </View>
    </Modal>
  );
}
