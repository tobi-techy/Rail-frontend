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
      className={`rounded-lg border border-gray-200 bg-white p-lg ${className || ''} ${disabled ? 'opacity-50' : ''}`}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `${title}: ${amount}${amountCents || ''}` : undefined}
      accessibilityState={{ disabled }}>
      <View className="mb-md self-start">{icon}</View>

      <Text className="mb-1 font-body text-caption text-text-tertiary">{title}</Text>

      <View className="flex-row items-baseline">
        <Text className="font-subtitle text-stash text-text-primary">{amount}</Text>
        {amountCents && (
          <Text className="font-subtitle text-stash text-text-tertiary">{amountCents}</Text>
        )}
      </View>
    </Container>
  );
};
