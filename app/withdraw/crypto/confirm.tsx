import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import * as Haptics from '@/utils/platformHaptics';
import { useInitiateWithdrawal } from '@/api/hooks/useFunding';
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

export default function CryptoConfirmScreen() {
  const insets = useSafeAreaInsets();
  const { impact } = useHaptics();
  const params = useLocalSearchParams<{
    amount: string;
    destinationInput: string;
    destinationChain: string;
    currency: string;
    sourceAccount?: string;
  }>();

  const numericAmount = parseFloat(params.amount ?? '0') || 0;
  const { data: feeData } = useWithdrawalFee({
    amount: numericAmount,
    type: 'crypto',
    destChain: params.destinationChain,
  });
  const feeAmount = feeData?.fee ?? 0.1;
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
  const isExecutingRef = useRef(false);

  // Session key for persisting withdrawalId across remounts
  const sessionKey = `crypto-${numericAmount}-${params.destinationInput}-${params.destinationChain}`;
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

    // Client-side validation
    const addr = (params.destinationInput ?? '').trim();
    const chain = params.destinationChain ?? 'SOL';
    if (!chain) {
      setErrorMsg('Destination chain is required. Please go back and select a chain.');
      return;
    }
    if (!addr) {
      setErrorMsg('Destination address is required.');
      return;
    }
    if (addr.length < 32 || addr.length > 80) {
      setErrorMsg('Invalid destination address length.');
      return;
    }
    if (chain === 'SOL' && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr)) {
      setErrorMsg('Invalid Solana address format.');
      return;
    }
    if (chain !== 'SOL' && !/^0x[0-9a-fA-F]{40}$/.test(addr)) {
      setErrorMsg('Invalid EVM address format. Must start with 0x followed by 40 hex characters.');
      return;
    }

    isExecutingRef.current = true;
    setIsSubmitting(true);
    try {
      const idempotencyKey = `crypto-${numericAmount}-${addr.toLowerCase()}-${chain}`;
      const response = await initiateWithdrawal({
        amount: numericAmount,
        destination_address: addr,
        destination_chain: chain,
        source_account: params.sourceAccount as 'spending_balance' | 'stash_balance' | undefined,
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
          params: {
            amount: String(numericAmount),
            label: `${prefix}${formatCurrency(numericAmount)} ${assetLabel}`,
          },
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
  }, [initiateWithdrawal, numericAmount, params, prefix, assetLabel]);

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
            {prefix}
            {formatCurrency(numericAmount)}
          </Text>
          <Text
            className="mt-1 font-body text-[14px] text-text-secondary"
            maxFontSizeMultiplier={1.4}>
            {assetLabel}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(40).duration(250)}>
          <ReviewCard title="Destination">
            <DetailRow label="Address" value={maskAddr(params.destinationInput ?? '')} />
            <Sep />
            <View className="flex-row items-center justify-between px-5 py-4">
              <Text
                className="font-body text-[14px] text-text-secondary"
                maxFontSizeMultiplier={1.4}>
                Network
              </Text>
              <View className="flex-row items-center gap-2">
                <View
                  className="size-5 items-center justify-center rounded-full"
                  style={{ backgroundColor: chainConfig.color + '14' }}>
                  <ChainLogo chain={params.destinationChain ?? 'SOL'} size={12} />
                </View>
                <Text
                  className="font-subtitle text-[14px] text-text-primary"
                  maxFontSizeMultiplier={1.4}>
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
              <Text
                className="font-subtitle text-[14px] text-text-primary"
                maxFontSizeMultiplier={1.4}>
                Total
              </Text>
              <Text
                className="font-subtitle text-[16px] text-text-primary"
                maxFontSizeMultiplier={1.3}>
                {prefix}
                {formatCurrency(totalAmount)} {assetLabel}
              </Text>
            </View>
          </ReviewCard>
        </Animated.View>

        <Text
          className="mt-2 font-body text-[12px] leading-[18px] text-text-secondary"
          maxFontSizeMultiplier={1.4}>
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
