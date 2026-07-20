import { Platform, Vibration } from 'react-native';
import * as ExpoHaptics from 'expo-haptics';

export { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics';

/**
 * Platform-aware haptic wrapper.
 *
 * All exported functions are SYNCHRONOUS and return void. They schedule native
 * haptic calls via setTimeout(0) so they never block the JS thread or starve
 * touch handlers. The `void` keyword on a Promise is NOT enough — on Android,
 * the microtask queue can still delay the next frame if the native module is
 * slow. setTimeout pushes the work to the next event-loop tick, keeping the
 * interaction handler immediate.
 */

const ANDROID_DURATION = {
  tap: 8,
  light: 10,
  medium: 15,
  heavy: 25,
  success: 30,
  warning: 20,
  error: 40,
} as const;

function androidFallbackVibrate(durationMs: number) {
  try {
    Vibration.vibrate(durationMs);
  } catch {
    /* noop */
  }
}

function mapAndroidStyle(style: ExpoHaptics.ImpactFeedbackStyle): ExpoHaptics.ImpactFeedbackStyle {
  if (style === ExpoHaptics.ImpactFeedbackStyle.Medium)
    return ExpoHaptics.ImpactFeedbackStyle.Heavy;
  if (style === ExpoHaptics.ImpactFeedbackStyle.Rigid) return ExpoHaptics.ImpactFeedbackStyle.Heavy;
  if (style === ExpoHaptics.ImpactFeedbackStyle.Soft) return ExpoHaptics.ImpactFeedbackStyle.Light;
  return style;
}

const hapticsAvailable = true;

/**
 * Fire-and-forget impact haptic. Returns void — never blocks the caller.
 */
export function impactAsync(
  style: ExpoHaptics.ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle.Light
): void {
  if (!hapticsAvailable) return;

  // Schedule on next tick so the touch handler completes in the current frame.
  setTimeout(() => {
    if (Platform.OS === 'android') {
      const mappedStyle = mapAndroidStyle(style);
      ExpoHaptics.impactAsync(mappedStyle).catch(() => {
        const duration =
          style === ExpoHaptics.ImpactFeedbackStyle.Light
            ? ANDROID_DURATION.light
            : style === ExpoHaptics.ImpactFeedbackStyle.Heavy
              ? ANDROID_DURATION.heavy
              : ANDROID_DURATION.medium;
        androidFallbackVibrate(duration);
      });
    } else {
      ExpoHaptics.impactAsync(style).catch(() => {});
    }
  }, 0);
}

/**
 * Fire-and-forget selection haptic. Returns void — never blocks the caller.
 */
export function selectionAsync(): void {
  if (!hapticsAvailable) return;

  setTimeout(() => {
    if (Platform.OS === 'android') {
      ExpoHaptics.selectionAsync().catch(() => androidFallbackVibrate(ANDROID_DURATION.tap));
    } else {
      ExpoHaptics.selectionAsync().catch(() => {});
    }
  }, 0);
}

/**
 * Fire-and-forget notification haptic. Returns void — never blocks the caller.
 */
export function notificationAsync(type?: ExpoHaptics.NotificationFeedbackType): void {
  if (!hapticsAvailable) return;

  setTimeout(() => {
    if (Platform.OS === 'android') {
      const duration =
        type === ExpoHaptics.NotificationFeedbackType.Success
          ? ANDROID_DURATION.success
          : type === ExpoHaptics.NotificationFeedbackType.Warning
            ? ANDROID_DURATION.warning
            : ANDROID_DURATION.error;
      ExpoHaptics.notificationAsync(type).catch(() => androidFallbackVibrate(duration));
    } else {
      ExpoHaptics.notificationAsync(type).catch(() => {});
    }
  }, 0);
}
