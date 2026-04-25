import React, { useRef, useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { MoreHorizontalIcon } from '@hugeicons/core-free-icons';
import type { AIConversation } from '@/api/types/ai';

function relativeDateLabel(iso: string): string {
  const now = new Date();
  const d = new Date(iso);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: 'short' });
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
  return `${Math.floor(diffDays / 30)}mo`;
}

interface Props {
  conv: AIConversation;
  onPress: () => void;
  onDelete: () => void;
}

export function ThreadRow({ conv, onPress, onDelete }: Props) {
  const swipeRef = useRef<Swipeable>(null);
  const [showUndo, setShowUndo] = useState(false);

  const handleDelete = useCallback(() => {
    setShowUndo(true);
    const timer = setTimeout(() => {
      setShowUndo(false);
      onDelete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDelete]);

  if (showUndo) {
    return (
      <View className="mx-5 py-5 flex-row items-center justify-between border-b border-black/[0.06]">
        <Text className="font-body text-[15px] text-text-tertiary">Thread deleted</Text>
        <Pressable
          onPress={() => setShowUndo(false)}
          accessibilityRole="button"
          accessibilityLabel="Undo">
          <Text className="font-body-medium text-[15px] text-[#1A7A6D]">Undo</Text>
        </Pressable>
      </View>
    );
  }

  const renderRightActions = () => (
    <View className="bg-red-500 justify-center px-6">
      <Text className="font-body-medium text-white text-[15px]">Delete</Text>
    </View>
  );

  const dateLabel = relativeDateLabel(conv.updated_at ?? conv.created_at);
  const title = conv.title ?? 'Untitled';

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      onSwipeableWillOpen={handleDelete}
      friction={2}
      rightThreshold={40}>
      <Pressable
        onPress={onPress}
        className="mx-5 py-5 border-b border-black/[0.06]"
        accessibilityRole="button"
        accessibilityLabel={`Thread: ${title}. Swipe left to delete`}>
        {/* Title row with three-dot menu */}
        <View className="flex-row items-start justify-between">
          <Text
            className="font-heading-semibold text-[17px] text-[#1A1A1A] flex-1 mr-3 leading-[24px]"
            numberOfLines={3}>
            {title}
          </Text>
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
            }}
            hitSlop={12}
            className="mt-0.5"
            accessibilityRole="button"
            accessibilityLabel="Thread options">
            <HugeiconsIcon icon={MoreHorizontalIcon} size={20} color="#B5B5B5" />
          </Pressable>
        </View>

        {/* Summary line — title is the first message, so show a truncated version as preview */}
        <Text
          className="font-body text-[15px] text-[#8C8C8C] mt-2 leading-[22px]"
          numberOfLines={2}>
          {title.length > 50 ? title : `Conversation about ${title.toLowerCase()}`}
        </Text>

        {/* Meta: date + message count */}
        <View className="flex-row items-center mt-2.5 gap-2">
          <Text className="font-body text-[13px] text-[#B5B5B5]">{dateLabel}</Text>
          {conv.message_count > 0 && (
            <>
              <Text className="text-[13px] text-[#D4D4D0]">·</Text>
              <Text className="font-body text-[13px] text-[#B5B5B5]">
                {conv.message_count} message{conv.message_count !== 1 ? 's' : ''}
              </Text>
            </>
          )}
        </View>
      </Pressable>
    </Swipeable>
  );
}
