import { useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { aiService } from '@/api/services/ai.service';
import type { NudgeResponse } from '@/api/types/ai';

const COOLDOWN_MS = 60_000;
const AUTO_DISMISS_MS = 12_000;

// Track cooldowns outside React to avoid re-render loops.
// Key format: "screen" for passive screens, "screen:amount" for transaction screens.
const lastFetchMap = new Map<string, number>();

/**
 * Fetches an ambient nudge from Miriam for the given screen context.
 * State is local to the component — no global store leaking between screens.
 */
export function useNudge(screen: string, amount?: string, currency?: string) {
  const [nudge, setNudge] = useState<NudgeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Build a cache key that includes amount for transaction screens
  // so changing the amount triggers a new fetch after cooldown.
  const cacheKey = amount ? `${screen}:${amount}` : screen;

  useEffect(() => {
    const lastFetch = lastFetchMap.get(cacheKey) ?? 0;
    if (Date.now() - lastFetch < COOLDOWN_MS) return;

    lastFetchMap.set(cacheKey, Date.now());
    setLoading(true);

    aiService
      .getNudge(screen, amount, currency)
      .then((res) => {
        if (!mountedRef.current) return;
        if (res?.show && res.message) {
          setNudge(res);
          if (res.shake) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });
  }, [cacheKey, screen, amount, currency]);

  // Auto-dismiss
  useEffect(() => {
    if (!nudge?.show) return;
    const timer = setTimeout(() => {
      if (mountedRef.current) setNudge(null);
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [nudge]);

  const dismiss = () => setNudge(null);

  return { nudge, loading, dismiss };
}
