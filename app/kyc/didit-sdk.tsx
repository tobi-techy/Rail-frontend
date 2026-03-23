import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { startVerification, VerificationStatus } from '@didit-protocol/sdk-react-native';

import { useKycStore } from '@/stores/kycStore';
import { logger } from '@/lib/logger';
import { useAnalytics, ANALYTICS_EVENTS } from '@/utils/analytics';
import { Cancel01Icon, RefreshIcon, MessageIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

export default function KycDiditSdkScreen() {
  const { diditSessionToken, setLocalSubmissionPendingAt } = useKycStore();
  const { track } = useAnalytics();
  const [initError, setInitError] = useState(false);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const launching = useRef(false);

  const handleClose = useCallback(() => router.navigate('/(tabs)'), []);
  
  const handleRetry = useCallback(() => {
    setIsRetrying(true);
    setInitError(false);
    setErrorType(null);
    launching.current = false;
    // Small delay before retry to allow state to reset
    setTimeout(() => {
      setIsRetrying(false);
      router.replace('/kyc/documents');
    }, 500);
  }, []);

  const handleContactSupport = useCallback(() => {
    Linking.openURL('mailto:support@userail.money?subject=KYC%20Verification%20Issue');
  }, []);

  // Start verification on mount
  useEffect(() => {
    if (!diditSessionToken) {
      setInitError(true);
      setErrorType('no_session');
      return;
    }
    if (launching.current || isRetrying) return;
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
            setInitError(true);
            setErrorType(result.error.type);
            break;
        }
      } catch (error) {
        logger.error('[DiditSDK] Unexpected error', {
          component: 'DiditSDK',
          action: 'unexpected-error',
          error: error instanceof Error ? error.message : String(error),
        });
        setInitError(true);
        setErrorType('unexpected');
      } finally {
        launching.current = false;
      }
    })();
  }, [diditSessionToken, setLocalSubmissionPendingAt, track, isRetrying]);

  // Get user-friendly error message based on error type
  const getErrorMessage = () => {
    switch (errorType) {
      case 'no_session':
        return 'Your verification session has expired. Please start the process again.';
      case 'network_error':
        return 'Unable to connect to the verification service. Please check your internet connection.';
      case 'timeout':
        return 'The verification process took too long. Please try again.';
      case 'session_expired':
        return 'Your session has expired. Please start the verification process again.';
      default:
        return 'We encountered an issue while verifying your identity. Please try again.';
    }
  };

  const getErrorTitle = () => {
    switch (errorType) {
      case 'no_session':
      case 'session_expired':
        return 'Session Expired';
      case 'network_error':
        return 'Connection Error';
      default:
        return 'Verification Failed';
    }
  };

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
          <HugeiconsIcon icon={Cancel01Icon} size={22} color="#111827" />
        </Pressable>
      </View>
      
      {!initError && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#111827" />
          <Text className="mt-4 font-body text-[15px] text-gray-500">Launching verification…</Text>
          <Text className="mt-2 font-caption text-[13px] text-gray-400">This may take a moment</Text>
        </View>
      )}
      
      {initError && (
        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-6 items-center">
            <HugeiconsIcon name="AlertCircle" size={48} color="#DC2626" />
          </View>
          <Text className="mb-2 text-center font-display text-[22px] text-gray-900">
            {getErrorTitle()}
          </Text>
          <Text className="mb-8 text-center font-body text-[15px] leading-6 text-gray-600">
            {getErrorMessage()}
          </Text>
          
          <View className="w-full gap-y-3">
            <Pressable
              onPress={handleRetry}
              className="flex-row items-center justify-center gap-x-2 rounded-full bg-gray-900 px-6 py-4"
              accessibilityRole="button"
              accessibilityLabel="Try verification again">
              <HugeiconsIcon icon={RefreshIcon} size={18} color="#FFFFFF" />
              <Text className="font-subtitle text-[15px] text-white">Try Again</Text>
            </Pressable>
            
            <Pressable
              onPress={handleContactSupport}
              className="flex-row items-center justify-center gap-x-2 rounded-full border border-gray-200 px-6 py-4"
              accessibilityRole="button"
              accessibilityLabel="Contact support">
              <HugeiconsIcon icon={MessageIcon} size={18} color="#374151" />
              <Text className="font-subtitle text-[15px] text-gray-700">Contact Support</Text>
            </Pressable>
          </View>
          
          <Text className="mt-8 text-center font-caption text-[12px] text-gray-500">
            Having trouble? Our support team is here to help.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
