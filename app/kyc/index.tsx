import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { InputField } from '@/components/atoms/InputField';
import { ProgressBar } from '@/components/atoms/ProgressBar';
import { Button } from '@/components/ui';
import { useHaptics } from '@/hooks/useHaptics';
import {
  COUNTRY_HELP_TEXT,
  COUNTRY_KYC_REQUIREMENTS,
  COUNTRY_LABELS,
  COUNTRY_TAX_CONFIG,
  validateTaxId,
  type Country,
} from '@/api/types/kyc';
import { useKycStore } from '@/stores/kycStore';
import { useAuthStore } from '@/stores/authStore';
import { useKYCStatus } from '@/api/hooks/useKYC';
import { ArrowDown01Icon, Cancel01Icon, CheckmarkCircle01Icon } from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';
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

export default function KycIdentityScreen() {
  const insets = useSafeAreaInsets();
  const { selection } = useHaptics();
  const { country, setCountry, taxId, setTaxId, hasCompletedStep, addCompletedStep } =
    useKycStore();
  const userCountry = useAuthStore((s) => s.user?.country);
  const { data: kycStatus } = useKYCStatus();

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [taxIdError, setTaxIdError] = useState('');

  const taxConfig = COUNTRY_TAX_CONFIG[country];
  const requirements = COUNTRY_KYC_REQUIREMENTS[country];

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRIES;
    const q = searchQuery.toLowerCase().trim();
    return COUNTRIES.filter(
      (c) => COUNTRY_LABELS[c.code].toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const currentCountry = useMemo(
    () => COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[0],
    [country]
  );

  // If KYC already submitted/approved, skip
  useEffect(() => {
    if (!kycStatus) return;
    if (kycStatus.status === 'approved') {
      useAuthStore.getState().setOnboardingStatus('completed');
      if (router.canDismiss()) router.dismissAll();
      else router.replace('/(tabs)');
    } else if (
      kycStatus.has_submitted &&
      kycStatus.status !== 'rejected' &&
      kycStatus.status !== 'expired'
    ) {
      router.replace('/kyc/pending');
    }
  }, [kycStatus]);

  // Auto-set country from user profile
  useEffect(() => {
    if (kycStatus && (kycStatus.status === 'approved' || kycStatus.has_submitted)) return;
    if (userCountry) {
      const kycCountry = ISO2_TO_KYC[userCountry.toUpperCase()];
      if (kycCountry && kycCountry !== country) setCountry(kycCountry);
    }
  }, [userCountry]);

  // Skip to financial if identity step already completed
  useEffect(() => {
    if (hasCompletedStep('identity')) {
      router.replace('/kyc/financial');
    }
  }, []);

  const canContinue = taxId.trim().length > 0;

  const handleContinue = () => {
    if (taxId.trim().length === 0) {
      setTaxIdError('Please enter your tax ID');
      return;
    }
    const error = validateTaxId(country, useKycStore.getState().taxIdType, taxId);
    if (error) {
      setTaxIdError(error);
      return;
    }
    setTaxIdError('');
    addCompletedStep('identity');
    router.replace('/kyc/financial');
  };

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pb-2 pt-1">
          <View className="size-11" />
          <Text className="font-subtitle text-[13px] text-ash" maxFontSizeMultiplier={1.4}>
            Step 1 of 2
          </Text>
          <Pressable
            className="size-11 items-center justify-center"
            onPress={() => (router.canDismiss() ? router.dismissAll() : router.replace('/(tabs)'))}
            accessibilityRole="button"
            accessibilityLabel="Close verification">
            <HugeiconsIcon icon={Cancel01Icon} size={22} color="#343433" />
          </Pressable>
        </View>

        <View className="px-4">
          <ProgressBar progress={50} height={6} />
        </View>

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 120 }}>
            <Text
              className="font-display text-[23px] leading-[28px] text-charcoal-primary"
              maxFontSizeMultiplier={1.3}>
              Verify your identity
            </Text>
            <Text
              className="mt-2 font-body text-[15px] leading-6 text-ash"
              maxFontSizeMultiplier={1.4}>
              Select your issuing country and enter your tax ID. This is a one-time check required
              by financial regulations.
            </Text>

            {/* Country selector */}
            <View className="mt-8">
              <Text className="mb-2 font-subtitle text-[13px] text-ash" maxFontSizeMultiplier={1.4}>
                Issuing country
              </Text>
              <Pressable
                onPress={() => {
                  selection();
                  setShowCountryPicker(true);
                }}
                className="flex-row items-center justify-between rounded-2xl border border-fog bg-parchment-card px-4 py-4"
                accessibilityRole="button">
                <View className="flex-row items-center gap-3">
                  <CountryFlag isoCode={KYC_TO_ISO2[currentCountry.code] || 'US'} size={24} />
                  <View>
                    <Text
                      className="font-subtitle text-[16px] text-charcoal-primary"
                      maxFontSizeMultiplier={1.3}>
                      {COUNTRY_LABELS[country]}
                    </Text>
                    <Text
                      className="mt-1 font-body text-[12px] text-ash"
                      maxFontSizeMultiplier={1.4}>
                      {COUNTRY_HELP_TEXT[country]}
                    </Text>
                  </View>
                </View>
                <HugeiconsIcon icon={ArrowDown01Icon} size={20} color="#848281" />
              </Pressable>
            </View>

            {/* Accepted documents hint */}
            <View className="mt-4 rounded-2xl border border-fog bg-parchment-card px-4 py-3">
              <Text
                className="mb-2 font-subtitle text-[13px] text-graphite"
                maxFontSizeMultiplier={1.4}>
                Accepted IDs:
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {requirements.acceptedDocuments.map((doc) => (
                  <View
                    key={doc.type}
                    className="flex-row items-center gap-1.5 rounded-full border border-fog bg-white px-3 py-1">
                    <Text
                      className="font-body text-[12px] text-graphite"
                      maxFontSizeMultiplier={1.4}>
                      {doc.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Tax ID */}
            <View className="mt-8">
              <InputField
                label={taxConfig.label}
                value={taxId}
                onChangeText={(v) => {
                  setTaxId(v);
                  if (taxIdError) setTaxIdError('');
                }}
                placeholder={taxConfig.placeholder}
                autoCapitalize="characters"
                error={taxIdError}
                helperText={taxConfig.helpText}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View
          className="absolute bottom-0 left-0 right-0 border-t border-stone-surface bg-parchment-card px-4 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <Button
            title="Continue"
            onPress={handleContinue}
            variant="orange"
            disabled={!canContinue}
          />
        </View>

        {/* Country picker modal */}
        <Modal
          visible={showCountryPicker}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            setShowCountryPicker(false);
            setSearchQuery('');
          }}>
          <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top']}>
            <View className="flex-row items-center justify-between border-b border-stone-surface px-4 py-4">
              <Text
                className="font-subtitle text-[18px] text-charcoal-primary"
                maxFontSizeMultiplier={1.3}>
                Select issuing country
              </Text>
              <Pressable
                onPress={() => {
                  setShowCountryPicker(false);
                  setSearchQuery('');
                }}
                className="size-11 items-center justify-center"
                accessibilityRole="button">
                <HugeiconsIcon icon={Cancel01Icon} size={22} color="#343433" />
              </Pressable>
            </View>

            <View className="border-b border-stone-surface px-4 pb-4">
              <View className="flex-row items-center rounded-full border border-fog bg-stone-surface px-4 py-3">
                <TextInput
                  className="flex-1 font-body text-[15px] text-charcoal-primary"
                  placeholder="Search countries..."
                  placeholderTextColor="#848281"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <Pressable
                    onPress={() => {
                      selection();
                      setSearchQuery('');
                    }}>
                    <HugeiconsIcon icon={Cancel01Icon} size={16} color="#848281" />
                  </Pressable>
                )}
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredCountries.map((item) => {
                const selected = item.code === country;
                return (
                  <Pressable
                    key={item.code}
                    onPress={() => {
                      selection();
                      setCountry(item.code);
                      setShowCountryPicker(false);
                      setSearchQuery('');
                    }}
                    className={`flex-row items-center justify-between border-b border-stone-surface px-4 py-4 ${selected ? 'bg-stone-surface' : 'bg-white'}`}
                    accessibilityRole="button">
                    <View className="flex-row items-center gap-3">
                      <CountryFlag isoCode={KYC_TO_ISO2[item.code] || 'US'} size={20} />
                      <Text
                        className="font-subtitle text-[15px] text-charcoal-primary"
                        maxFontSizeMultiplier={1.3}>
                        {COUNTRY_LABELS[item.code]}
                      </Text>
                    </View>
                    {selected ? (
                      <View className="size-6 items-center justify-center rounded-full bg-midnight">
                        <HugeiconsIcon
                          icon={CheckmarkCircle01Icon}
                          size={14}
                          color="#FFFFFF"
                          strokeWidth={3}
                        />
                      </View>
                    ) : (
                      <View className="size-6 rounded-full border border-fog" />
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
