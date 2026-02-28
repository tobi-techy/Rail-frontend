import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AlertTriangle, Check, ChevronLeft } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui';
import { useSubmitKYC, useKYCStatus } from '@/api/hooks/useKYC';
import type { TransformedApiError } from '@/api/types';
import {
  COUNTRY_KYC_REQUIREMENTS,
  COUNTRY_LABELS,
  EMPLOYMENT_STATUS_OPTIONS,
  INVESTMENT_PURPOSE_OPTIONS,
  type KycDisclosures,
} from '@/api/types/kyc';
import { documentRequiresBack, useKycStore } from '@/stores/kycStore';

const DISCLOSURE_COPY: Record<keyof KycDisclosures, string> = {
  is_control_person: 'I am a control person of a publicly traded company.',
  is_affiliated_exchange_or_finra: 'I am affiliated with a stock exchange or FINRA member.',
  is_politically_exposed: 'I am a politically exposed person (PEP).',
  immediate_family_exposed: 'An immediate family member is a politically exposed person.',
};

const MAX_DOC_BYTES = 10 * 1024 * 1024;

function estimateBase64Bytes(dataUri: string): number {
  const base64 = dataUri.split(',')[1] ?? dataUri;
  return Math.floor((base64.length * 3) / 4);
}

export default function KycDisclosuresScreen() {
  const insets = useSafeAreaInsets();
  const {
    country,
    taxIdType,
    taxId,
    documentType,
    frontDoc,
    backDoc,
    disclosures,
    disclosuresConfirmed,
    employmentStatus,
    investmentPurposes,
    setDisclosure,
    setDisclosuresConfirmed,
    setEmploymentStatus,
    toggleInvestmentPurpose,
    setMissingProfileFields,
    resetKycState,
  } = useKycStore();

  const [submitError, setSubmitError] = useState('');
  const [profileError, setProfileError] = useState('');
  const submitKyc = useSubmitKYC();
  const { data: kycStatus, refetch: refetchKycStatus } = useKYCStatus(true);
  const requirement = COUNTRY_KYC_REQUIREMENTS[country];
  const needsBack = documentRequiresBack(country, documentType);
  const requiredDisclosureKeys = requirement.requiredDisclosures;

  const isPending = kycStatus?.status === 'pending' || kycStatus?.status === 'processing';

  const extractMissingFields = (error: TransformedApiError | null): string[] => {
    if (!error?.details) return [];
    const missingFields = (error.details as Record<string, unknown>)?.missing_fields;
    return Array.isArray(missingFields)
      ? missingFields.filter(
          (field): field is string => typeof field === 'string' && field.length > 0
        )
      : [];
  };

  const buildDisclosuresPayload = useCallback((): KycDisclosures => {
    const payload: KycDisclosures = {
      is_control_person: false,
      is_affiliated_exchange_or_finra: false,
      is_politically_exposed: false,
      immediate_family_exposed: false,
    };

    requiredDisclosureKeys.forEach((key) => {
      payload[key] = disclosures[key];
    });

    return payload;
  }, [disclosures, requiredDisclosureKeys]);

  const runClientValidation = useCallback((): string | null => {
    if (!frontDoc) return 'Front of document is required.';
    if (needsBack && !backDoc) return 'Back of document is required for this document type.';
    if (!employmentStatus) return 'Select your employment status.';
    if (investmentPurposes.length === 0) return 'Select at least one investing goal.';
    if (estimateBase64Bytes(frontDoc.dataUri) > MAX_DOC_BYTES)
      return 'Front document image exceeds 10MB. Please retake.';
    if (backDoc && estimateBase64Bytes(backDoc.dataUri) > MAX_DOC_BYTES)
      return 'Back document image exceeds 10MB. Please retake.';
    return null;
  }, [backDoc, employmentStatus, frontDoc, investmentPurposes.length, needsBack]);

  const handleSubmit = useCallback(async () => {
    if (isPending) {
      setSubmitError('You already have a verification in review. Please wait for an update.');
      return;
    }

    if (!disclosuresConfirmed) {
      setSubmitError('Confirm the declaration before submitting.');
      return;
    }

    const validationError = runClientValidation();
    if (validationError) {
      setProfileError(validationError);
      setSubmitError('');
      return;
    }

    setProfileError('');
    setSubmitError('');

    try {
      const response = await submitKyc.mutateAsync({
        tax_id: taxId,
        tax_id_type: taxIdType,
        issuing_country: country,
        id_document_front: frontDoc!.dataUri,
        id_document_back: needsBack ? backDoc?.dataUri : undefined,
        disclosures: buildDisclosuresPayload(),
      });

      await refetchKycStatus();

      if (response.status === 'failed') {
        setSubmitError(response.message || 'Verification could not be submitted.');
        return;
      }

      if (response.status === 'partial_failure') {
        const failures: string[] = [];
        if (!response.bridge_result?.success) {
          failures.push(
            `Identity verification: ${
              response.bridge_result?.error || response.bridge_result?.status || 'failed'
            }`
          );
        }
        if (!response.alpaca_result?.success) {
          failures.push(
            `Investment account: ${
              response.alpaca_result?.error || response.alpaca_result?.status || 'failed'
            }`
          );
        }
        setSubmitError(`Submission partially succeeded. ${failures.join('. ')}`);
        return;
      }

      resetKycState();
      router.dismissAll();
    } catch (error) {
      const transformed = error as TransformedApiError;
      const missingFields = extractMissingFields(transformed);

      if (missingFields.length > 0) {
        setMissingProfileFields(missingFields);
        router.push('/kyc/profile-gaps');
        return;
      }

      if (transformed?.status === 413) {
        setSubmitError('One or more images are too large. Keep each image under 10MB.');
        return;
      }

      if (transformed?.status === 401) {
        setSubmitError('Your session expired. Sign in again and retry verification.');
        return;
      }

      setSubmitError(transformed?.message || 'Unable to submit verification. Please try again.');
    }
  }, [
    backDoc,
    buildDisclosuresPayload,
    country,
    disclosuresConfirmed,
    frontDoc,
    isPending,
    needsBack,
    refetchKycStatus,
    resetKycState,
    runClientValidation,
    setMissingProfileFields,
    submitKyc,
    taxId,
    taxIdType,
  ]);

  const canSubmit =
    Boolean(frontDoc) &&
    (!needsBack || Boolean(backDoc)) &&
    Boolean(employmentStatus) &&
    investmentPurposes.length > 0 &&
    disclosuresConfirmed &&
    !submitKyc.isPending &&
    !isPending;

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
          <Text className="font-subtitle text-[13px] text-gray-500">Step 3 of 3</Text>
          <View className="size-11" />
        </View>

        <View className="px-4">
          <View className="h-1.5 overflow-hidden rounded-full bg-gray-200">
            <View className="h-full w-full rounded-full bg-gray-900" />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 180 }}>
          <View>
            <Text className="font-display text-[30px] leading-[34px] text-gray-900">
              Final disclosures
            </Text>
            <Text className="mt-2 font-body text-[15px] leading-6 text-gray-600">
              Complete suitability and compliance disclosures before we submit your KYC package.
            </Text>
          </View>

          {isPending && (
            <View className="mt-6 flex-row items-start gap-3 rounded-2xl bg-amber-50 px-4 py-3">
              <AlertTriangle size={18} color="#B45309" />
              <Text className="flex-1 font-body text-[12px] leading-5 text-amber-800">
                You already have a verification under review. Submitting again is disabled until
                this review completes.
              </Text>
            </View>
          )}

          <View className="mt-6 rounded-2xl border border-gray-200 bg-white px-4 py-4">
            <Text className="mb-3 font-subtitle text-[14px] text-gray-900">About you</Text>
            {EMPLOYMENT_STATUS_OPTIONS.map((option, index) => {
              const selected = employmentStatus === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setEmploymentStatus(option.value);
                    if (profileError) setProfileError('');
                  }}
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

          <View className="mt-6 rounded-2xl border border-gray-200 bg-white px-4 py-4">
            <Text className="mb-3 font-subtitle text-[14px] text-gray-900">Investing goals</Text>
            <Text className="mb-3 font-body text-[12px] text-gray-500">Select all that apply.</Text>
            {INVESTMENT_PURPOSE_OPTIONS.map((option, index) => {
              const selected = investmentPurposes.includes(option.value);
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    toggleInvestmentPurpose(option.value);
                    if (profileError) setProfileError('');
                  }}
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
                  <Pressable
                    onPress={() => setDisclosure(key, false)}
                    className={`min-h-[44px] flex-1 items-center justify-center rounded-full border ${
                      disclosures[key] ? 'border-gray-200 bg-white' : 'border-gray-900 bg-gray-900'
                    }`}
                    accessibilityRole="button"
                    accessibilityLabel={`Answer no for ${DISCLOSURE_COPY[key]}`}>
                    <Text
                      className={`font-subtitle text-[13px] ${
                        disclosures[key] ? 'text-gray-700' : 'text-white'
                      }`}>
                      No
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setDisclosure(key, true)}
                    className={`min-h-[44px] flex-1 items-center justify-center rounded-full border ${
                      disclosures[key] ? 'border-gray-900 bg-gray-900' : 'border-gray-200 bg-white'
                    }`}
                    accessibilityRole="button"
                    accessibilityLabel={`Answer yes for ${DISCLOSURE_COPY[key]}`}>
                    <Text
                      className={`font-subtitle text-[13px] ${
                        disclosures[key] ? 'text-white' : 'text-gray-700'
                      }`}>
                      Yes
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          <View className="mt-6 rounded-2xl border border-gray-200 bg-white px-4 py-4">
            <Text className="font-subtitle text-[14px] text-gray-900">What gets submitted now</Text>
            {requirement.summaryBullets.map((item, index) => (
              <Text
                key={item}
                className={`font-body text-[12px] leading-5 text-gray-600 ${
                  index === 0 ? 'mt-3' : 'mt-2'
                }`}>
                • {item}
              </Text>
            ))}
          </View>

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

          {!!profileError && (
            <View className="mt-3 rounded-2xl bg-red-50 px-4 py-3">
              <Text className="font-body text-[12px] leading-5 text-red-700">{profileError}</Text>
            </View>
          )}

          {!!submitError && (
            <View className="mt-3 rounded-2xl bg-red-50 px-4 py-3">
              <Text className="font-body text-[12px] leading-5 text-red-700">{submitError}</Text>
            </View>
          )}
        </ScrollView>

        <View
          className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-4 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <Button
            title={isPending ? 'Verification pending' : 'Submit verification'}
            onPress={handleSubmit}
            loading={submitKyc.isPending}
            disabled={!canSubmit}
          />
        </View>
      </SafeAreaView>
    </ErrorBoundary>
  );
}
