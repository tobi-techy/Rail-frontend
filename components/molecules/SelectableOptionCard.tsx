import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import { ImpactFeedbackStyle } from 'expo-haptics';

export interface SelectableOption {
  value: string;
  label: string;
  icon: string;
}

export function SelectableCard({
  option,
  selected,
  onPress,
  index,
}: {
  option: SelectableOption;
  selected: boolean;
  onPress: () => void;
  index: number;
}) {
  const { impact } = useHaptics();

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <Pressable
        onPress={() => {
          impact(ImpactFeedbackStyle.Medium);
          playUISound('buttonClick');
          onPress();
        }}
        className={`mb-2.5 flex-row items-center rounded-xl border-[1.5px] px-4 py-3.5 ${
          selected ? 'border-charcoal-primary bg-warm-canvas' : 'border-fog bg-white'
        }`}
        style={({ pressed }) => ({
          transform: [{ scale: pressed ? 0.97 : 1 }],
        })}>
        <Text className="mr-3 text-lg">{option.icon}</Text>
        <Text
          className={`flex-1 font-subtitle text-[15px] ${
            selected ? 'text-charcoal-primary' : 'text-ash'
          }`}
          maxFontSizeMultiplier={1.3}>
          {option.label}
        </Text>
        <View
          className={`h-5 w-5 items-center justify-center rounded-full border-[1.5px] ${
            selected ? 'border-charcoal-primary' : 'border-fog'
          }`}>
          {selected && <View className="h-2.5 w-2.5 rounded-full bg-charcoal-primary" />}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="mb-3">
      <Text className="font-subtitle text-[17px] text-charcoal-primary" maxFontSizeMultiplier={1.3}>
        {title}
      </Text>
      {subtitle && (
        <Text className="mt-0.5 font-body text-[13px] text-smoke" maxFontSizeMultiplier={1.4}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}
