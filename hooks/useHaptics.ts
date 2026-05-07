import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useUIStore } from '@/stores';

type NotificationInput = Haptics.NotificationFeedbackType | 'success' | 'warning' | 'error';

function normalizeNotificationType(type: NotificationInput): Haptics.NotificationFeedbackType {
  if (type === 'success') return Haptics.NotificationFeedbackType.Success;
  if (type === 'warning') return Haptics.NotificationFeedbackType.Warning;
  if (type === 'error') return Haptics.NotificationFeedbackType.Error;
  return type;
}

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
    (type: NotificationInput = Haptics.NotificationFeedbackType.Success) => {
      if (!hapticsEnabled) return;
      void Haptics.notificationAsync(normalizeNotificationType(type));
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
