import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Invoice02Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import { CardContainer, CardErrorFallback, parseMoney, type InsightCard } from './shared';

const CAT_COLORS = ['#0A7CFF', '#34C759', '#FF9F0A', '#FF375F', '#AF52DE'];

type Category = { category: string; total: string; percentage?: string };

export function StatementSummaryCard({ card }: { card: InsightCard }) {
  const d = (card.data ?? {}) as Record<string, any>;
  const currency = (d.currency as string) ?? '';
  const bank = (d.bank_name as string) || 'Bank statement';
  const spending = d.total_spending as string | undefined;
  const income = d.total_income as string | undefined;
  const txns = d.transaction_count as number | undefined;
  const months = d.months_covered as number | undefined;
  const periodStart = d.period_start as string | undefined;
  const periodEnd = d.period_end as string | undefined;
  const cats: Category[] = Array.isArray(d.top_categories) ? d.top_categories : [];

  if (!spending && !cats.length) return <CardErrorFallback />;

  const money = (v?: string) => (v != null && v !== '' ? `${currency} ${v}`.trim() : '—');
  const hasIncome = !!income && parseMoney(income) > 0;
  const period =
    periodStart && periodEnd
      ? `${periodStart} – ${periodEnd}`
      : months
        ? `${months} month${months > 1 ? 's' : ''}`
        : '';

  const maxCat = cats.reduce((m, c) => Math.max(m, parseMoney(c.total)), 0) || 1;

  return (
    <CardContainer>
      <View className="p-5">
        {/* Header */}
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <HugeiconsIcon icon={Invoice02Icon} size={20} color="#0A7CFF" />
          </View>
          <View className="flex-1">
            <Text className="font-heading-semibold text-[16px] text-text-primary" numberOfLines={1}>{bank}</Text>
            {period ? <Text className="font-body text-[13px] text-text-secondary">{period}</Text> : null}
          </View>
        </View>

        {/* Totals */}
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-stone-surface px-4 py-3">
            <Text className="font-body text-[12px] text-text-secondary">Total spending</Text>
            <Text className="mt-1 font-heading-bold text-[20px] text-text-primary" numberOfLines={1}>{money(spending)}</Text>
          </View>
          {hasIncome ? (
            <View className="flex-1 rounded-2xl bg-stone-surface px-4 py-3">
              <Text className="font-body text-[12px] text-text-secondary">Total income</Text>
              <Text className="mt-1 font-heading-bold text-[20px] text-success" numberOfLines={1}>{money(income)}</Text>
            </View>
          ) : null}
        </View>

        {/* Meta */}
        {txns != null ? (
          <Text className="mt-3 font-body text-[13px] text-text-secondary">{txns} transactions analysed</Text>
        ) : null}

        {/* Top categories */}
        {cats.length ? (
          <View className="mt-4 border-t border-black/[0.06] pt-4">
            <Text className="mb-3 font-body-medium text-[13px] text-text-secondary">Top categories</Text>
            <View className="gap-3">
              {cats.slice(0, 5).map((c, i) => {
                const pct = Math.max(0.04, parseMoney(c.total) / maxCat);
                const color = CAT_COLORS[i % CAT_COLORS.length];
                const pctLabel = c.percentage ? `  ·  ${String(c.percentage).replace('%', '')}%` : '';
                return (
                  <View key={`${c.category}-${i}`}>
                    <View className="mb-1.5 flex-row items-center justify-between gap-3">
                      <Text className="flex-1 font-body text-[14px] text-text-primary" numberOfLines={1}>{c.category}</Text>
                      <Text className="font-body-medium text-[14px] text-text-primary">{money(c.total)}{pctLabel}</Text>
                    </View>
                    <View className="h-2 overflow-hidden rounded-full bg-stone-surface">
                      <Animated.View
                        entering={FadeInUp.duration(400)}
                        style={{ width: `${pct * 100}%`, backgroundColor: color }}
                        className="h-full rounded-full"
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>
    </CardContainer>
  );
}
