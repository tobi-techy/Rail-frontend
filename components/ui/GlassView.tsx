/**
 * Cross-platform glass effect:
 * - iOS 26+: native UIGlassEffect via @callstack/liquid-glass
 * - Android / iOS < 26: expo-blur BlurView with translucent overlay
 */
import React from 'react';
import { View, Platform, type ViewStyle, type StyleProp } from 'react-native';
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

export function GlassView({ children, style, fallbackColor, interactive, effect = 'regular', white = false }: GlassViewProps) {
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
