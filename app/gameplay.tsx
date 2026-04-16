import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import {
  ArrowLeft01Icon,
  Award01Icon,
  FireIcon,
  Target01Icon,
  StarIcon,
  DiamondIcon,
  CrownIcon,
  LockIcon,
  ArrowRight01Icon,
  Shield01Icon,
  Rocket01Icon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  useGameplayProfile,
  useAchievements,
  useChallenges,
  useSubscription,
} from '@/api/hooks/useGameplay';
import { useHaptics } from '@/hooks/useHaptics';
import { Skeleton } from '@/components/atoms/Skeleton';
import type { Achievement, UserChallenge } from '@/api/services/gameplay.service';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const BADGE_ICON: Record<string, any> = {
  deposit: ArrowRight01Icon,
  shield: Shield01Icon,
  flame: FireIcon,
  star: StarIcon,
  crown: CrownIcon,
  diamond: DiamondIcon,
  trophy: Award01Icon,
  calendar: Target01Icon,
  users: CrownIcon,
  gem: DiamondIcon,
  badge: Award01Icon,
};
const RARITY_BG: Record<string, string> = {
  common: '#E5E7EB',
  uncommon: '#DBEAFE',
  rare: '#EDE9FE',
  epic: '#FEF3C7',
  legendary: '#FEE2E2',
};
const RARITY_ACCENT: Record<string, string> = {
  common: '#6B7280',
  uncommon: '#2563EB',
  rare: '#7C3AED',
  epic: '#D97706',
  legendary: '#FF2E01',
};
const STREAK_META: Record<string, { label: string; icon: any }> = {
  deposit: { label: 'Deposit', icon: ArrowRight01Icon },
  no_spend: { label: 'No-Spend', icon: Shield01Icon },
  stash_growth: { label: 'Growth', icon: Rocket01Icon },
  roundup: { label: 'Round-Up', icon: StarIcon },
};

