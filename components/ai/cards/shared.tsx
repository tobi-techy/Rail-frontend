import React, { Component } from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import type { InsightCard } from '@/api/types/ai';

/* ─── Error Boundary ─── */

interface EBProps {
  children: React.ReactNode;
  cardType: string;
}

export class InsightCardErrorBoundary extends Component<EBProps, { hasError: boolean }> {
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

export function CardErrorFallback() {
  return (
    <View className="my-2 rounded-2xl border border-black/[0.08] bg-parchment-card p-4">
      <Text className="font-body text-sm text-text-secondary">Insight unavailable</Text>
    </View>
  );
}

export function CardContainer({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Animated.View
      entering={FadeInUp.springify().damping(22).stiffness(260)}
      className="my-2 w-full">
      <View
        className={`overflow-hidden rounded-[22px] border bg-white ${accent ? 'border-ember-orange/25' : 'border-black/[0.06]'}`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 1,
        }}>
        {children}
      </View>
    </Animated.View>
  );
}

export function AuditSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="border-t border-black/[0.06] pt-3">
      <Text className="mb-2 font-body-medium text-xs text-text-secondary">{title}</Text>
      {children}
    </View>
  );
}

/* ─── Utility functions ─── */

export type AuditItem = Record<string, any>;
export type AuditMetric = { label: string; value: string; sentiment?: string };

export function asArray<T = AuditItem>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function formatLabel(value: unknown) {
  return String(value ?? '')
    .replace(/_/g, ' ')
    .trim();
}

export function formatMoney(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) return '$0.00';
  return raw.startsWith('$') ? raw : `$${raw}`;
}

export function parseMoney(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function compactMoney(value: unknown) {
  const amount = parseMoney(value);
  const sign = amount < 0 ? '-' : '';
  const absolute = Math.abs(amount);
  if (absolute >= 1_000_000) return `${sign}$${(absolute / 1_000_000).toFixed(1)}M`;
  if (absolute >= 1_000) return `${sign}$${(absolute / 1_000).toFixed(1)}K`;
  return `${sign}$${absolute.toFixed(0)}`;
}

export function toneClass(sentiment?: string) {
  if (sentiment === 'positive') return 'text-success';
  if (sentiment === 'negative') return 'text-coral-red';
  return 'text-text-primary';
}

export type { InsightCard };
