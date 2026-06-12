import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { ANALYTICS_EVENTS, useAnalytics } from '@/utils/analytics';
import {
  CardContainer,
  AuditSection,
  asArray,
  formatLabel,
  formatMoney,
  parseMoney,
  compactMoney,
  toneClass,
  type InsightCard,
  type AuditMetric,
} from './shared';

export function FinancialAuditCard({ card }: { card: InsightCard }) {
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
            <Text className="font-heading-semibold text-base text-text-primary">{card.title || 'Miriam Audit'}</Text>
            <Text className="mt-1 font-body text-sm text-text-secondary">{formatLabel(score.status ?? card.subtitle)}</Text>
            {(period.label || coverage.months_analyzed) && (
              <Text className="mt-1 font-body text-xs text-text-secondary">
                {period.label ? String(period.label) : `${coverage.months_analyzed} months analyzed`}
              </Text>
            )}
          </View>
          <View className="items-end">
            <Text className={`font-heading-semibold text-2xl ${toneClass(card.sentiment)}`}>{totalScore}</Text>
            <Text className="font-body text-xs text-text-secondary">/100</Text>
          </View>
        </View>

        {metrics.length > 0 && (
          <View className="flex-row flex-wrap gap-y-3">
            {metrics.map((metric, index) => (
              <View key={`${metric.label}-${index}`} className="w-1/2 pr-4">
                <Text className="font-body text-xs text-text-secondary">{metric.label}</Text>
                <Text className={`mt-0.5 font-body-medium text-[15px] ${toneClass(metric.sentiment)}`}>{metric.value}</Text>
              </View>
            ))}
          </View>
        )}

        {(donutData.length > 0 || trendData.length > 0) && (
          <AuditSection title="Audit view">
            <View className="gap-4">
              {donutData.length > 0 && (
                <View className="flex-row items-center gap-4">
                  <PieChart data={donutData} donut radius={56} innerRadius={38} innerCircleColor="#FFFFFF" isAnimated animationDuration={600}
                    centerLabelComponent={() => (
                      <View className="items-center">
                        <Text className="font-body-medium text-sm text-text-primary">{compactMoney(totalOut)}</Text>
                        <Text className="font-body text-[10px] text-text-secondary">out</Text>
                      </View>
                    )}
                  />
                  <View className="flex-1 gap-2">
                    {[
                      { label: 'Money in', value: moneyIn, color: '#1A7A6D' },
                      { label: 'Digital out', value: digitalOut, color: '#FF3E00' },
                      { label: 'Cash receipts', value: cashOut, color: '#FFB199' },
                    ].filter((item) => item.value > 0).map((item) => (
                      <View key={item.label} className="flex-row items-center gap-2">
                        <View className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <Text className="flex-1 font-body text-xs text-text-secondary">{item.label}</Text>
                        <Text className="font-body-medium text-xs tabular-nums text-text-primary">{compactMoney(item.value)}</Text>
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
                      <Text className="font-body-medium text-xs tabular-nums text-text-primary">Avg {compactMoney(coverage.average_monthly_money_out)}</Text>
                    )}
                  </View>
                  <BarChart data={trendData} height={140} barWidth={22} spacing={14} barBorderRadius={6} hideRules hideYAxisText isAnimated animationDuration={600} xAxisLabelTextStyle={{ fontSize: 10, color: '#8C8C8C' }} yAxisTextStyle={{ fontSize: 10, color: '#8C8C8C' }} noOfSections={3} />
                </View>
              )}
            </View>
          </AuditSection>
        )}

        {damage.primary_issue && (
          <AuditSection title="The read">
            <Text className="font-body text-sm leading-5 text-text-primary">{String(damage.primary_issue)}</Text>
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
                      <Text className="flex-1 font-body text-sm text-text-primary" numberOfLines={1}>{formatLabel(item.category)}</Text>
                      <Text className="font-body-medium text-sm tabular-nums text-text-primary">{formatMoney(item.total)}</Text>
                    </View>
                    <View className="h-1 overflow-hidden rounded-full bg-black/[0.06]">
                      <View className="h-full rounded-full bg-text-primary" style={{ width: `${width}%` }} />
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
                <Text key={`${item.code}-${index}`} className="font-body text-sm leading-5 text-text-primary">
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
                <Text key={`${pattern}-${index}`} className="font-body text-sm leading-5 text-text-secondary">{pattern}</Text>
              ))}
            </View>
          </AuditSection>
        )}

        {risks.length > 0 && (
          <AuditSection title="Risks">
            <View className="gap-2">
              {risks.map((risk, index) => (
                <View key={`${risk.code}-${index}`} className="flex-row justify-between gap-3">
                  <Text className="flex-1 font-body text-sm text-text-primary">{String(risk.title ?? risk.code)}</Text>
                  <Text className="font-body text-sm text-text-secondary">{formatLabel(risk.severity)}</Text>
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
                  onPress={() => track(ANALYTICS_EVENTS.FINANCIAL_AUDIT_ACTION_TAPPED, { action_title: String(action.title ?? ''), action_index: index, score: totalScore })}
                  className="min-h-10 flex-row gap-2"
                  accessibilityRole="button"
                  accessibilityLabel={`Audit action ${index + 1}`}>
                  <Text className="font-body-medium text-sm text-text-secondary">{index + 1}.</Text>
                  <Text className="flex-1 font-body text-sm leading-5 text-text-primary">{String(action.title)}</Text>
                </Pressable>
              ))}
            </View>
          </AuditSection>
        )}
      </View>
    </CardContainer>
  );
}
