import React from 'react';
import { View, Pressable, Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Copy01Icon,
  Share01Icon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  Delete01Icon,
} from '@hugeicons/core-free-icons';
import { useAIHaptics } from '@/hooks/useAIHaptics';
import { aiService } from '@/api/services';

interface Props {
  content: string;
  messageId?: string;
  onDelete?: () => void;
}

export function MessageActions({ content, messageId, onDelete }: Props) {
  const { onTap } = useAIHaptics();

  const handleCopy = async () => {
    onTap();
    await Clipboard.setStringAsync(content);
  };

  const handleShare = async () => {
    onTap();
    await Share.share({ message: content });
  };

  const handleFeedback = async (rating: 'positive' | 'negative') => {
    onTap();
    if (!messageId) return;
    try {
      await aiService.sendFeedback(messageId, rating);
    } catch {
      // Silent fail — feedback is best-effort
    }
  };

  const handleDelete = () => {
    onTap();
    Alert.alert('Delete message?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <View className="flex-row items-center gap-1 mt-2 ml-1">
      <Pressable
        onPress={handleCopy}
        className="p-2 rounded-full"
        accessibilityRole="button"
        accessibilityLabel="Copy message">
        <HugeiconsIcon icon={Copy01Icon} size={16} color="#B5B5B5" />
      </Pressable>
      <Pressable
        onPress={handleShare}
        className="p-2 rounded-full"
        accessibilityRole="button"
        accessibilityLabel="Share message">
        <HugeiconsIcon icon={Share01Icon} size={16} color="#B5B5B5" />
      </Pressable>
      <Pressable
        onPress={() => handleFeedback('positive')}
        className="p-2 rounded-full"
        accessibilityRole="button"
        accessibilityLabel="Thumbs up">
        <HugeiconsIcon icon={ThumbsUpIcon} size={16} color="#B5B5B5" />
      </Pressable>
      <Pressable
        onPress={() => handleFeedback('negative')}
        className="p-2 rounded-full"
        accessibilityRole="button"
        accessibilityLabel="Thumbs down">
        <HugeiconsIcon icon={ThumbsDownIcon} size={16} color="#B5B5B5" />
      </Pressable>
      {onDelete && (
        <Pressable
          onPress={handleDelete}
          className="p-2 rounded-full"
          accessibilityRole="button"
          accessibilityLabel="Delete message">
          <HugeiconsIcon icon={Delete01Icon} size={16} color="#EF4444" />
        </Pressable>
      )}
    </View>
  );
}
