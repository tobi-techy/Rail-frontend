import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { useAnalytics, ANALYTICS_EVENTS } from '@/utils/analytics';
import {
  ArrowLeft01Icon,
  BankIcon,
  CreditCardIcon,
  ChartUpIcon,
  ArrowDownLeft01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

const STEPS = [
  {
    number: '1',
    title: 'Select your country',
    description: 'Choose the country that issued your ID',
  },
  {
    number: '2',
    title: 'Enter your tax ID',
    description: 'Your tax identifier for regulatory compliance',
  },
  {
    number: '3',
    title: 'Verify your identity',
    description: 'Add personal details and upload an ID',
  },
];

const FEATURES_UNLOCKED = [
  { icon: CreditCardIcon, title: 'Fiat deposits', description: 'Add money from your bank account' },
  { icon: CreditCardIcon, title: 'Get a Rail Card', description: 'Spend your crypto anywhere' },
  { icon: ChartUpIcon, title: 'Invest', description: 'Trade stocks, ETFs, and crypto' },
  {
    icon: ArrowDownLeft01Icon,
    title: 'Withdraw to bank',
    description: 'Cash out to your local bank',
  },
];

export default function KycVerificationIntroScreen() {
  const insets = useSafeAreaInsets();
  const { track } = useAnalytics();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1">
        <View className="px-4 pb-2 pt-1">
          <Pressable
            className="size-11 items-center justify-center rounded-full bg-gray-100"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#111827" />
          </Pressable>
        </View>

        <View className="flex-1 px-6 pt-12">
          <Text className="font-display text-[32px] leading-[36px] text-gray-900">
            Verify your identity
          </Text>
          <Text className="mt-3 font-body text-[15px] leading-6 text-gray-600">
            Complete verification to unlock all features
          </Text>

          <Text className="mt-8 font-subtitle text-[18px] text-gray-900">How it works</Text>
          <View className="mt-4 gap-y-6">
            {STEPS.map((step) => (
              <View key={step.number} className="flex-row items-start gap-x-4">
                <View className="size-8 items-center justify-center rounded-full bg-gray-900">
                  <Text className="font-subtitle text-[14px] text-white">{step.number}</Text>
                </View>
                <View className="flex-1 pt-0.5">
                  <Text className="font-subtitle text-[16px] text-gray-900">{step.title}</Text>
                  <Text className="mt-1 font-body text-[14px] leading-5 text-gray-500">
                    {step.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className="px-6" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <Button
            title="Continue"
            onPress={() => {
              track(ANALYTICS_EVENTS.KYC_VERIFICATION_STARTED);
              router.replace('/kyc/tax-id');
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
