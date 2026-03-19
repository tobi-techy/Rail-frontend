import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { startVerification, VerificationStatus } from '@didit-protocol/sdk-react-native';

import { useKycStore } from '@/stores/kycStore';
import { logger } from '@/lib/logger';
import { useAnalytics, ANALYTICS_EVENTS } from '@/utils/analytics';

export default function KycDiditSdkScreen() {
  const { diditSessionToken, setLocalSubmissionPendingAt } = useKycStore();
  const { track } = useAnalytics();
  const [initError, setInitError] = useState(false);
  const launching = useRef(false);

  const handleClose = useCallback(() => router.navigate('/(tabs)'), []);

  useEffect(() => {
    if (!diditSessionToken) {
      setInitError(true);
      return;
    }
    if (launching.current) return;
    launching.current = true;

    (async () => {
      try {
        const result = await startVerification(diditSessionToken);

        switch (result.type) {
          case 'completed':
            if (
              result.session.status === VerificationStatus.Approved ||
              result.session.status === VerificationStatus.Pending
            ) {
              track(ANALYTICS_EVENTS.KYC_VERIFICATION_COMPLETED, {
                status: result.session.status,
              });
              setLocalSubmissionPendingAt(new Date().toISOString());
              router.replace('/kyc/pending');
            } else {
              // Declined — still go to pending so polling picks up the status
              setLocalSubmissionPendingAt(new Date().toISOString());
              router.replace('/kyc/pending');
            }
            break;

          case 'cancelled':
            router.navigate('/(tabs)');
            break;

          case 'failed':
            logger.error('[DiditSDK] Verification failed', {
              component: 'DiditSDK',
              action: 'verification-failed',
              errorType: result.error.type,
              error: result.error.message,
            });
            track(ANALYTICS_EVENTS.KYC_VERIFICATION_FAILED, {
              error: result.error.message,
            });
            router.navigate('/(tabs)');
            break;
        }
      } catch (error) {
        logger.error('[DiditSDK] Unexpected error', {
          component: 'DiditSDK',
          action: 'unexpected-error',
          error: error instanceof Error ? error.message : String(error),
        });
        router.back();
      } finally {
        launching.current = false;
      }
    })();
  }, [diditSessionToken, setLocalSubmissionPendingAt, track]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 pb-2 pt-1">
        <View className="size-11" />
        <Text className="font-subtitle text-[13px] text-gray-500">Identity verification</Text>
        <Pressable
          className="size-11 items-center justify-center"
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close identity verification">
          <X size={22} color="#111827" />
        </Pressable>
      </View>
      {!initError && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#111827" />
          <Text className="mt-4 font-body text-[15px] text-gray-500">Launching verification…</Text>
        </View>
      )}
      {initError && (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-body text-[15px] text-gray-500">
            Unable to start verification. Please go back and try again.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
