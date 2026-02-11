import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';

export function useButtonFeedback(enableHaptics = true) {
  const trigger = useCallback(() => {
    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [enableHaptics]);

  return trigger;
}
