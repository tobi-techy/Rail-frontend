import React from 'react';
import type { InsightCard } from '@/api/types/ai';
import {
  InsightCardErrorBoundary,
  StatGridCard,
  ChartCard,
  BreakdownCard,
  ProgressCard,
  AlertCard,
  HighlightCard,
  FinancialAuditCard,
  TipCard,
  SubscriptionAuditCard,
  RunwayCard,
  DepositPatternCard,
  YieldSummaryCard,
  ComparisonCard,
} from './cards';

const CARD_MAP: Record<string, React.ComponentType<{ card: InsightCard }>> = {
  stat_grid: StatGridCard,
  chart: ChartCard,
  breakdown: BreakdownCard,
  progress: ProgressCard,
  alert: AlertCard,
  highlight: HighlightCard,
  financial_audit: FinancialAuditCard,
  tip: TipCard,
  subscription_audit: SubscriptionAuditCard,
  runway: RunwayCard,
  deposit_pattern: DepositPatternCard,
  yield_summary: YieldSummaryCard,
  comparison: ComparisonCard,
};

export function InsightCardView({ card }: { card: InsightCard }) {
  const CardComponent = CARD_MAP[card.type];
  if (!CardComponent) return null;

  return (
    <InsightCardErrorBoundary cardType={card.type}>
      <CardComponent card={card} />
    </InsightCardErrorBoundary>
  );
}
