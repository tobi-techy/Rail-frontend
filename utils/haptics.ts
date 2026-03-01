import * as Haptics from 'expo-haptics';
import { useUIStore } from '@/stores';

const enabled = () => useUIStore.getState().hapticsEnabled;

export const haptics = {
  tap:     () => { if (enabled()) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); },
  confirm: () => { if (enabled()) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); },
  success: () => { if (enabled()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); },
  error:   () => { if (enabled()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); },
};
