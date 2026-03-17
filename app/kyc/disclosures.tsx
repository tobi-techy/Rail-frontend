import React, { useCallback } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Check, ChevronLeft } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui';
import { COUNTRY_KYC_REQUIREMENTS, COUNTRY_LABELS, type KycDisclosures } from '@/api/types/kyc';
import { useKycStore } from '@/stores/kycStore';

const DISCLOSURE_COPY: Record<keyof KycDisclosures, string> = {
  is_control_person: 'I am a control person of a publicly traded company.',
  is_affiliated_exchange_or_finra: 'I am affiliated with a stock exchange or FINRA member.',
  is_politically_exposed: 'I am a politically exposed person (PEP).',
  immediate_family_exposed: 'An immediate family member is a politically exposed person.',
};

export default function KycDisclosuresScreen() {
  const insets = useSafeAreaInsets();
  const { country, disclosures, disclosuresConfirmed, setDisclosure, setDisclosuresConfirmed } =
    useKycStore();

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

  const allDisclosuresAnswered = requiredDisclosureKeys.every(
    (key) => disclosures[key] !== undefined
  );

  const handleContinue = () => {
    if (!disclosuresConfirmed) return;
    router.push('/kyc/source-of-funds');
  };

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
          <Text className="font-subtitle text-[13px] text-gray-500">Step 4 of 4</Text>
          <View className="size-11" />
        </View>

        <View className="px-4">
          <View className="h-1.5 overflow-hidden rounded-full bg-gray-200">
            <View className="h-full w-3/4 rounded-full bg-gray-900" />
          </View>
        </View>

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 100 }}>
            <Text className="font-display text-[30px] leading-[34px] text-gray-900">
              Declarations
            </Text>
            <Text className="mt-2 font-body text-[15px] leading-6 text-gray-600">
              Required for {COUNTRY_LABELS[country]} account compliance.
            </Text>

            <View className="mt-6 rounded-2xl border border-gray-200 bg-white px-4 py-4">
              {requiredDisclosureKeys.map((key, index) => (
                <View
                  key={key}
                  className={`py-4 ${index < requiredDisclosureKeys.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <Text className="font-body text-[14px] leading-5 text-gray-800">
                    {DISCLOSURE_COPY[key]}
                  </Text>
                  <View className="mt-3 flex-row gap-2">
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
                            className={`font-subtitle text-[14px] ${
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

            <Pressable
              onPress={() => setDisclosuresConfirmed(!disclosuresConfirmed)}
              className="mt-6 flex-row items-start gap-3 rounded-2xl bg-gray-100 px-4 py-4"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: disclosuresConfirmed }}
              accessibilityLabel="Confirm KYC declaration">
              <View
                className={`mt-0.5 size-5 items-center justify-center rounded border ${
                  disclosuresConfirmed ? 'border-gray-900 bg-gray-900' : 'border-gray-400 bg-white'
                }`}>
                {disclosuresConfirmed && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
              </View>
              <Text className="flex-1 font-body text-[13px] leading-5 text-gray-700">
                I confirm all submitted information is accurate and belongs to me.
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>

        <View
          className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-4 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={!disclosuresConfirmed || !allDisclosuresAnswered}
          />
        </View>
      </SafeAreaView>
    </ErrorBoundary>
  );
}
