import React, { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ChevronRight } from 'lucide-react-native';
import { BottomSheet } from './BottomSheet';
import { Skeleton } from '@/components/atoms/Skeleton';
import { Icon } from '@/components/atoms/Icon';
import { useSpendingStash } from '@/api/hooks/useSpending';
import { formatCurrencyAmount, migrateLegacyCurrency } from '@/utils/currency';
import { toNumber } from '@/utils/market';
import { useUIStore } from '@/stores';
import { cn } from '@/utils/cn';
import type { Currency } from '@/stores/uiStore';

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

const getCategoryIconName = (category: string): string => {
  const lower = category.trim().toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICON_MAP)) {
    if (lower.includes(key)) return icon;
  }
  return 'layers-3';
};

function CategoryRow({
  title,
  amount,
  percent,
  iconName,
  isLast,
  isBalanceVisible,
  currency,
}: {
  title: string;
  amount: number;
  percent: number;
  iconName: string;
  isLast: boolean;
  isBalanceVisible: boolean;
  currency: Currency;
}) {
  const formattedAmount = formatCurrencyAmount(Math.abs(amount), currency);
  return (
    <View
      className={cn(
        'flex-row items-center justify-between py-3',
        !isLast && 'border-b border-neutral-200'
      )}>
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
          <Icon name={iconName} size={20} color="#111827" strokeWidth={1.5} />
        </View>
        <View className="gap-1">
          <Text className="font-body text-base text-neutral-900" numberOfLines={1}>
            {title}
          </Text>
          <Text className="font-body text-sm text-neutral-500">{percent}% of spend</Text>
        </View>
      </View>
      <Text className="font-body text-base tabular-nums text-neutral-900">
        {isBalanceVisible ? `-${formattedAmount}` : '****'}
      </Text>
    </View>
  );
}

export function SpendBreakdownSheet({ visible, onClose, onViewDetails }: SpendBreakdownSheetProps) {
  const { data, isLoading, isError } = useSpendingStash();
  const isBalanceVisible = useUIStore((s) => s.isBalanceVisible);

  const currency = migrateLegacyCurrency(data?.balance?.currency);
  const totalSpent = toNumber(data?.spending_summary?.this_month_total);

  const categories = useMemo(
    () =>
      (data?.top_categories ?? []).map((cat, index) => ({
        id: `${cat.name}-${index}`,
        title: cat.name,
        amount: toNumber(cat.amount),
        percent: Math.round(cat.percent),
        iconName: getCategoryIconName(cat.name),
      })),
    [data?.top_categories]
  );

  const totalDisplay = isBalanceVisible ? formatCurrencyAmount(totalSpent, currency) : '****';

  const donutSize = 220;
  const donutStroke = 18;
  const donutRadius = (donutSize - donutStroke) / 2;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const donutProgress = 0.97;
  const donutOffset = donutCircumference * (1 - donutProgress);

  const showEmpty = !isLoading && categories.length === 0;

  return (
    <BottomSheet visible={visible} onClose={onClose} showCloseButton={false} dismissible>
      <View className="items-center">
        <View className="h-1 w-10 rounded-full bg-neutral-200" />
      </View>

      <View className="mt-4 gap-6">
        <View className="gap-1">
          <Text className="font-body text-sm text-neutral-500">Total spent</Text>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <Text className="font-subtitle text-2xl tabular-nums text-neutral-900">
              {totalDisplay}
            </Text>
          )}
        </View>

        <View className="items-center justify-center">
          <Svg width={donutSize} height={donutSize}>
            <Circle
              cx={donutSize / 2}
              cy={donutSize / 2}
              r={donutRadius}
              stroke="#E5E7EB"
              strokeWidth={donutStroke}
              fill="none"
            />
            <Circle
              cx={donutSize / 2}
              cy={donutSize / 2}
              r={donutRadius}
              stroke="#5B8FF9"
              strokeWidth={donutStroke}
              strokeLinecap="round"
              strokeDasharray={`${donutCircumference} ${donutCircumference}`}
              strokeDashoffset={donutOffset}
              fill="none"
              transform={`rotate(-90 ${donutSize / 2} ${donutSize / 2})`}
            />
          </Svg>
        </View>

        <View className="gap-3">
          <Text className="font-subtitle text-base text-neutral-900">Balance breakdown</Text>
          <View className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            {isLoading ? (
              [0, 1, 2].map((i) => (
                <View
                  key={i}
                  className={cn(
                    'flex-row items-center justify-between py-3',
                    i !== 2 && 'border-b border-neutral-200'
                  )}>
                  <View className="flex-row items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <View className="gap-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </View>
                  </View>
                  <Skeleton className="h-4 w-16" />
                </View>
              ))
            ) : showEmpty ? (
              <View className="gap-2 px-4 py-4">
                <Text className="font-body text-base text-neutral-900">No spending yet</Text>
                <Text className="font-body text-sm text-neutral-500">
                  Your category breakdown will appear after your first purchase.
                </Text>
                {onViewDetails ? (
                  <Pressable
                    onPress={onViewDetails}
                    className="min-h-[44px] flex-row items-center gap-2">
                    <Text className="font-body text-sm text-[#5B8FF9]">View more details</Text>
                    <ChevronRight size={20} color="#5B8FF9" />
                  </Pressable>
                ) : null}
              </View>
            ) : (
              categories.map((cat, idx) => (
                <CategoryRow
                  key={cat.id}
                  title={cat.title}
                  amount={cat.amount}
                  percent={cat.percent}
                  iconName={cat.iconName}
                  isLast={idx === categories.length - 1}
                  isBalanceVisible={isBalanceVisible}
                  currency={currency}
                />
              ))
            )}
          </View>

          {isError ? (
            <Text className="font-body text-sm text-destructive">
              Unable to load spending breakdown. Please try again.
            </Text>
          ) : null}
        </View>

        {onViewDetails && !showEmpty ? (
          <Pressable onPress={onViewDetails} className="min-h-[44px] items-center justify-center">
            <Text className="font-body text-sm text-[#5B8FF9]">View more details</Text>
          </Pressable>
        ) : null}
      </View>
    </BottomSheet>
  );
}
