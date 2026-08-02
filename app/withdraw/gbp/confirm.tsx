import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Button } from '@/components/ui';
import { getCurrencyConfig } from '@/utils/currencyConfig';
import { formatCurrency, formatSortCode } from '@/components/withdraw/method-screen/utils';
import { ArrowLeft01Icon, Wallet01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';
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

export default function GbpConfirmScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    amount: string;
    accountHolderName: string;
    accountNumber: string;
    sortCode: string;
    category?: string;
    narration?: string;
    sourceAccount?: string;
  }>();

  const numericAmount = parseFloat(params.amount ?? '0') || 0;
  const { data: feeData } = useWithdrawalFee({
    amount: numericAmount,
    type: 'fiat',
    currency: 'GBP',
  });
  const feeAmount = feeData?.fee ?? 1.0;
  const totalAmount = numericAmount + feeAmount;
  const cc = getCurrencyConfig('GBP');
  const CurrencyIcon = cc.Icon;

  const { mutateAsync: initiateFiat } = useInitiateFiatWithdrawal();
  const [awaitingAuth, setAwaitingAuth] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<WithdrawalStatusType | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const isExecutingRef = useRef(false);

  // Session key for persisting withdrawalId across remounts
  const sessionKey = `gbp-${numericAmount}-${params.accountNumber}`;
  const sessionStore = useWithdrawalSessionStore();
  const [withdrawalId, setWithdrawalId] = useState<string | null>(() =>
    sessionStore.get(sessionKey)
  );

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
      const idempotencyKey = `gbp-${numericAmount}-${acct}`;
      const response = await initiateFiat({
        amount: numericAmount,
        currency: 'GBP',
        account_holder_name: (params.accountHolderName ?? '').trim(),
        account_number: acct,
        routing_number: (params.sortCode ?? '').replace(/\D/g, ''),
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
          params: { amount: String(numericAmount), label: `£${formatCurrency(numericAmount)} GBP` },
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
      params: { amount: String(numericAmount), label: `£${formatCurrency(numericAmount)} GBP` },
    } as never);
  };

  if (status) {
    return (
      <WithdrawalStatusScreen
        status={status}
        amount={`£${formatCurrency(numericAmount)}`}
        recipient={params.accountHolderName}
        message={
          status === 'success'
            ? 'Your GBP transfer has been sent successfully.'
            : status === 'failed'
              ? errorMsg
              : "Your GBP transfer is being processed. We'll notify you when the funds arrive."
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
        <Animated.View entering={FadeInUp.duration(250)} className="items-center py-6">
          <View className="mb-3 size-14 items-center justify-center rounded-full bg-surface">
            <CurrencyIcon width={32} height={32} />
          </View>
          <AmountHero amount={`£${formatCurrency(numericAmount)}`} subtitle="GBP" />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(STAGGER_MS).duration(250)}>
          <SectionLabel>Destination</SectionLabel>
          <DetailCard>
            <SenderReceiver
              fromLabel="From"
              fromValue="Spend Wallet"
              fromIcon={<HugeiconsIcon icon={Wallet01Icon} size={16} color="#848281" />}
              toLabel="To"
              toValue={params.accountHolderName ?? '—'}
              toIcon={<CurrencyBadge code="GBP" />}
            />
            <Hairline />
            <DetailField label="Sort code" value={formatSortCode(params.sortCode ?? '')} />
            <Hairline />
            <DetailField
              label="Account"
              value={params.accountNumber ? `••••${params.accountNumber.slice(-4)}` : '—'}
              mono
            />
            <Hairline />
            <DetailField label="Currency" value="GBP" />
          </DetailCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(STAGGER_MS * 2).duration(250)} className="mt-6">
          <SectionLabel>Transaction</SectionLabel>
          <DetailCard>
            {params.category && params.category !== 'Transfer' && (
              <>
                <DetailField label="Category" value={params.category} />
                <Hairline />
              </>
            )}
            {params.narration && (
              <>
                <DetailField label="Note" value={params.narration} />
                <Hairline />
              </>
            )}
            <DetailField label="Network fee" value={`£${formatCurrency(feeAmount)}`} />
            <Hairline />
            <DetailField label="Total" value={`£${formatCurrency(totalAmount)}`} tone="primary" />
          </DetailCard>
        </Animated.View>

        <Text
          className="mt-4 font-body text-[12px] leading-[18px] text-text-secondary"
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
