import React, { useEffect } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

export type StatusIconType = 'success' | 'pending' | 'failed';

/**
 * Clean isocons-style line status icon (24-grid, ~2.5px stroke, round caps)
 * that draws itself on: the ring sweeps in first, then the inner glyph is
 * "written" via a stroke-dash reveal. Colors match the withdrawal status
 * palette. Respects Reduce Motion (snaps to the final drawn state).
 */

const VIEWBOX = 48;
const CENTER = VIEWBOX / 2;
const RADIUS = 21;
const STROKE = 2.5;
const RING_LEN = 2 * Math.PI * RADIUS;

const CONFIG: Record<StatusIconType, { color: string; tint: string }> = {
  success: { color: '#00C853', tint: 'rgba(0,200,83,0.10)' },
  pending: { color: '#F59E0B', tint: 'rgba(245,158,11,0.10)' },
  failed: { color: '#EF4444', tint: 'rgba(239,68,68,0.10)' },
};

// Glyph paths + their approximate stroke lengths (for the dash reveal).
const CHECK_D = 'M14.5 24.5 L21 31 L34 17.5';
const CHECK_LEN = 28;
const CLOCK_D = 'M24 14 L24 24 L31 27.5';
const CLOCK_LEN = 18;
const CROSS_A_D = 'M18.5 18.5 L29.5 29.5';
const CROSS_B_D = 'M29.5 18.5 L18.5 29.5';
const CROSS_LEN = 16;

/** A single glyph stroke that reveals as `progress` goes 0 → 1. */
function GlyphStroke({
  d,
  length,
  progress,
  color,
}: {
  d: string;
  length: number;
  progress: SharedValue<number>;
  color: string;
}) {
  const props = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - progress.value),
  }));
  return (
    <AnimatedPath
      d={d}
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      strokeDasharray={length}
      animatedProps={props}
    />
  );
}

export function AnimatedStatusIcon({
  status,
  size = 140,
}: {
  status: StatusIconType;
  size?: number;
}) {
  const reduced = useReducedMotion();
  const { color, tint } = CONFIG[status];

  const ring = useSharedValue(reduced ? 1 : 0);
  const glyph = useSharedValue(reduced ? 1 : 0);
  const pop = useSharedValue(reduced ? 1 : 0.72);

  useEffect(() => {
    if (reduced) {
      ring.value = 1;
      glyph.value = 1;
      pop.value = 1;
      return;
    }
    // Reset then play so the animation re-fires if the status changes.
    ring.value = 0;
    glyph.value = 0;
    pop.value = 0.72;

    pop.value = withSpring(1, { damping: 12, stiffness: 150, mass: 0.6 });
    ring.value = withTiming(1, { duration: 540, easing: Easing.out(Easing.cubic) });
    glyph.value = withDelay(
      440,
      withTiming(1, { duration: 340, easing: Easing.out(Easing.cubic) })
    );
  }, [status, reduced, ring, glyph, pop]);

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_LEN * (1 - ring.value),
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, containerStyle]}>
      <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
        {/* Soft tinted badge fill */}
        <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill={tint} />
        {/* Animated ring — sweeps in from the top */}
        <AnimatedCircle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={RING_LEN}
          animatedProps={ringProps}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
        />
        {/* Inner glyph — written on after the ring */}
        {status === 'success' && (
          <GlyphStroke d={CHECK_D} length={CHECK_LEN} progress={glyph} color={color} />
        )}
        {status === 'pending' && (
          <GlyphStroke d={CLOCK_D} length={CLOCK_LEN} progress={glyph} color={color} />
        )}
        {status === 'failed' && (
          <>
            <GlyphStroke d={CROSS_A_D} length={CROSS_LEN} progress={glyph} color={color} />
            <GlyphStroke d={CROSS_B_D} length={CROSS_LEN} progress={glyph} color={color} />
          </>
        )}
      </Svg>
    </Animated.View>
  );
}

AnimatedStatusIcon.displayName = 'AnimatedStatusIcon';
