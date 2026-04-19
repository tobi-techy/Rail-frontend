import React, { useState } from 'react';
import { View, Pressable, Share } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ThumbsUpIcon, ThumbsDownIcon, Share01Icon, Copy01Icon } from '@hugeicons/core-free-icons';
import * as Clipboard from 'expo-clipboard';
import { useAIHaptics } from '@/hooks/useAIHaptics';

interface Props {
  content: string;
  onDelete?: () => void;
}

export function MessageActions({ content, onDelete }: Props) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const { onLike, onTap } = useAIHaptics();

  const handleThumbsUp = () => {
    setFeedback((v) => (v === 'up' ? null : 'up'));
    onLike();
    // TODO: POST /v1/ai/feedback { message_id, rating: 'positive' }
  };

  const handleThumbsDown = () => {
    setFeedback((v) => (v === 'down' ? null : 'down'));
    onTap();
    // TODO: POST /v1/ai/feedback { message_id, rating: 'negative' }
  };

  const handleCopy = () => {
    onTap();
    void Clipboard.setStringAsync(content);
  };

  const handleShare = async () => {
    onTap();
    try { await Share.share({ message: content }); } catch {}
  };

  return (
    <View style={{ flexDirection: 'row', gap: 16, marginTop: 10, paddingLeft: 2 }}>
      <Pressable onPress={handleThumbsUp} hitSlop={8}>
        <HugeiconsIcon
          icon={ThumbsUpIcon}
          size={16}
          color={feedback === 'up' ? '#16A34A' : '#C4C4C4'}
        />
      </Pressable>
      <Pressable onPress={handleThumbsDown} hitSlop={8}>
        <HugeiconsIcon
          icon={ThumbsDownIcon}
          size={16}
          color={feedback === 'down' ? '#DC2626' : '#C4C4C4'}
        />
      </Pressable>
      <Pressable onPress={handleCopy} hitSlop={8}>
        <HugeiconsIcon icon={Copy01Icon} size={16} color="#C4C4C4" />
      </Pressable>
      <Pressable onPress={handleShare} hitSlop={8}>
        <HugeiconsIcon icon={Share01Icon} size={16} color="#C4C4C4" />
      </Pressable>
    </View>
  );
}
