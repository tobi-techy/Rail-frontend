import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  cancelAnimation,
  FadeIn,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from '@/utils/platformHaptics';
import { SquareIcon } from 'phosphor-react-native';
import { SPRING_PRESS } from '@/lib/motion';

const LISTENING_COLOR = '#FF5733';

// Waveform bar heights — organic pattern
const WAVEFORM_BARS = [0.3, 0.6, 0.4, 0.8, 0.5, 0.9, 0.6, 0.4, 0.7, 0.3, 0.8, 0.5, 0.4, 0.7, 0.3, 0.6, 0.9, 0.5, 0.7, 0.4];

interface Props {
  onStop: () => void;
}

/**
 * VoiceBar — animated waveform overlay shown while recording voice input.
 * Replaces the InputBar pill when isListening is true.
 * Features a pulsing waveform, "Listening..." label, and stop button.
 */
export const VoiceBar = React.memo(function VoiceBar({ onStop }: Props) {
  const pulseProgress = useSharedValue(0);
  const pressScale = useSharedValue(1);

  // Animate waveform bars on mount
  useEffect(() => {
    pulseProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
    return () => {
      cancelAnimation(pulseProgress);
    };
  }, [pulseProgress]);

  const waveStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + pulseProgress.value * 0.6,
  }));

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handleStop = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    pressScale.value = withSpring(0.92, SPRING_PRESS);
    setTimeout(() => {
      pressScale.value = withSpring(1, SPRING_PRESS);
    }, 100);
    onStop();
  };

  return (
    <Animated.View entering={FadeIn.duration(160)} className="mx-4 mb-1">
      <View
        className="flex-row items-center gap-3 rounded-[22px] bg-[#F1F0EC] px-4 py-3"
        style={{ minHeight: 44, borderWidth: 2, borderColor: `rgba(255, 87, 51, 0.4)` }}>
        {/* Animated waveform */}
        <Animated.View style={[waveStyle, { height: 28 }]} className="flex-row items-center gap-[2px]">
          {WAVEFORM_BARS.map((h, i) => (
            <View
              key={i}
              style={{
                width: 3,
                height: Math.round(h * 24),
                borderRadius: 2,
                backgroundColor: LISTENING_COLOR,
              }}
            />
          ))}
        </Animated.View>

        {/* Listening label */}
        <Text className="font-body-medium text-[14px] text-[#FF5733]">Listening...</Text>

        {/* Spacer */}
        <View className="flex-1" />

        {/* Stop button */}
        <Animated.View style={pressStyle}>
          <Pressable
            onPress={handleStop}
            hitSlop={8}
            className="h-8 w-8 items-center justify-center rounded-full bg-[#1C1C1E]"
            accessibilityRole="button"
            accessibilityLabel="Stop recording">
            <SquareIcon size={12} color="#fff" weight="fill" />
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
});
