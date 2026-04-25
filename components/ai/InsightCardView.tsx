import React, { Component, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { PinIcon, ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import type { InsightCard } from '@/api/types/ai';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { useMiriamHubStore } from '@/stores/miriamHubStore';
import type { PinnedInsight } from '@/stores/miriamHubStore';

/* ─── Error Boundary ─── */

interface EBProps {
  children: React.ReactNode;
  cardType: string;
}

class InsightCardErrorBoundary extends Component<EBProps, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.warn(`Insight card error (${this.props.cardType}):`, error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View className="my-2 rounded-2xl border border-red-100 bg-red-50 p-4">
        <Text className="font-body-medium text-sm text-red-800">
          Unable to display this insight
        </Text>
      </View>
    );
  }
}

function CardErrorFallback() {
  return (
    <View className="my-2 rounded-2xl border border-black/[0.08] bg-white p-4">
      <Text className="font-body text-sm text-text-secondary">Insight unavailable</Text>
    </View>
  );
}

/* ─── Generic Wrapper ─── */

function CardContainer({
  children,
  onPin,
  isPinned,
  accent = false,
}: {
  children: React.ReactNode;
  onPin?: () => void;
  isPinned?: boolean;
  accent?: boolean;
}) {
  const borderColor = accent ? 'border-primary' : 'border-black/[0.08]';

  return (
    <Animated.View entering={FadeInUp.duration(300)} className="my-2">
      <View className={`bg-white ${borderColor} overflow-hidden rounded-2xl border`}>
        {onPin && (
          <View className="absolute right-3 top-3 z-10 flex-row gap-2">
            <Pressable
              onPress={onPin}
              className={`h-8 w-8 items-center justify-center rounded-full ${isPinned ? 'bg-primary' : 'bg-black/[0.06]'}`}
              accessibilityRole="button"
              accessibilityLabel={isPinned ? 'Unpin insight' : 'Pin to Miriam Hub'}>
              <HugeiconsIcon icon={PinIcon} size={16} color={isPinned ? '#FFFFFF' : '#8C8C8C'} />
            </Pressable>
          </View>
        )}
        {children}
      </View>
    </Animated.View>
  );
}

/* ─── Stat Grid ─── */

