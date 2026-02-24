import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronDown, ArrowLeft, ShieldCheck, Clock, XCircle } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import SNSMobileSDK from '@sumsub/react-native-mobilesdk-module';
import { AuthGradient, StaggeredChild } from '@/components';
import { Button, Input } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { useKYCStatus, useStartSumsubSession, useKycStatusPolling } from '@/api/hooks/useKYC';
import { useAuthStore } from '@/stores/authStore';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import type { KycUiState, Country, TaxIdType, KycDisclosures, KycStatus } from '@/api/types/kyc';
import {
  COUNTRY_TAX_CONFIG,
  COUNTRY_LABELS,
  COUNTRY_HELP_TEXT,
  validateTaxId,
} from '@/api/types/kyc';

// ─── Constants ───────────────────────────────────────────────

const COUNTRIES: Country[] = ['USA', 'GBR', 'NGA'];

const DEFAULT_DISCLOSURES: KycDisclosures = {
  is_control_person: false,
  is_affiliated_exchange_or_finra: false,
  is_politically_exposed: false,
  immediate_family_exposed: false,
};

const DISCLOSURE_LABELS: Record<keyof KycDisclosures, string> = {
  is_control_person: 'I am a control person of a publicly traded company',
  is_affiliated_exchange_or_finra: 'I am affiliated with a stock exchange or FINRA',
  is_politically_exposed: 'I am a politically exposed person',
  immediate_family_exposed: 'An immediate family member is politically exposed',
};

// ─── Helpers ─────────────────────────────────────────────────

function deriveUiState(status?: KycStatus, hasSubmitted?: boolean): KycUiState {
  if (!status) return 'collecting_inputs';
  if (status === 'approved') return 'approved';
  if (status === 'rejected' || status === 'expired') return 'rejected';
  if (status === 'processing' || (status === 'pending' && hasSubmitted)) {
    return 'submitted_waiting_review';
  }
  return 'collecting_inputs';
}

function normalizeTaxIdForApi(value: string, type: TaxIdType): string {
  const trimmed = value.trim();

  switch (type) {
    case 'ssn':
    case 'itin':
    case 'utr':
    case 'nin':
    case 'bvn':
    case 'tin':
      return trimmed.replace(/\D/g, '');
    case 'nino':
      return trimmed.replace(/\s+/g, '').toUpperCase();
    default:
      return trimmed;
  }
}

// ─── Screen ──────────────────────────────────────────────────

