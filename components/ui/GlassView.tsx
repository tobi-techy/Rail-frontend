/**
 * Cross-platform glass effect:
 * - iOS 26+: native UIGlassEffect via @callstack/liquid-glass
 * - Android / iOS < 26: expo-blur BlurView with translucent overlay
 * - Reduce Transparency on: opaque solid surface (HIG accessibility requirement)
 */
import React, { useEffect, useState } from 'react';
import { View, Platform, AccessibilityInfo, type ViewStyle, type StyleProp } from 'react-native';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
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

const USE_NATIVE_GLASS = Platform.OS === 'ios' && isLiquidGlassSupported;

// Honors the system "Reduce Transparency" accessibility setting so glass
// surfaces collapse to an opaque fill instead of staying see-through.
function useReduceTransparency() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceTransparencyEnabled?.()
      .then((v) => { if (mounted) setReduce(!!v); })
      .catch(() => { /* deterministic fallback: keep reduce = false */ });
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

export function GlassView({ children, style, fallbackColor, interactive, effect = 'regular', white = false }: GlassViewProps) {
  const reduceTransparency = useReduceTransparency();

  // Accessibility: opaque surface, no blur. Use the caller-provided fallbackColor
  // when supplied (e.g. TabBar's custom surface), otherwise pick a built-in opaque tone.
  if (reduceTransparency) {
    const opaqueDefault = white ? '#FFFFFF' : '#ECEBE7';
    return <View style={[{ backgroundColor: fallbackColor ?? opaqueDefault }, style]}>{children}</View>;
  }

  if (USE_NATIVE_GLASS) {
    return (
      <LiquidGlassView effect={effect} interactive={interactive} style={style}>
        {children}
      </LiquidGlassView>
    );
  }

  // Android + iOS < 26: BlurView with white-tinted overlay for non-tabbar glass.
  const defaultFallback = white ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.18)';
  return (
    <BlurView
      intensity={white ? 80 : 60}
      tint="light"
      style={[{ backgroundColor: fallbackColor ?? defaultFallback }, style]}>
      {children}
    </BlurView>
  );
}
