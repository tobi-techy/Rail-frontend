import { useMemo } from 'react';
import { useSpendingStash } from '@/api/hooks/useSpending';
import { toNumber } from '@/utils/market';
import { ChartDownIcon, ChartUpIcon, MinusSignIcon } from '@hugeicons/core-free-icons';

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

export function useSpendingStashData() {
  const { data, isLoading, isError } = useSpendingStash();

  const availableBalance = toNumber(data?.balance?.available);
  const currency = data?.balance?.currency ?? 'USD';

  const thisMonthSpend = toNumber(data?.spending_summary?.this_month_total);
  const lastMonthSpend = toNumber(data?.spending_summary?.last_month_total);
  const dailyAvg = toNumber(data?.spending_summary?.daily_average);
  const trend = data?.spending_summary?.trend ?? 'stable';
  const trendPct = data?.spending_summary?.trend_change_percent ?? 0;
  const transactionCount = data?.spending_summary?.transaction_count ?? 0;

  const categories = useMemo(
    () =>
      (data?.top_categories ?? []).map((cat, i) => ({
        id: `${cat.name}-${i}`,
        title: cat.name,
        amount: toNumber(cat.amount),
        percentage: Math.round(cat.percent),
        iconName: getCategoryIconName(cat.name),
      })),
    [data?.top_categories]
  );

  const monthlyChart = useMemo(() => data?.monthly_chart ?? [], [data?.monthly_chart]);

  const TrendIcon = trend === 'up' ? ChartUpIcon : trend === 'down' ? ChartDownIcon : MinusSignIcon;
  const trendColor = trend === 'up' ? '#B91C1C' : trend === 'down' ? '#15803D' : '#6B7280';

  return {
    isLoading,
    isError,
    availableBalance,
    currency,
    thisMonthSpend,
    lastMonthSpend,
    dailyAvg,
    trend,
    trendPct,
    transactionCount,
    TrendIcon,
    trendColor,
    categories,
    monthlyChart,
    roundUps: data?.round_ups,
  };
}
