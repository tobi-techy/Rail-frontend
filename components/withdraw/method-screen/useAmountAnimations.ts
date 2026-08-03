import { useEffect, useRef } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withSpring,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { springConfig } from './constants';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const keypadSpring = { damping: 22, stiffness: 260, mass: 0.8 };

export function useAmountAnimations(rawAmount: string) {
  const reduceMotion = useReducedMotion();
  const headerOpacity = useSharedValue(0);
  const keypadTranslateY = useSharedValue(reduceMotion ? 0 : 36);
  const pillsScale = useSharedValue(0.92);
  const pillsOpacity = useSharedValue(0);
  const pillsRevealed = useRef(false);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 220, easing: EASE_OUT });
    keypadTranslateY.value = withSpring(0, keypadSpring);
  }, [headerOpacity, keypadTranslateY]);

  useEffect(() => {
    const hasValue = Number(rawAmount) > 0;
    if (hasValue && !pillsRevealed.current) {
      pillsRevealed.current = true;
      pillsScale.value = withSpring(1, springConfig);
      pillsOpacity.value = withTiming(1, { duration: 180, easing: EASE_OUT });
    } else if (!hasValue) {
      pillsRevealed.current = false;
      pillsScale.value = withSpring(0.92, springConfig);
      pillsOpacity.value = withTiming(0.7, { duration: 140 });
    }
  }, [pillsOpacity, pillsScale, rawAmount]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const keypadAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: keypadTranslateY.value }],
    opacity: interpolate(keypadTranslateY.value, [36, 0], [0, 1]),
  }));
  const pillsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pillsScale.value }],
    opacity: pillsOpacity.value,
  }));

  return { headerAnimatedStyle, keypadAnimatedStyle, pillsAnimatedStyle };
}
