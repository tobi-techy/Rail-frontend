import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StatusBar, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Button, Input } from '@/components/ui';
import { ScreenHeader, CategoryPicker } from '@/components/withdraw/shared';
import {
  formatCurrency,
  formatSortCode,
  getDestinationError,
  getFiatAccountNumberError,
} from '@/components/withdraw/method-screen/utils';
import { useFiatRecipients } from '@/hooks/useFiatRecipients';

export default function GbpNewRecipientScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ amount: string; currency: string }>();
  const numericAmount = parseFloat(params.amount ?? '0') || 0;
  const { save } = useFiatRecipients('GBP');

  const [accountHolderName, setAccountHolderName] = useState('');
  const [sortCode, setSortCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [category, setCategory] = useState('Transfer');
  const [narration, setNarration] = useState('');
  const [didTry, setDidTry] = useState(false);

  const sortCodeError = useMemo(
    () =>
      getDestinationError({
        destinationInput: sortCode,
        isFiatMethod: true,
        isCryptoDestinationMethod: false,
        isAssetTradeMethod: false,
        isMobileWalletFundingFlow: false,
        destinationChain: 'SOL',
        fiatCurrency: 'GBP',
      }),
    [sortCode]
  );

  const accountError = useMemo(
    () => getFiatAccountNumberError(accountNumber, 'GBP'),
    [accountNumber]
  );

  const canContinue =
    accountHolderName.trim().length >= 2 &&
    sortCode.length === 6 &&
    !sortCodeError &&
    accountNumber.length === 8 &&
    !accountError;

  const onContinue = useCallback(() => {
    setDidTry(true);
    if (!canContinue) return;
    save({ accountHolderName: accountHolderName.trim(), accountNumber, routingNumber: sortCode });
    router.replace({
      pathname: '/withdraw/gbp/confirm' as never,
      params: {
        amount: params.amount,
        currency: 'GBP',
        accountHolderName: accountHolderName.trim(),
        accountNumber,
        sortCode,
        category,
        narration,
      },
    } as never);
  }, [
    canContinue,
    accountHolderName,
    accountNumber,
    sortCode,
    category,
    narration,
    params.amount,
    save,
  ]);

  return (
    <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <ScreenHeader />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          className="flex-1 px-5"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}>
          <Animated.View entering={FadeInUp.duration(250)} className="mb-5 mt-2">
            <Text
              className="font-subtitle text-[28px] text-text-primary"
              maxFontSizeMultiplier={1.3}>
              New Recipient
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(40).duration(250)} className="gap-4">
            <Input
              label="Account Holder"
              value={accountHolderName}
              onChangeText={setAccountHolderName}
              placeholder="Full name on bank account"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />
            <Input
              label="Sort Code"
              value={formatSortCode(sortCode)}
              onChangeText={(v: string) => setSortCode(v.replace(/\D/g, '').slice(0, 6))}
              placeholder="XX-XX-XX"
              keyboardType="number-pad"
              autoCorrect={false}
              returnKeyType="next"
              error={didTry || sortCode.length > 0 ? sortCodeError : undefined}
            />
            <Input
              label="Account Number"
              value={accountNumber}
              onChangeText={(v: string) => setAccountNumber(v.replace(/\D/g, '').slice(0, 8))}
              placeholder="8-digit account number"
              keyboardType="number-pad"
              autoCorrect={false}
              returnKeyType="done"
              error={didTry ? accountError : undefined}
            />
          </Animated.View>

          <View className="my-4 h-px bg-stone-surface" />

          <Animated.View entering={FadeInUp.delay(80).duration(250)}>
            <CategoryPicker value={category} onChange={setCategory} />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(120).duration(250)} className="mt-4">
            <Input
              label="Note"
              value={narration}
              onChangeText={setNarration}
              placeholder="What's this for? (optional)"
              maxLength={255}
              multiline
              returnKeyType="done"
              blurOnSubmit
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View
        className="border-t border-stone-surface bg-parchment-card px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <View className="mb-3 gap-1.5">
          <View className="flex-row items-center justify-between px-1">
            <Text className="font-body text-[13px] text-text-secondary" maxFontSizeMultiplier={1.4}>
              Amount
            </Text>
            <Text className="font-body text-[13px] text-text-primary" maxFontSizeMultiplier={1.4}>
              £{formatCurrency(numericAmount)}
            </Text>
          </View>
          <View className="flex-row items-center justify-between px-1">
            <Text className="font-body text-[13px] text-text-secondary" maxFontSizeMultiplier={1.4}>
              Network fee
            </Text>
            <Text className="font-body text-[13px] text-text-primary" maxFontSizeMultiplier={1.4}>
              $1.00
            </Text>
          </View>
          <View className="mx-1 my-1 h-px bg-stone-surface" />
          <View className="flex-row items-center justify-between px-1">
            <Text
              className="font-subtitle text-[14px] text-text-primary"
              maxFontSizeMultiplier={1.4}>
              Total
            </Text>
            <Text
              className="font-subtitle text-[16px] text-text-primary"
              maxFontSizeMultiplier={1.3}>
              £{formatCurrency(numericAmount + 1)}
            </Text>
          </View>
        </View>
        <Button
          title="Review & Confirm"
          variant="orange"
          onPress={onContinue}
          disabled={!canContinue}
        />
      </View>
    </SafeAreaView>
  );
}
