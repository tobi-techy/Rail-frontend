import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Share } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';

import { DiceBearAvatar } from '@/components/atoms/DiceBearAvatar';
import { HealthScoreLever, LeaderboardCard, PointsCard, SettingsSection, ListItem } from '@/components/molecules';
import { useAuthStore } from '@/stores/authStore';
import { useTierCapabilities, useFinancialHealth, useGameplayProfile } from '@/api/hooks';
import { invalidateQueries } from '@/api/queryClient';
import { getTierMeta } from '@/api/types/kyc';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';

import {
  Cancel01Icon,
  Copy01Icon,
  UserIcon,
  ShieldKeyIcon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  UserGroupIcon,
} from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';

const chevron = <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="#a7a7a7" />;

function ProfileScreenHeader() {
  const user = useAuthStore((s) => s.user);
  const name =
    user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Your Account';
  const tag = user?.railTag ? `@${user.railTag}` : null;
  const seed = user?.id || user?.email || name;
  const { impact } = useHaptics();
  const { showInfo } = useFeedbackPopup();

  const handleCopyTag = useCallback(async () => {
    if (!user?.railTag) return;
    impact();
    await Clipboard.setStringAsync(user.railTag);
    showInfo('Copied', 'Your tag was copied.');
  }, [user?.railTag, impact, showInfo]);

  return (
    <View className="mb-4 px-4">
      <View className="overflow-hidden rounded-2xl bg-white p-5 shadow-subtle">
        <View className="flex-row items-center gap-4">
          <DiceBearAvatar seed={seed} size={72} />
          <View className="flex-1">
            <Text
              className="font-display text-heading-sm text-charcoal-primary"
              maxFontSizeMultiplier={1.2}>
              {name}
            </Text>
            {tag && (
              <Pressable
                onPress={handleCopyTag}
                className="mt-1 flex-row items-center gap-1.5 active:opacity-70"
                hitSlop={8}>
                <Text className="font-mono text-caption text-ash" maxFontSizeMultiplier={1.3}>
                  {tag}
                </Text>
                <HugeiconsIcon icon={Copy01Icon} size={13} color="#a7a7a7" />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const { impact } = useHaptics();
  const { showInfo } = useFeedbackPopup();
  const { tier } = useTierCapabilities();
  const [refreshing, setRefreshing] = useState(false);

  const { data: healthData, isLoading: isHealthLoading } = useFinancialHealth();
  const { data: gameplayProfile, isPending: isGameplayLoading } = useGameplayProfile();

  const tierMeta = getTierMeta(tier || 1);

  const healthScore = healthData?.score ?? 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await invalidateQueries.kycStatus();
    await invalidateQueries.gameplay();
    await invalidateQueries.ai();
    setRefreshing(false);
  }, []);

  const handleInvite = useCallback(async () => {
    impact();
    playUISound('buttonClick');
    try {
      await Share.share({
        message: `Join me on Rail Money! Use my RailTag @${user?.railTag || 'rail'} to sign up and send me money instantly.`,
      });
    } catch {}
  }, [user?.railTag, impact]);

  return (
    <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-2 pt-1">
        <Pressable
          onPress={() => {
            router.back();
          }}
          className="size-11 items-center justify-center rounded-full bg-stone-surface active:opacity-70"
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close">
          <HugeiconsIcon icon={Cancel01Icon} size={20} color="#343433" />
        </Pressable>
        <View className="size-11" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
        }>
        {/* Profile summary card */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <ProfileScreenHeader />
        </Animated.View>

        {/* Financial health lever */}
        <View className="mb-4 px-4">
          <View className="overflow-hidden rounded-2xl bg-white px-5 py-4 shadow-subtle">
            <Text className="mb-3 font-caption text-caption uppercase text-text-secondary">
              Financial Health
            </Text>
            <View className="items-center">
              <HealthScoreLever score={healthScore} isLoading={isHealthLoading} height={120} />
            </View>
          </View>
        </View>

        {/* KYC Tier card — dark shell hero (the one dark punch), tier color as accent */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} className="mt-7">
          <Pressable
            onPress={() => {
              impact();
              playUISound('buttonClick');
              router.push('/account-level' as never);
            }}
            className="overflow-hidden rounded-3xl bg-midnight px-5 py-5 active:opacity-90">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <View className="flex-row items-center gap-2">
                  <View
                    className="size-2 rounded-full"
                    style={{ backgroundColor: tierMeta.color }}
                  />
                  <Text
                    className="font-body-medium text-[13px] text-white/70"
                    maxFontSizeMultiplier={1.3}>
                    Account level
                  </Text>
                </View>
                <Text
                  className="mt-2 font-display text-[26px] text-white"
                  maxFontSizeMultiplier={1.2}>
                  {tierMeta.name}
                </Text>
                <Text
                  className="mt-1 font-body text-[13px] text-white/70"
                  maxFontSizeMultiplier={1.3}>
                  {tierMeta.tagline}
                </Text>
              </View>
              <View
                className="size-11 items-center justify-center rounded-full"
                style={{ backgroundColor: `${tierMeta.color}33` }}>
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={22} color={tierMeta.color} />
              </View>
            </View>
            {/* Progress dots for the 3 tiers */}
            <View className="mt-4 flex-row gap-2">
              {[1, 2, 3].map((t) => (
                <View
                  key={t}
                  className="h-1.5 flex-1 rounded-full"
                  style={{
                    backgroundColor: t <= (tier || 1) ? tierMeta.color : 'rgba(255,255,255,0.22)',
                  }}
                />
              ))}
            </View>
          </Pressable>
        </Animated.View>

        {/* Leaderboard + Points cards */}
        <Animated.View
          entering={FadeInDown.delay(160).duration(400)}
          className="mt-5 flex-row gap-3">
          <LeaderboardCard
            rank={undefined}
            totalUsers={undefined}
            percentile={undefined}
            isLoading={false}
            onPress={() => {
              showInfo('Coming Soon', 'Leaderboard will be available in a future update.');
            }}
          />
          <PointsCard
            points={gameplayProfile?.total_xp}
            level={gameplayProfile?.level}
            levelTitle={gameplayProfile?.level_title}
            progressPct={gameplayProfile?.xp_progress_pct}
            isLoading={isGameplayLoading}
            onPress={() => router.push('/gameplay' as never)}
          />
        </Animated.View>

        {/* Account rows — grouped white card */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)} className="mt-7">
          <SettingsSection title="Account">
            <ListItem
              icon={UserIcon}
              iconTile
              label="My account"
              subtitle="Update your personal details"
              onPress={() => router.push('/profile-edit' as never)}
              rightElement={chevron}
            />
            <ListItem
              icon={ShieldKeyIcon}
              iconTile
              label="Identity Verification"
              subtitle={`${tierMeta.name} · manage your account level`}
              onPress={() => router.push('/account-level' as never)}
              rightElement={chevron}
            />
            {!user?.railTag && (
              <ListItem
                icon={UserIcon}
                iconTile
                label="Create RailTag"
                subtitle="Claim your unique handle for sending and receiving"
                onPress={() => router.push('/(auth)/complete-profile/create-railtag' as never)}
                rightElement={chevron}
              />
            )}
            <ListItem
              icon={UserGroupIcon}
              iconTile
              label="Invite a friend"
              subtitle="Share Rail with people you know"
              onPress={handleInvite}
              rightElement={chevron}
              showDivider={false}
            />
          </SettingsSection>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
