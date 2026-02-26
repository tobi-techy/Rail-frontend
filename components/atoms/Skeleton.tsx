import React, { useEffect } from 'react';
import { ViewProps } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface SkeletonProps extends ViewProps {
  className?: string;
  minOpacity?: number;
  maxOpacity?: number;
  duration?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  minOpacity = 0.45,
  maxOpacity = 1,
  duration = 700,
  style,
  ...props
}) => {
  const opacity = useSharedValue(maxOpacity);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(minOpacity, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(maxOpacity, { duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    return () => {
      cancelAnimation(opacity);
    };
  }, [duration, maxOpacity, minOpacity, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      className={`rounded-md bg-surface ${className ?? ''}`}
      style={[animatedStyle, style]}
      {...props}
    />
  );
};
