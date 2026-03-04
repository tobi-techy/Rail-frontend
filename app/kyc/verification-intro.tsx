import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { Button } from '@/components/ui';

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

export default function KycVerificationIntroScreen() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1">
        <View className="px-4 pb-2 pt-1">
          <Pressable
            className="size-11 items-center justify-center rounded-full bg-gray-100"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <ChevronLeft size={22} color="#111827" />
          </Pressable>
        </View>

        <View className="flex-1 px-6 pt-12">
          <Text className="font-display text-[32px] leading-[36px] text-gray-900">
            Let&apos;s get started
          </Text>

          <View className="mt-10 gap-y-8">
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
          <Button title="Continue" onPress={() => router.replace('/kyc/tax-id')} />
          <Pressable
            onPress={() => router.replace('/')}
            className="mt-3 py-2"
            accessibilityRole="button"
            accessibilityLabel="Verify later">
            <Text className="text-center font-body text-[14px] text-gray-500">Verify later</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
