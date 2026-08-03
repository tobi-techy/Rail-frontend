import React, { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { GorhomBottomSheet } from './GorhomBottomSheet';
import { Skeleton } from '@/components/atoms/Skeleton';
import { Icon } from '@/components/atoms/Icon';
import { useSpendingStash } from '@/api/hooks/useSpending';
import { formatCurrencyAmount, migrateLegacyCurrency } from '@/utils/currency';
import { toNumber } from '@/utils/market';
import { useUIStore } from '@/stores';
import { cn } from '@/utils/cn';
import type { Currency } from '@/stores/uiStore';
import { ArrowRight01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import { useButtonFeedback } from '@/hooks/useButtonFeedback';

interface SpendBreakdownSheetProps {
  visible: boolean;
  onClose: () => void;
  onViewDetails?: () => void;
}

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

// Green-to-blue color ramp (inspired by reference design)
const CATEGORY_COLORS = [
  '#1B4332',
  '#2D6A4F',
  '#40916C',
  '#52B788',
  '#74C69D',
  '#95D5B2',
  '#5B8FF9',
  '#85A5FF',
];

const getCategoryIconName = (category: string): string => {
  const lower = category.trim().toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICON_MAP)) {
    if (lower.includes(key)) return icon;
  }
  return 'layers-3';
};

function StackedBar({ categories }: { categories: { percent: number; color: string }[] }) {
  if (!categories.length) return null;
  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      className="h-3 flex-row overflow-hidden rounded-full">
      {categories.map((cat, i) => (
        <View
          key={i}
          style={{ width: `${Math.max(cat.percent, 2)}%`, backgroundColor: cat.color }}
          className={cn(
            i === 0 && 'rounded-l-full',
            i === categories.length - 1 && 'rounded-r-full'
          )}
        />
      ))}
    </Animated.View>
  );
}

function CategoryRow({
  title,
  amount,
  percent,
  iconName,
  color,
  isLast,
  isBalanceVisible,
  currency,
  index,
}: {
  title: string;
  amount: number;
  percent: number;
  iconName: string;
  color: string;
  isLast: boolean;
  isBalanceVisible: boolean;
  currency: Currency;
  index: number;
}) {
  const formattedAmount = formatCurrencyAmount(Math.abs(amount), currency);
  return (
    <Animated.View
      entering={FadeInUp.duration(280).delay(80 + index * 50)}
      className={cn(
        'flex-row items-center justify-between py-3.5',
        !isLast && 'border-b border-fog/50'
      )}>
      <View className="flex-row items-center gap-3">
        <View
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: color + '18' }}>
          <Icon name={iconName} size={18} color={color} strokeWidth={1.5} />
        </View>
        <View className="gap-0.5">
          <Text className="font-body-medium text-[15px] text-charcoal-primary" numberOfLines={1}>
            {title}
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
            <Text className="font-body text-xs text-ash">{percent}%</Text>
          </View>
        </View>
      </View>
      <Text className="font-mono text-[15px] tabular-nums text-charcoal-primary">
        {isBalanceVisible ? formattedAmount : '••••'}
      </Text>
    </Animated.View>
  );
}

export function SpendBreakdownSheet({ visible, onClose, onViewDetails }: SpendBreakdownSheetProps) {
  const { data, isLoading } = useSpendingStash();
  const isBalanceVisible = useUIStore((s) => s.isBalanceVisible);
  const triggerFeedback = useButtonFeedback();

  const currency = migrateLegacyCurrency(data?.balance?.currency);
  const totalSpent = toNumber(data?.spending_summary?.this_month_total);
  const lastMonthTotal = toNumber(data?.spending_summary?.last_month_total);

  const categories = useMemo(
    () =>
      (data?.top_categories ?? []).map((cat, index) => ({
        id: `${cat.name}-${index}`,
        title: cat.name,
        amount: toNumber(cat.amount),
        percent: Math.round(cat.percent),
        iconName: getCategoryIconName(cat.name),
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      })),
    [data?.top_categories]
  );

  const totalDisplay = isBalanceVisible ? formatCurrencyAmount(totalSpent, currency) : '••••';
  const showEmpty = !isLoading && categories.length === 0;

  // AI insight line
  const insightText = useMemo(() => {
    if (!lastMonthTotal || !totalSpent) return null;
    const diff = ((totalSpent - lastMonthTotal) / lastMonthTotal) * 100;
    if (Math.abs(diff) < 2) return null;
    const direction = diff > 0 ? 'more' : 'less';
    return `You've spent ${Math.abs(Math.round(diff))}% ${direction} than last month`;
  }, [totalSpent, lastMonthTotal]);

  return (
    <GorhomBottomSheet visible={visible} onClose={onClose} showCloseButton={false} dismissible>
      <View className="gap-5 pb-2 pt-2">
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(300)}>
          <Text className="font-body text-sm text-ash">Spending</Text>
          {isLoading ? (
            <Skeleton className="mt-1 h-8 w-32" />
          ) : (
            <Text className="mt-0.5 font-mono-semibold text-[28px] tabular-nums text-charcoal-primary">
              {totalDisplay}
            </Text>
          )}
          {insightText ? (
            <Animated.View
              entering={FadeIn.duration(400).delay(200)}
              className="mt-2 flex-row items-center gap-1.5">
              <View className="h-1.5 w-1.5 rounded-full bg-sky-blue" />
              <Text className="font-body text-xs text-sky-blue">{insightText}</Text>
            </Animated.View>
          ) : null}
        </Animated.View>

        {/* Stacked Bar */}
        {!isLoading && categories.length > 0 ? (
          <StackedBar
            categories={categories.map((c) => ({ percent: c.percent, color: c.color }))}
          />
        ) : null}

        {/* Category List */}
        <View>
          {isLoading ? (
            [0, 1, 2].map((i) => (
              <View
                key={i}
                className={cn(
                  'flex-row items-center justify-between py-3.5',
                  i !== 2 && 'border-b border-fog/50'
                )}>
                <View className="flex-row items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <View className="gap-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-12" />
                  </View>
                </View>
                <Skeleton className="h-4 w-16" />
              </View>
            ))
          ) : showEmpty ? (
            <View className="items-center gap-2 py-8">
              <Text className="font-body-medium text-base text-charcoal-primary">
                No spending yet
              </Text>
              <Text className="text-center font-body text-sm text-ash">
                Your breakdown will appear after your first purchase.
              </Text>
            </View>
          ) : (
            categories.map((cat, idx) => (
              <CategoryRow
                key={cat.id}
                title={cat.title}
                amount={cat.amount}
                percent={cat.percent}
                iconName={cat.iconName}
                color={cat.color}
                isLast={idx === categories.length - 1}
                isBalanceVisible={isBalanceVisible}
                currency={currency}
                index={idx}
              />
            ))
          )}
        </View>

        {/* View Details CTA */}
        {onViewDetails && !showEmpty ? (
          <Animated.View entering={FadeInUp.duration(300).delay(400)}>
            <Pressable
              onPress={() => {
                triggerFeedback();
                onViewDetails();
              }}
              className="flex-row items-center justify-center gap-1.5 rounded-xl bg-stone-surface py-3">
              <Text className="font-body-medium text-sm text-charcoal-primary">
                View full breakdown
              </Text>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="#343433" />
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </GorhomBottomSheet>
  );
}
