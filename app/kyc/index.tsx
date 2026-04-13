import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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
import { useAuthStore } from '@/stores/authStore';
import { useKYCStatus } from '@/api/hooks/useKYC';
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import CountryFlag from 'react-native-country-flag';

const ISO2_TO_KYC: Record<string, Country> = {
  US: 'USA',
  GB: 'GBR',
  NG: 'NGA',
  CA: 'CAN',
  AU: 'AUS',
  DE: 'DEU',
  FR: 'FRA',
  IN: 'IND',
  GH: 'GHA',
  KE: 'KEN',
  ZA: 'ZAF',
  BR: 'BRA',
  MX: 'MEX',
  SG: 'SGP',
  AE: 'ARE',
  NL: 'NLD',
  IT: 'ITA',
  ES: 'ESP',
  PL: 'POL',
  SE: 'SWE',
};
const KYC_TO_ISO2: Record<string, string> = Object.fromEntries(
  Object.entries(ISO2_TO_KYC).map(([k, v]) => [v, k])
);

const COUNTRIES: { code: Country; flag: string }[] = [
  { code: 'USA', flag: '🇺🇸' },
  { code: 'GBR', flag: '🇬🇧' },
  { code: 'NGA', flag: '🇳🇬' },
  { code: 'CAN', flag: '🇨🇦' },
  { code: 'AUS', flag: '🇦🇺' },
  { code: 'DEU', flag: '🇩🇪' },
  { code: 'FRA', flag: '🇫🇷' },
  { code: 'IND', flag: '🇮🇳' },
  { code: 'GHA', flag: '🇬🇭' },
  { code: 'KEN', flag: '🇰🇪' },
  { code: 'ZAF', flag: '🇿🇦' },
  { code: 'BRA', flag: '🇧🇷' },
  { code: 'MEX', flag: '🇲🇽' },
  { code: 'SGP', flag: '🇸🇬' },
  { code: 'ARE', flag: '🇦🇪' },
  { code: 'NLD', flag: '🇳🇱' },
  { code: 'ITA', flag: '🇮🇹' },
  { code: 'ESP', flag: '🇪🇸' },
  { code: 'POL', flag: '🇵🇱' },
  { code: 'SWE', flag: '🇸🇪' },
];

export default function KycCountryScreen() {
  const insets = useSafeAreaInsets();
  const { country, setCountry } = useKycStore();
  const userCountry = useAuthStore((s) => s.user?.country);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const params = useLocalSearchParams<{ autoLaunch?: string }>();
  const { data: kycStatus } = useKYCStatus();

  // Filter countries based on search query
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRIES;
    const query = searchQuery.toLowerCase().trim();
    return COUNTRIES.filter(
      (item) =>
        COUNTRY_LABELS[item.code].toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // If KYC already submitted, skip to pending/result screen
  useEffect(() => {
    if (!kycStatus) return;
    if (kycStatus.status === 'approved') {
      useAuthStore.getState().setOnboardingStatus('completed');
      if (router.canDismiss()) {
        router.dismissAll();
      } else {
        router.replace('/(tabs)');
      }
    } else if (
      kycStatus.has_submitted &&
      kycStatus.status !== 'rejected' &&
      kycStatus.status !== 'expired'
    ) {
      router.replace('/kyc/pending');
    }
  }, [kycStatus]);

  // Auto-set KYC country from address step, then redirect if autoLaunch
  useEffect(() => {
    let mapped = false;
    if (userCountry) {
      const kycCountry = ISO2_TO_KYC[userCountry.toUpperCase()];
      if (kycCountry) {
        if (kycCountry !== country) setCountry(kycCountry);
        mapped = true;
      }
    }
    // Only skip country picker if we successfully mapped the user's country
    if (params.autoLaunch === 'true' && mapped) {
      router.replace('/kyc/verification-intro');
    }
  }, [userCountry, params.autoLaunch, country, setCountry]);

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
            onPress={() => {
              if (router.canDismiss()) {
                router.dismissAll();
              } else {
                router.replace('/(tabs)');
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Close verification">
            <HugeiconsIcon icon={Cancel01Icon} size={22} color="#111827" />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 160 }}>
          <View className="mb-6">
            <Text className="font-subtitle text-[13px] text-gray-500">Step 1 of 4</Text>
            <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200">
              <View className="h-full w-1/4 rounded-full bg-gray-900" />
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
                <CountryFlag isoCode={KYC_TO_ISO2[currentCountry.code] || 'US'} size={24} />
                <View>
                  <Text className="font-subtitle text-[16px] text-gray-900">
                    {COUNTRY_LABELS[country]}
                  </Text>
                  <Text className="mt-1 font-body text-[12px] text-gray-500">
                    {COUNTRY_HELP_TEXT[country]}
                  </Text>
                </View>
              </View>
              <HugeiconsIcon icon={ArrowDown01Icon} size={20} color="#6B7280" />
            </Pressable>
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
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#9CA3AF" />
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
          <Button title="Continue" onPress={() => router.push('/kyc/tax-id')} variant="orange" />
        </View>

        <Modal
          visible={showCountryPicker}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            setShowCountryPicker(false);
            setSearchQuery('');
          }}>
          <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <View className="flex-row items-center justify-between border-b border-gray-100 px-4 py-4">
              <Text className="font-subtitle text-[18px] text-gray-900">
                Select issuing country
              </Text>
              <Pressable
                onPress={() => {
                  setShowCountryPicker(false);
                  setSearchQuery('');
                }}
                className="size-11 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Close country picker">
                <HugeiconsIcon icon={Cancel01Icon} size={22} color="#111827" />
              </Pressable>
            </View>

            {/* Search input */}
            <View className="border-b border-gray-100 px-4 pb-4">
              <View className="flex-row items-center rounded-full border border-gray-200 bg-gray-50 px-4 py-3">
                <Text className="mr-2 text-lg">🔍</Text>
                <TextInput
                  className="flex-1 font-body text-[15px] text-gray-900"
                  placeholder="Search countries..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <Text className="text-gray-400">✕</Text>
                  </Pressable>
                )}
              </View>
              {searchQuery.length > 0 && filteredCountries.length === 0 && (
                <Text className="mt-2 font-body text-[14px] text-gray-500">
                  No countries found. Contact support for additional options.
                </Text>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredCountries.map((item) => {
                const selected = item.code === country;
                return (
                  <Pressable
                    key={item.code}
                    onPress={() => {
                      setCountry(item.code);
                      setShowCountryPicker(false);
                      setSearchQuery('');
                    }}
                    className={`flex-row items-center justify-between border-b border-gray-100 px-4 py-4 ${
                      selected ? 'bg-gray-50' : 'bg-white'
                    }`}
                    accessibilityRole="button"
                    accessibilityLabel={`Choose ${COUNTRY_LABELS[item.code]}`}>
                    <View className="flex-row items-center gap-3">
                      <CountryFlag isoCode={KYC_TO_ISO2[item.code] || 'US'} size={20} />
                      <View>
                        <Text className="font-subtitle text-[15px] text-gray-900">
                          {COUNTRY_LABELS[item.code]}
                        </Text>
                      </View>
                    </View>
                    {selected ? (
                      <View className="size-6 items-center justify-center rounded-full bg-gray-900">
                        <HugeiconsIcon
                          icon={CheckmarkCircle01Icon}
                          size={14}
                          color="#FFFFFF"
                          strokeWidth={3}
                        />
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
