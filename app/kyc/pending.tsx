import React, { useCallback, useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CheckCircle2, Clock, XCircle } from 'lucide-react-native';
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
import type { KycStatus } from '@/api/types/kyc';

export default function KycPendingScreen() {
  const { resetKycState } = useKycStore();

  const opacity = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

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
        resetKycState();
        router.dismissAll();
      }
      // rejected/expired — stay on screen to show the result
    },
    [resetKycState]
  );

  const { data } = useKycStatusPolling(true, handleTerminal, {
    timeoutMs: 10 * 60 * 1000,
  });

  const status = data?.status;
  const isTerminal = status === 'approved' || status === 'rejected' || status === 'expired';

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center px-8">
        {status === 'approved' ? (
          <>
            <CheckCircle2 size={56} color="#16A34A" />
            <Text className="mt-6 font-display text-[26px] text-gray-900 text-center">
              You&apos;re verified
            </Text>
            <Text className="mt-2 font-body text-[15px] leading-6 text-gray-500 text-center">
              Your identity has been confirmed. Rail is ready.
            </Text>
            <Pressable
              onPress={() => {
                resetKycState();
                router.dismissAll();
              }}
              className="mt-8 rounded-full bg-gray-900 px-8 py-4"
              accessibilityRole="button">
              <Text className="font-subtitle text-[15px] text-white">Get started</Text>
            </Pressable>
          </>
        ) : status === 'rejected' || status === 'expired' ? (
          <>
            <XCircle size={56} color="#DC2626" />
            <Text className="mt-6 font-display text-[26px] text-gray-900 text-center">
              Verification unsuccessful
            </Text>
            <Text className="mt-2 font-body text-[15px] leading-6 text-gray-500 text-center">
              {data?.rejection_reason ??
                'We could not verify your identity. Please try again or contact support.'}
            </Text>
            <Pressable
              onPress={() => router.replace('/kyc/documents')}
              className="mt-8 rounded-full bg-gray-900 px-8 py-4"
              accessibilityRole="button">
              <Text className="font-subtitle text-[15px] text-white">Try again</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Animated.View style={animatedStyle}>
              <Clock size={56} color="#111827" />
            </Animated.View>
            <Text className="mt-6 font-display text-[26px] text-gray-900 text-center">
              Verifying your identity
            </Text>
            <Text className="mt-2 font-body text-[15px] leading-6 text-gray-500 text-center">
              This usually takes a few minutes. You can close this screen — we&apos;ll notify you
              when it&apos;s done.
            </Text>
            <Pressable
              onPress={() => router.dismissAll()}
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
