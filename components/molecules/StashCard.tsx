import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface StashCardProps {
  title: string;
  amount: string;
  amountCents?: string;
  icon: React.ReactNode;
  className?: string;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
}

export const StashCard: React.FC<StashCardProps> = ({
  title,
  amount,
  amountCents,
  icon,
  className,
  onPress,
  disabled,
  testID,
}) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      style={animStyle}
      className={`max-w-[50%] rounded-2xl border border-gray-200 bg-transparent px-5 py-5 ${className || ''} ${disabled ? 'opacity-50' : ''}`}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      }}
      disabled={disabled}
      testID={testID}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `${title}: ${amount}${amountCents || ''}` : undefined}
      accessibilityState={{ disabled }}>
      <View className="mb-14 self-start">{icon}</View>

      <View className="flex-row items-baseline">
        <Text className="font-subtitle text-stash text-text-primary">{amount}</Text>
        {amountCents && (
          <Text className="font-subtitle text-stash text-text-tertiary">{amountCents}</Text>
        )}
      </View>

      <Text className="mt-1 font-body text-body tracking-wide text-text-tertiary">{title}</Text>
    </AnimatedPressable>
  );
};