export default function KYCVerificationScreen() {
  const setOnboardingStatus = useAuthStore((s) => s.setOnboardingStatus);
  const onboardingStatus = useAuthStore((s) => s.onboardingStatus);
  const { showError, showSuccess } = useFeedbackPopup();

  // State machine
  const [uiState, setUiState] = useState<KycUiState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [terminalReason, setTerminalReason] = useState('');
  const [isRetryingRejected, setIsRetryingRejected] = useState(false);
  const [hasFreshSubmission, setHasFreshSubmission] = useState(false);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [pollingResetKey, setPollingResetKey] = useState(0);

  // Form state
  const [country, setCountry] = useState<Country>('USA');
  const [taxIdType, setTaxIdType] = useState<TaxIdType>('ssn');
  const [taxId, setTaxId] = useState('');
  const [taxIdError, setTaxIdError] = useState('');
  const [disclosures, setDisclosures] = useState<KycDisclosures>(DEFAULT_DISCLOSURES);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showTaxTypePicker, setShowTaxTypePicker] = useState(false);

  // Hooks
  const {
    data: kycStatus,
    isLoading: isStatusLoading,
    isRefetching: isStatusRefetching,
    refetch: refetchKycStatus,
  } = useKYCStatus();
  const startSession = useStartSumsubSession();

  const setOnboardingStatusIfChanged = useCallback(
    (nextStatus: string) => {
      if (onboardingStatus !== nextStatus) {
        setOnboardingStatus(nextStatus);
      }
    },
    [onboardingStatus, setOnboardingStatus]
  );

  const transitionTo = useCallback((nextState: KycUiState) => {
    setUiState((current) => (current === nextState ? current : nextState));
  }, []);

  // Keep UI in sync with latest /kyc/status unless we are actively inside SDK.
  useEffect(() => {
    if (isStatusLoading) return;
    if (uiState === 'creating_session' || uiState === 'sdk_in_progress') return;

    const derived = deriveUiState(kycStatus?.status as KycStatus, kycStatus?.has_submitted);

    if (derived === 'approved') {
      setHasFreshSubmission(false);
      setTerminalReason('');
      transitionTo('approved');
      setOnboardingStatusIfChanged('completed');
      return;
    }

    if (derived === 'rejected') {
      if (hasFreshSubmission) {
        transitionTo('submitted_waiting_review');
        return;
      }
      if (isRetryingRejected) {
        transitionTo('collecting_inputs');
        return;
      }
      transitionTo('rejected');
      setOnboardingStatusIfChanged('kyc_rejected');
      return;
    }

    if (derived === 'submitted_waiting_review') {
      setHasFreshSubmission(false);
      transitionTo('submitted_waiting_review');
      setOnboardingStatusIfChanged('kyc_pending');
      return;
    }

    if (hasFreshSubmission) {
      transitionTo('submitted_waiting_review');
      return;
    }

    transitionTo('collecting_inputs');
  }, [
    kycStatus?.status,
    kycStatus?.has_submitted,
    isStatusLoading,
    uiState,
    hasFreshSubmission,
    isRetryingRejected,
    transitionTo,
    setOnboardingStatusIfChanged,
  ]);

  // Polling — only when waiting for review
  const isPolling = uiState === 'submitted_waiting_review' && !pollTimedOut;
  const handleTerminal = useCallback(
    (status: KycStatus) => {
      setPollTimedOut(false);
      setHasFreshSubmission(false);

      if (status === 'approved') {
        setTerminalReason('');
        transitionTo('approved');
        setOnboardingStatusIfChanged('completed');
        showSuccess('Verified', 'Your identity has been verified.');
      } else if (status === 'rejected' || status === 'expired') {
        transitionTo('rejected');
        setIsRetryingRejected(false);
        setOnboardingStatusIfChanged('kyc_rejected');
        setTerminalReason(
          status === 'expired'
            ? 'Your verification session expired. Please retry verification.'
            : ''
        );
      }
    },
    [setOnboardingStatusIfChanged, showSuccess, transitionTo]
  );

  const handlePollingTimeout = useCallback(() => {
    setPollTimedOut(true);
  }, []);

  useKycStatusPolling(isPolling, handleTerminal, {
    onTimeout: handlePollingTimeout,
    resetKey: pollingResetKey,
  });

  // Country change resets tax fields
  const handleCountryChange = useCallback((c: Country) => {
    setCountry(c);
    const options = COUNTRY_TAX_CONFIG[c];
    setTaxIdType(options[0].type);
    setTaxId('');
    setTaxIdError('');
    setShowCountryPicker(false);
  }, []);

  const handleTaxTypeChange = useCallback((t: TaxIdType) => {
    setTaxIdType(t);
    setTaxId('');
    setTaxIdError('');
    setShowTaxTypePicker(false);
  }, []);

  const toggleDisclosure = useCallback((key: keyof KycDisclosures) => {
    setDisclosures((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const taxOptions = useMemo(() => COUNTRY_TAX_CONFIG[country], [country]);
  const activeTaxConfig = useMemo(
    () => taxOptions.find((o) => o.type === taxIdType),
    [taxOptions, taxIdType]
  );

  // ─── Submit & Launch SDK ─────────────────────────────────

  const handleStartVerification = useCallback(async () => {
    setErrorMsg('');
    setTerminalReason('');
    setIsRetryingRejected(false);
    setHasFreshSubmission(false);
    setPollTimedOut(false);

    // Validate
    if (!taxId.trim()) {
      setTaxIdError(`Enter your ${activeTaxConfig?.label ?? 'Tax ID'}`);
      return;
    }
    const validationError = validateTaxId(country, taxIdType, taxId);
    if (validationError) {
      setTaxIdError(validationError);
      return;
    }
    const normalizedTaxId = normalizeTaxIdForApi(taxId, taxIdType);

    transitionTo('creating_session');

    try {
      const session = await startSession.mutateAsync({
        tax_id: normalizedTaxId,
        tax_id_type: taxIdType,
        issuing_country: country,
        disclosures,
      });

      transitionTo('sdk_in_progress');

      // Launch native Sumsub SDK
      const result = await SNSMobileSDK.init(session.token, () => {
        // Token refresh — re-create session
        return startSession
          .mutateAsync({
            tax_id: normalizedTaxId,
            tax_id_type: taxIdType,
            issuing_country: country,
            disclosures,
          })
          .then((r) => r.token);
      })
        .withHandlers({
          onStatusChanged: (event: { prevStatus: string; newStatus: string }) => {
            if (__DEV__) console.warn('[Sumsub]', event.prevStatus, '->', event.newStatus);
          },
        })
        .withLocale('en')
        .withAutoCloseOnApprove(3)
        .build()
        .launch();

      // SDK closed — check result
      if (result.success || result.status === 'ActionCompleted') {
        setHasFreshSubmission(true);
        setIsRetryingRejected(false);
        transitionTo('submitted_waiting_review');
        setOnboardingStatusIfChanged('kyc_pending');
        setPollingResetKey((value) => value + 1);
      } else if (result.status === 'Ready' || result.status === 'Initial') {
        // User dismissed without completing
        transitionTo('collecting_inputs');
      } else if (result.status === 'Failed') {
        transitionTo('error');
        setErrorMsg(result.errorMsg || 'Verification failed. Please try again.');
      } else {
        // Treat any other close as pending if they got far enough
        setHasFreshSubmission(true);
        setIsRetryingRejected(false);
        transitionTo('submitted_waiting_review');
        setOnboardingStatusIfChanged('kyc_pending');
        setPollingResetKey((value) => value + 1);
      }
    } catch (err: any) {
      transitionTo('error');
      setErrorMsg(err?.message || 'Failed to start verification. Please try again.');
      showError('Verification Error', err?.message || 'Something went wrong.');
    }
  }, [
    country,
    taxIdType,
    taxId,
    disclosures,
    activeTaxConfig,
    startSession,
    transitionTo,
    setOnboardingStatusIfChanged,
    showError,
  ]);

  const handleManualStatusRefresh = useCallback(async () => {
    setPollTimedOut(false);
    setPollingResetKey((value) => value + 1);

    const result = await refetchKycStatus();
    const latestStatus = result.data?.status as KycStatus | undefined;
    if (!latestStatus) return;

    if (latestStatus === 'approved' || latestStatus === 'rejected' || latestStatus === 'expired') {
      handleTerminal(latestStatus);
    }
  }, [refetchKycStatus, handleTerminal]);

  // ─── Render ──────────────────────────────────────────────

  if (isStatusLoading) {
    return (
      <AuthGradient>
        <SafeAreaView className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#000" />
        </SafeAreaView>
      </AuthGradient>
    );
  }
  if (uiState === 'approved') {
    return (
      <AuthGradient>
        <SafeAreaView className="flex-1 px-6">
          <StatusBar barStyle="dark-content" />
          <View className="flex-1 items-center justify-center">
            <Animated.View entering={FadeInUp.duration(400)} className="items-center">
              <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-green-50">
                <ShieldCheck size={40} color="#22C55E" />
              </View>
              <Text className="font-subtitle text-2xl text-black">Identity Verified</Text>
              <Text className="mt-2 text-center font-body text-sm text-black/60">
                You now have full access to all features.
              </Text>
            </Animated.View>
          </View>
          <View className="pb-4">
            <Button title="Continue" onPress={() => router.replace(ROUTES.TABS as any)} />
          </View>
        </SafeAreaView>
      </AuthGradient>
    );
  }

  // Terminal: Rejected
  if (uiState === 'rejected') {
    return (
      <AuthGradient>
        <SafeAreaView className="flex-1 px-6">
          <StatusBar barStyle="dark-content" />
          <BackButton />
          <View className="flex-1 items-center justify-center">
            <Animated.View entering={FadeInUp.duration(400)} className="items-center">
              <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-red-50">
                <XCircle size={40} color="#EF4444" />
              </View>
              <Text className="font-subtitle text-2xl text-black">Verification Rejected</Text>
              <Text className="mt-2 text-center font-body text-sm text-black/60">
                {kycStatus?.rejection_reason ||
                  terminalReason ||
                  'Your verification was not approved.'}
              </Text>
            </Animated.View>
          </View>
          <View className="gap-y-3 pb-4">
            <Button
              title="Retry Verification"
              onPress={() => {
                setTerminalReason('');
                setIsRetryingRejected(true);
                setPollTimedOut(false);
                transitionTo('collecting_inputs');
              }}
            />
            <Button title="Go Back" variant="white" onPress={() => router.back()} />
          </View>
        </SafeAreaView>
      </AuthGradient>
    );
  }

  // Waiting for review
  if (uiState === 'submitted_waiting_review') {
    return (
      <AuthGradient>
        <SafeAreaView className="flex-1 px-6">
          <StatusBar barStyle="dark-content" />
          <BackButton />
          <View className="flex-1 items-center justify-center">
            <Animated.View entering={FadeInUp.duration(400)} className="items-center">
              <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-amber-50">
                <Clock size={40} color="#F59E0B" />
              </View>
              <Text className="font-subtitle text-2xl text-black">Under Review</Text>
              <Text className="mt-3 text-center font-body text-sm leading-5 text-black/60">
                {pollTimedOut
                  ? 'Review is taking longer than usual. Refresh status anytime.'
                  : 'Verification submitted. Review may take a few minutes.'}
              </Text>
              {!!kycStatus?.next_steps?.length && (
                <View className="mt-4 rounded-2xl bg-black/5 px-4 py-3">
                  {kycStatus.next_steps.slice(0, 2).map((step, index) => (
                    <Text key={`${step}-${index}`} className="font-body text-[13px] text-black/70">
                      • {step}
                    </Text>
                  ))}
                </View>
              )}
              {!pollTimedOut && <ActivityIndicator className="mt-6" color="#000" />}
            </Animated.View>
          </View>
          <View className="gap-y-3 pb-4">
            {pollTimedOut && (
              <Button
                title="Refresh Status"
                onPress={handleManualStatusRefresh}
                loading={isStatusRefetching}
              />
            )}
            <Button title="Done" variant="white" onPress={() => router.back()} />
          </View>
        </SafeAreaView>
      </AuthGradient>
    );
  }

  // Error state
  if (uiState === 'error') {
    return (
      <AuthGradient>
        <SafeAreaView className="flex-1 px-6">
          <StatusBar barStyle="dark-content" />
          <BackButton />
          <View className="flex-1 items-center justify-center">
            <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-red-50">
              <XCircle size={40} color="#EF4444" />
            </View>
            <Text className="font-subtitle text-xl text-black">Something went wrong</Text>
            <Text className="mt-2 text-center font-body text-sm text-black/60">{errorMsg}</Text>
          </View>
          <View className="gap-y-3 pb-4">
            <Button title="Try Again" onPress={() => transitionTo('collecting_inputs')} />
            <Button title="Go Back" variant="white" onPress={() => router.back()} />
          </View>
        </SafeAreaView>
      </AuthGradient>
    );
  }

  // Creating session / SDK in progress — show loading
  if (uiState === 'creating_session' || uiState === 'sdk_in_progress') {
    return (
      <AuthGradient>
        <SafeAreaView className="flex-1 items-center justify-center">
          <StatusBar barStyle="dark-content" />
          <ActivityIndicator size="large" color="#000" />
          <Text className="mt-4 font-body text-sm text-black/60">
            {uiState === 'creating_session'
              ? 'Preparing verification…'
              : 'Verification in progress…'}
          </Text>
        </SafeAreaView>
      </AuthGradient>
    );
  }

  // ─── Main Form: collecting_inputs ────────────────────────

  const taxValidationMessage = validateTaxId(country, taxIdType, taxId);
  const isFormValid = taxId.trim().length > 0 && !taxValidationMessage;

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={Platform.OS === 'android'}
        />
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow px-6 pb-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <BackButton />
          <StaggeredChild index={0}>
            <View className="mb-6 mt-2">
              <Text className="font-headline text-[36px] leading-[1.05] text-black">
                Verify your identity
              </Text>
              <Text className="mt-2 font-body text-sm text-black/60">
                Complete verification to unlock funding and investing.
              </Text>
            </View>
          </StaggeredChild>

          {/* Country Selector */}
          <StaggeredChild index={1}>
            <Text className="mb-2 font-subtitle text-xs text-black/50">Country</Text>
            <Pressable
              onPress={() => setShowCountryPicker(!showCountryPicker)}
              className="mb-1 flex-row items-center justify-between rounded-2xl bg-black/5 px-4 py-4">
              <Text className="font-body text-base text-black">{COUNTRY_LABELS[country]}</Text>
              <ChevronDown size={18} color="#000" />
            </Pressable>
            {showCountryPicker && (
              <Animated.View
                entering={FadeInDown.duration(200)}
                className="mb-2 rounded-2xl bg-black/5">
                {COUNTRIES.filter((c) => c !== country).map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => handleCountryChange(c)}
                    className="border-b border-black/5 px-4 py-3.5">
                    <Text className="font-body text-base text-black">{COUNTRY_LABELS[c]}</Text>
                  </Pressable>
                ))}
              </Animated.View>
            )}
            <Text className="mb-5 mt-1 font-body text-xs text-black/40">
              {COUNTRY_HELP_TEXT[country]}
            </Text>
          </StaggeredChild>

          {/* Tax ID Type Selector */}
          <StaggeredChild index={2}>
            <Text className="mb-2 font-subtitle text-xs text-black/50">ID Type</Text>
            <Pressable
              onPress={() => setShowTaxTypePicker(!showTaxTypePicker)}
              className="mb-1 flex-row items-center justify-between rounded-2xl bg-black/5 px-4 py-4">
              <Text className="font-body text-base text-black">
                {activeTaxConfig?.label ?? taxIdType}
              </Text>
              <ChevronDown size={18} color="#000" />
            </Pressable>
            {showTaxTypePicker && (
              <Animated.View
                entering={FadeInDown.duration(200)}
                className="mb-2 rounded-2xl bg-black/5">
                {taxOptions
                  .filter((o) => o.type !== taxIdType)
                  .map((o) => (
                    <Pressable
                      key={o.type}
                      onPress={() => handleTaxTypeChange(o.type)}
                      className="border-b border-black/5 px-4 py-3.5">
                      <Text className="font-body text-base text-black">{o.label}</Text>
                    </Pressable>
                  ))}
              </Animated.View>
            )}
            {activeTaxConfig?.helpText && (
              <Text className="mb-4 mt-1 font-body text-xs text-black/40">
                {activeTaxConfig.helpText}
              </Text>
            )}
          </StaggeredChild>

          {/* Tax ID Input */}
          <StaggeredChild index={3}>
            <View className="mb-6">
              <Input
                label={activeTaxConfig?.label ?? 'Tax ID'}
                placeholder={activeTaxConfig?.placeholder}
                value={taxId}
                onChangeText={(v) => {
                  setTaxId(v);
                  if (taxIdError) setTaxIdError('');
                }}
                error={taxIdError}
                autoCapitalize={taxIdType === 'nino' ? 'characters' : 'none'}
                autoCorrect={false}
                secureTextEntry={taxIdType === 'ssn' || taxIdType === 'itin'}
              />
            </View>
          </StaggeredChild>

          {/* Disclosures */}
          <StaggeredChild index={4}>
            <Text className="mb-3 font-subtitle text-xs text-black/50">Disclosures</Text>
            <View className="mb-6 rounded-2xl bg-black/5 px-4 py-1">
              {(Object.keys(DISCLOSURE_LABELS) as (keyof KycDisclosures)[]).map((key) => (
                <View
                  key={key}
                  className="flex-row items-center justify-between border-b border-black/5 py-3.5">
                  <Text className="flex-1 pr-4 font-body text-[13px] leading-[18px] text-black/80">
                    {DISCLOSURE_LABELS[key]}
                  </Text>
                  <Switch
                    value={disclosures[key]}
                    onValueChange={() => toggleDisclosure(key)}
                    trackColor={{ false: '#D1D5DB', true: '#000' }}
                    thumbColor="#fff"
                    ios_backgroundColor="#D1D5DB"
                  />
                </View>
              ))}
            </View>
          </StaggeredChild>

          {/* Submit */}
          <View className="mt-auto pt-4">
            {!isFormValid && taxId.trim().length > 0 && (
              <Text className="mb-3 text-center font-body text-xs text-[#B91C1C]">
                {taxValidationMessage}
              </Text>
            )}
            <Button
              title="Start Verification"
              onPress={handleStartVerification}
              loading={startSession.isPending}
              disabled={!isFormValid || startSession.isPending}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </AuthGradient>
  );
}

// ─── Shared Components ───────────────────────────────────────

function BackButton() {
  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={12}
      className="mb-2 mt-2 h-10 w-10 items-center justify-center rounded-full bg-black/5">
      <ArrowLeft size={20} color="#111" />
    </Pressable>
  );
}
