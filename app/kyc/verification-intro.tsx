import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
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
  ShieldKeyIcon,
  Clock01Icon,
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
  { icon: ArrowDownLeft01Icon, label: 'Withdraw to bank' },
  { icon: CreditCardIcon, label: 'Rail Debit Card' },
  { icon: BankIcon, label: 'Bank deposits' },
  { icon: ChartUpIcon, label: 'Invest' },
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

        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingTop: 24, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}>
          <Text className="font-display text-[32px] leading-[36px] text-gray-900">
            Verify your identity
          </Text>
          <Text className="mt-3 font-body text-[15px] leading-6 text-gray-600">
            A one-time check required by financial regulations. Takes under 5 minutes.
          </Text>

          {/* What you unlock */}
          <View className="mt-8 rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <Text className="mb-3 font-subtitle text-[13px] text-gray-700">
              What you unlock:
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {FEATURES_UNLOCKED.map((f) => (
                <View
                  key={f.label}
                  className="flex-row items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
                  <HugeiconsIcon icon={f.icon} size={14} color="#374151" />
                  <Text className="font-body text-[13px] text-gray-700">{f.label}</Text>
                </View>
              ))}
            </View>
          </View>

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

          {/* Trust signals */}
          <View className="mt-8 flex-row gap-3">
            <View className="flex-1 flex-row items-center gap-2 rounded-2xl bg-gray-50 px-3 py-2.5">
              <HugeiconsIcon icon={ShieldKeyIcon} size={15} color="#6B7280" />
              <Text className="flex-1 font-body text-[12px] leading-4 text-gray-500">
                Encrypted & never sold
              </Text>
            </View>
            <View className="flex-1 flex-row items-center gap-2 rounded-2xl bg-gray-50 px-3 py-2.5">
              <HugeiconsIcon icon={Clock01Icon} size={15} color="#6B7280" />
              <Text className="flex-1 font-body text-[12px] leading-4 text-gray-500">
                Done once, valid forever
              </Text>
            </View>
          </View>
        </ScrollView>

        <View className="px-6" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <Button
            title="Get Started"
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
