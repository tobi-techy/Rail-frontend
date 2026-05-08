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
  const damage = (data.damage ?? {}) as Record<string, any>;
  const snapshot = (data.snapshot ?? {}) as Record<string, any>;
  const period = (data.period ?? {}) as Record<string, any>;
  const coverage = (data.data_coverage ?? {}) as Record<string, any>;
  const metrics = asArray<AuditMetric>(data.metrics).slice(0, 4);
  const contradictions = asArray(data.contradictions).slice(0, 3);
  const topCategories = asArray(data.top_categories).slice(0, 4);
  const risks = asArray(data.risk_flags).slice(0, 3);
  const actions = asArray(data.next_actions).slice(0, 3);
  const patterns = asArray<string>(data.patterns).slice(0, 3);
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
    default:
      // Unknown card types are silently skipped
      return null;
  }
}
