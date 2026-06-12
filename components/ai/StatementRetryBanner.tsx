import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MiriamCharacter } from './MiriamCharacter';

interface StatementRetryBannerProps {
  onRetry: () => void;
}

export function StatementRetryBanner({ onRetry }: StatementRetryBannerProps) {
  return (
    <Pressable
      onPress={onRetry}
      className="mx-4 mb-2 mt-3 flex-row items-center gap-3 rounded-2xl border border-fog/30 bg-parchment-card px-4 py-3.5">
      <MiriamCharacter size={32} emotion="sad" animate={false} />
      <View className="flex-1">
        <Text className="font-body-medium text-[15px] text-charcoal-primary">
          Statement upload failed
        </Text>
        <Text className="font-body text-[13px] leading-[18px] text-ash">
          Tap to try again with the same file.
        </Text>
      </View>
    </Pressable>
  );
}
