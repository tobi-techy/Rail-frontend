import React, { useState } from 'react';
import { View, Pressable, Text, Share } from 'react-native';
import { useAIHaptics } from '@/hooks/useAIHaptics';

interface Props {
  content: string;
  onDelete?: () => void;
}

export function MessageActions({ content, onDelete }: Props) {
  const [liked, setLiked] = useState(false);
  const { onLike, onDelete: hapticDelete, onTap } = useAIHaptics();

  const handleLike = () => {
    setLiked((v) => !v);
    onLike();
  };

  const handleShare = async () => {
    onTap();
    try {
      await Share.share({ message: content });
    } catch {}
  };

  const handleDelete = () => {
    hapticDelete();
    onDelete?.();
  };

  return (
    <View style={{ flexDirection: 'row', gap: 16, marginTop: 8, paddingLeft: 2 }}>
      <Pressable onPress={handleLike} hitSlop={8}>
        <Text style={{ fontSize: 14, color: liked ? '#FF2E01' : '#B5B5B5' }}>
          {liked ? '♥' : '♡'}
        </Text>
      </Pressable>
      <Pressable onPress={handleShare} hitSlop={8}>
        <Text style={{ fontSize: 13, color: '#B5B5B5' }}>↗</Text>
      </Pressable>
      <Pressable onPress={handleDelete} hitSlop={8}>
        <Text style={{ fontSize: 13, color: '#B5B5B5' }}>✕</Text>
      </Pressable>
    </View>
  );
}
