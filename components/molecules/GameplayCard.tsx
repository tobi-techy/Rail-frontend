import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useHaptics } from '@/hooks/useHaptics';
import { Skeleton } from '@/components/atoms/Skeleton';
import type { GameplayProfile } from '@/api/services/gameplay.service';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GameplayCardProps {
  data?: GameplayProfile | null;
  isLoading?: boolean;
  className?: string;
}

const LEVEL_COLORS: Record<number, string> = {
  1: '#9CA3AF',
  2: '#6B7280',
  3: '#3B82F6',
  4: '#8B5CF6',
  5: '#F59E0B',
  6: '#10B981',
  7: '#EC4899',
  8: '#FF2E01',
  9: '#F97316',
  10: '#EAB308',
};

export const GameplayCard: React.FC<GameplayCardProps> = ({ data, isLoading, className }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const { impact } = useHaptics();
  const router = useRouter();

  const level = data?.level ?? 1;
  const title = data?.level_title ?? 'Newcomer';
  const progressPct = data?.xp_progress_pct ?? 0;
  const depositStreak = data?.streaks?.find((s) => s.streak_type === 'deposit');
  const streakCount = depositStreak?.current_count ?? 0;
  const activeChallenge = data?.active_challenges?.[0];

  return (
    <AnimatedPressable
      style={[animStyle, { backgroundColor: '#00C853' }]}
      className={`flex-1 rounded-3xl px-4 py-4 ${className ?? ''}`}
      onPress={() => {
        impact();
        router.push('/gameplay');
      }}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 20, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      }}
      accessibilityRole="button"
      accessibilityLabel={`Level ${level} ${title}`}>
      {/* Top: Level badge + streak */}
      <View className="mb-3 flex-row items-center justify-between">
        <View
          className="rounded-full px-2.5 py-1"
          style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}>
          <Text className="font-mono-semibold text-[11px] text-white">LVL {level}</Text>
        </View>
        {streakCount > 0 && (
          <View className="flex-row items-center gap-1">
            <Text className="text-[13px]">🔥</Text>
            <Text className="font-mono-medium text-[13px] text-white">{streakCount}</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View className="gap-y-2">
          <Skeleton light className="h-5 w-16" />
          <Skeleton light className="h-2 w-full rounded-full" />
          <Skeleton light className="h-3 w-20" />
        </View>
      ) : (
        <>
          {/* XP Progress bar */}
          <View
            className="mb-2 h-1.5 overflow-hidden rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}>
            <View
              className="h-full rounded-full bg-white"
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
          </View>

          {/* Title */}
          <Text className="font-subtitle text-[15px] text-white" numberOfLines={1}>
            {title}
          </Text>

          {/* Active challenge or badge count */}
          {activeChallenge?.challenge ? (
            <Text
              className="mt-0.5 font-body text-[11px]"
              style={{ color: 'rgba(255,255,255,0.7)' }}
              numberOfLines={1}>
              {activeChallenge.challenge.title}
            </Text>
          ) : (
            <Text
              className="mt-0.5 font-body text-[11px]"
              style={{ color: 'rgba(255,255,255,0.7)' }}>
              {data?.achievements_earned ?? 0}/{data?.achievements_total ?? 0} badges
            </Text>
          )}
        </>
      )}
    </AnimatedPressable>
  );
};
