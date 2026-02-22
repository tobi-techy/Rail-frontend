import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import React, { useLayoutEffect, useState, useCallback, useMemo } from 'react';
import { useNavigation } from 'expo-router';
import { Snowflake, TrendingUp, TrendingDown } from 'lucide-react-native';
import { FloatingBackButton } from '@/components/FloatingBackButton';
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { SpendingBarChart, type BarChartMonth } from '@/components/molecules/SpendingBarChart';
import { SpendingDonutChart, type DonutSegment } from '@/components/molecules/SpendingDonutChart';
import { useSpendingStash } from '@/api/hooks/useSpending';
import type { SpendingTransaction } from '@/api/types/spending';
import { TransactionList } from '@/components/molecules/TransactionList';
import type { Transaction } from '@/components/molecules/TransactionItem';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Drink': '#FF6B35',
  Transportation: '#6366F1',
  Shopping: '#10B981',
  Entertainment: '#F59E0B',
  Health: '#EC4899',
  Other: '#9CA3AF',
};

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function categoryColor(name: string) {
  return CATEGORY_COLORS[name] ?? '#9CA3AF';
}

function mapTransaction(t: SpendingTransaction): Transaction {
  const amount = Math.abs(parseFloat(t.amount));
  return {
    id: t.id,
    type: t.amount.startsWith('-') ? 'withdraw' : 'deposit',
    title: t.merchant?.name ?? t.description,
    subtitle: t.merchant?.category ?? t.type,
    amount,
    currency: t.currency,
    status: t.status === 'completed' ? 'completed' : t.pending_settlement ? 'pending' : 'completed',
    createdAt: new Date(t.created_at),
    merchant: t.merchant?.name,
  };
}

function CategoryRow({
  name, amount, percent, color, index,
}: {
  name: string; amount: string; percent: number; color: string; index: number;
}) {
  const progress = useSharedValue(0);
  const barStyle = useAnimatedStyle(() => ({ flex: progress.value }));

  React.useEffect(() => {
    const t = setTimeout(() => {
      progress.value = withTiming(percent / 100, { duration: 500, easing: Easing.out(Easing.cubic) });
    }, index * 60);
    return () => clearTimeout(t);
  }, [percent]);

  return (
    <Animated.View entering={FadeIn.delay(index * 50).duration(300)} className="mb-4">
      <View className="mb-1.5 flex-row items-center justify-between">
        <View className="flex-row items-center gap-x-2">
          <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
          <Text className="font-body text-[14px] text-text-primary">{name}</Text>
        </View>
        <View className="flex-row items-center gap-x-2">
          <Text className="font-caption text-[12px] text-text-secondary">{percent.toFixed(0)}%</Text>
          <Text className="font-subtitle text-[14px] text-text-primary">${amount}</Text>
        </View>
      </View>
      <View className="h-1 flex-row overflow-hidden rounded-full bg-[#F0F0F0]">
        <Animated.View style={[barStyle, { height: '100%', borderRadius: 999, backgroundColor: color }]} />
        <View style={{ flex: 1 }} />
      </View>
    </Animated.View>
  );
}

