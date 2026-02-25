import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui';
import { useKycStore, documentRequiresBack } from '@/stores/kycStore';
import { useSubmitKYC, useKYCStatus } from '@/api/hooks/useKYC';
import { COUNTRY_LABELS, validateTaxId, type KycDisclosures } from '@/api/types/kyc';
import type { TransformedApiError } from '@/api/types';

const DISCLOSURE_LABELS: Record<keyof KycDisclosures, string> = {
  is_control_person: 'I am a control person of a publicly traded company',
  is_affiliated_exchange_or_finra: 'I am affiliated with a stock exchange or FINRA',
  is_politically_exposed: 'I am a politically exposed person',
  immediate_family_exposed: 'An immediate family member is politically exposed',
};

const MISSING_FIELD_LABELS: Record<string, string> = {
  first_name: 'Legal first name',
  last_name: 'Legal last name',
  date_of_birth: 'Date of birth',
  phone: 'Phone number',
  address_street: 'Street address',
  address_city: 'City',
  address_postal_code: 'Postal code',
  address_country: 'Address country',
};

const MAX_DOC_BYTES = 10 * 1024 * 1024;

function estimateBase64Bytes(dataUri: string): number {
  const base64 = dataUri.split(',')[1] ?? dataUri;
  return Math.floor((base64.length * 3) / 4);
}

