import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StatusBar, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from '@/utils/platformHaptics';
import { playUISound } from '@/lib/uiSounds';
import { Cancel01Icon, Copy01Icon, CheckmarkCircle01Icon, AlertCircleIcon } from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Keypad } from '@/components/molecules/Keypad';
import { Button } from '@/components/ui';
import { AnimatedAmount } from '@/components/withdraw/method-screen/AnimatedAmount';
import { normalizeAmount } from '@/components/withdraw/method-screen/utils';
import { useRampQuote, useRampOnramp, useRampOrderStatus } from '@/api/hooks';
import { invalidateQueries } from '@/api/queryClient';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import type { RampOnrampOrder } from '@/api/types/ramp';
import { MIN_NGN_TRANSACTION_AMOUNT, MAX_NGN_DEPOSIT_AMOUNT } from '@/constants/transactionLimits';
import {
  DetailCard,
  DetailField,
  StatusBadge,
  AmountHero,
  SectionLabel,
  Hairline,
} from '@/components/withdraw/shared';

type Step = 'amount' | 'bank-details' | 'waiting';

const BRAND_RED = '#ff3e00';
const MAX_INTEGER_DIGITS = 9;

export default function FundNairaScreen() {
  const insets = useSafeAreaInsets();
  const { showSuccess, showError } = useFeedbackPopup();

  // ── State ─────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('amount');
  const [rawAmount, setRawAmount] = useState('0');
  const [order, setOrder] = useState<RampOnrampOrder | null>(null);

  const { data: quote } = useRampQuote('onramp');
  const onramp = useRampOnramp();

  const onRampRate = quote?.rate ?? 0;

  // ── Derived amounts ───────────────────────────────────────────────────────
  const numericAmount = useMemo(() => {
    const n = parseFloat(rawAmount);
    return isFinite(n) ? n : 0;
  }, [rawAmount]);

  const usdEquivalent = useMemo(() => {
    if (numericAmount <= 0 || onRampRate <= 0) return 0;
    return numericAmount / onRampRate;
  }, [numericAmount, onRampRate]);

  const displayAmount = useMemo(() => {
    const normalized = rawAmount || '0';
    const hasDecimal = normalized.includes('.');
    const [intRaw, dec = ''] = normalized.split('.');
    const intPart = intRaw.replace(/^0+(?=\d)/, '') || '0';
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return hasDecimal ? `${grouped}.${dec}` : grouped;
  }, [rawAmount]);

  const canContinue =
    numericAmount >= MIN_NGN_TRANSACTION_AMOUNT && numericAmount <= MAX_NGN_DEPOSIT_AMOUNT;

  // ── Keypad ────────────────────────────────────────────────────────────────
  const onKeyPress = useCallback((key: string) => {
    setRawAmount((cur) => {
      if (key === 'backspace') return cur === '0' ? cur : normalizeAmount(cur.slice(0, -1));
      if (key === 'decimal') return cur.includes('.') ? cur : `${cur}.`;
      if (!/^\d$/.test(key)) return cur;
      if (cur.includes('.')) {
        const [int, dec = ''] = cur.split('.');
        return dec.length >= 2 ? cur : `${int}.${dec}${key}`;
      }
      const next = (cur === '0' ? key : `${cur}${key}`).replace(/^0+(?=\d)/, '') || '0';
      return next.length > MAX_INTEGER_DIGITS ? cur : next;
    });
  }, []);

  // ── Create onramp order ───────────────────────────────────────────────────
  const handleContinue = useCallback(async () => {
    if (!canContinue || onramp.isPending) return;
    try {
      const result = await onramp.mutateAsync({ amount: numericAmount, currency: 'NGN' });
      setOrder(result);
      setStep('bank-details');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      showError('Failed to create deposit', err?.message || 'Please try again.');
    }
  }, [canContinue, numericAmount, onramp, showError]);

  // ── Proceed to waiting ────────────────────────────────────────────────────
  const handleTransferred = useCallback(() => {
    setStep('waiting');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // ── Keypad animation ─────────────────────────────────────────────────────
  const keypadY = useSharedValue(60);
  useEffect(() => {
    keypadY.value = withSpring(0, { damping: 18, stiffness: 120 });
  }, []);
  const keypadStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: keypadY.value }],
  }));

  // ── Render ────────────────────────────────────────────────────────────────
  if (step === 'bank-details' && order) {
    return (
      <BankDetailsStep
        order={order}
        onTransferred={handleTransferred}
        onClose={() => router.back()}
        insets={insets}
      />
    );
  }

  if (step === 'waiting' && order) {
    return (
      <WaitingStep
        transactionId={order.transactionId}
        order={order}
        onClose={() => router.back()}
        insets={insets}
        showSuccess={showSuccess}
      />
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1" style={{ backgroundColor: BRAND_RED }} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={BRAND_RED} />
        <View className="flex-1 px-5">
          {/* Header */}
          <Animated.View
            entering={FadeIn.duration(400)}
            className="flex-row items-center justify-between pb-2 pt-1">
            <Pressable
              className="size-11 items-center justify-center rounded-full bg-white/20"
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Close">
              <HugeiconsIcon icon={Cancel01Icon} size={20} color="#FFFFFF" />
            </Pressable>
            <Text className="font-subtitle text-[20px] text-white" maxFontSizeMultiplier={1.3}>
              Fund with Naira
            </Text>
            <View className="size-11" />
          </Animated.View>

          {/* Amount display */}
          <View className="flex-1 items-center justify-center px-2">
            <Text className="font-body text-[13px] text-white/80" maxFontSizeMultiplier={1.4}>
              Enter amount in Naira
            </Text>
            <View className="mt-2">
              <AnimatedAmount amount={displayAmount} prefix="₦" />
            </View>

            {/* Info pills */}
            <Animated.View
              entering={FadeInUp.delay(200).duration(400)}
              className="mt-6 flex-row items-center justify-center gap-2">
              {numericAmount > 0 && onRampRate > 0 && (
                <Animated.View
                  entering={FadeIn.springify()}
                  className="flex-row items-center rounded-full bg-white/20 px-3 py-2">
                  <Text className="font-body text-[13px] text-white/90" maxFontSizeMultiplier={1.4}>
                    ≈ ${usdEquivalent.toFixed(2)} USDC
                  </Text>
                </Animated.View>
              )}
              {onRampRate > 0 && (
                <View className="flex-row items-center rounded-full bg-white/20 px-3 py-2">
                  <Text className="font-body text-[13px] text-white/90" maxFontSizeMultiplier={1.4}>
                    ₦{onRampRate.toLocaleString()}/USD
                  </Text>
                </View>
              )}
            </Animated.View>
          </View>

          {/* CTA */}
          <Animated.View entering={SlideInUp.delay(80).duration(500)} className="pb-3 pt-1">
            <Button
              title={onramp.isPending ? 'Creating order...' : 'Continue'}
              onPress={handleContinue}
              disabled={!canContinue || onramp.isPending}
              loading={onramp.isPending}
              variant="white"
              className="bg-warm-canvas"
            />
            {numericAmount > 0 && numericAmount < MIN_NGN_TRANSACTION_AMOUNT && (
              <Text
                className="mt-2 text-center font-body text-[12px] text-white/70"
                maxFontSizeMultiplier={1.4}>
                Minimum deposit is ₦{MIN_NGN_TRANSACTION_AMOUNT.toLocaleString()}
              </Text>
            )}
          </Animated.View>

          {/* Keypad */}
          <Animated.View entering={SlideInUp.delay(100).duration(500)} style={keypadStyle}>
            <Keypad
              className="pb-2"
              onKeyPress={onKeyPress}
              backspaceIcon="delete"
              variant="dark"
              leftKey="decimal"
            />
          </Animated.View>
        </View>
        <View style={{ paddingBottom: Math.max(insets.bottom, 12) }} />
      </SafeAreaView>
    </ErrorBoundary>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Step 2: Bank Details — show virtual account to transfer to
// ═══════════════════════════════════════════════════════════════════════════

function BankDetailsStep({
  order,
  onTransferred,
  onClose,
  insets,
}: {
  order: RampOnrampOrder;
  onTransferred: () => void;
  onClose: () => void;
  insets: { bottom: number };
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopiedField(label);
    setTimeout(() => setCopiedField((cur) => (cur === label ? null : cur)), 2000);
  }, []);

  const usdValue = order.rate > 0 ? (order.fiatAmount / order.rate).toFixed(2) : '—';

  return (
    <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <View className="flex-1 px-6">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-row items-center justify-between pb-2 pt-1">
          <Pressable
            className="size-11 items-center justify-center rounded-full bg-surface"
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close">
            <HugeiconsIcon icon={Cancel01Icon} size={20} color="#343433" />
          </Pressable>
          <Text className="font-subtitle text-[17px] text-text-primary" maxFontSizeMultiplier={1.3}>
            Transfer Details
          </Text>
          <View className="size-11" />
        </Animated.View>

        {/* Amount hero */}
        <View className="mt-4 items-center py-6">
          <AmountHero
            amount={`₦${order.fiatAmount.toLocaleString()}`}
            subtitle={`≈ $${usdValue} USDC`}
            status="pending"
            description="Transfer exactly this amount"
          />
        </View>

        {/* Bank details card */}
        <View className="mt-6">
          <SectionLabel>Bank Account</SectionLabel>
          <DetailCard>
            <DetailField label="Bank" value={order.bank} />
            <Hairline />
            <DetailField label="Account Number" value={order.accountNumber} mono />
            <Hairline />
            <DetailField label="Account Name" value={order.accountName} />
          </DetailCard>
        </View>

        {/* Copy-all helper */}
        <View className="mt-4">
          <Pressable
            onPress={() =>
              copyToClipboard(
                `Bank: ${order.bank}\nAccount Number: ${order.accountNumber}\nAccount Name: ${order.accountName}`,
                'All details'
              )
            }
            className="flex-row items-center justify-center gap-2 rounded-full bg-stone-surface px-4 py-3 active:scale-[0.98]"
            accessibilityRole="button"
            accessibilityLabel="Copy all bank details">
            <HugeiconsIcon
              icon={copiedField === 'All details' ? CheckmarkCircle01Icon : Copy01Icon}
              size={16}
              color={copiedField === 'All details' ? '#00ca48' : '#848281'}
            />
            <Text
              className="font-subtitle text-[14px] text-text-secondary"
              maxFontSizeMultiplier={1.3}>
              {copiedField === 'All details' ? 'Copied' : 'Copy all details'}
            </Text>
          </Pressable>
        </View>

        {/* Instructions */}
        <View className="mt-6 px-2">
          <Text
            className="text-center font-body text-[13px] leading-5 text-text-secondary"
            maxFontSizeMultiplier={1.4}>
            Transfer the exact amount above to this account. Your deposit will be credited
            automatically once confirmed.
          </Text>
        </View>

        {/* CTA */}
        <View className="mt-auto pb-4">
          <Button title="I've sent the money" variant="black" onPress={onTransferred} />
        </View>
      </View>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Step 3: Waiting — timeline stepper that polls order status
// ═══════════════════════════════════════════════════════════════════════════

type TimelineStepStatus = 'done' | 'active' | 'failed' | 'pending';

const STEPS = [
  {
    key: 'payment',
    title: 'Payment received',
    failTitle: 'Payment not received',
    desc: (amt: string) => `We received your ₦${amt} bank transfer.`,
    failDesc: () => "We haven't received your transfer yet. Please check your bank app.",
  },
  {
    key: 'conversion',
    title: 'Converting to USDC',
    failTitle: 'Conversion failed',
    desc: (amt: string) => `Your Naira is being converted to USDC.`,
    failDesc: () => "We couldn't convert your deposit. Your funds are safe.",
  },
  {
    key: 'credited',
    title: 'Deposit credited',
    failTitle: 'Deposit not credited',
    desc: (amt: string) => `Your USDC has been added to your account.`,
    failDesc: () => 'Your deposit was not credited. Contact support if you sent the money.',
  },
] as const;

function deriveStepStatuses(orderStatus: string | undefined): TimelineStepStatus[] {
  switch (orderStatus) {
    case 'completed':
      return ['done', 'done', 'done'];
    case 'paid':
      return ['done', 'active', 'pending'];
    case 'processing':
      return ['done', 'done', 'active'];
    case 'failed':
      // Mark only the first non-completed step as failed so the user sees
      // exactly where in the pipeline things broke, not all steps as red.
      return ['failed', 'pending', 'pending'];
    default: // pending or undefined
      return ['active', 'pending', 'pending'];
  }
}

function WaitingStep({
  transactionId,
  order,
  onClose,
  insets,
  showSuccess,
}: {
  transactionId: string;
  order: RampOnrampOrder;
  onClose: () => void;
  insets: { bottom: number };
  showSuccess: (title: string, message?: string) => void;
}) {
  const { data: status } = useRampOrderStatus(transactionId);
  const isCompleted = status?.status === 'completed';
  const isFailed = status?.status === 'failed';
  const isTerminal = isCompleted || isFailed;

  const stepStatuses = useMemo(() => deriveStepStatuses(status?.status), [status?.status]);
  const fiatDisplay = order.fiatAmount.toLocaleString();

  // Shake animation for terminal states
  const shakeX = useSharedValue(0);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  useEffect(() => {
    if (isCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playUISound('transactionSuccess');
      invalidateQueries.station();
      invalidateQueries.wallet();
      invalidateQueries.funding();
      invalidateQueries.gameplay();
    }
    if (isFailed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Shake the card on failure
      shakeX.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
    if (isTerminal) {
      // Double haptic burst for emphasis
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 200);
    }
  }, [isCompleted, isFailed, isTerminal]);

  const handleDone = useCallback(() => {
    if (isCompleted) {
      showSuccess('Deposit successful', 'Your Naira deposit has been credited.');
    }
    router.replace('/(tabs)');
  }, [isCompleted, showSuccess]);

  const handleContactSupport = useCallback(() => {
    const subject = encodeURIComponent('Deposit Issue');
    const body = encodeURIComponent(
      `Hi, I had an issue with my Naira deposit.\n\nOrder ID: ${transactionId}\nAmount: ₦${fiatDisplay}\nStatus: ${status?.status ?? 'unknown'}\n\nPlease assist.`
    );
    Linking.openURL(`mailto:support@userail.money?subject=${subject}&body=${body}`);
  }, [transactionId, fiatDisplay, status?.status]);

  const statusMap = isCompleted ? 'completed' : isFailed ? 'failed' : 'pending';

  return (
    <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <View className="flex-1 px-6">
        {/* Header */}
        <View className="flex-row items-center justify-between pb-2 pt-1">
          <View className="size-11" />
          <Text className="font-subtitle text-[17px] text-text-primary" maxFontSizeMultiplier={1.3}>
            Deposit Status
          </Text>
          <View className="size-11" />
        </View>

        {/* Hero */}
        <View className="mt-4 items-center py-6">
          <AmountHero
            amount={`₦${fiatDisplay}`}
            status={statusMap}
            description={
              isCompleted
                ? 'Deposit converted and credited'
                : isFailed
                  ? 'Your deposit could not be processed'
                  : 'Your deposit is being processed'
            }
          />
        </View>

        {/* Timeline card */}
        <View style={cardStyle} className="mt-6">
          <SectionLabel>Progress</SectionLabel>
          <DetailCard className="py-5">
            {STEPS.map((step, i) => {
              const s = stepStatuses[i];
              const isLast = i === STEPS.length - 1;
              return (
                <TimelineRow
                  key={step.key}
                  status={s}
                  title={s === 'failed' ? step.failTitle : step.title}
                  description={s === 'failed' ? step.failDesc() : step.desc(fiatDisplay)}
                  isLast={isLast}
                  index={i}
                />
              );
            })}
          </DetailCard>
        </View>

        {/* Timing hint */}
        {!isTerminal && (
          <View className="mt-5 items-center">
            <View className="rounded-full bg-stone-surface px-4 py-2">
              <Text
                className="font-body text-[13px] text-text-secondary"
                maxFontSizeMultiplier={1.4}>
                Usually takes 1–5 minutes
              </Text>
            </View>
          </View>
        )}

        {/* CTAs */}
        <View className="mt-auto flex-row gap-3 pb-4">
          {isFailed ? (
            <>
              <View className="flex-1">
                <Button title="Dismiss" variant="white" onPress={() => router.replace('/(tabs)')} />
              </View>
              <View className="flex-1">
                <Button title="Contact support" variant="black" onPress={handleContactSupport} />
              </View>
            </>
          ) : (
            <View className="flex-1">
              <Button
                title={isCompleted ? 'Done' : 'Back to home'}
                variant="black"
                onPress={handleDone}
              />
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ── Timeline row with vertical connector line ───────────────────────────

function TimelineRow({
  status,
  title,
  description,
  isLast,
  index,
}: {
  status: TimelineStepStatus;
  title: string;
  description: string;
  isLast: boolean;
  index: number;
}) {
  const isFailed = status === 'failed';
  const isDone = status === 'done';
  const isActive = status === 'active';

  const iconColor = isFailed ? '#ff2b3a' : isDone ? '#00ca48' : '#c6c6c6';
  const titleColor = isFailed ? '#ff2b3a' : '#343433';
  const lineColor = isDone ? '#00ca48' : '#f2f2f2';

  return (
    <Animated.View
      entering={FadeInDown.delay(300 + index * 100).duration(350)}
      className="flex-row px-5">
      {/* Icon column with connector line */}
      <View className="mr-4 items-center" style={{ width: 24 }}>
        {isActive ? (
          <View className="size-6 items-center justify-center">
            <ActivityIndicator size="small" color={BRAND_RED} />
          </View>
        ) : isDone ? (
          <View className="size-6 items-center justify-center">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={22} color={iconColor} />
          </View>
        ) : isFailed ? (
          <View className="size-6 items-center justify-center">
            <HugeiconsIcon icon={AlertCircleIcon} size={22} color={iconColor} />
          </View>
        ) : (
          <View className="size-6 items-center justify-center">
            <View className="size-2 rounded-full bg-fog" />
          </View>
        )}
        {!isLast && (
          <View
            className="my-1 flex-1"
            style={{ width: 2, minHeight: 20, backgroundColor: lineColor, borderRadius: 1 }}
          />
        )}
      </View>

      {/* Content */}
      <View className={`flex-1 ${isLast ? '' : 'pb-5'}`}>
        <Text
          className="font-subtitle text-[15px]"
          style={{ color: titleColor }}
          maxFontSizeMultiplier={1.3}>
          {title}
        </Text>
        <Text
          className="mt-0.5 font-body text-[13px] leading-[18px] text-text-secondary"
          maxFontSizeMultiplier={1.4}>
          {description}
        </Text>
      </View>
    </Animated.View>
  );
}
