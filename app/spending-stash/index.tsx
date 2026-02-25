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
import { ArrowLeft, Settings2 } from 'lucide-react-native';
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

const Spending = () => {
  const router = useRouter();
  const { data, isError } = useSpendingStash();

  const thisMonthSpend = toNumber(data?.spending_summary?.this_month_total);
  const availableBalance = toNumber(data?.balance.available);
  const spendingBalanceText =
    data?.balance.spending_balance_formatted ??
    `$${toNumber(data?.balance.spending_balance).toFixed(2)}`;

  const splitCardAmount = useMemo(() => {
    const [whole, cents] = spendingBalanceText.split('.');
    return { whole, cents: cents ? `.${cents}` : '.00' };
  }, [spendingBalanceText]);

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

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <View className="flex-row items-center justify-between px-5 py-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
          activeOpacity={0.7}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>

        <View className="flex-row gap-3">
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/settings')}>
            <Settings2 size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="mt-2 px-5">
          <Text className="font-body-medium mb-1 text-[16px] text-[#8C8C8C]">Total Left</Text>
          <Text className="font-subtitle text-[56px] tabular-nums leading-[64px] tracking-[-2px] text-black">
            ${availableBalance.toFixed(2)}
          </Text>
          <Text className="font-body text-[14px] text-[#8C8C8C]">This month</Text>
          {isError ? (
            <Text className="mt-1 font-body text-[12px] text-[#B45309]">
              Showing last known data
            </Text>
          ) : null}
        </View>

        <View className="mt-6" style={{ marginHorizontal: -20 }}>
          <SpendingLineChart
            data={chartData}
            lineColor="#000000"
            gradientColors={['rgba(0,0,0,0.12)', 'rgba(0,0,0,0)']}
          />
        </View>

        <View className="mt-10 px-5">
          <Text className="font-body-medium mb-4 text-[20px] text-black">Your Card</Text>
          <View className="w-full pl-[2px]">
            <StashCard
              title={data?.card ? `Rail+ Card •••• ${data.card.last_four}` : 'Rail+ Card'}
              amount={splitCardAmount.whole}
              amountCents={splitCardAmount.cents}
              icon={<VisaLogo color={'#000'} width={36} height={24} />}
            />
          </View>
        </View>

        <View className="mt-10 px-5">
          <View className="mb-2 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="font-body-medium mr-2 text-[20px] text-black">By Category</Text>
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
              <Text className="font-body text-[14px] text-[#8C8C8C]">
                No category spending yet.
              </Text>
            )}
          </View>
        </View>

        <View className="mt-10 px-5">
          <TransactionList
            transactions={transactions}
            title="Recent Activity"
            onTransactionPress={() => {}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Spending;
