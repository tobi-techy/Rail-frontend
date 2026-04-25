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

  const fetchInsight = useCallback(async (signal: AbortSignal) => {
    // Debounce: don't poll more than once per minute
    const now = Date.now();
    if (now - lastPollRef.current < 60_000) return;
    lastPollRef.current = now;

    setLoading(true);
    try {
      // Only try 'performance' — avoids sequential 6s+ calls when providers are quota-limited
      const res = await aiService.getQuickInsight('performance');
      if (signal.aborted) return;
      if (!res.error && res.insight?.trim()) {
        const generated: ProactiveInsight = {
          id: `quick-performance-${now}`,
          type: 'weekly_summary',
          title: 'Performance Update',
          message: res.insight,
          priority: 'high',
          dismissable: true,
          dataSource: 'ai_quick_insight_performance',
          generatedAt: new Date().toISOString(),
        };
        if (!dismissedIds.has(generated.id)) {
          setInsight(generated);
        }
      }
    } catch (e: any) {
      if (e?.name === 'AbortError' || signal.aborted) return;
      logger.warn('Failed to fetch proactive insights', { error: e });
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [dismissedIds]);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    // Defer initial fetch to avoid state updates during mount
    const timeout = setTimeout(() => {
      void fetchInsight(controller.signal);
    }, 100);

    // Polling interval
    const interval = setInterval(() => {
      void fetchInsight(controller.signal);
    }, pollIntervalMs);

    return () => {
      controller.abort();
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
    void fetchInsight(new AbortController().signal);
  }, [fetchInsight]);

  return {
    insight,
    loading,
    dismiss,
    refresh,
  };
}


