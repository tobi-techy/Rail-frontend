import React, { useState } from 'react';
import { View, Text, Image, ActivityIndicator, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from '@/utils/platformHaptics';
import { SPRING_PRESS } from '@/lib/motion';
import type { MemeCardData } from '@/api/types/ai';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * MemeBubble renders a meme Miriam "texts" into the chat as an iMessage-style
 * image attachment (left-aligned, fully rounded, no card chrome). Falls back to a
 * tasteful caption sticker if the generated image can't load.
 */
export const MemeBubble = React.memo(function MemeBubble({ data }: { data: MemeCardData }) {
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const uri = data.image_url;
  const caption = data.caption?.trim();

  const onLongPress = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const pressScale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }));

  if (!uri || failed) {
    const line = caption || [data.top_text, data.bottom_text].filter(Boolean).join(' · ') || 'meme';
    return (
      <Animated.View entering={FadeIn.duration(220)} className="max-w-[78%] self-start">
        <View className="items-center justify-center rounded-[22px] bg-[#E9E9EB] px-6 py-8">
          <Text className="text-[34px]">😄</Text>
          <Text className="mt-2 text-center font-body-medium text-[15px] text-[#343433]">
            {line}
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(220)} className="max-w-[72%] self-start">
      <AnimatedPressable
        onLongPress={onLongPress}
        delayLongPress={300}
        onPressIn={() => {
          pressScale.value = withSpring(0.97, SPRING_PRESS);
        }}
        onPressOut={() => {
          pressScale.value = withSpring(1, SPRING_PRESS);
        }}
        style={pressStyle}>
        <View className="overflow-hidden rounded-[22px] bg-[#E9E9EB]">
          {loading && (
            <View className="absolute inset-0 z-10 items-center justify-center">
              <ActivityIndicator size="small" color="#8E8E93" />
            </View>
          )}
          <Image
            source={{ uri }}
            accessibilityLabel={data.alt || 'meme'}
            style={{ width: 240, height: 240 }}
            resizeMode="cover"
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setFailed(true);
            }}
          />
        </View>
      </AnimatedPressable>
      {caption ? (
        <Text className="ml-1 mt-1.5 font-body text-[13px] text-ash">{caption}</Text>
      ) : null}
    </Animated.View>
  );
});
