import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '@/components/ui';
import { AuthGradient, StaggeredChild } from '@/components';
import { OnboardingWizardHeader } from '@/components/onboarding/OnboardingWizardHeader';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/authStore';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import {
  SelectableCard,
  SectionHeader,
  SelectableOption,
} from '@/components/molecules/SelectableOptionCard';

const OPTIONS: SelectableOption[] = [
  { value: 'personal_or_living_expenses', label: 'Personal / living expenses', icon: '🛒' },
  { value: 'receive_salary', label: 'Receive salary', icon: '💵' },
  { value: 'investment_purposes', label: 'Investment', icon: '📈' },
  { value: 'receive_payment_for_freelancing', label: 'Freelancing', icon: '💻' },
  { value: 'purchase_goods_and_services', label: 'Purchase goods & services', icon: '🛍️' },
  { value: 'payments_to_friends_or_family_abroad', label: 'Send money abroad', icon: '🌍' },
  { value: 'business_transactions', label: 'Business transactions', icon: '💼' },
  { value: 'other', label: 'Other', icon: '✨' },
];

export default function AccountPurposeScreen() {
  const registrationData = useAuthStore((s) => s.registrationData);
  const updateRegistrationData = useAuthStore((s) => s.updateRegistrationData);
  const { showWarning } = useFeedbackPopup();
  const { notification } = useHaptics();
  const [selected, setSelected] = useState(registrationData.accountPurpose || '');
  const scrollRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (!selected) {
      showWarning('Incomplete', 'Please select what you will use your account for.');
      return;
    }
    updateRegistrationData({ accountPurpose: selected });
    notification('success');
    playUISound('transactionSuccess');
    router.push(ROUTES.AUTH.COMPLETE_PROFILE.SOURCE_OF_FUNDS as never);
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
            <OnboardingWizardHeader step={2} total={3} />
            <StaggeredChild index={0}>
              <View className="mb-8">
                <Text
                  className="font-headline-2 text-auth-title leading-[1.1] text-charcoal-primary"
                  maxFontSizeMultiplier={1.3}>
                  Account purpose
                </Text>
                <Text className="mt-2 font-body text-caption text-ash" maxFontSizeMultiplier={1.4}>
                  What will you primarily use your account for?
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
            <Button title="Next" onPress={handleNext} variant="orange" disabled={!selected} />
          </SafeAreaView>
        </StaggeredChild>
      </SafeAreaView>
    </AuthGradient>
  );
}
