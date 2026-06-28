import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { AmbientStatus } from '@/stores/miriamAmbientStore';

const THICK = 104;

// Per-status "breathing" — duration + peak intensity. Quiet while listening,
// urgent pulse while speaking. (Emil: short, purposeful, transform/opacity only.)
const TUNING: Record<AmbientStatus, { duration: number; peak: number }> = {
  dormant: { duration: 0, peak: 0 },
  waking: { duration: 900, peak: 0.6 },
  listening: { duration: 2200, peak: 0.55 },
  thinking: { duration: 1300, peak: 0.5 },
  speaking: { duration: 720, peak: 0.85 },
};

const EMBER = 'rgba(255,62,0,';
const GREEN = 'rgba(0,202,72,';

function Edges({ base, alpha }: { base: string; alpha: number }) {
  const a = alpha.toFixed(3);
  const solid = `${base}${a})`;
  const clear = `${base}0)`;
  return (
    <>
      <LinearGradient
        colors={[solid, clear]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.edge, { top: 0, left: 0, right: 0, height: THICK }]}
      />
      <LinearGradient
        colors={[clear, solid]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.edge, { bottom: 0, left: 0, right: 0, height: THICK }]}
      />
      <LinearGradient
        colors={[solid, clear]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.edge, { left: 0, top: 0, bottom: 0, width: THICK }]}
      />
      <LinearGradient
        colors={[clear, solid]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.edge, { right: 0, top: 0, bottom: 0, width: THICK }]}
      />
    </>
  );
}

/**
 * Full-bleed edge glow that makes the app feel alive while Miriam is present.
 * Two color layers (ember + green) cross-breathe for a shimmer, and the whole
 * field pulses harder while she speaks. Purely decorative — never intercepts touch.
 */
export function AmbientGlow({ status }: { status: AmbientStatus }) {
  const breath = useSharedValue(0); // 0..1 ember↔green cross-fade + intensity
  const t = TUNING[status];

  useEffect(() => {
    cancelAnimation(breath);
    if (status === 'dormant') {
      breath.value = withTiming(0, { duration: 280 });
      return;
    }
    breath.value = withRepeat(
      withTiming(1, { duration: t.duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [status, t.duration, breath]);

  const emberStyle = useAnimatedStyle(() => ({ opacity: (1 - breath.value) * t.peak + 0.12 }));
  const greenStyle = useAnimatedStyle(() => ({ opacity: breath.value * t.peak }));

  if (status === 'dormant') return null;

  return (
    <Animated.View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, emberStyle]}>
        <Edges base={EMBER} alpha={1} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, greenStyle]}>
        <Edges base={GREEN} alpha={1} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  edge: { position: 'absolute' },
});
