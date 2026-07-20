import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { GorhomBottomSheet } from '@/components/sheets';
import { SegmentedSlider } from '@/components/molecules';
import { ScreenHeader, ReviewCard } from '@/components/withdraw/shared';
import { Button, Input } from '@/components/ui';
import {
  useClearSpendingCommitment,
  useSetSpendingCommitment,
  useSpendingCommitment,
} from '@/api/hooks';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import * as Haptics from '@/utils/platformHaptics';

const SLIDER_MIN_DOLLARS = 50;
const SLIDER_MAX_DOLLARS = 5000;
const SLIDER_STEP_DOLLARS = 50;
const CUSTOM_MAX_DOLLARS = 100_000;
const DEFAULT_DOLLARS = 500;
const PRESETS = [200, 500, 1000, 2000];

const MONEY = { fontVariant: ['tabular-nums' as const] };

const dollarsFromCents = (cents: number) => cents / 100;

const formatUsd = (cents: number, withCents = true) =>
  `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: withCents ? 2 : 0,
    maximumFractionDigits: withCents ? 2 : 0,
  })}`;

/** Relative reset copy ("Resets in 5h") to sidestep the midnight-UTC timezone trap. */
function resetLabel(resetsAt?: string): string {
  if (!resetsAt) return 'Resets at midnight UTC';
  const ms = new Date(resetsAt).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return 'Resets shortly';
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `Resets in ${hours}h`;
  const minutes = Math.max(1, Math.floor(ms / 60_000));
  return `Resets in ${minutes}m`;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Cash-App-style quick amount chip with crisp press feedback. */
function PresetChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const { impact } = useHaptics();
  return (
    <AnimatedPressable
      style={style}
      onPressIn={() => {
        playUISound('buttonClick');
        impact(Haptics.ImpactFeedbackStyle.Light);
        scale.value = withTiming(0.96, { duration: 90 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 120 });
      }}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      className={`h-11 flex-1 items-center justify-center rounded-full border ${
        active ? 'border-midnight bg-midnight' : 'border-fog bg-transparent'
      }`}>
      <Text
        className={`font-button text-caption ${active ? 'text-white' : 'text-text-primary'}`}
        style={MONEY}
        maxFontSizeMultiplier={1.2}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

/** Progress fill that eases toward the current usage ratio (ink → coral over cap). */
function UsageBar({ pct }: { pct: number }) {
  const width = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    const target = Math.round(pct * 100);
    width.value = reduceMotion ? target : withTiming(target, { duration: 500 });
  }, [pct, reduceMotion, width]);
  const style = useAnimatedStyle(() => ({ width: `${width.value}%` }));
  const over = pct >= 1;
  return (
    <View className="h-2 w-full overflow-hidden rounded-full bg-stone-surface">
      <Animated.View
        className={`h-2 rounded-full ${over ? 'bg-coral-red' : 'bg-midnight'}`}
        style={style}
      />
    </View>
  );
}

type PendingFee = { kind: 'raise'; cents: number } | { kind: 'disable' } | null;

