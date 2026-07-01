/**
 * Cross-platform glass effect:
 * - iOS: expo-blur BlurView with translucent overlay
 * - Reduce Transparency on: opaque solid surface (HIG accessibility requirement)
 *
 * @callstack/liquid-glass was removed — it linked against Apple's private
 * SwiftUICore framework which the simulator SDK rejects at link time and which
 * caused runtime crashes on iOS 26.2 devices.
 */
import React, { useEffect, useState } from 'react';
import { View, Platform, AccessibilityInfo, type ViewStyle, type StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  fallbackColor?: string;
  interactive?: boolean;
  effect?: 'clear' | 'regular';
  /** When true, tints the glass with a white/light background (non-tabbar surfaces) */
  white?: boolean;
}

// Honors the system "Reduce Transparency" accessibility setting so glass
// surfaces collapse to an opaque fill instead of staying see-through.
function useReduceTransparency() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let mounted = true;
    // Use optional chaining on the result too — if the API returns undefined
    // (API not available on some runtimes), .then() on undefined throws a
    // synchronous TypeError out of useEffect → RCTFatal crash.
    const promise = AccessibilityInfo.isReduceTransparencyEnabled?.();
    promise
      ?.then((v) => {
        if (mounted) setReduce(!!v);
      })
      ?.catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', (v) => {
      if (mounted) setReduce(!!v);
    });
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);
  return reduce;
}

export function GlassView({
  children,
  style,
  fallbackColor,
  effect = 'regular',
  white = false,
}: GlassViewProps) {
  const reduceTransparency = useReduceTransparency();

  if (reduceTransparency) {
    const opaqueDefault = white ? '#FFFFFF' : '#ECEBE7';
    return (
      <View style={[{ backgroundColor: fallbackColor ?? opaqueDefault }, style]}>{children}</View>
    );
  }

  const intensity = effect === 'clear' ? 40 : white ? 80 : 60;
  const defaultFallback = white ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.18)';

  return (
    <BlurView
      intensity={intensity}
      tint={Platform.OS === 'ios' ? 'systemChromeMaterial' : 'light'}
      style={[{ backgroundColor: fallbackColor ?? defaultFallback }, style]}>
      {children}
    </BlurView>
  );
}
