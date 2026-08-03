import { useCallback } from 'react';
import * as Haptics from '@/utils/platformHaptics';
import { playUISound } from '@/lib/uiSounds';
import { useHaptics } from './useHaptics';

export function useButtonFeedback(enableHaptics = true, enableSound = true) {
  const { impact } = useHaptics();

  const trigger = useCallback(() => {
    if (enableHaptics) impact(Haptics.ImpactFeedbackStyle.Medium);
    if (enableSound) playUISound('buttonClick');
  }, [enableHaptics, enableSound, impact]);

  return trigger;
}