export default function DailySpendingLimitScreen() {
  const { showSuccess, showError } = useFeedbackPopup();
  const { data: status, isLoading } = useSpendingCommitment();
  const { mutateAsync: setLimit, isPending: isSaving } = useSetSpendingCommitment();
  const { mutateAsync: clearLimit, isPending: isClearing } = useClearSpendingCommitment();
  const reduceMotion = useReducedMotion();

  const [showEditor, setShowEditor] = useState(false);
  const [draftDollars, setDraftDollars] = useState(DEFAULT_DOLLARS);
  const [customInput, setCustomInput] = useState('');
  const [pendingFee, setPendingFee] = useState<PendingFee>(null);

  // Sync local editor state to the server truth once it loads.
  useEffect(() => {
    if (!status) return;
    setShowEditor(status.active);
    if (status.active) setDraftDollars(Math.round(dollarsFromCents(status.dailyLimitCents)));
  }, [status]);

  const currentCents = status?.active ? status.dailyLimitCents : null;
  const draftCents = Math.round(draftDollars * 100);
  const feeCents = status?.increaseFeeCents ?? 100;

  const isDirty = currentCents === null || draftCents !== currentCents;
  const willIncrease = currentCents !== null && draftCents > currentCents;

  const usagePct = useMemo(() => {
    if (!status?.active || status.dailyLimitCents <= 0) return 0;
    return Math.min(1, status.usedCents / status.dailyLimitCents);
  }, [status]);

  const applyCustom = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setCustomInput(cleaned);
    if (cleaned) {
      const n = Math.min(CUSTOM_MAX_DOLLARS, Math.max(1, parseInt(cleaned, 10)));
      setDraftDollars(n);
    }
  };

  const applyDraft = (dollars: number) => {
    setDraftDollars(dollars);
    setCustomInput('');
  };

  const onToggle = (next: boolean) => {
    playUISound('toggle');
    if (next) {
      // Turning on reveals the editor; nothing is charged until Save.
      setShowEditor(true);
      if (!status?.active) setDraftDollars(DEFAULT_DOLLARS);
    } else if (status?.active) {
      // Turning off is fee-gated exactly like an increase.
      setPendingFee({ kind: 'disable' });
    } else {
      setShowEditor(false);
    }
  };

  const persist = async (cents: number, confirmFee: boolean) => {
    const result = await setLimit({ cents, confirmFee });
    if (result.ok) {
      showSuccess('Daily limit updated', `Your daily limit is now ${formatUsd(cents, false)}.`);
      setPendingFee(null);
      return;
    }
    if ('needsFeeConfirm' in result) {
      setPendingFee({ kind: 'raise', cents });
      return;
    }
    if ('insufficientFunds' in result) {
      setPendingFee(null);
      showError(
        'Not enough balance',
        `You need at least ${formatUsd(feeCents)} in your spend balance to raise your limit.`
      );
      return;
    }
    showError('Invalid amount', 'Enter a daily limit greater than $0.');
  };

  const onSave = async () => {
    if (draftCents <= 0) {
      showError('Invalid amount', 'Enter a daily limit greater than $0.');
      return;
    }
    try {
      await persist(draftCents, false);
    } catch {
      showError('Something went wrong', 'We could not update your daily limit. Please try again.');
    }
  };

  const onConfirmFee = async () => {
    try {
      if (pendingFee?.kind === 'raise') {
        await persist(pendingFee.cents, true);
      } else if (pendingFee?.kind === 'disable') {
        const result = await clearLimit({ confirmFee: true });
        if (result.ok) {
          setPendingFee(null);
          setShowEditor(false);
          showSuccess('Daily limit off', 'Your daily spending limit has been turned off.');
        } else if ('insufficientFunds' in result) {
          setPendingFee(null);
          showError(
            'Not enough balance',
            `You need at least ${formatUsd(feeCents)} in your spend balance to do this.`
          );
        }
      }
    } catch {
      showError('Something went wrong', 'Please try again.');
    }
  };

  const busy = isSaving || isClearing;
  const enter = useCallback(
    (delay: number) => (reduceMotion ? undefined : FadeInUp.delay(delay).duration(320)),
    [reduceMotion]
  );

  return (
    <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top']}>
      <ScreenHeader title="Daily limit" />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#343433" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Hero — the number is the subject, Cash App style. */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInDown.duration(360)}
            className="items-center pb-6 pt-4">
            <Text
              className="font-mono-semibold text-[64px] leading-[68px] text-text-primary"
              style={{ ...MONEY, letterSpacing: -2 }}
              maxFontSizeMultiplier={1.1}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {formatUsd(showEditor ? draftCents : (status?.dailyLimitCents ?? 0), false)}
            </Text>
            <Text
              className="mt-2 font-body text-body text-text-secondary"
              maxFontSizeMultiplier={1.3}>
              {status?.active || showEditor ? 'per day' : 'No daily limit set'}
            </Text>
          </Animated.View>

          {/* On / off */}
          <Animated.View entering={enter(60)}>
            <View className="mb-3 flex-row items-center justify-between rounded-3xl bg-surface px-5 py-4">
              <View className="flex-1 pr-3">
                <Text
                  className="font-subtitle text-body-lg text-text-primary"
                  maxFontSizeMultiplier={1.3}>
                  Daily spending limit
                </Text>
                <Text
                  className="mt-0.5 font-body text-caption text-text-secondary"
                  maxFontSizeMultiplier={1.4}>
                  Caps card, withdrawal and send outflow each day.
                </Text>
              </View>
              <Switch
                value={showEditor}
                onValueChange={onToggle}
                disabled={busy}
                trackColor={{ true: '#121212', false: '#e5e3e0' }}
                ios_backgroundColor="#e5e3e0"
              />
            </View>
          </Animated.View>

          {/* Today's usage */}
          {status?.active && (
            <Animated.View entering={enter(120)}>
              <ReviewCard title="Today">
                <View className="px-5 py-4">
                  <View className="mb-3 flex-row items-baseline justify-between">
                    <Text
                      className="font-body text-caption text-text-secondary"
                      maxFontSizeMultiplier={1.4}>
                      Spent
                    </Text>
                    <Text
                      className="font-numeric text-body-lg text-text-primary"
                      style={MONEY}
                      maxFontSizeMultiplier={1.3}>
                      {formatUsd(status.usedCents)}
                      <Text className="font-body text-caption text-text-tertiary">
                        {'  '}of {formatUsd(status.dailyLimitCents, false)}
                      </Text>
                    </Text>
                  </View>
                  <UsageBar pct={usagePct} />
                  <Text
                    className="mt-3 font-body text-caption text-text-tertiary"
                    maxFontSizeMultiplier={1.4}>
                    {formatUsd(status.remainingCents)} left · {resetLabel(status.resetsAt)}
                  </Text>
                </View>
              </ReviewCard>
            </Animated.View>
          )}

          {/* Editor */}
          {showEditor && (
            <Animated.View entering={enter(status?.active ? 180 : 120)}>
              <ReviewCard title="Set your limit">
                <View className="px-5 py-5">
                  <View className="flex-row gap-2">
                    {PRESETS.map((p) => (
                      <PresetChip
                        key={p}
                        label={`$${p.toLocaleString('en-US')}`}
                        active={!customInput && draftDollars === p}
                        onPress={() => applyDraft(p)}
                      />
                    ))}
                  </View>

                  <View className="mt-5">
                    <SegmentedSlider
                      value={Math.min(
                        SLIDER_MAX_DOLLARS,
                        Math.max(SLIDER_MIN_DOLLARS, draftDollars)
                      )}
                      onValueChange={applyDraft}
                      min={SLIDER_MIN_DOLLARS}
                      max={SLIDER_MAX_DOLLARS}
                      step={SLIDER_STEP_DOLLARS}
                      segments={40}
                      showPercentage={false}
                      activeColor="#121212"
                      inactiveColor="#e5e3e0"
                    />
                  </View>

                  <View className="mt-5">
                    <Input
                      label="Custom amount (USD)"
                      value={customInput}
                      onChangeText={applyCustom}
                      keyboardType="number-pad"
                      placeholder="Enter an amount"
                    />
                  </View>

                  {status?.active && status.increaseCount > 0 && (
                    <Text
                      className="mt-3 font-body text-caption text-text-tertiary"
                      maxFontSizeMultiplier={1.4}>
                      You&apos;ve raised this {status.increaseCount}{' '}
                      {status.increaseCount === 1 ? 'time' : 'times'}.
                    </Text>
                  )}
                </View>
              </ReviewCard>

              {willIncrease ? (
                <Animated.Text
                  entering={reduceMotion ? undefined : FadeIn.duration(200)}
                  className="mb-3 ml-1 font-body text-caption text-coral-red"
                  maxFontSizeMultiplier={1.4}>
                  Raising your limit costs {formatUsd(feeCents)}. Lowering it is always free.
                </Animated.Text>
              ) : (
                <Text
                  className="mb-3 ml-1 font-body text-caption text-text-tertiary"
                  maxFontSizeMultiplier={1.4}>
                  You set this guardrail. Lowering it is free and instant.
                </Text>
              )}

              <Button
                title={willIncrease ? 'Raise limit' : 'Save limit'}
                variant="black"
                onPress={onSave}
                loading={busy}
                disabled={busy || !isDirty}
                flex
              />
            </Animated.View>
          )}
        </ScrollView>
      )}

      {/* Fee confirmation — reads like a small receipt so the cost is unambiguous. */}
      <GorhomBottomSheet visible={pendingFee !== null} onClose={() => setPendingFee(null)}>
        <Text
          className="mb-1 font-heading text-headline-2 text-text-primary"
          maxFontSizeMultiplier={1.3}>
          {pendingFee?.kind === 'disable' ? 'Turn off daily limit?' : 'Raise your daily limit?'}
        </Text>
        <Text
          className="mb-5 font-body text-body leading-6 text-text-secondary"
          maxFontSizeMultiplier={1.4}>
          {pendingFee?.kind === 'disable'
            ? 'You set this guardrail to protect yourself. Turning it off has a small fee.'
            : 'You set this guardrail to protect yourself. Loosening it has a small fee.'}
        </Text>

        <View className="mb-6 overflow-hidden rounded-3xl bg-surface">
          {pendingFee?.kind === 'raise' && (
            <>
              <View className="flex-row items-center justify-between px-5 py-4">
                <Text
                  className="font-body text-body text-text-secondary"
                  maxFontSizeMultiplier={1.4}>
                  New daily limit
                </Text>
                <Text
                  className="font-numeric text-body text-text-primary"
                  style={MONEY}
                  maxFontSizeMultiplier={1.3}>
                  {formatUsd(pendingFee.cents, false)}
                </Text>
              </View>
              <View className="mx-5 h-px bg-stone-surface" />
            </>
          )}
          <View className="flex-row items-center justify-between px-5 py-4">
            <Text className="font-body text-body text-text-secondary" maxFontSizeMultiplier={1.4}>
              Fee
            </Text>
            <Text
              className="font-numeric text-body text-text-primary"
              style={MONEY}
              maxFontSizeMultiplier={1.3}>
              {formatUsd(feeCents)}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => setPendingFee(null)}
            disabled={busy}
            flex
          />
          <Button
            title={pendingFee?.kind === 'disable' ? 'Turn off' : 'Pay & raise'}
            variant="black"
            onPress={onConfirmFee}
            loading={busy}
            disabled={busy}
            flex
          />
        </View>
      </GorhomBottomSheet>
    </SafeAreaView>
  );
}
