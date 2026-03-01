import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Check, ChevronDown, ChevronRight, X } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui';
import {
  COUNTRY_HELP_TEXT,
  COUNTRY_KYC_REQUIREMENTS,
  COUNTRY_LABELS,
  type Country,
} from '@/api/types/kyc';
import { useKycStore } from '@/stores/kycStore';

const COUNTRIES: { code: Country; flag: string }[] = [
  { code: 'USA', flag: '🇺🇸' },
  { code: 'GBR', flag: '🇬🇧' },
  { code: 'NGA', flag: '🇳🇬' },
];

export default function KycCountryScreen() {
  const insets = useSafeAreaInsets();
  const { country, setCountry } = useKycStore();
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const currentCountry = useMemo(
    () => COUNTRIES.find((item) => item.code === country) ?? COUNTRIES[0],
    [country]
  );
  const requirements = COUNTRY_KYC_REQUIREMENTS[country];

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center justify-between px-4 pb-2 pt-1">
          <View className="size-11" />
          <Pressable
            className="size-11 items-center justify-center"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close verification">
            <X size={22} color="#111827" />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 160 }}>
          <View className="mb-6">
            <Text className="font-subtitle text-[13px] text-gray-500">Step 1 of 3</Text>
            <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200">
              <View className="h-full w-1/3 rounded-full bg-gray-900" />
            </View>
          </View>

          <View>
            <Text className="font-display text-[30px] leading-[34px] text-gray-900">
              Verify your identity
            </Text>
            <Text className="mt-2 font-body text-[15px] leading-6 text-gray-600">
              Select the country that issued your ID. We use this to tailor your KYC requirements.
            </Text>
          </View>

          <View className="mt-6">
            <Text className="mb-2 font-subtitle text-[13px] text-gray-500">Issuing country</Text>
            <Pressable
              onPress={() => setShowCountryPicker(true)}
              className="flex-row items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-4"
              accessibilityRole="button"
              accessibilityLabel="Select issuing country">
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">{currentCountry.flag}</Text>
                <View>
                  <Text className="font-subtitle text-[16px] text-gray-900">
                    {COUNTRY_LABELS[country]}
                  </Text>
                  <Text className="mt-1 font-body text-[12px] text-gray-500">
                    {COUNTRY_HELP_TEXT[country]}
                  </Text>
                </View>
              </View>
              <ChevronDown size={20} color="#6B7280" />
            </Pressable>
          </View>

          <View className="mt-6 rounded-2xl border border-gray-200 bg-white px-4 py-4">
            <Text className="font-subtitle text-[14px] text-gray-900">
              What we&apos;ll submit for {COUNTRY_LABELS[country]}
            </Text>
            <View className="mt-3 gap-y-3">
              {requirements.summaryBullets.map((item) => (
                <View key={item} className="flex-row items-start gap-2">
                  <View className="mt-0.5 size-5 items-center justify-center rounded-full bg-gray-900">
                    <Check size={12} color="#FFFFFF" strokeWidth={3} />
                  </View>
                  <Text className="flex-1 font-body text-[14px] leading-5 text-gray-700">
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View className="mt-6 rounded-2xl border border-gray-200 bg-white px-4 py-4">
            <Text className="mb-3 font-subtitle text-[14px] text-gray-900">Accepted documents</Text>
            {requirements.acceptedDocuments.map((document, index) => (
              <View
                key={document.type}
                className={`flex-row items-center justify-between py-3 ${
                  index < requirements.acceptedDocuments.length - 1
                    ? 'border-b border-gray-100'
                    : ''
                }`}>
                <View className="flex-1 pr-4">
                  <Text className="font-subtitle text-[14px] text-gray-900">{document.label}</Text>
                  <Text className="mt-1 font-body text-[12px] text-gray-500">
                    {document.description}
                  </Text>
                </View>
                <ChevronRight size={18} color="#9CA3AF" />
              </View>
            ))}
          </View>

          <Text className="mt-6 font-body text-[12px] leading-5 text-gray-500">
            Need another issuing country? Contact support and we&apos;ll enable it for your account.
          </Text>
        </ScrollView>

        <View
          className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-4 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <Button title="Continue" onPress={() => router.push('/kyc/documents')} />
        </View>

        <Modal
          visible={showCountryPicker}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCountryPicker(false)}>
          <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <View className="flex-row items-center justify-between border-b border-gray-100 px-4 py-4">
              <Text className="font-subtitle text-[18px] text-gray-900">
                Select issuing country
              </Text>
              <Pressable
                onPress={() => setShowCountryPicker(false)}
                className="size-11 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Close country picker">
                <X size={22} color="#111827" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {COUNTRIES.map((item) => {
                const selected = item.code === country;
                return (
                  <Pressable
                    key={item.code}
                    onPress={() => {
                      setCountry(item.code);
                      setShowCountryPicker(false);
                    }}
                    className={`flex-row items-center justify-between border-b border-gray-100 px-4 py-4 ${
                      selected ? 'bg-gray-50' : 'bg-white'
                    }`}
                    accessibilityRole="button"
                    accessibilityLabel={`Choose ${COUNTRY_LABELS[item.code]}`}>
                    <View className="flex-row items-center gap-3">
                      <Text className="text-xl">{item.flag}</Text>
                      <View>
                        <Text className="font-subtitle text-[15px] text-gray-900">
                          {COUNTRY_LABELS[item.code]}
                        </Text>
                        <Text className="mt-1 font-body text-[12px] text-gray-500">
                          {COUNTRY_HELP_TEXT[item.code]}
                        </Text>
                      </View>
                    </View>
                    {selected ? (
                      <View className="size-6 items-center justify-center rounded-full bg-gray-900">
                        <Check size={14} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    ) : (
                      <View className="size-6 rounded-full border border-gray-300" />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </ErrorBoundary>
  );
}
