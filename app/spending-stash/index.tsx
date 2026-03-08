import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, RefreshCw } from 'lucide-react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Canvas, RoundedRect, Group } from '@shopify/react-native-skia';
import { useSpendingStashData } from './useSpendingStashData';
import { Icon } from '@/components/atoms/Icon';
import { useHaptics } from '@/hooks/useHaptics';
import { useUIStore } from '@/stores';
import { CATEGORY_PALETTE } from './components';

const ACCENT = '#FF2E01';

// ── Shimmer ───────────────────────────────────────────────────────────────────

function Shimmer({ w, h, radius = 8 }: { w: number | string; h: number; radius?: number }) {
  const opacity = useSharedValue(0.3);
  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.7, { duration: 800 }), withTiming(0.3, { duration: 800 })),
      -1
    );
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[style, { width: w as number, height: h, borderRadius: radius }]}
      className="bg-gray-100"
    />
  );
}

// ── Period pill selector ──────────────────────────────────────────────────────

const PERIODS = ['1W', '1M', '6M', '1Y'] as const;
type Period = (typeof PERIODS)[number];

function PeriodSelector({
  selected,
  onSelect,
}: {
  selected: Period;
  onSelect: (p: Period) => void;
}) {
  return (
    <View className="flex-row gap-0.5 self-start rounded-[20px] bg-gray-50 p-1">
      {PERIODS.map((p) => {
        const active = p === selected;
        return (
          <Pressable
            key={p}
            onPress={() => onSelect(p)}
            className={`rounded-2xl px-[18px] py-2 ${active ? 'bg-gray-100' : 'bg-transparent'}`}
            accessibilityRole="button">
            <Text
              className={`text-sm ${active ? 'font-button text-black' : 'font-caption text-black/50'}`}>
              {p}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Stacked bar chart ─────────────────────────────────────────────────────────

type ChartBar = { month: string; card: number; p2p: number; withdrawals: number; total: number };

function MonthlyBarChart({ data }: { data: ChartBar[] }) {
  const { width: sw } = useWindowDimensions();
  const chartH = 340;
  const n = data.length || 1;
  const barW = 28;
  const totalBarsW = barW * n;
  const gap = n > 1 ? (sw - 64 - totalBarsW) / (n - 1) : 0;
  const maxVal = Math.max(...data.map((d) => d.total), 1);

  return (
    <View>
      <Canvas style={{ width: sw - 64, height: chartH }}>
        <Group>
          {data.map((bar, i) => {
            const x = i * (barW + gap);
            const r = barW / 2;
            const cardH = Math.max((bar.card / maxVal) * (chartH - 4), bar.card > 0 ? 4 : 0);
            const p2pH = Math.max((bar.p2p / maxVal) * (chartH - 4), bar.p2p > 0 ? 4 : 0);
            const wdH = Math.max(
              (bar.withdrawals / maxVal) * (chartH - 4),
              bar.withdrawals > 0 ? 4 : 0
            );

            const wdY = chartH - wdH;
            const p2pY = wdY - p2pH;
            const cardY = p2pY - cardH;

            if (bar.total === 0) {
              return (
                <RoundedRect
                  key={bar.month}
                  x={x}
                  y={chartH - 6}
                  width={barW}
                  height={6}
                  r={r}
                  color="#E5E7EB"
                />
              );
            }
            return (
              <Group key={bar.month}>
                {wdH > 0 && (
                  <RoundedRect x={x} y={wdY} width={barW} height={wdH} r={r} color="#118AB2" />
                )}
                {p2pH > 0 && (
                  <RoundedRect x={x} y={p2pY} width={barW} height={p2pH} r={r} color="#06D6A0" />
                )}
                {cardH > 0 && (
                  <RoundedRect x={x} y={cardY} width={barW} height={cardH} r={r} color={ACCENT} />
                )}
              </Group>
            );
          })}
        </Group>
      </Canvas>

      {/* Month labels */}
      <View className="mt-2.5 flex-row">
        {data.map((bar, i) => (
          <View
            key={bar.month}
            style={{ width: barW + (i < data.length - 1 ? gap : 0) }}
            className="items-center">
            <Text className="font-caption text-[11px] text-black/50">{bar.month.slice(0, 3)}</Text>
          </View>
        ))}
      </View>

      {/* Legend */}
      <View className="mt-3.5 flex-row gap-4">
        {[
          { color: ACCENT, label: 'Card' },
          { color: '#06D6A0', label: 'P2P' },
          { color: '#118AB2', label: 'Withdrawals' },
        ].map(({ color, label }) => (
          <View key={label} className="flex-row items-center gap-1.5">
            <View style={{ backgroundColor: color }} className="h-2 w-2 rounded-full" />
            <Text className="font-caption text-xs text-black/50">{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Category row ──────────────────────────────────────────────────────────────

function CategoryRow({
  title,
  amount,
  percentage,
  iconName,
  color,
  showSep,
}: {
  title: string;
  amount: number;
  percentage: number;
  iconName: string;
  color: string;
  showSep: boolean;
}) {
  return (
    <View>
      <View className="flex-row items-center px-4 py-4">
        <View className="mr-3.5 h-11 w-11 items-center justify-center rounded-full bg-gray-100">
          <Icon name={iconName} size={20} color={color} strokeWidth={1.5} />
        </View>
        <View className="flex-1">
          <Text className="font-button text-base text-black">{title}</Text>
          <Text className="mt-0.5 font-caption text-[13px] text-black/50">{percentage}%</Text>
        </View>
        <Text className="font-button text-base text-black">-${amount.toFixed(2)}</Text>
      </View>
      {showSep && <View className="ml-[74px] h-px bg-gray-100" />}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function SpendingScreen() {
  const insets = useSafeAreaInsets();
  const { impact, selection } = useHaptics();
  const isBalanceVisible = useUIStore((s) => s.isBalanceVisible);

  const {
    isLoading,
    availableBalance,
    thisMonthSpend,
    lastMonthSpend,
    dailyAvg,
    trend,
    trendPct,
    transactionCount,
    categories,
    monthlyChart,
    roundUps,
  } = useSpendingStashData();

  const [period, setPeriod] = React.useState<Period>('6M');
  const mask = (v: string) => (isBalanceVisible ? v : '••••');

  const trendLabel =
    trend === 'up'
      ? `↑ ${Math.abs(trendPct).toFixed(0)}%`
      : trend === 'down'
        ? `↓ ${Math.abs(trendPct).toFixed(0)}%`
        : '— stable';
  const trendTextColor = trend === 'up' ? '#FF453A' : trend === 'down' ? '#30D158' : '#8E8E93';

  const rangeLabel = useMemo(() => {
    if (!monthlyChart.length) return '';
    return `${monthlyChart[0].month.slice(0, 3)} – ${monthlyChart[monthlyChart.length - 1].month.slice(0, 3)}`;
  }, [monthlyChart]);

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 pb-1" style={{ paddingTop: insets.top + 8 }}>
        <Pressable
          onPress={() => {
            impact();
            router.back();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="mr-1 h-9 w-9 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <ChevronLeft size={24} color="#000000" strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 48 }}
        showsVerticalScrollIndicator={false}
        bounces>
        {/* ── Hero ── */}
        <View className="mb-7 mt-2">
          <Text className="font-caption text-[15px] text-black/50">Spent</Text>
          {isLoading ? (
            <View className="mt-2 gap-2.5">
              <Shimmer w={180} h={56} radius={12} />
              <Shimmer w={100} h={16} />
            </View>
          ) : (
            <Animated.View entering={FadeIn.duration(200)}>
              <Text
                className="mt-0.5 font-display text-black"
                style={{ fontSize: 56, letterSpacing: -2, lineHeight: 64 }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}>
                {mask(`$${thisMonthSpend.toFixed(2)}`)}
              </Text>
              <View className="mt-1.5 flex-row items-center gap-3">
                <Text className="font-caption text-sm text-black/50">{rangeLabel}</Text>
                {trend !== 'stable' && (
                  <Text className="font-button text-[13px]" style={{ color: trendTextColor }}>
                    {trendLabel}
                  </Text>
                )}
              </View>
            </Animated.View>
          )}
        </View>

        {/* ── Chart ── */}
        {isLoading ? (
          <View className="mb-7 h-[340px] flex-row items-end gap-2">
            {[80, 110, 50, 140, 70, 100].map((h, i) => (
              <Shimmer key={i} w={28} h={h} radius={14} />
            ))}
          </View>
        ) : (
          <Animated.View entering={FadeIn.duration(300)} className="mb-5">
            <MonthlyBarChart data={monthlyChart} />
          </Animated.View>
        )}

        {/* ── Period selector ── */}
        <View className="mb-8">
          <PeriodSelector
            selected={period}
            onSelect={(p) => {
              selection();
              setPeriod(p);
            }}
          />
        </View>

        {/* ── Stat row ── */}
        {!isLoading && (
          <View className="mb-8 flex-row gap-2.5">
            {[
              { label: 'Daily avg', value: mask(`$${dailyAvg.toFixed(2)}`) },
              { label: 'Last month', value: mask(`$${lastMonthSpend.toFixed(2)}`) },
              { label: 'Transactions', value: String(transactionCount) },
            ].map(({ label, value }) => (
              <View key={label} className="flex-1 rounded-2xl bg-gray-50 p-3.5">
                <Text className="font-caption text-[11px] text-black/50">{label}</Text>
                <Text className="mt-1.5 font-button text-[17px] text-black">{value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── By Category ── */}
        {(isLoading || categories.length > 0) && (
          <View className="mb-4">
            <View className="mb-3.5 flex-row items-center justify-between">
              <Text className="font-headline text-xl text-black">By Category</Text>
              <Text className="font-body text-sm text-[#0A84FF]">Manage</Text>
            </View>
            <View className="overflow-hidden rounded-[20px] bg-gray-50">
              {isLoading
                ? [0, 1, 2].map((i) => (
                    <View key={i} className="flex-row items-center gap-3.5 p-4">
                      <Shimmer w={44} h={44} radius={22} />
                      <View className="flex-1 gap-2">
                        <Shimmer w="55%" h={14} />
                        <Shimmer w="30%" h={11} />
                      </View>
                      <Shimmer w={60} h={14} />
                    </View>
                  ))
                : categories
                    .slice(0, 5)
                    .map((cat, i, arr) => (
                      <CategoryRow
                        key={cat.id}
                        title={cat.title}
                        amount={cat.amount}
                        percentage={cat.percentage}
                        iconName={cat.iconName}
                        color={CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]}
                        showSep={i < Math.min(arr.length, 5) - 1}
                      />
                    ))}
            </View>
          </View>
        )}

        {/* ── Round-ups ── */}
        {!isLoading && roundUps?.is_enabled && (
          <Animated.View entering={FadeIn.duration(300)}>
            <View className="flex-row items-center gap-3.5 rounded-[20px] bg-gray-50 p-4">
              <View
                className="h-11 w-11 items-center justify-center rounded-full"
                style={{ backgroundColor: `${ACCENT}22` }}>
                <RefreshCw size={20} color={ACCENT} strokeWidth={1.5} />
              </View>
              <View className="flex-1">
                <Text className="font-button text-base text-black">Round-ups</Text>
                <Text className="mt-0.5 font-caption text-[13px] text-black/50">
                  {roundUps.transaction_count} transactions
                </Text>
              </View>
              <Text className="font-button text-[17px] text-black">
                {mask(`$${parseFloat(roundUps.total_accumulated).toFixed(2)}`)}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── Available ── */}
        {!isLoading && (
          <View className="mt-7 items-center">
            <Text className="font-caption text-[13px] text-black/50">Available to spend</Text>
            <Text
              className="mt-1 font-headline text-2xl text-black"
              style={{ letterSpacing: -0.5 }}>
              {mask(`$${availableBalance.toFixed(2)}`)}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
