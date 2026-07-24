import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { startVerification, VerificationStatus } from '@didit-protocol/sdk-react-native';

import { useKycStore } from '@/stores/kycStore';
import { useStartDiditSession } from '@/api/hooks/useKYC';
import { logger } from '@/lib/logger';
import { useAnalytics, ANALYTICS_EVENTS } from '@/utils/analytics';
import type { TransformedApiError } from '@/api/types';
import type { KycDisclosures } from '@/api/types/kyc';
import { useButtonFeedback } from '@/hooks/useButtonFeedback';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import { Alert02Icon, Cancel01Icon, RefreshIcon, MessageIcon } from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';

export default function KycDiditSdkScreen() {
  const { diditSessionToken, setLocalSubmissionPendingAt } = useKycStore();
  const startSession = useStartDiditSession();
  const { track } = useAnalytics();
  const triggerFeedback = useButtonFeedback();
  const { impact } = useHaptics();
  const [initError, setInitError] = useState(false);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const launching = useRef(false);
  const retryingRef = useRef(false);

  const handleClose = useCallback(() => {
    if (router.canDismiss()) {
      router.dismissAll();
    } else {
      router.replace('/(tabs)');
    }
  }, []);

  const handleRetry = useCallback(async () => {
    if (retryingRef.current) return;

    const state = useKycStore.getState();
    const { taxId } = state;

    // If taxId was lost (app killed), can't retry in-place — go back to source-of-funds
    if (!taxId) {
      router.replace('/kyc/financial');
      return;
    }

    retryingRef.current = true;
    setIsRetrying(true);

    setInitError(false);
    setErrorType(null);
    launching.current = false;

    try {
      const result = await startSession.mutateAsync({
        tax_id: taxId,
        tax_id_type: state.taxIdType,
        issuing_country: state.country,
        disclosures: state.disclosures as KycDisclosures,
        source_of_funds: state.sourceOfFunds ?? undefined,
        employment_status: state.employmentStatus ?? undefined,
        expected_monthly_payments_usd: state.expectedMonthlyPayments ?? undefined,
        account_purpose: state.accountPurpose ?? undefined,
        account_purpose_other: state.accountPurposeOther ?? undefined,
        most_recent_occupation: state.mostRecentOccupation ?? undefined,
        acting_as_intermediary: state.actingAsIntermediary,
      });

      if (result.status === 'existing_session') {
        router.replace('/kyc/pending');
        return;
      }

      // Set new session token — triggers useEffect to re-launch SDK
      useKycStore.getState().setDiditSession(result.session_token, result.session_id);
      setIsRetrying(false);
      retryingRef.current = false;
    } catch (error) {
      const apiError = error as TransformedApiError;
      const missingFields = Array.isArray(apiError?.details?.missing_fields)
        ? (apiError.details.missing_fields as string[])
        : [];

      if (missingFields.length > 0) {
        useKycStore.getState().setMissingProfileFields(missingFields);
        router.replace('/kyc/profile-gaps');
        return;
      }

      // Any other error — fall back to source-of-funds with pre-filled data
      router.replace('/kyc/financial');
    }
  }, [startSession]);

  const handleContactSupport = useCallback(() => {
    Linking.openURL('mailto:support@userail.money?subject=KYC%20Verification%20Issue');
  }, []);

  // Start verification on mount or when diditSessionToken changes (from retry)
  useEffect(() => {
    if (!diditSessionToken) {
      setInitError(true);
      setErrorType('no_session');
      return;
    }
    if (launching.current || retryingRef.current) return;
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
              track(ANALYTICS_EVENTS.KYC_VERIFICATION_FAILED, {
                status: result.session.status,
                reason: 'declined',
              });
              setLocalSubmissionPendingAt(new Date().toISOString());
              router.replace('/kyc/pending');
            }
            break;

          case 'cancelled':
            if (router.canDismiss()) {
              router.dismissAll();
            } else {
              router.replace('/(tabs)');
            }
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
  }, [diditSessionToken, setLocalSubmissionPendingAt, track]);

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
    <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 pb-2 pt-1">
        <View className="size-11" />
        <Text className="font-subtitle text-[13px] text-ash" maxFontSizeMultiplier={1.4}>
          Identity verification
        </Text>
        <Pressable
          className="size-11 items-center justify-center"
          onPress={() => {
            handleClose();
          }}
          accessibilityRole="button"
          accessibilityLabel="Close identity verification">
          <HugeiconsIcon icon={Cancel01Icon} size={22} color="#343433" />
        </Pressable>
      </View>

      {!initError && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#343433" />
          <Text className="mt-4 font-body text-[15px] text-ash" maxFontSizeMultiplier={1.4}>
            Launching verification…
          </Text>
          <Text className="mt-2 font-caption text-[13px] text-smoke" maxFontSizeMultiplier={1.4}>
            This may take a moment
          </Text>
        </View>
      )}

      {initError && (
        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-6 items-center">
            <HugeiconsIcon icon={Alert02Icon} size={48} color="#ff2b3a" />
          </View>
          <Text
            className="mb-2 text-center font-display text-[22px] text-charcoal-primary"
            maxFontSizeMultiplier={1.3}>
            {getErrorTitle()}
          </Text>
          <Text
            className="mb-8 text-center font-body text-[15px] leading-6 text-ash"
            maxFontSizeMultiplier={1.4}>
            {getErrorMessage()}
          </Text>

          <View className="w-full flex-row gap-3">
            <Pressable
              onPress={() => {
                triggerFeedback();
                handleRetry();
              }}
              disabled={isRetrying}
              className="flex-1 flex-row items-center justify-center gap-x-2 rounded-full bg-primary px-6 py-4"
              accessibilityRole="button"
              accessibilityLabel="Try verification again">
              {isRetrying ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <HugeiconsIcon icon={RefreshIcon} size={18} color="#FFFFFF" />
              )}
              <Text className="font-subtitle text-[15px] text-white" maxFontSizeMultiplier={1.3}>
                {isRetrying ? 'Creating session…' : 'Try Again'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                triggerFeedback();
                handleContactSupport();
              }}
              className="flex-1 flex-row items-center justify-center gap-x-2 rounded-full border border-fog px-6 py-4"
              accessibilityRole="button"
              accessibilityLabel="Contact support">
              <HugeiconsIcon icon={MessageIcon} size={18} color="#474645" />
              <Text className="font-subtitle text-[15px] text-graphite" maxFontSizeMultiplier={1.3}>
                Contact Support
              </Text>
            </Pressable>
          </View>

          <Text
            className="mt-8 text-center font-caption text-[12px] text-ash"
            maxFontSizeMultiplier={1.4}>
            Having trouble? Our support team is here to help.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
