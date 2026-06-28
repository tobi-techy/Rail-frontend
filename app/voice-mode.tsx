import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Pressable, Platform, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Canvas, RoundedRect } from '@shopify/react-native-skia';
import Animated, { FadeIn } from 'react-native-reanimated';
import { IconComponent as HugeiconsIcon, Cancel01Icon, Mic01Icon } from '@/lib/icons';
import { ConversationProvider, useConversation } from '@elevenlabs/react-native';
import { MiriamCharacter } from '@/components/ai/MiriamCharacter';
import { useFeedbackPopupStore } from '@/stores/feedbackPopupStore';
import { useHaptics } from '@/hooks/useHaptics';
import { useBiometric } from '@/hooks/useBiometric';
import { aiService } from '@/api/services/ai.service';
import { useWalletStore } from '@/stores/walletStore';
import { logger } from '@/lib/logger';
import { buildMiriamClientTools } from '@/lib/miriamClientTools';
import type { MiriamEmotion } from '@/components/ai/MiriamCharacter';

// ─── Types ──────────────────────────────────────────────────────────────────

type VoiceState = 'idle' | 'auth' | 'connecting' | 'listening' | 'speaking' | 'error';

const STATE_EMOTIONS: Record<VoiceState, MiriamEmotion> = {
  idle: 'neutral',
  auth: 'thinking',
  connecting: 'thinking',
  listening: 'happy',
  speaking: 'happy',
  error: 'sad',
};

const STATE_LABELS: Record<VoiceState, string> = {
  idle: '',
  auth: 'Verifying…',
  connecting: 'Connecting…',
  listening: 'Listening',
  speaking: 'Speaking',
  error: 'Try again',
};

// ─── Skia Waveform (GPU-rendered, deterministic) ────────────────────────────

const BAR_COUNT = 16;
const BAR_WIDTH = 3;
const BAR_GAP = 3;
const WAVE_HEIGHT = 32;
const CANVAS_WIDTH = BAR_COUNT * (BAR_WIDTH + BAR_GAP) - BAR_GAP;

function VoiceWaveform({ state }: { state: VoiceState }) {
  const active = state === 'listening' || state === 'speaking';
  const [bars, setBars] = useState<number[]>(() => Array(BAR_COUNT).fill(3));
  const timeRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setBars(Array(BAR_COUNT).fill(3));
      return;
    }

    let raf: number;
    const animate = () => {
      timeRef.current += 0.06;
      const t = timeRef.current;
      const isSpeaking = state === 'speaking';
      const amplitude = isSpeaking ? 0.85 : 0.55;
      const speed = isSpeaking ? 1.4 : 0.8;

      const newBars = Array.from({ length: BAR_COUNT }, (_, i) => {
        const phase = (i / BAR_COUNT) * Math.PI * 2;
        const wave = Math.sin(t * speed + phase) * 0.5 + 0.5;
        const harmonic = Math.sin(t * speed * 1.7 + phase * 1.3) * 0.3 + 0.5;
        const combined = (wave * 0.6 + harmonic * 0.4) * amplitude;
        return 3 + combined * (WAVE_HEIGHT - 3);
      });

      setBars(newBars);
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [active, state]);

  return (
    <View style={{ width: CANVAS_WIDTH, height: WAVE_HEIGHT, opacity: active ? 1 : 0.3 }}>
      <Canvas style={{ width: CANVAS_WIDTH, height: WAVE_HEIGHT }}>
        {bars.map((h, i) => (
          <RoundedRect
            key={i}
            x={i * (BAR_WIDTH + BAR_GAP)}
            y={(WAVE_HEIGHT - h) / 2}
            width={BAR_WIDTH}
            height={h}
            r={BAR_WIDTH / 2}
            color={active ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.3)'}
          />
        ))}
      </Canvas>
    </View>
  );
}

// ─── Session Timer ──────────────────────────────────────────────────────────

