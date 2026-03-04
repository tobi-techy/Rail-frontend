import React, { useCallback, useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import SNSMobileSDK from '@sumsub/react-native-mobilesdk-module';

import { useKycStore } from '@/stores/kycStore';
import { kycService } from '@/api/services';
import { logger } from '@/lib/logger';

export default function KycSumsubSdkScreen() {
  const { sumsubToken, applicantId, setSumsubSession } = useKycStore();

  const handleClose = useCallback(() => router.back(), []);

  useEffect(() => {
    if (!sumsubToken || !applicantId) return;

    const tokenExpirationHandler = async (): Promise<string> => {
      const { token, applicant_id } = await kycService.refreshSumsubToken();
      setSumsubSession(token, applicant_id);
      return token;
    };

    let didSubmit = false;

    let sdkInstance: { dismiss: () => void } | null = null;

    const builder = SNSMobileSDK.init(sumsubToken, tokenExpirationHandler)
      .withLocale('en')
      .withApplicantConf({ applicantId })
      .withHandlers({
        onStatusChanged: (event) => {
          if (event.newStatus === 'Pending' || event.newStatus === 'Approved') {
            didSubmit = true;
            sdkInstance?.dismiss();
          }
        },
      })
      .withAutoCloseOnApprove(0)
      .build();

    sdkInstance = builder;

    builder
      .launch()
      .then(() => {
        // SDK closed — only navigate to pending if a submission actually happened
        if (didSubmit) {
          router.replace('/kyc/pending');
        } else {
          router.back();
        }
      })
      .catch((error: unknown) => {
        logger.error('[SumsubSDK] Session failed', {
          component: 'SumsubSDK',
          action: 'session-error',
          error: error instanceof Error ? error.message : String(error),
        });
        router.back();
      });
  }, [sumsubToken, applicantId, setSumsubSession]);

  if (!sumsubToken || !applicantId) return null;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 pb-2 pt-1">
        <View className="size-11" />
        <Text className="font-subtitle text-[13px] text-gray-500">Identity scan</Text>
        <Pressable
          className="size-11 items-center justify-center"
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close identity scan">
          <X size={22} color="#111827" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
