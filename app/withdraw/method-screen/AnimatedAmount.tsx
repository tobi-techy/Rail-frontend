import React, { useEffect, useRef } from 'react';
import { Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { layout, moderateScale, responsive } from '@/utils/layout';

type AnimatedAmountProps = {
  amount: string;
};

export function AnimatedAmount({ amount }: AnimatedAmountProps) {
  const scale = useSharedValue(1);
  const prevAmountRef = useRef(amount);

  useEffect(() => {
    if (prevAmountRef.current !== amount) {
      scale.value = withSequence(
        withTiming(1.03, { duration: 80 }),
        withSpring(1, { damping: 12, stiffness: 300, mass: 0.5 })
      );
      prevAmountRef.current = amount;
    }
  }, [amount, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const displayText = `$${amount}`;
  const len = displayText.length;
  const baseSize =
    len <= 4
      ? responsive({ default: 95, tall: 89, android: 84 })
      : len <= 7
        ? responsive({ default: 79, tall: 74, android: 68 })
        : len <= 10
          ? responsive({ default: 58, tall: 54, android: 50 })
          : len <= 14
            ? responsive({ default: 40, tall: 38, android: 36 })
            : responsive({ default: 42, tall: 39, android: 37 });
  const fontSize = moderateScale(baseSize, layout.isSeekerDevice ? 0.35 : 0.45);

  return (
    <Animated.View style={animatedStyle} className="w-full">
      <Text
        style={{
          fontFamily: 'SF-Pro-Rounded-Bold',
          fontSize,
          color: '#FFFFFF',
          textAlign: 'center',
          fontVariant: ['tabular-nums'],
        }}
        numberOfLines={1}>
        {displayText}
      </Text>
    </Animated.View>
  );
}
