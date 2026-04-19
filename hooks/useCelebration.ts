import { useCallback, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { useFeedbackPopupStore } from '@/stores/feedbackPopupStore';

/**
 * Triggers celebration moments: confetti + success haptic + popup.
 * Use for: first deposit, stash milestones, streak achievements, card activation.
 */
export function useCelebration() {
  const showPopup = useFeedbackPopupStore((s) => s.showPopup);
  const lastCelebration = useRef('');

  const celebrate = useCallback((key: string, title: string, message?: string) => {
    // Prevent duplicate celebrations for the same event
    if (lastCelebration.current === key) return;
    lastCelebration.current = key;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showPopup({
      type: 'success',
      title,
      message,
      duration: 4000,
    });
  }, [showPopup]);

  const checkMilestones = useCallback((balance: number, previousBalance: number) => {
    const milestones = [100, 500, 1000, 5000];
    for (const m of milestones) {
      if (balance >= m && previousBalance < m) {
        celebrate(`stash-${m}`, `Stash milestone! 🎉`, `Your stash just crossed $${m}. Keep going!`);
        return;
      }
    }
  }, [celebrate]);

  return { celebrate, checkMilestones };
}
