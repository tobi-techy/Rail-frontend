import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { layout, moderateScale, responsive } from '@/utils/layout';

type AnimatedAmountProps = { amount: string; prefix?: string };

const glideSpring = { damping: 14, stiffness: 200, mass: 0.7 };
const fadeSpring = { damping: 22, stiffness: 100, mass: 0.8 };
// Size-tier transitions: settle quickly with no bounce so the number feels
// like it's making room, not wobbling.
const sizeSpring = { damping: 24, stiffness: 260, mass: 0.9 };

function AnimatedChar({
  char,
  fontSize,
  animate,
}: {
  char: string;
  fontSize: SharedValue<number>;
  animate: boolean;
}) {
  const translateY = useSharedValue(animate ? 24 : 0);
  const opacity = useSharedValue(animate ? 0.15 : 1);

  useEffect(() => {
    if (animate) {
      translateY.value = withSpring(0, glideSpring);
      opacity.value = withSpring(1, fadeSpring);
    }
  }, [animate]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    fontSize: fontSize.value,
  }));

  return (
    <Animated.View style={style}>
      <Animated.Text
        style={[
          {
            fontFamily: 'CommitMono-700',
            color: '#FFFFFF',
            fontVariant: ['tabular-nums'],
          },
          textStyle,
        ]}>
        {char}
      </Animated.Text>
    </Animated.View>
  );
}

export function AnimatedAmount({ amount, prefix = '$' }: AnimatedAmountProps) {
  const prevLen = useRef(amount.length);
  const grew = amount.length > prevLen.current;
  useEffect(() => {
    prevLen.current = amount.length;
  });

  const displayText = `${prefix}${amount}`;
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
  const targetSize = moderateScale(baseSize, layout.isSeekerDevice ? 0.35 : 0.45);

  const fontSize = useSharedValue(targetSize);
  useEffect(() => {
    fontSize.value = withSpring(targetSize, sizeSpring);
  }, [targetSize]);

  return (
    <View
      style={{
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'flex-end',
        overflow: 'hidden',
      }}>
      {displayText.split('').map((char, i) => (
        <AnimatedChar
          key={`${i}-${displayText.length}`}
          char={char}
          fontSize={fontSize}
          animate={grew && i === displayText.length - 1}
        />
      ))}
    </View>
  );
}
