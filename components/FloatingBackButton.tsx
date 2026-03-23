import React from 'react';
import { Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useHaptics } from '@/hooks/useHaptics';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

export function FloatingBackButton() {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);
  const { impact } = useHaptics();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        { position: 'absolute', left: 20, bottom: insets.bottom + 20, zIndex: 100 },
      ]}>
      <Pressable
        onPress={() => {
          impact();
          router.back();
        }}
        onPressIn={() => {
          scale.value = withSpring(0.9, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
        className="overflow-hidden rounded-[28px]">
        <BlurView
          intensity={80}
          tint="light"
          className="h-14 w-14 items-center justify-center overflow-hidden rounded-[28px]">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={28} color="#000" />
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}
