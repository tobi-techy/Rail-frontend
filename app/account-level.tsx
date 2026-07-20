import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui';
import { TierUpgradeSheet } from '@/components/sheets';
import { useKYCStatus, useTierCapabilities } from '@/api/hooks';
import { invalidateQueries } from '@/api/queryClient';
import { TIER_META, type TierMetaEntry } from '@/api/types/kyc';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import gleap from '@/utils/gleap';
import {
  ArrowLeft01Icon,
  HelpCircleIcon,
  CheckmarkCircle01Icon,
  LockIcon,
  IconComponent as HugeiconsIcon,
} from '@/lib/icons';

type TierState = 'unlocked' | 'current' | 'locked';

function Bullet({ text, color, state }: { text: string; color: string; state: TierState }) {
  return (
    <View className="mb-2.5 flex-row items-start gap-2.5">
      {state === 'locked' ? (
        <View className="mt-[7px] size-1.5 rounded-full bg-fog" />
      ) : (
        <View className="mt-0.5">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} color={color} />
        </View>
      )}
      <Text
        className={`flex-1 font-body text-[14px] leading-[20px] ${
          state === 'locked' ? 'text-ash' : 'text-graphite'
        }`}>
        {text}
      </Text>
    </View>
  );
}

function TierCard({
  meta,
  state,
  nextStepLabel,
  index,
}: {
  meta: TierMetaEntry;
  state: TierState;
  nextStepLabel?: string;
  index: number;
}) {
  const isCurrent = state === 'current';
  const isLocked = state === 'locked';

  const surface = isCurrent ? `${meta.color}12` : isLocked ? '#f5f5f5' : '#ffffff';
  const chipBg = isLocked ? '#e4e4e4' : isCurrent ? meta.color : `${meta.color}1A`;
  const chipIconColor = isCurrent ? '#ffffff' : isLocked ? '#848281' : meta.color;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 70).duration(380)}
      className="mb-4 rounded-3xl px-6 py-6"
      style={{
        backgroundColor: surface,
        borderWidth: isLocked ? 0 : 1,
        borderColor: isCurrent ? meta.color : '#f2f2f2',
      }}>
      <View className="mb-4 flex-row items-center justify-between">
        <View
          className="size-11 items-center justify-center rounded-full"
          style={{ backgroundColor: chipBg }}>
          <HugeiconsIcon
            icon={isLocked ? LockIcon : CheckmarkCircle01Icon}
            size={20}
            color={chipIconColor}
          />
        </View>
        {isCurrent ? (
          <View
            className="flex-row items-center gap-1.5 rounded-full border bg-warm-canvas px-3 py-1"
            style={{ borderColor: meta.color }}>
            <View className="size-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
            <Text
              className="font-body-medium text-[12px] text-charcoal-primary"
              maxFontSizeMultiplier={1.2}>
              Current level
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        className="font-display text-[30px] leading-[34px] text-charcoal-primary"
        maxFontSizeMultiplier={1.2}>
        {meta.name}
      </Text>
      <Text className="mt-1 font-body text-[14px] text-ash" maxFontSizeMultiplier={1.3}>
        {isLocked ? (nextStepLabel ?? meta.tagline) : meta.tagline}
      </Text>

      <View className="mt-4">
        {meta.unlocks.map((u) => (
          <Bullet key={u} text={u} color={meta.color} state={state} />
        ))}
      </View>
    </Animated.View>
  );
}

export default function AccountLevelScreen() {
  const insets = useSafeAreaInsets();
  const { impact } = useHaptics();
  const [refreshing, setRefreshing] = useState(false);
  const [showTierSheet, setShowTierSheet] = useState(false);
  const [tierSheetMode, setTierSheetMode] = useState<'sprout' | 'bloom'>('sprout');

  const { data: kycStatus } = useKYCStatus();
  const { capabilities, tier, refetch } = useTierCapabilities();

  const currentTier = capabilities.tier || tier || 1;

  // The single next rung: NGN (Tier 2) before advanced (Tier 3).
  const nextTier = useMemo(() => {
    if (!capabilities.can_receive_ngn) return 2;
    if (!capabilities.can_use_card) return 3;
    return null;
  }, [capabilities]);

  const nextStepLabelFor = (t: number): string | undefined => {
    if (t === 2) return 'Verify your BVN & NIN to unlock';
    if (t === 3) return 'Complete identity verification to unlock';
    return undefined;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), invalidateQueries.virtualAccount()]);
    setRefreshing(false);
  };

  const handleCta = () => {
    impact();
    playUISound('buttonClick');
    if (nextTier === 2) {
      setTierSheetMode('sprout');
      setShowTierSheet(true);
    } else if (nextTier === 3) {
      setTierSheetMode('bloom');
      setShowTierSheet(true);
    }
  };

  const ctaLabel =
    nextTier === 2
      ? 'Verify BVN & NIN'
      : nextTier === 3
        ? 'Verify my identity'
        : 'You’re fully verified';

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
          accessibilityLabel="Go back">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#343433" />
        </Pressable>
        <Text
          className="font-subtitle text-[17px] text-charcoal-primary"
          maxFontSizeMultiplier={1.3}>
          Account Level
        </Text>
        <Pressable
          onPress={() => {
            impact();
            playUISound('buttonClick');
            gleap.open();
          }}
          className="size-11 items-center justify-center rounded-full bg-stone-surface active:opacity-70"
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Get help">
          <HugeiconsIcon icon={HelpCircleIcon} size={20} color="#0090ff" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
        }>
        {TIER_META.map((meta, i) => {
          const state: TierState =
            meta.tier === currentTier ? 'current' : meta.tier < currentTier ? 'unlocked' : 'locked';
          return (
            <TierCard
              key={meta.key}
              meta={meta}
              state={state}
              nextStepLabel={nextStepLabelFor(meta.tier)}
              index={i}
            />
          );
        })}
      </ScrollView>

      {nextTier ? (
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-stone-surface bg-warm-canvas px-4 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <Button title={ctaLabel} onPress={handleCta} variant="black" />
        </View>
      ) : null}

      <TierUpgradeSheet
        visible={showTierSheet}
        onClose={() => setShowTierSheet(false)}
        onUpgraded={(newTier) => {
          setShowTierSheet(false);
          void refetch();
        }}
        mode={tierSheetMode}
      />
    </SafeAreaView>
  );
}
