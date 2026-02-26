import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell } from 'lucide-react-native';
import { LineGraph, type GraphPoint } from 'react-native-graph';
import { useMarketBars, useMarketInstrument } from '@/api/hooks';
import type { Currency } from '@/stores/uiStore';
import type { FxRates } from '@/utils/currency';
import { convertFromUsd, formatCurrencyAmount } from '@/utils/currency';
import type { MarketBar } from '@/api/types';
import { getEffectiveChange, getEffectiveChangePct, getEffectivePrice } from '@/utils/market';
import { Skeleton } from '@/components/atoms';
import { Button } from '@/components/ui';
import { useUIStore } from '@/stores';

type RangeKey = '1D' | '1W' | '1M' | '3M' | '1Y' | '5Y';

type RangeOption = {
  id: RangeKey;
  tabLabel: string;
  contextLabel: string;
  timeframe: string;
  days: number;
};

const RANGE_OPTIONS: RangeOption[] = [
  { id: '1D', tabLabel: '1D', contextLabel: 'Today', timeframe: '15Min', days: 2 },
  { id: '1W', tabLabel: '1W', contextLabel: 'Past Week', timeframe: '1Hour', days: 8 },
  { id: '1M', tabLabel: '1M', contextLabel: 'Past Month', timeframe: '1Day', days: 35 },
  { id: '3M', tabLabel: '3M', contextLabel: 'Past 3 Months', timeframe: '1Day', days: 100 },
  { id: '1Y', tabLabel: '1Y', contextLabel: 'Past Year', timeframe: '1Day', days: 380 },
  {
    id: '5Y',
    tabLabel: '5Y',
    contextLabel: 'Past 5 Years',
    timeframe: '1Week',
    days: 365 * 5 + 14,
  },
];

const toNumber = (value: string | number | null | undefined): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = Number.parseFloat(value ?? '');
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatDateParam = (value: Date): string => {
  const year = value.getUTCFullYear();
  const month = `${value.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${value.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatPrice = (amountUsd: number, currency: Currency, rates: FxRates): string => {
  const converted = convertFromUsd(amountUsd, currency, rates);
  const abs = Math.abs(converted);
  const precision = abs < 0.01 ? 4 : abs < 1 ? 3 : 2;

  return formatCurrencyAmount(converted, currency, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
};

const formatPercent = (value: number): string => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

const formatNumber = (value: string | number, maxFractionDigits = 2): string =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: maxFractionDigits,
  }).format(toNumber(value));

const formatVolume = (value: number): string =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

const formatAsOf = (timestamp?: string): string => {
  if (!timestamp) return 'Live';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Live';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const sessionLabel = (session?: string): string => {
  switch (session) {
    case 'pre':
      return 'Pre-market';
    case 'regular':
      return 'Regular';
    case 'post':
      return 'After-hours';
    default:
      return 'Closed';
  }
};

const buildChartPoints = (bars?: MarketBar[]): GraphPoint[] => {
  if (!bars || bars.length === 0) return [];

  return [...bars]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((bar) => ({
      date: new Date(bar.timestamp),
      value: toNumber(bar.close),
    }))
    .filter((point) => point.value > 0 && !Number.isNaN(point.date.getTime()));
};

function TimeRangeTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} timeframe`}
      className="mr-6 min-h-[44px] justify-end">
      <Text
        className={`font-subtitle text-subtitle ${active ? 'text-text-primary' : 'text-text-secondary'}`}>
        {label}
      </Text>
      <View
        className={`mt-1 h-[2px] w-full rounded-full ${active ? 'bg-black' : 'bg-transparent'}`}
      />
    </Pressable>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between border-b border-surface py-3">
      <Text className="font-caption text-caption text-text-secondary">{label}</Text>
      <Text className="font-body text-caption text-text-primary">{value}</Text>
    </View>
  );
}

function DetailHeaderSkeleton() {
  return (
    <View className="flex-row items-center">
      <Skeleton className="h-12 w-12 rounded-full" />
      <View className="ml-3 flex-1">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-4 w-20" />
      </View>
    </View>
  );
}

