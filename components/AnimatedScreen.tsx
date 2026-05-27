import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';

interface AnimatedScreenProps {
  children: React.ReactNode;
  delay?: number;
}

export function AnimatedScreen({ children, delay = 0 }: AnimatedScreenProps) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 250, easing: Easing.out(Easing.ease) })
    );
    progress.value = withDelay(
      delay,
      withSpring(1, {
        damping: 24,
        stiffness: 200,
        mass: 0.9,
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [32, 0]) }],
  }));

  return (
    <Animated.View className="flex-1" style={animatedStyle}>
      {children}
    </Animated.View>
  );
}
