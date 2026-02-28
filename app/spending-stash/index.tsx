import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowDownLeft,
  ArrowUpLeft,
  ChartBar,
  ChartLine,
  ChartPie,
  Check,
  ChevronLeft,
  CreditCard,
} from 'lucide-react-native';
import { BottomSheet } from '@/components/sheets';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import { useSpendingStashData } from './useSpendingStashData';
import { StashCard } from '@/components/molecules';
import { useHaptics } from '@/hooks/useHaptics';
import { useUIStore } from '@/stores';
import {
  C,
  CATEGORY_PALETTE,
  splitAmt,
  PeriodSelector,
  StatCard,
  SectionHeader,
  CategoryRow,
  TxRow,
  EmptyPeriod,
  type Period,
} from './components';
import { Button } from '@/components/ui';

const LABEL_STYLE = { fontSize: 11, color: '#8E8E93' } as const;

const VIEW_MODES = ['bar', 'line', 'donut'] as const;
type ViewMode = (typeof VIEW_MODES)[number];

const VIEW_OPTIONS: {
  id: ViewMode;
  label: string;
  IconComp: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
}[] = [
  { id: 'bar', label: 'Bar chart', IconComp: ChartBar },
  { id: 'line', label: 'Line chart', IconComp: ChartLine },
  { id: 'donut', label: 'Donut chart', IconComp: ChartPie },
];

