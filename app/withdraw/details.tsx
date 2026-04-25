import React, { useState, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, StatusBar,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Button } from '@/components/ui';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { formatCurrency } from './method-screen/utils';
import { useNudge } from '@/hooks/useNudge';
import { AmbientMiriam } from '@/components/ai/AmbientMiriam';

const CATEGORIES = [
  { label: 'Transfer', emoji: '💸' },
  { label: 'Bills', emoji: '🧾' },
  { label: 'Food', emoji: '🍔' },
  { label: 'Shopping', emoji: '🛍️' },
  { label: 'Travel', emoji: '✈️' },
  { label: 'Savings', emoji: '🏦' },
  { label: 'Crypto', emoji: '🪙' },
  { label: 'Other', emoji: '📌' },
] as const;

export default function DetailsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    method: string; amount: string; isFiatMethod?: string; isCryptoMethod?: string;
    isAssetTradeMethod?: string; methodTitle?: string; destinationInput?: string;
    destinationChain?: string; fiatAccountHolderName?: string; fiatAccountNumber?: string;
    availableBalance?: string; withdrawalLimit?: string;
  }>();

  const numericAmount = parseFloat(params.amount ?? '0') || 0;
  const feeAmount = numericAmount > 0 ? 0.5 : 0;
  const totalAmount = numericAmount + feeAmount;

  const [category, setCategory] = useState('Transfer');
  const [narration, setNarration] = useState('');
  const { nudge, dismiss: dismissNudge } = useNudge('withdraw', params.amount, 'USDC');

  const onContinue = useCallback(() => {
    router.push({
      pathname: '/withdraw/confirm',
      params: { ...params, category, narration },
    });
  }, [params, category, narration]);

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FB]" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />
      <AmbientMiriam nudge={nudge} onDismiss={dismissNudge} />

      {/* Header */}
      <View className="flex-row items-center justify-between bg-white px-5 pb-3 pt-1">
        <Pressable
          className="size-10 items-center justify-center rounded-full"
          onPress={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#111827" />
        </Pressable>
        <Text className="font-subtitle text-[17px] text-[#111827]">Details</Text>
        <View className="size-10" />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}>

          {/* Category */}
          <Animated.View entering={FadeInUp.duration(250)} className="mx-5 mt-5 mb-5">
            <Text className="mb-3 ml-1 font-body text-[13px] text-[#6B7280]">Category</Text>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const active = category === cat.label;
                return (
                  <Pressable
                    key={cat.label}
                    onPress={() => setCategory(cat.label)}
                    className="flex-row items-center gap-1.5 rounded-full px-4 py-2.5"
                    style={{
                      backgroundColor: active ? '#111827' : '#FFFFFF',
                    }}>
                    <Text className="text-[14px]">{cat.emoji}</Text>
                    <Text
                      className="font-body text-[14px]"
                      style={{ color: active ? '#FFFFFF' : '#374151' }}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Note */}
          <Animated.View entering={FadeInUp.delay(60).duration(250)} className="mx-5 mb-5">
            <Text className="mb-2 ml-1 font-body text-[13px] text-[#6B7280]">Note</Text>
            <View className="rounded-2xl bg-white px-4 py-1">
              <TextInput
                className="py-3 font-body text-[15px] text-[#111827]"
                placeholder="What's this for? (optional)"
                placeholderTextColor="#C4C4C4"
                value={narration}
                onChangeText={setNarration}
                maxLength={255}
                multiline
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky footer with summary */}
      <View
        className="bg-white px-5 pt-3 shadow-sm"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        {/* Fee breakdown */}
        <View className="mb-3 gap-1.5">
          <View className="flex-row items-center justify-between px-1">
            <Text className="font-body text-[13px] text-[#9CA3AF]">Amount</Text>
            <Text className="font-body text-[13px] text-[#111827]">
              ${formatCurrency(numericAmount)}
            </Text>
          </View>
          {feeAmount > 0 && (
            <View className="flex-row items-center justify-between px-1">
              <Text className="font-body text-[13px] text-[#9CA3AF]">Network fee</Text>
              <Text className="font-body text-[13px] text-[#111827]">
                ${formatCurrency(feeAmount)}
              </Text>
            </View>
          )}
          <View className="mx-1 my-1 h-px bg-[#F3F4F6]" />
          <View className="flex-row items-center justify-between px-1">
            <Text className="font-subtitle text-[14px] text-[#111827]">Total</Text>
            <Text className="font-subtitle text-[16px] text-[#111827]">
              ${formatCurrency(totalAmount)}
            </Text>
          </View>
        </View>
        <Button title="Review & Confirm" onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}
