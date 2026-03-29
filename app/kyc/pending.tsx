import React, { useCallback, useEffect } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { useKycStatusPolling } from '@/api/hooks/useKYC';
import { useKycStore } from '@/stores/kycStore';
import { useAuthStore } from '@/stores/authStore';
import { invalidateQueries } from '@/api/queryClient';
import type { KycStatus } from '@/api/types/kyc';
import {
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  RefreshIcon,
  MessageIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

export default function KycPendingScreen() {
  const { resetKycState, localSubmissionPendingAt, setLocalSubmissionPendingAt } = useKycStore();

  const opacity = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const [hasTimedOut, setHasTimedOut] = React.useState(false);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.3, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const handleTerminal = useCallback(
    (status: KycStatus) => {
      if (status === 'approved') {
        useAuthStore.getState().setOnboardingStatus('completed');
        setLocalSubmissionPendingAt(null);
        resetKycState();
        router.replace('/(tabs)');
      }
      // rejected/expired — stay on screen to show the result
    },
    [resetKycState, setLocalSubmissionPendingAt]
  );

  const handleRetry = useCallback(() => {
    setHasTimedOut(false);
    invalidateQueries.user();
    router.replace('/kyc');
  }, []);

  const handleContactSupport = useCallback(() => {
    Linking.openURL('mailto:support@userail.money?subject=KYC%20Verification%20Issue');
  }, []);

  const { data, isError } = useKycStatusPolling(true, handleTerminal, {
    timeoutMs: 10 * 60 * 1000,
  });

  const status = data?.status;

  // If the user landed here without actually submitting (e.g. skipped KYC and came back),
  // don't show the polling spinner — send them back to the submission flow.
  useEffect(() => {
    if (data && !data.has_submitted && !localSubmissionPendingAt && status !== 'approved') {
      router.replace('/kyc');
    }
  }, [data, localSubmissionPendingAt, status]);

  useEffect(() => {
    const timeoutId = setTimeout(
      () => {
        if (status === 'pending' || status === 'processing') {
          setHasTimedOut(true);
        }
      },
      10 * 60 * 1000
    );

    return () => clearTimeout(timeoutId);
  }, [status]);

  useEffect(() => {
    if (status === 'approved' || status === 'rejected' || status === 'expired') {
      setLocalSubmissionPendingAt(null);
      setHasTimedOut(false);
    }
  }, [setLocalSubmissionPendingAt, status]);

  // Get user-friendly rejection reason
  const getRejectionMessage = () => {
    if (data?.rejection_reason) {
      return data.rejection_reason;
    }
    return 'We could not verify your identity. The information provided may not have matched your ID document. Please try again with accurate information.';
  };

  // Show specific guidance on timeout
  const getTimeoutMessage = () => {
    if (hasTimedOut) {
      return 'Verification is taking longer than expected. Your documents may need additional review. You can try again or contact support for assistance.';
    }
    return 'This usually takes a few minutes. You can close this screen — we&apos;ll notify you when it&apos;s done.';
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center px-8">
        {isError ? (
          <>
            <HugeiconsIcon icon={CancelCircleIcon} size={56} color="#EF4444" />
            <Text className="mt-6 text-center font-display text-[26px] text-gray-900">
              Connection error
            </Text>
            <Text className="mt-2 text-center font-body text-[15px] leading-6 text-gray-500">
              Unable to check your verification status. Please try again later.
            </Text>
            <Pressable
              onPress={() => router.back()}
              className="mt-8 rounded-full bg-gray-900 px-8 py-4"
              accessibilityRole="button">
              <Text className="font-subtitle text-[15px] text-white">Close</Text>
            </Pressable>
          </>
        ) : status === 'approved' ? (
          <>
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={56} color="#16A34A" />
            <Text className="mt-6 text-center font-display text-[26px] text-gray-900">
              You&apos;re verified
            </Text>
            <Text className="mt-2 text-center font-body text-[15px] leading-6 text-gray-500">
              Your identity has been confirmed. Rail is ready.
            </Text>
            <Pressable
              onPress={() => {
                resetKycState();
                router.replace('/(tabs)');
              }}
              className="mt-8 rounded-full bg-gray-900 px-8 py-4"
              accessibilityRole="button">
              <Text className="font-subtitle text-[15px] text-white">Get started</Text>
            </Pressable>
          </>
        ) : status === 'rejected' || status === 'expired' ? (
          <>
            <HugeiconsIcon icon={CancelCircleIcon} size={56} color="#DC2626" />
            <Text className="mt-6 text-center font-display text-[26px] text-gray-900">
              Verification unsuccessful
            </Text>
            <Text className="mt-2 text-center font-body text-[15px] leading-6 text-gray-500">
              {getRejectionMessage()}
            </Text>
            <View className="mt-6 w-full gap-y-3">
              <Pressable
                onPress={handleRetry}
                className="flex-row items-center justify-center gap-x-2 rounded-full bg-gray-900 px-8 py-4"
                accessibilityRole="button">
                <HugeiconsIcon icon={RefreshIcon} size={18} color="#FFFFFF" />
                <Text className="font-subtitle text-[15px] text-white">Try Again</Text>
              </Pressable>
              <Pressable
                onPress={handleContactSupport}
                className="flex-row items-center justify-center gap-x-2 rounded-full border border-gray-200 px-8 py-4"
                accessibilityRole="button">
                <HugeiconsIcon icon={MessageIcon} size={18} color="#374151" />
                <Text className="font-subtitle text-[15px] text-gray-700">Contact Support</Text>
              </Pressable>
            </View>
          </>
        ) : hasTimedOut ? (
          // Timeout state - show retry and support options
          <>
            <HugeiconsIcon icon={Clock01Icon} size={56} color="#F59E0B" />
            <Text className="mt-6 text-center font-display text-[26px] text-gray-900">
              Taking longer than expected
            </Text>
            <Text className="mt-2 text-center font-body text-[15px] leading-6 text-gray-500">
              {getTimeoutMessage()}
            </Text>
            <View className="mt-6 w-full gap-y-3">
              <Pressable
                onPress={handleRetry}
                className="flex-row items-center justify-center gap-x-2 rounded-full bg-gray-900 px-8 py-4"
                accessibilityRole="button">
                <HugeiconsIcon icon={RefreshIcon} size={18} color="#FFFFFF" />
                <Text className="font-subtitle text-[15px] text-white">Start New Verification</Text>
              </Pressable>
              <Pressable
                onPress={handleContactSupport}
                className="flex-row items-center justify-center gap-x-2 rounded-full border border-gray-200 px-8 py-4"
                accessibilityRole="button">
                <HugeiconsIcon icon={MessageIcon} size={18} color="#374151" />
                <Text className="font-subtitle text-[15px] text-gray-700">Contact Support</Text>
              </Pressable>
              <Pressable
                onPress={() => router.replace('/(tabs)')}
                className="mt-2 py-2"
                accessibilityRole="button">
                <Text className="text-center font-body text-[14px] text-gray-500">
                  Continue to app
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          // Still processing
          <>
            <Animated.View style={animatedStyle}>
              <HugeiconsIcon icon={Clock01Icon} size={56} color="#111827" />
            </Animated.View>
            <Text className="mt-6 text-center font-display text-[26px] text-gray-900">
              Verifying your identity
            </Text>
            <Text className="mt-2 text-center font-body text-[15px] leading-6 text-gray-500">
              {getTimeoutMessage()}
            </Text>
            <Pressable
              onPress={() => router.replace('/(tabs)')}
              className="mt-8 rounded-full border border-gray-200 px-8 py-4"
              accessibilityRole="button">
              <Text className="font-subtitle text-[15px] text-gray-700">Close</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
