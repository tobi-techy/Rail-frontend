import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Button } from '@/components/ui';
import { useRampQuote, useRampOfframp, useRampOrderStatus } from '@/api/hooks/useRamp';
import { useAuthStore } from '@/stores/authStore';
import { SessionManager } from '@/utils/sessionManager';
import { NgnIcon } from '@/assets/svg';
import { ArrowLeft01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import { ReviewCard, DetailRow, Sep, CategoryPicker } from '@/components/withdraw/shared';
import { formatCurrency } from '@/components/withdraw/method-screen/utils';
import {
  WithdrawalStatusScreen,
  type WithdrawalStatusType,
} from '@/components/withdraw/WithdrawalStatusScreen';

/** Normalized RampHub status → what the status screen should show.
 *  Backend emits: pending | paid | processing | completed | failed. */
const mapRampStatus = (status?: string): WithdrawalStatusType => {
  if (status === 'completed') return 'success';
  if (status === 'failed') return 'failed';
  return 'pending'; // pending | paid | processing → still settling
};

const FAILED_FALLBACK =
  'This withdrawal could not be completed. Any debited funds have been returned to your balance.';

export default function NgnConfirmScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    amount: string;
    currency: string;
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
  }>();

  const numericAmount = parseFloat(params.amount ?? '0') || 0;
  const { data: rampQuote } = useRampQuote('offramp', numericAmount);
  const rampOfframp = useRampOfframp();

  // Rates & fees (railFee is the developer fee % applied by RampHub on the NGN payout)
  const offRampRate = rampQuote?.rate ?? 0;
  const ngnUsdEquivalent = offRampRate > 0 ? numericAmount / offRampRate : 0;

  // State
  const [category, setCategory] = useState('Transfer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<WithdrawalStatusType | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [awaitingAuth, setAwaitingAuth] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  // Poll the real settlement status once an order exists. The USDC is already
  // debited at creation; the NGN payout settles async, so we track it to
  // completion (or failure) instead of assuming success up front. Polling stops
  // on its own once the order reaches a terminal state.
  const orderStatus = useRampOrderStatus(transactionId ?? '', !!transactionId);

  useEffect(() => {
    const polled = orderStatus.data?.status;
    if (!polled) return;
    setStatus((prev) => (prev === 'success' || prev === 'failed' ? prev : mapRampStatus(polled)));
  }, [orderStatus.data?.status]);

  const executeOfframp = useCallback(async () => {
    if (!params.bankCode || !params.accountNumber) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await rampOfframp.mutateAsync({
        bankCode: params.bankCode,
        accountNumber: params.accountNumber,
        amount: numericAmount,
      });
      setTransactionId(res.transactionId);
      // Honest "Processing" — the poller advances this to success/failed as the
      // payout reconciles server-side.
      setStatus(mapRampStatus(res.status));
    } catch (err: any) {
      setErrorMsg(err?.message || 'Withdrawal failed. Please try again.');
      setStatus('failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [params.bankCode, params.accountNumber, numericAmount, rampOfframp]);

  // Auto-execute after returning from authorize with valid session
  useFocusEffect(
    useCallback(() => {
      if (!awaitingAuth) return;
      const { passcodeSessionToken } = useAuthStore.getState();
      if (passcodeSessionToken && !SessionManager.isPasscodeSessionExpired()) {
        setAwaitingAuth(false);
        void executeOfframp();
      }
    }, [awaitingAuth, executeOfframp])
  );

  const handleConfirm = () => {
    setAwaitingAuth(true);
    router.push({
      pathname: '/withdraw/authorize' as never,
      params: {
        amount: String(numericAmount),
        label: `₦${numericAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      },
    } as never);
  };

  // ── Status screens ─────────────────────────────────────────────────────
  if (status) {
    const message =
      status === 'failed'
        ? errorMsg || FAILED_FALLBACK
        : status === 'pending'
          ? "Your withdrawal is on its way. We'll notify you the moment it lands — you can safely leave this screen."
          : undefined;

    return (
      <WithdrawalStatusScreen
        status={status}
        title={status === 'pending' ? 'Processing withdrawal' : undefined}
        amount={`₦${formatCurrency(numericAmount)}`}
        recipient={params.accountName}
        message={message}
        onDone={() => router.replace('/(tabs)' as never)}
        onRetry={
          status === 'failed'
            ? () => {
                setStatus(null);
                setErrorMsg('');
                setTransactionId(null);
              }
            : undefined
        }
      />
    );
  }

  if (isSubmitting) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-warm-canvas"
        edges={['top', 'bottom']}>
        <ActivityIndicator size="small" color="#EA580C" />
        <Text className="mt-4 font-subtitle text-[17px] text-text-primary">
          Processing withdrawal…
        </Text>
      </SafeAreaView>
    );
  }

  // ── Confirm review ─────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
        <Pressable
          className="size-11 items-center justify-center rounded-full bg-surface"
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#343433" />
        </Pressable>
        <Text className="font-subtitle text-[17px] text-text-primary">Review</Text>
        <View className="size-11" />
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Amount hero */}
        <Animated.View entering={FadeInUp.duration(250)} className="items-center py-8">
          <View className="mb-3 size-14 items-center justify-center overflow-hidden rounded-full">
            <NgnIcon width={56} height={56} />
          </View>
          <Text
            className="font-mono-semibold text-[42px] leading-[46px] text-text-primary"
            style={{ letterSpacing: -1 }}>
            ₦{formatCurrency(numericAmount)}
          </Text>
          {ngnUsdEquivalent > 0 && (
            <Text className="mt-1 font-body text-[14px] text-text-secondary">
              ≈ ${ngnUsdEquivalent.toFixed(2)} USDC
            </Text>
          )}
        </Animated.View>

        {/* Destination */}
        <Animated.View entering={FadeInUp.delay(40).duration(250)}>
          <ReviewCard title="Destination">
            <DetailRow label="Recipient" value={params.accountName ?? '—'} />
            <Sep />
            <DetailRow label="Bank" value={params.bankName ?? '—'} />
            <Sep />
            <DetailRow label="Account" value={params.accountNumber ?? '—'} />
            <Sep />
            <DetailRow label="Source" value="Spend Wallet" />
          </ReviewCard>
        </Animated.View>

        {/* Transaction */}
        <Animated.View entering={FadeInUp.delay(80).duration(250)}>
          <ReviewCard title="Transaction">
            {offRampRate > 0 && (
              <>
                <DetailRow label="Rate" value={`₦${offRampRate.toLocaleString()}/USD`} />
                <Sep />
              </>
            )}
            <View className="flex-row items-center justify-between px-5 py-4">
              <Text className="font-subtitle text-[14px] text-text-primary">You send</Text>
              <Text className="font-subtitle text-[16px] text-text-primary">
                ₦{formatCurrency(numericAmount)}
              </Text>
            </View>
          </ReviewCard>
        </Animated.View>

        {/* Category */}
        <Animated.View entering={FadeInUp.delay(120).duration(250)} className="mt-2">
          <CategoryPicker value={category} onChange={setCategory} />
        </Animated.View>

        <Text className="mt-4 font-body text-[12px] leading-[18px] text-text-secondary">
          * Please verify bank details. Incorrect details may result in failed or delayed transfers.
        </Text>
      </ScrollView>

      {/* Footer */}
      <View
        className="flex-row gap-3 border-t border-stone-surface bg-parchment-card px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <View className="flex-1">
          <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
        </View>
        <View className="flex-[2]">
          <Button title="Confirm & Send" variant="orange" onPress={handleConfirm} />
        </View>
      </View>
    </SafeAreaView>
  );
}
