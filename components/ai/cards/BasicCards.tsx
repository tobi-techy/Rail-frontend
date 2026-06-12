import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { CardContainer, CardErrorFallback, type InsightCard } from './shared';

export function StatGridCard({ card }: { card: InsightCard }) {
  const stats = (Array.isArray(card.data) ? card.data : card.data?.stats) as
    | { label: string; value: string; change?: string; positive?: boolean; sentiment?: string }[]
    | undefined;

  if (!Array.isArray(stats)) return <CardErrorFallback />;

  return (
    <CardContainer>
      <View className="py-2">
        {card.title && (
          <Text className="mb-3 font-heading-semibold text-base text-text-primary">{card.title}</Text>
        )}
        <View className="flex-row flex-wrap" style={{ gap: 16 }}>
          {stats.map((s, i) => (
            <View key={i} className="min-w-[90px] flex-1">
              <Text className="mb-1 font-body text-[13px] text-text-secondary">{s.label}</Text>
              <Text className="font-heading-bold text-[22px] leading-tight text-text-primary">{s.value}</Text>
              {s.change && (
                <Text className={`mt-0.5 font-body-medium text-xs ${s.positive || s.sentiment === 'positive' ? 'text-success' : 'text-coral-red'}`}>
                  {s.change}
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>
    </CardContainer>
  );
}

export function ProgressCard({ card }: { card: InsightCard }) {
  const goal = card.data?.goal as string;
  const current = card.data?.current as number | undefined;
  const target = card.data?.target as number | undefined;

  if (typeof current !== 'number' || typeof target !== 'number') return <CardErrorFallback />;
  const pct = Math.min(Math.max(current / target, 0), 1);

  return (
    <CardContainer accent={card.data?.accent as boolean}>
      <View className="p-4">
        {card.title && (
          <Text className="mb-2 font-heading-semibold text-base text-text-primary">{card.title}</Text>
        )}
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="font-body text-sm text-text-secondary">{goal}</Text>
          <Text className="font-body-medium text-sm text-text-primary">{Math.round(pct * 100)}%</Text>
        </View>
        <View className="h-2 overflow-hidden rounded-full bg-stone-surface">
          <View className="h-full rounded-full bg-primary" style={{ width: `${pct * 100}%` }} />
        </View>
        <Text className="mt-1.5 font-body text-xs text-text-tertiary">{current} of {target}</Text>
      </View>
    </CardContainer>
  );
}

export function AlertCard({ card }: { card: InsightCard }) {
  const severity = (card.data?.severity as string) ?? 'info';
  const bgMap: Record<string, string> = { high: 'bg-coral-red/10', medium: 'bg-sunburst-yellow/10', low: 'bg-blue-50', info: 'bg-white' };
  const borderMap: Record<string, string> = { high: 'border-red-200', medium: 'border-amber-200', low: 'border-blue-200', info: 'border-black/[0.08]' };

  return (
    <Animated.View entering={FadeInUp.duration(300)} className="my-2">
      <View className={`rounded-2xl ${bgMap[severity]} ${borderMap[severity]} border p-4`}>
        {card.title && (
          <Text className={`mb-1 font-heading-semibold text-base ${severity === 'high' ? 'text-red-800' : severity === 'medium' ? 'text-amber-800' : 'text-text-primary'}`}>
            {card.title}
          </Text>
        )}
        <Text className="font-body text-sm text-text-secondary">{card.data?.description as string}</Text>
      </View>
    </Animated.View>
  );
}

export function HighlightCard({ card }: { card: InsightCard }) {
  const emoji = card.data?.emoji as string;
  const label = card.data?.label as string;

  return (
    <CardContainer accent>
      <View className="flex-row items-start gap-3 p-4">
        {emoji && <Text className="text-2xl">{emoji}</Text>}
        <View className="flex-1">
          {card.title && <Text className="font-heading-semibold text-base text-text-primary">{card.title}</Text>}
          {label && <Text className="mt-1 font-body text-sm text-text-secondary">{label}</Text>}
        </View>
      </View>
    </CardContainer>
  );
}

export function TipCard({ card }: { card: InsightCard }) {
  const emoji = (card.data?.emoji as string) ?? '💡';
  const message = (card.data?.message as string) ?? '';
  const severity = (card.data?.severity as string) ?? 'info';
  const bgMap: Record<string, string> = { urgent: 'bg-coral-red/10', important: 'bg-sunburst-yellow/10', info: 'bg-primary/5' };

  return (
    <CardContainer>
      <View className={`flex-row items-start gap-3 rounded-2xl p-4 ${bgMap[severity] ?? bgMap.info}`}>
        <Text className="text-xl">{emoji}</Text>
        <View className="flex-1">
          {card.title && <Text className="mb-1 font-heading-semibold text-sm text-text-primary">{card.title}</Text>}
          <Text className="font-body text-sm leading-5 text-text-secondary">{message}</Text>
        </View>
      </View>
    </CardContainer>
  );
}
