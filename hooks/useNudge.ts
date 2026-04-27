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

/**
 * Fetches an ambient nudge from Miriam for the given screen context.
 * Uses the enhanced endpoint with multi-modal context signals.
 */
export function useNudge(screen: string, amount?: string, currency?: string) {
  const [nudge, setNudge] = useState<EnhancedNudge | null>(null);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const cacheKey = amount ? `${screen}:${amount}` : screen;

  useEffect(() => {
    const lastFetch = lastFetchMap.get(cacheKey) ?? 0;
    if (Date.now() - lastFetch < COOLDOWN_MS) return;

    lastFetchMap.set(cacheKey, Date.now());
    setLoading(true);

    // Try enhanced nudge first, fall back to basic
    aiService
      .getEnhancedNudge({
        screen,
        amount,
        currency,
        time_of_day: getTimeOfDay(),
        day_of_week: new Date().getDay(),
      })
      .then((res) => {
        if (!mountedRef.current) return;
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
          if (!mountedRef.current) return;
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
        if (mountedRef.current) setLoading(false);
      });
  }, [cacheKey, screen, amount, currency]);

  // Auto-dismiss (uses expires_in from enhanced nudge, or default)
  useEffect(() => {
    if (!nudge?.show) return;
    const dismissMs = (nudge.expires_in ?? 12) * 1000;
    const timer = setTimeout(() => {
      if (mountedRef.current) setNudge(null);
    }, dismissMs);
    return () => clearTimeout(timer);
  }, [nudge]);

  const dismiss = () => setNudge(null);

  return { nudge, loading, dismiss };
}
