import { useCallback } from 'react';
import * as Haptics from '@/utils/platformHaptics';
import { playUISound } from '@/lib/uiSounds';
import { useHaptics } from './useHaptics';

export function useKeypadFeedback() {
  const { impact } = useHaptics();

  const trigger = useCallback(() => {
    impact(Haptics.ImpactFeedbackStyle.Light);
    playUISound('keypress');
  }, [impact]);

  return trigger;
}
