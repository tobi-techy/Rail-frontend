import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { FireIcon, Award01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useHaptics } from '@/hooks/useHaptics';
import { Skeleton } from '@/components/atoms/Skeleton';
import type { GameplayProfile } from '@/api/services/gameplay.service';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GameplayCardProps {
  data?: GameplayProfile | null;
  isLoading?: boolean;
  className?: string;
}

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

  return (
    <AnimatedPressable
      style={[animStyle, { backgroundColor: '#1E3A5F' }]}
      className={`rounded-3xl px-4 py-4 ${className ?? ''}`}
      onPress={() => {
        impact();
        router.push('/gameplay' as never);
      }}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 20, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      }}
      accessibilityRole="button"
      accessibilityLabel={`Level ${level} ${title}`}>
      <View className="mb-16 flex-row items-start justify-between">
        <HugeiconsIcon icon={Award01Icon} size={26} color="white" strokeWidth={1.8} />
        {streakCount > 0 && (
          <View className="flex-row items-center gap-1 rounded-full bg-white/15 px-2 py-0.5">
            <HugeiconsIcon icon={FireIcon} size={12} color="#FF2E01" />
            <Text className="font-mono-medium text-[11px] text-white">{streakCount}</Text>
          </View>
        )}
      </View>
      {isLoading ? (
        <View className="gap-y-2">
          <Skeleton light className="h-5 w-16" />
          <Skeleton light className="h-1.5 w-full rounded-full" />
          <Skeleton light className="h-3 w-20" />
        </View>
      ) : (
        <>
          <View
            className="mb-2 h-1.5 overflow-hidden rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <View
              className="h-full rounded-full bg-white"
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
          </View>
          <Text className="font-subtitle text-stash text-white" numberOfLines={1}>
            {title}
          </Text>
          <Text
            className="mt-0.5 font-body text-[11px]"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            numberOfLines={1}>
            Level {level}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
};