export default function GameplayScreen() {
  const router = useRouter();
  const { impact } = useHaptics();
  const [refreshing, setRefreshing] = useState(false);
  const { data: profile, isPending, refetch } = useGameplayProfile();
  const { data: achievementsData } = useAchievements();
  const { data: challengesData } = useChallenges();
  const { data: subData } = useSubscription();

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
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
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
        <Animated.View entering={FadeInDown.duration(400)} className="items-center px-5 pt-4">
          {isPending ? (
            <View className="items-center">
              <Skeleton className="mb-3 h-24 w-24 rounded-full" />
              <Skeleton className="mb-2 h-5 w-20" />
              <Skeleton className="h-3 w-32" />
            </View>
          ) : (
            <>
              {/* Large level circle — inspired by Duolingo XP screen */}
              <View className="mb-4 h-28 w-28 items-center justify-center rounded-full bg-black">
                <Text className="font-mono-bold text-[44px] text-white">{level}</Text>
              </View>
              <Text className="font-heading text-headline-2 text-text-primary">{title}</Text>
              <Text className="mt-1 font-mono text-caption text-text-secondary">
                {totalXP.toLocaleString()} XP
              </Text>
              {/* XP bar */}
              <View className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface">
                <View
                  className="h-full rounded-full bg-black"
                  style={{ width: `${Math.min(progressPct, 100)}%` }}
                />
              </View>
              <View className="mt-1.5 w-full flex-row justify-between">
                <Text className="font-mono text-[10px] text-text-tertiary">Level {level}</Text>
                <Text className="font-mono text-[10px] text-text-tertiary">
                  {nextLevelXP > 0 ? `Level ${level + 1}` : 'MAX'}
                </Text>
              </View>
            </>
          )}
        </Animated.View>

        {/* ── Streaks — inspired by Speak (big numbers, centered) ── */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} className="mt-8 px-5">
          <Text className="mb-4 font-mono text-small tracking-[3px] text-text-tertiary">
            STREAKS
          </Text>
          <View className="flex-row gap-3">
            {(profile?.streaks ?? []).map((s) => {
              const meta = STREAK_META[s.streak_type] ?? { label: s.streak_type, icon: FireIcon };
              const isActive = s.current_count > 0;
              return (
                <View
                  key={s.id}
                  className="flex-1 items-center rounded-2xl border border-gray-100 bg-white py-5">
                  <View
                    className={`mb-2 h-11 w-11 items-center justify-center rounded-full ${isActive ? 'bg-black' : 'bg-surface'}`}>
                    <HugeiconsIcon
                      icon={meta.icon}
                      size={20}
                      color={isActive ? '#fff' : '#9CA3AF'}
                    />
                  </View>
                  <Text className="font-mono-bold text-headline-2 text-text-primary">
                    {s.current_count}
                  </Text>
                  <Text className="font-body text-small text-text-secondary">{meta.label}</Text>
                  <Text className="mt-1 font-mono text-[9px] text-text-tertiary">
                    Best {s.longest_count}
                  </Text>
                </View>
              );
            })}
            {(profile?.streaks ?? []).length === 0 && (
              <View className="flex-1 items-center rounded-2xl border border-gray-100 py-8">
                <HugeiconsIcon icon={FireIcon} size={28} color="#D1D5DB" />
                <Text className="mt-3 font-body text-caption text-text-secondary">
                  Deposit to start
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* ── Challenges ───────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)} className="mt-8 px-5">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-mono text-small tracking-[3px] text-text-tertiary">
              CHALLENGES
            </Text>
            {!isPro && (
              <Pressable
                onPress={() => {
                  impact();
                  router.push('/subscription' as never);
                }}
                hitSlop={8}>
                <Text className="font-button text-small text-primary">Get Pro</Text>
              </Pressable>
            )}
          </View>
          {challenges.map((uc: UserChallenge, i: number) => {
            const pct = uc.challenge ? (uc.progress / uc.challenge.target_value) * 100 : 0;
            const done = pct >= 100;
            return (
              <Animated.View
                key={uc.id}
                entering={FadeInDown.delay(180 + i * 40).duration(350)}
                className="mb-3 flex-row items-center rounded-2xl border border-gray-100 bg-white px-4 py-4">
                <View
                  className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${done ? 'bg-[#00C853]' : 'bg-surface'}`}>
                  {done ? (
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} color="#fff" />
                  ) : (
                    <HugeiconsIcon icon={Target01Icon} size={20} color="#000" />
                  )}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="flex-1 font-subtitle text-body text-text-primary"
                      numberOfLines={1}>
                      {uc.challenge?.title ?? 'Challenge'}
                    </Text>
                    <Text className="ml-2 font-mono-semibold text-small text-[#00C853]">
                      +{uc.challenge?.xp_reward ?? 0}
                    </Text>
                  </View>
                  <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <View
                      className={`h-full rounded-full ${done ? 'bg-[#00C853]' : 'bg-black'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </View>
                </View>
              </Animated.View>
            );
          })}
          {challenges.length === 0 && (
            <View className="items-center rounded-2xl border border-gray-100 py-8">
              <HugeiconsIcon icon={Target01Icon} size={28} color="#D1D5DB" />
              <Text className="mt-3 font-body text-caption text-text-secondary">
                {isPro ? 'New challenges Monday' : 'Go Pro for challenges'}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* ── Badges — 3-col circle grid (Zero/OLIO/Duolingo style) ── */}
        <Animated.View entering={FadeInDown.delay(260).duration(400)} className="mt-8 px-5">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-mono text-small tracking-[3px] text-text-tertiary">BADGES</Text>
            <Text className="font-mono-semibold text-small text-primary">
              {earnedCount}/{achievements.length}
            </Text>
          </View>
          <View className="flex-row flex-wrap justify-between">
            {achievements.map((a: Achievement, i: number) => {
              const accent = RARITY_ACCENT[a.rarity] ?? '#6B7280';
              const bg = RARITY_BG[a.rarity] ?? '#E5E7EB';
              const IconComp = BADGE_ICON[a.icon] ?? Award01Icon;
              return (
                <Animated.View
                  key={a.id}
                  entering={FadeInDown.delay(280 + i * 30).duration(300)}
                  className="mb-5 w-[31%] items-center">
                  {/* Large circle badge — locked = gray, unlocked = colored */}
                  <View
                    className="mb-2 h-[88px] w-[88px] items-center justify-center rounded-full"
                    style={{ backgroundColor: a.unlocked ? bg : '#F3F4F6' }}>
                    {a.unlocked ? (
                      <HugeiconsIcon icon={IconComp} size={32} color={accent} />
                    ) : (
                      <HugeiconsIcon icon={LockIcon} size={24} color="#C4C4C4" />
                    )}
                  </View>
                  <Text
                    className="text-center font-subtitle text-[11px] text-text-primary"
                    numberOfLines={2}>
                    {a.name}
                  </Text>
                  <Text
                    className="mt-0.5 font-mono text-[9px] capitalize"
                    style={{ color: a.unlocked ? accent : '#C4C4C4' }}>
                    {a.rarity}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Pro CTA ──────────────────────────────────────────── */}
        {!isPro && (
          <Animated.View entering={FadeInDown.delay(380).duration(400)} className="mx-5 mt-4">
            <Pressable
              onPress={() => {
                impact();
                router.push('/subscription' as never);
              }}
              className="flex-row items-center justify-between rounded-2xl bg-black px-5 py-5">
              <View className="flex-1">
                <Text className="font-subtitle text-body text-white">Unlock everything</Text>
                <Text className="mt-0.5 font-body text-small text-gray-400">
                  Rail Pro · $4.99/mo
                </Text>
              </View>
              <HugeiconsIcon icon={ArrowRight01Icon} size={20} color="#fff" />
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
