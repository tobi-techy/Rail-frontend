import { Platform } from 'react-native';
import * as ExpoHaptics from 'expo-haptics';

export { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics';

const shouldRunHaptics = Platform.OS !== 'android';

export const impactAsync: typeof ExpoHaptics.impactAsync = (style) => {
  if (!shouldRunHaptics) return Promise.resolve();
  return ExpoHaptics.impactAsync(style);
};

export const selectionAsync: typeof ExpoHaptics.selectionAsync = () => {
  if (!shouldRunHaptics) return Promise.resolve();
  return ExpoHaptics.selectionAsync();
};

export const notificationAsync: typeof ExpoHaptics.notificationAsync = (type) => {
  if (!shouldRunHaptics) return Promise.resolve();
  return ExpoHaptics.notificationAsync(type);
};
