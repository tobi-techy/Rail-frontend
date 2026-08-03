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
import {
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  IconComponent as HugeiconsIcon,
} from '@/lib/icons';
import { Button } from '@/components/ui';
import { ScreenHeader } from '@/components/withdraw/shared';
import { useRampResolveBankAccount } from '@/api/hooks/useRamp';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import * as Haptics from '@/utils/platformHaptics';

export default function NgnEnterAccountScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    bankCode: string;
    bankName: string;
  }>();

  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [resolveError, setResolveError] = useState('');
  const { mutate: resolve, isPending: isResolving } = useRampResolveBankAccount();
  const { notification, impact } = useHaptics();

  useEffect(() => {
    if (accountNumber.length !== 10 || !params.bankCode) {
      setAccountName('');
      setResolveError('');
      return;
    }
    let stale = false;
    setResolveError('');
    resolve(
      { bankCode: params.bankCode, accountNumber },
      {
        onSuccess: (d) => {
          if (!stale) {
            setAccountName(d.accountName);
            notification('success');
            playUISound('transactionSuccess');
          }
        },
        onError: () => {
          if (!stale) {
            setAccountName('');
            setResolveError('Account not found. Check the number and try again.');
          }
        },
      }
    );
    return () => {
      stale = true;
    };
  }, [accountNumber, params.bankCode, resolve, notification]);

  const onContinue = useCallback(() => {
    impact(Haptics.ImpactFeedbackStyle.Medium);
    playUISound('buttonClick');
    router.push({
      pathname: '/withdraw/ngn/enter-amount' as never,
      params: {
        currency: 'NGN',
        bankCode: params.bankCode,
        bankName: params.bankName,
        accountNumber,
        accountName,
      },
    } as never);
  }, [params, accountNumber, accountName, impact]);

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
            <Text
              className="flex-1 font-subtitle text-[14px] text-[#00ca48]"
              maxFontSizeMultiplier={1.4}>
              {accountName}
            </Text>
          </Animated.View>
        ) : isResolving ? (
          <Animated.View
            entering={FadeIn.duration(150)}
            className="mt-4 flex-row items-center gap-2 rounded-xl bg-[#f8f7f4] px-4 py-3">
            <ActivityIndicator size="small" color="#848281" />
            <Text className="font-body text-[13px] text-text-secondary" maxFontSizeMultiplier={1.4}>
              Resolving account...
            </Text>
          </Animated.View>
        ) : resolveError ? (
          <Animated.View
            entering={FadeIn.duration(250)}
            className="mt-4 flex-row items-center gap-2 rounded-xl bg-[#FEF2F2] px-4 py-3">
            <HugeiconsIcon icon={AlertCircleIcon} size={18} color="#DC2626" />
            <Text
              className="flex-1 font-body text-[13px] text-[#DC2626]"
              maxFontSizeMultiplier={1.4}>
              {resolveError}
            </Text>
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
