import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Button } from '@/components/ui';
import { getCurrencyConfig } from '@/utils/currencyConfig';
import { formatCurrency } from '@/components/withdraw/method-screen/utils';
import { ReviewCard, DetailRow, Sep } from '@/components/withdraw/shared';
import { ArrowLeft01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import * as Haptics from '@/utils/platformHaptics';
import { useInitiateFiatWithdrawal } from '@/api/hooks/useFunding';
import { useWithdrawalFee } from '@/api/hooks/useWallet';
import { useAuthStore } from '@/stores/authStore';
import { SessionManager } from '@/utils/sessionManager';
import {
  WithdrawalStatusScreen,
  type WithdrawalStatusType,
} from '@/components/withdraw/WithdrawalStatusScreen';
import { parseApiError, isPasscodeSessionError } from '@/utils/apiError';
import { commitmentDeclineMessage, isCommitmentExceededError } from '@/utils/spendingCommitment';
import { useWithdrawalEventStore } from '@/stores/withdrawalEventStore';
import { useWithdrawalSessionStore } from '@/stores/withdrawalSessionStore';

export default function UsdConfirmScreen() {
  const insets = useSafeAreaInsets();
  const { impact } = useHaptics();
  const params = useLocalSearchParams<{
    amount: string;
    currency: string;
    accountHolderName: string;
    accountNumber: string;
    routingNumber: string;
    category?: string;
    narration?: string;
    sourceAccount?: string;
  }>();

  const numericAmount = parseFloat(params.amount ?? '0') || 0;
  const { data: feeData } = useWithdrawalFee({
    amount: numericAmount,
    type: 'fiat',
    currency: 'USD',
  });
  const feeAmount = feeData?.fee ?? 1.0;
  const totalAmount = numericAmount + feeAmount;
  const cc = getCurrencyConfig('USD');
  const CurrencyIcon = cc.Icon;

  const { mutateAsync: initiateFiat } = useInitiateFiatWithdrawal();
  const [awaitingAuth, setAwaitingAuth] = useState(false);

  // Session key for persisting withdrawalId across remounts
  const sessionKey = `usd-${numericAmount}-${params.accountNumber}`;
  const sessionStore = useWithdrawalSessionStore();
  const [withdrawalId, setWithdrawalId] = useState<string | null>(() =>
    sessionStore.get(sessionKey)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<WithdrawalStatusType | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const isExecutingRef = useRef(false);

  const lastEvent = useWithdrawalEventStore((s) => s.lastEvent);
  const consume = useWithdrawalEventStore((s) => s.consume);

  useEffect(() => {
    if (!withdrawalId || !lastEvent || lastEvent.withdrawalId !== withdrawalId) return;
    consume(withdrawalId);
    setStatus(lastEvent.status === 'completed' ? 'success' : 'failed');
    if (lastEvent.status === 'failed')
      setErrorMsg('Transfer failed. Please check your balance and try again.');
  }, [lastEvent, withdrawalId, consume]);

  const executeWithdrawal = useCallback(async () => {
    if (isExecutingRef.current) return;
    isExecutingRef.current = true;
    setIsSubmitting(true);
    try {
      const acct = (params.accountNumber ?? '').replace(/\D/g, '');
      const idempotencyKey = `usd-${numericAmount}-${acct}`;
      const response = await initiateFiat({
        amount: numericAmount,
        currency: 'USD',
        account_holder_name: (params.accountHolderName ?? '').trim(),
        account_number: acct,
        routing_number: (params.routingNumber ?? '').replace(/\D/g, ''),
        source_account: params.sourceAccount as 'spending_balance' | 'stash_balance' | undefined,
        category: params.category?.trim(),
        narration: params.narration?.trim(),
        idempotencyKey,
      });
      const id = response.withdrawal_id ?? null;
      setWithdrawalId(id);
      if (id) sessionStore.set(sessionKey, id);
      setStatus('pending');
    } catch (err) {
      if (isPasscodeSessionError(err)) {
        setAwaitingAuth(true);
        setIsSubmitting(false);
        isExecutingRef.current = false;
        router.push({
          pathname: '/withdraw/authorize' as never,
          params: { amount: String(numericAmount), label: `$${formatCurrency(numericAmount)} USD` },
        } as never);
        return;
      }
      setErrorMsg(
        isCommitmentExceededError(err)
          ? commitmentDeclineMessage(err)
          : parseApiError(err, 'Withdrawal failed. Please try again.')
      );
      setStatus('failed');
    } finally {
      setIsSubmitting(false);
      isExecutingRef.current = false;
    }
  }, [initiateFiat, numericAmount, params]);

  useFocusEffect(
    useCallback(() => {
      if (!awaitingAuth) return;
      const { passcodeSessionToken } = useAuthStore.getState();
      if (passcodeSessionToken && !SessionManager.isPasscodeSessionExpired()) {
        setAwaitingAuth(false);
        void executeWithdrawal();
      }
    }, [awaitingAuth, executeWithdrawal])
  );

  const onConfirm = () => {
    useAuthStore.getState().clearPasscodeSession();
    setAwaitingAuth(true);
    router.push({
      pathname: '/withdraw/authorize' as never,
      params: { amount: String(numericAmount), label: `$${formatCurrency(numericAmount)} USD` },
    } as never);
  };

  if (status) {
    return (
      <WithdrawalStatusScreen
        status={status}
        amount={`$${formatCurrency(numericAmount)}`}
        recipient={params.accountHolderName}
        message={
          status === 'success'
            ? 'Your USD transfer has been sent successfully.'
            : status === 'failed'
              ? errorMsg
              : "Your USD transfer is being processed. We'll notify you when the funds arrive."
        }
        onDone={() => {
          sessionStore.clear(sessionKey);
          router.replace('/(tabs)' as never);
        }}
        onRetry={
          status === 'failed'
            ? () => {
                setStatus(null);
                setErrorMsg('');
                setWithdrawalId(null);
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

  return (
    <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
        <Pressable
          className="size-11 items-center justify-center rounded-full bg-surface"
          onPress={() => {
            router.back();
          }}
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
        contentContainerStyle={{ paddingBottom: 24 }}>
        <Animated.View entering={FadeInUp.duration(250)} className="items-center py-8">
          <View className="mb-3 size-14 items-center justify-center rounded-full bg-surface">
            <CurrencyIcon width={32} height={32} />
          </View>
          <Text
            className="font-subtitle text-[42px] leading-[46px] text-text-primary"
            maxFontSizeMultiplier={1.3}>
            ${formatCurrency(numericAmount)}
          </Text>
          <Text
            className="mt-1 font-body text-[14px] text-text-secondary"
            maxFontSizeMultiplier={1.4}>
            USD
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(40).duration(250)}>
          <ReviewCard title="Bank Details">
            <DetailRow label="Account holder" value={params.accountHolderName ?? '—'} />
            <Sep />
            <DetailRow
              label="Account"
              value={params.accountNumber ? `••••${params.accountNumber.slice(-4)}` : '—'}
            />
            <Sep />
            <DetailRow label="Routing" value={params.routingNumber ?? '—'} />
            <Sep />
            <DetailRow label="Currency" value="USD" />
            <Sep />
            <DetailRow label="Source" value="Spend Wallet" />
          </ReviewCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(80).duration(250)}>
          <ReviewCard title="Transaction">
            {params.category && params.category !== 'Transfer' && (
              <>
                <DetailRow label="Category" value={params.category} />
                <Sep />
              </>
            )}
            {params.narration && (
              <>
                <DetailRow label="Note" value={params.narration} />
                <Sep />
              </>
            )}
            <DetailRow label="Network fee" value={`$${formatCurrency(feeAmount)}`} />
            <Sep />
            <View className="flex-row items-center justify-between px-5 py-4">
              <Text
                className="font-subtitle text-[14px] text-text-primary"
                maxFontSizeMultiplier={1.4}>
                Total
              </Text>
              <Text
                className="font-subtitle text-[16px] text-text-primary"
                maxFontSizeMultiplier={1.3}>
                ${formatCurrency(totalAmount)}
              </Text>
            </View>
          </ReviewCard>
        </Animated.View>

        <Text
          className="mt-2 font-body text-[12px] leading-[18px] text-text-secondary"
          maxFontSizeMultiplier={1.4}>
          * Please verify bank details. Incorrect details may result in failed or delayed transfers.
        </Text>
      </ScrollView>

      <View
        className="flex-row gap-3 border-t border-stone-surface bg-parchment-card px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <View className="flex-1">
          <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
        </View>
        <View className="flex-[2]">
          <Button
            title="Confirm & Send"
            variant="orange"
            onPress={onConfirm}
            disabled={awaitingAuth}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
