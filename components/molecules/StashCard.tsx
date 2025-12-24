import React from 'react';
import { View, Text, Pressable } from 'react-native';

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
  const Container: any = onPress ? Pressable : View;

  return (
    <Container
      className={`rounded-[24px] border border-gray-100 bg-white p-[24px] ${className || ''}`}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole={onPress ? 'button' : undefined}>
      <View className="mb-[18px] self-start">{icon}</View>

      <Text className="mb-[6px] font-body text-[15px] text-gray-400">{title}</Text>

      <View className="flex-row items-baseline">
        <Text className="font-subtitle text-[22px] text-[#121212]">{amount}</Text>
        {amountCents && (
          <Text className="font-subtitle text-[22px] text-gray-400">{amountCents}</Text>
        )}
      </View>
    </Container>
  );
};
