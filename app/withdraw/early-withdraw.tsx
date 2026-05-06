import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, Pressable, View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  FadeInUp,
  SlideInUp,
} from 'react-native-reanimated';
import { useStation } from '@/api/hooks';
import { useEmergencyPreview, useEmergencyStashToSpending } from '@/api/hooks/useFunding';
import { Keypad } from '@/components/molecules/Keypad';
import { Button } from '@/components/ui';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import {
  WithdrawalStatusScreen,
  type WithdrawalStatusType,
} from '@/components/withdraw/WithdrawalStatusScreen';
import { AnimatedAmount } from './method-screen/AnimatedAmount';
import { formatCurrency, toDisplayAmount, normalizeAmount, formatMaxAmount } from './method-screen/utils';
import { MAX_INTEGER_DIGITS } from './method-screen/constants';
import { Cancel01Icon } from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';

const BRAND_RED = '#ff3e00';
const gentleSpring = { damping: 20, stiffness: 150, mass: 1 };
const springConfig = { damping: 15, stiffness: 200, mass: 0.8 };

export default function EarlyWithdrawScreen() {
  const { showError } = useFeedbackPopup();
  const { data: station } = useStation();
  const { mutateAsync: executeWithdrawal, isPending: isSubmitting } = useEmergencyStashToSpending();

  const [rawAmount, setRawAmount] = useState('0');
  const [status, setStatus] = useState<WithdrawalStatusType | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const stashBalance = useMemo(() => {
    const parsed = parseFloat(station?.invest_balance ?? '');
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }, [station?.invest_balance]);

  const numericAmount = useMemo(() => {
    const n = parseFloat(rawAmount);
    return Number.isFinite(n) ? n : 0;
  }, [rawAmount]);

  // Debounced preview query — only fires when amount > 0
  const previewAmount = numericAmount > 0 ? numericAmount.toFixed(2) : '0';
  const { data: preview } = useEmergencyPreview(previewAmount, numericAmount > 0);

  const feeTier = preview?.fee_tier ?? null;
  const amountError = useMemo(() => {
    if (numericAmount <= 0) return null;
    if (numericAmount < 1) return 'Minimum $1.00';
    // Account for fee when checking balance
    const feeAmt = preview ? parseFloat(preview.fee_amount) : numericAmount * 0.03;
    if (numericAmount + feeAmt > stashBalance) return 'Exceeds stash balance (incl. fee)';
    return null;
  }, [numericAmount, stashBalance, preview]);

  const canContinue = numericAmount >= 1 && !amountError;

  // ── Keypad ──────────────────────────────────────────────────────────────

  const onAmountKeyPress = useCallback(
    (key: string) => {
      if (key === 'backspace') {
        setRawAmount((prev) => {
          if (prev.length <= 1) return '0';
          return normalizeAmount(prev.slice(0, -1));
        });
        return;
      }
      if (key === 'decimal') {
        setRawAmount((prev) => {
          if (prev.includes('.')) return prev;
          return prev + '.';
        });
        return;
      }
      setRawAmount((prev) => {
        const next = prev === '0' ? key : prev + key;
        // Limit decimal places to 2
        if (next.includes('.')) {
          const [, dec = ''] = next.split('.');
          if (dec.length > 2) return prev;
        }
        // Limit integer digits
        const [intPart] = next.split('.');
        if (intPart.replace(/^0+/, '').length > MAX_INTEGER_DIGITS) return prev;
        return normalizeAmount(next);
      });
    },
    []
  );

  const onMaxPress = useCallback(() => {
    if (stashBalance <= 0) return;
    // Reserve ~3% for fee so max doesn't exceed balance
    const feeRate = preview ? parseFloat(preview.fee_percent) : 0.03;
    const maxNet = stashBalance / (1 + feeRate);
    setRawAmount(formatMaxAmount(Math.floor(maxNet * 100) / 100));
  }, [stashBalance, preview]);

  // ── Submit ──────────────────────────────────────────────────────────────

  const onSend = useCallback(async () => {
    if (!canContinue || isSubmitting) return;
    try {
      await executeWithdrawal(numericAmount.toFixed(2));
      setStatus('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Withdrawal failed';
      setErrorMsg(msg);
      setStatus('failed');
      showError(msg);
    }
  }, [canContinue, isSubmitting, executeWithdrawal, numericAmount, showError]);

  // ── Animations ──────────────────────────────────────────────────────────

  const headerOpacity = useSharedValue(0);
  const keypadTranslateY = useSharedValue(60);
  const pillsScale = useSharedValue(0.8);
  const pillsOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
    keypadTranslateY.value = withSpring(0, { ...gentleSpring, damping: 18 });
  }, []);

  useEffect(() => {
    if (numericAmount > 0) {
      pillsScale.value = withSpring(1, springConfig);
      pillsOpacity.value = withTiming(1, { duration: 300 });
    } else {
      pillsScale.value = withSpring(0.9, gentleSpring);
      pillsOpacity.value = withTiming(0.7, { duration: 200 });
    }
  }, [numericAmount]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const keypadAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: keypadTranslateY.value }],
    opacity: interpolate(keypadTranslateY.value, [60, 0], [0, 1]),
  }));
  const pillsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pillsScale.value }],
    opacity: pillsOpacity.value,
  }));

  // ── Status screen ───────────────────────────────────────────────────────

  if (status) {
    return (
      <WithdrawalStatusScreen
        status={status}
        amount={`$${formatCurrency(numericAmount)}`}
        message={
          status === 'success'
            ? `$${preview?.net_amount ?? numericAmount.toFixed(2)} moved to your spending balance.`
            : errorMsg
        }
        onDone={() => router.replace('/(tabs)' as never)}
        onRetry={status === 'failed' ? () => { setStatus(null); setErrorMsg(''); } : undefined}
      />
    );
  }

  // ── Main screen ─────────────────────────────────────────────────────────

  const displayAmount = toDisplayAmount(rawAmount);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: BRAND_RED }} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_RED} />

      <View className="flex-1 px-5">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={headerAnimatedStyle}
          className="flex-row items-center justify-between pb-2 pt-1">
          <Pressable
            className="size-11 items-center justify-center rounded-full bg-white/20"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close">
            <HugeiconsIcon icon={Cancel01Icon} size={20} color="#FFFFFF" />
          </Pressable>
          <Text className="font-subtitle text-[20px] text-white">Early Withdraw</Text>
          <View className="size-11" />
        </Animated.View>

        {/* Amount display */}
        <View className="flex-1 items-center justify-center px-2">
          <Text className="font-body text-[13px] text-white/80">From Stash</Text>
          <View className="mt-2">
            <AnimatedAmount amount={displayAmount} prefix="$" />
          </View>

          {/* Pills row */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(400)}
            style={pillsAnimatedStyle}
            className="mt-6 flex-row items-center justify-center gap-2">
            <View className="flex-row items-center rounded-full bg-white/20 px-3 py-2">
              <Text className="font-body text-[13px] text-white/90">
                Stash: ${formatCurrency(stashBalance)}
              </Text>
            </View>
            {feeTier && numericAmount > 0 && (
              <Animated.View
                entering={FadeIn.springify()}
                className="flex-row items-center rounded-full bg-amber-400/90 px-3 py-2">
                <Text className="font-body text-[13px] font-semibold text-black">
                  {feeTier} fee
                </Text>
              </Animated.View>
            )}
            <Pressable
              onPress={onMaxPress}
              className="rounded-full bg-white px-4 py-2"
              accessibilityRole="button"
              accessibilityLabel="Set maximum amount">
              <Text className="font-subtitle text-[13px]" style={{ color: BRAND_RED }}>
                Max
              </Text>
            </Pressable>
          </Animated.View>
        </View>

        {/* Send button */}
        <Animated.View entering={SlideInUp.delay(100).duration(500)} className="px-0 pb-3 pt-1">
          <Button
            title={isSubmitting ? 'Processing...' : 'Send to Spending'}
            onPress={onSend}
            disabled={!canContinue || isSubmitting}
            loading={isSubmitting}
            variant="white"
            className="bg-warm-canvas"
          />
        </Animated.View>

        {/* Keypad */}
        <Animated.View entering={SlideInUp.delay(100).duration(500)} style={keypadAnimatedStyle}>
          <Keypad
            className="pb-2"
            onKeyPress={onAmountKeyPress}
            backspaceIcon="delete"
            variant="dark"
            leftKey="decimal"
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
