import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { useAnalytics, ANALYTICS_EVENTS } from '@/utils/analytics';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import {
  ArrowLeft01Icon,
  BankIcon,
  CreditCardIcon,
  ChartUpIcon,
  ArrowDownLeft01Icon,
  ShieldKeyIcon,
  Clock01Icon,
} from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';

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
  const { impact } = useHaptics();

  return (
    <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top', 'bottom']}>
      <View className="flex-1">
        <View className="px-4 pb-2 pt-1">
          <Pressable
            className="size-11 items-center justify-center rounded-full bg-stone-surface"
            onPress={() => {
              router.back();
            }}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#343433" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingTop: 24, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}>
          <Text
            className="font-display text-[32px] leading-[36px] text-charcoal-primary"
            maxFontSizeMultiplier={1.3}>
            Verify your identity
          </Text>
          <Text
            className="mt-3 font-body text-[15px] leading-6 text-ash"
            maxFontSizeMultiplier={1.4}>
            A one-time check required by financial regulations. Takes under 5 minutes.
          </Text>

          {/* What you unlock */}
          <View className="mt-8 rounded-2xl border border-stone-surface bg-stone-surface p-4">
            <Text
              className="mb-3 font-subtitle text-[13px] text-graphite"
              maxFontSizeMultiplier={1.4}>
              What you unlock:
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {FEATURES_UNLOCKED.map((f) => (
                <View
                  key={f.label}
                  className="flex-row items-center gap-2 rounded-full border border-fog bg-parchment-card px-3 py-1.5">
                  <HugeiconsIcon icon={f.icon} size={14} color="#474645" />
                  <Text className="font-body text-[13px] text-graphite" maxFontSizeMultiplier={1.4}>
                    {f.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Text
            className="mt-8 font-subtitle text-[18px] text-charcoal-primary"
            maxFontSizeMultiplier={1.3}>
            How it works
          </Text>
          <View className="mt-4 gap-y-6">
            {STEPS.map((step) => (
              <View key={step.number} className="flex-row items-start gap-x-4">
                <View className="size-8 items-center justify-center rounded-full bg-midnight">
                  <Text
                    className="font-subtitle text-[14px] text-white"
                    maxFontSizeMultiplier={1.4}>
                    {step.number}
                  </Text>
                </View>
                <View className="flex-1 pt-0.5">
                  <Text
                    className="font-subtitle text-[16px] text-charcoal-primary"
                    maxFontSizeMultiplier={1.3}>
                    {step.title}
                  </Text>
                  <Text
                    className="mt-1 font-body text-[14px] leading-5 text-ash"
                    maxFontSizeMultiplier={1.4}>
                    {step.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Trust signals */}
          <View className="mt-8 flex-row gap-3">
            <View className="flex-1 flex-row items-center gap-2 rounded-2xl bg-stone-surface px-3 py-2.5">
              <HugeiconsIcon icon={ShieldKeyIcon} size={15} color="#848281" />
              <Text
                className="flex-1 font-body text-[12px] leading-4 text-ash"
                maxFontSizeMultiplier={1.4}>
                Encrypted & never sold
              </Text>
            </View>
            <View className="flex-1 flex-row items-center gap-2 rounded-2xl bg-stone-surface px-3 py-2.5">
              <HugeiconsIcon icon={Clock01Icon} size={15} color="#848281" />
              <Text
                className="flex-1 font-body text-[12px] leading-4 text-ash"
                maxFontSizeMultiplier={1.4}>
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
