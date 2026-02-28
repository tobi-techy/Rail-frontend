import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { useSpendingStash } from '@/api/hooks/useSpending';
import { toNumber } from '@/utils/market';
import type {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '@/components/molecules/TransactionItem';

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
  for (const [key, icon] of Object.entries(CATEGORY_ICON_MAP)) {
    if (lower.includes(key)) return icon;
  }
  return 'layers-3';
};

const toTransactionType = (direction?: 'debit' | 'credit', amount = 0): TransactionType =>
  direction === 'credit' || amount > 0 ? 'receive' : 'withdraw';

const toTransactionStatus = (status: string): TransactionStatus => {
  const s = status.toLowerCase();
  if (s === 'pending' || s === 'authorized') return 'pending';
  if (s === 'declined' || s === 'failed' || s === 'timeout') return 'failed';
  return 'completed';
};

export const formatMonthYear = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

export function useSpendingStashData() {
  const { data, isError } = useSpendingStash();

  const thisMonthSpend = toNumber(data?.spending_summary?.this_month_total);
  const availableBalance = toNumber(data?.balance.available);
  const dailyAvg = toNumber(data?.spending_summary?.daily_average);
  const trend = data?.spending_summary?.trend ?? 'stable';
  const trendPct = data?.spending_summary?.trend_change_percent ?? 0;

  const monthlyLimit = toNumber(data?.limits?.monthly?.limit);
  const monthlyUsed = toNumber(data?.limits?.monthly?.used);
  const monthlyUsedPct = monthlyLimit > 0 ? Math.min((monthlyUsed / monthlyLimit) * 100, 100) : 0;
  const dailyLimit = toNumber(data?.limits?.daily?.limit);
  const dailyUsed = toNumber(data?.limits?.daily?.used);
  const dailyUsedPct = dailyLimit > 0 ? Math.min((dailyUsed / dailyLimit) * 100, 100) : 0;

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
    if (data?.chart_data && data.chart_data.length > 0) {
      return data.chart_data.map((d) => ({ label: d.label, value: d.value }));
    }
    // Fallback if no data
    return [
      { label: 'Jan', value: 0 },
      { label: 'Feb', value: 0 },
      { label: 'Mar', value: 0 },
      { label: 'Apr', value: 0 },
      { label: 'May', value: 0 },
      { label: 'Jun', value: 0 },
    ];
  }, [data?.chart_data]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tx of data?.recent_transactions.items ?? []) {
      const category = tx.merchant?.category?.trim();
      if (category) counts.set(category, (counts.get(category) ?? 0) + 1);
    }
    return counts;
  }, [data?.recent_transactions.items]);

  const categories = useMemo(
    () =>
      (data?.top_categories ?? []).map((cat, i) => ({
        id: `${cat.name}-${i}`,
        title: cat.name,
        transactionCount: categoryCounts.get(cat.name) ?? 0,
        amount: -Math.abs(toNumber(cat.amount)),
        percentage: Number(cat.percent.toFixed(0)),
        iconName: getCategoryIconName(cat.name),
      })),
    [categoryCounts, data?.top_categories]
  );

  const transactions = useMemo<Transaction[]>(
    () =>
      (data?.recent_transactions.items ?? []).map((tx) => ({
        id: tx.id,
        type: toTransactionType(tx.direction, toNumber(tx.amount)),
        title: tx.merchant?.category || tx.description || 'Card',
        subtitle: tx.description || tx.merchant?.name || 'Card transaction',
        amount: Math.abs(toNumber(tx.amount)),
        currency: tx.currency || data?.balance.currency || 'USD',
        assetSymbol: tx.currency || data?.balance.currency || 'USD',
        merchant: tx.merchant?.name || tx.description,
        status: toTransactionStatus(tx.status),
        createdAt: new Date(tx.created_at),
      })),
    [data?.balance.currency, data?.recent_transactions.items]
  );

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#B91C1C' : trend === 'down' ? '#15803D' : '#6B7280';

  return {
    isError,
    availableBalance,
    thisMonthSpend,
    dailyAvg,
    trend,
    trendPct,
    TrendIcon,
    trendColor,
    monthlyLimit,
    monthlyUsed,
    monthlyUsedPct,
    dailyLimit,
    dailyUsed,
    dailyUsedPct,
    cardBadge,
    cardSubtitle,
    chartData,
    categories,
    transactions,
    pendingAuths: data?.pending_authorizations ?? [],
    card: data?.card,
  };
}
