import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { MOTION } from '@/theme/motion';

const { width, height } = Dimensions.get('window');

interface ConfettiPieceProps {
  delay: number;
  startX: number;
}

const ConfettiPiece = ({ delay, startX }: ConfettiPieceProps) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(startX);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const color = MOTION.confetti.colors[Math.floor(Math.random() * MOTION.confetti.colors.length)];
  const size = 8 + Math.random() * 8;

  useEffect(() => {
    const duration =
      MOTION.confetti.duration.min +
      Math.random() * (MOTION.confetti.duration.max - MOTION.confetti.duration.min);
    translateY.value = withDelay(delay, withTiming(height + 100, { duration }));
    translateX.value = withDelay(
      delay,
      withTiming(startX + (Math.random() - 0.5) * 200, { duration })
    );
    rotate.value = withDelay(delay, withTiming(360 * (2 + Math.random() * 3), { duration }));
    opacity.value = withDelay(2500 + delay, withTiming(0, { duration: 500 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size * 0.6,
          backgroundColor: color,
          borderRadius: 2,
          top: 0,
        },
        style,
      ]}
    />
  );
};

interface ConfettiProps {
  count?: number;
}

export const Confetti = ({ count = MOTION.confetti.count }: ConfettiProps) => (
  <View
    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}
    pointerEvents="none">
    {Array.from({ length: count }, (_, i) => (
      <ConfettiPiece key={i} delay={Math.random() * 500} startX={Math.random() * width} />
    ))}
  </View>
);
