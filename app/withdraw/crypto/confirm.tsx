import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Button } from '@/components/ui';
import { isEVMChain, getChainConfig } from '@/utils/chains';
import { ChainLogo } from '@/components/ChainLogo';
import { useUIStore } from '@/stores';
import { getCurrencyConfig } from '@/utils/currencyConfig';
import { formatCurrency } from '@/components/withdraw/method-screen/utils';
import { ReviewCard, DetailRow, Sep } from '@/components/withdraw/shared';
import { ArrowLeft01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import { useInitiateWithdrawal } from '@/api/hooks/useFunding';
import { useAuthStore } from '@/stores/authStore';
import { SessionManager } from '@/utils/sessionManager';
import {
  WithdrawalStatusScreen,
  type WithdrawalStatusType,
} from '@/components/withdraw/WithdrawalStatusScreen';
import { parseApiError } from '@/utils/apiError';
import { useWithdrawalEventStore } from '@/stores/withdrawalEventStore';

export default function CryptoConfirmScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    amount: string;
    destinationInput: string;
    destinationChain: string;
    currency: string;
  }>();

  const numericAmount = parseFloat(params.amount ?? '0') || 0;
  const feeAmount = numericAmount > 0 ? 0.1 : 0;
  const totalAmount = numericAmount + feeAmount;

  const storeCurrency = useUIStore((s) => s.currency);
  const cc = getCurrencyConfig(params.currency ?? storeCurrency);
  const CurrencyIcon = cc.Icon;
  const assetLabel = cc.code;
  const isStablecoin = cc.type === 'stablecoin';
  const prefix = isStablecoin ? '' : cc.symbol;

  const chainConfig = getChainConfig((params.destinationChain ?? 'SOL') as any);
  const maskAddr = (a: string) => (!a || a.length <= 12 ? a : `${a.slice(0, 6)}…${a.slice(-6)}`);

  const { mutateAsync: initiateWithdrawal } = useInitiateWithdrawal();
  const [awaitingAuth, setAwaitingAuth] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<WithdrawalStatusType | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [withdrawalId, setWithdrawalId] = useState<string | null>(null);

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
    setIsSubmitting(true);
    try {
      const response = await initiateWithdrawal({
        amount: numericAmount,
        destination_address: (params.destinationInput ?? '').trim(),
        destination_chain: params.destinationChain ?? 'SOL',
      });
      setWithdrawalId(response.withdrawal_id ?? null);
      setStatus('pending');
    } catch (err) {
      setErrorMsg(parseApiError(err, 'Withdrawal failed. Please try again.'));
      setStatus('failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [initiateWithdrawal, numericAmount, params]);

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
      params: {
        amount: String(numericAmount),
        label: `${prefix}${formatCurrency(numericAmount)} ${assetLabel}`,
      },
    } as never);
  };

  if (status) {
    return (
      <WithdrawalStatusScreen
        status={status}
        amount={`${prefix}${formatCurrency(numericAmount)} ${assetLabel}`}
        recipient={maskAddr(params.destinationInput ?? '')}
        message={
          status === 'failed'
            ? errorMsg
            : "Your withdrawal is being processed. We'll notify you once it's confirmed on-chain."
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
          Submitting withdrawal…
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
            {prefix}
            {formatCurrency(numericAmount)}
          </Text>
          <Text className="mt-1 font-body text-[14px] text-text-secondary">{assetLabel}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(40).duration(250)}>
          <ReviewCard title="Destination">
            <DetailRow label="Address" value={maskAddr(params.destinationInput ?? '')} />
            <Sep />
            <View className="flex-row items-center justify-between px-5 py-4">
              <Text className="font-body text-[14px] text-text-secondary">Network</Text>
              <View className="flex-row items-center gap-2">
                <View
                  className="size-5 items-center justify-center rounded-full"
                  style={{ backgroundColor: chainConfig.color + '14' }}>
                  <ChainLogo chain={params.destinationChain ?? 'SOL'} size={12} />
                </View>
                <Text className="font-subtitle text-[14px] text-text-primary">
                  {chainConfig.label}
                  {isEVMChain(chainConfig.chain) ? ' (EVM)' : ''}
                </Text>
              </View>
            </View>
            <Sep />
            <DetailRow label="Asset" value={assetLabel} />
            <Sep />
            <DetailRow label="Source" value="Spend Wallet" />
          </ReviewCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(80).duration(250)}>
          <ReviewCard title="Transaction">
            <DetailRow label="Network fee" value={`$${formatCurrency(feeAmount)}`} />
            <Sep />
            <View className="flex-row items-center justify-between px-5 py-4">
              <Text className="font-subtitle text-[14px] text-text-primary">Total</Text>
              <Text className="font-subtitle text-[16px] text-text-primary">
                {prefix}
                {formatCurrency(totalAmount)} {assetLabel}
              </Text>
            </View>
          </ReviewCard>
        </Animated.View>

        <Text className="mt-2 font-body text-[12px] leading-[18px] text-text-secondary">
          * Please verify the address and network. {assetLabel} withdrawals cannot be reversed.
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
