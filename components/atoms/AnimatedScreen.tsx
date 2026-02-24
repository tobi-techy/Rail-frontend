import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

interface StaggeredChildProps {
  children: React.ReactNode;
  index?: number;
  delay?: number;
  style?: ViewStyle;
}

export function StaggeredChild({ children, index = 0, delay = 50, style }: StaggeredChildProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * delay,
      withSpring(1, { damping: 18, stiffness: 100 })
    );
  }, [index, delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [16, 0]) },
    ],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
