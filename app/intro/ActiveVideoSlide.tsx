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
    <View style={{ width, height, backgroundColor: '#000' }}>
      <Image
        source={item.image}
        style={{
          width: width * 0.85,
          height: height * 0.85,
          position: 'absolute',
          top: 0,
          left: width * 0.075,
        }}
        resizeMode="cover"
      />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
      />
    </View>
  );
});
