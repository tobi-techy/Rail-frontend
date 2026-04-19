import React, { useEffect, useRef } from 'react';
import { Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';

const AnimatedText = Animated.createAnimatedComponent(Text);

interface Props {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  style?: any;
}

export function AnimatedBalance({ value, prefix = '$', suffix = '', decimals = 2, duration = 600, style }: Props) {
  const animatedValue = useSharedValue(value);
  const prevValue = useRef(value);
  const displayRef = useRef(`${prefix}${value.toFixed(decimals)}${suffix}`);

  useEffect(() => {
    if (value !== prevValue.current) {
      animatedValue.value = withTiming(value, { duration, easing: Easing.out(Easing.cubic) });
      prevValue.current = value;
    }
  }, [value]);

  // For RN, we use a polling approach since animatedProps on Text content isn't directly supported
  const [display, setDisplay] = React.useState(`${prefix}${value.toFixed(decimals)}${suffix}`);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    if (start === end) return;

    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      setDisplay(`${prefix}${current.toFixed(decimals)}${suffix}`);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    prevValue.current = value;
  }, [value, prefix, suffix, decimals, duration]);

  return <Text style={style}>{display}</Text>;
}
