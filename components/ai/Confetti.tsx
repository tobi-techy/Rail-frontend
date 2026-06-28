import React, { useEffect, useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { EASE_GRAVITY } from '@/lib/motion';

const COLORS = ['#FF3E00', '#FF6A3D', '#00CA48', '#0090FF', '#FFBB26', '#FF58AE', '#9F4FFF'];

interface PieceProps {
  startX: number;
  fallDistance: number;
  duration: number;
  delay: number;
  drift: number;
  color: string;
  size: number;
  spins: number;
  wobbleAmp: number;
  wobbleFreq: number;
}

function ConfettiPiece({
  startX,
  fallDistance,
  duration,
  delay,
  drift,
  color,
  size,
  spins,
  wobbleAmp,
  wobbleFreq,
}: PieceProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    // Accelerating fall (gravity) rather than ease-out, which would look like floating.
    progress.value = withDelay(delay, withTiming(1, { duration, easing: EASE_GRAVITY }));
  }, [delay, duration, progress]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    // Horizontal flutter: drift + a gentle sine wobble so pieces don't fall in straight lines.
    const wobble = Math.sin(p * Math.PI * wobbleFreq) * wobbleAmp * (1 - p * 0.4);
    return {
      transform: [
        { translateX: startX + drift * p + wobble },
        { translateY: -40 + fallDistance * p },
        { rotate: `${spins * 360 * p}deg` },
        { scale: 1 - p * 0.2 },
      ],
      // Fade out in the last 25% of the fall
      opacity: p < 0.75 ? 1 : Math.max(0, 1 - (p - 0.75) / 0.25),
    };
  });

  // Mix rectangles and thin strips for organic confetti
  const isStrip = size % 2 === 0;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          width: isStrip ? size * 0.5 : size,
          height: isStrip ? size * 1.4 : size,
          borderRadius: 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

interface Props {
  /** number of confetti pieces */
  count?: number;
  /** triggers a fresh burst whenever this value changes */
  burstKey: number;
  /** "small" = light, "big"/"epic" = denser & longer */
  intensity?: 'small' | 'big' | 'epic';
  onDone?: () => void;
}

/**
 * Lightweight Reanimated confetti burst — no native dependency. Renders a
 * full-screen, non-interactive layer of falling, rotating, fading pieces.
 * Re-fires whenever `burstKey` changes.
 */
export const Confetti = React.memo(function Confetti({
  count,
  burstKey,
  intensity = 'big',
  onDone,
}: Props) {
  const { width, height } = useWindowDimensions();

  const pieceCount = count ?? (intensity === 'small' ? 28 : intensity === 'epic' ? 90 : 56);
  const baseDuration = intensity === 'epic' ? 3200 : intensity === 'small' ? 1900 : 2500;

  const pieces = useMemo(() => {
    return Array.from({ length: pieceCount }, (_, i) => ({
      key: `${burstKey}-${i}`,
      startX: Math.random() * width,
      fallDistance: height * (0.7 + Math.random() * 0.5),
      duration: baseDuration + Math.random() * 800,
      delay: Math.random() * 350,
      drift: (Math.random() - 0.5) * 160,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 8 + Math.floor(Math.random() * 7),
      spins: 1 + Math.random() * 3,
      wobbleAmp: 12 + Math.random() * 22,
      wobbleFreq: 2 + Math.random() * 3,
    }));
  }, [burstKey, pieceCount, width, height, baseDuration]);

  // Fire onDone after the longest piece finishes
  useEffect(() => {
    const longest = baseDuration + 800 + 350;
    const t = setTimeout(() => {
      onDone?.();
    }, longest);
    return () => clearTimeout(t);
  }, [burstKey, baseDuration, onDone]);

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {pieces.map((p) => (
        <ConfettiPiece
          key={p.key}
          startX={p.startX}
          fallDistance={p.fallDistance}
          duration={p.duration}
          delay={p.delay}
          drift={p.drift}
          color={p.color}
          size={p.size}
          spins={p.spins}
          wobbleAmp={p.wobbleAmp}
          wobbleFreq={p.wobbleFreq}
        />
      ))}
    </View>
  );
});
