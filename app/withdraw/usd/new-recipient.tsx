import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StatusBar, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Button, Input } from '@/components/ui';
import { ScreenHeader, CategoryPicker } from '@/components/withdraw/shared';
import {
  formatCurrency,
  getDestinationError,
  getFiatAccountNumberError,
} from '@/components/withdraw/method-screen/utils';
import { useFiatRecipients } from '@/hooks/useFiatRecipients';

export default function UsdNewRecipientScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ amount: string; currency: string }>();
  const numericAmount = parseFloat(params.amount ?? '0') || 0;
  const { save } = useFiatRecipients('USD');

  const [accountHolderName, setAccountHolderName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [category, setCategory] = useState('Transfer');
  const [narration, setNarration] = useState('');
  const [didTry, setDidTry] = useState(false);

  const routingError = useMemo(
    () =>
      getDestinationError({
        destinationInput: routingNumber,
        isFiatMethod: true,
        isCryptoDestinationMethod: false,
        isAssetTradeMethod: false,
        isMobileWalletFundingFlow: false,
        destinationChain: 'SOL',
        fiatCurrency: 'USD',
      }),
    [routingNumber]
  );

  const accountError = useMemo(
    () => getFiatAccountNumberError(accountNumber, 'USD'),
    [accountNumber]
  );

  const canContinue =
    accountHolderName.trim().length >= 2 &&
    routingNumber.length >= 9 &&
    !routingError &&
    accountNumber.length >= 4 &&
    !accountError;

  const onContinue = useCallback(() => {
    setDidTry(true);
    if (!canContinue) return;
    save({ accountHolderName: accountHolderName.trim(), accountNumber, routingNumber });
    router.replace({
      pathname: '/withdraw/usd/confirm' as never,
      params: {
        amount: params.amount,
        currency: 'USD',
        accountHolderName: accountHolderName.trim(),
        accountNumber,
        routingNumber,
        category,
        narration,
      },
    } as never);
  }, [
    canContinue,
    accountHolderName,
    accountNumber,
    routingNumber,
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
            <Text className="font-subtitle text-[28px] text-text-primary">New Recipient</Text>
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
              label="Routing Number"
              value={routingNumber}
              onChangeText={(v: string) => setRoutingNumber(v.replace(/\D/g, '').slice(0, 9))}
              placeholder="9-digit routing number"
              keyboardType="number-pad"
              autoCorrect={false}
              returnKeyType="next"
              error={didTry || routingNumber.length > 0 ? routingError : undefined}
            />
            <Input
              label="Account Number"
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="4–17 digit account number"
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
            <Text className="font-body text-[13px] text-text-secondary">Amount</Text>
            <Text className="font-body text-[13px] text-text-primary">
              ${formatCurrency(numericAmount)}
            </Text>
          </View>
          <View className="flex-row items-center justify-between px-1">
            <Text className="font-body text-[13px] text-text-secondary">Network fee</Text>
            <Text className="font-body text-[13px] text-text-primary">$1.00</Text>
          </View>
          <View className="mx-1 my-1 h-px bg-stone-surface" />
          <View className="flex-row items-center justify-between px-1">
            <Text className="font-subtitle text-[14px] text-text-primary">Total</Text>
            <Text className="font-subtitle text-[16px] text-text-primary">
              ${formatCurrency(numericAmount + 1)}
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
