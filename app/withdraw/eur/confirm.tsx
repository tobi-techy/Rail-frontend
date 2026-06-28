import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Button } from '@/components/ui';
import { getCurrencyConfig } from '@/utils/currencyConfig';
import { formatCurrency } from '@/components/withdraw/method-screen/utils';
import { ReviewCard, DetailRow, Sep } from '@/components/withdraw/shared';
import { ArrowLeft01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import { useInitiateFiatWithdrawal } from '@/api/hooks/useFunding';
import { useAuthStore } from '@/stores/authStore';
import { SessionManager } from '@/utils/sessionManager';
import {
  WithdrawalStatusScreen,
  type WithdrawalStatusType,
} from '@/components/withdraw/WithdrawalStatusScreen';
import { parseApiError } from '@/utils/apiError';

export default function EurConfirmScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    amount: string;
    accountHolderName: string;
    iban: string;
    bic?: string;
    category?: string;
    narration?: string;
  }>();

  const numericAmount = parseFloat(params.amount ?? '0') || 0;
  const feeAmount = 1.0;
  const totalAmount = numericAmount + feeAmount;
  const cc = getCurrencyConfig('EUR');
  const CurrencyIcon = cc.Icon;
  const maskIban = (v: string) => (v.length > 8 ? `${v.slice(0, 4)}••••${v.slice(-4)}` : v);

  const { mutateAsync: initiateFiat } = useInitiateFiatWithdrawal();
  const [awaitingAuth, setAwaitingAuth] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<WithdrawalStatusType | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const executeWithdrawal = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await initiateFiat({
        amount: numericAmount,
        currency: 'EUR',
        account_holder_name: (params.accountHolderName ?? '').trim(),
        account_number: '',
        routing_number: '',
        iban: (params.iban ?? '').replace(/\s/g, '').toUpperCase(),
        ...(params.bic ? { bic: params.bic.replace(/\s/g, '').toUpperCase() } : {}),
        category: params.category?.trim(),
        narration: params.narration?.trim(),
      });
      setStatus('success');
    } catch (err) {
      setErrorMsg(parseApiError(err, 'Withdrawal failed. Please try again.'));
      setStatus('failed');
    } finally {
      setIsSubmitting(false);
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
    setAwaitingAuth(true);
    router.push({
      pathname: '/withdraw/authorize' as never,
      params: { amount: String(numericAmount), label: `€${formatCurrency(numericAmount)} EUR` },
    } as never);
  };

  if (status) {
    return (
      <WithdrawalStatusScreen
        status={status}
        amount={`€${formatCurrency(numericAmount)}`}
        recipient={params.accountHolderName}
        message={
          status === 'failed'
            ? errorMsg
            : "Usually arrives in 2–5 minutes. We'll notify you when it lands."
        }
        onDone={() => router.replace('/(tabs)' as never)}
        onRetry={
          status === 'failed'
            ? () => {
                setStatus(null);
                setErrorMsg('');
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

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}>
        <Animated.View entering={FadeInUp.duration(250)} className="items-center py-8">
          <View className="mb-3 size-14 items-center justify-center rounded-full bg-surface">
            <CurrencyIcon width={32} height={32} />
          </View>
          <Text className="font-subtitle text-[42px] leading-[46px] text-text-primary">
            €{formatCurrency(numericAmount)}
          </Text>
          <Text className="mt-1 font-body text-[14px] text-text-secondary">EUR</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(40).duration(250)}>
          <ReviewCard title="Bank Details">
            <DetailRow label="Account holder" value={params.accountHolderName ?? '—'} />
            <Sep />
            <DetailRow label="IBAN" value={maskIban(params.iban ?? '')} />
            {params.bic ? (
              <>
                <Sep />
                <DetailRow label="BIC" value={params.bic} />
              </>
            ) : null}
            <Sep />
            <DetailRow label="Currency" value="EUR" />
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
              <Text className="font-subtitle text-[14px] text-text-primary">Total</Text>
              <Text className="font-subtitle text-[16px] text-text-primary">
                €{formatCurrency(totalAmount)}
              </Text>
            </View>
          </ReviewCard>
        </Animated.View>

        <Text className="mt-2 font-body text-[12px] leading-[18px] text-text-secondary">
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
          <Button title="Confirm & Send" variant="orange" onPress={onConfirm} />
        </View>
      </View>
    </SafeAreaView>
  );
}
