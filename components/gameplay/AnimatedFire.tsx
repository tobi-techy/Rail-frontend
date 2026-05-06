import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

interface AnimatedFireProps {
  size?: number;
}

const FLAME_OUTER =
  'M12 2.5c.8 2 2.5 4.2 3.8 7 1 2.2 1.5 4.5 1.2 6.8-.4 3.2-2.5 5.7-5 5.7s-4.6-2.5-5-5.7c-.3-2.3.2-4.6 1.2-6.8 1.3-2.8 3-5 3.8-7z';

const FLAME_MIDDLE =
  'M12 7c.5 1.3 1.5 2.8 2.2 4.5.6 1.4.8 2.8.7 4.2-.2 1.8-1.3 3.3-2.9 3.3s-2.7-1.5-2.9-3.3c-.1-1.4.1-2.8.7-4.2.7-1.7 1.7-3.2 2.2-4.5z';

const FLAME_INNER =
  'M12 11c.3.7.8 1.6 1.1 2.6.3.8.4 1.6.3 2.4-.1 1-1 2-2 2s-1.9-1-2-2c-.1-.8 0-1.6.3-2.4.3-1 1.1-1.9 1.3-2.6z';

export function AnimatedFire({ size = 40 }: AnimatedFireProps) {
  const f1 = useSharedValue(1);
  const f2 = useSharedValue(1);
  const f3 = useSharedValue(1);

  useEffect(() => {
    f1.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 550, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.96, { duration: 480, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.04, { duration: 420, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 550, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    f2.value = withRepeat(
      withSequence(
        withTiming(0.94, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    f3.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: 350, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 450, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [f1, f2, f3]);

  const s1 = useAnimatedStyle(() => ({
    transform: [{ scale: f1.value }],
    opacity: 0.75 + (f1.value - 0.9) * 0.4,
  }));
  const s2 = useAnimatedStyle(() => ({
    transform: [{ scale: f2.value }],
    opacity: 0.8 + (f2.value - 0.9) * 0.35,
  }));
  const s3 = useAnimatedStyle(() => ({
    transform: [{ scale: f3.value }],
    opacity: 0.9 + (f3.value - 0.9) * 0.3,
  }));

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Animated.View style={[{ position: 'absolute' }, s1]}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d={FLAME_OUTER} fill="#ff3e00" />
        </Svg>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute' }, s2]}>
        <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 24 24">
          <Path d={FLAME_MIDDLE} fill="#FF6B35" />
        </Svg>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute' }, s3]}>
        <Svg width={size * 0.48} height={size * 0.48} viewBox="0 0 24 24">
          <Path d={FLAME_INNER} fill="#FFD54F" />
        </Svg>
      </Animated.View>
    </View>
  );
}
