import React, { useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { AIMessage, InsightCard } from '@/api/types/ai';
import { MarkdownContent } from './MarkdownContent';
import { TypingText } from './TypingText';
import { InsightCardView } from './InsightCardView';

interface Props {
  msg: AIMessage;
  cards?: InsightCard[];
  isLatest?: boolean;
  animate?: boolean;
  onDeleteMessage?: () => void;
  onEdit?: (content: string) => void;
}

export function ChatBubble({ msg, cards, isLatest, animate, onEdit }: Props) {
  const isUser = msg.role === 'user';
  const content = msg.content ?? '';
  const [typingDone, setTypingDone] = useState(!animate);
  const [copied, setCopied] = useState(false);

  const handleLongPress = useCallback(async () => {
    if (!content) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [content]);

  if (isUser) {
    return (
      <Animated.View entering={FadeIn.duration(150)} className="mb-5 max-w-[88%] self-end">
        <Pressable
          onLongPress={handleLongPress}
          delayLongPress={400}
          accessibilityRole="text"
          accessibilityLabel={`Your message: ${content.slice(0, 100)}`}>
          <View className="rounded-3xl bg-[#EDEDEB] px-5 py-3.5">
            <Text className="font-body text-[17px] leading-[28px] text-[#1A1A1A]">
              {content}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View className="mb-6 self-start">
      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={400}
        accessibilityRole="text"
        accessibilityLabel={`Miriam: ${content.slice(0, 100)}`}>
        <View className="py-1">
          {animate && !typingDone ? (
            <TypingText text={content} speed={10} onComplete={() => setTypingDone(true)}>
              {(displayed) => <MarkdownContent content={displayed} />}
            </TypingText>
          ) : (
            <MarkdownContent content={content} />
          )}
        </View>
      </Pressable>

      {copied && (
        <Animated.View entering={FadeIn.duration(100)} className="mt-1 self-start">
          <Text className="font-body text-xs text-text-tertiary">Copied</Text>
        </Animated.View>
      )}

      {(typingDone || !animate) &&
        cards?.map((card, i) => (
          <View key={i} className="mt-3">
            <InsightCardView card={card} />
          </View>
        ))}
    </Animated.View>
  );
}
