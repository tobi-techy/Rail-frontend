import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useGameplayProfile,
  useAchievements,
  useChallenges,
  useSubscription,
} from '@/api/hooks/useGameplay';
import type { Achievement, UserChallenge } from '@/api/services/gameplay.service';

const RARITY_COLORS: Record<string, { bg: string; text: string }> = {
  common: { bg: '#F3F4F6', text: '#374151' },
  uncommon: { bg: '#DBEAFE', text: '#1D4ED8' },
  rare: { bg: '#EDE9FE', text: '#7C3AED' },
  epic: { bg: '#FEF3C7', text: '#D97706' },
  legendary: { bg: '#FEE2E2', text: '#DC2626' },
};

const STREAK_LABELS: Record<string, { label: string; emoji: string }> = {
  deposit: { label: 'Deposit', emoji: '🔥' },
  no_spend: { label: 'No-Spend', emoji: '🧊' },
  stash_growth: { label: 'Stash Growth', emoji: '📈' },
  roundup: { label: 'Round-Up', emoji: '🪙' },
};

export default function GameplayScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const { data: profile, refetch: refetchProfile } = useGameplayProfile();
  const { data: achievementsData } = useAchievements();
  const { data: challengesData } = useChallenges();
  const { data: subData } = useSubscription();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchProfile();
    setRefreshing(false);
  }, [refetchProfile]);

  const level = profile?.level ?? 1;
  const title = profile?.level_title ?? 'Newcomer';
  const totalXP = profile?.total_xp ?? 0;
  const progressPct = profile?.xp_progress_pct ?? 0;
  const nextLevelXP = profile?.next_level_xp ?? 100;
  const isPro = subData?.is_pro ?? false;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
        }
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pb-2 pt-3">
          <Pressable onPress={() => router.back()} className="mb-4">
            <Text className="font-body text-body text-text-secondary">← Back</Text>
          </Pressable>
          <Text className="font-heading text-headline-2 text-text-primary">Your Progress</Text>
        </View>

        {/* Level Card */}
        <View className="mx-5 mt-4 rounded-3xl bg-black px-5 py-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-mono-semibold text-small text-gray-400">LEVEL {level}</Text>
              <Text className="mt-1 font-heading text-headline-3 text-white">{title}</Text>
            </View>
            <View className="h-14 w-14 items-center justify-center rounded-full bg-white/10">
              <Text className="font-mono-bold text-headline-3 text-white">{level}</Text>
            </View>
          </View>
          <View className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
            <View
              className="h-full rounded-full bg-[#00C853]"
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
          </View>
          <View className="mt-2 flex-row justify-between">
            <Text className="font-mono text-[11px] text-gray-400">
              {totalXP.toLocaleString()} XP
            </Text>
            <Text className="font-mono text-[11px] text-gray-400">
              {nextLevelXP > 0 ? `${nextLevelXP.toLocaleString()} XP` : 'MAX'}
            </Text>
          </View>
        </View>

        {/* Streaks */}
        <View className="mt-6 px-5">
          <Text className="mb-3 font-subtitle text-subtitle text-text-primary">Streaks</Text>
          <View className="flex-row flex-wrap gap-3">
            {(profile?.streaks ?? []).map((s) => {
              const meta = STREAK_LABELS[s.streak_type] ?? { label: s.streak_type, emoji: '⭐' };
              return (
                <View
                  key={s.id}
                  className="min-w-[45%] flex-1 rounded-2xl border border-gray-100 bg-surface px-4 py-3">
                  <Text className="text-[20px]">{meta.emoji}</Text>
                  <Text className="mt-1 font-mono-semibold text-headline-3 text-text-primary">
                    {s.current_count}
                  </Text>
                  <Text className="font-body text-small text-text-secondary">{meta.label}</Text>
                  <Text className="font-mono text-[10px] text-text-tertiary">
                    Best: {s.longest_count}
                  </Text>
                </View>
              );
            })}
            {(profile?.streaks ?? []).length === 0 && (
              <Text className="font-body text-caption text-text-secondary">
                Make a deposit to start your first streak
              </Text>
            )}
          </View>
        </View>

        {/* Active Challenges */}
        <View className="mt-6 px-5">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-subtitle text-subtitle text-text-primary">Challenges</Text>
            {!isPro && (
              <Pressable onPress={() => router.push('/subscription' as never)}>
                <Text className="font-button text-small text-primary">Unlock Pro</Text>
              </Pressable>
            )}
          </View>
          {(challengesData?.challenges ?? profile?.active_challenges ?? []).map(
            (uc: UserChallenge) => {
              const pct = uc.challenge ? (uc.progress / uc.challenge.target_value) * 100 : 0;
              return (
                <View
                  key={uc.id}
                  className="mb-3 rounded-2xl border border-gray-100 bg-surface px-4 py-3">
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="flex-1 font-body-medium text-body text-text-primary"
                      numberOfLines={1}>
                      {uc.challenge?.title ?? 'Challenge'}
                    </Text>
                    <Text className="font-mono-medium text-small text-primary">
                      +{uc.challenge?.xp_reward ?? 0} XP
                    </Text>
                  </View>
                  <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
                    <View
                      className="h-full rounded-full bg-[#00C853]"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </View>
                  <Text className="mt-1 font-mono text-[10px] text-text-tertiary">
                    {uc.progress}/{uc.challenge?.target_value ?? 0}
                  </Text>
                </View>
              );
            }
          )}
          {(challengesData?.challenges ?? profile?.active_challenges ?? []).length === 0 && (
            <Text className="font-body text-caption text-text-secondary">
              {isPro ? 'New challenges coming Monday' : 'Subscribe to Pro for weekly challenges'}
            </Text>
          )}
        </View>

        {/* Achievements */}
        <View className="mt-6 px-5">
          <Text className="mb-3 font-subtitle text-subtitle text-text-primary">Badges</Text>
          <View className="flex-row flex-wrap gap-3">
            {(achievementsData?.achievements ?? []).slice(0, 8).map((a: Achievement) => {
              const colors = RARITY_COLORS[a.rarity] ?? RARITY_COLORS.common;
              return (
                <View
                  key={a.id}
                  className="w-[22%] items-center rounded-2xl py-3"
                  style={{
                    backgroundColor: a.unlocked ? colors.bg : '#F9FAFB',
                    opacity: a.unlocked ? 1 : 0.4,
                  }}>
                  <Text className="text-[24px]">{a.unlocked ? '🏆' : '🔒'}</Text>
                  <Text
                    className="mt-1 text-center font-body text-[10px] text-text-primary"
                    numberOfLines={1}>
                    {a.name}
                  </Text>
                  <Text className="font-mono text-[8px]" style={{ color: colors.text }}>
                    {a.rarity}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Pro CTA */}
        {!isPro && (
          <Pressable
            className="mx-5 mt-6 rounded-2xl bg-black px-5 py-4"
            onPress={() => router.push('/subscription' as never)}>
            <Text className="font-subtitle text-body text-white">Upgrade to Rail Pro</Text>
            <Text className="mt-1 font-body text-small text-gray-400">
              Unlock all streaks, weekly challenges, full badge collection & AI insights
            </Text>
            <Text className="mt-2 font-mono-semibold text-caption text-[#00C853]">$4.99/month</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
