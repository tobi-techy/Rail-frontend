import { useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { aiService } from '@/api/services/ai.service';
import type { NudgeResponse, NudgeAction } from '@/api/types/ai';

const COOLDOWN_MS = 60_000;
const AUTO_DISMISS_MS = 12_000;

// Track cooldowns outside React to avoid re-render loops.
const lastFetchMap = new Map<string, number>();

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

export type EnhancedNudge = NudgeResponse & { action?: NudgeAction | null; expires_in?: number };

export type NudgeOptions = {
  daysUntilPayday?: number;
  debounceMs?: number;
  enabled?: boolean;
  cooldownMs?: number;
  cooldownScope?: 'context' | 'screen';
  merchantHint?: string;
  recentActions?: string[];
};

/**
 * Fetches an ambient nudge from Miriam for the given screen context.
 * Uses the enhanced endpoint with multi-modal context signals.
 */
export function useNudge(
  screen: string,
  amount?: string,
  currency?: string,
  options?: NudgeOptions
) {
  const [nudge, setNudge] = useState<EnhancedNudge | null>(null);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);
  const requestSeqRef = useRef(0);
  const daysUntilPayday = options?.daysUntilPayday;
  const debounceMs = options?.debounceMs ?? 0;
  const enabled = options?.enabled ?? true;
  const cooldownMs = options?.cooldownMs ?? COOLDOWN_MS;
  const cooldownScope = options?.cooldownScope ?? 'context';
  const merchantHint = options?.merchantHint;
  const recentActionsKey = options?.recentActions?.join('|') ?? '';

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const cacheKey = [
    screen,
    amount ?? '',
    currency ?? '',
    daysUntilPayday ?? '',
    merchantHint ?? '',
    recentActionsKey,
  ].join(':');
  const cooldownKey = cooldownScope === 'screen' ? `screen:${screen}` : cacheKey;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      const lastFetch = lastFetchMap.get(cooldownKey) ?? 0;
      if (Date.now() - lastFetch < cooldownMs) return;

      lastFetchMap.set(cooldownKey, Date.now());
      const requestId = requestSeqRef.current + 1;
      requestSeqRef.current = requestId;
      setLoading(true);

      // Try enhanced nudge first, fall back to basic
      aiService
        .getEnhancedNudge({
          screen,
          amount,
          currency,
          time_of_day: getTimeOfDay(),
          day_of_week: new Date().getDay(),
          days_until_payday: daysUntilPayday,
          merchant_hint: merchantHint,
          recent_actions: recentActionsKey ? recentActionsKey.split('|') : undefined,
        })
        .then((res) => {
          if (!mountedRef.current || requestId !== requestSeqRef.current) return;
          if (res?.show && res.message) {
            setNudge(res);
            if (res.shake) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            }
          }
        })
        .catch(() => {
          // Fallback to basic nudge if enhanced endpoint not available
          return aiService.getNudge(screen, amount, currency).then((res) => {
            if (!mountedRef.current || requestId !== requestSeqRef.current) return;
            if (res?.show && res.message) {
              setNudge(res);
              if (res.shake) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
              }
            }
          });
        })
        .catch(() => {})
        .finally(() => {
          if (mountedRef.current && requestId === requestSeqRef.current) setLoading(false);
        });
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      requestSeqRef.current += 1;
    };
  }, [
    amount,
    cooldownKey,
    cooldownMs,
    currency,
    daysUntilPayday,
    debounceMs,
    enabled,
    merchantHint,
    recentActionsKey,
    screen,
  ]);

  // Auto-dismiss (uses expires_in from enhanced nudge, or default)
  useEffect(() => {
    if (!nudge?.show) return;
    const dismissMs = nudge.expires_in ? nudge.expires_in * 1000 : AUTO_DISMISS_MS;
    const timer = setTimeout(() => {
      if (mountedRef.current) setNudge(null);
    }, dismissMs);
    return () => clearTimeout(timer);
  }, [nudge]);

  const dismiss = () => setNudge(null);

  return { nudge, loading, dismiss };
}
