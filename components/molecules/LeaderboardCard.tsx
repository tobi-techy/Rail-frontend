import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { CrownIcon, ArrowRight01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import { Skeleton } from '@/components/atoms/Skeleton';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface LeaderboardCardProps {
  rank?: number;
  totalUsers?: number;
  percentile?: number;
  isLoading?: boolean;
  onPress?: () => void;
}

export function LeaderboardCard({
  rank,
  totalUsers,
  percentile,
  isLoading,
  onPress,
}: LeaderboardCardProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const { impact } = useHaptics();

  const displayRank = rank ?? 0;
  const displayTotal = totalUsers ?? 0;
  const displayPercentile = percentile ?? 0;

  const rankLabel = displayRank > 0 ? `#${displayRank.toLocaleString()}` : '--';
  const rankSubLabel =
    displayTotal > 0 ? `of ${displayTotal.toLocaleString()} users` : 'Leaderboard coming soon';

  return (
    <AnimatedPressable
      style={animStyle}
      className="flex-1 overflow-hidden rounded-3xl bg-stone-surface px-4 py-4"
      onPress={() => {
        impact();
        playUISound('buttonClick');
        onPress?.();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 20, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      }}
      accessibilityRole="button"
      accessibilityLabel={`Leaderboard rank ${rankLabel}`}>
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <HugeiconsIcon icon={CrownIcon} size={14} color="#d48f00" />
          <Text className="font-caption text-[11px] uppercase tracking-[1px] text-ash">
            Leaderboard
          </Text>
        </View>
        <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="#c6c6c6" />
      </View>

      {isLoading ? (
        <View className="mt-3 gap-y-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-3 w-24" />
        </View>
      ) : (
        <>
          <Text className="mt-3 font-mono-bold text-[28px] text-charcoal-primary">{rankLabel}</Text>
          <Text className="mt-0.5 font-body text-[12px] text-ash">{rankSubLabel}</Text>

          {/* Percentile bar */}
          {displayPercentile > 0 && (
            <View className="mt-3">
              <View className="h-1.5 w-full overflow-hidden rounded-full bg-fog/40">
                <View
                  className="h-full rounded-full bg-meadow-green"
                  style={{ width: `${Math.min(displayPercentile, 100)}%` }}
                />
              </View>
              <Text className="mt-1.5 font-mono text-[10px] text-smoke">
                Top {displayPercentile}%
              </Text>
            </View>
          )}
        </>
      )}
    </AnimatedPressable>
  );
}
