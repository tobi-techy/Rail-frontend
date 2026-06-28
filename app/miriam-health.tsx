import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-gifted-charts';
import { ArrowLeft01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import aiService from '@/api/services/ai.service';
import { MiriamActivitySheet } from '@/components/ai/MiriamActivitySheet';
import { MiriamMandateSheet } from '@/components/ai/MiriamMandateSheet';
import { useEnableMiriamAmbient } from '@/hooks/useEnableMiriamAmbient';
import type {
  MiriamHealthSummary,
  MiriamPredictionSummary,
  MiriamDecisionReceipt,
} from '@/api/types/ai';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SUB_SCORES = [
  { key: 'budget_score', label: 'Budget discipline' },
  { key: 'savings_score', label: 'Savings rate' },
  { key: 'runway_score', label: 'Cash runway' },
  { key: 'debt_score', label: 'Debt coverage' },
  { key: 'stability_score', label: 'Income stability' },
] as const;

function scoreBarColor(s: number) {
  if (s >= 75) return '#00ca48';
  if (s >= 50) return '#ff3e00';
  return '#ff2b3a';
}

function overallColor(s: number) {
  if (s >= 75) return '#00ca48';
  if (s >= 50) return '#ff3e00';
  return '#ff2b3a';
}

function trendColor(trend: string): string {
  if (trend === 'improving') return '#00ca48';
  if (trend === 'declining') return '#ff2b3a';
  return '#848281';
}

function trendLabel(trend: string) {
  if (trend === 'improving') return 'improving';
  if (trend === 'declining') return 'declining';
  return 'stable';
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ff2b3a',
  high: '#ff3e00',
  medium: '#d97706',
  low: '#848281',
};

const PREDICTION_LABELS: Record<string, string> = {
  cash_shortfall: 'Cash shortfall risk',
  bill_pressure: 'Bill pressure',
  spending_anomaly: 'Spending anomaly',
  income_gap: 'Income gap',
  idle_surplus: 'Idle surplus',
  stash_opportunity: 'Stash opportunity',
};

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function humanizeAction(t: string) {
  const m: Record<string, string> = {
    transfer_to_stash: 'Moved to Stash',
    stash_top_up: 'Topped up Stash',
    bill_reservation: 'Reserved for bill',
    goal_contribution: 'Added to goal',
  };
  return m[t] ?? t.replace(/_/g, ' ');
}

const STATUS_COLORS: Record<string, string> = {
  executed: '#0A7A3B',
  skipped: '#848281',
  failed: '#e53935',
};

export default function MiriamHealthScreen() {
  useEnableMiriamAmbient();
  const insets = useSafeAreaInsets();
  const [health, setHealth] = useState<MiriamHealthSummary | null>(null);
  const [predictions, setPredictions] = useState<MiriamPredictionSummary | null>(null);
  const [receipts, setReceipts] = useState<MiriamDecisionReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showMandates, setShowMandates] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const [hRes, pRes, rRes] = await Promise.allSettled([
        aiService.getMiriamHealthScore(),
        aiService.getMiriamPredictions(),
        aiService.getMiriamReceipts(5),
      ]);
      if (hRes.status === 'fulfilled') setHealth((hRes.value as any)?.data ?? null);
      if (pRes.status === 'fulfilled') setPredictions((pRes.value as any)?.data ?? null);
      if (rRes.status === 'fulfilled') setReceipts((rRes.value as any)?.data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const latest = health?.latest ?? null;
  const trend = health?.trend ?? [];

  // Build chart data from trend (oldest → newest, last 30 points)
  const chartData = trend
    .slice(-30)
    .reverse()
    .map((s) => ({ value: s.overall_score }));

  const color = latest ? overallColor(latest.overall_score) : '#ff3e00';

  return (
    <View className="flex-1 bg-[#f7f4ef]">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center px-5 pb-3" style={{ paddingTop: insets.top + 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="mr-3 p-1 active:scale-[0.9]">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#1a1a1a" />
        </Pressable>
        <View className="flex-1">
          <Text className="font-subtitle text-[18px] text-charcoal-primary">Financial Health</Text>
          {latest && (
            <Text className="font-body text-[13px]" style={{ color: trendColor(latest.trend) }}>
              {trendLabel(latest.trend)}
            </Text>
          )}
        </View>
        <Pressable
          onPress={() => setShowMandates(true)}
          className="rounded-full bg-charcoal-primary/5 px-4 py-2 active:scale-[0.96]">
          <Text className="font-button text-[13px] text-charcoal-primary">Autopilot</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#ff3e00" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load(true);
              }}
              tintColor="#ff3e00"
            />
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
          {/* Score hero */}
          {latest ? (
            <View
              className="mx-5 mt-4 rounded-3xl bg-white p-6"
              style={{ borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
              <View className="flex-row items-end justify-between">
                <View>
                  <Text
                    style={{
                      fontSize: 72,
                      lineHeight: 72,
                      fontFamily: 'Geist-SemiBold',
                      color,
                      fontVariant: ['tabular-nums'],
                    }}>
                    {latest.overall_score}
                  </Text>
                  <View className="mt-2 flex-row items-center gap-2">
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: trendColor(latest.trend),
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Geist-Regular',
                        color: trendColor(latest.trend),
                      }}>
                      {trendLabel(latest.trend)}
                    </Text>
                  </View>
                </View>

                {latest.previous_score > 0 &&
                  (() => {
                    const delta = latest.overall_score - latest.previous_score;
                    return (
                      <View
                        className="mb-1 items-center rounded-full px-3 py-2"
                        style={{ backgroundColor: color + '14' }}>
                        <Text
                          style={{
                            fontSize: 18,
                            fontFamily: 'Geist-SemiBold',
                            color,
                            fontVariant: ['tabular-nums'],
                          }}>
                          {delta >= 0 ? '+' : ''}
                          {delta}
                        </Text>
                        <Text
                          style={{ fontSize: 10, fontFamily: 'Geist-Regular', color: '#848281' }}>
                          vs last
                        </Text>
                      </View>
                    );
                  })()}
              </View>

              {latest.reasoning ? (
                <Text className="mt-5 font-body text-[14px] leading-[22px] text-graphite">
                  {latest.reasoning}
                </Text>
              ) : null}
            </View>
          ) : (
            <View
              className="mx-5 mt-4 items-center rounded-3xl bg-white py-10"
              style={{ borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
              <Text className="font-subtitle text-[15px] text-charcoal-primary">No score yet</Text>
              <Text className="mt-2 font-body text-[13px] text-graphite">
                Miriam is still learning your patterns.
              </Text>
            </View>
          )}

          {/* Sub-score breakdown */}
          {latest && (
            <View
              className="mx-5 mt-3 rounded-3xl bg-white p-5"
              style={{ borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
              <Text className="mb-4 font-subtitle text-[15px] text-charcoal-primary">
                Breakdown
              </Text>
              {SUB_SCORES.map(({ key, label }, i) => {
                const val = latest[key];
                const c = scoreBarColor(val);
                return (
                  <View
                    key={key}
                    style={i < SUB_SCORES.length - 1 ? { marginBottom: 16 } : undefined}>
                    <View className="mb-2 flex-row items-center justify-between">
                      <Text className="font-body text-[13px] text-charcoal-primary">{label}</Text>
                      <Text
                        className="font-button text-[13px]"
                        style={{ color: c, fontVariant: ['tabular-nums'] }}>
                        {val}
                      </Text>
                    </View>
                    <View className="h-1.5 overflow-hidden rounded-full bg-ash/15">
                      <View
                        className="h-full rounded-full"
                        style={{ width: `${val}%`, backgroundColor: c }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* 30-day trend chart */}
          {chartData.length >= 3 && (
            <View
              className="mx-5 mt-3 rounded-3xl bg-white p-5"
              style={{ borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
              <Text className="mb-4 font-subtitle text-[15px] text-charcoal-primary">
                30-day trend
              </Text>
              <LineChart
                data={chartData}
                height={120}
                width={SCREEN_WIDTH - 80}
                color={color}
                thickness={2.5}
                dataPointsColor={color}
                dataPointsRadius={3}
                hideRules
                hideDataPoints={chartData.length > 15}
                isAnimated
                animationDuration={600}
                yAxisTextStyle={{ fontSize: 10, color: '#8C8C8C' }}
                curved
              />
            </View>
          )}

          {/* Active predictions */}
          {predictions && predictions.active_predictions.length > 0 && (
            <View
              className="mx-5 mt-3 rounded-3xl bg-white p-5"
              style={{ borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
              <View className="mb-4 flex-row items-baseline justify-between">
                <Text className="font-subtitle text-[15px] text-charcoal-primary">
                  What Miriam sees
                </Text>
                <Text
                  className="font-body text-[12px] text-ash"
                  style={{ fontVariant: ['tabular-nums'] }}>
                  risk {predictions.risk_score}/100
                </Text>
              </View>

              {predictions.active_predictions.map((p, i) => {
                const sColor = SEVERITY_COLORS[p.severity] ?? '#848281';
                const isLast =
                  i === predictions.active_predictions.length - 1 &&
                  !predictions.recommended_action;
                return (
                  <View
                    key={p.id}
                    className="py-4"
                    style={
                      isLast
                        ? undefined
                        : { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' }
                    }>
                    <View className="flex-row items-start gap-3">
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: sColor,
                          marginTop: 6,
                        }}
                      />
                      <View className="flex-1">
                        <Text className="font-subtitle text-[13px] text-charcoal-primary">
                          {PREDICTION_LABELS[p.prediction_type] ??
                            p.prediction_type.replace(/_/g, ' ')}
                        </Text>
                        <Text className="mt-1 font-body text-[13px] leading-[19px] text-graphite">
                          {p.reasoning}
                        </Text>
                        <Text
                          className="mt-1 font-body text-[11px] text-ash"
                          style={{ fontVariant: ['tabular-nums'] }}>
                          {Math.round(p.probability * 100)}% · {p.horizon.replace(/_/g, ' ')}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              {predictions.recommended_action ? (
                <View
                  className="mt-2 rounded-2xl px-4 py-3"
                  style={{ backgroundColor: '#ff3e000d' }}>
                  <Text className="font-button text-[11px] uppercase tracking-wider text-ember-orange">
                    Miriam recommends
                  </Text>
                  <Text className="mt-1 font-body text-[13px] leading-[19px] text-charcoal-primary">
                    {predictions.recommended_action}
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Recent moves */}
          {receipts.length > 0 && (
            <View
              className="mx-5 mt-3 rounded-3xl bg-white p-5"
              style={{ borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="font-subtitle text-[15px] text-charcoal-primary">
                  Recent moves
                </Text>
                <Pressable
                  onPress={() => setShowActivity(true)}
                  hitSlop={16}
                  className="active:scale-[0.9]">
                  <Text className="font-body text-[13px] text-ember-orange">See all</Text>
                </Pressable>
              </View>

              {receipts.slice(0, 5).map((r, i) => {
                const sColor = STATUS_COLORS[r.status] ?? '#848281';
                const isLast = i === Math.min(receipts.length, 5) - 1;
                return (
                  <View
                    key={r.id}
                    className="flex-row items-center gap-3 py-3.5"
                    style={
                      isLast
                        ? undefined
                        : { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' }
                    }>
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: sColor,
                      }}
                    />
                    <Text className="flex-1 font-body text-[13px] text-charcoal-primary">
                      {humanizeAction(r.action_type)}
                    </Text>
                    <Text className="font-body text-[11px] text-ash">{timeAgo(r.created_at)}</Text>
                    {parseFloat(r.amount) > 0 && (
                      <Text
                        className="font-button text-[13px]"
                        style={{ color: sColor, fontVariant: ['tabular-nums'] }}>
                        ${parseFloat(r.amount).toFixed(2)}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <View className="mx-5 mt-3 rounded-2xl bg-ash/10 px-4 py-3">
            <Text className="text-center font-body text-[12px] text-graphite">
              Scores update every time Miriam evaluates your money state. Talk to her anytime.
            </Text>
          </View>
        </ScrollView>
      )}

      <MiriamActivitySheet
        visible={showActivity}
        onClose={() => setShowActivity(false)}
        onOpenMandates={() => {
          setShowActivity(false);
          setShowMandates(true);
        }}
      />
      <MiriamMandateSheet visible={showMandates} onClose={() => setShowMandates(false)} />
    </View>
  );
}
