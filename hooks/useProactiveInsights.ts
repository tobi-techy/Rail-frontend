import { useState, useEffect, useCallback, useRef } from 'react';
import { aiService } from '@/api/services/ai.service';
import { logger } from '@/lib/logger';

export type ProactiveInsightType =
  | 'low_balance'
  | 'high_spend'
  | 'upcoming_bill'
  | 'goal_at_risk'
  | 'subscription_renewal'
  | 'idle_money'
  | 'savings_opportunity'
  | 'weekly_summary';

export interface ProactiveInsight {
  id: string;
  type: ProactiveInsightType;
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  actionLabel?: string;
  actionRoute?: string;
  dismissable: boolean;
  dataSource: string;
  generatedAt: string;
}

interface UseProactiveInsightsOptions {
  enabled?: boolean;
  pollIntervalMs?: number;
}

const DEFAULT_POLL_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Background insight engine for Miriam.
 * Polls the backend for proactive financial insights and evaluates
 * trigger conditions client-side for responsiveness.
 */
export function useProactiveInsights(options: UseProactiveInsightsOptions = {}) {
  const { enabled = true, pollIntervalMs = DEFAULT_POLL_INTERVAL } = options;
  const [insight, setInsight] = useState<ProactiveInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const lastPollRef = useRef<number>(0);

  const fetchInsight = useCallback(async () => {
    // Debounce: don't poll more than once per minute
    const now = Date.now();
    if (now - lastPollRef.current < 60_000) return;
    lastPollRef.current = now;

    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    try {
      // Try different insight types in priority order
      const types: ('performance' | 'top_mover' | 'streak')[] = [
        'performance',
        'top_mover',
        'streak',
      ];

      for (const type of types) {
        try {
          const res = await aiService.getQuickInsight(type);
          if (res.error || !res.insight?.trim()) {
            continue;
          }
          const generated: ProactiveInsight = {
            id: `quick-${type}-${now}`,
            type: mapInsightType(type),
            title: mapInsightTitle(type),
            message: res.insight,
            priority: type === 'performance' ? 'high' : 'medium',
            dismissable: true,
            dataSource: `ai_quick_insight_${type}`,
            generatedAt: new Date().toISOString(),
          };
          if (!dismissedIds.has(generated.id)) {
            setInsight(generated);
            break;
          }
        } catch {
          // Try next type
        }
      }
    } catch (e) {
      logger.warn('Failed to fetch proactive insights', { error: e });
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [dismissedIds]);

  useEffect(() => {
    if (!enabled) return;

    // Defer initial fetch to avoid state updates during mount
    const timeout = setTimeout(() => {
      void fetchInsight();
    }, 100);

    // Polling interval
    const interval = setInterval(() => {
      void fetchInsight();
    }, pollIntervalMs);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [enabled, pollIntervalMs, fetchInsight]);

  const dismiss = useCallback((id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
    setInsight((current) => (current?.id === id ? null : current));
  }, []);

  const refresh = useCallback(() => {
    lastPollRef.current = 0;
    void fetchInsight();
  }, [fetchInsight]);

  return {
    insight,
    loading,
    dismiss,
    refresh,
  };
}

function mapInsightType(type: string): ProactiveInsightType {
  switch (type) {
    case 'performance':
      return 'weekly_summary';
    case 'top_mover':
      return 'savings_opportunity';
    case 'streak':
      return 'savings_opportunity';
    default:
      return 'savings_opportunity';
  }
}

function mapInsightTitle(type: string): string {
  switch (type) {
    case 'performance':
      return 'Performance Update';
    case 'top_mover':
      return 'Top Mover';
    case 'streak':
      return 'Streak Alert';
    default:
      return 'Financial Insight';
  }
}
