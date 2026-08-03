import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '@/components/ui';
import { AuthGradient, StaggeredChild } from '@/components';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/authStore';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import apiClient from '@/api/client';
import {
  SelectableCard,
  SectionHeader,
  SelectableOption,
} from '@/components/molecules/SelectableOptionCard';

const OPTIONS: SelectableOption[] = [
  { value: 'salary', label: 'Salary / Employment', icon: '💰' },
  { value: 'business_income', label: 'Business income', icon: '📈' },
  { value: 'investments_loans', label: 'Investments', icon: '📊' },
  { value: 'savings', label: 'Savings', icon: '🏦' },
  { value: 'sale_of_assets_real_estate', label: 'Sale of assets', icon: '🏠' },
  { value: 'inheritance', label: 'Inheritance / Gift', icon: '🎁' },
  { value: 'pension_retirement', label: 'Pension / Retirement', icon: '🏖️' },
  { value: 'government_benefits', label: 'Government benefits', icon: '🏛️' },
];

export default function SourceOfFundsScreen() {
  const registrationData = useAuthStore((s) => s.registrationData);
  const updateRegistrationData = useAuthStore((s) => s.updateRegistrationData);
  const { showError, showWarning } = useFeedbackPopup();
  const { notification } = useHaptics();
  const [selected, setSelected] = useState(registrationData.sourceOfFunds || '');
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const canSubmit = selected !== '' && !isSaving;

  const handleSubmit = async () => {
    if (!canSubmit) {
      showWarning('Incomplete', 'Please select where your money primarily comes from.');
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.post('/v1/onboarding/source-of-funds', {
        employment_status: registrationData.employmentStatus,
        source_of_funds: selected,
        account_purpose: registrationData.accountPurpose,
      });
    } catch (err: any) {
      console.warn('source-of-funds save failed (non-fatal):', err?.message);
    }

    updateRegistrationData({ sourceOfFunds: selected });
    notification('success');
    playUISound('transactionSuccess');
    useAuthStore.getState().setOnboardingStatus('basic_complete');
    router.replace(ROUTES.TABS as never);
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={Platform.OS === 'android'}
        />
        <StaggeredChild index={0}>
          <ScrollView
            ref={scrollRef}
            className="flex-1 px-6 pt-4"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="pb-6">
            <StaggeredChild index={0}>
              <View className="mb-8 mt-4">
                <Text
                  className="font-headline-2 text-auth-title leading-[1.1] text-charcoal-primary"
                  maxFontSizeMultiplier={1.3}>
                  Source of Funds
                </Text>
                <Text className="mt-2 font-body text-caption text-ash" maxFontSizeMultiplier={1.4}>
                  Where does your money primarily come from?
                </Text>
              </View>
            </StaggeredChild>

            <StaggeredChild index={1}>
              <SectionHeader title="Select one" />
              {OPTIONS.map((opt, i) => (
                <SelectableCard
                  key={opt.value}
                  option={opt}
                  selected={selected === opt.value}
                  onPress={() => setSelected(opt.value)}
                  index={i}
                />
              ))}
            </StaggeredChild>
          </ScrollView>
        </StaggeredChild>

        <StaggeredChild index={2} delay={80} style={{ marginTop: 'auto' }}>
          <SafeAreaView edges={['bottom']} className="px-6 pb-4">
            <Button
              title={isSaving ? 'Saving...' : 'Continue'}
              onPress={handleSubmit}
              variant="orange"
              disabled={!canSubmit}
              loading={isSaving}
            />
          </SafeAreaView>
        </StaggeredChild>
      </SafeAreaView>
    </AuthGradient>
  );
}