export default function KycDisclosuresScreen() {
  const {
    country,
    taxIdType,
    taxId,
    frontDoc,
    backDoc,
    disclosures,
    disclosuresConfirmed,
    setDisclosure,
    setDisclosuresConfirmed,
    setMissingProfileFields,
    resetKycState,
  } = useKycStore();

  const [submitError, setSubmitError] = useState('');
  const submitKyc = useSubmitKYC();
  const { data: kycStatus, refetch: refetchKycStatus } = useKYCStatus(false);

  // #8: Duplicate submission guard
  const isPending = kycStatus?.status === 'pending' || kycStatus?.status === 'processing';

  const extractMissingFields = (error: TransformedApiError | null): string[] => {
    if (!error?.details) return [];
    const maybe = (error.details as Record<string, unknown>)?.missing_fields;
    return Array.isArray(maybe)
      ? maybe.filter((f): f is string => typeof f === 'string' && f.trim().length > 0)
      : [];
  };

  // #2: Client-side validation
  const runClientValidation = (): string | null => {
    if (!frontDoc) return 'Front of ID is required.';
    if (documentRequiresBack(taxIdType) && !backDoc)
      return 'Back of ID is required for this document type.';
    const taxErr = validateTaxId(country, taxIdType, taxId);
    if (taxErr) return taxErr;
    if (estimateBase64Bytes(frontDoc.dataUri) > MAX_DOC_BYTES)
      return 'Front ID image exceeds 10MB. Please retake with lower quality.';
    if (backDoc && estimateBase64Bytes(backDoc.dataUri) > MAX_DOC_BYTES)
      return 'Back ID image exceeds 10MB. Please retake with lower quality.';
    return null;
  };

  const handleSubmit = useCallback(async () => {
    // #8: Block if already pending
    if (isPending) {
      setSubmitError('You already have a pending verification. Please wait for it to complete.');
      return;
    }

    // #2: Client validation
    const clientErr = runClientValidation();
    if (clientErr) {
      setSubmitError(clientErr);
      return;
    }

    setSubmitError('');

    try {
      const response = await submitKyc.mutateAsync({
        tax_id: taxId,
        tax_id_type: taxIdType,
        issuing_country: country,
        id_document_front: frontDoc!.dataUri,
        id_document_back: backDoc?.dataUri,
        disclosures,
      });

      await refetchKycStatus();

      if (response.status === 'failed') {
        setSubmitError(response.message || 'Verification could not be submitted.');
        return;
      }

      // #3: Handle partial_failure
      if (response.status === 'partial_failure') {
        const failures: string[] = [];
        if (!response.bridge_result?.success)
          failures.push(
            `Identity verification: ${response.bridge_result?.error || response.bridge_result?.status || 'failed'}`
          );
        if (!response.alpaca_result?.success)
          failures.push(
            `Investment account: ${response.alpaca_result?.error || response.alpaca_result?.status || 'failed'}`
          );
        setSubmitError(
          `Submission partially succeeded. ${failures.join('. ')}. Our team has been notified and will resolve this automatically.`
        );
        return;
      }

      resetKycState();
      router.dismissAll();
    } catch (error) {
      const transformed = error as TransformedApiError;
      const missing = extractMissingFields(transformed);

      // #4: Route to profile-gaps with real data
      if (missing.length > 0) {
        setMissingProfileFields(missing);
        router.push('/kyc/profile-gaps');
        return;
      }

      if (transformed?.status === 413) {
        setSubmitError('Document image is too large. Keep each image under 10MB.');
        return;
      }
      if (transformed?.status === 401) {
        setSubmitError('Your session expired. Please sign in again.');
        return;
      }
      setSubmitError(transformed?.message || 'Unable to submit verification. Please try again.');
    }
  }, [
    isPending,
    frontDoc,
    backDoc,
    taxId,
    taxIdType,
    country,
    disclosures,
    submitKyc,
    refetchKycStatus,
    resetKycState,
    setMissingProfileFields,
  ]);

  const canSubmit = Boolean(frontDoc) && disclosuresConfirmed && !submitKyc.isPending && !isPending;

  const Row = ({ label, value }: { label: string; value: string }) => (
    <View className="flex-row items-center justify-between border-b border-gray-100 py-2.5">
      <Text className="font-body text-[12px] text-gray-500">{label}</Text>
      <Text className="font-subtitle text-[13px] text-gray-900">{value}</Text>
    </View>
  );

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
          <Pressable
            className="size-11 items-center justify-center rounded-full bg-slate-100"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <ChevronLeft size={24} color="#111827" />
          </Pressable>
          <Text className="font-subtitle text-[15px] text-gray-500">Step 2 of 2</Text>
          <View className="size-11" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 24, paddingBottom: 44 }}>
          <Text className="mb-2 font-display text-[32px] text-gray-900">Disclosures</Text>
          <Text className="mb-8 font-body text-[15px] leading-6 text-gray-500">
            One last step before submission. Answer these compliance disclosures.
          </Text>

          {/* #8: Pending banner */}
          {isPending && (
            <View className="mb-4 rounded-2xl bg-amber-50 px-4 py-3">
              <Text className="font-body text-[12px] leading-5 text-amber-800">
                You already have a pending verification. Please wait for it to complete before
                submitting again.
              </Text>
            </View>
          )}

          <View className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
            <Text className="mb-2 font-subtitle text-[13px] text-gray-700">Your submission</Text>
            <Row label="Country" value={COUNTRY_LABELS[country]} />
            <Row
              label="Tax ID"
              value={taxId ? `${taxIdType.toUpperCase()} ••••${taxId.slice(-4)}` : 'Not provided'}
            />
            <Row label="Front ID" value={frontDoc ? 'Attached' : 'Missing'} />
            <Row
              label="Back ID"
              value={
                backDoc
                  ? 'Attached'
                  : documentRequiresBack(taxIdType)
                    ? 'Missing (required)'
                    : 'Not provided'
              }
            />
          </View>

          <Text className="mb-2 mt-5 font-subtitle text-[13px] text-gray-700">Disclosures</Text>
          <View className="rounded-2xl border border-gray-200 bg-white px-3 py-1">
            {(Object.keys(DISCLOSURE_LABELS) as (keyof KycDisclosures)[]).map((key) => (
              <View
                key={key}
                className="flex-row items-center justify-between border-b border-gray-100 py-3">
                <Text className="mr-3 flex-1 font-body text-[12px] leading-5 text-gray-700">
                  {DISCLOSURE_LABELS[key]}
                </Text>
                <Switch
                  value={disclosures[key]}
                  onValueChange={(val) => setDisclosure(key, val)}
                  trackColor={{ false: '#D1D5DB', true: '#111827' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#D1D5DB"
                />
              </View>
            ))}
          </View>

          {/* #12: Confirmation checkbox */}
          <Pressable
            onPress={() => setDisclosuresConfirmed(!disclosuresConfirmed)}
            className="mb-4 mt-4 flex-row items-start gap-3 rounded-2xl bg-gray-100 px-4 py-3"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: disclosuresConfirmed }}>
            <View
              className={`mt-0.5 size-5 items-center justify-center rounded border ${
                disclosuresConfirmed ? 'border-gray-900 bg-gray-900' : 'border-gray-400 bg-white'
              }`}>
              {disclosuresConfirmed && <Text className="text-[12px] text-white">✓</Text>}
            </View>
            <Text className="flex-1 font-body text-[12px] leading-5 text-gray-700">
              I confirm the information above is accurate and belongs to me.
            </Text>
          </Pressable>

          {!!submitError && (
            <View className="mb-4 rounded-2xl bg-red-50 px-4 py-3">
              <Text className="font-body text-[12px] leading-5 text-red-700">{submitError}</Text>
            </View>
          )}

          <Button
            title={isPending ? 'Verification pending…' : 'Submit verification'}
            onPress={handleSubmit}
            loading={submitKyc.isPending}
            disabled={!canSubmit}
          />
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}