export default function SpendingScreen() {
  const insets = useSafeAreaInsets();
  const { impact, selection } = useHaptics();
  const isBalanceVisible = useUIStore((s) => s.isBalanceVisible);
  const { width: sw } = useWindowDimensions();
  const chartW = sw - 32;

  const {
    isLoading,
    availableBalance,
    thisMonthSpend,
    totalSpent,
    dailyAvg,
    trendPct,
    TrendIcon,
    trendColor,
    transactionCount,
    monthlyUsedPct,
    chartData,
    periodRangeLabel,
    categories,
    transactions,
    cardBadge,
    cardSubtitle,
  } = useSpendingStashData();

  const [viewMode, setViewMode] = useState<ViewMode>('bar');
  const [period, setPeriod] = useState<Period>('6M');
  const [selectedBarIdx, setSelectedBarIdx] = useState(chartData.length - 1);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);

  const handlePeriod = useCallback(
    (p: Period) => {
      selection();
      setPeriod(p);
      setSelectedBarIdx(chartData.length - 1);
    },
    [selection, chartData.length]
  );
  const handleViewMode = useCallback(
    (m: ViewMode) => {
      selection();
      setViewMode(m);
    },
    [selection]
  );

  const hasSpend = totalSpent > 0;
  const spentDisplay = isBalanceVisible ? `$${totalSpent.toFixed(2)}` : '****';

  const barData = useMemo(
    () =>
      chartData.map((d, i) => ({
        value: d.value,
        label: d.label,
        frontColor: i === selectedBarIdx ? '#000000' : d.value > 0 ? '#D1D1D6' : '#EBEBEB',
        topLabelComponent:
          i === selectedBarIdx && d.value > 0
            ? () => (
                <Text style={{ fontSize: 11, color: '#000', marginBottom: 2 }}>
                  ${Math.round(d.value)}
                </Text>
              )
            : undefined,
      })),
    [chartData, selectedBarIdx]
  );

  const lineData = useMemo(
    () => chartData.map((d) => ({ value: d.value, label: d.label })),
    [chartData]
  );

  const pieData = useMemo(() => {
    const segs = categories.slice(0, 5);
    return segs.length > 0
      ? segs.map((cat, i) => ({
          value: Math.abs(cat.amount),
          color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
        }))
      : [{ value: 1, color: C.accent }];
  }, [categories]);

  const availSplit = splitAmt(availableBalance);
  const spentSplit = splitAmt(thisMonthSpend);

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 pb-2" style={{ paddingTop: insets.top + 8 }}>
        <Pressable
          onPress={() => {
            impact();
            router.back();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="h-11 w-11 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <ChevronLeft size={24} color={C.text} strokeWidth={2} />
        </Pressable>
        <Text className="font-headline text-headline-1 text-text-primary">Spending</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        bounces>
        {/* Hero */}
        <View className="px-4 pb-2 pt-4">
          <Text className="font-caption text-caption text-[#8E8E93]">Total Spent</Text>
          <Text
            className="mt-0.5 font-headline text-[52px] leading-[60px] text-text-primary"
            style={{ letterSpacing: -1.5 }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}>
            {spentDisplay}
          </Text>
          <View className="mt-1 flex-row items-center gap-2">
            <Text className="font-caption text-caption text-[#8E8E93]">{periodRangeLabel}</Text>
            {hasSpend && (
              <View
                className="flex-row items-center gap-1 rounded-full px-2 py-[3px]"
                style={{ backgroundColor: `${trendColor}18` }}>
                <TrendIcon size={11} color={trendColor} strokeWidth={2.5} />
                <Text className="font-button text-[11px]" style={{ color: trendColor }}>
                  {Math.abs(trendPct).toFixed(0)}%
                </Text>
              </View>
            )}
          </View>
        </View>

        <View className="mb-2 ml-4 flex-row gap-3">
          <Button
            title="Fund"
            leftIcon={<ArrowDownLeft size={20} color="white" />}
            size="small"
            variant="black"
          />
          <Button
            title="Send"
            leftIcon={<ArrowUpLeft size={20} color="#000" />}
            size="small"
            variant="white"
          />
        </View>

        {/* Chart */}
        {!hasSpend ? (
          <EmptyPeriod />
        ) : viewMode === 'bar' ? (
          <Animated.View entering={FadeIn.duration(200)} className="px-4">
            <BarChart
              data={barData}
              width={chartW}
              height={130}
              barBorderRadius={6}
              spacing={6}
              frontColor="#D1D1D6"
              hideRules
              yAxisThickness={0}
              xAxisThickness={0}
              hideYAxisText
              yAxisLabelWidth={0}
              isAnimated
              animationDuration={400}
              onPress={(_item: unknown, index: number) => {
                selection();
                setSelectedBarIdx(index);
              }}
              xAxisLabelTextStyle={LABEL_STYLE}
            />
          </Animated.View>
        ) : viewMode === 'line' ? (
          <Animated.View entering={FadeIn.duration(200)} className="px-4">
            <LineChart
              data={lineData}
              width={chartW}
              height={130}
              thickness={1.5}
              color="#000000"
              startFillColor="rgba(0,0,0,0.07)"
              endFillColor="rgba(0,0,0,0)"
              areaChart
              hideDataPoints
              hideRules
              yAxisThickness={0}
              xAxisThickness={0}
              hideYAxisText
              yAxisLabelWidth={0}
              isAnimated
              animationDuration={600}
              xAxisLabelTextStyle={LABEL_STYLE}
            />
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(200)} className="items-center py-4">
            <PieChart
              donut
              data={pieData}
              radius={100}
              innerRadius={78}
              isAnimated
              animationDuration={500}
              centerLabelComponent={() => (
                <View className="items-center px-2">
                  <Text
                    className="font-headline text-[24px] text-text-primary"
                    style={{ letterSpacing: -0.5 }}>
                    {spentDisplay}
                  </Text>
                  <Text className="mt-0.5 font-caption text-[11px] text-[#8E8E93]">
                    {periodRangeLabel}
                  </Text>
                </View>
              )}
            />
          </Animated.View>
        )}

        {/* Period selector */}
        <PeriodSelector
          selected={period}
          onSelect={handlePeriod}
          onSettings={() => {
            selection();
            setShowSettingsSheet(true);
          }}
        />

        {/* Stats */}
        <View className="mx-4 mt-6 flex-row gap-3">
          <StatCard
            label="Daily average"
            value={isBalanceVisible ? `$${dailyAvg.toFixed(2)}` : '****'}
          />
          <StatCard
            label="Transactions"
            value={transactionCount.toString()}
            sub={`${monthlyUsedPct.toFixed(0)}% of limit`}
          />
        </View>

        {/* By Category */}
        {categories.length > 0 && (
          <View className="mt-8">
            <SectionHeader title="By Category" action="Manage" />
            <View className="mx-4 overflow-hidden rounded-2xl bg-[#F2F2F7]">
              {categories.slice(0, 5).map((cat, i, arr) => (
                <CategoryRow
                  key={cat.id}
                  title={cat.title}
                  transactionCount={cat.transactionCount}
                  amount={cat.amount}
                  percentage={cat.percentage}
                  iconName={cat.iconName ?? 'layers-3'}
                  color={CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]}
                  showSep={i < Math.min(arr.length, 5) - 1}
                />
              ))}
            </View>
          </View>
        )}

        {/* Your Card */}
        <View className="mt-8">
          <SectionHeader title="Your Card" />
          <View className="mx-4 flex-row gap-3">
            <StashCard
              title="Available"
              amount={availSplit.dollars}
              amountCents={availSplit.cents}
              icon={<CreditCard size={28} color={C.text} strokeWidth={1.5} />}
              badge={cardBadge}
              subtitle={cardSubtitle}
              className="flex-1"
            />
            <StashCard
              title="This month"
              amount={spentSplit.dollars}
              amountCents={spentSplit.cents}
              icon={<TrendIcon size={28} color={trendColor} strokeWidth={1.5} />}
              className="flex-1"
            />
          </View>
        </View>

        {/* Recent transactions */}
        {transactions.length > 0 && (
          <View className="mt-8">
            <SectionHeader title="Recent" action="See all" />
            <View className="mx-4 overflow-hidden rounded-2xl bg-[#F2F2F7]">
              {transactions.slice(0, 8).map((tx, i, arr) => (
                <TxRow key={tx.id} transaction={tx} showSep={i < Math.min(arr.length, 8) - 1} />
              ))}
            </View>
          </View>
        )}

        {transactions.length === 0 && categories.length === 0 && !hasSpend && (
          <View className="mt-12 items-center px-4">
            <EmptyPeriod />
          </View>
        )}
      </ScrollView>

      {/* Display settings sheet */}
      <BottomSheet visible={showSettingsSheet} onClose={() => setShowSettingsSheet(false)}>
        <Text className="mb-2 font-headline text-[17px] text-text-primary">Display</Text>
        {VIEW_OPTIONS.map((opt, i) => {
          const IconComp = opt.IconComp;
          return (
            <Pressable
              key={opt.id}
              onPress={() => {
                handleViewMode(opt.id);
                setShowSettingsSheet(false);
              }}
              className={`flex-row items-center py-[14px] ${i < VIEW_OPTIONS.length - 1 ? 'border-b border-[#E5E5EA]' : ''}`}
              accessibilityRole="button"
              accessibilityLabel={opt.label}>
              <View className="mr-[14px] h-10 w-10 items-center justify-center rounded-xl bg-[#F2F2F7]">
                <IconComp size={20} color="#000000" strokeWidth={1.5} />
              </View>
              <Text className="flex-1 font-button text-body text-text-primary">{opt.label}</Text>
              {viewMode === opt.id && <Check size={20} color="#000000" strokeWidth={2} />}
            </Pressable>
          );
        })}
      </BottomSheet>
    </View>
  );
}