function LimitBar({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min(used / limit, 1);
  const progress = useSharedValue(0);
  const barStyle = useAnimatedStyle(() => ({ flex: progress.value }));
  React.useEffect(() => {
    progress.value = withTiming(pct, { duration: 500, easing: Easing.out(Easing.cubic) });
  }, [pct]);
  return (
    <View className="h-1.5 flex-row overflow-hidden rounded-full bg-[#E5E5E5]">
      <Animated.View style={[barStyle, { height: '100%', borderRadius: 999, backgroundColor: pct > 0.8 ? '#FF2E01' : '#000' }]} />
      <View style={{ flex: 1 }} />
    </View>
  );
}

export default function SpendingStashScreen() {
  const navigation = useNavigation();
  const currentMonthIndex = new Date().getMonth();

  const { data, isLoading, refetch, isRefetching } = useSpendingStash();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const barData = useMemo<BarChartMonth[]>(() => {
    const months: BarChartMonth[] = [];
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonthIndex - i + 12) % 12;
      months.push({
        month: MONTH_LABELS[idx],
        value: idx === currentMonthIndex ? parseFloat(data?.spending_summary?.this_month_total ?? '0') : 0,
      });
    }
    return months;
  }, [data, currentMonthIndex]);

  const [barSelectedIndex, setBarSelectedIndex] = useState(5);
  const isCurrentMonth = barSelectedIndex === 5;

  const summary = data?.spending_summary;
  const limits = data?.limits;
  const card = data?.card;
  const roundUps = data?.round_ups;
  const pending = data?.pending_authorizations ?? [];

  const spentAmount = isCurrentMonth ? (summary?.this_month_total ?? '0.00') : '0.00';
  const isUp = summary?.trend === 'up';
  const trendPct = summary ? `${summary.trend_change_percent}%` : null;

  const segments: DonutSegment[] = (data?.top_categories ?? []).map((cat) => ({
    label: cat.name,
    amount: parseFloat(cat.amount),
    color: categoryColor(cat.name),
  }));

  const transactions: Transaction[] = (data?.recent_transactions?.items ?? []).map(mapTransaction);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#000" />
      </View>
    );
  }

  const selectedMonthLabel = MONTH_LABELS[(currentMonthIndex - (5 - barSelectedIndex) + 12) % 12];

  return (
    <AnimatedScreen>
      <View className="flex-1 bg-white">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#000" />
          }>

          {/* ── Hero ── */}
          <View className="px-6 pb-2 pt-16">
            <View className="flex-row items-center justify-between">
              <Text className="font-caption text-[13px] text-text-secondary">Spent in {selectedMonthLabel}</Text>
              {card?.is_frozen && (
                <View className="flex-row items-center gap-x-1 rounded-full bg-[#EFF6FF] px-2 py-1">
                  <Snowflake size={12} color="#3B82F6" strokeWidth={2} />
                  <Text className="font-caption text-[11px] text-blue-500">Frozen</Text>
                </View>
              )}
            </View>
            <View className="mt-1 flex-row items-center gap-x-3">
              <Text style={{ fontFamily: 'SF-Pro-Rounded-Bold', fontSize: 42, color: '#000', letterSpacing: -1 }}>
                ${spentAmount}
              </Text>
              {isCurrentMonth && trendPct && (
                <View className="flex-row items-center gap-x-1">
                  {isUp
                    ? <TrendingUp size={14} color="#FF2E01" strokeWidth={2} />
                    : <TrendingDown size={14} color="#00C853" strokeWidth={2} />}
                  <Text className={`font-caption text-[13px] ${isUp ? 'text-destructive' : 'text-success'}`}>
                    {trendPct}
                  </Text>
                </View>
              )}
            </View>
            {data?.balance && (
              <Text className="mt-1 font-caption text-[13px] text-text-secondary">
                ${data.balance.available} available · ${data.balance.pending} pending
              </Text>
            )}
          </View>

          {/* ── Bar chart ── */}
          <Animated.View entering={FadeIn.delay(80).duration(300)} className="mt-6">
            <SpendingBarChart
              data={barData}
              selectedIndex={barSelectedIndex}
              onSelect={setBarSelectedIndex}
            />
          </Animated.View>

          <View className="mx-6 mt-6 h-px bg-[#F0F0F0]" />

          {/* ── Donut + categories ── */}
          {isCurrentMonth && (
            <Animated.View entering={FadeIn.delay(140).duration(300)} className="mx-6 mt-6">
              <SpendingDonutChart
                segments={segments}
                total={`$${spentAmount}`}
                subtitle="Spent this month"
                size={180}
                strokeWidth={20}
              />
              {segments.length > 0 && (
                <View className="mt-5">
                  {(data?.top_categories ?? []).map((cat, i) => (
                    <CategoryRow
                      key={cat.name}
                      name={cat.name}
                      amount={cat.amount}
                      percent={cat.percent}
                      color={categoryColor(cat.name)}
                      index={i}
                    />
                  ))}
                </View>
              )}
            </Animated.View>
          )}

          {/* ── Pending authorizations ── */}
          {isCurrentMonth && pending.length > 0 && (
            <Animated.View entering={FadeIn.delay(160).duration(300)} className="mt-4 px-6">
              <Text className="mb-2 font-caption text-[12px] uppercase tracking-wide text-text-secondary">Pending</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {pending.map((p) => (
                  <View key={p.id} className="mr-2 flex-row items-center gap-x-2 rounded-full border border-[#F0F0F0] bg-white px-3 py-2">
                    <View className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
                    <Text className="font-caption text-[12px] text-text-primary">{p.merchant_name}</Text>
                    <Text className="font-subtitle text-[12px] text-text-secondary">${p.amount}</Text>
                  </View>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* ── Limits ── */}
          {isCurrentMonth && limits && (
            <Animated.View entering={FadeIn.delay(180).duration(300)} className="mx-6 mt-4 rounded-2xl p-4 border border-[#F0F0F0]">
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="font-caption text-[12px] uppercase tracking-wide text-text-secondary">Monthly limit</Text>
                <Text className="font-subtitle text-[13px] text-text-primary">
                  ${limits.monthly.used}
                  <Text className="font-caption text-text-secondary"> / ${limits.monthly.limit}</Text>
                </Text>
              </View>
              <LimitBar used={parseFloat(limits.monthly.used)} limit={parseFloat(limits.monthly.limit)} />
              <View className="mt-3 flex-row justify-between">
                <Text className="font-caption text-[12px] text-text-secondary">Daily: ${limits.daily.used} / ${limits.daily.limit}</Text>
                <Text className="font-caption text-[12px] text-text-secondary">Per txn: ${limits.per_transaction}</Text>
              </View>
            </Animated.View>
          )}

          {/* ── Round-ups ── */}
          {isCurrentMonth && roundUps?.is_enabled && (
            <Animated.View entering={FadeIn.delay(200).duration(300)} className="mx-6 mt-3 flex-row items-center justify-between rounded-2xl border border-[#F0F0F0] px-4 py-3">
              <View>
                <Text className="font-subtitle text-[14px] text-text-primary">Round-ups</Text>
                <Text className="mt-0.5 font-caption text-[12px] text-text-secondary">
                  {roundUps.transaction_count} transactions · {roundUps.multiplier}× multiplier
                </Text>
              </View>
              <Text style={{ fontFamily: 'SF-Pro-Rounded-Bold', fontSize: 17, color: '#000' }}>
                ${roundUps.total_accumulated}
              </Text>
            </Animated.View>
          )}

          {/* ── Transactions ── */}
          <View className="mt-8 px-6">
            {transactions.length === 0 ? (
              <Animated.View entering={FadeIn.delay(240).duration(300)} className="items-center py-10">
                <Text className="font-subtitle text-[15px] text-text-primary">No transactions yet</Text>
                <Text className="mt-1 font-caption text-[13px] text-text-secondary">Card spending will appear here</Text>
              </Animated.View>
            ) : (
              <TransactionList title="Recent Spending" transactions={transactions} />
            )}
          </View>

        </ScrollView>
        <FloatingBackButton />
      </View>
    </AnimatedScreen>
  );
}
