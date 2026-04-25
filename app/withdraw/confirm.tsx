import React from 'react';
import { View, Text, Pressable, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Button } from '@/components/ui';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { isEVMChain, getChainConfig } from '@/utils/chains';
import { ChainLogo } from '@/components/ChainLogo';
import { useUIStore } from '@/stores';
import { getCurrencyConfig } from '@/utils/currencyConfig';
import { formatCurrency, formatSortCode } from './method-screen/utils';

export default function ConfirmScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    method: string; amount: string; isFiatMethod?: string; isCryptoMethod?: string;
    methodTitle?: string; destinationInput?: string; destinationChain?: string;
    fiatAccountHolderName?: string; fiatAccountNumber?: string;
    fiatCurrency?: string; fiatBic?: string;
    category?: string; narration?: string;
    availableBalance?: string; withdrawalLimit?: string;
    currency?: string;
  }>();

  const numericAmount = parseFloat(params.amount ?? '0') || 0;
  const feeAmount = numericAmount > 0 ? 0.5 : 0;
  const totalAmount = numericAmount + feeAmount;
  const isCryptoMethod = params.isCryptoMethod === 'true';
  const isFiatMethod = params.isFiatMethod === 'true';

  // Currency config
  const storeCurrency = useUIStore((s) => s.currency);
  const cc = getCurrencyConfig(params.currency ?? storeCurrency);
  const CurrencyIcon = cc.Icon;
  const assetLabel = cc.code;
  const isStablecoin = cc.type === 'stablecoin';
  const prefix = isStablecoin ? '' : cc.symbol;

  const chainConfig = getChainConfig((params.destinationChain ?? 'SOL') as any);

  const maskAddr = (a: string) => (!a || a.length <= 12 ? a : `${a.slice(0, 6)}…${a.slice(-6)}`);

  const onConfirm = () => {
    router.dismissTo({
      pathname: '/withdraw/[method]',
      params: { ...params, _confirm: '1' },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
        <Pressable
          className="size-11 items-center justify-center rounded-full bg-surface"
          onPress={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#111827" />
        </Pressable>
        <Text className="font-subtitle text-[17px] text-text-primary">Review</Text>
        <View className="size-11" />
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: 24 }}>

        {/* Amount hero */}
        <Animated.View entering={FadeInUp.duration(250)} className="items-center py-8">
          <View className="mb-3 size-14 items-center justify-center rounded-full bg-surface">
            <CurrencyIcon width={32} height={32} />
          </View>
          <Text className="font-subtitle text-[42px] leading-[46px] text-text-primary">
            {prefix}{formatCurrency(numericAmount)}
          </Text>
          <Text className="mt-1 font-body text-[14px] text-text-secondary">{assetLabel}</Text>
        </Animated.View>

        {/* Destination card */}
        <Animated.View entering={FadeInUp.delay(40).duration(250)} className="mb-3">
          <Text className="mb-2 ml-1 font-body text-[12px] uppercase tracking-wider text-text-secondary">
            {isFiatMethod ? 'Bank Details' : 'Destination'}
          </Text>
          <View className="overflow-hidden rounded-3xl bg-surface">
            {isCryptoMethod && (
              <>
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
                      {chainConfig.label}{isEVMChain(chainConfig.chain) ? ' (EVM)' : ''}
                    </Text>
                  </View>
                </View>
                <Sep />
                <DetailRow label="Asset" value={assetLabel} />
              </>
            )}
            {isFiatMethod && (
              <>
                <DetailRow label="Account holder" value={params.fiatAccountHolderName ?? '—'} />
                <Sep />
                {params.fiatCurrency === 'EUR' ? (
                  <>
                    <DetailRow label="IBAN" value={maskAddr(params.destinationInput ?? '') || '—'} />
                    {params.fiatBic ? (
                      <>
                        <Sep />
                        <DetailRow label="BIC" value={params.fiatBic} />
                      </>
                    ) : null}
                  </>
                ) : params.fiatCurrency === 'GBP' ? (
                  <>
                    <DetailRow label="Sort code" value={formatSortCode(params.destinationInput ?? '')} />
                    <Sep />
                    <DetailRow
                      label="Account"
                      value={params.fiatAccountNumber ? `••••${params.fiatAccountNumber.slice(-4)}` : '—'}
                    />
                  </>
                ) : (
                  <>
                    <DetailRow
                      label="Account"
                      value={params.fiatAccountNumber ? `••••${params.fiatAccountNumber.slice(-4)}` : '—'}
                    />
                    <Sep />
                    <DetailRow label="Routing" value={maskAddr(params.destinationInput ?? '') || '—'} />
                  </>
                )}
                <Sep />
                <DetailRow label="Currency" value={params.fiatCurrency ?? 'USD'} />
              </>
            )}
            <Sep />
            <DetailRow label="Source" value="Spend Wallet" />
          </View>
        </Animated.View>

        {/* Transaction card */}
        <Animated.View entering={FadeInUp.delay(80).duration(250)} className="mb-3">
          <Text className="mb-2 ml-1 font-body text-[12px] uppercase tracking-wider text-text-secondary">
            Transaction
          </Text>
          <View className="overflow-hidden rounded-3xl bg-surface">
            {params.category && params.category !== 'Transfer' && (
              <>
                <DetailRow label="Category" value={params.category} />
                <Sep />
              </>
            )}
            {!!params.narration && (
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
                {prefix}{formatCurrency(totalAmount)} {assetLabel}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Disclaimer */}
        <Animated.View entering={FadeInUp.delay(120).duration(250)} className="mt-2">
          <Text className="font-body text-[12px] leading-[18px] text-text-secondary">
            {isCryptoMethod
              ? `* Please verify the address and network. ${assetLabel} withdrawals cannot be reversed.`
              : '* Please verify bank details. Incorrect details may result in failed or delayed transfers.'}
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Sticky footer */}
      <View
        className="flex-row gap-3 border-t border-gray-100 bg-white px-5 pt-3"
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between px-5 py-4">
      <Text className="font-body text-[14px] text-text-secondary">{label}</Text>
      <Text
        className="ml-6 max-w-[60%] text-right font-subtitle text-[14px] text-text-primary"
        numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function Sep() {
  return <View className="mx-5 h-px bg-gray-100" />;
}
