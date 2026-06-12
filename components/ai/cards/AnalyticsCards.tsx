import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { CardContainer, CardErrorFallback, parseMoney, type InsightCard } from './shared';

export function SubscriptionAuditCard({ card }: { card: InsightCard }) {
  const totalMonthly = card.data?.total_monthly as string;
  const subs = (card.data?.subscriptions ?? []) as { name: string; amount: string; frequency: string; status?: string }[];
  const tip = card.data?.savings_tip as string;

  if (!subs.length) return <CardErrorFallback />;

  return (
    <CardContainer>
      <View className="py-2">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-heading-semibold text-base text-text-primary">{card.title || 'Subscriptions'}</Text>
          <Text className="font-body-medium text-sm text-coral-red">${totalMonthly}/mo</Text>
        </View>
        <View className="gap-2.5">
          {subs.slice(0, 6).map((sub, i) => (
            <Animated.View key={`${sub.name}-${i}`} entering={FadeInUp.duration(250).delay(i * 60)} className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2.5">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-stone-surface">
                  <Text className="font-body-medium text-xs text-text-primary">{sub.name.charAt(0)}</Text>
                </View>
                <View>
                  <Text className="font-body-medium text-sm text-text-primary">{sub.name}</Text>
                  <Text className="font-body text-xs text-text-tertiary">{sub.frequency}</Text>
                </View>
              </View>
              <Text className="font-body-medium text-sm tabular-nums text-text-primary">${sub.amount}</Text>
            </Animated.View>
          ))}
        </View>
        {tip && <Text className="mt-3 font-body text-xs leading-4 text-text-secondary">{tip}</Text>}
      </View>
    </CardContainer>
  );
}

export function RunwayCard({ card }: { card: InsightCard }) {
  const months = (card.data?.months as number) ?? 0;
  const days = (card.data?.days as number) ?? 0;
  const status = (card.data?.status as string) ?? 'healthy';
  const dailyBurn = card.data?.daily_burn as string;

  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    healthy: { bg: 'bg-meadow-green/10', text: 'text-meadow-green', dot: '#00ca48' },
    caution: { bg: 'bg-sunburst-yellow/10', text: 'text-deep-amber', dot: '#d48f00' },
    critical: { bg: 'bg-coral-red/10', text: 'text-coral-red', dot: '#ff2b3a' },
  };
  const colors = statusColors[status] ?? statusColors.healthy;

  return (
    <Animated.View entering={FadeInUp.duration(300)} className="my-2">
      <View className="rounded-2xl border border-black/[0.06] bg-parchment-card p-4">
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="font-body text-xs text-text-secondary">Financial Runway</Text>
            <Text className="mt-1 font-heading-bold text-2xl text-text-primary">
              {months > 12 ? '12+' : months} {months === 1 ? 'month' : 'months'}
              {days > 0 && months < 12 ? `, ${days}d` : ''}
            </Text>
          </View>
          <View className={`flex-row items-center gap-1.5 rounded-full ${colors.bg} px-2.5 py-1`}>
            <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.dot }} />
            <Text className={`font-body-medium text-xs capitalize ${colors.text}`}>{status}</Text>
          </View>
        </View>
        {dailyBurn && <Text className="mt-2 font-body text-xs text-text-secondary">Daily burn: ${dailyBurn}</Text>}
      </View>
    </Animated.View>
  );
}

export function DepositPatternCard({ card }: { card: InsightCard }) {
  const frequency = (card.data?.frequency as string) ?? 'irregular';
  const avgAmount = card.data?.average_amount as string;
  const streak = (card.data?.streak as number) ?? 0;
  const consistency = (card.data?.consistency as number) ?? 0;
  const barWidth = Math.max(8, Math.min(100, consistency));

  return (
    <CardContainer>
      <View className="py-2">
        <Text className="mb-3 font-heading-semibold text-base text-text-primary">{card.title || 'Deposit Pattern'}</Text>
        <View className="flex-row flex-wrap gap-y-3">
          <View className="w-1/2 pr-3">
            <Text className="font-body text-xs text-text-secondary">Frequency</Text>
            <Text className="mt-0.5 font-body-medium text-sm capitalize text-text-primary">{frequency}</Text>
          </View>
          <View className="w-1/2">
            <Text className="font-body text-xs text-text-secondary">Average</Text>
            <Text className="mt-0.5 font-body-medium text-sm text-text-primary">${avgAmount}</Text>
          </View>
          <View className="w-1/2 pr-3">
            <Text className="font-body text-xs text-text-secondary">Streak</Text>
            <Text className="mt-0.5 font-body-medium text-sm text-text-primary">{streak} deposits</Text>
          </View>
          <View className="w-1/2">
            <Text className="font-body text-xs text-text-secondary">Consistency</Text>
            <Text className="mt-0.5 font-body-medium text-sm text-text-primary">{consistency}%</Text>
          </View>
        </View>
        <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-surface">
          <Animated.View entering={FadeInUp.duration(500)} className="h-full rounded-full bg-meadow-green" style={{ width: `${barWidth}%` }} />
        </View>
      </View>
    </CardContainer>
  );
}