function SessionTimer({ active }: { active: boolean }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!active) {
      setSeconds(0);
      return;
    }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return null;

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <Text style={styles.timer}>
        {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
      </Text>
    </Animated.View>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildFinancialContext(
  tokens: { symbol: string; balance: number; usdValue: number }[],
  totalBalanceUSD: number
): string {
  const lines: string[] = [`Total: $${totalBalanceUSD.toFixed(2)}`];
  for (const t of tokens.slice(0, 5)) {
    if (t.balance > 0) lines.push(`${t.symbol}: $${t.usdValue.toFixed(2)}`);
  }
  return lines.join('. ');
}

// ─── Main ───────────────────────────────────────────────────────────────────

function VoiceModeContent() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { impact, notification } = useHaptics();
  const showPopup = useFeedbackPopupStore((s) => s.showPopup);
  const {
    verifyWithBiometric,
    isAvailable: biometricAvailable,
    isBiometricEnabled,
  } = useBiometric();
  const tokens = useWalletStore((s) => s.tokens);
  const totalBalanceUSD = useWalletStore((s) => s.totalBalanceUSD);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const contextSentRef = useRef(false);
  const sessionActive = voiceState === 'listening' || voiceState === 'speaking';

  const conversation = useConversation({
    clientTools: buildMiriamClientTools({
      tokens,
      totalBalanceUSD,
      navigate: (screen) => router.push(screen as never),
    }),
    onConnect: () => {
      setVoiceState('listening');
      notification('success');
      if (!contextSentRef.current && tokens.length > 0) {
        contextSentRef.current = true;
        setTimeout(() => {
          try {
            conversation.sendContextualUpdate(
              `Financial snapshot: ${buildFinancialContext(tokens, totalBalanceUSD)}`
            );
          } catch {
            /* session may have ended */
          }
        }, 600);
      }
    },
    onDisconnect: () => {
      setVoiceState('idle');
      // Auto-end: when agent disconnects, exit voice mode
      router.back();
    },
    onError: (error: string) => {
      logger.error('[VoiceMode] Error', { error });
      setVoiceState('error');
      notification('error');
      showPopup({ type: 'error', title: 'Voice unavailable', message: error });
    },
    onMessage: () => {
      // No transcript display
    },
    onModeChange: ({ mode }: { mode: 'speaking' | 'listening' }) => {
      setVoiceState(mode === 'speaking' ? 'speaking' : 'listening');
    },
  });

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      // Biometric gate
      if (biometricAvailable && isBiometricEnabled) {
        setVoiceState('auth');
        const ok = await verifyWithBiometric();
        if (cancelled) return;
        if (!ok) {
          setVoiceState('error');
          showPopup({
            type: 'error',
            title: 'Auth required',
            message: 'Biometric verification needed for voice mode.',
          });
          return;
        }
      }

      // Connect
      setVoiceState('connecting');
      try {
        const { agent_id, dynamic_variables } = await aiService.getVoiceSignedUrl();
        if (cancelled) return;

        await conversation.startSession({
          agentId: agent_id,
          dynamicVariables: { ...dynamic_variables, supports_pidgin: true, platform: Platform.OS },
          connectionDelay: { default: 300, ios: 400, android: 200 },
          preferHeadphonesForIosDevices: true,
        });
      } catch (e) {
        if (cancelled) return;
        logger.error('[VoiceMode] Start failed', {
          error: e instanceof Error ? e.message : String(e),
        });
        setVoiceState('error');
        showPopup({
          type: 'error',
          title: 'Connection failed',
          message: 'Could not reach Miriam. Please try again.',
        });
      }
    };

    start();
    return () => {
      cancelled = true;
      try {
        conversation.endSession();
      } catch {
        /* noop */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = useCallback(() => {
    impact();
    try {
      conversation.endSession();
    } catch {
      /* noop */
    }
    router.back();
  }, [conversation, impact, router]);

  const handleMicToggle = useCallback(() => {
    impact();
    const next = !isMuted;
    setIsMuted(next);
    conversation.setMuted(next);
  }, [conversation, impact, isMuted]);

  return (
    <View
      className="flex-1 bg-[#FAFAF7]"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <SessionTimer active={sessionActive} />
        <Pressable
          onPress={handleClose}
          hitSlop={12}
          className="h-10 w-10 items-center justify-center rounded-full bg-[#F0F0EE]"
          accessibilityRole="button"
          accessibilityLabel="Close">
          <HugeiconsIcon icon={Cancel01Icon} size={18} color="#1C1C1E" />
        </Pressable>
      </View>

      {/* Center */}
      <View className="flex-1 items-center justify-center">
        <MiriamCharacter size={190} emotion={STATE_EMOTIONS[voiceState]} animate />

        {/* State label */}
        {STATE_LABELS[voiceState] ? (
          <Text style={styles.stateLabel}>{STATE_LABELS[voiceState]}</Text>
        ) : null}

        {/* Waveform */}
        <View className="mt-6">
          <VoiceWaveform state={isMuted ? 'idle' : voiceState} />
        </View>
      </View>

      {/* Controls — separated */}
      <View className="flex-row items-center justify-between px-16 pb-10">
        {/* Mic toggle */}
        <Pressable
          onPress={handleMicToggle}
          className="h-[60px] w-[60px] items-center justify-center rounded-full"
          style={{ backgroundColor: isMuted ? '#FF3B30' : '#F0F0EE' }}
          accessibilityRole="button"
          accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}>
          <HugeiconsIcon icon={Mic01Icon} size={24} color={isMuted ? '#FFFFFF' : '#1C1C1E'} />
          {isMuted && <View style={styles.micSlash} />}
        </Pressable>

        {/* End session */}
        <Pressable
          onPress={handleClose}
          className="h-[60px] w-[60px] items-center justify-center rounded-full bg-[#1C1C1E]"
          accessibilityRole="button"
          accessibilityLabel="End session">
          <HugeiconsIcon icon={Cancel01Icon} size={20} color="#FFFFFF" />
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

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  timer: {
    fontFamily: Platform.select({ ios: 'SF Mono', android: 'monospace' }),
    fontSize: 13,
    color: '#8C8C8C',
    fontVariant: ['tabular-nums'],
  },
  stateLabel: {
    marginTop: 20,
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'SF Pro Display', android: undefined }),
    fontWeight: '500',
    color: '#8C8C8C',
  },
  micSlash: {
    position: 'absolute',
    width: 26,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    transform: [{ rotate: '-45deg' }],
  },
});
