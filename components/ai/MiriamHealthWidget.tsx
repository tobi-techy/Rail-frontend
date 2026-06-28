import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { router } from 'expo-router';
import { ArrowUpRight01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import aiService from '@/api/services/ai.service';
import type { MiriamHealthScore } from '@/api/types/ai';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function scoreColor(score: number): string {
  if (score >= 75) return '#00ca48';
  if (score >= 50) return '#ff3e00';
  return '#ff2b3a';
}

function trendColor(trend: string): string {
  if (trend === 'improving') return '#00ca48';
  if (trend === 'declining') return '#ff2b3a';
  return '#848281';
}

function trendLabel(trend: string): string {
  if (trend === 'improving') return 'improving';
  if (trend === 'declining') return 'declining';
  return 'stable';
}

interface Props {
  className?: string;
}

export function MiriamHealthWidget({ className }: Props) {
  const [score, setScore] = useState<MiriamHealthScore | null>(null);

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  useEffect(() => {
    (async () => {
      try {
        const res = await aiService.getMiriamHealthScore();
        setScore((res as any)?.data?.latest ?? null);
      } catch {
        //
      }
    })();
  }, []);

  if (!score) return null;

  const color = scoreColor(score.overall_score);
  const tc = trendColor(score.trend);
  const delta = score.previous_score > 0 ? score.overall_score - score.previous_score : null;

  return (
    <AnimatedPressable
      style={[
        animStyle,
        {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
        },
      ]}
      className={`mt-3 rounded-3xl border border-black/[0.07] bg-[#F8F8F8] px-5 py-5 ${className ?? ''}`}
      onPress={() => router.push('/miriam-health' as never)}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      }}
      accessibilityRole="button"
      accessibilityLabel="View financial health details">
      {/* Header row */}
      <View className="mb-4 flex-row items-center justify-between">
        <Text
          className="font-body text-[11px] uppercase tracking-widest text-ash"
          accessibilityRole="text">
          Financial Health
        </Text>
        <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} color="#c6c6c6" />
      </View>

      {/* Score + delta row */}
      <View className="flex-row items-end gap-3">
        <Text
          style={{
            fontSize: 48,
            lineHeight: 48,
            fontFamily: 'Geist-SemiBold',
            color,
            fontVariant: ['tabular-nums'],
          }}>
          {score.overall_score}
        </Text>
        {delta !== null && (
          <Text
            style={{
              fontSize: 15,
              fontFamily: 'Geist-SemiBold',
              color,
              marginBottom: 4,
              fontVariant: ['tabular-nums'],
            }}>
            {delta >= 0 ? '+' : ''}
            {delta}
          </Text>
        )}
      </View>

      {/* Trend indicator */}
      <View className="mt-2 flex-row items-center gap-2">
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tc }} />
        <Text
          style={{
            fontSize: 12,
            fontFamily: 'Geist-Regular',
            color: tc,
          }}>
          {trendLabel(score.trend)}
        </Text>
      </View>

      {/* Reasoning */}
      {score.reasoning ? (
        <Text className="mt-3 font-body text-[13px] leading-[19px] text-graphite" numberOfLines={2}>
          {score.reasoning}
        </Text>
      ) : null}
    </AnimatedPressable>
  );
}
