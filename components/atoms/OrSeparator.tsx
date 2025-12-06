import React from 'react';
import { View, Text } from 'react-native';

interface OrSeparatorProps {
  text?: string;
}

export const OrSeparator: React.FC<OrSeparatorProps> = ({ text = 'OR' }) => {
  return (
    <View className="flex-row items-center my-6">
      <View className="flex-1 h-px bg-text-tertiary" />
      <Text className="font-caption text-caption text-text-tertiary mx-4">
        {text}
      </Text>
      <View className="flex-1 h-px bg-text-tertiary" />
    </View>
  );
};