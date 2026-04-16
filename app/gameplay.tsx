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
const RARITY_ACCENT: Record<string, string> = {
  common: '#9CA3AF',
  uncommon: '#3B82F6',
  rare: '#8B5CF6',
  epic: '#F59E0B',
  legendary: '#FF2E01',
};
const STREAK_META: Record<string, { label: string; icon: any }> = {
  deposit: { label: 'Deposit', icon: ArrowRight01Icon },
  no_spend: { label: 'No-Spend', icon: Shield01Icon },
  stash_growth: { label: 'Growth', icon: Rocket01Icon },
  roundup: { label: 'Round-Up', icon: StarIcon },
};

function PressCard({
  children,
  onPress,
  className = '',
}: {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const { impact } = useHaptics();
  return (
    <AnimatedPressable
      style={animStyle}
      className={`rounded-3xl bg-surface ${className}`}
      onPress={() => {
        impact();
        onPress?.();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      }}>
      {children}
    </AnimatedPressable>
  );
}

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

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
        }
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-5 pb-4 pt-3">
          <Pressable
            onPress={() => {
              impact();
              router.back();
            }}
            className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-surface"
            hitSlop={12}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#000" />
          </Pressable>
          <Text className="font-heading text-headline-2 text-text-primary">Progress</Text>
        </View>

        {/* Level Hero */}
        <Animated.View entering={FadeInDown.duration(400)} className="mx-5">
          {isPending ? (
            <View className="rounded-3xl bg-black px-6 py-6">
              <Skeleton className="mb-2 h-4 w-16" />
              <Skeleton className="mb-4 h-8 w-32" />
              <Skeleton className="h-2 w-full rounded-full" />
            </View>
          ) : (
            <View className="rounded-3xl bg-black px-6 py-6">
              <Text className="font-mono text-small tracking-widest text-gray-500">
                LEVEL {level}
              </Text>
              <Text className="mt-1 font-heading text-headline-1 text-white">{title}</Text>
              <View className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <View
                  className="h-full rounded-full bg-[#00C853]"
                  style={{ width: `${Math.min(progressPct, 100)}%` }}
                />
              </View>
              <View className="mt-2 flex-row justify-between">
                <Text className="font-mono text-small text-gray-500">
                  {totalXP.toLocaleString()} XP
                </Text>
                <Text className="font-mono text-small text-gray-500">
                  {nextLevelXP > 0 ? `${nextLevelXP.toLocaleString()} XP` : 'MAX'}
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Streaks */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} className="mt-6 px-5">
          <Text className="mb-3 font-subtitle text-subtitle text-text-primary">Streaks</Text>
          <View className="flex-row gap-3">
            {(profile?.streaks ?? []).map((s) => {
              const meta = STREAK_META[s.streak_type] ?? { label: s.streak_type, icon: FireIcon };
              return (
                <View
                  key={s.id}
                  className="min-w-[30%] flex-1 items-center rounded-3xl bg-surface px-3 py-4">
                  <View className="mb-2 h-10 w-10 items-center justify-center rounded-full bg-white">
                    <HugeiconsIcon icon={meta.icon} size={20} color="#000" />
                  </View>
                  <Text className="font-mono-bold text-headline-3 text-text-primary">
                    {s.current_count}
                  </Text>
                  <Text className="mt-0.5 font-body text-small text-text-secondary">
                    {meta.label}
                  </Text>
                  <Text className="font-mono text-[10px] text-text-tertiary">
                    Best {s.longest_count}
                  </Text>
                </View>
              );
            })}
            {(profile?.streaks ?? []).length === 0 && (
              <View className="flex-1 items-center rounded-3xl bg-surface px-4 py-6">
                <HugeiconsIcon icon={FireIcon} size={24} color="#9CA3AF" />
                <Text className="mt-2 text-center font-body text-caption text-text-secondary">
                  Make a deposit to start your first streak
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Challenges */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)} className="mt-6 px-5">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-subtitle text-subtitle text-text-primary">Challenges</Text>
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
          {challenges.map((uc: UserChallenge) => {
            const pct = uc.challenge ? (uc.progress / uc.challenge.target_value) * 100 : 0;
            return (
              <PressCard key={uc.id} className="mb-3 px-4 py-4">
                <View className="flex-row items-start">
                  <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-white">
                    <HugeiconsIcon icon={Target01Icon} size={20} color="#000" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-subtitle text-body text-text-primary" numberOfLines={1}>
                      {uc.challenge?.title ?? 'Challenge'}
                    </Text>
                    <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
                      <View
                        className="h-full rounded-full bg-[#00C853]"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </View>
                    <View className="mt-1 flex-row justify-between">
                      <Text className="font-mono text-[10px] text-text-tertiary">
                        {uc.progress}/{uc.challenge?.target_value ?? 0}
                      </Text>
                      <Text className="font-mono-semibold text-[10px] text-[#00C853]">
                        +{uc.challenge?.xp_reward ?? 0} XP
                      </Text>
                    </View>
                  </View>
                </View>
              </PressCard>
            );
          })}
          {challenges.length === 0 && (
            <View className="items-center rounded-3xl bg-surface px-4 py-6">
              <HugeiconsIcon icon={Target01Icon} size={24} color="#9CA3AF" />
              <Text className="mt-2 text-center font-body text-caption text-text-secondary">
                {isPro ? 'New challenges drop Monday' : 'Subscribe to Pro for weekly challenges'}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Badges */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)} className="mt-6 px-5">
          <Text className="mb-3 font-subtitle text-subtitle text-text-primary">Badges</Text>
          <View className="flex-row flex-wrap gap-3">
            {achievements.slice(0, 8).map((a: Achievement) => {
              const accent = RARITY_ACCENT[a.rarity] ?? '#9CA3AF';
              const IconComp = BADGE_ICON[a.icon] ?? Award01Icon;
              return (
                <View
                  key={a.id}
                  className="w-[22%] items-center rounded-2xl bg-surface px-2 py-3"
                  style={{ opacity: a.unlocked ? 1 : 0.35 }}>
                  <View
                    className="mb-1.5 h-11 w-11 items-center justify-center rounded-full"
                    style={{ backgroundColor: a.unlocked ? accent + '20' : '#F3F4F6' }}>
                    {a.unlocked ? (
                      <HugeiconsIcon icon={IconComp} size={22} color={accent} />
                    ) : (
                      <HugeiconsIcon icon={LockIcon} size={18} color="#D1D5DB" />
                    )}
                  </View>
                  <Text
                    className="text-center font-body-medium text-[10px] text-text-primary"
                    numberOfLines={1}>
                    {a.name}
                  </Text>
                  <Text
                    className="font-mono text-[8px] capitalize"
                    style={{ color: a.unlocked ? accent : '#D1D5DB' }}>
                    {a.rarity}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Pro CTA */}
        {!isPro && (
          <Animated.View entering={FadeInDown.delay(320).duration(400)} className="mt-8 px-5">
            <PressCard
              onPress={() => router.push('/subscription' as never)}
              className="flex-row items-center justify-between bg-black px-5 py-5">
              <View className="flex-1">
                <Text className="font-subtitle text-subtitle text-white">Rail Pro</Text>
                <Text className="mt-1 font-body text-caption text-gray-400">
                  All streaks, challenges, badges & AI insights
                </Text>
                <Text className="mt-2 font-mono-semibold text-caption text-[#00C853]">
                  $4.99/month
                </Text>
              </View>
              <View className="ml-4 h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <HugeiconsIcon icon={ArrowRight01Icon} size={20} color="#fff" />
              </View>
            </PressCard>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
