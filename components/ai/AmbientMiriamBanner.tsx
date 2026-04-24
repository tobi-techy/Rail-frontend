import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import Animated, {
  SlideInUp,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useProactiveInsights } from '@/hooks/useProactiveInsights';
import { useAIHaptics } from '@/hooks/useAIHaptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { ProactiveInsight } from '@/hooks/useProactiveInsights';

const { width } = Dimensions.get('window');
const DISMISS_AFTER = 45_000; // 45 seconds

interface Props {
  insight?: ProactiveInsight | null;
  onDismiss?: (id: string) => void;
  onAction?: () => void;
}

export function AmbientMiriamBanner({
  insight: propInsight,
  onDismiss: propOnDismiss,
  onAction,
}: Props = {}) {
  const router = useRouter();
  const internal = useProactiveInsights({ enabled: propInsight === undefined });
  const { onReceive } = useAIHaptics();
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Use prop if provided, otherwise fall back to internal hook
  const activeInsight = propInsight !== undefined ? propInsight : internal.insight;
  const dismissInsight = propOnDismiss ?? internal.dismiss;

  useEffect(() => {
    if (activeInsight) {
      onReceive();
      dismissTimer.current = setTimeout(() => {
        dismissInsight(activeInsight.id);
      }, DISMISS_AFTER);
    }
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [activeInsight?.id, onReceive, dismissInsight]);

  const handleDismiss = useCallback(() => {
    if (activeInsight) dismissInsight(activeInsight.id);
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
  }, [activeInsight, dismissInsight]);

  const handlePress = useCallback(() => {
    if (onAction) {
      onAction();
    } else {
      router.push('/miriam-hub');
    }
  }, [onAction, router]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onUpdate((event) => {
      translateX.value = event.translationX;
      opacity.value = 1 - Math.abs(event.translationX) / (width * 0.5);
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > 80 || Math.abs(event.velocityX) > 500) {
        translateX.value = withSpring(event.translationX > 0 ? width : -width, { damping: 20 });
        opacity.value = withSpring(0, {}, () => runOnJS(handleDismiss)());
      } else {
        translateX.value = withSpring(0);
        opacity.value = withSpring(1);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  if (!activeInsight?.message) return null;

  return (
    <Animated.View
      entering={SlideInUp.duration(400).springify()}
      exiting={SlideOutDown.duration(300)}
      className="absolute bottom-[90px] right-4 z-50"
      style={{ alignItems: 'flex-end' }}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle}>
          <Pressable
            onPress={handlePress}
            className="rounded-2xl bg-text-primary p-3.5"
            style={{ maxWidth: Math.min(280, width * 0.7) }}
            accessibilityRole="button"
            accessibilityLabel={`Miriam insight: ${activeInsight.message}`}>
            <View className="flex-row items-start gap-2">
              <Text className="flex-1 font-body text-sm leading-5 text-white" numberOfLines={3}>
                {activeInsight.message}
              </Text>
              <Pressable
                onPress={handleDismiss}
                className="h-5 w-5 shrink-0 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Dismiss insight">
                <Text className="font-body-medium text-xs text-white/50">✕</Text>
              </Pressable>
            </View>
          </Pressable>
          {/* Tail triangle */}
          <View
            className="mr-5 self-end"
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 8,
              borderRightWidth: 8,
              borderTopWidth: 10,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: '#1A1A1A',
            }}
          />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}
