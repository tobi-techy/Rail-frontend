import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Check, ChevronLeft } from 'lucide-react-native';
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
  type KycDisclosures,
} from '@/api/types/kyc';
import { useKycStore } from '@/stores/kycStore';
import { useStartSumsubSession } from '@/api/hooks/useKYC';

const DISCLOSURE_COPY: Record<keyof KycDisclosures, string> = {
  is_control_person: 'I am a control person of a publicly traded company.',
  is_affiliated_exchange_or_finra: 'I am affiliated with a stock exchange or FINRA member.',
  is_politically_exposed: 'I am a politically exposed person (PEP).',
  immediate_family_exposed: 'An immediate family member is a politically exposed person.',
};

export default function KycDocumentsScreen() {
  const insets = useSafeAreaInsets();
  const {
    country,
    taxIdType,
    taxId,
    employmentStatus,
    investmentPurposes,
    disclosures,
    disclosuresConfirmed,
    setTaxIdType,
    setTaxId,
    setEmploymentStatus,
    toggleInvestmentPurpose,
    setDisclosure,
    setDisclosuresConfirmed,
    setSumsubSession,
  } = useKycStore();

  const [taxIdError, setTaxIdError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const startSession = useStartSumsubSession();
  const taxConfigs = COUNTRY_TAX_CONFIG[country];
  const activeTaxConfig = taxConfigs.find((c) => c.type === taxIdType) ?? taxConfigs[0];
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
    investmentPurposes.length > 0 &&
    disclosuresConfirmed &&
    !startSession.isPending;

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
      });
      setSumsubSession(result.token, result.applicant_id);
      router.push('/kyc/sumsub-sdk');
    } catch {
      setSubmitError('Could not start verification session. Please try again.');
    }
  }, [country, taxId, taxIdType, buildDisclosures, startSession, setSumsubSession]);

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center justify-between px-4 pb-2 pt-1">
          <Pressable
            className="size-11 items-center justify-center rounded-full bg-gray-100"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <ChevronLeft size={22} color="#111827" />
          </Pressable>
          <Text className="font-subtitle text-[13px] text-gray-500">Step 2 of 3</Text>
          <View className="size-11" />
        </View>

        <View className="px-4">
          <View className="h-1.5 overflow-hidden rounded-full bg-gray-200">
            <View className="h-full w-2/3 rounded-full bg-gray-900" />
          </View>
        </View>

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 180 }}>
            <Text className="font-display text-[30px] leading-[34px] text-gray-900">
              Identity details
            </Text>
            <Text className="mt-2 font-body text-[15px] leading-6 text-gray-600">
              Enter your tax identifier and complete the required disclosures. Your ID scan happens
              in the next step.
            </Text>

            {/* Tax ID type selector */}
            {taxConfigs.length > 1 && (
              <View className="mt-6">
                <Text className="mb-2 font-subtitle text-[13px] text-gray-500">Tax ID type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {taxConfigs.map((item) => {
                      const isSelected = item.type === taxIdType;
                      return (
                        <Pressable
                          key={item.type}
                          onPress={() => {
                            setTaxIdType(item.type);
                            setTaxId('');
                            setTaxIdError('');
                          }}
                          className={`rounded-full border px-4 py-2.5 ${
                            isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-200 bg-white'
                          }`}
                          accessibilityRole="button"
                          accessibilityLabel={`Use ${item.label}`}>
                          <Text
                            className={`font-subtitle text-[13px] ${
                              isSelected ? 'text-white' : 'text-gray-700'
                            }`}>
                            {item.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Tax ID input */}
            <View className="mt-6">
              <InputField
                label={activeTaxConfig.label}
                value={taxId}
                onChangeText={(v) => {
                  setTaxId(v);
                  if (taxIdError) setTaxIdError('');
                }}
                placeholder={activeTaxConfig.placeholder}
                autoCapitalize="characters"
                error={taxIdError}
                helperText={activeTaxConfig.helpText}
              />
            </View>

            {/* Employment status */}
            <View className="mt-6 rounded-2xl border border-gray-200 bg-white px-4 py-4">
              <Text className="mb-3 font-subtitle text-[14px] text-gray-900">About you</Text>
              {EMPLOYMENT_STATUS_OPTIONS.map((option, index) => {
                const selected = employmentStatus === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setEmploymentStatus(option.value)}
                    className={`flex-row items-center justify-between py-3 ${
                      index < EMPLOYMENT_STATUS_OPTIONS.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                    accessibilityRole="button"
                    accessibilityLabel={`Employment status ${option.label}`}>
                    <Text className="font-body text-[14px] text-gray-800">{option.label}</Text>
                    <View
                      className={`size-5 rounded-full border ${
                        selected ? 'border-gray-900 bg-gray-900' : 'border-gray-300 bg-white'
                      }`}
                    />
                  </Pressable>
                );
              })}
            </View>

            {/* Investing goals */}
            <View className="mt-6 rounded-2xl border border-gray-200 bg-white px-4 py-4">
              <Text className="mb-3 font-subtitle text-[14px] text-gray-900">Investing goals</Text>
              <Text className="mb-3 font-body text-[12px] text-gray-500">Select all that apply.</Text>
              {INVESTMENT_PURPOSE_OPTIONS.map((option, index) => {
                const selected = investmentPurposes.includes(option.value);
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => toggleInvestmentPurpose(option.value)}
                    className={`flex-row items-center justify-between py-3 ${
                      index < INVESTMENT_PURPOSE_OPTIONS.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={`Investing goal ${option.label}`}>
                    <Text className="mr-4 flex-1 font-body text-[14px] text-gray-800">
                      {option.label}
                    </Text>
                    <View
                      className={`size-5 items-center justify-center rounded ${
                        selected ? 'bg-gray-900' : 'border border-gray-300 bg-white'
                      }`}>
                      {selected ? <Check size={12} color="#FFFFFF" strokeWidth={3} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Regulatory disclosures */}
            <View className="mt-6 rounded-2xl border border-gray-200 bg-white px-4 py-4">
              <Text className="mb-2 font-subtitle text-[14px] text-gray-900">
                Regulatory declarations
              </Text>
              <Text className="mb-3 font-body text-[12px] text-gray-500">
                Required for {COUNTRY_LABELS[country]} account compliance.
              </Text>
              {requiredDisclosureKeys.map((key, index) => (
                <View
                  key={key}
                  className={`py-3 ${index < requiredDisclosureKeys.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <Text className="font-body text-[13px] leading-5 text-gray-800">
                    {DISCLOSURE_COPY[key]}
                  </Text>
                  <View className="mt-2 flex-row gap-2">
                    {(['No', 'Yes'] as const).map((label) => {
                      const isYes = label === 'Yes';
                      const isActive = disclosures[key] === isYes;
                      return (
                        <Pressable
                          key={label}
                          onPress={() => setDisclosure(key, isYes)}
                          className={`min-h-[44px] flex-1 items-center justify-center rounded-full border ${
                            isActive ? 'border-gray-900 bg-gray-900' : 'border-gray-200 bg-white'
                          }`}
                          accessibilityRole="button"
                          accessibilityLabel={`Answer ${label} for ${DISCLOSURE_COPY[key]}`}>
                          <Text
                            className={`font-subtitle text-[13px] ${
                              isActive ? 'text-white' : 'text-gray-700'
                            }`}>
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
                setDisclosuresConfirmed(!disclosuresConfirmed);
                if (submitError) setSubmitError('');
              }}
              className="mt-6 flex-row items-start gap-3 rounded-2xl bg-gray-100 px-4 py-4"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: disclosuresConfirmed }}
              accessibilityLabel="Confirm KYC declaration">
              <View
                className={`mt-0.5 size-5 items-center justify-center rounded border ${
                  disclosuresConfirmed ? 'border-gray-900 bg-gray-900' : 'border-gray-400 bg-white'
                }`}>
                {disclosuresConfirmed ? <Check size={12} color="#FFFFFF" strokeWidth={3} /> : null}
              </View>
              <Text className="flex-1 font-body text-[12px] leading-5 text-gray-700">
                I confirm all submitted information is accurate and belongs to me.
              </Text>
            </Pressable>

            {!!submitError && (
              <View className="mt-3 rounded-2xl bg-red-50 px-4 py-3">
                <Text className="font-body text-[12px] leading-5 text-red-700">{submitError}</Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        <View
          className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-4 pt-3"
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
