import React, { useEffect, useRef } from 'react';
import { Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { layout, moderateScale, responsive } from '@/utils/layout';

type AnimatedAmountProps = { amount: string };

export function AnimatedAmount({ amount }: AnimatedAmountProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const prevLen = useRef(amount.length);

  useEffect(() => {
    const grew = amount.length > prevLen.current;
    prevLen.current = amount.length;
    if (grew) {
      translateY.value = 14;
      opacity.value = 0.4;
      translateY.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });
      opacity.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) });
    }
  }, [amount]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const displayText = `$${amount}`;
  const len = displayText.length;
  const baseSize =
    len <= 4
      ? responsive({ default: 95, tall: 89, android: 84 })
      : len <= 7
        ? responsive({ default: 79, tall: 74, android: 68 })
        : len <= 10
          ? responsive({ default: 58, tall: 60, android: 50 })
          : len <= 14
            ? responsive({ default: 50, tall: 50, android: 42 })
            : responsive({ default: 42, tall: 39, android: 37 });
  const fontSize = moderateScale(baseSize, layout.isSeekerDevice ? 0.35 : 0.45);

  return (
    <Animated.View style={[style, { width: '100%' }]}>
      <Text
        style={{
          fontFamily: 'InstrumentSans-Bold',
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
