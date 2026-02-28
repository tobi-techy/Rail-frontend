import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { FONT_FAMILIES } from '@/constants/fonts';
import type { OnboardingSlide } from './onboardingSlides';

interface Props {
  item: OnboardingSlide;
  topInset: number;
  isCompactWidth: boolean;
}

export const SlideContent = memo(function SlideContent({ item, topInset, isCompactWidth }: Props) {
  return (
    <View className="z-10 w-full px-4" style={{ paddingTop: topInset + 16 }}>
      <View className="self-start rounded-full border border-white/30 bg-black/60 px-3 py-2">
        <Text
          style={{
            color: '#F2F2F2',
            fontFamily: FONT_FAMILIES.SF_PRO_ROUNDED.SEMIBOLD,
            fontSize: 11,
            letterSpacing: 0.8,
          }}>
          {item.marker}
        </Text>
      </View>

      <View className="mt-6">
        <Text
          style={{
            color: '#FFFFFF',
            fontFamily: FONT_FAMILIES.SF_PRO_ROUNDED.BOLD,
            fontSize: isCompactWidth ? 34 : 40,
            lineHeight: isCompactWidth ? 40 : 46,
            letterSpacing: -0.8,
            maxWidth: isCompactWidth ? '100%' : '90%',
          }}>
          {item.title}
        </Text>
        <Text
          style={{
            color: '#FFC9BC',
            fontFamily: FONT_FAMILIES.SF_PRO_ROUNDED.SEMIBOLD,
            fontSize: isCompactWidth ? 16 : 18,
            lineHeight: isCompactWidth ? 22 : 24,
            marginTop: 8,
            maxWidth: isCompactWidth ? '100%' : '85%',
          }}>
          {item.subtitle}
        </Text>
        <Text
          style={{
            color: '#D6D6D6',
            fontFamily: FONT_FAMILIES.SF_PRO_ROUNDED.REGULAR,
            fontSize: 14,
            lineHeight: 20,
            marginTop: 12,
            maxWidth: isCompactWidth ? '100%' : '82%',
          }}>
          {item.description}
        </Text>
      </View>

      <View className="mt-6 self-start rounded-2xl border border-white/20 bg-black/55 px-4 py-3">
        {item.asciiLines.map((line) => (
          <Text
            key={line}
            style={{
              color: '#F8F8F8',
              fontFamily: FONT_FAMILIES.SF_PRO_ROUNDED.MEDIUM,
              fontSize: 12,
              lineHeight: 17,
              letterSpacing: 0.7,
            }}>
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
});
