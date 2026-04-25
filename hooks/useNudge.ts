import { useCallback, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { aiService } from '@/api/services/ai.service';
import { useMiriamNudgeStore } from '@/stores/miriamNudgeStore';

/**
 * Fetches an ambient nudge from Miriam for the given screen context.
 * Respects cooldowns and auto-dismisses after a timeout.
 */
export function useNudge(screen: string, amount?: string, currency?: string) {
  const { nudge, loading, dismissed, setNudge, setLoading, canFetch, markFetched, dismiss } =
    useMiriamNudgeStore();

  const fetchNudge = useCallback(async () => {
    if (!canFetch(screen)) return;
    setLoading(true);
    markFetched(screen);
    try {
      const res = await aiService.getNudge(screen, amount, currency);
      if (res.show && res.message) {
        setNudge(res);
        if (res.shake) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      } else {
        setNudge(null);
      }
    } catch {
      setNudge(null);
    } finally {
      setLoading(false);
    }
  }, [screen, amount, currency, canFetch, markFetched, setLoading, setNudge]);

  // Auto-fetch on mount / when amount changes significantly
  useEffect(() => {
    fetchNudge();
  }, [fetchNudge]);

  // Auto-dismiss after 12 seconds
  useEffect(() => {
    if (!nudge?.show) return;
    const timer = setTimeout(dismiss, 12_000);
    return () => clearTimeout(timer);
  }, [nudge, dismiss]);

  return { nudge: dismissed ? null : nudge, loading, dismiss, refetch: fetchNudge };
}
