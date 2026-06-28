import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Invoice02Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import { CardContainer, CardErrorFallback, parseMoney, type InsightCard } from './shared';

const CAT_COLORS = ['#0A7CFF', '#34C759', '#FF9F0A', '#FF375F', '#AF52DE'];

type Category = { category: string; total: string; percentage?: string };

function money(value: string | number | null | undefined, currency: string): string {
  if (value === null || value === undefined) return '—';
  const raw = String(value).trim();
  if (!raw) return '—';
  return currency ? `${currency} ${raw}`.trim() : raw;
}

export function StatementSummaryCard({ card }: { card: InsightCard }) {
  const d = (card.data ?? {}) as Record<string, unknown>;

  const currency = typeof d.currency === 'string' ? d.currency : '';
  const bank = typeof d.bank_name === 'string' ? d.bank_name : 'Bank statement';
  const spending =
    typeof d.total_spending === 'string' || typeof d.total_spending === 'number'
      ? d.total_spending
      : null;
  const income =
    typeof d.total_income === 'string' || typeof d.total_income === 'number'
      ? d.total_income
      : null;
  const txns = typeof d.transaction_count === 'number' ? d.transaction_count : null;
  const months = typeof d.months_covered === 'number' ? d.months_covered : null;
  const periodStart = typeof d.period_start === 'string' ? d.period_start : null;
  const periodEnd = typeof d.period_end === 'string' ? d.period_end : null;
  const cats: Category[] = Array.isArray(d.top_categories)
    ? (d.top_categories as Category[])
    : [];

  // spending=0 is valid — only bail when truly absent
  const spendingAbsent = spending === null || spending === undefined || spending === '';
  if (spendingAbsent || cats.length === 0) return <CardErrorFallback />;

  const hasIncome = income !== null && income !== undefined && income !== '' && parseMoney(income) > 0;
  const period =
    periodStart !== null && periodEnd !== null
      ? `${periodStart} – ${periodEnd}`
      : months !== null
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
            <Text className="font-heading-semibold text-[16px] text-text-primary" numberOfLines={1}>
              {bank}
            </Text>
            {period ? (
              <Text className="font-body text-[13px] text-text-secondary">{period}</Text>
            ) : null}
          </View>
        </View>

        {/* Totals */}
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-stone-surface px-4 py-3">
            <Text className="font-body text-[12px] text-text-secondary">Total spending</Text>
            <Text
              className="mt-1 font-heading-bold text-[20px] text-text-primary"
              numberOfLines={1}>
              {money(spending, currency)}
            </Text>
          </View>
          {hasIncome ? (
            <View className="flex-1 rounded-2xl bg-stone-surface px-4 py-3">
              <Text className="font-body text-[12px] text-text-secondary">Total income</Text>
              <Text
                className="mt-1 font-heading-bold text-[20px] text-success"
                numberOfLines={1}>
                {money(income, currency)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Meta */}
        {txns !== null ? (
          <Text className="mt-3 font-body text-[13px] text-text-secondary">
            {txns} transactions analysed
          </Text>
        ) : null}

        {/* Top categories */}
        {cats.length > 0 ? (
          <View className="mt-4 border-t border-black/[0.06] pt-4">
            <Text className="mb-3 font-body-medium text-[13px] text-text-secondary">
              Top categories
            </Text>
            <View className="gap-3">
              {cats.slice(0, 5).map((c, i) => {
                const pct = Math.max(0.04, parseMoney(c.total) / maxCat);
                const color = CAT_COLORS[i % CAT_COLORS.length];
                const pctLabel =
                  c.percentage !== undefined && c.percentage !== null
                    ? `  ·  ${String(c.percentage).replace('%', '')}%`
                    : '';
                return (
                  <View key={`${c.category}-${i}`}>
                    <View className="mb-1.5 flex-row items-center justify-between gap-3">
                      <Text
                        className="flex-1 font-body text-[14px] text-text-primary"
                        numberOfLines={1}>
                        {c.category}
                      </Text>
                      <Text className="font-body-medium text-[14px] text-text-primary">
                        {money(c.total, currency)}
                        {pctLabel}
                      </Text>
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
