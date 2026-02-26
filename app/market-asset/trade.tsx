import React, { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useMarketInstrument, useStation } from '@/api/hooks';
import { Keypad } from '@/components/molecules/Keypad';
import { Button } from '@/components/ui';
import { getEffectivePrice } from '@/utils/market';

type OrderSide = 'buy' | 'sell';
type KeypadInput =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'decimal'
  | 'backspace'
  | 'fingerprint';

const QUICK_AMOUNTS = [5, 10, 50];
const MAX_INTEGER_DIGITS = 12;

const toAmount = (value?: string | number | null): number => {
  const parsed = Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const toDisplayAmount = (rawAmount: string): string => {
  const normalized = rawAmount || '0';
  const hasDecimal = normalized.includes('.');
  const [intPartRaw, decimalPart = ''] = normalized.split('.');
  const intPart = intPartRaw.replace(/^0+(?=\d)/, '') || '0';
  const groupedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return hasDecimal ? `${groupedInt}.${decimalPart}` : groupedInt;
};

const normalizeAmount = (nextValue: string): string => {
  if (!nextValue || nextValue === '.') return '0';

  if (nextValue.includes('.')) {
    const [intPartRaw, decimalPart = ''] = nextValue.split('.');
    const intPart = intPartRaw.replace(/^0+(?=\d)/, '') || '0';
    return `${intPart}.${decimalPart}`;
  }

  return nextValue.replace(/^0+(?=\d)/, '') || '0';
};

const formatUsd = (amount: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export default function MarketTradeAmountScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ symbol?: string; side?: string }>();

  const symbol = typeof params.symbol === 'string' ? params.symbol.toUpperCase() : '';
  const side: OrderSide = params.side === 'sell' ? 'sell' : 'buy';
  const [rawAmount, setRawAmount] = useState('0');

  const marketInstrumentQuery = useMarketInstrument(symbol || null);
  const { data: station } = useStation();

  const instrument = marketInstrumentQuery.data?.instrument;
  const unitPrice = instrument ? getEffectivePrice(instrument.quote) : 0;

  const availableBalance = useMemo(() => {
    const source = side === 'buy' ? station?.broker_cash : station?.invest_balance;
    return Math.max(0, toAmount(source));
  }, [side, station?.broker_cash, station?.invest_balance]);

  const numericAmount = useMemo(() => toAmount(rawAmount), [rawAmount]);

  const estimatedShares = useMemo(() => {
    if (unitPrice <= 0 || numericAmount <= 0) return 0;
    return numericAmount / unitPrice;
  }, [numericAmount, unitPrice]);

  const amountError = useMemo(() => {
    if (numericAmount <= 0) return '';
    if (availableBalance > 0 && numericAmount > availableBalance) {
      return side === 'buy'
        ? 'Entered amount is above your available buying power.'
        : 'Entered amount is above your available invested balance.';
    }
    return '';
  }, [availableBalance, numericAmount, side]);

  const canReview =
    numericAmount > 0 &&
    unitPrice > 0 &&
    (availableBalance <= 0 || numericAmount <= availableBalance);

  const onAmountKeyPress = useCallback((key: KeypadInput) => {
    setRawAmount((current) => {
      if (key === 'backspace') {
        if (current === '0') return current;
        return normalizeAmount(current.slice(0, -1));
      }

      if (key === 'decimal') {
        if (current.includes('.')) return current;
        return `${current}.`;
      }

      if (!/^\d$/.test(key)) {
        return current;
      }

      if (current.includes('.')) {
        const [intPart, decimalPart = ''] = current.split('.');
        if (decimalPart.length >= 2) return current;
        return `${intPart}.${decimalPart}${key}`;
      }

      const nextValue = current === '0' ? key : `${current}${key}`;
      const trimmed = nextValue.replace(/^0+(?=\d)/, '') || '0';
      if (trimmed.length > MAX_INTEGER_DIGITS) return current;
      return trimmed;
    });
  }, []);

  const onQuickAmount = (amount: number) => {
    setRawAmount(amount.toString());
  };

  const onBuyAll = () => {
    if (availableBalance > 0) {
      setRawAmount(availableBalance.toFixed(2));
    }
  };

  const onReviewOrder = () => {
    if (!canReview) return;
    router.push({
      pathname: '/authorize-transaction',
      params: {
        amount: numericAmount.toFixed(2),
        type: `${side}-order`,
        recipient: symbol,
      },
    } as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <View className="flex-row items-center px-5 py-2">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="mr-2 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/10">
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>
        <Text className="font-subtitle text-subtitle text-white">Order type: Market</Text>
      </View>

      <View className="flex-1 px-5">
        <View className="items-center pt-10">
          <Text
            className="font-headline text-balance-lg text-white"
            style={{ fontVariant: ['tabular-nums'] }}>
            ${toDisplayAmount(rawAmount)}
          </Text>

          <View className="mt-8 flex-row items-center">
            <View className="mr-2 h-9 w-9 items-center justify-center overflow-hidden rounded-[10px] border border-white/30 bg-white/10">
              {instrument?.logo_url ? (
                <Image
                  source={{ uri: instrument.logo_url }}
                  className="h-9 w-9"
                  resizeMode="cover"
                />
              ) : (
                <Text className="font-subtitle text-caption text-white">{symbol[0] || '?'}</Text>
              )}
            </View>
            <Text
              className="font-body text-body text-white/80"
              style={{ fontVariant: ['tabular-nums'] }}>
              {estimatedShares.toFixed(6)} {symbol || 'ASSET'}
            </Text>
          </View>

          <View className="mt-4 flex-row items-center">
            <Text className="font-caption text-caption text-white/70">
              You have {formatUsd(availableBalance)} available to {side}.
            </Text>
            {side === 'buy' ? (
              <TouchableOpacity
                onPress={onBuyAll}
                className="ml-1 min-h-[44px] justify-center"
                accessibilityRole="button"
                accessibilityLabel="Use full available balance">
                <Text className="font-subtitle text-caption text-white underline">Buy all</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {amountError ? (
            <Text className="mt-2 font-caption text-caption text-[#FF7D7D]">{amountError}</Text>
          ) : null}
        </View>

        <View className="mt-auto pb-2">
          <Keypad
            onKeyPress={(key) => onAmountKeyPress(key as KeypadInput)}
            leftKey="decimal"
            backspaceIcon="delete"
            variant="dark"
          />

          <View className="mt-3 flex-row items-center justify-between">
            {QUICK_AMOUNTS.map((amount) => (
              <TouchableOpacity
                key={amount}
                onPress={() => onQuickAmount(amount)}
                className="h-14 flex-1 items-center justify-center rounded-full border border-white/20 bg-white/5"
                style={{ marginHorizontal: 4 }}
                accessibilityRole="button"
                accessibilityLabel={`Set amount to $${amount}`}>
                <Text className="font-subtitle text-subtitle text-white">${amount}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            title={side === 'buy' ? 'Review buy' : 'Review sell'}
            variant="white"
            size="small"
            className="mt-4"
            disabled={!canReview}
            onPress={onReviewOrder}
          />
        </View>
      </View>

      <View style={{ height: Math.max(insets.bottom, 8) }} />
    </SafeAreaView>
  );
}
