import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

interface AnimatedScreenProps {
  children: React.ReactNode;
}

export function AnimatedScreen({ children }: AnimatedScreenProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 350,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [20, 0]) },
      { scale: interpolate(progress.value, [0, 1], [0.98, 1]) },
    ],
  }));

  return <Animated.View style={[styles.container, animatedStyle]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
