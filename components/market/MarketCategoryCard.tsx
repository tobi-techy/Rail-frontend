import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

export function MarketCategoryCard({
  title,
  subtitle,
  Icon,
  onPress,
}: {
  title: string;
  subtitle: string;
  Icon: LucideIcon;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${title} category`}
      className="mr-3 w-[152px] rounded-md border border-surface bg-white p-md">
      <View className="mb-3 h-10 w-10 items-center justify-center rounded-full bg-surface">
        <Icon size={20} color="#000000" />
      </View>
      <Text className="font-subtitle text-body text-text-primary">{title}</Text>
      <Text className="mt-1 font-caption text-caption text-text-secondary">{subtitle}</Text>
    </Pressable>
  );
}
