import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

function Dot({ delay }: { delay: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 280, easing: Easing.in(Easing.quad) })
        ),
        -1
      )
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + progress.value * 0.55,
    transform: [{ translateY: -progress.value * 4 }, { scale: 0.9 + progress.value * 0.18 }],
  }));

  return <Animated.View style={style} className="h-2 w-2 rounded-full bg-[#8E8E93]" />;
}

/** iMessage-style "Miriam is typing" indicator: three bouncing dots in a gray bubble. */
export const TypingBubble = React.memo(function TypingBubble() {
  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(140)}
      className="self-start rounded-[20px] bg-[#E9E9EB] px-4 py-3.5">
      <View className="flex-row items-center gap-1.5">
        <Dot delay={0} />
        <Dot delay={160} />
        <Dot delay={320} />
      </View>
    </Animated.View>
  );
});
