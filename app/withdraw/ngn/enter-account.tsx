import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { CheckmarkCircle02Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import { Button } from '@/components/ui';
import { ScreenHeader } from '@/components/withdraw/shared';
import { usePajResolveBankAccount } from '@/api/hooks/usePaj';

export default function NgnEnterAccountScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    amount: string;
    currency: string;
    bankId: string;
    bankName: string;
    bankLogo: string;
  }>();

  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const { mutate: resolve, isPending: isResolving } = usePajResolveBankAccount();

  useEffect(() => {
    if (accountNumber.length !== 10 || !params.bankId) {
      setAccountName('');
      return;
    }
    let stale = false;
    resolve(
      { bankId: params.bankId, accountNumber },
      {
        onSuccess: (d) => {
          if (!stale) setAccountName(d.accountName);
        },
        onError: () => {
          if (!stale) setAccountName('');
        },
      }
    );
    return () => {
      stale = true;
    };
  }, [accountNumber, params.bankId, resolve]);

  const onContinue = useCallback(() => {
    router.replace({
      pathname: '/withdraw/ngn/confirm' as never,
      params: {
        amount: params.amount,
        currency: params.currency ?? 'NGN',
        bankId: params.bankId,
        bankName: params.bankName,
        accountNumber,
        accountName,
      },
    } as never);
  }, [params, accountNumber, accountName]);

  return (
    <Pressable
      className="flex-1 bg-warm-canvas"
      style={{ paddingTop: insets.top }}
      onPress={Keyboard.dismiss}>
      <StatusBar barStyle="dark-content" />
      <ScreenHeader />

      <View className="flex-1 px-5">
        <Animated.Text
          entering={FadeInDown.duration(300)}
          className="font-subtitle text-[28px] text-text-primary">
          Enter Account Number
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.delay(60).duration(300)}
          className="mt-1 font-body text-[14px] text-text-secondary">
          {params.bankName}
        </Animated.Text>

        <Animated.View entering={FadeInUp.delay(120).duration(300)} className="mt-8">
          <TextInput
            className="border-b border-[#E5E5E5] pb-3 font-subtitle text-[20px] text-text-primary"
            placeholder="10-digit account number"
            placeholderTextColor="#C4C4C4"
            value={accountNumber}
            onChangeText={(v) => setAccountNumber(v.replace(/\D/g, '').slice(0, 10))}
            keyboardType="number-pad"
            autoFocus
            maxLength={10}
          />
        </Animated.View>

        {accountName ? (
          <Animated.View
            entering={FadeIn.duration(250)}
            className="mt-4 flex-row items-center gap-2 rounded-xl bg-[#F0FDF4] px-4 py-3">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} color="#00ca48" />
            <Text className="flex-1 font-subtitle text-[14px] text-[#00ca48]">{accountName}</Text>
          </Animated.View>
        ) : isResolving ? (
          <Animated.View
            entering={FadeIn.duration(150)}
            className="mt-4 flex-row items-center gap-2 rounded-xl bg-[#f8f7f4] px-4 py-3">
            <ActivityIndicator size="small" color="#848281" />
            <Text className="font-body text-[13px] text-text-secondary">Resolving account…</Text>
          </Animated.View>
        ) : null}
      </View>

      <Animated.View
        entering={FadeInUp.delay(200).duration(300)}
        className="px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <Button title="Continue" variant="orange" onPress={onContinue} disabled={!accountName} />
      </Animated.View>
    </Pressable>
  );
}
