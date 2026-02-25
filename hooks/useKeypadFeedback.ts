import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useHaptics } from './useHaptics';

export function useKeypadFeedback() {
  const { impact } = useHaptics();

  const trigger = useCallback(() => {
    impact(Haptics.ImpactFeedbackStyle.Light);
  }, [impact]);

  return trigger;
}
