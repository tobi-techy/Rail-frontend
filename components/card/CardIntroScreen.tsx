import React from 'react';
import { Dimensions, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Button } from '../ui/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CardIntroScreenProps {
  onCreateCard: () => void;
}

function SignatureSvg({ color = '#fff', size = 80 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size * 0.6} viewBox="0 0 100 60" fill="none">
      <Path
        d="M10 45 Q20 20 35 35 Q50 50 55 30 Q60 10 70 25 Q80 40 90 20"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

function ChipSvg() {
  return (
    <View className="h-8 w-10 rounded-md bg-amber-100">
      <View className="absolute inset-0.5 rounded border border-amber-200/60" />
      <View className="absolute left-1/2 top-0 h-full w-px -translate-x-0.5 bg-amber-200/60" />
      <View className="absolute left-0 top-1/2 h-px w-full -translate-y-0.5 bg-amber-200/60" />
    </View>
  );
}

function CardStack() {
  const cardWidth = Math.min(SCREEN_WIDTH * 0.7, 280);
  const cardHeight = cardWidth * 1.58;

  return (
    <View className="items-center justify-center" style={{ height: cardHeight + 40 }}>
      {/* Back card (white) */}
      <View
        className="absolute rounded-2xl bg-gray-100"
        style={{
          width: cardWidth,
          height: cardHeight,
          transform: [{ rotate: '-8deg' }, { translateX: -30 }, { translateY: -10 }],
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 8 },
            },
            android: { elevation: 4 },
          }),
        }}>
        <View className="absolute left-5 top-8">
          <Text
            className="font-subtitle text-sm text-gray-400"
            style={{ transform: [{ rotate: '-90deg' }, { translateX: -30 }, { translateY: -20 }] }}>
            $yourname
          </Text>
        </View>
      </View>

      {/* Front card (black) */}
      <View
        className="rounded-2xl bg-black"
        style={{
          width: cardWidth,
          height: cardHeight,
          transform: [{ rotate: '4deg' }, { translateX: 20 }],
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowRadius: 30,
              shadowOffset: { width: 0, height: 15 },
            },
            android: { elevation: 12 },
          }),
        }}>
        {/* Username */}
        <View className="absolute left-5 top-8">
          <Text
            className="font-subtitle text-sm text-white"
            style={{ transform: [{ rotate: '-90deg' }, { translateX: -30 }, { translateY: -20 }] }}>
            $railuser
          </Text>
        </View>

        {/* Signature */}
        <View className="absolute bottom-24 right-6">
          <SignatureSvg color="#fff" size={100} />
        </View>

        {/* Chip */}
        <View className="absolute bottom-8 left-6">
          <ChipSvg />
        </View>
      </View>
    </View>
  );
}

export function CardIntroScreen({ onCreateCard }: CardIntroScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-2">
        <Text className="font-headline text-3xl text-gray-900">Free Debit Card</Text>
        <Text className="mt-1 font-body text-base text-gray-400">With Instant Discounts</Text>
      </View>

      {/* Card Stack */}
      <View className="flex-1 items-center justify-center">
        <CardStack />
      </View>

      {/* Bottom Buttons */}
      <View className="flex-row gap-3 px-5 pb-6">
        <Button title="Learn More" variant="white" size="large" flex onPress={() => {}} />
        <Button title="Get Card" variant="black" size="large" flex onPress={onCreateCard} />
      </View>
    </SafeAreaView>
  );
}