export default function MarketAssetDetailScreen() {
  const params = useLocalSearchParams<{ symbol?: string }>();
  const currency = useUIStore((s) => s.currency);
  const rates = useUIStore((s) => s.currencyRates);

  const symbol = useMemo(
    () => (typeof params.symbol === 'string' ? params.symbol.toUpperCase() : ''),
    [params.symbol]
  );
  const [selectedRange, setSelectedRange] = useState<RangeKey>('3M');

  const selectedOption = useMemo(
    () => RANGE_OPTIONS.find((item) => item.id === selectedRange) ?? RANGE_OPTIONS[3],
    [selectedRange]
  );

  const barsStart = useMemo(() => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - selectedOption.days);
    return formatDateParam(date);
  }, [selectedOption.days]);

  const barsEnd = useMemo(() => formatDateParam(new Date()), []);

  const instrumentQuery = useMarketInstrument(symbol || null);
  const instrument = instrumentQuery.data?.instrument;

  const barsQuery = useMarketBars(
    symbol || null,
    {
      timeframe: selectedOption.timeframe,
      start: barsStart,
      end: barsEnd,
    },
    { enabled: Boolean(symbol) && instrumentQuery.isSuccess }
  );

  const chartData = useMemo(() => buildChartPoints(barsQuery.data?.bars), [barsQuery.data?.bars]);

  const price = instrument ? getEffectivePrice(instrument.quote) : 0;
  const change = instrument ? getEffectiveChange(instrument.quote) : 0;
  const changePct = instrument ? getEffectiveChangePct(instrument.quote) : 0;
  const positive = change >= 0;
  const lineColor = positive ? '#E83E8C' : '#FF2E01';

  const isInitialLoading = instrumentQuery.isPending && !instrument;
  const hasInstrumentError = instrumentQuery.isError && !instrument;
  const isChartLoading = barsQuery.isPending && chartData.length < 2;
  const hasChartError = barsQuery.isError && chartData.length < 2;

  const onOpenTrade = (side: 'buy' | 'sell') => {
    if (!instrument) return;
    router.push({
      pathname: '/market-asset/trade',
      params: { symbol: instrument.symbol, side },
    } as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-background-main" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}>
        <View className="px-md pb-sm pt-sm">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              className="min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-surface">
              <ArrowLeft size={20} color="#111111" />
            </Pressable>

            <View className="mx-2 flex-1">
              {instrument ? (
                <View className="flex-row items-center">
                  <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-surface">
                    {instrument.logo_url ? (
                      <Image
                        source={{ uri: instrument.logo_url }}
                        className="h-12 w-12"
                        resizeMode="cover"
                      />
                    ) : (
                      <Text className="font-subtitle text-subtitle text-text-primary">
                        {instrument.symbol[0]}
                      </Text>
                    )}
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-subtitle text-body text-text-primary" numberOfLines={1}>
                      {instrument.name}
                    </Text>
                    <Text className="font-caption text-caption text-text-secondary">
                      {instrument.symbol}
                    </Text>
                  </View>
                </View>
              ) : (
                <DetailHeaderSkeleton />
              )}
            </View>

            <Pressable
              onPress={() => {
                void instrumentQuery.refetch();
                void barsQuery.refetch();
              }}
              accessibilityRole="button"
              accessibilityLabel="Market alerts"
              className="min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-surface">
              <Bell size={19} color="#111111" />
            </Pressable>
          </View>
        </View>

        {hasInstrumentError ? (
          <View className="mx-md mt-md rounded-lg border border-surface bg-surface/40 p-md">
            <Text className="font-subtitle text-subtitle text-text-primary">
              Unable to load this asset right now
            </Text>
            <Text className="mt-1 font-caption text-caption text-text-secondary">
              Check your connection and retry.
            </Text>
            <View className="mt-md">
              <Button title="Retry" size="small" onPress={() => instrumentQuery.refetch()} />
            </View>
          </View>
        ) : (
          <>
            <View className="px-md pt-md">
              {isInitialLoading ? (
                <>
                  <Skeleton className="h-14 w-48" />
                  <Skeleton className="mt-3 h-8 w-60" />
                  <Skeleton className="mt-2 h-5 w-52" />
                </>
              ) : instrument ? (
                <>
                  <Text
                    className="font-headline text-headline-1 text-text-primary"
                    style={{ fontVariant: ['tabular-nums'] }}>
                    {formatPrice(price, currency, rates)}
                  </Text>

                  <View className="mt-2 flex-row items-center">
                    <Text
                      className={`font-body text-body ${positive ? 'text-success' : 'text-destructive'}`}
                      style={{ fontVariant: ['tabular-nums'] }}>
                      {positive ? '+' : '-'}
                      {formatPrice(Math.abs(change), currency, rates)} ({formatPercent(changePct)})
                    </Text>
                    <Text className="ml-2 font-body text-body text-text-secondary">
                      {selectedOption.contextLabel}
                    </Text>
                  </View>

                  <Text className="mt-1 font-caption text-caption text-text-secondary">
                    {sessionLabel(instrument.market_session)} • Updated{' '}
                    {formatAsOf(instrument.quote.timestamp)}
                  </Text>
                </>
              ) : null}

              {instrument ? (
                <View className="mt-md flex-row">
                  <Button title="Buy" size="small" flex onPress={() => onOpenTrade('buy')} />
                  <View className="w-2" />
                  <Button
                    title="Sell"
                    variant="white"
                    size="small"
                    flex
                    onPress={() => onOpenTrade('sell')}
                  />
                </View>
              ) : (
                <View className="mt-md flex-row">
                  <Skeleton className="h-12 flex-1 rounded-full" />
                  <View className="w-2" />
                  <Skeleton className="h-12 flex-1 rounded-full" />
                </View>
              )}
            </View>

            <View className="mt-md">
              {isChartLoading ? (
                <View className="h-[260px] w-full justify-center px-md">
                  <Skeleton className="h-[220px] w-full rounded-xl" />
                </View>
              ) : chartData.length >= 2 ? (
                <LineGraph
                  points={chartData}
                  animated
                  color={lineColor}
                  lineThickness={3}
                  gradientFillColors={[`${lineColor}24`, `${lineColor}00`]}
                  horizontalPadding={0}
                  verticalPadding={20}
                  style={{ width: '100%', height: 260 }}
                />
              ) : hasChartError ? (
                <View className="mx-md h-[260px] items-center justify-center rounded-xl border border-surface bg-surface/30 px-md">
                  <Text className="text-center font-caption text-caption text-text-primary">
                    Market history is temporarily unavailable.
                  </Text>
                  <Pressable
                    onPress={() => barsQuery.refetch()}
                    accessibilityRole="button"
                    accessibilityLabel="Retry chart"
                    className="mt-3 min-h-[44px] min-w-[100px] items-center justify-center rounded-full bg-black px-4">
                    <Text className="font-subtitle text-caption text-white">Retry</Text>
                  </Pressable>
                </View>
              ) : (
                <View className="mx-md h-[260px] items-center justify-center rounded-xl border border-surface bg-surface/30 px-md">
                  <Text className="text-center font-caption text-caption text-text-secondary">
                    No market bars were returned for this symbol in the selected range.
                  </Text>
                </View>
              )}
            </View>

            <View className="px-md pt-sm">
              <View className="flex-row items-center">
                {RANGE_OPTIONS.map((option) => (
                  <TimeRangeTab
                    key={option.id}
                    label={option.tabLabel}
                    active={selectedRange === option.id}
                    onPress={() => setSelectedRange(option.id)}
                  />
                ))}
              </View>
            </View>

            {instrument ? (
              <>
                <View className="mt-lg px-md">
                  <Text className="font-subtitle text-subtitle text-text-primary">
                    About {instrument.name}
                  </Text>
                  <Text className="mt-2 font-body text-caption text-text-secondary">
                    {instrument.description}
                  </Text>
                </View>

                <View className="mt-lg px-md">
                  <Text className="font-subtitle text-subtitle text-text-primary">Statistics</Text>
                  <View className="mt-sm rounded-md border border-surface px-4">
                    <StatRow label="Opening price" value={formatNumber(instrument.quote.open)} />
                    <StatRow label="Today's maximum" value={formatNumber(instrument.quote.high)} />
                    <StatRow label="Today's minimum" value={formatNumber(instrument.quote.low)} />
                    <StatRow
                      label="Previous close"
                      value={formatNumber(instrument.quote.previous_close)}
                    />
                    <StatRow label="Volume" value={formatVolume(instrument.quote.volume)} />
                    <StatRow label="Asset type" value={instrument.instrument_type.toUpperCase()} />
                  </View>
                </View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
