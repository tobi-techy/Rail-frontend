import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui';
import { useKycStore } from '@/stores/kycStore';
import { useSubmitKYC, useKYCStatus } from '@/api/hooks/useKYC';
import { COUNTRY_LABELS, type KycDisclosures } from '@/api/types/kyc';
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

export default function KycDisclosuresScreen() {
  const {
    country,
    taxIdType,
    taxId,
    frontDoc,
    backDoc,
    disclosures,
    setDisclosure,
    resetKycState,
  } = useKycStore();

  const [submitError, setSubmitError] = useState<string>('');
  const submitKyc = useSubmitKYC();
  const { refetch: refetchKycStatus } = useKYCStatus(false);

  const extractMissingFields = (error: TransformedApiError | null): string[] => {
    if (!error?.details) return [];
    const maybe = (error.details as Record<string, unknown>)?.missing_fields;
    if (!Array.isArray(maybe)) return [];
    return maybe
      .filter((field): field is string => typeof field === 'string' && field.trim().length > 0)
      .map((field) => field.trim());
  };

  const toFriendlyError = (error: unknown) => {
    const apiError = error as TransformedApiError | undefined;
    if (!apiError) return 'Unable to submit verification. Please try again.';

    if (apiError.status === 413) return 'Document image is too large. Keep each image under 10MB.';
    if (apiError.status === 401) return 'Your session expired. Please sign in again.';

    return apiError.message || 'Unable to submit verification. Please try again.';
  };

  const handleSubmit = useCallback(async () => {
    if (!frontDoc) {
      setSubmitError('Front of ID is required before submitting verification.');
      return;
    }

    setSubmitError('');

    try {
      const response = await submitKyc.mutateAsync({
        tax_id: taxId || 'UNKNOWN', // Fallback for removed taxId UI
        tax_id_type: taxIdType,
        issuing_country: country,
        id_document_front: frontDoc.dataUri,
        id_document_back: backDoc?.dataUri,
        disclosures,
      });

      await refetchKycStatus();

      if (response.status === 'failed') {
        setSubmitError(response.message || 'Verification could not be submitted.');
        return;
      }

      // Success! Clear store and return to root where the bottom sheet will handle the 'pending' state
      resetKycState();
      router.dismissAll();
    } catch (error) {
      const transformed = error as TransformedApiError;
      const missing = extractMissingFields(transformed);

      if (missing.length > 0) {
        // Here we could route to a profile-gaps screen. For now, we remain compliant with existing logic.
        setSubmitError(
          'You are missing required profile fields: ' +
            missing.map((f) => MISSING_FIELD_LABELS[f] || f).join(', ')
        );
        return;
      }

      setSubmitError(toFriendlyError(error));
    }
  }, [
    frontDoc,
    submitKyc,
    taxId,
    taxIdType,
    country,
    backDoc?.dataUri,
    disclosures,
    refetchKycStatus,
    resetKycState,
  ]);

  const canSubmitVerification = Boolean(frontDoc) && !submitKyc.isPending;

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
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 24, paddingBottom: 44 }}>
          <Text className="mb-2 font-display text-[32px] text-gray-900">Disclosures</Text>
          <Text className="mb-8 font-body text-[15px] leading-6 text-gray-500">
            One last step before submission. Answer these compliance disclosures.
          </Text>

          <View className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
            <Text className="mb-2 font-subtitle text-[13px] text-gray-700">Your submission</Text>
            <Row label="Country" value={COUNTRY_LABELS[country]} />
            <Row label="Front ID" value={frontDoc ? 'Attached' : 'Missing'} />
            <Row label="Back ID" value={backDoc ? 'Attached' : 'Not provided'} />
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

          <View className="mb-4 mt-4 rounded-2xl bg-gray-100 px-4 py-3">
            <Text className="font-body text-[12px] leading-5 text-gray-700">
              By submitting, you confirm the information is accurate and belongs to you.
            </Text>
          </View>

          {!!submitError && (
            <View className="mb-4 rounded-2xl bg-red-50 px-4 py-3">
              <Text className="font-body text-[12px] leading-5 text-red-700">{submitError}</Text>
            </View>
          )}

          <Button
            title="Submit verification"
            onPress={handleSubmit}
            loading={submitKyc.isPending}
            disabled={!canSubmitVerification}
          />
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}
