import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useUIStore } from '@/stores';

export function useHaptics() {
  const hapticsEnabled = useUIStore((state) => state.hapticsEnabled);

  const impact = useCallback(
    (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
      if (!hapticsEnabled) return;
      void Haptics.impactAsync(style);
    },
    [hapticsEnabled]
  );

  const selection = useCallback(() => {
    if (!hapticsEnabled) return;
    void Haptics.selectionAsync();
  }, [hapticsEnabled]);

  const notification = useCallback(
    (type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) => {
      if (!hapticsEnabled) return;
      void Haptics.notificationAsync(type);
    },
    [hapticsEnabled]
  );

  return {
    hapticsEnabled,
    impact,
    selection,
    notification,
  };
}
