import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Button } from '@/components/ui';
import { usePajRates, usePajOfframp, usePajAddBankAccount } from '@/api/hooks/usePaj';
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

export default function NgnConfirmScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    amount: string;
    currency: string;
    bankId: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
  }>();

  const numericAmount = parseFloat(params.amount ?? '0') || 0;
  const { data: pajRates } = usePajRates();
  const pajOfframp = usePajOfframp();
  const pajAddBank = usePajAddBankAccount();

  // Rates & fees
  const offRampRate = pajRates?.offRampRate?.rate ?? 0;
  const railFeeBase = pajRates?.railFee ?? 50;
  const stampDuty = pajRates?.stampDuty ?? 50;
  const stampDutyAbove = pajRates?.stampDutyAbove ?? 10000;
  const railFeeNGN = numericAmount > stampDutyAbove ? railFeeBase + stampDuty : railFeeBase;
  const ngnUsdEquivalent = offRampRate > 0 ? numericAmount / offRampRate : 0;

  // State
  const [category, setCategory] = useState('Transfer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<WithdrawalStatusType | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [awaitingAuth, setAwaitingAuth] = useState(false);

  const executeOfframp = useCallback(async () => {
    if (!params.bankId || !params.accountNumber) return;
    setIsSubmitting(true);
    try {
      // Save bank for future use
      pajAddBank.mutate({ bankId: params.bankId, accountNumber: params.accountNumber });
      await pajOfframp.mutateAsync({
        bankId: params.bankId,
        accountNumber: params.accountNumber,
        amount: numericAmount,
      });
      setStatus('success');
    } catch (err: any) {
      if (err?.code === 'PAJ_VERIFICATION_REQUIRED') {
        router.push('/paj-verify' as never);
        return;
      }
      setErrorMsg(err?.message || 'Withdrawal failed. Please try again.');
      setStatus('failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [params.bankId, params.accountNumber, numericAmount, pajOfframp, pajAddBank]);

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
    return (
      <WithdrawalStatusScreen
        status={status}
        amount={`₦${formatCurrency(numericAmount)}`}
        recipient={params.accountName}
        message={status === 'failed' ? errorMsg : undefined}
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
            <DetailRow label="Rail fee" value={`₦${railFeeNGN.toLocaleString()}`} />
            <Sep />
            <View className="flex-row items-center justify-between px-5 py-4">
              <Text className="font-subtitle text-[14px] text-text-primary">Total</Text>
              <Text className="font-subtitle text-[16px] text-text-primary">
                ₦
                {offRampRate > 0
                  ? Math.round(numericAmount + railFeeNGN).toLocaleString()
                  : formatCurrency(numericAmount)}
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
