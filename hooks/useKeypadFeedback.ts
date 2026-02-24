import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';

export function useKeypadFeedback() {
  const trigger = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  return trigger;
}
