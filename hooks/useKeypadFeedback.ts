import { useCallback } from 'react';
import * as Haptics from '@/utils/platformHaptics';
import { playUISound } from '@/lib/uiSounds';
import { useHaptics } from './useHaptics';

export function useKeypadFeedback() {
  const { impact } = useHaptics();

  const trigger = useCallback(() => {
    // Medium impact: Light is barely perceptible on many devices — keys
    // should feel like keys.
    impact(Haptics.ImpactFeedbackStyle.Medium);
    playUISound('keypress');
  }, [impact]);

  return trigger;
}