export function YieldSummaryCard({ card }: { card: InsightCard }) {
  const totalEarned = card.data?.total_earned as string;
  const monthEarned = card.data?.month_earned as string;
  const currentAPY = card.data?.current_apy as string;
  const stashBalance = card.data?.stash_balance as string;
  const dailyEstimate = card.data?.daily_estimate as string;

  return (
    <Animated.View entering={FadeInUp.duration(300)} className="my-2">
      <View className="rounded-2xl border border-meadow-green/20 bg-meadow-green/5 p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-heading-semibold text-base text-text-primary">{card.title || 'Stash Yield'}</Text>
          <View className="rounded-full bg-meadow-green/15 px-2 py-0.5">
            <Text className="font-body-medium text-xs text-meadow-green">{currentAPY}% APY</Text>
          </View>
        </View>
        <View className="flex-row flex-wrap gap-y-3">
          <View className="w-1/2 pr-3">
            <Text className="font-body text-xs text-text-secondary">Total Earned</Text>
            <Text className="mt-0.5 font-heading-semibold text-lg text-meadow-green">${totalEarned}</Text>
          </View>
          <View className="w-1/2">
            <Text className="font-body text-xs text-text-secondary">This Month</Text>
            <Text className="mt-0.5 font-body-medium text-sm text-text-primary">${monthEarned}</Text>
          </View>
          <View className="w-1/2 pr-3">
            <Text className="font-body text-xs text-text-secondary">Stash Balance</Text>
            <Text className="mt-0.5 font-body-medium text-sm text-text-primary">${stashBalance}</Text>
          </View>
          <View className="w-1/2">
            <Text className="font-body text-xs text-text-secondary">Daily Estimate</Text>
            <Text className="mt-0.5 font-body-medium text-sm text-text-primary">${dailyEstimate}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export function ComparisonCard({ card }: { card: InsightCard }) {
  const metricLabel = (card.data?.metric_label as string) ?? '';
  const current = (card.data?.current ?? {}) as { label: string; value: string; color?: string };
  const previous = (card.data?.previous ?? {}) as { label: string; value: string; color?: string };
  const deltaPct = card.data?.delta_pct as string;
  const sentiment = card.sentiment ?? 'neutral';

  const currentVal = parseFloat(current.value ?? '0');
  const previousVal = parseFloat(previous.value ?? '0');
  const maxVal = Math.max(currentVal, previousVal, 1);

  return (
    <CardContainer>
      <View className="py-2">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-heading-semibold text-base text-text-primary">{card.title || metricLabel}</Text>
          {deltaPct && (
            <Text className={`font-body-medium text-sm ${sentiment === 'positive' ? 'text-meadow-green' : sentiment === 'negative' ? 'text-coral-red' : 'text-text-secondary'}`}>
              {parseFloat(deltaPct) >= 0 ? '+' : ''}{deltaPct}%
            </Text>
          )}
        </View>
        <View className="gap-3">
          <View className="gap-1.5">
            <View className="flex-row items-center justify-between">
              <Text className="font-body text-xs text-text-secondary">{current.label}</Text>
              <Text className="font-body-medium text-sm tabular-nums text-text-primary">${current.value}</Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-stone-surface">
              <Animated.View entering={FadeInUp.duration(400)} className="h-full rounded-full" style={{ width: `${(currentVal / maxVal) * 100}%`, backgroundColor: current.color ?? '#FF3E00' }} />
            </View>
          </View>
          <View className="gap-1.5">
            <View className="flex-row items-center justify-between">
              <Text className="font-body text-xs text-text-secondary">{previous.label}</Text>
              <Text className="font-body-medium text-sm tabular-nums text-text-primary">${previous.value}</Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-stone-surface">
              <Animated.View entering={FadeInUp.duration(400).delay(100)} className="h-full rounded-full" style={{ width: `${(previousVal / maxVal) * 100}%`, backgroundColor: previous.color ?? '#8C8C8C' }} />
            </View>
          </View>
        </View>
      </View>
    </CardContainer>
  );
}
