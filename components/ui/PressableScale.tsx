import React, { useRef, useCallback } from 'react';
import { Pressable, PressableProps, Animated } from 'react-native';
import { useButtonFeedback } from '@/hooks/useButtonFeedback';

interface PressableScaleProps extends PressableProps {
  scaleTo?: number;
  enableHaptics?: boolean;
  enableSound?: boolean;
}

export function PressableScale({
  scaleTo = 0.97,
  enableHaptics = true,
  enableSound = true,
  onPressIn,
  onPressOut,
  style,
  ...props
}: PressableScaleProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const triggerFeedback = useButtonFeedback(enableHaptics, enableSound);

  const handlePressIn = useCallback(
    (e: any) => {
      triggerFeedback();
      Animated.spring(scaleAnim, {
        toValue: scaleTo,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }).start();
      onPressIn?.(e);
    },
    [scaleAnim, triggerFeedback, scaleTo, onPressIn]
  );

  const handlePressOut = useCallback(
    (e: any) => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 60,
        bounciness: 0,
      }).start();
      onPressOut?.(e);
    },
    [scaleAnim, onPressOut]
  );

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style as any]}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} {...props} />
    </Animated.View>
  );
}
