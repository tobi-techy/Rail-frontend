import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useHaptics } from './useHaptics';

export function useButtonFeedback(enableHaptics = true) {
  const { impact } = useHaptics();

  const trigger = useCallback(() => {
    if (!enableHaptics) return;
    impact(Haptics.ImpactFeedbackStyle.Medium);
  }, [enableHaptics, impact]);

  return trigger;
}
