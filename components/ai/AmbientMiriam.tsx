import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutRight,
} from 'react-native-reanimated';
import { MiriamCharacter } from '@/components/ai/MiriamCharacter';
import type { NudgeResponse } from '@/api/types/ai';
import type { MiriamEmotion } from '@/components/ai/MiriamCharacter';

interface Props {
  nudge: NudgeResponse | null;
  onDismiss: () => void;
  onPress?: () => void;
}

const SEVERITY_CONFIG: Record<string, { emotion: MiriamEmotion; bubbleBg: string; textColor: string }> = {
  warning: { emotion: 'sad', bubbleBg: '#FEF3C7', textColor: '#92400E' },
  celebration: { emotion: 'happy', bubbleBg: '#D1FAE5', textColor: '#065F46' },
  info: { emotion: 'neutral', bubbleBg: '#FFFFFF', textColor: '#1A1A1A' },
};

export function AmbientMiriam({ nudge, onDismiss, onPress }: Props) {
  if (!nudge?.show || !nudge.message) return null;

  const config = SEVERITY_CONFIG[nudge.severity] ?? SEVERITY_CONFIG.info;

  return (
    <Animated.View
      entering={SlideInRight.duration(300).springify().damping(18)}
      exiting={SlideOutRight.duration(200)}
      className="absolute right-4 top-2 z-30 flex-row items-start"
      style={{ maxWidth: '85%' }}
      pointerEvents="box-none">
      {/* Speech bubble */}
      <Pressable
        onPress={onPress ?? onDismiss}
        onLongPress={onDismiss}
        delayLongPress={300}
        className="mr-2 flex-1 rounded-2xl px-4 py-3"
        style={{
          backgroundColor: config.bubbleBg,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}
        accessibilityRole="alert"
        accessibilityLabel={`Miriam says: ${nudge.message}`}>
        <Text
          className="font-body text-[15px] leading-[22px]"
          style={{ color: config.textColor }}>
          {nudge.message}
        </Text>
        <Text className="font-body text-[11px] mt-1 opacity-40" style={{ color: config.textColor }}>
          Tap to dismiss
        </Text>
      </Pressable>

      {/* Miriam character */}
      <Animated.View entering={FadeIn.delay(150).duration(200)} exiting={FadeOut.duration(100)}>
        <MiriamCharacter size={40} emotion={config.emotion} animate />
      </Animated.View>
    </Animated.View>
  );
}
