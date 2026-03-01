import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowDownLeft, ArrowUpLeft, ChevronLeft, CreditCard } from 'lucide-react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { PieChart } from 'react-native-gifted-charts';
import { useSpendingStashData } from './useSpendingStashData';
import { StashCard } from '@/components/molecules';
import { TransactionList } from '@/components/molecules/TransactionList';
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
  EmptyPeriod,
  type Period,
} from './components';
import { Button } from '@/components/ui';

function Shimmer({ className }: { className: string }) {
  const opacity = useSharedValue(0.4);
  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 700 }), withTiming(0.4, { duration: 700 })),
      -1
    );
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={style} className={`rounded-lg bg-gray-200 ${className}`} />;
}

export default function SpendingScreen() {
  const insets = useSafeAreaInsets();
  const { impact, selection } = useHaptics();
  const isBalanceVisible = useUIStore((s) => s.isBalanceVisible);

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
    periodRangeLabel,
    categories,
    transactions,
    cardBadge,
    cardSubtitle,
  } = useSpendingStashData();

  const [period, setPeriod] = useState<Period>('6M');

  const handlePeriod = useCallback(
    (p: Period) => {
      selection();
      setPeriod(p);
    },
    [selection]
  );

  const hasSpend = totalSpent > 0;
  const spentDisplay = isBalanceVisible ? `$${totalSpent.toFixed(2)}` : '****';

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
      <View className="flex-row items-center px-2 pb-2" style={{ paddingTop: insets.top + 8 }}>
        <Pressable
          onPress={() => { impact(); router.back(); }}
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
          {isLoading ? (
            <View className="mt-2 gap-y-2">
              <Shimmer className="h-14 w-48" />
              <Shimmer className="h-4 w-28" />
            </View>
          ) : (
            <>
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
            </>
          )}
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

        {/* Donut chart */}
        {isLoading ? (
          <View className="items-center py-6">
            <View className="h-[280px] w-[280px] items-center justify-center rounded-full border-[28px] border-gray-100">
              <View className="items-center">
                <Shimmer className="h-7 w-24 rounded-lg" />
                <Shimmer className="mt-2 h-3 w-16 rounded" />
              </View>
            </View>
          </View>
        ) : !hasSpend ? (
          <EmptyPeriod />
        ) : (
          <Animated.View entering={FadeIn.duration(200)} className="items-center py-6">
            <PieChart
              donut
              data={pieData}
              radius={140}
              innerRadius={110}
              isAnimated
              animationDuration={500}
              centerLabelComponent={() => (
                <View className="items-center px-2">
                  <Text
                    className="font-headline text-[26px] text-text-primary"
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
        <PeriodSelector selected={period} onSelect={handlePeriod} />

        {/* Stats */}
        <View className="mx-4 mt-6 flex-row gap-3">
          {isLoading ? (
            <>
              <View className="flex-1 rounded-2xl border border-gray-100 px-4 py-4 gap-y-2">
                <Shimmer className="h-3 w-20" />
                <Shimmer className="h-7 w-16" />
              </View>
              <View className="flex-1 rounded-2xl border border-gray-100 px-4 py-4 gap-y-2">
                <Shimmer className="h-3 w-20" />
                <Shimmer className="h-7 w-16" />
              </View>
            </>
          ) : (
            <>
              <StatCard
                label="Daily average"
                value={isBalanceVisible ? `$${dailyAvg.toFixed(2)}` : '****'}
              />
              <StatCard
                label="Transactions"
                value={transactionCount.toString()}
                sub={`${monthlyUsedPct.toFixed(0)}% of limit`}
              />
            </>
          )}
        </View>

        {/* By Category */}
        {categories.length > 0 && (
          <View className="mt-8">
            <SectionHeader title="By Category" action="Manage" />
            <View className="mx-4 overflow-hidden rounded-2xl border border-gray-100">
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
            <SectionHeader title="Recent" />
            <TransactionList
              transactions={transactions.slice(0, 8)}
              className="mx-4"
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
