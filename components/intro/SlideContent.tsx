import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { FONT_FAMILIES } from '@/constants/fonts';
import { MiriamCharacter } from '@/components/ai';
import type { OnboardingSlide } from './onboardingSlides';

interface Props {
  item: OnboardingSlide;
  isCompactWidth: boolean;
}

export const SlideContent = memo(function SlideContent({ item, isCompactWidth }: Props) {
  return (
    <View className="mt-24 w-full px-5">
      {item.showMiriam ? (
        <View className="mb-5">
          <MiriamCharacter size={64} emotion="happy" animate />
        </View>
      ) : null}
      <Text
        style={{
          color: '#FFFFFF',
          fontFamily: FONT_FAMILIES.SATOSHI.BOLD,
          fontSize: isCompactWidth ? 32 : 38,
          lineHeight: isCompactWidth ? 38 : 44,
          letterSpacing: -0.8,
        }}>
        {item.title}
      </Text>
    </View>
  );
});
