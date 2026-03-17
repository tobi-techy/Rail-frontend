import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { FONT_FAMILIES } from '@/constants/fonts';
import type { OnboardingSlide } from './onboardingSlides';

interface Props {
  item: OnboardingSlide;
  isCompactWidth: boolean;
}

export const SlideContent = memo(function SlideContent({ item, isCompactWidth }: Props) {
  return (
    <View className="mt-24 w-full px-5">
      <Text
        style={{
          color: '#FFFFFF',
          fontFamily: FONT_FAMILIES.INSTRUMENT_SANS.BOLD,
          fontSize: isCompactWidth ? 32 : 38,
          lineHeight: isCompactWidth ? 38 : 44,
          letterSpacing: -0.8,
        }}>
        {item.title}
      </Text>
      <Text
        style={{
          color: 'rgba(255,255,255,0.65)',
          fontFamily: FONT_FAMILIES.INSTRUMENT_SANS.REGULAR,
          fontSize: 14,
          lineHeight: 20,
          marginTop: 10,
          maxWidth: '88%',
        }}>
        {item.description}
      </Text>
    </View>
  );
});
