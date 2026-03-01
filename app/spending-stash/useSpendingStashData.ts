import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { useSpendingStash } from '@/api/hooks/useSpending';
import { toNumber } from '@/utils/market';
import type {
  Transaction,
  TransactionStatus,
  TransactionType,
  WithdrawalMethod,
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
  p2p: 'send',
  withdrawal: 'banknote',
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

const inferWithdrawalMethod = (type: string, description: string): WithdrawalMethod | undefined => {
  const t = (type + ' ' + description).toLowerCase();
  if (t.includes('fiat') || t.includes('bank') || t.includes('ach')) return 'fiat';
  if (t.includes('card')) return 'card';
  if (t.includes('p2p') || t.includes('email') || t.includes('railtag') || t.includes('contact')) return 'p2p';
  if (t.includes('crypto') || t.includes('wallet') || t.includes('chain') || t.includes('sol') || t.includes('eth')) return 'crypto';
  return undefined;
};

const humanizeTitle = (type: string, direction?: 'debit' | 'credit'): string => {
  const t = type.toLowerCase().replace(/_/g, ' ');
  if (t.includes('withdrawal') || t.includes('withdraw')) return 'Withdrawal';
  if (t.includes('deposit')) return 'Deposit';
  if (t.includes('transfer')) return direction === 'credit' ? 'Transfer In' : 'Transfer Out';
  if (t.includes('refund')) return 'Refund';
  if (t.includes('payment')) return 'Payment';
  if (t.includes('purchase')) return 'Purchase';
  return direction === 'credit' ? 'Credit' : 'Debit';
};

const toTransactionStatus = (status: string): TransactionStatus => {
  const s = status.toLowerCase();
  if (s === 'pending' || s === 'authorized') return 'pending';
  if (s === 'declined' || s === 'failed' || s === 'timeout') return 'failed';
  return 'completed';
};

export function useSpendingStashData() {
  const { data, isLoading, isError } = useSpendingStash();

  const thisMonthSpend = toNumber(data?.spending_summary?.this_month_total);
  const availableBalance = toNumber(data?.balance?.available);
  const pendingBalance = toNumber(data?.balance?.pending);
  const dailyAvg = toNumber(data?.spending_summary?.daily_average);
  const trend = data?.spending_summary?.trend ?? 'stable';
  const trendPct = data?.spending_summary?.trend_change_percent ?? 0;
  const transactionCount = data?.spending_summary?.transaction_count ?? 0;

  const monthlyLimit = toNumber(data?.limits?.monthly?.limit);
  const monthlyUsed = toNumber(data?.limits?.monthly?.used);
  const monthlyRemaining = toNumber(data?.limits?.monthly?.remaining);
  const monthlyUsedPct = data?.limits?.monthly?.used_percent ?? 0;
  const dailyLimit = toNumber(data?.limits?.daily?.limit);
  const dailyUsed = toNumber(data?.limits?.daily?.used);
  const dailyRemaining = toNumber(data?.limits?.daily?.remaining);
  const dailyUsedPct = data?.limits?.daily?.used_percent ?? 0;

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
    return [];
  }, [data?.chart_data]);

  // Calculate total spent from chart data (6 months)
  const totalSpent = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.value, 0);
  }, [chartData]);

  // Generate period range label from chart data
  const periodRangeLabel = useMemo(() => {
    if (chartData.length === 0) return '';
    if (chartData.length === 1) return chartData[0].label;
    return `${chartData[0].label} – ${chartData[chartData.length - 1].label}`;
  }, [chartData]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tx of data?.recent_transactions?.items ?? []) {
      const category = tx.merchant?.category?.trim();
      if (category) counts.set(category, (counts.get(category) ?? 0) + 1);
    }
    return counts;
  }, [data?.recent_transactions?.items]);

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
      (data?.recent_transactions?.items ?? []).map((tx) => {
        const txType = toTransactionType(tx.direction, toNumber(tx.amount));
        const isWithdrawal = txType === 'withdraw';
        const withdrawalMethod = isWithdrawal
          ? inferWithdrawalMethod(tx.type, tx.description)
          : undefined;

        // Title: merchant name > humanized type (never raw backend strings)
        const title = tx.merchant?.name || humanizeTitle(tx.type, tx.direction);

        // Subtitle: destination address (truncated) > human description > merchant category
        const addr = tx.destination_address;
        const shortAddr = addr
          ? addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr
          : null;
        const rawDesc = tx.description || '';
        const isRawBackendString = /[_]/.test(rawDesc) || rawDesc === rawDesc.toUpperCase();
        const subtitle = shortAddr
          ?? (isRawBackendString ? (tx.merchant?.category || '') : rawDesc);

        return {
          id: tx.id,
          type: txType,
          title,
          subtitle,
          amount: Math.abs(toNumber(tx.amount)),
          currency: tx.currency || data?.balance?.currency || 'USD',
          assetSymbol: tx.currency || data?.balance?.currency || 'USD',
          merchant: tx.merchant?.name,
          status: toTransactionStatus(tx.status),
          createdAt: new Date(tx.created_at),
          withdrawalMethod,
        };
      }),
    [data?.balance?.currency, data?.recent_transactions?.items]
  );

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#B91C1C' : trend === 'down' ? '#15803D' : '#6B7280';

  return {
    isLoading,
    isError,
    availableBalance,
    pendingBalance,
    thisMonthSpend,
    totalSpent,
    dailyAvg,
    trend,
    trendPct,
    transactionCount,
    TrendIcon,
    trendColor,
    monthlyLimit,
    monthlyUsed,
    monthlyRemaining,
    monthlyUsedPct,
    dailyLimit,
    dailyUsed,
    dailyRemaining,
    dailyUsedPct,
    cardBadge,
    cardSubtitle,
    chartData,
    periodRangeLabel,
    categories,
    transactions,
    pendingAuths: data?.pending_authorizations ?? [],
    card: data?.card,
    roundUps: data?.round_ups,
    currency: data?.balance?.currency ?? 'USD',
  };
}
