import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { HugeiconsIcon } from '@hugeicons/react-native';
import type { IconComponentType } from '@hugeicons/react-native';

export type FundingOption = {
  id: string;
  icon: IconComponentType | React.ReactNode;
  iconColor?: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  badge?: string;
};

export function OptionCard({ option, index }: { option: FundingOption; index: number }) {
  const isHugeIcon = option.icon && typeof option.icon === 'function';

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 60)}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          option.onPress();
        }}
        className="mx-5 mb-3 flex-row items-center gap-4 rounded-2xl border border-[#F3F4F6] bg-white px-4 py-5 active:bg-[#F9FAFB]"
        accessibilityRole="button"
        accessibilityLabel={option.title}>
        <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#F3F4F6]">
          {isHugeIcon ? (
            <HugeiconsIcon
              icon={option.icon as IconComponentType}
              size={22}
              color={option.iconColor || '#070914'}
              strokeWidth={1.8}
            />
          ) : (
            option.icon
          )}
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-subtitle text-[15px] text-[#070914]">{option.title}</Text>
            {option.badge && (
              <View className="rounded-md bg-[#F3F4F6] px-1.5 py-0.5">
                <Text className="font-caption text-[10px] text-[#9CA3AF]">{option.badge}</Text>
              </View>
            )}
          </View>
          <Text className="mt-0.5 font-body text-[13px] leading-[18px] text-[#9CA3AF]">
            {option.subtitle}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function SheetHeader({
  title,
  rightElement,
}: {
  title: string;
  rightElement?: React.ReactNode;
}) {
  return (
    <View className="mb-4 flex-row items-center justify-between px-5 pt-2">
      <Text className="font-subtitle text-[20px] text-[#070914]">{title}</Text>
      {rightElement}
    </View>
  );
}
