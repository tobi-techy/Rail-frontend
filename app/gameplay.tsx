import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft01Icon,
  Target01Icon,
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
  CrownIcon,
} from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';
import {
  useGameplayProfile,
  useAchievements,
  useChallenges,
  useSubscription,
  useActivityHeatmap,
} from '@/api/hooks/useGameplay';
import { useHaptics } from '@/hooks/useHaptics';
import { Skeleton } from '@/components/atoms/Skeleton';
import { ProgressBar } from '@/components/atoms/ProgressBar';
import type { Achievement, UserChallenge } from '@/api/services/gameplay.service';
import { AchievementBadge } from '@/components/molecules/AchievementBadge';
import { StreakRing } from '@/components/molecules/StreakRing';
import { AchievementDetailSheet } from '@/components/sheets';
import { AnimatedFire } from '@/components/gameplay/AnimatedFire';
import { LevelRing } from '@/components/gameplay/LevelRing';

export default function GameplayScreen() {
  const router = useRouter();
  const { impact } = useHaptics();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const { data: profile, isPending, refetch } = useGameplayProfile();
  const { data: achievementsData } = useAchievements();
  const { data: challengesData } = useChallenges();
  const { data: subData } = useSubscription();
  const { data: heatmapData } = useActivityHeatmap();

  const depositStreak = profile?.streaks?.find((s: any) => s.streak_type === 'deposit');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const level = profile?.level ?? 1;
  const title = profile?.level_title ?? 'Newcomer';
  const totalXP = profile?.total_xp ?? 0;
  const progressPct = profile?.xp_progress_pct ?? 0;
  const nextLevelXP = profile?.next_level_xp ?? 100;
  const isPro = subData?.is_pro ?? false;
  const challenges = challengesData?.challenges ?? profile?.active_challenges ?? [];
  const achievements = achievementsData?.achievements ?? [];
  const earnedCount = achievements.filter((a: Achievement) => a.unlocked).length;



  return (
    <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
        }
        showsVerticalScrollIndicator={false}>
        {/* ── Header ───────────────────────────────────────────── */}
        <View className="flex-row items-center justify-between px-5 pb-4 pt-3">
          <Pressable
            onPress={() => {
              impact();
              router.back();
            }}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface"
            hitSlop={12}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#000" />
          </Pressable>
          <Text className="font-heading text-headline-3 text-text-primary">Progress</Text>
          <View className="w-10" />
        </View>

        {/* ── Level Hero ───────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400)} className="items-center px-5 pt-2">
          {isPending ? (
            <View className="items-center">
              <Skeleton className="mb-3 h-28 w-28 rounded-full" />
              <Skeleton className="mb-2 h-6 w-24" />
              <Skeleton className="h-4 w-32" />
            </View>
          ) : (
            <>
              <View className="items-center justify-center">
                <LevelRing size={128} strokeWidth={5} progress={progressPct} glow />
                <View className="absolute items-center justify-center rounded-full bg-black"
                  style={{ width: 102, height: 102 }}>
                  <Text className="font-mono-bold text-[40px] text-white">{level}</Text>
                </View>
              </View>

              <View className="mt-4 flex-row items-center gap-2">
                <Text className="font-heading text-headline-2 text-text-primary">{title}</Text>
                {isPro && (
                  <View className="flex-row items-center gap-1 rounded-full bg-primary px-2 py-0.5">
                    <HugeiconsIcon icon={CrownIcon} size={12} color="#fff" />
                    <Text className="font-mono-semibold text-[10px] text-white">PRO</Text>
                  </View>
                )}
              </View>

              <Text className="mt-1 font-mono text-caption text-text-secondary">
                {totalXP.toLocaleString()} XP
              </Text>

              <View className="mt-5 w-full">
                <ProgressBar progress={progressPct} height={10} className="w-full" />
                <View className="mt-2 flex-row justify-between">
                  <Text className="font-mono text-[11px] text-text-tertiary">
                    {totalXP.toLocaleString()} XP
                  </Text>
                  <Text className="font-mono text-[11px] text-text-tertiary">
                    {nextLevelXP > 0 ? `${nextLevelXP.toLocaleString()} XP` : 'MAX'}
                  </Text>
                </View>
              </View>
            </>
          )}
        </Animated.View>

        {/* ── Streak ──────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(80).duration(400)}
          className="mt-8 px-5">
          <Text className="mb-4 font-subtitle text-small uppercase tracking-wider text-text-secondary">
            Streak
          </Text>

          <View className="flex-row items-center gap-4">
            <AnimatedFire size={44} />
            <View>
              <Text className="font-heading text-headline-2 text-text-primary">
                {depositStreak?.current_count ?? 0} day streak
              </Text>
              <Text className="mt-0.5 font-mono text-caption text-text-secondary">
                Longest: {depositStreak?.longest_count ?? 0} days
              </Text>
            </View>
          </View>

          <View className="mt-5">
            <StreakRing
              currentStreak={depositStreak?.current_count ?? 0}
              longestStreak={depositStreak?.longest_count}
              activeDates={heatmapData?.dates ?? []}
              streakType="deposit"
            />
          </View>


        </Animated.View>

        {/* ── Challenges ───────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(160).duration(400)}
          className="mt-6 px-5">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-subtitle text-small uppercase tracking-wider text-text-secondary">
              Challenges
            </Text>
            <Text className="font-mono-semibold text-small text-primary">
              {challenges.filter((c: UserChallenge) => c.status === 'completed').length}
              /{challenges.length}
            </Text>
          </View>

          {challenges.map((uc: UserChallenge, i: number) => {
            const pct = uc.challenge ? (uc.progress / uc.challenge.target_value) * 100 : 0;
            const done = pct >= 100 || uc.status === 'completed';
            return (
              <Animated.View
                key={uc.id}
                entering={FadeInDown.delay(180 + i * 40).duration(350)}
                className="mb-3 flex-row items-center rounded-lg bg-surface px-4 py-4">
                <View
                  className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${
                    done ? 'bg-success' : 'bg-black'
                  }`}>
                  {done ? (
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} color="#fff" />
                  ) : (
                    <HugeiconsIcon icon={Target01Icon} size={20} color="#fff" />
                  )}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="flex-1 font-subtitle text-body text-text-primary"
                      numberOfLines={1}>
                      {uc.challenge?.title ?? 'Challenge'}
                    </Text>
                    <Text className="ml-2 font-mono-semibold text-small text-success">
                      +{uc.challenge?.xp_reward ?? 0}
                    </Text>
                  </View>
                  <View className="mt-2.5 flex-row items-center gap-3">
                    <View className="h-2 flex-1 overflow-hidden rounded-full bg-stone-surface">
                      <View
                        className="h-full rounded-full bg-black"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </View>
                    <Text className="font-mono text-[10px] text-text-tertiary">
                      {uc.progress}/{uc.challenge?.target_value ?? 0}
                    </Text>
                  </View>
                </View>
                {!done && (
                  <View className="ml-2">
                    <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#848281" />
                  </View>
                )}
              </Animated.View>
            );
          })}

          {challenges.length === 0 && (
            <View className="items-center rounded-lg border border-stone-surface py-8">
              <HugeiconsIcon icon={Target01Icon} size={28} color="#c6c6c6" />
              <Text className="mt-3 font-body text-caption text-text-secondary">
                {isPro ? 'New challenges Monday' : 'New challenges drop Monday'}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* ── Badges ───────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(260).duration(400)}
          className="mt-6 px-5">
          <View className="mb-5 flex-row items-center justify-between">
            <Text className="font-subtitle text-small uppercase tracking-wider text-text-secondary">
              Badges
            </Text>
            <Text className="font-mono-semibold text-small text-primary">
              {earnedCount}/{achievements.length}
            </Text>
          </View>
          <View className="flex-row flex-wrap justify-between" style={{ rowGap: 24 }}>
            {achievements.map((a: Achievement) => (
              <View key={a.id} className="w-[30%] items-center">
                <AchievementBadge
                  achievement={a}
                  size="large"
                  onPress={() => {
                    impact();
                    setSelectedAchievement(a);
                  }}
                />
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <AchievementDetailSheet
        achievement={selectedAchievement}
        visible={selectedAchievement !== null}
        onClose={() => setSelectedAchievement(null)}
      />
    </SafeAreaView>
  );
}
