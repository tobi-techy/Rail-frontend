import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { AIMessage, InsightCard } from '@/api/types/ai';
import { MarkdownContent } from './MarkdownContent';
import { TypingText } from './TypingText';
import { InsightCardView } from './InsightCardView';
import { MessageActions } from './MessageActions';

interface Props {
  msg: AIMessage;
  cards?: InsightCard[];
  isLatest?: boolean;
  animate?: boolean;
  onDeleteMessage?: () => void;
}

export function ChatBubble({ msg, cards, isLatest, animate, onDeleteMessage }: Props) {
  const isUser = msg.role === 'user';
  const [typingDone, setTypingDone] = useState(!animate);

  if (isUser) {
    return (
      <Animated.View entering={FadeIn.duration(150)} style={{ marginBottom: 20, maxWidth: '85%', alignSelf: 'flex-end' }}>
        <View style={{ backgroundColor: '#1A1A1A', borderRadius: 20, borderBottomRightRadius: 6, paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ fontFamily: 'SFProDisplay-Regular', fontSize: 15, color: '#FFFFFF', lineHeight: 22 }}>
            {msg.content}
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(200)} style={{ marginBottom: 24, alignSelf: 'flex-start', maxWidth: '95%' }}>
      {/* Ada label */}
      <Text style={{ fontFamily: 'SFMono-Medium', fontSize: 11, color: '#FF2E01', letterSpacing: 0.5, marginBottom: 6 }}>
        ADA
      </Text>

      {/* Message content */}
      {animate && !typingDone ? (
        <TypingText text={msg.content} speed={10} onComplete={() => setTypingDone(true)}>
          {(displayed) => <MarkdownContent content={displayed} />}
        </TypingText>
      ) : (
        <MarkdownContent content={msg.content} />
      )}

      {/* Insight cards */}
      {(typingDone || !animate) && cards?.map((card, i) => (
        <InsightCardView key={i} card={card} />
      ))}

      {/* Actions */}
      {(typingDone || !animate) && (
        <MessageActions content={msg.content} onDelete={onDeleteMessage} />
      )}
    </Animated.View>
  );
}
