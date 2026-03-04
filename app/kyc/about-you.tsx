import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronDown, ChevronLeft, Check } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BottomSheet } from '@/components/sheets/BottomSheet';
import { Button } from '@/components/ui';
import { EMPLOYMENT_STATUS_OPTIONS, INVESTMENT_PURPOSE_OPTIONS } from '@/api/types/kyc';
import { useKycStore } from '@/stores/kycStore';

export default function KycAboutYouScreen() {
  const insets = useSafeAreaInsets();
  const { employmentStatus, investmentPurposes, setEmploymentStatus, toggleInvestmentPurpose } =
    useKycStore();

  const [showEmployment, setShowEmployment] = useState(false);
  const [showPurpose, setShowPurpose] = useState(false);

  const canContinue = employmentStatus && investmentPurposes.length > 0;

  const employmentLabel =
    EMPLOYMENT_STATUS_OPTIONS.find((o) => o.value === employmentStatus)?.label ??
    'Select your employment status';

  const purposeLabel =
    investmentPurposes.length > 0
      ? investmentPurposes
          .map((v) => INVESTMENT_PURPOSE_OPTIONS.find((o) => o.value === v)?.label)
          .filter(Boolean)
          .join(', ')
      : 'Select investment goals';

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center justify-between px-4 pb-2 pt-1">
          <Pressable
            className="size-11 items-center justify-center rounded-full bg-gray-100"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <ChevronLeft size={22} color="#111827" />
          </Pressable>
          <Text className="font-subtitle text-[13px] text-gray-500">Step 3 of 4</Text>
          <View className="size-11" />
        </View>

        <View className="px-4">
          <View className="h-1.5 overflow-hidden rounded-full bg-gray-200">
            <View className="h-full w-2/4 rounded-full bg-gray-900" />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 120 }}>
          <Text className="font-display text-[30px] leading-[34px] text-gray-900">
            Just a few more questions
          </Text>
          <Text className="mt-2 font-body text-[15px] leading-6 text-gray-600">
            Financial regulations require us to collect this information.
          </Text>

          {/* Employment Status */}
          <View className="mt-8">
            <Text className="mb-2 font-subtitle text-[14px] text-gray-900">Employment Status</Text>
            <Pressable
              onPress={() => setShowEmployment(true)}
              className="flex-row items-center justify-between rounded-2xl border border-gray-200 px-4 py-4"
              accessibilityRole="button"
              accessibilityLabel="Select employment status">
              <Text
                className={`flex-1 font-body text-[15px] ${
                  employmentStatus ? 'text-gray-900' : 'text-gray-400'
                }`}
                numberOfLines={1}>
                {employmentLabel}
              </Text>
              <ChevronDown size={20} color="#9CA3AF" />
            </Pressable>
          </View>

          {/* Investment Purpose */}
          <View className="mt-6">
            <Text className="mb-2 font-subtitle text-[14px] text-gray-900">Purpose of account</Text>
            <Pressable
              onPress={() => setShowPurpose(true)}
              className="flex-row items-center justify-between rounded-2xl border border-gray-200 px-4 py-4"
              accessibilityRole="button"
              accessibilityLabel="Select investment goals">
              <Text
                className={`flex-1 font-body text-[15px] ${
                  investmentPurposes.length > 0 ? 'text-gray-900' : 'text-gray-400'
                }`}
                numberOfLines={1}>
                {purposeLabel}
              </Text>
              <ChevronDown size={20} color="#9CA3AF" />
            </Pressable>
          </View>
        </ScrollView>

        <View
          className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-4 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <Button
            title="Continue"
            onPress={() => router.push('/kyc/disclosures')}
            disabled={!canContinue}
          />
        </View>

        {/* Employment Bottom Sheet */}
        <BottomSheet
          visible={showEmployment}
          onClose={() => setShowEmployment(false)}
          showCloseButton={false}>
          <Text className="mb-4 font-display text-[22px] text-gray-900">Employment status</Text>
          {EMPLOYMENT_STATUS_OPTIONS.map((option, index) => {
            const selected = employmentStatus === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  setEmploymentStatus(option.value);
                  setShowEmployment(false);
                }}
                className={`flex-row items-center justify-between py-4 ${
                  index < EMPLOYMENT_STATUS_OPTIONS.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                accessibilityRole="button">
                <Text className="font-body text-[16px] text-gray-900">{option.label}</Text>
                {selected && <Check size={20} color="#111827" strokeWidth={2.5} />}
              </Pressable>
            );
          })}
          <View className="mt-4">
            <Button title="Done" onPress={() => setShowEmployment(false)} />
          </View>
        </BottomSheet>

        {/* Investment Purpose Bottom Sheet */}
        <BottomSheet
          visible={showPurpose}
          onClose={() => setShowPurpose(false)}
          showCloseButton={false}>
          <Text className="mb-1 font-display text-[22px] text-gray-900">Purpose of account</Text>
          <Text className="mb-4 font-body text-[13px] text-gray-500">Select all that apply</Text>
          {INVESTMENT_PURPOSE_OPTIONS.map((option, index) => {
            const selected = investmentPurposes.includes(option.value);
            return (
              <Pressable
                key={option.value}
                onPress={() => toggleInvestmentPurpose(option.value)}
                className={`flex-row items-center justify-between py-4 ${
                  index < INVESTMENT_PURPOSE_OPTIONS.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}>
                <Text className="flex-1 font-body text-[16px] text-gray-900">{option.label}</Text>
                <View
                  className={`size-6 items-center justify-center rounded ${
                    selected ? 'bg-gray-900' : 'border border-gray-300'
                  }`}>
                  {selected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                </View>
              </Pressable>
            );
          })}
          <View className="mt-4">
            <Button title="Done" onPress={() => setShowPurpose(false)} />
          </View>
        </BottomSheet>
      </SafeAreaView>
    </ErrorBoundary>
  );
}
