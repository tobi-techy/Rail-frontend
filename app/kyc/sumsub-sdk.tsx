import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import SNSMobileSDK from '@sumsub/react-native-mobilesdk-module';

import { useKycStore } from '@/stores/kycStore';
import { kycService } from '@/api/services';
import { logger } from '@/lib/logger';
import { useAnalytics, ANALYTICS_EVENTS } from '@/utils/analytics';

export default function KycSumsubSdkScreen() {
  const { sumsubToken, applicantId, setSumsubSession, setLocalSubmissionPendingAt } = useKycStore();
  const { track } = useAnalytics();
  const [resolvedToken, setResolvedToken] = useState<string | null>(sumsubToken);
  const [resolvedApplicantId, setResolvedApplicantId] = useState<string | null>(applicantId);
  const [initError, setInitError] = useState(false);

  const handleClose = useCallback(() => router.back(), []);

  // If we arrive here without a token (e.g. "Continue verification" after a network drop),
  // refresh the token from the server before launching the SDK.
  useEffect(() => {
    if (resolvedToken && resolvedApplicantId) return;
    kycService
      .refreshSumsubToken()
      .then(({ token, applicant_id }) => {
        setSumsubSession(token, applicant_id);
        setResolvedToken(token);
        setResolvedApplicantId(applicant_id);
      })
      .catch((err: unknown) => {
        logger.error('[SumsubSDK] Token refresh failed', {
          component: 'SumsubSDK',
          action: 'token-refresh',
          error: err instanceof Error ? err.message : String(err),
        });
        setInitError(true);
      });
  }, [resolvedToken, resolvedApplicantId, setSumsubSession]);

  const launching = useRef(false);

  useEffect(() => {
    if (!resolvedToken || !resolvedApplicantId) return;
    if (launching.current) return;
    launching.current = true;

    const tokenExpirationHandler = async (): Promise<string> => {
      const { token, applicant_id } = await kycService.refreshSumsubToken();
      setSumsubSession(token, applicant_id);
      return token;
    };

    let didSubmit = false;
    let sdkInstance: { dismiss: () => void } | null = null;

    const builder = SNSMobileSDK.init(resolvedToken, tokenExpirationHandler)
      .withLocale('en')
      .withApplicantConf({ applicantId: resolvedApplicantId })
      .withHandlers({
        onStatusChanged: (event) => {
          if (event.newStatus === 'Approved') {
            track(ANALYTICS_EVENTS.KYC_VERIFICATION_COMPLETED, { status: event.newStatus });
            didSubmit = true;
            setLocalSubmissionPendingAt(new Date().toISOString());
            sdkInstance?.dismiss();
          } else if (event.newStatus === 'Pending') {
            didSubmit = true;
            setLocalSubmissionPendingAt(new Date().toISOString());
            sdkInstance?.dismiss();
          }
          // TemporarilyDeclined = liveness/doc check failed but user can retry within the same
          // applicant session. Do NOT set didSubmit — let the SDK stay open so the user retries.
          // If they close manually, router.back() returns them to the dashboard where they
          // can tap "Continue verification" to re-enter.
        },
      })
      .build();

    sdkInstance = builder;

    builder
      .launch()
      .then(() => {
        launching.current = false;
        if (didSubmit) {
          router.replace('/kyc/pending');
        } else {
          router.back();
        }
      })
      .catch((error: unknown) => {
        launching.current = false;
        track(ANALYTICS_EVENTS.KYC_VERIFICATION_FAILED, {
          error: error instanceof Error ? error.message : String(error),
        });
        logger.error('[SumsubSDK] Session failed', {
          component: 'SumsubSDK',
          action: 'session-error',
          error: error instanceof Error ? error.message : String(error),
        });
        router.back();
      });
  }, [resolvedToken, resolvedApplicantId, setLocalSubmissionPendingAt, setSumsubSession, track]);

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
      {!resolvedToken && !initError && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#111827" />
        </View>
      )}
      {initError && (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-body text-[15px] text-gray-500">
            Unable to start verification. Please check your connection and try again.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
