import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { formatDistanceToNow } from 'date-fns';
import type { AIConversation } from '@/api/types/ai';
import { useAIHaptics } from '@/hooks/useAIHaptics';

const DELETE_THRESHOLD = -80;

interface Props {
  conv: AIConversation;
  onPress: () => void;
  onDelete: () => void;
}

export function ThreadRow({ conv, onPress, onDelete }: Props) {
  const translateX = useSharedValue(0);
  const { onSwipe, onDelete: hapticDelete } = useAIHaptics();
  const timeAgo = formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true });

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      if (e.translationX < 0) {
        translateX.value = Math.max(e.translationX, -120);
      }
    })
    .onEnd((e) => {
      if (e.translationX < DELETE_THRESHOLD) {
        runOnJS(onSwipe)();
        translateX.value = withTiming(-400, { duration: 200 }, () => {
          runOnJS(hapticDelete)();
          runOnJS(onDelete)();
        });
      } else {
        translateX.value = withSpring(0, { damping: 20 });
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteStyle = useAnimatedStyle(() => ({
    opacity: Math.min(Math.abs(translateX.value) / 80, 1),
  }));

  return (
    <View style={{ overflow: 'hidden' }}>
      {/* Delete background */}
      <Animated.View
        style={[
          deleteStyle,
          {
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 120,
            backgroundColor: '#DC2626',
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}>
        <Text style={{ color: '#FFF', fontFamily: 'SFProDisplay-Medium', fontSize: 13 }}>Delete</Text>
      </Animated.View>

      {/* Row content */}
      <GestureDetector gesture={pan}>
        <Animated.View style={rowStyle}>
          <Pressable
            onPress={onPress}
            style={{
              paddingVertical: 16,
              paddingHorizontal: 20,
              backgroundColor: '#F9F8F6',
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(0,0,0,0.04)',
            }}>
            <Text
              numberOfLines={1}
              style={{ fontFamily: 'SFProDisplay-Medium', fontSize: 15, color: '#1A1A1A' }}>
              {conv.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 }}>
              <Text style={{ fontFamily: 'SFProDisplay-Regular', fontSize: 12, color: '#B5B5B5' }}>
                {timeAgo}
              </Text>
              <Text style={{ fontFamily: 'SFMono-Regular', fontSize: 11, color: '#D4D4D4' }}>
                •
              </Text>
              <Text style={{ fontFamily: 'SFMono-Regular', fontSize: 11, color: '#B5B5B5' }}>
                {conv.message_count} msgs
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
