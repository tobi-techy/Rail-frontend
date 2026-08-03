import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Haptics from '@/utils/platformHaptics';
import { CaretRightIcon, SquareIcon } from 'phosphor-react-native';

interface Props {
  audioUrl: string;
  duration?: number; // seconds, optional hint from backend
  caption?: string;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Waveform bar heights — static but look organic
const WAVEFORM = [0.3, 0.6, 0.4, 0.8, 0.5, 0.9, 0.6, 0.4, 0.7, 0.3, 0.8, 0.5, 0.4, 0.7, 0.3];

/**
 * iMessage-style voice message bubble for Miriam. Shows a waveform, play/pause
 * button, and elapsed/total time. Audio loads lazily on first tap.
 *
 * The backend sends this as an InsightCard of type "voice_message" with:
 *   { audio_url: string, duration_seconds?: number, caption?: string }
 *
 * Requires: ELEVENLABS_VOICE_ID + ELEVENLABS_API_KEY configured on the backend.
 * Falls back gracefully (shows caption only) if audio_url is empty.
 */
export const VoiceMessageBubble = React.memo(function VoiceMessageBubble({
  audioUrl,
  duration,
  caption,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const playerRef = useRef<AudioPlayer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animated waveform bars pulse when playing
  const pulseProgress = useSharedValue(0);
  useEffect(() => {
    if (playing) {
      pulseProgress.value = withRepeat(
        withSequence(withTiming(1, { duration: 700 }), withTiming(0, { duration: 700 })),
        -1
      );
    } else {
      cancelAnimation(pulseProgress);
      pulseProgress.value = withTiming(0, { duration: 200 });
    }
  }, [playing, pulseProgress]);

  const waveStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + pulseProgress.value * 0.5,
  }));

  const ensurePlayer = useCallback(async () => {
    if (playerRef.current) return playerRef.current;
    if (!audioUrl) return null;
    setLoading(true);
    try {
      const p = createAudioPlayer({ uri: audioUrl });
      p.volume = 1.0;
      playerRef.current = p;
      return p;
    } catch {
      setError(true);
      return null;
    } finally {
      setLoading(false);
    }
  }, [audioUrl]);

  const handleToggle = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!audioUrl) return;

    const player = await ensurePlayer();
    if (!player) return;

    if (playing) {
      player.pause();
      setPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      player.play();
      setPlaying(true);
      intervalRef.current = setInterval(() => {
        const pos = player.currentTime ?? 0;
        const dur = player.duration ?? totalDuration ?? 0;
        if (dur > 0) {
          setTotalDuration(dur);
          setProgress(pos / dur);
          setElapsed(pos);
        }
        if (pos >= dur && dur > 0) {
          setPlaying(false);
          setProgress(0);
          setElapsed(0);
          player.seekTo(0);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, 100);
    }
  }, [audioUrl, playing, ensurePlayer, totalDuration]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      try {
        playerRef.current?.remove();
      } catch {
        /* noop */
      }
    };
  }, []);

  // Fallback when no audio URL
  if (!audioUrl) {
    return caption ? (
      <Animated.View entering={FadeIn.duration(200)} className="max-w-[80%]">
        <View className="rounded-[20px] bg-[#E9E9EB] px-4 py-3">
          <Text className="font-body text-[16px] leading-[22px] text-[#1C1C1E]">{caption}</Text>
        </View>
      </Animated.View>
    ) : null;
  }

  const durationLabel =
    totalDuration > 0 ? formatDuration(playing ? elapsed : totalDuration) : '0:00';

  return (
    <Animated.View entering={FadeIn.duration(220)} className="max-w-[72%] self-start">
      <View
        className="flex-row items-center gap-3 rounded-[20px] bg-[#E9E9EB] px-4 py-3"
        style={{ minWidth: 200 }}>
        {/* Play / Pause */}
        <Pressable
          onPress={handleToggle}
          disabled={loading || error}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: error ? '#C7C7CC' : '#FF3E00',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Pause voice message' : 'Play voice message'}>
          {playing ? (
            <SquareIcon size={12} color="#fff" weight="fill" />
          ) : (
            <CaretRightIcon size={16} color="#fff" weight="fill" />
          )}
        </Pressable>

        {/* Waveform + timer */}
        <View className="flex-1 gap-1">
          <Animated.View
            style={[waveStyle, { height: 22 }]}
            className="flex-row items-center gap-[2px]">
            {WAVEFORM.map((h, i) => {
              const isFilled = progress > 0 && i / WAVEFORM.length <= progress;
              return (
                <View
                  key={i}
                  style={{
                    width: 3,
                    height: Math.round(h * 20),
                    borderRadius: 2,
                    backgroundColor: isFilled ? '#FF3E00' : '#8E8E93',
                  }}
                />
              );
            })}
          </Animated.View>
          <Text className="font-mono-medium text-[11px] text-ash">{durationLabel}</Text>
        </View>
      </View>

      {caption ? (
        <Text className="ml-1 mt-1.5 font-body text-[13px] text-ash">{caption}</Text>
      ) : null}
    </Animated.View>
  );
});
