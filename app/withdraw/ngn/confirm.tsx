import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Button } from '@/components/ui';
import { useRampQuote, useRampOfframp, useRampOrderStatus } from '@/api/hooks/useRamp';
import { useAuthStore } from '@/stores/authStore';
import { SessionManager } from '@/utils/sessionManager';
import { NgnIcon } from '@/assets/svg';
import { ArrowLeft01Icon, Wallet01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import { formatCurrency } from '@/components/withdraw/method-screen/utils';
import { commitmentDeclineMessage, isCommitmentExceededError } from '@/utils/spendingCommitment';
import {
  WithdrawalStatusScreen,
  type WithdrawalStatusType,
} from '@/components/withdraw/WithdrawalStatusScreen';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import * as Haptics from '@/utils/platformHaptics';
import { isPasscodeSessionError } from '@/utils/apiError';
import {
  DetailCard,
  DetailField,
  AmountHero,
  SectionLabel,
  Hairline,
  SenderReceiver,
  CurrencyBadge,
  STAGGER_MS,
} from '@/components/withdraw/shared';

const mapRampStatus = (status?: string): WithdrawalStatusType => {
  if (status === 'completed') return 'success';
  if (status === 'failed') return 'failed';
  return 'pending';
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
  const rampQuoteQuery = useRampQuote('offramp', numericAmount);
  const rampQuote = rampQuoteQuery.data;
  const rampOfframp = useRampOfframp();
  const { impact } = useHaptics();

  const offRampRate = rampQuote?.rate ?? 0;
  const ngnUsdEquivalent = offRampRate > 0 ? numericAmount / offRampRate : 0;

  const [quoteAge, setQuoteAge] = useState(0);
  useEffect(() => {
    if (!rampQuoteQuery.dataUpdatedAt) return;
    const tick = () => setQuoteAge(Date.now() - rampQuoteQuery.dataUpdatedAt);
    tick();
    const id = setInterval(tick, 5_000);
    return () => clearInterval(id);
  }, [rampQuoteQuery.dataUpdatedAt]);
  const isQuoteStale = quoteAge > 30_000;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await rampQuoteQuery.refetch();
    setIsRefreshing(false);
  }, [rampQuoteQuery]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<WithdrawalStatusType | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [awaitingAuth, setAwaitingAuth] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const isExecutingRef = useRef(false);

  const orderStatus = useRampOrderStatus(transactionId ?? '', !!transactionId);

  useEffect(() => {
    const polled = orderStatus.data?.status;
    if (!polled) return;
    setStatus((prev) => (prev === 'success' || prev === 'failed' ? prev : mapRampStatus(polled)));
  }, [orderStatus.data?.status]);

  const executeOfframp = useCallback(async () => {
    if (!params.bankCode || !params.accountNumber) return;
    if (isExecutingRef.current) return;
    isExecutingRef.current = true;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await rampOfframp.mutateAsync({
        bankCode: params.bankCode,
        accountNumber: params.accountNumber,
        amount: numericAmount,
        bankName: params.bankName,
        expectedRate: offRampRate > 0 ? offRampRate : undefined,
      });
      setTransactionId(res.transactionId);
      setStatus('success');
    } catch (err: any) {
      if (isPasscodeSessionError(err)) {
        setAwaitingAuth(true);
        setIsSubmitting(false);
        isExecutingRef.current = false;
        router.push({
          pathname: '/withdraw/authorize' as never,
          params: {
            amount: String(numericAmount),
            label: `₦${numericAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
          },
        } as never);
        return;
      }
      setErrorMsg(
        isCommitmentExceededError(err)
          ? commitmentDeclineMessage(err)
          : err?.message || 'Withdrawal failed. Please try again.'
      );
      setStatus('failed');
    } finally {
      setIsSubmitting(false);
      isExecutingRef.current = false;
    }
  }, [params.bankCode, params.accountNumber, numericAmount, params.bankName, rampOfframp]);

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

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleConfirm = useCallback(() => {
    impact(Haptics.ImpactFeedbackStyle.Medium);
    playUISound('holdToSend');
    // SECURITY: Clear any existing passcode session (e.g. from login) so the
    // authorize screen must create a FRESH session before we can proceed.
    useAuthStore.getState().clearPasscodeSession();
    setAwaitingAuth(true);
    router.push({
      pathname: '/withdraw/authorize' as never,
      params: {
        amount: String(numericAmount),
        label: `₦${numericAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      },
    } as never);
  }, [numericAmount, impact]);

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
                setAwaitingAuth(false);
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
        <Text
          className="mt-4 font-subtitle text-[17px] text-text-primary"
          maxFontSizeMultiplier={1.3}>
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
          className="size-11 items-center justify-center rounded-full bg-surface active:scale-95"
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#343433" />
        </Pressable>
        <Text className="font-subtitle text-[17px] text-text-primary" maxFontSizeMultiplier={1.3}>
          Review
        </Text>
        <View className="size-11" />
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#EA580C" />
        }>
        {/* Amount hero */}
        <Animated.View entering={FadeInUp.duration(250)} className="items-center py-6">
          <View className="mb-3 size-14 items-center justify-center overflow-hidden rounded-full">
            <NgnIcon width={56} height={56} />
          </View>
          <AmountHero
            amount={`₦${formatCurrency(numericAmount)}`}
            subtitle={ngnUsdEquivalent > 0 ? `≈ $${ngnUsdEquivalent.toFixed(2)} USDC` : undefined}
          />
          {isQuoteStale && (
            <View className="mt-3 flex-row items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2">
              <Text className="font-body text-[12px] text-amber-700" maxFontSizeMultiplier={1.3}>
                ⚠ Rate may have changed. Pull down to refresh the rate.
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Destination */}
        <Animated.View entering={FadeInUp.delay(STAGGER_MS).duration(250)}>
          <SectionLabel>Destination</SectionLabel>
          <DetailCard>
            <SenderReceiver
              fromLabel="From"
              fromValue="Spend Wallet"
              fromIcon={<HugeiconsIcon icon={Wallet01Icon} size={16} color="#848281" />}
              toLabel="To"
              toValue={params.accountName ?? '—'}
              toIcon={<CurrencyBadge code="NGN" />}
            />
            <Hairline />
            <DetailField label="Bank" value={params.bankName ?? '—'} />
            <Hairline />
            <DetailField label="Account" value={params.accountNumber ?? '—'} mono />
            <Hairline />
            <DetailField label="Currency" value="NGN" />
          </DetailCard>
        </Animated.View>

        {/* Transaction */}
        <Animated.View entering={FadeInUp.delay(STAGGER_MS * 2).duration(250)} className="mt-6">
          <SectionLabel>Transaction</SectionLabel>
          <DetailCard>
            {offRampRate > 0 && (
              <>
                <DetailField label="Rate" value={`₦${offRampRate.toLocaleString()}/USD`} />
                <Hairline />
              </>
            )}
            <DetailField label="You send" value={`₦${formatCurrency(numericAmount)}`} />
            <Hairline />
            <DetailField
              label="Fee"
              value={rampQuote?.fee ? `₦${Number(rampQuote.fee).toLocaleString()}` : '—'}
            />
          </DetailCard>
        </Animated.View>

        <Text
          className="mt-4 font-body text-[12px] leading-[18px] text-text-secondary"
          maxFontSizeMultiplier={1.4}>
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
