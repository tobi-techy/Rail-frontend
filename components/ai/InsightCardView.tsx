import React, { Component, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import type { InsightCard } from '@/api/types/ai';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import { ANALYTICS_EVENTS, useAnalytics } from '@/utils/analytics';

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
      <View className="my-2 rounded-2xl border border-red-100 bg-coral-red/10 p-4">
        <Text className="font-body-medium text-sm text-red-800">
          Unable to display this insight
        </Text>
      </View>
    );
  }
}

function CardErrorFallback() {
  return (
    <View className="my-2 rounded-2xl border border-black/[0.08] bg-parchment-card p-4">
      <Text className="font-body text-sm text-text-secondary">Insight unavailable</Text>
    </View>
  );
}

/* ─── Generic Wrapper ─── */

function CardContainer({
  children,
  accent = false,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Animated.View entering={FadeInUp.duration(300)} className="my-3">
      <View className="overflow-hidden rounded-2xl">{children}</View>
    </Animated.View>
  );
}

/* ─── Stat Grid ─── */

function StatGridCard({ card }: { card: InsightCard }) {
  const stats = (Array.isArray(card.data) ? card.data : card.data?.stats) as
    | { label: string; value: string; change?: string; positive?: boolean; sentiment?: string }[]
    | undefined;

  if (!Array.isArray(stats)) {
    console.warn('[InsightCardView] stat_grid missing stats array');
    return <CardErrorFallback />;
  }

  return (
    <CardContainer>
      <View className="py-2">
        {card.title && (
          <Text className="mb-3 font-heading-semibold text-base text-text-primary">
            {card.title}
          </Text>
        )}
        <View className="flex-row flex-wrap" style={{ gap: 16 }}>
          {stats.map((s, i) => (
            <View key={i} className="min-w-[90px] flex-1">
              <Text className="mb-1 font-body text-xs text-text-secondary">{s.label}</Text>
              <Text className="font-heading-semibold text-lg text-text-primary">{s.value}</Text>
              {s.change && (
                <Text
                  className={`mt-0.5 font-body-medium text-xs ${s.positive || s.sentiment === 'positive' ? 'text-success' : 'text-coral-red'}`}>
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

function ChartCard({ card }: { card: InsightCard }) {
  const raw = (card.data?.points ??
    card.data?.data ??
    (Array.isArray(card.data) ? card.data : undefined)) as
    | { label: string; value: number }[]
    | undefined;
  if (!Array.isArray(raw) || raw.length === 0) {
    console.warn('[InsightCardView] chart missing data array');
    return <CardErrorFallback />;
  }

  const barData = raw.map((d) => ({ label: d.label, value: d.value, frontColor: '#ff3e00' }));
  const isBar =
    (card.data?.chartType as string) === 'bar' ||
    (card.data?.chart_type as string) === 'bar' ||
    raw.length <= 7;

  return (
    <CardContainer>
      <View className="py-2">
        {card.title && (
          <Text className="mb-3 font-heading-semibold text-base text-text-primary">
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
              color="#ff3e00"
              thickness={2.5}
              dataPointsColor="#ff3e00"
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

function BreakdownCard({ card }: { card: InsightCard }) {
  const items = (Array.isArray(card.data) ? card.data : card.data?.items) as
    | { label: string; value?: string; amount?: number; percent?: number; color?: string }[]
    | undefined;

  if (!Array.isArray(items) || items.length === 0) {
    return <CardErrorFallback />;
  }

  const COLORS = ['#ff3e00', '#FF6B4A', '#FFB199', '#1A7A6D', '#4ECDC4', '#95E1D3', '#8C8C8C'];
  const pieData = items.map((item, i) => ({
    value:
      item.amount !== undefined && item.amount !== null
        ? Number(item.amount)
        : parseFloat((item.value ?? '0').replace(/[^0-9.]/g, '')) || 0,
    color: item.color ?? COLORS[i % COLORS.length],
    text: '',
  }));
  const total = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <CardContainer>
      <View className="py-2">
        {card.title && (
          <Text className="mb-4 font-heading-semibold text-base text-text-primary">
            {card.title}
          </Text>
        )}
        <View className="flex-row items-center">
          <PieChart
            data={pieData}
            donut
            radius={52}
            innerRadius={34}
            innerCircleColor="#FAFAF8"
            centerLabelComponent={() => (
              <Text className="font-heading-bold text-sm text-text-primary">
                ${total.toFixed(0)}
              </Text>
            )}
          />
          <View className="ml-5 flex-1 gap-2.5">
            {items.map((item, i) => {
              const amt =
                item.amount !== undefined && item.amount !== null
                  ? Number(item.amount)
                  : parseFloat((item.value ?? '0').replace(/[^0-9.]/g, '')) || 0;
              return (
                <View key={i} className="flex-row items-center">
                  <View
                    className="mr-2.5 h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color ?? COLORS[i % COLORS.length] }}
                  />
                  <Text className="flex-1 font-body text-[13px] text-text-secondary">
                    {item.label}
                  </Text>
                  <Text className="font-body-medium text-[13px] text-text-primary">
                    ${amt.toFixed(2)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </CardContainer>
  );
}

/* ─── Progress ─── */

function ProgressCard({ card }: { card: InsightCard }) {
  const goal = card.data?.goal as string;
  const current = card.data?.current as number | undefined;
  const target = card.data?.target as number | undefined;

  if (typeof current !== 'number' || typeof target !== 'number') {
    console.warn('[InsightCardView] progress missing current/target');
    return <CardErrorFallback />;
  }

  const pct = Math.min(Math.max(current / target, 0), 1);

  return (
    <CardContainer accent={card.data?.accent as boolean}>
      <View className="p-4">
        {card.title && (
          <Text className="mb-2 font-heading-semibold text-base text-text-primary">
            {card.title}
          </Text>
        )}
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="font-body text-sm text-text-secondary">{goal}</Text>
          <Text className="font-body-medium text-sm text-text-primary">
            {Math.round(pct * 100)}%
          </Text>
        </View>
        <View className="h-2 overflow-hidden rounded-full bg-stone-surface">
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

function AlertCard({ card }: { card: InsightCard }) {
  const severity = (card.data?.severity as string) ?? 'info';
  const bgMap: Record<string, string> = {
    high: 'bg-coral-red/10',
    medium: 'bg-sunburst-yellow/10',
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
            className={`mb-1 font-heading-semibold text-base ${severity === 'high' ? 'text-red-800' : severity === 'medium' ? 'text-amber-800' : 'text-text-primary'}`}>
            {card.title}
          </Text>
        )}
        <Text className="font-body text-sm text-text-secondary">
          {card.data?.description as string}
        </Text>
      </View>
    </Animated.View>
  );
}

/* ─── Highlight ─── */

function HighlightCard({ card }: { card: InsightCard }) {
  const emoji = card.data?.emoji as string;
  const label = card.data?.label as string;

  return (
    <CardContainer accent>
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

/* ─── Financial Audit ─── */

type AuditMetric = { label?: string; value?: string; sentiment?: string };
type AuditItem = Record<string, any>;

function asArray<T = AuditItem>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function formatLabel(value: unknown) {
  return String(value ?? '')
    .replace(/_/g, ' ')
    .trim();
}

function formatMoney(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) return '$0.00';
  return raw.startsWith('$') ? raw : `$${raw}`;
}

function parseMoney(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function compactMoney(value: unknown) {
  const amount = parseMoney(value);
  const sign = amount < 0 ? '-' : '';
  const absolute = Math.abs(amount);
  if (absolute >= 1_000_000) return `${sign}$${(absolute / 1_000_000).toFixed(1)}M`;
  if (absolute >= 1_000) return `${sign}$${(absolute / 1_000).toFixed(1)}K`;
  return `${sign}$${absolute.toFixed(0)}`;
}

function toneClass(sentiment?: string) {
  if (sentiment === 'positive') return 'text-success';
  if (sentiment === 'negative') return 'text-coral-red';
  return 'text-text-primary';
}

function AuditSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="border-t border-black/[0.06] pt-3">
      <Text className="mb-2 font-body-medium text-xs text-text-secondary">{title}</Text>
      {children}
    </View>
  );
}

function FinancialAuditCard({ card }: { card: InsightCard }) {
  const { track } = useAnalytics();
  const data = (card.data ?? {}) as Record<string, any>;
  const score = (data.score ?? {}) as Record<string, any>;
  const damage = (data.damage ?? data.the_damage ?? {}) as Record<string, any>;
  const snapshot = (data.snapshot ?? {}) as Record<string, any>;
  const period = (data.period ?? {}) as Record<string, any>;
  const coverage = (data.data_coverage ?? {}) as Record<string, any>;
  const metrics = asArray<AuditMetric>(data.metrics).slice(0, 4);
  const contradictions = asArray(data.contradictions).slice(0, 3);
  const topCategories = asArray(data.top_categories ?? data.top_spending_categories).slice(0, 4);
  const risks = asArray(data.risk_flags).slice(0, 3);
  const actions = asArray(data.next_actions ?? data.do_this_today).slice(0, 3);
  const patterns = asArray<string>(data.patterns ?? data.the_pattern).slice(0, 3);
  const monthlyTrend = asArray<Record<string, any>>(data.monthly_trend).slice(-6);
  const totalScore = Number(score.total ?? 0);
  const moneyIn = parseMoney(snapshot.money_in);
  const digitalOut = parseMoney(snapshot.digital_money_out);
  const cashOut = parseMoney(snapshot.receipt_cash_out);
  const totalOut = parseMoney(snapshot.total_money_out);
  const donutData = [
    moneyIn > 0 ? { value: moneyIn, color: '#1A7A6D', text: '' } : null,
    digitalOut > 0 ? { value: digitalOut, color: '#FF3E00', text: '' } : null,
    cashOut > 0 ? { value: cashOut, color: '#FFB199', text: '' } : null,
  ].filter(Boolean) as { value: number; color: string; text: string }[];
  const trendData = monthlyTrend
    .map((month) => ({
      label: String(month.label ?? month.month ?? '').split(' ')[0],
      value: parseMoney(month.money_out),
      frontColor: '#FF3E00',
    }))
    .filter((item) => item.value > 0);

  useEffect(() => {
    track(ANALYTICS_EVENTS.FINANCIAL_AUDIT_RENDERED, {
      score: totalScore,
      sentiment: card.sentiment ?? 'neutral',
      action_count: actions.length,
      risk_count: risks.length,
    });
  }, [actions.length, card.sentiment, risks.length, totalScore, track]);

  return (
    <CardContainer>
      <View className="gap-4 py-2">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="font-heading-semibold text-base text-text-primary">
              {card.title || 'Miriam Audit'}
            </Text>
            <Text className="mt-1 font-body text-sm text-text-secondary">
              {formatLabel(score.status ?? card.subtitle)}
            </Text>
            {(period.label || coverage.months_analyzed) && (
              <Text className="mt-1 font-body text-xs text-text-secondary">
                {period.label
                  ? String(period.label)
                  : `${coverage.months_analyzed} months analyzed`}
              </Text>
            )}
          </View>
          <View className="items-end">
            <Text className={`font-heading-semibold text-2xl ${toneClass(card.sentiment)}`}>
              {totalScore}
            </Text>
            <Text className="font-body text-xs text-text-secondary">/100</Text>
          </View>
        </View>

        {metrics.length > 0 && (
          <View className="flex-row flex-wrap gap-y-3">
            {metrics.map((metric, index) => (
              <View key={`${metric.label}-${index}`} className="w-1/2 pr-4">
                <Text className="font-body text-xs text-text-secondary">{metric.label}</Text>
                <Text
                  className={`mt-0.5 font-body-medium text-[15px] ${toneClass(metric.sentiment)}`}>
                  {metric.value}
                </Text>
              </View>
            ))}
          </View>
        )}

        {(donutData.length > 0 || trendData.length > 0) && (
          <AuditSection title="Audit view">
            <View className="gap-4">
              {donutData.length > 0 && (
                <View className="flex-row items-center gap-4">
                  <PieChart
                    data={donutData}
                    donut
                    radius={46}
                    innerRadius={31}
                    innerCircleColor="#FFFFFF"
                    centerLabelComponent={() => (
                      <View className="items-center">
                        <Text className="font-body-medium text-sm text-text-primary">
                          {compactMoney(totalOut)}
                        </Text>
                        <Text className="font-body text-[10px] text-text-secondary">out</Text>
                      </View>
                    )}
                  />
                  <View className="flex-1 gap-2">
                    {[
                      { label: 'Money in', value: moneyIn, color: '#1A7A6D' },
                      { label: 'Digital out', value: digitalOut, color: '#FF3E00' },
                      { label: 'Cash receipts', value: cashOut, color: '#FFB199' },
                    ]
                      .filter((item) => item.value > 0)
                      .map((item) => (
                        <View key={item.label} className="flex-row items-center gap-2">
                          <View
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <Text className="flex-1 font-body text-xs text-text-secondary">
                            {item.label}
                          </Text>
                          <Text className="font-body-medium text-xs tabular-nums text-text-primary">
                            {compactMoney(item.value)}
                          </Text>
                        </View>
                      ))}
                  </View>
                </View>
              )}

              {trendData.length > 1 && (
                <View>
                  <View className="mb-2 flex-row items-center justify-between">
                    <Text className="font-body text-xs text-text-secondary">Monthly money out</Text>
                    {coverage.average_monthly_money_out && (
                      <Text className="font-body-medium text-xs tabular-nums text-text-primary">
                        Avg {compactMoney(coverage.average_monthly_money_out)}
                      </Text>
                    )}
                  </View>
                  <BarChart
                    data={trendData}
                    height={120}
                    barWidth={18}
                    spacing={12}
                    barBorderRadius={5}
                    hideRules
                    hideYAxisText
                    xAxisLabelTextStyle={{ fontSize: 10, color: '#8C8C8C' }}
                    yAxisTextStyle={{ fontSize: 10, color: '#8C8C8C' }}
                    noOfSections={3}
                  />
                </View>
              )}
            </View>
          </AuditSection>
        )}

        {damage.primary_issue && (
          <AuditSection title="The read">
            <Text className="font-body text-sm leading-5 text-text-primary">
              {String(damage.primary_issue)}
            </Text>
          </AuditSection>
        )}

        {topCategories.length > 0 && (
          <AuditSection title="Top leaks">
            <View className="gap-2.5">
              {topCategories.map((item, index) => {
                const amount = Number.parseFloat(String(item.total ?? '0')) || 0;
                const max = Number.parseFloat(String(topCategories[0]?.total ?? '0')) || 1;
                const width = Math.max(6, Math.min(100, (amount / max) * 100));
                return (
                  <View key={`${item.category}-${index}`} className="gap-1.5">
                    <View className="flex-row items-center justify-between gap-3">
                      <Text
                        className="flex-1 font-body text-sm text-text-primary"
                        numberOfLines={1}>
                        {formatLabel(item.category)}
                      </Text>
                      <Text className="font-body-medium text-sm tabular-nums text-text-primary">
                        {formatMoney(item.total)}
                      </Text>
                    </View>
                    <View className="h-1 overflow-hidden rounded-full bg-black/[0.06]">
                      <View
                        className="h-full rounded-full bg-text-primary"
                        style={{ width: `${width}%` }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </AuditSection>
        )}

        {contradictions.length > 0 && (
          <AuditSection title="Contradictions">
            <View className="gap-2">
              {contradictions.map((item, index) => (
                <Text
                  key={`${item.code}-${index}`}
                  className="font-body text-sm leading-5 text-text-primary">
                  {String(item.take || item.reality || item.claim)}
                </Text>
              ))}
            </View>
          </AuditSection>
        )}

        {patterns.length > 0 && (
          <AuditSection title="Pattern">
            <View className="gap-2">
              {patterns.map((pattern, index) => (
                <Text
                  key={`${pattern}-${index}`}
                  className="font-body text-sm leading-5 text-text-secondary">
                  {pattern}
                </Text>
              ))}
            </View>
          </AuditSection>
        )}

        {risks.length > 0 && (
          <AuditSection title="Risks">
            <View className="gap-2">
              {risks.map((risk, index) => (
                <View key={`${risk.code}-${index}`} className="flex-row justify-between gap-3">
                  <Text className="flex-1 font-body text-sm text-text-primary">
                    {String(risk.title ?? risk.code)}
                  </Text>
                  <Text className="font-body text-sm text-text-secondary">
                    {formatLabel(risk.severity)}
                  </Text>
                </View>
              ))}
            </View>
          </AuditSection>
        )}

        {actions.length > 0 && (
          <AuditSection title="Do this today">
            <View className="gap-2">
              {actions.map((action, index) => (
                <Pressable
                  key={`${action.title}-${index}`}
                  onPress={() =>
                    track(ANALYTICS_EVENTS.FINANCIAL_AUDIT_ACTION_TAPPED, {
                      action_title: String(action.title ?? ''),
                      action_index: index,
                      score: totalScore,
                    })
                  }
                  className="min-h-10 flex-row gap-2"
                  accessibilityRole="button"
                  accessibilityLabel={`Audit action ${index + 1}`}>
                  <Text className="font-body-medium text-sm text-text-secondary">{index + 1}.</Text>
                  <Text className="flex-1 font-body text-sm leading-5 text-text-primary">
                    {String(action.title)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </AuditSection>
        )}
      </View>
    </CardContainer>
  );
}

/* ─── Tip Card ─── */

function TipCard({ card }: { card: InsightCard }) {
  const emoji = (card.data?.emoji as string) ?? '💡';
  const message = (card.data?.message as string) ?? '';
  const severity = (card.data?.severity as string) ?? 'info';

  const bgMap: Record<string, string> = {
    info: 'bg-sky-blue/8',
    warning: 'bg-sunburst-yellow/10',
    success: 'bg-meadow-green/8',
  };

  return (
    <Animated.View entering={FadeInUp.duration(300)} className="my-2">
      <View
        className={`flex-row items-start gap-3 rounded-2xl ${bgMap[severity] ?? bgMap.info} px-4 py-3.5`}>
        <Text className="text-xl">{emoji}</Text>
        <View className="flex-1">
          {card.title ? (
            <Text className="mb-1 font-heading-semibold text-sm text-text-primary">
              {card.title}
            </Text>
          ) : null}
          <Text className="font-body text-sm leading-5 text-text-primary">{message}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

/* ─── Subscription Audit Card ─── */

function SubscriptionAuditCard({ card }: { card: InsightCard }) {
  const totalMonthly = card.data?.total_monthly as string;
  const subs = (card.data?.subscriptions ?? []) as {
    name: string;
    amount: string;
    frequency: string;
    status?: string;
  }[];
  const tip = card.data?.savings_tip as string;

  if (!subs.length) return <CardErrorFallback />;

  return (
    <CardContainer>
      <View className="py-2">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-heading-semibold text-base text-text-primary">
            {card.title || 'Subscriptions'}
          </Text>
          <Text className="font-body-medium text-sm text-coral-red">${totalMonthly}/mo</Text>
        </View>
        <View className="gap-2.5">
          {subs.slice(0, 6).map((sub, i) => (
            <Animated.View
              key={`${sub.name}-${i}`}
              entering={FadeInUp.duration(250).delay(i * 60)}
              className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2.5">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-stone-surface">
                  <Text className="font-body-medium text-xs text-text-primary">
                    {sub.name.charAt(0)}
                  </Text>
                </View>
                <View>
                  <Text className="font-body-medium text-sm text-text-primary">{sub.name}</Text>
                  <Text className="font-body text-xs text-text-tertiary">{sub.frequency}</Text>
                </View>
              </View>
              <Text className="font-body-medium text-sm tabular-nums text-text-primary">
                ${sub.amount}
              </Text>
            </Animated.View>
          ))}
        </View>
        {tip ? (
          <Text className="mt-3 font-body text-xs leading-4 text-text-secondary">{tip}</Text>
        ) : null}
      </View>
    </CardContainer>
  );
}

/* ─── Runway Card ─── */

function RunwayCard({ card }: { card: InsightCard }) {
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
        {dailyBurn ? (
          <Text className="mt-2 font-body text-xs text-text-secondary">
            Daily burn: ${dailyBurn}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

/* ─── Deposit Pattern Card ─── */

function DepositPatternCard({ card }: { card: InsightCard }) {
  const frequency = (card.data?.frequency as string) ?? 'irregular';
  const avgAmount = card.data?.average_amount as string;
  const streak = (card.data?.streak as number) ?? 0;
  const consistency = (card.data?.consistency as number) ?? 0;

  const barWidth = Math.max(8, Math.min(100, consistency));

  return (
    <CardContainer>
      <View className="py-2">
        <Text className="mb-3 font-heading-semibold text-base text-text-primary">
          {card.title || 'Deposit Pattern'}
        </Text>
        <View className="flex-row flex-wrap gap-y-3">
          <View className="w-1/2 pr-3">
            <Text className="font-body text-xs text-text-secondary">Frequency</Text>
            <Text className="mt-0.5 font-body-medium text-sm capitalize text-text-primary">
              {frequency}
            </Text>
          </View>
          <View className="w-1/2">
            <Text className="font-body text-xs text-text-secondary">Average</Text>
            <Text className="mt-0.5 font-body-medium text-sm text-text-primary">${avgAmount}</Text>
          </View>
          <View className="w-1/2 pr-3">
            <Text className="font-body text-xs text-text-secondary">Streak</Text>
            <Text className="mt-0.5 font-body-medium text-sm text-text-primary">
              {streak} deposits
            </Text>
          </View>
          <View className="w-1/2">
            <Text className="font-body text-xs text-text-secondary">Consistency</Text>
            <Text className="mt-0.5 font-body-medium text-sm text-text-primary">
              {consistency}%
            </Text>
          </View>
        </View>
        <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-surface">
          <Animated.View
            entering={FadeInUp.duration(500)}
            className="h-full rounded-full bg-meadow-green"
            style={{ width: `${barWidth}%` }}
          />
        </View>
      </View>
    </CardContainer>
  );
}

/* ─── Yield Summary Card ─── */

function YieldSummaryCard({ card }: { card: InsightCard }) {
  const totalEarned = card.data?.total_earned as string;
  const monthEarned = card.data?.month_earned as string;
  const currentAPY = card.data?.current_apy as string;
  const stashBalance = card.data?.stash_balance as string;
  const dailyEstimate = card.data?.daily_estimate as string;

  return (
    <Animated.View entering={FadeInUp.duration(300)} className="my-2">
      <View className="rounded-2xl border border-meadow-green/20 bg-meadow-green/5 p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-heading-semibold text-base text-text-primary">
            {card.title || 'Stash Yield'}
          </Text>
          <View className="rounded-full bg-meadow-green/15 px-2 py-0.5">
            <Text className="font-body-medium text-xs text-meadow-green">{currentAPY}% APY</Text>
          </View>
        </View>
        <View className="flex-row flex-wrap gap-y-3">
          <View className="w-1/2 pr-3">
            <Text className="font-body text-xs text-text-secondary">Total Earned</Text>
            <Text className="mt-0.5 font-heading-semibold text-lg text-meadow-green">
              ${totalEarned}
            </Text>
          </View>
          <View className="w-1/2">
            <Text className="font-body text-xs text-text-secondary">This Month</Text>
            <Text className="mt-0.5 font-body-medium text-sm text-text-primary">
              ${monthEarned}
            </Text>
          </View>
          <View className="w-1/2 pr-3">
            <Text className="font-body text-xs text-text-secondary">Stash Balance</Text>
            <Text className="mt-0.5 font-body-medium text-sm text-text-primary">
              ${stashBalance}
            </Text>
          </View>
          <View className="w-1/2">
            <Text className="font-body text-xs text-text-secondary">Daily Estimate</Text>
            <Text className="mt-0.5 font-body-medium text-sm text-text-primary">
              ${dailyEstimate}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

/* ─── Comparison Card ─── */

function ComparisonCard({ card }: { card: InsightCard }) {
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
          <Text className="font-heading-semibold text-base text-text-primary">
            {card.title || metricLabel}
          </Text>
          {deltaPct ? (
            <Text
              className={`font-body-medium text-sm ${sentiment === 'positive' ? 'text-meadow-green' : sentiment === 'negative' ? 'text-coral-red' : 'text-text-secondary'}`}>
              {parseFloat(deltaPct) >= 0 ? '+' : ''}
              {deltaPct}%
            </Text>
          ) : null}
        </View>
        <View className="gap-3">
          <View className="gap-1.5">
            <View className="flex-row items-center justify-between">
              <Text className="font-body text-xs text-text-secondary">{current.label}</Text>
              <Text className="font-body-medium text-sm tabular-nums text-text-primary">
                ${current.value}
              </Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-stone-surface">
              <Animated.View
                entering={FadeInUp.duration(400)}
                className="h-full rounded-full"
                style={{
                  width: `${(currentVal / maxVal) * 100}%`,
                  backgroundColor: current.color ?? '#FF3E00',
                }}
              />
            </View>
          </View>
          <View className="gap-1.5">
            <View className="flex-row items-center justify-between">
              <Text className="font-body text-xs text-text-secondary">{previous.label}</Text>
              <Text className="font-body-medium text-sm tabular-nums text-text-primary">
                ${previous.value}
              </Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-stone-surface">
              <Animated.View
                entering={FadeInUp.duration(400).delay(100)}
                className="h-full rounded-full"
                style={{
                  width: `${(previousVal / maxVal) * 100}%`,
                  backgroundColor: previous.color ?? '#8C8C8C',
                }}
              />
            </View>
          </View>
        </View>
      </View>
    </CardContainer>
  );
}

/* ─── Main Export ─── */

export function InsightCardView({ card }: { card: InsightCard }) {
  const Wrap = ({ children }: { children: React.ReactNode }) => (
    <InsightCardErrorBoundary cardType={card.type}>{children}</InsightCardErrorBoundary>
  );

  switch (card.type) {
    case 'stat_grid':
      return (
        <Wrap>
          <StatGridCard card={card} />
        </Wrap>
      );
    case 'chart':
      return (
        <Wrap>
          <ChartCard card={card} />
        </Wrap>
      );
    case 'breakdown':
      return (
        <Wrap>
          <BreakdownCard card={card} />
        </Wrap>
      );
    case 'progress':
      return (
        <Wrap>
          <ProgressCard card={card} />
        </Wrap>
      );
    case 'alert':
      return (
        <Wrap>
          <AlertCard card={card} />
        </Wrap>
      );
    case 'highlight':
      return (
        <Wrap>
          <HighlightCard card={card} />
        </Wrap>
      );
    case 'financial_audit':
      return (
        <Wrap>
          <FinancialAuditCard card={card} />
        </Wrap>
      );
    case 'tip':
      return (
        <Wrap>
          <TipCard card={card} />
        </Wrap>
      );
    case 'subscription_audit':
      return (
        <Wrap>
          <SubscriptionAuditCard card={card} />
        </Wrap>
      );
    case 'runway':
      return (
        <Wrap>
          <RunwayCard card={card} />
        </Wrap>
      );
    case 'deposit_pattern':
      return (
        <Wrap>
          <DepositPatternCard card={card} />
        </Wrap>
      );
    case 'yield_summary':
      return (
        <Wrap>
          <YieldSummaryCard card={card} />
        </Wrap>
      );
    case 'comparison':
      return (
        <Wrap>
          <ComparisonCard card={card} />
        </Wrap>
      );
    default:
      // Unknown card types are silently skipped
      return null;
  }
}
