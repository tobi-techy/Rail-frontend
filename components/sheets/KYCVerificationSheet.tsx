import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui';
import { type KYCStatusResponse, type KycStatus, isKycInReview } from '@/api/types/kyc';
import { useKYCStatus, useKycStatusPolling } from '@/api/hooks/useKYC';
import { useMissingKycFields } from '@/api/hooks/useOnboarding';
import { useAuthStore } from '@/stores/authStore';
import { useKycStore } from '@/stores/kycStore';
import { ROUTES } from '@/constants/routes';
import { getKycResumeRoute } from '@/utils/onboardingFlow';
import {
  Alert02Icon,
  Camera01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  File01Icon,
  RefreshIcon,
  ShieldKeyIcon,
  LockPasswordIcon,
} from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';
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

  const hasRequiredProfileFields = Boolean(
    user?.dateOfBirth &&
    (user?.addressStreet || user?.addressCity) &&
    (user?.phone || user?.phoneNumber)
  );

  const { data: missingFieldsData } = useMissingKycFields(visible);
  const backendStartStep = missingFieldsData?.startStep;

  const handleStart = useCallback(() => {
    onClose();
    if (backendStartStep && backendStartStep !== 'none') {
      const resumeRoute = getKycResumeRoute(backendStartStep);
      requestAnimationFrame(() => router.push(resumeRoute as never));
    } else if (!hasRequiredProfileFields && !backendStartStep) {
      // Fallback to client-side check if backend hasn't responded
      const resumeRoute = getKycResumeRoute(useAuthStore.getState().currentOnboardingStep);
      requestAnimationFrame(() => router.push(resumeRoute as never));
    } else {
      requestAnimationFrame(() => router.push('/kyc'));
    }
  }, [onClose, hasRequiredProfileFields, backendStartStep]);

  const handleContinue = useCallback(() => {
    const state = useKycStore.getState();
    const { completedSteps, diditSessionToken } = state;

    let screen = '/kyc';
    if (diditSessionToken || completedSteps.includes('financial')) {
      screen = '/kyc/didit-sdk';
    } else if (completedSteps.includes('identity')) {
      screen = '/kyc/financial';
    }

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
    if (backendStartStep && backendStartStep !== 'none') {
      const resumeRoute = getKycResumeRoute(backendStartStep);
      requestAnimationFrame(() => router.push(resumeRoute as never));
    } else if (!hasRequiredProfileFields && !backendStartStep) {
      const resumeRoute = getKycResumeRoute(useAuthStore.getState().currentOnboardingStep);
      requestAnimationFrame(() => router.push(resumeRoute as never));
    } else {
      requestAnimationFrame(() => router.push('/kyc'));
    }
  }, [onClose, hasRequiredProfileFields, backendStartStep]);

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
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={30} color="#00ca48" />
                  ) : statusMode === 'pending' ? (
                    <HugeiconsIcon icon={Clock01Icon} size={30} color="#F59E0B" />
                  ) : (
                    <HugeiconsIcon icon={Alert02Icon} size={30} color="#ff2b3a" />
                  )}
                </View>
              )}
              <Text
                className={
                  statusMode === 'not_started'
                    ? 'font-display text-[26px] leading-8 text-charcoal-primary'
                    : 'text-center font-subtitle text-[28px] leading-8 text-charcoal-primary'
                }>
                {introTitle}
              </Text>
              <Text
                className={
                  statusMode === 'not_started'
                    ? 'mt-3 font-body text-[16px] leading-6 text-ash'
                    : 'mt-2 text-center font-body text-[15px] leading-6 text-ash'
                }>
                {introBody}
              </Text>
            </View>

            {statusMode === 'not_started' && (
              <>
                <View className="mb-4 rounded-3xl border border-fog bg-warm-canvas">
                  <View className="flex-row items-center gap-4 border-b border-stone-surface p-5">
                    <HugeiconsIcon icon={File01Icon} size={24} color="#343433" />
                    <View className="flex-1">
                      <Text className="font-subtitle text-[15px] text-charcoal-primary">
                        Your photo ID
                      </Text>
                      <Text className="mt-1 font-body text-[13px] leading-5 text-ash">
                        We accept most common forms of ID.
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-4 p-5">
                    <HugeiconsIcon icon={Camera01Icon} size={24} color="#343433" />
                    <View className="flex-1">
                      <Text className="font-subtitle text-[15px] text-charcoal-primary">
                        A quick scan of your face
                      </Text>
                      <Text className="mt-1 font-body text-[13px] leading-5 text-ash">
                        This is to confirm that you match your ID.
                      </Text>
                    </View>
                  </View>
                </View>
                <View className="mb-6 flex-row gap-3">
                  <View className="flex-1 flex-row items-center gap-2 rounded-2xl bg-stone-surface px-3 py-2.5">
                    <HugeiconsIcon icon={ShieldKeyIcon} size={16} color="#848281" />
                    <Text className="flex-1 font-body text-[12px] leading-4 text-ash">
                      256-bit encrypted & never sold
                    </Text>
                  </View>
                  <View className="flex-1 flex-row items-center gap-2 rounded-2xl bg-stone-surface px-3 py-2.5">
                    <HugeiconsIcon icon={LockPasswordIcon} size={16} color="#848281" />
                    <Text className="flex-1 font-body text-[12px] leading-4 text-ash">
                      Required by financial regulations
                    </Text>
                  </View>
                </View>
              </>
            )}

            {statusMode === 'pending' && pollingTimedOut && (
              <View className="mb-4 rounded-2xl bg-sunburst-yellow/10 px-4 py-3">
                <Text className="font-body text-[13px] leading-5 text-amber-800">
                  Verification is taking longer than usual. Tap &quot;Refresh status&quot; to check
                  manually.
                </Text>
              </View>
            )}

            {statusMode === 'approved' ? (
              <Button title="Close" onPress={closeSheet} />
            ) : statusMode === 'pending' ? (
              <View className="flex-row gap-3">
                <Button title="Continue verification" onPress={handleContinue} flex />
                <Button
                  title="Refresh status"
                  variant="white"
                  onPress={handleCheckStatus}
                  loading={isRefetchingStatus}
                  leftIcon={<HugeiconsIcon icon={RefreshIcon} size={16} color="#343433" />}
                  flex
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
