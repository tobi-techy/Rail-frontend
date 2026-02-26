import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import type { Currency } from '@/stores/uiStore';
import type { FxRates } from '@/utils/currency';
import { convertFromUsd, formatCurrencyAmount } from '@/utils/currency';
import type { MarketInstrumentCard } from '@/api/types';
import { getEffectiveChange, getEffectiveChangePct, getEffectivePrice } from '@/utils/market';

const formatPercent = (value: number): string => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

const formatPrice = (amountUsd: number, currency: Currency, rates: FxRates): string => {
  const converted = convertFromUsd(amountUsd, currency, rates);
  const abs = Math.abs(converted);
  const precision = abs < 0.01 ? 4 : abs < 1 ? 3 : 2;

  return formatCurrencyAmount(converted, currency, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
};

const formatSignedPrice = (amountUsd: number, currency: Currency, rates: FxRates): string => {
  const sign = amountUsd >= 0 ? '+' : '-';
  return `${sign}${formatPrice(Math.abs(amountUsd), currency, rates)}`;
};

export function MarketAssetRow({
  item,
  currency,
  rates,
  onPress,
}: {
  item: MarketInstrumentCard;
  currency: Currency;
  rates: FxRates;
  onPress?: (asset: MarketInstrumentCard) => void;
}) {
  const price = getEffectivePrice(item.quote);
  const change = getEffectiveChange(item.quote);
  const changePct = getEffectiveChangePct(item.quote);
  const positive = change >= 0;

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.name}`}
      className="flex-row items-center justify-between border-b border-surface px-md py-4">
      <View className="mr-3 h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-surface">
        {item.logo_url ? (
          <Image source={{ uri: item.logo_url }} className="h-12 w-12" resizeMode="cover" />
        ) : (
          <Text className="font-subtitle text-subtitle text-text-primary">{item.symbol[0]}</Text>
        )}
      </View>

      <View className="flex-1 pr-3">
        <Text className="font-subtitle text-body text-text-primary" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="mt-1 font-caption text-caption text-text-secondary" numberOfLines={1}>
          {item.symbol} • {item.exchange}
        </Text>
      </View>

      <View className="items-end">
        <Text className="font-subtitle text-body text-text-primary">
          {formatPrice(price, currency, rates)}
        </Text>
        <Text
          className={`mt-1 font-caption text-caption ${positive ? 'text-success' : 'text-destructive'}`}>
          {formatSignedPrice(change, currency, rates)} ({formatPercent(changePct)})
        </Text>
      </View>
    </Pressable>
  );
}
