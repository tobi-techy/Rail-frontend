import React, { useEffect, useState } from 'react';
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
import { IconComponent as HugeiconsIcon, Cancel01Icon } from '@/lib/icons';
import { ConversationProvider, useConversation } from '@elevenlabs/react-native';
import { MiriamCharacter } from '@/components/ai/MiriamCharacter';
import { useFeedbackPopupStore } from '@/stores/feedbackPopupStore';
import { useHaptics } from '@/hooks/useHaptics';
import { aiService } from '@/api/services/ai.service';
import type { MiriamEmotion, MiriamFacing } from '@/components/ai/MiriamCharacter';

type VoiceState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

const STATE_EMOTIONS: Record<VoiceState, MiriamEmotion> = {
  idle: 'neutral',
  connecting: 'thinking',
  listening: 'happy',
  speaking: 'happy',
  error: 'sad',
};

const STATE_FACING: Record<VoiceState, MiriamFacing> = {
  idle: 'front',
  connecting: 'right',
  listening: 'left',
  speaking: 'front',
  error: 'left',
};

const STATE_LABELS: Record<VoiceState, string> = {
  idle: '',
  connecting: 'Connecting...',
  listening: 'Listening...',
  speaking: 'Speaking',
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
    } else {
      scale.value = withSpring(1);
      translateY.value = withSpring(0);
    }
  }, [scale, state, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animStyle} className="items-center">
      <MiriamCharacter
        size={160}
        emotion={STATE_EMOTIONS[state]}
        facing={STATE_FACING[state]}
        animate
      />
    </Animated.View>
  );
}

function VoiceModeContent() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { impact } = useHaptics();
  const showPopup = useFeedbackPopupStore((s) => s.showPopup);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [responseText, setResponseText] = useState('');

  const conversation = useConversation({
    onConnect: () => {
      console.log('[VoiceMode] ✅ Connected');
      setVoiceState('listening');
    },
    onDisconnect: () => {
      console.log('[VoiceMode] Disconnected');
      setVoiceState('idle');
    },
    onError: (error: string) => {
      console.error('[VoiceMode] Error:', error);
      setVoiceState('error');
      showPopup({
        type: 'error',
        title: 'Voice unavailable',
        message: error,
      });
    },
    onMessage: (msg: { message: string; source: string }) => {
      console.log('[VoiceMode] Message:', msg.source, '-', msg.message?.slice(0, 50));
      if (msg.source === 'user') {
        setTranscript(msg.message);
      } else {
        setResponseText(msg.message);
      }
    },
    onModeChange: ({ mode }: { mode: 'speaking' | 'listening' }) => {
      console.log('[VoiceMode] Mode:', mode);
      setVoiceState(mode === 'speaking' ? 'speaking' : 'listening');
    },
  });

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      setVoiceState('connecting');
      try {
        const { agent_id, dynamic_variables } = await aiService.getVoiceSignedUrl();
        if (cancelled) return;
        console.log('[VoiceMode] Starting session, agent:', agent_id);
        await conversation.startSession({
          agentId: agent_id,
          dynamicVariables: { ...dynamic_variables, supports_pidgin: true },
        });
      } catch (err: any) {
        if (cancelled) return;
        console.error('[VoiceMode] Start failed:', err);
        setVoiceState('error');
      }
    };
    start();
    return () => {
      cancelled = true;
      console.log('[VoiceMode] Cleanup - ending session');
      conversation.endSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    impact();
    conversation.endSession();
    router.back();
  };

  const label = STATE_LABELS[voiceState];

  return (
    <View
      className="flex-1 bg-warm-canvas"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <View className="w-10" />
        <Text className="font-mono-bold text-[14px] tracking-wider text-text-primary">MIRIAM</Text>
        <Pressable
          onPress={handleClose}
          hitSlop={12}
          className="h-10 w-10 items-center justify-center rounded-full bg-[#f7f2e8]"
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

      {/* Rail AI mark - center */}
      <View className="items-center py-10">
        <MiriamReactive state={voiceState} />
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
          className="rounded-full bg-[#f7f2e8] px-8 py-4"
          accessibilityRole="button"
          accessibilityLabel="End voice session">
          <Text className="font-heading-bold text-[15px] text-text-primary">End</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function VoiceModeScreen() {
  return (
    <ConversationProvider>
      <VoiceModeContent />
    </ConversationProvider>
  );
}
