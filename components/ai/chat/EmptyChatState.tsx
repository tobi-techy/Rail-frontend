import React from 'react';
import { View, Text } from 'react-native';
import { MiriamCharacter } from '@/components/ai';

export const EmptyChatState = React.memo(function EmptyChatState({
  hideForTyping,
}: {
  hideForTyping: boolean;
}) {
  if (hideForTyping) return <View className="flex-1" />;
  return (
    <View className="flex-1 items-center justify-center">
      <View className="flex-row items-center gap-3">
        <MiriamCharacter size={40} emotion="happy" animate />
        <Text className="font-body text-[34px] tracking-[-0.5px] text-[#6B6B68]">miriam</Text>
      </View>
    </View>
  );
});
