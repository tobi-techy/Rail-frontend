import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { useVoiceSession, VoiceState } from '@/hooks/useVoiceSession';
import { MiriamCharacter } from '@/components/ai/MiriamCharacter';
import { useFeedbackPopupStore } from '@/stores/feedbackPopupStore';
import { useHaptics } from '@/hooks/useHaptics';
import type { MiriamEmotion } from '@/components/ai/MiriamCharacter';

const STATE_EMOTIONS: Record<VoiceState, MiriamEmotion> = {
  idle: 'neutral',
  connecting: 'thinking',
  listening: 'happy',
  thinking: 'thinking',
  speaking: 'happy',
  error: 'sad',
};

const STATE_LABELS: Record<VoiceState, string> = {
  idle: '',
  connecting: 'Connecting...',
  listening: 'Listening...',
  thinking: 'Thinking...',
  speaking: '',
  error: 'Connection lost',
};

function MiriamReactive({ state }: { state: VoiceState }) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (state === 'listening') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
      translateY.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
    } else if (state === 'speaking') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 300 }),
          withTiming(0.95, { duration: 300 }),
          withTiming(1.05, { duration: 250 }),
          withTiming(1, { duration: 250 })
        ),
        -1
      );
      translateY.value = withRepeat(
        withSequence(withTiming(-6, { duration: 400 }), withTiming(2, { duration: 400 })),
        -1
      );
    } else if (state === 'thinking') {
      scale.value = withRepeat(
        withSequence(withTiming(0.95, { duration: 600 }), withTiming(1, { duration: 600 })),
        -1
      );
      translateY.value = withTiming(0);
    } else {
      scale.value = withSpring(1);
      translateY.value = withSpring(0);
    }
  }, [state]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animStyle} className="items-center">
      <MiriamCharacter size={160} emotion={STATE_EMOTIONS[state]} animate />
    </Animated.View>
  );
}

export default function VoiceModeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { impact } = useHaptics();
  const { state, transcript, responseText, error, connect, disconnect } = useVoiceSession();
  const showPopup = useFeedbackPopupStore((s) => s.showPopup);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, []);

  useEffect(() => {
    if (error) {
      showPopup({
        type: 'error',
        title: 'Voice unavailable',
        message: error,
        action: { label: 'Retry', onPress: () => connect() },
      });
    }
  }, [error]);

  const handleClose = () => {
    impact();
    disconnect();
    router.back();
  };

  const label = STATE_LABELS[state];

  return (
    <View
      className="flex-1 bg-white"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <View className="w-10" />
        <Text className="font-mono-bold text-[14px] tracking-wider text-text-primary">MIRIAM</Text>
        <Pressable
          onPress={handleClose}
          hitSlop={12}
          className="h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5]"
          accessibilityRole="button"
          accessibilityLabel="Close voice mode">
          <HugeiconsIcon icon={Cancel01Icon} size={18} color="#000" />
        </Pressable>
      </View>

      {/* Transcript area */}
      <View className="flex-1 justify-end px-6 pb-6">
        {transcript ? (
          <Animated.View entering={FadeInDown.duration(200)}>
            <Text className="mb-2 font-body text-[14px] text-text-secondary">You</Text>
            <Text className="font-body text-[16px] leading-6 text-text-primary">{transcript}</Text>
          </Animated.View>
        ) : null}
        {responseText ? (
          <Animated.View entering={FadeInDown.duration(200)} className="mt-4">
            <Text className="font-body-medium text-[16px] leading-6 text-text-primary">
              {responseText}
            </Text>
          </Animated.View>
        ) : null}
      </View>

      {/* Miriam character - center */}
      <View className="items-center py-10">
        <MiriamReactive state={state} />
        {label ? (
          <Animated.Text
            entering={FadeIn.duration(200)}
            className="mt-5 font-body text-[14px] text-text-secondary">
            {label}
          </Animated.Text>
        ) : null}
      </View>

      {/* End button */}
      <View className="items-center pb-8">
        <Pressable
          onPress={handleClose}
          className="rounded-full bg-[#F5F5F5] px-8 py-4"
          accessibilityRole="button"
          accessibilityLabel="End voice session">
          <Text className="font-heading-bold text-[15px] text-text-primary">End</Text>
        </Pressable>
      </View>
    </View>
  );
}
