import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import React, { useMemo } from 'react';
import { useRouter } from 'expo-router';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Settings2,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  ChevronRight,
  Layers,
  Activity,
} from 'lucide-react-native';
import { SpendingLineChart } from '@/components/molecules/SpendingLineChart';
import { SpendingCategoryItem } from '@/components/molecules/SpendingCategoryItem';
import { StashCard } from '@/components/molecules/StashCard';
import { TransactionList } from '@/components/molecules/TransactionList';
import { VisaLogo } from '@/assets/svg';
import type {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '@/components/molecules/TransactionItem';
import { useSpendingStash } from '@/api/hooks/useSpending';
import { Button } from '@/components/ui';

const toNumber = (value?: string | null): number => {
  const parsed = Number.parseFloat(value ?? '0');
  return Number.isFinite(parsed) ? parsed : 0;
};

const CATEGORY_ICON_MAP: Record<string, string> = {
  food: 'utensils-crossed',
  drink: 'cup-soda',
  shopping: 'shopping-bag',
  transport: 'car',
  entertainment: 'film',
  travel: 'plane',
  health: 'heart-pulse',
  utility: 'lightbulb',
  groceries: 'shopping-cart',
};

const getCategoryIconName = (category: string): string => {
  const lower = category.trim().toLowerCase();
  for (const [key, iconName] of Object.entries(CATEGORY_ICON_MAP)) {
    if (lower.includes(key)) return iconName;
  }
  return 'layers-3';
};

const toTransactionType = (direction?: 'debit' | 'credit', amount = 0): TransactionType => {
  if (direction === 'credit' || amount > 0) return 'receive';
  return 'withdraw';
};

const toTransactionStatus = (status: string): TransactionStatus => {
  const normalized = status.toLowerCase();
  if (normalized === 'pending' || normalized === 'authorized') return 'pending';
  if (normalized === 'declined' || normalized === 'failed' || normalized === 'timeout')
    return 'failed';
  return 'completed';
};

/** Formats "February 2026" from a Date */
const formatMonthYear = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const Spending = () => {
  const router = useRouter();
  const { data, isError } = useSpendingStash();

  const monthLabel = useMemo(() => formatMonthYear(new Date()), []);

  const thisMonthSpend = toNumber(data?.spending_summary?.this_month_total);
  const availableBalance = toNumber(data?.balance.available);
  const dailyAvg = toNumber(data?.spending_summary?.daily_average);
  const trend = data?.spending_summary?.trend ?? 'stable';
  const trendPct = data?.spending_summary?.trend_change_percent ?? 0;

  // Spending limit progress
  const monthlyLimit = toNumber(data?.limits?.monthly?.limit);
  const monthlyUsed = toNumber(data?.limits?.monthly?.used);
  const monthlyUsedPct = monthlyLimit > 0 ? Math.min((monthlyUsed / monthlyLimit) * 100, 100) : 0;
  const dailyLimit = toNumber(data?.limits?.daily?.limit);
  const dailyUsed = toNumber(data?.limits?.daily?.used);
  const dailyUsedPct = dailyLimit > 0 ? Math.min((dailyUsed / dailyLimit) * 100, 100) : 0;

  // Card badge
  const cardBadge = useMemo(() => {
    if (!data?.card) return undefined;
    if (data.card.is_frozen) return { label: 'Frozen', color: 'red' as const };
    if (data.card.status === 'active') return { label: 'Active', color: 'green' as const };
    return { label: data.card.status, color: 'gray' as const };
  }, [data?.card]);

  const cardSubtitle = useMemo(() => {
    if (!data?.card) return undefined;
    const type = data.card.type?.toLowerCase();
    if (type === 'virtual') return 'Virtual card';
    if (type === 'physical') return 'Physical card';
    return data.card.network ?? undefined;
  }, [data?.card]);

  const chartData = useMemo(() => {
    return [
      { label: 'Jan', value: 0 },
      { label: 'Feb', value: 0 },
      { label: 'Mar', value: 0 },
      { label: 'Apr', value: 0 },
      { label: 'May', value: 0 },
      { label: 'Jun', value: Number(thisMonthSpend.toFixed(2)) },
    ];
  }, [thisMonthSpend]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tx of data?.recent_transactions.items ?? []) {
      const category = tx.merchant?.category?.trim();
      if (!category) continue;
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
    return counts;
  }, [data?.recent_transactions.items]);

  const categories = useMemo(
    () =>
      (data?.top_categories ?? []).map((category, index) => ({
        id: `${category.name}-${index}`,
        title: category.name,
        transactionCount: categoryCounts.get(category.name) ?? 0,
        amount: -Math.abs(toNumber(category.amount)),
        percentage: Number(category.percent.toFixed(0)),
        iconName: getCategoryIconName(category.name),
      })),
    [categoryCounts, data?.top_categories]
  );

  const transactions = useMemo<Transaction[]>(
    () =>
      (data?.recent_transactions.items ?? []).map((tx) => {
        const amount = Math.abs(toNumber(tx.amount));
        return {
          id: tx.id,
          type: toTransactionType(tx.direction, toNumber(tx.amount)),
          title: tx.merchant?.category || tx.description || 'Card',
          subtitle: tx.description || tx.merchant?.name || 'Card transaction',
          amount,
          currency: tx.currency || data?.balance.currency || 'USD',
          assetSymbol: tx.currency || data?.balance.currency || 'USD',
          merchant: tx.merchant?.name || tx.description,
          status: toTransactionStatus(tx.status),
          createdAt: new Date(tx.created_at),
        };
      }),
    [data?.balance.currency, data?.recent_transactions.items]
  );

  const pendingAuths = data?.pending_authorizations ?? [];

  const TrendIcon = useMemo(
    () => (trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus),
    [trend]
  );
  const trendColor = useMemo(
    () => (trend === 'up' ? '#B91C1C' : trend === 'down' ? '#15803D' : '#6B7280'),
    [trend]
  );

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      {/* ── Header ── */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
          activeOpacity={0.7}>
          <ArrowLeft size={20} color="#000" />
        </TouchableOpacity>

        <Text className="font-body-medium text-[16px] text-black">Spending Stash</Text>

        <TouchableOpacity
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/settings')}>
          <Settings2 size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}>
        {/* ── Hero balance ── */}
        <View className="mt-2 px-5">
          <Text className="font-body-medium mb-1 text-[16px] text-[#8C8C8C]">
            Available to Spend
          </Text>
          <Text className="font-subtitle text-[56px] tabular-nums leading-[64px] tracking-[-2px] text-black">
            ${availableBalance.toFixed(2)}
          </Text>

          {/* Trend pill */}
          <View className="mt-2 flex-row items-center gap-3">
            <View
              className="flex-row items-center gap-1 rounded-full px-3 py-1"
              style={{
                backgroundColor:
                  trend === 'up' ? '#FEF2F2' : trend === 'down' ? '#ECFDF3' : '#F3F4F6',
              }}>
              <TrendIcon size={13} color={trendColor} />
              <Text style={{ color: trendColor, fontSize: 12, fontWeight: '600' }}>
                {trendPct > 0 ? `+${trendPct.toFixed(1)}%` : `${trendPct.toFixed(1)}%`} vs last
                month
              </Text>
            </View>
          </View>

          {/* Stats row */}
          <View className="mt-4 flex-row gap-6">
            <View>
              <Text className="font-body text-[12px] text-[#8C8C8C]">Spent this month</Text>
              <Text className="font-body-medium text-[15px] text-black">
                ${thisMonthSpend.toFixed(2)}
              </Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View>
              <Text className="font-body text-[12px] text-[#8C8C8C]">Daily avg</Text>
              <Text className="font-body-medium text-[15px] text-black">
                ${dailyAvg.toFixed(2)}
              </Text>
            </View>
          </View>

          {isError ? (
            <Text className="mt-2 font-body text-[12px] text-[#B45309]">
              ⚠ Showing last known data
            </Text>
          ) : null}
        </View>

        {/* ── Action buttons ── */}
        <View className="mb-2 ml-5 mt-5 flex-row gap-3">
          <Button
            title="Fund Spend"
            leftIcon={<ArrowDownLeft size={20} color="white" />}
            size="small"
            variant="black"
          />
          <Button
            title="Send"
            leftIcon={<ArrowUpRight size={20} color="black" />}
            size="small"
            variant="white"
          />
        </View>

        {/* ── Spending limits ── */}
        {(monthlyLimit > 0 || dailyLimit > 0) && (
          <View className="mx-5 mt-6 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
            <Text className="font-body-medium mb-3 text-[13px] uppercase tracking-wide text-[#8C8C8C]">
              Spending Limits
            </Text>
            {monthlyLimit > 0 && (
              <View className="mb-3">
                <View className="mb-1.5 flex-row items-center justify-between">
                  <Text className="font-body text-[13px] text-black">Monthly</Text>
                  <Text className="font-body-medium text-[13px] text-black">
                    ${monthlyUsed.toFixed(0)} / ${monthlyLimit.toFixed(0)}
                  </Text>
                </View>
                <View className="h-2 overflow-hidden rounded-full bg-gray-200">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${monthlyUsedPct}%`,
                      backgroundColor: monthlyUsedPct > 85 ? '#EF4444' : '#000',
                    }}
                  />
                </View>
              </View>
            )}
            {dailyLimit > 0 && (
              <View>
                <View className="mb-1.5 flex-row items-center justify-between">
                  <Text className="font-body text-[13px] text-black">Daily</Text>
                  <Text className="font-body-medium text-[13px] text-black">
                    ${dailyUsed.toFixed(0)} / ${dailyLimit.toFixed(0)}
                  </Text>
                </View>
                <View className="h-2 overflow-hidden rounded-full bg-gray-200">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${dailyUsedPct}%`,
                      backgroundColor: dailyUsedPct > 85 ? '#EF4444' : '#000',
                    }}
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── Chart ── */}
        <View className="mt-6" style={{ marginHorizontal: -20 }}>
          <SpendingLineChart
            data={chartData}
            lineColor="#000000"
            gradientColors={['rgba(0,0,0,0.12)', 'rgba(0,0,0,0)']}
          />
        </View>

        {/* ── Your Card ── */}
        <View className="mt-10 px-5">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-body-medium text-[20px] text-black">Your Card</Text>
            {data?.card && (
              <TouchableOpacity activeOpacity={0.7} className="flex-row items-center gap-1">
                <Text className="font-body text-[13px] text-[#8C8C8C]">Manage</Text>
                <ChevronRight size={14} color="#8C8C8C" />
              </TouchableOpacity>
            )}
          </View>
          <View className="w-full pl-[2px]">
            <StashCard
              title="Rail+ Card"
              amount={data?.card?.last_four ? `•••• ${data.card.last_four}` : '•••• ----'}
              subtitle={cardSubtitle}
              badge={cardBadge}
              icon={<VisaLogo color={'#000'} width={36} height={24} />}
            />
          </View>
        </View>

        {/* ── Pending authorizations ── */}
        {pendingAuths.length > 0 && (
          <View className="mt-6 px-5">
            <View className="mb-3 flex-row items-center gap-2">
              <Clock size={15} color="#8C8C8C" />
              <Text className="font-body-medium text-[15px] text-black">Pending</Text>
            </View>
            <View className="overflow-hidden rounded-2xl border border-gray-100">
              {pendingAuths.map((auth, i) => (
                <View
                  key={auth.id}
                  className={`flex-row items-center justify-between px-4 py-3 ${i < pendingAuths.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <View>
                    <Text className="font-body-medium text-[14px] text-black">
                      {auth.merchant_name}
                    </Text>
                    {auth.category ? (
                      <Text className="font-body text-[12px] text-[#8C8C8C]">{auth.category}</Text>
                    ) : null}
                  </View>
                  <Text className="font-body-medium text-[14px] text-[#B45309]">
                    {auth.amount_formatted ?? `-$${toNumber(auth.amount).toFixed(2)}`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── By Category ── */}
        <View className="mt-10 px-5">
          <View className="mb-2 flex-row items-center justify-between">
            <View>
              <Text className="font-body-medium text-[20px] text-black">By Category</Text>
              <Text className="font-body text-[13px] text-[#8C8C8C]">{monthLabel}</Text>
            </View>
          </View>

          <View>
            {categories.length ? (
              categories.map((category, index) => (
                <View key={category.id}>
                  <SpendingCategoryItem
                    id={category.id}
                    title={category.title}
                    transactionCount={category.transactionCount}
                    amount={category.amount}
                    percentage={category.percentage}
                    iconName={category.iconName}
                    onPress={() => {}}
                  />
                  {index < categories.length - 1 && <View className="h-px bg-gray-100" />}
                </View>
              ))
            ) : (
              /* Empty state */
              <View className="items-center py-10">
                <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                  <Layers size={24} color="#8C8C8C" />
                </View>
                <Text className="font-body-medium text-[15px] text-black">No spending yet</Text>
                <Text className="mt-1 font-body text-[13px] text-[#8C8C8C]">
                  Your category breakdown will appear here.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Recent Activity ── */}
        <View className="mt-10 px-5">
          {transactions.length ? (
            <TransactionList
              transactions={transactions}
              title="Recent Activity"
              onTransactionPress={() => {}}
            />
          ) : (
            <View>
              <Text className="font-body-medium mb-6 text-[20px] text-black">Recent Activity</Text>
              <View className="items-center py-10">
                <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                  <Activity size={24} color="#8C8C8C" />
                </View>
                <Text className="font-body-medium text-[15px] text-black">No transactions yet</Text>
                <Text className="mt-1 font-body text-[13px] text-[#8C8C8C]">
                  Transactions made with your card will appear here.
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Spending;
