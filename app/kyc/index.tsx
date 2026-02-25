import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronRight, X, Check } from 'lucide-react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui';
import { useKycStore } from '@/stores/kycStore';
import { COUNTRY_LABELS, COUNTRY_HELP_TEXT, type Country } from '@/api/types/kyc';

const COUNTRIES: { code: Country; flag: string }[] = [
  { code: 'USA', flag: '🇺🇸' },
  { code: 'GBR', flag: '🇬🇧' },
  { code: 'NGA', flag: '🇳🇬' },
];

export default function KycDetailsScreen() {
  const { country, setCountry } = useKycStore();
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const current = COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[0];

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
          <View className="size-11" />
          <Pressable
            className="size-11 items-center justify-center p-2"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close">
            <X size={24} color="#111827" />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 44, flex: 1 }}>
          <Text className="mb-2 font-display text-[28px] leading-9 text-gray-900">
            Verify your identity
          </Text>
          <Text className="mb-10 font-body text-[15px] leading-6 text-gray-500">
            Select the country that issued your ID document.
          </Text>

          <Pressable
            onPress={() => setShowCountryPicker(true)}
            className="flex-row items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4"
            accessibilityRole="button">
            <View className="flex-row items-center gap-3">
              <Text className="text-2xl">{current.flag}</Text>
              <View>
                <Text className="font-subtitle text-[16px] text-gray-900">
                  {COUNTRY_LABELS[country]}
                </Text>
                <Text className="mt-0.5 font-body text-[12px] text-gray-400">
                  {COUNTRY_HELP_TEXT[country]}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </Pressable>

          <View className="mt-8 rounded-2xl bg-gray-50 px-5 py-4">
            <Text className="mb-3 font-subtitle text-[13px] text-gray-700">
              What you&apos;ll need
            </Text>
            {[
              'A valid government-issued ID',
              'Your tax identification number',
              'About 2 minutes',
            ].map((item) => (
              <View key={item} className="mb-2 flex-row items-center gap-2.5">
                <View className="size-5 items-center justify-center rounded-full bg-gray-900">
                  <Check size={12} color="#fff" strokeWidth={3} />
                </View>
                <Text className="font-body text-[14px] text-gray-600">{item}</Text>
              </View>
            ))}
          </View>

          <View className="flex-1" />

          <View className="pb-4">
            <Button title="Continue" onPress={() => router.push('/kyc/documents')} />
            <Text className="mt-4 text-center font-body text-[12px] leading-5 text-gray-400">
              Can&apos;t find your country?{' '}
              <Text className="font-subtitle text-primary">Contact support</Text>
            </Text>
          </View>
        </ScrollView>

        <Modal
          visible={showCountryPicker}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCountryPicker(false)}>
          <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center justify-between border-b border-gray-100 px-5 py-4">
              <Text className="font-subtitle text-[18px] text-gray-900">Select Country</Text>
              <Pressable onPress={() => setShowCountryPicker(false)} className="p-2">
                <X size={24} color="#111827" />
              </Pressable>
            </View>
            <ScrollView>
              {COUNTRIES.map((c) => (
                <Pressable
                  key={c.code}
                  onPress={() => {
                    setCountry(c.code);
                    setShowCountryPicker(false);
                  }}
                  className={`flex-row items-center justify-between border-b border-gray-50 px-6 py-4 ${
                    country === c.code ? 'bg-slate-50' : 'bg-white'
                  }`}>
                  <View className="flex-row items-center gap-3">
                    <Text className="text-xl">{c.flag}</Text>
                    <Text className="font-subtitle text-[16px] text-gray-900">
                      {COUNTRY_LABELS[c.code]}
                    </Text>
                  </View>
                  {country === c.code && (
                    <View className="size-6 items-center justify-center rounded-full bg-gray-900">
                      <Check size={14} color="#fff" strokeWidth={3} />
                    </View>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </ErrorBoundary>
  );
}
