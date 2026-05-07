import React, { memo, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { OnboardingSlide } from './onboardingSlides';

interface Props {
  item: OnboardingSlide;
  width: number;
  height: number;
}

export const ActiveVideoSlide = memo(function ActiveVideoSlide({ item, width, height }: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <View style={{ width, height }} className="bg-black">
      {loaded && (
        <Animated.View entering={FadeIn.duration(250)} style={StyleSheet.absoluteFillObject}>
          <View style={StyleSheet.absoluteFillObject} className="bg-black/40" />
        </Animated.View>
      )}
      <Image
        source={item.image}
        style={{ width, height, position: 'absolute', top: 0, left: 0 }}
        resizeMode="cover"
        fadeDuration={0}
        onLoad={() => setLoaded(true)}
      />
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject} className="bg-black/40" />
    </View>
  );
});
