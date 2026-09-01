import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MiriamCharacter } from '@/components/ai';
import * as Haptics from '@/utils/platformHaptics';

export const EmptyChatState = React.memo(function EmptyChatState({
  hideForTyping,
  onStartConversation,
}: {
  hideForTyping: boolean;
  onStartConversation?: () => void;
}) {
  if (hideForTyping) return <View className="flex-1" />;
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="items-center gap-6">
        {/* Miriam character */}
        <MiriamCharacter size={56} emotion="happy" animate />

        {/* Hero copy */}
        <View className="items-center gap-2">
          <Text className="font-heading text-[23px] text-charcoal-primary text-center">
            Hey, I&apos;m Miriam
          </Text>
          <Text className="font-body text-[15px] text-graphite text-center max-w-[280px] leading-[22px]">
            Your AI assistant for managing money. Ask me anything about your finances.
          </Text>
        </View>

        {/* CTA */}
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onStartConversation?.();
          }}
          className="rounded-full bg-midnight px-6 py-3 active:scale-[0.96] active:bg-charcoal-primary"
          accessibilityRole="button"
          accessibilityLabel="Start a conversation with Miriam">
          <Text className="font-body-medium text-[14px] text-white">Start a conversation</Text>
        </Pressable>
      </View>
    </View>
  );
});
