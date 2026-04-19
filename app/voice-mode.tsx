import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  FadeIn,
  interpolate,
} from 'react-native-reanimated';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Cancel01Icon, Mic01Icon, MicOff01Icon } from '@hugeicons/core-free-icons';
import { useVoiceSession, VoiceState } from '@/hooks/useVoiceSession';
import { useFeedbackPopupStore } from '@/stores/feedbackPopupStore';

const ACCENT = '#FF2E01';
const BG = '#0A0A0A';

function VoiceOrb({ state }: { state: VoiceState }) {
  const pulse = useSharedValue(0);
  const breathe = useSharedValue(1);
  const glow = useSharedValue(0.3);

  useEffect(() => {
    if (state === 'listening') {
      pulse.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }), -1, true);
      breathe.value = withRepeat(withSequence(
        withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ), -1);
      glow.value = withRepeat(withTiming(0.6, { duration: 1500 }), -1, true);
    } else if (state === 'speaking') {
      pulse.value = withRepeat(withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }), -1, true);
      breathe.value = withRepeat(withSequence(
        withTiming(1.15, { duration: 300 }),
        withTiming(0.95, { duration: 300 }),
      ), -1);
      glow.value = withRepeat(withTiming(0.8, { duration: 400 }), -1, true);
    } else if (state === 'thinking') {
      pulse.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
      breathe.value = withTiming(0.92, { duration: 600 });
      glow.value = withTiming(0.2, { duration: 400 });
    } else {
      pulse.value = withTiming(0, { duration: 300 });
      breathe.value = withSpring(1);
      glow.value = withTiming(0.1, { duration: 300 });
    }
  }, [state]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
  }));

  const ring1Style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.15, 0.35]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.4]) }],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.08, 0.2]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1.2, 1.8]) }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  const orbColor = state === 'speaking' ? ACCENT : state === 'thinking' ? '#FF6B40' : '#FF2E01';

  return (
    <View style={styles.orbContainer}>
      {/* Outer rings */}
      <Animated.View style={[styles.ring, { width: 240, height: 240, borderRadius: 120, borderColor: orbColor }, ring2Style]} />
      <Animated.View style={[styles.ring, { width: 200, height: 200, borderRadius: 100, borderColor: orbColor }, ring1Style]} />
      {/* Glow */}
      <Animated.View style={[styles.glow, { backgroundColor: orbColor }, glowStyle]} />
      {/* Main orb */}
      <Animated.View style={[styles.orb, { backgroundColor: orbColor }, orbStyle]}>
        <HugeiconsIcon
          icon={state === 'error' ? MicOff01Icon : Mic01Icon}
          size={40}
          color="#FFFFFF"
        />
      </Animated.View>
    </View>
  );
}

function StateLabel({ state }: { state: VoiceState }) {
  const labels: Record<VoiceState, string> = {
    idle: '',
    connecting: 'Connecting...',
    listening: 'Listening...',
    thinking: 'Thinking...',
    speaking: 'Speaking...',
    error: 'Connection lost',
  };
  return (
    <Animated.Text entering={FadeIn.duration(200)} style={styles.stateLabel}>
      {labels[state]}
    </Animated.Text>
  );
}

export default function VoiceModeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, transcript, responseText, error, connect, disconnect } = useVoiceSession();
  const showPopup = useFeedbackPopupStore((s) => s.showPopup);

  useEffect(() => {
    connect();
    return () => { disconnect(); };
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
    disconnect();
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
          <HugeiconsIcon icon={Cancel01Icon} size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.title}>MIRIAM</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Transcript area */}
      <View style={styles.transcriptArea}>
        {transcript ? (
          <Animated.View entering={FadeIn.duration(150)}>
            <Text style={styles.transcriptLabel}>You said</Text>
            <Text style={styles.transcriptText}>{transcript}</Text>
          </Animated.View>
        ) : null}
        {responseText ? (
          <Animated.View entering={FadeIn.duration(150)} style={{ marginTop: 16 }}>
            <Text style={styles.responseText}>{responseText}</Text>
          </Animated.View>
        ) : null}
      </View>

      {/* Orb */}
      <View style={styles.orbSection}>
        <VoiceOrb state={state} />
        <StateLabel state={state} />
      </View>

      {/* Bottom controls */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable onPress={handleClose} style={styles.endBtn}>
          <Text style={styles.endBtnText}>End</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'SFMono-Bold', fontSize: 14, color: '#FFFFFF', letterSpacing: 1 },
  transcriptArea: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'flex-end',
    paddingBottom: 24,
  },
  transcriptLabel: { fontFamily: 'SFMono-Medium', fontSize: 11, color: '#666', letterSpacing: 0.5, marginBottom: 4 },
  transcriptText: { fontFamily: 'SFProDisplay-Regular', fontSize: 16, color: '#999', lineHeight: 24 },
  responseText: { fontFamily: 'SFProDisplay-Regular', fontSize: 18, color: '#FFFFFF', lineHeight: 28 },
  orbSection: { alignItems: 'center', paddingVertical: 40 },
  orbContainer: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderWidth: 1.5 },
  glow: { position: 'absolute', width: 160, height: 160, borderRadius: 80 },
  orb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOpacity: 0.4,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 20,
  },
  stateLabel: {
    fontFamily: 'SFProDisplay-Medium',
    fontSize: 14,
    color: '#666',
    marginTop: 20,
  },
  bottomControls: { alignItems: 'center', paddingTop: 16 },
  endBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 28,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  endBtnText: { fontFamily: 'SFProDisplay-Medium', fontSize: 16, color: '#FFFFFF' },
});
