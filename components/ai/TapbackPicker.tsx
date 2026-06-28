import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
  type LayoutRectangle,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from '@/utils/platformHaptics';
import { SPRING_SNAPPY, DUR } from '@/lib/motion';

export const TAPBACKS = ['❤️', '😂', '😮', '😢', '👍', '👎'] as const;
export type Tapback = (typeof TAPBACKS)[number];

interface Props {
  visible: boolean;
  anchor: LayoutRectangle | null;
  isUser: boolean;
  currentReactions?: Record<string, boolean>;
  onSelect: (emoji: Tapback) => void;
  onClose: () => void;
}

const PILL_W = TAPBACKS.length * 48 + 16;
const PILL_H = 56;

/**
 * iMessage-style tapback picker: a floating emoji pill that springs in above
 * (or below) the tapped bubble. Selecting an emoji fires onSelect and closes.
 */
export const TapbackPicker = React.memo(function TapbackPicker({
  visible,
  anchor,
  isUser,
  currentReactions,
  onSelect,
  onClose,
}: Props) {
  // Start near full size and rise slightly from the bubble below it,
  // so it reads as scaling out of the message rather than popping from nothing.
  const scale = useSharedValue(0.93);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(4);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, SPRING_SNAPPY);
      translateY.value = withSpring(0, SPRING_SNAPPY);
      opacity.value = withTiming(1, { duration: 120 });
    } else {
      scale.value = withTiming(0.93, { duration: DUR.exit });
      translateY.value = withTiming(4, { duration: DUR.exit });
      opacity.value = withTiming(0, { duration: DUR.exit });
    }
  }, [visible, scale, opacity, translateY]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  if (!anchor) return null;

  const screenW = Dimensions.get('window').width;
  const fitsAbove = anchor.y - PILL_H - 12 > 0;
  const top = fitsAbove ? anchor.y - PILL_H - 12 : anchor.y + anchor.height + 8;
  const left = isUser
    ? Math.max(8, anchor.x + anchor.width - PILL_W)
    : Math.min(anchor.x, screenW - PILL_W - 8);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1 }} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          pillStyle,
          {
            position: 'absolute',
            top,
            left,
            width: PILL_W,
            height: PILL_H,
            backgroundColor: '#fff',
            borderRadius: PILL_H / 2,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.14,
            shadowRadius: 20,
            elevation: 14,
          },
        ]}>
        {TAPBACKS.map((emoji) => {
          const active = !!currentReactions?.[emoji];
          return (
            <Pressable
              key={emoji}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(emoji);
                onClose();
              }}
              style={[
                {
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                active && { backgroundColor: 'rgba(0,0,0,0.06)' },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`React with ${emoji}`}>
              <Text style={{ fontSize: 26, lineHeight: 32 }}>{emoji}</Text>
            </Pressable>
          );
        })}
      </Animated.View>
    </Modal>
  );
});