function StatGridCard({
  card,
  onPin,
  isPinned,
}: {
  card: InsightCard;
  onPin?: () => void;
  isPinned?: boolean;
}) {
  const stats = (Array.isArray(card.data) ? card.data : card.data?.stats) as
    | { label: string; value: string; change?: string; positive?: boolean; sentiment?: string }[]
    | undefined;

  if (!Array.isArray(stats)) {
    console.warn('[InsightCardView] stat_grid missing stats array');
    return <CardErrorFallback />;
  }

  return (
    <CardContainer onPin={onPin} isPinned={isPinned} accent={card.data?.accent as boolean}>
      <View className="p-4">
        {card.title && (
          <Text className="font-heading-semibold mb-3 text-base text-text-primary">
            {card.title}
          </Text>
        )}
        <View className="flex-row flex-wrap" style={{ gap: 12 }}>
          {stats.map((s, i) => (
            <View key={i} className="min-w-[100px] flex-1">
              <Text className="mb-1 font-body text-xs text-text-secondary">{s.label}</Text>
              <Text className="font-heading-bold text-2xl text-text-primary">{s.value}</Text>
              {s.change && (
                <Text
                  className={`mt-0.5 font-body-medium text-xs ${s.positive || s.sentiment === 'positive' ? 'text-success' : 'text-red-500'}`}>
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

/* ─── Chart (Bar / Line) ─── */

function ChartCard({
  card,
  onPin,
  isPinned,
}: {
  card: InsightCard;
  onPin?: () => void;
  isPinned?: boolean;
}) {
  const raw = (card.data?.points ??
    card.data?.data ??
    (Array.isArray(card.data) ? card.data : undefined)) as
    | { label: string; value: number }[]
    | undefined;
  if (!Array.isArray(raw) || raw.length === 0) {
    console.warn('[InsightCardView] chart missing data array');
    return <CardErrorFallback />;
  }

  const barData = raw.map((d) => ({ label: d.label, value: d.value, frontColor: '#FF2E01' }));
  const isBar =
    (card.data?.chartType as string) === 'bar' ||
    (card.data?.chart_type as string) === 'bar' ||
    raw.length <= 7;

  return (
    <CardContainer onPin={onPin} isPinned={isPinned} accent={card.data?.accent as boolean}>
      <View className="p-4">
        {card.title && (
          <Text className="font-heading-semibold mb-3 text-base text-text-primary">
            {card.title}
          </Text>
        )}
        <View className="items-center">
          {isBar ? (
            <BarChart
              data={barData}
              barWidth={20}
              spacing={14}
              height={140}
              barBorderRadius={6}
              yAxisTextStyle={{ fontSize: 10, color: '#8C8C8C' }}
              hideRules
              hideYAxisText
            />
          ) : (
            <LineChart
              data={raw.map((d) => ({ label: d.label, value: d.value }))}
              height={140}
              color="#FF2E01"
              thickness={2.5}
              dataPointsColor="#FF2E01"
              dataPointsRadius={3}
              yAxisTextStyle={{ fontSize: 10, color: '#8C8C8C' }}
              hideRules
            />
          )}
        </View>
      </View>
    </CardContainer>
  );
}

/* ─── Breakdown ─── */

function BreakdownCard({
  card,
  onPin,
  isPinned,
}: {
  card: InsightCard;
  onPin?: () => void;
  isPinned?: boolean;
}) {
  const items = (Array.isArray(card.data) ? card.data : card.data?.items) as
    | { label: string; value?: string; amount?: number; percent?: number; color?: string }[]
    | undefined;

  if (!Array.isArray(items)) {
    console.warn('[InsightCardView] breakdown missing items array');
    return <CardErrorFallback />;
  }

  return (
    <CardContainer onPin={onPin} isPinned={isPinned} accent={card.data?.accent as boolean}>
      <View className="p-4">
        {card.title && (
          <Text className="font-heading-semibold mb-3 text-base text-text-primary">
            {card.title}
          </Text>
        )}
        <View className="gap-3">
          {items.map((item, i) => (
            <View key={i} className="flex-row items-center">
              <Text className="flex-1 font-body-medium text-sm text-text-primary">
                {item.label}
              </Text>
              <Text className="font-body-medium text-sm text-text-primary">
                {item.value ??
                  (item.amount !== undefined && item.amount !== null
                    ? `$${Number(item.amount).toFixed(2)}`
                    : '')}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </CardContainer>
  );
}

/* ─── Progress ─── */

function ProgressCard({
  card,
  onPin,
  isPinned,
}: {
  card: InsightCard;
  onPin?: () => void;
  isPinned?: boolean;
}) {
  const goal = card.data?.goal as string;
  const current = card.data?.current as number | undefined;
  const target = card.data?.target as number | undefined;

  if (typeof current !== 'number' || typeof target !== 'number') {
    console.warn('[InsightCardView] progress missing current/target');
    return <CardErrorFallback />;
  }

  const pct = Math.min(Math.max(current / target, 0), 1);

  return (
    <CardContainer onPin={onPin} isPinned={isPinned} accent={card.data?.accent as boolean}>
      <View className="p-4">
        {card.title && (
          <Text className="font-heading-semibold mb-2 text-base text-text-primary">
            {card.title}
          </Text>
        )}
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="font-body text-sm text-text-secondary">{goal}</Text>
          <Text className="font-body-medium text-sm text-text-primary">
            {Math.round(pct * 100)}%
          </Text>
        </View>
        <View className="h-2 overflow-hidden rounded-full bg-gray-100">
          <View className="h-full rounded-full bg-primary" style={{ width: `${pct * 100}%` }} />
        </View>
        <Text className="mt-1.5 font-body text-xs text-text-tertiary">
          {current} of {target}
        </Text>
      </View>
    </CardContainer>
  );
}

/* ─── Alert ─── */

function AlertCard({
  card,
  onPin,
  isPinned,
}: {
  card: InsightCard;
  onPin?: () => void;
  isPinned?: boolean;
}) {
  const severity = (card.data?.severity as string) ?? 'info';
  const bgMap: Record<string, string> = {
    high: 'bg-red-50',
    medium: 'bg-amber-50',
    low: 'bg-blue-50',
    info: 'bg-white',
  };
  const borderMap: Record<string, string> = {
    high: 'border-red-200',
    medium: 'border-amber-200',
    low: 'border-blue-200',
    info: 'border-black/[0.08]',
  };

  return (
    <Animated.View entering={FadeInUp.duration(300)} className="my-2">
      <View className={`rounded-2xl ${bgMap[severity]} ${borderMap[severity]} border p-4`}>
        {card.title && (
          <Text
            className={`font-heading-semibold mb-1 text-base ${severity === 'high' ? 'text-red-800' : severity === 'medium' ? 'text-amber-800' : 'text-text-primary'}`}>
            {card.title}
          </Text>
        )}
        <Text className="font-body text-sm text-text-secondary">
          {card.data?.description as string}
        </Text>
        {onPin && (
          <Pressable
            onPress={onPin}
            className="absolute right-3 top-3 h-8 w-8 items-center justify-center rounded-full bg-white/80"
            accessibilityRole="button"
            accessibilityLabel="Pin to Miriam Hub">
            <HugeiconsIcon icon={PinIcon} size={16} color={isPinned ? '#FF2E01' : '#8C8C8C'} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

/* ─── Highlight ─── */

function HighlightCard({
  card,
  onPin,
  isPinned,
}: {
  card: InsightCard;
  onPin?: () => void;
  isPinned?: boolean;
}) {
  const emoji = card.data?.emoji as string;
  const label = card.data?.label as string;

  return (
    <CardContainer onPin={onPin} isPinned={isPinned} accent>
      <View className="flex-row items-start gap-3 p-4">
        {emoji && <Text className="text-2xl">{emoji}</Text>}
        <View className="flex-1">
          {card.title && (
            <Text className="font-heading-semibold text-base text-text-primary">{card.title}</Text>
          )}
          {label && <Text className="mt-1 font-body text-sm text-text-secondary">{label}</Text>}
        </View>
      </View>
    </CardContainer>
  );
}

/* ─── Main Export ─── */

export function InsightCardView({
  card,
  onPin,
  isPinned,
}: {
  card: InsightCard;
  onPin?: () => void;
  isPinned?: boolean;
}) {
  const { pinInsight, unpinInsight } = useMiriamHubStore();

  const handlePin = useCallback(() => {
    if (isPinned) {
      // Find the pinned insight id to unpin
      const pinned = useMiriamHubStore
        .getState()
        .pinnedInsights.find((p) => p.card.type === card.type && p.card.title === card.title);
      if (pinned) unpinInsight(pinned.id);
    } else {
      const newInsight: PinnedInsight = {
        id: `pin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        card,
        pinnedAt: new Date().toISOString(),
      };
      pinInsight(newInsight);
    }
  }, [isPinned, card, pinInsight, unpinInsight]);

  const Wrap = ({ children }: { children: React.ReactNode }) => (
    <InsightCardErrorBoundary cardType={card.type}>{children}</InsightCardErrorBoundary>
  );

  switch (card.type) {
    case 'stat_grid':
      return (
        <Wrap>
          <StatGridCard card={card} onPin={handlePin} isPinned={isPinned} />
        </Wrap>
      );
    case 'chart':
      return (
        <Wrap>
          <ChartCard card={card} onPin={handlePin} isPinned={isPinned} />
        </Wrap>
      );
    case 'breakdown':
      return (
        <Wrap>
          <BreakdownCard card={card} onPin={handlePin} isPinned={isPinned} />
        </Wrap>
      );
    case 'progress':
      return (
        <Wrap>
          <ProgressCard card={card} onPin={handlePin} isPinned={isPinned} />
        </Wrap>
      );
    case 'alert':
      return (
        <Wrap>
          <AlertCard card={card} onPin={handlePin} isPinned={isPinned} />
        </Wrap>
      );
    case 'highlight':
      return (
        <Wrap>
          <HighlightCard card={card} onPin={handlePin} isPinned={isPinned} />
        </Wrap>
      );
    default:
      // Unknown card types are silently skipped
      return null;
  }
}
