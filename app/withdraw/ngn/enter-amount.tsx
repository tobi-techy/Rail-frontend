import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInUp, SlideInUp } from 'react-native-reanimated';
import { useStation } from '@/api/hooks';
import { useRampQuote } from '@/api/hooks/useRamp';
import { usePajRates } from '@/api/hooks/usePaj';
import { Keypad } from '@/components/molecules/Keypad';
import { Button } from '@/components/ui';
import { Cancel01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import * as Haptics from '@/utils/platformHaptics';
import { AnimatedAmount } from '@/components/withdraw/method-screen/AnimatedAmount';
import { useAmountAnimations } from '@/components/withdraw/method-screen/useAmountAnimations';
import { useAmountNudge } from '@/components/withdraw/method-screen/useAmountNudge';
import {
  formatCurrency,
  toDisplayAmount,
  normalizeAmount,
  formatMaxAmount,
} from '@/components/withdraw/method-screen/utils';
import {
  FALLBACK_AVAILABLE_BALANCE,
  LIMITS,
  MAX_INTEGER_DIGITS,
} from '@/components/withdraw/method-screen/constants';
import { MIN_NGN_TRANSACTION_AMOUNT } from '@/constants/transactionLimits';

const BRAND_RED = '#FF2E01';

export default function NgnEnterAmountScreen() {
  const insets = useSafeAreaInsets();
  const { impact } = useHaptics();

  const params = useLocalSearchParams<{
    currency: string;
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
  }>();

  // ── Balance & rate ───────────────────────────────────────────────────────
  const { data: station } = useStation();
  const { data: rampQuote } = useRampQuote('offramp');
  const { data: pajRatesData } = usePajRates();

  const rampRate = rampQuote?.rate ?? 0;
  const ngnRate = rampRate > 0 ? rampRate : (pajRatesData?.offRampRate?.rate ?? 0);

  // Prefer Ramp quote fee (already in the executing provider's native fee);
  // fall back to Paj fee schedule when Ramp quote has no fee.
  const rampFeeUSD = rampQuote?.fee ?? 0;
  const railFeeBase = pajRatesData?.railFee ?? 50;
  const stampDuty = pajRatesData?.stampDuty ?? 50;
  const stampDutyAbove = pajRatesData?.stampDutyAbove ?? 10000;
  const minNGN = pajRatesData?.minWithdrawalNGN ?? MIN_NGN_TRANSACTION_AMOUNT;

  const usdBalance = useMemo(() => {
    const parsed = Number.parseFloat(station?.spend_balance ?? '');
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : FALLBACK_AVAILABLE_BALANCE;
  }, [station?.spend_balance]);

  const availableBalance = useMemo(
    () => (ngnRate > 0 ? usdBalance * ngnRate : usdBalance),
    [usdBalance, ngnRate]
  );

  // 2% slippage buffer capped at $50
  const spendableForMax = useMemo(() => {
    if (ngnRate <= 0) return availableBalance;
    const bufferUSD = Math.min(usdBalance * 0.02, 50);
    return Math.max(0, (usdBalance - bufferUSD) * ngnRate);
  }, [availableBalance, ngnRate, usdBalance]);

  const withdrawalLimit = LIMITS.fiat * ngnRate;
  const maxWithdrawable = Math.min(withdrawalLimit, spendableForMax);

  // ── Amount state ─────────────────────────────────────────────────────────
  const [rawAmount, setRawAmount] = useState('0');

  const numericAmount = useMemo(() => {
    const n = Number.parseFloat(rawAmount);
    return Number.isFinite(n) ? n : 0;
  }, [rawAmount]);

  const feeNGN = useMemo(() => {
    if (numericAmount <= 0) return 0;
    // Ramp quote fee is in USD — convert to NGN using the executing rate.
    if (rampFeeUSD > 0 && ngnRate > 0) return rampFeeUSD * ngnRate;
    // Paj fallback: flat rail fee + stamp duty above threshold.
    return numericAmount > stampDutyAbove ? railFeeBase + stampDuty : railFeeBase;
  }, [numericAmount, rampFeeUSD, ngnRate, railFeeBase, stampDuty, stampDutyAbove]);

  const feeAmount = useMemo(() => {
    if (feeNGN <= 0) return 0;
    return ngnRate > 0 ? feeNGN / ngnRate : 0.04;
  }, [feeNGN, ngnRate]);

  const amountError = useMemo(() => {
    if (numericAmount <= 0) return '';
    if (numericAmount < minNGN) return `Minimum withdrawal is ₦${formatCurrency(minNGN)}.`;
    if (numericAmount > maxWithdrawable) return 'This amount exceeds your available balance.';
    const totalWithFee = numericAmount + feeNGN;
    if (totalWithFee > availableBalance) return 'Insufficient balance.';
    return '';
  }, [numericAmount, minNGN, maxWithdrawable, feeNGN, availableBalance]);

  const canContinue = numericAmount > 0 && !amountError;
  const displayAmount = toDisplayAmount(rawAmount);

  // ── Animations ───────────────────────────────────────────────────────────
  const anim = useAmountAnimations(rawAmount);

  // ── Nudge ────────────────────────────────────────────────────────────────
  const nudgeData = useAmountNudge({
    numericAmount,
    amountError,
    availableBalance,
    maxWithdrawable,
    feeAmount,
    isFundFlow: false,
    isNGNAsset: true,
    limitLabel: 'Fiat withdrawal limit',
  });

  // ── Keypad handler ──────────────────────────────────────────────────────
  const rawAmountRef = useRef(rawAmount);
  rawAmountRef.current = rawAmount;

  const handleBlockedKeypress = useCallback(() => {
    impact(Haptics.ImpactFeedbackStyle.Light);
  }, [impact]);

  const onAmountKeyPress = useCallback(
    (key: string) => {
      const cur = rawAmountRef.current;

      if (key === 'decimal' && cur.includes('.')) {
        handleBlockedKeypress();
      } else if (/^\d$/.test(key)) {
        if (cur.includes('.')) {
          if ((cur.split('.')[1] ?? '').length >= 2) handleBlockedKeypress();
        } else {
          const next = (cur === '0' ? key : `${cur}${key}`).replace(/^0+(?=\d)/, '') || '0';
          if (next.length > MAX_INTEGER_DIGITS) handleBlockedKeypress();
          else if (maxWithdrawable > 0 && Number.parseFloat(next) > maxWithdrawable)
            handleBlockedKeypress();
        }
      }

      setRawAmount((current) => {
        if (key === 'backspace')
          return current === '0' ? current : normalizeAmount(current.slice(0, -1));
        if (key === 'decimal') return current.includes('.') ? current : `${current}.`;
        if (!/^\d$/.test(key)) return current;
        if (current.includes('.')) {
          const [int, dec = ''] = current.split('.');
          return dec.length >= 2 ? current : `${int}.${dec}${key}`;
        }
        const next = (current === '0' ? key : `${current}${key}`).replace(/^0+(?=\d)/, '') || '0';
        if (next.length > MAX_INTEGER_DIGITS) return current;
        if (maxWithdrawable > 0 && Number.parseFloat(next) > maxWithdrawable)
          return formatMaxAmount(maxWithdrawable);
        return next;
      });
    },
    [maxWithdrawable, handleBlockedKeypress]
  );

  const onMaxPress = useCallback(() => {
    impact(Haptics.ImpactFeedbackStyle.Medium);
    playUISound('buttonClick');
    // Subtract the NGN fee so the user doesn't exceed their balance
    const maxAfterFee = Math.max(0, maxWithdrawable - feeNGN);
    setRawAmount(formatMaxAmount(maxAfterFee));
  }, [maxWithdrawable, feeNGN, impact]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleContinue = useCallback(() => {
    if (!canContinue) return;
    impact(Haptics.ImpactFeedbackStyle.Medium);
    playUISound('buttonClick');
    router.push({
      pathname: '/withdraw/ngn/confirm' as never,
      params: {
        amount: numericAmount.toFixed(2),
        currency: params.currency ?? 'NGN',
        bankCode: params.bankCode,
        bankName: params.bankName,
        accountNumber: params.accountNumber,
        accountName: params.accountName,
      },
    } as never);
  }, [canContinue, numericAmount, params, impact]);

  // ── Balance label (formatted) ────────────────────────────────────────────
  const balanceDisplay = useMemo(() => formatCurrency(availableBalance), [availableBalance]);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: BRAND_RED }} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_RED} />
      <View className="flex-1 px-5">
        {/* Header */}
        <Animated.View
          entering={FadeInUp.duration(400)}
          style={anim.headerAnimatedStyle}
          className="flex-row items-center justify-between pb-2 pt-1">
          <Pressable
            className="size-11 items-center justify-center rounded-full bg-white/20"
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <HugeiconsIcon icon={Cancel01Icon} size={20} color="#FFFFFF" />
          </Pressable>
          <Text className="font-subtitle text-[20px] text-white" maxFontSizeMultiplier={1.3}>
            Withdraw
          </Text>
          <View className="size-11" />
        </Animated.View>

        {/* Amount display */}
        <View className="flex-1 items-center justify-center px-2">
          <View className="mt-2">
            <AnimatedAmount amount={displayAmount} prefix="₦" />
          </View>

          {/* Balance / Fee pills */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(400)}
            style={anim.pillsAnimatedStyle}
            className="mt-10 flex-row items-center justify-center gap-2">
            <View className="flex-row items-center rounded-full bg-white/20 px-3 py-2">
              <Text className="font-body text-[13px] text-white/90" maxFontSizeMultiplier={1.4}>
                Balance: ₦{balanceDisplay}
              </Text>
            </View>
            {numericAmount > 0 && (
              <Animated.View
                entering={FadeInUp.springify()}
                className="flex-row items-center rounded-full bg-white/90 px-3 py-2">
                <Text
                  className="font-body text-[13px]"
                  style={{ color: BRAND_RED }}
                  maxFontSizeMultiplier={1.4}>
                  Fee: ₦{formatCurrency(feeNGN)}
                </Text>
              </Animated.View>
            )}
            <Pressable
              onPress={onMaxPress}
              className="rounded-full bg-parchment-card px-4 py-2"
              accessibilityRole="button"
              accessibilityLabel="Set maximum withdrawal amount">
              <Text
                className="font-subtitle text-[13px]"
                style={{ color: BRAND_RED }}
                maxFontSizeMultiplier={1.4}>
                Max
              </Text>
            </Pressable>
          </Animated.View>
        </View>

        {/* Continue button + keypad */}
        <Animated.View entering={SlideInUp.delay(100).duration(500)} className="px-0 pb-3 pt-1">
          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={!canContinue}
            variant="white"
            className="bg-warm-canvas"
          />
        </Animated.View>

        <Animated.View
          entering={SlideInUp.delay(100).duration(500)}
          style={anim.keypadAnimatedStyle}>
          <Keypad className="pb-2" onKeyPress={onAmountKeyPress} variant="dark" leftKey="decimal" />
        </Animated.View>
      </View>

      <View style={{ paddingBottom: Math.max(insets.bottom, 12) }} />
    </SafeAreaView>
  );
}
