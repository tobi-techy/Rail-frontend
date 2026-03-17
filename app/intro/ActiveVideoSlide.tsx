import React, { memo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import type { OnboardingSlide } from './onboardingSlides';

interface Props {
  item: OnboardingSlide;
  width: number;
  height: number;
}

export const ActiveVideoSlide = memo(function ActiveVideoSlide({ item, width, height }: Props) {
  return (
    <View style={{ width, height }} className="bg-black">
      <Image
        source={item.image}
        style={{ width, height, position: 'absolute', top: 0, left: 0 }}
        resizeMode="cover"
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFillObject]} className="bg-black/40" />
    </View>
  );
});
