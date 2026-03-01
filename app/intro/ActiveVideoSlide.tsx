import React, { memo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { OnboardingSlide } from './onboardingSlides';

interface Props {
  item: OnboardingSlide;
  width: number;
  height: number;
}

export const ActiveVideoSlide = memo(function ActiveVideoSlide({ item, width, height }: Props) {
  const blackOpacity = useSharedValue(1);

  const player = useVideoPlayer(item.video, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    blackOpacity.value = 1;
  }, [item.key, blackOpacity]);

  useEffect(() => {
    const fallback = setTimeout(() => {
      blackOpacity.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
    }, 800);

    player.play();

    return () => {
      clearTimeout(fallback);
      try { player.pause(); } catch { /* native object may already be released */ }
    };
  }, [item.key, player, blackOpacity]);

  const blackStyle = useAnimatedStyle(() => ({ opacity: blackOpacity.value }));

  return (
    <View className="flex-1 overflow-hidden bg-black" style={{ width }}>
      <VideoView
        player={player}
        style={{ width, height, position: 'absolute', top: 0, left: 0 }}
        contentFit="cover"
        nativeControls={false}
        onFirstFrameRender={() => {
          blackOpacity.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.ease) });
        }}
        useExoShutter={false}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 5 }]} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000', zIndex: 6 }, blackStyle]} />
    </View>
  );
});
