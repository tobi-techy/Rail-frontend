import React, { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { InputField } from '@/components/atoms/InputField';
import { Button } from '@/components/ui';
import {
  COUNTRY_KYC_REQUIREMENTS,
  COUNTRY_LABELS,
  COUNTRY_TAX_CONFIG,
  EMPLOYMENT_STATUS_OPTIONS,
  INVESTMENT_PURPOSE_OPTIONS,
  validateTaxId,
  formatTaxId,
  type Country,
  type KycDisclosures,
} from '@/api/types/kyc';
import { useKycStore } from '@/stores/kycStore';
import { useStartDiditSession } from '@/api/hooks/useKYC';
import { useAuthStore } from '@/stores/authStore';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import { ArrowLeft01Icon, CheckmarkCircle01Icon } from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';

const DISCLOSURE_COPY: Record<keyof KycDisclosures, string> = {
  is_control_person: 'I am a control person of a publicly traded company.',
  is_affiliated_exchange_or_finra: 'I am affiliated with a stock exchange or FINRA member.',
  is_politically_exposed: 'I am a politically exposed person (PEP).',
  immediate_family_exposed: 'An immediate family member is a politically exposed person.',
};

export default function KycDocumentsScreen() {
  const {
    completedSteps,
    diditSessionToken,
    taxId,
    employmentStatus,
    sourceOfFunds,
    expectedMonthlyPayments,
    accountPurpose,
    accountPurposeOther,
    mostRecentOccupation,
    actingAsIntermediary,
    investmentPurposes,
    disclosures,
    disclosuresConfirmed,
    setTaxId,
    setEmploymentStatus,
    toggleInvestmentPurpose,
    setDisclosure,
    setDisclosuresConfirmed,
    setDiditSession,
  } = useKycStore();

  const { impact, selection } = useHaptics();

  // This screen is legacy — redirect to the proper multi-step flow
  useEffect(() => {
    if (diditSessionToken || completedSteps.includes('source-of-funds')) {
      router.replace('/kyc/didit-sdk');
    } else if (completedSteps.includes('disclosures')) {
      router.replace('/kyc/source-of-funds');
    } else if (completedSteps.includes('about-you')) {
      router.replace('/kyc/disclosures');
    } else if (completedSteps.includes('tax-id')) {
      router.replace('/kyc/about-you');
    } else {
      router.replace('/kyc/tax-id');
    }
  }, []);

  const insets = useSafeAreaInsets();
  const userCountry = useAuthStore((s) => s.registrationData.country);
  const country = (userCountry as Country) || 'USA';
  const taxIdType = COUNTRY_TAX_CONFIG[country].type;

  const [taxIdError, setTaxIdError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const startSession = useStartDiditSession();
  const taxConfig = COUNTRY_TAX_CONFIG[country];
  const requirement = COUNTRY_KYC_REQUIREMENTS[country];
  const requiredDisclosureKeys = requirement.requiredDisclosures;

  const buildDisclosures = useCallback((): KycDisclosures => {
    const base: KycDisclosures = {
      is_control_person: false,
      is_affiliated_exchange_or_finra: false,
      is_politically_exposed: false,
      immediate_family_exposed: false,
    };
    requiredDisclosureKeys.forEach((key) => {
      base[key] = disclosures[key];
    });
    return base;
  }, [disclosures, requiredDisclosureKeys]);

  const canContinue =
    taxId.trim().length > 0 &&
    Boolean(employmentStatus) &&
    disclosuresConfirmed &&
    !startSession.isPending &&
    !startSession.isError;

  const handleContinue = useCallback(async () => {
    const taxError = validateTaxId(country, taxIdType, taxId);
    if (taxError) {
      setTaxIdError(taxError);
      return;
    }
    setTaxIdError('');
    setSubmitError('');

    try {
      const result = await startSession.mutateAsync({
        tax_id: taxId,
        tax_id_type: taxIdType,
        issuing_country: country,
        disclosures: buildDisclosures(),
        source_of_funds: sourceOfFunds ?? undefined,
        employment_status: employmentStatus ?? undefined,
        expected_monthly_payments_usd: expectedMonthlyPayments ?? undefined,
        account_purpose: accountPurpose ?? undefined,
        account_purpose_other: accountPurposeOther ?? undefined,
        most_recent_occupation: mostRecentOccupation ?? undefined,
        acting_as_intermediary: actingAsIntermediary || undefined,
      });
      setDiditSession(result.session_token, result.session_id);
      if (result.status === 'existing_session') {
        router.replace('/kyc/pending');
      } else {
        router.push('/kyc/didit-sdk');
      }
    } catch {
      setSubmitError('Could not start verification session. Please try again.');
    }
  }, [country, taxId, taxIdType, buildDisclosures, startSession, setDiditSession]);

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top']}>
        <View className="flex-row items-center justify-between px-4 pb-2 pt-1">
          <Pressable
            className="size-11 items-center justify-center rounded-full bg-stone-surface"
            onPress={() => {
              router.back();
            }}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#343433" />
          </Pressable>
          <Text className="font-subtitle text-[13px] text-ash" maxFontSizeMultiplier={1.4}>
            Step 2 of 3
          </Text>
          <View className="size-11" />
        </View>

        <View className="px-4">
          <View className="h-1.5 overflow-hidden rounded-full bg-fog">
            <View className="h-full w-2/3 rounded-full bg-midnight" />
          </View>
        </View>

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 180 }}>
            <Text
              className="font-display text-[30px] leading-[34px] text-charcoal-primary"
              maxFontSizeMultiplier={1.3}>
              Identity details
            </Text>
            <Text
              className="mt-2 font-body text-[15px] leading-6 text-ash"
              maxFontSizeMultiplier={1.4}>
              Enter your tax identifier and complete the required disclosures. Your ID scan happens
              in the next step.
            </Text>

            {/* Tax ID input */}
            <View className="mt-6">
              <InputField
                label={taxConfig.label}
                value={taxId}
                onChangeText={(v) => {
                  setTaxId(formatTaxId(country, v));
                  if (taxIdError) setTaxIdError('');
                }}
                placeholder={taxConfig.placeholder}
                autoCapitalize="characters"
                error={taxIdError}
                helperText={taxConfig.helpText}
              />
            </View>

            {/* Employment status */}
            <View className="mt-6 rounded-2xl border border-fog bg-parchment-card px-4 py-4">
              <Text
                className="mb-3 font-subtitle text-[14px] text-charcoal-primary"
                maxFontSizeMultiplier={1.4}>
                About you
              </Text>
              {EMPLOYMENT_STATUS_OPTIONS.map((option, index) => {
                const selected = employmentStatus === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      selection();
                      setEmploymentStatus(option.value);
                    }}
                    className={`flex-row items-center justify-between py-3 ${
                      index < EMPLOYMENT_STATUS_OPTIONS.length - 1
                        ? 'border-b border-stone-surface'
                        : ''
                    }`}
                    accessibilityRole="button"
                    accessibilityLabel={`Employment status ${option.label}`}>
                    <Text
                      className="font-body text-[14px] text-gray-800"
                      maxFontSizeMultiplier={1.4}>
                      {option.label}
                    </Text>
                    <View
                      className={`size-5 rounded-full border ${
                        selected ? 'border-gray-900 bg-midnight' : 'border-fog bg-white'
                      }`}
                    />
                  </Pressable>
                );
              })}
            </View>

            {/* Investing goals */}
            <View className="mt-6 rounded-2xl border border-fog bg-parchment-card px-4 py-4">
              <Text
                className="mb-3 font-subtitle text-[14px] text-charcoal-primary"
                maxFontSizeMultiplier={1.4}>
                Investing goals
              </Text>
              <Text className="mb-3 font-body text-[12px] text-ash" maxFontSizeMultiplier={1.4}>
                Select all that apply.
              </Text>
              {INVESTMENT_PURPOSE_OPTIONS.map((option, index) => {
                const selected = investmentPurposes.includes(option.value);
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      selection();
                      toggleInvestmentPurpose(option.value);
                    }}
                    className={`flex-row items-center justify-between py-3 ${
                      index < INVESTMENT_PURPOSE_OPTIONS.length - 1
                        ? 'border-b border-stone-surface'
                        : ''
                    }`}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={`Investing goal ${option.label}`}>
                    <Text
                      className="mr-4 flex-1 font-body text-[14px] text-gray-800"
                      maxFontSizeMultiplier={1.4}>
                      {option.label}
                    </Text>
                    <View
                      className={`size-5 items-center justify-center rounded ${
                        selected ? 'bg-midnight' : 'border border-fog bg-white'
                      }`}>
                      {selected ? (
                        <HugeiconsIcon
                          icon={CheckmarkCircle01Icon}
                          size={12}
                          color="#FFFFFF"
                          strokeWidth={3}
                        />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Regulatory disclosures */}
            <View className="mt-6 rounded-2xl border border-fog bg-parchment-card px-4 py-4">
              <Text
                className="mb-2 font-subtitle text-[14px] text-charcoal-primary"
                maxFontSizeMultiplier={1.4}>
                Regulatory declarations
              </Text>
              <Text className="mb-3 font-body text-[12px] text-ash" maxFontSizeMultiplier={1.4}>
                Required for {COUNTRY_LABELS[country]} account compliance.
              </Text>
              {requiredDisclosureKeys.map((key, index) => (
                <View
                  key={key}
                  className={`py-3 ${index < requiredDisclosureKeys.length - 1 ? 'border-b border-stone-surface' : ''}`}>
                  <Text
                    className="font-body text-[13px] leading-5 text-gray-800"
                    maxFontSizeMultiplier={1.4}>
                    {DISCLOSURE_COPY[key]}
                  </Text>
                  <View className="mt-2 flex-row gap-2">
                    {(['No', 'Yes'] as const).map((label) => {
                      const isYes = label === 'Yes';
                      const isActive = disclosures[key] === isYes;
                      return (
                        <Pressable
                          key={label}
                          onPress={() => {
                            selection();
                            setDisclosure(key, isYes);
                          }}
                          className={`min-h-[44px] flex-1 items-center justify-center rounded-full border ${
                            isActive ? 'border-gray-900 bg-midnight' : 'border-fog bg-white'
                          }`}
                          accessibilityRole="button"
                          accessibilityLabel={`Answer ${label} for ${DISCLOSURE_COPY[key]}`}>
                          <Text
                            className={`font-subtitle text-[13px] ${
                              isActive ? 'text-white' : 'text-graphite'
                            }`}
                            maxFontSizeMultiplier={1.4}>
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>

            {/* Confirmation checkbox */}
            <Pressable
              onPress={() => {
                selection();
                setDisclosuresConfirmed(!disclosuresConfirmed);
                if (submitError) setSubmitError('');
              }}
              className="mt-6 flex-row items-start gap-3 rounded-2xl bg-stone-surface px-4 py-4"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: disclosuresConfirmed }}
              accessibilityLabel="Confirm KYC declaration">
              <View
                className={`mt-0.5 size-5 items-center justify-center rounded border ${
                  disclosuresConfirmed ? 'border-gray-900 bg-midnight' : 'border-gray-400 bg-white'
                }`}>
                {disclosuresConfirmed ? (
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    size={12}
                    color="#FFFFFF"
                    strokeWidth={3}
                  />
                ) : null}
              </View>
              <Text
                className="flex-1 font-body text-[12px] leading-5 text-graphite"
                maxFontSizeMultiplier={1.4}>
                I confirm all submitted information is accurate and belongs to me.
              </Text>
            </Pressable>

            {!!submitError && (
              <View className="mt-3 rounded-2xl bg-coral-red/10 px-4 py-3">
                <Text
                  className="font-body text-[12px] leading-5 text-red-700"
                  maxFontSizeMultiplier={1.4}>
                  {submitError}
                </Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        <View
          className="absolute bottom-0 left-0 right-0 border-t border-stone-surface bg-parchment-card px-4 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <Button
            title="Continue to ID scan"
            onPress={handleContinue}
            loading={startSession.isPending}
            disabled={!canContinue}
          />
        </View>
      </SafeAreaView>
    </ErrorBoundary>
  );
}
