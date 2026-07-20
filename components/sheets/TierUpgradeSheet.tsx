import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  NavigableBottomSheet,
  type BottomSheetScreen,
  useNavigableBottomSheet,
} from './NavigableBottomSheet';
import { InputField } from '@/components/atoms/InputField';
import { Button } from '@/components/ui';
import { useTierCapabilities } from '@/api/hooks';
import { TIER_META, type TierMetaEntry } from '@/api/types/kyc';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import { NgnIcon } from '@/assets/svg';
import {
  ShieldKeyIcon,
  ZapIcon,
  Building04Icon,
  CheckmarkCircle01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Alert02Icon,
  Camera01Icon,
  File01Icon,
  LockIcon,
  IconComponent as HugeiconsIcon,
} from '@/lib/icons';

// ── Types ───────────────────────────────────────────────────────

type TierMode = 'overview' | 'sprout' | 'bloom';

interface TierUpgradeSheetProps {
  visible: boolean;
  onClose: () => void;
  onUpgraded: (tier: number) => void;
  mode: TierMode;
}

type TierState = 'unlocked' | 'current' | 'locked';

const digitsOnly = (v: string) => v.replace(/\D/g, '');

// ── Overview tier card (reused from account-level.tsx pattern) ──

function OverviewBullet({ text, color, state }: { text: string; color: string; state: TierState }) {
  return (
    <View className="mb-1.5 flex-row items-start gap-2">
      {state === 'locked' ? (
        <View className="mt-[7px] size-1.5 rounded-full bg-fog" />
      ) : (
        <View className="mt-0.5">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} color={color} />
        </View>
      )}
      <Text
        className={`flex-1 font-body text-[12px] leading-[17px] ${
          state === 'locked' ? 'text-ash' : 'text-graphite'
        }`}>
        {text}
      </Text>
    </View>
  );
}

function OverviewTierCard({
  meta,
  state,
  onPress,
}: {
  meta: TierMetaEntry;
  state: TierState;
  onPress?: () => void;
}) {
  const isCurrent = state === 'current';
  const isLocked = state === 'locked';
  const isNext = state === 'locked'; // the first locked tier is the "next" one

  const surface = isCurrent ? `${meta.color}12` : isLocked ? '#f5f5f5' : '#ffffff';
  const chipBg = isLocked ? '#e4e4e4' : isCurrent ? meta.color : `${meta.color}1A`;
  const chipIconColor = isCurrent ? '#ffffff' : isLocked ? '#848281' : meta.color;

  return (
    <Animated.View
      entering={FadeInDown.delay(meta.tier * 60).duration(380)}
      className="mb-3 rounded-2xl px-5 py-4"
      style={{
        backgroundColor: surface,
        borderWidth: isCurrent ? 1 : 0,
        borderColor: isCurrent ? meta.color : 'transparent',
      }}>
      <View className="mb-3 flex-row items-center justify-between">
        <View
          className="size-9 items-center justify-center rounded-full"
          style={{ backgroundColor: chipBg }}>
          <HugeiconsIcon
            icon={isLocked ? LockIcon : CheckmarkCircle01Icon}
            size={18}
            color={chipIconColor}
          />
        </View>
        {isCurrent ? (
          <View
            className="flex-row items-center gap-1 rounded-full border px-2.5 py-0.5"
            style={{ borderColor: meta.color, backgroundColor: '#fff' }}>
            <View className="size-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
            <Text className="font-body-medium text-[11px] text-charcoal-primary">Current</Text>
          </View>
        ) : isNext ? (
          <View className="flex-row items-center gap-1 rounded-full border border-stone-200 bg-white px-2.5 py-0.5">
            <Text className="font-body-medium text-[11px] text-ash">Next</Text>
          </View>
        ) : null}
      </View>

      <Text className="font-subtitle text-[17px] text-charcoal-primary">{meta.name}</Text>
      <Text className="mt-0.5 font-body text-[12px] text-ash">{meta.tagline}</Text>

      <View className="mt-2.5">
        {meta.unlocks.map((u) => (
          <OverviewBullet key={u} text={u} color={meta.color} state={state} />
        ))}
      </View>

      {isNext && onPress ? (
        <Button title={`Upgrade to ${meta.name}`} onPress={onPress} variant="black" size="small" />
      ) : null}
    </Animated.View>
  );
}

// ── Sprout features (for intro step) ───────────────────────────

const SPROUT_FEATURES = [
  {
    icon: <HugeiconsIcon icon={Building04Icon} size={20} color="#0090ff" />,
    bg: '#EFF6FF',
    title: 'Your own Naira account',
    desc: 'A named account number anyone can transfer Naira into.',
  },
  {
    icon: <HugeiconsIcon icon={ZapIcon} size={20} color="#d48f00" />,
    bg: '#FFFBEB',
    title: 'Higher limits',
    desc: 'Deposit and withdraw more Naira with verified identity.',
  },
  {
    icon: <HugeiconsIcon icon={ShieldKeyIcon} size={20} color="#00ca48" />,
    bg: '#f0fdf4',
    title: 'Bank-grade security',
    desc: 'Your BVN and ID are verified once and never stored on your device.',
  },
] as const;

const BLOOM_FEATURES = [
  {
    icon: <HugeiconsIcon icon={ZapIcon} size={20} color="#0090ff" />,
    bg: '#EFF6FF',
    title: 'USD & EUR accounts',
    desc: 'Receive dollars and euros with named virtual accounts.',
  },
  {
    icon: <HugeiconsIcon icon={Building04Icon} size={20} color="#d48f00" />,
    bg: '#FFFBEB',
    title: 'Unlimited limits',
    desc: 'No cap on deposits or withdrawals.',
  },
  {
    icon: <HugeiconsIcon icon={ShieldKeyIcon} size={20} color="#00ca48" />,
    bg: '#f0fdf4',
    title: 'Investing access',
    desc: 'Buy stocks, ETFs, and tokenized assets.',
  },
] as const;

// ── Sheet ───────────────────────────────────────────────────────

export function TierUpgradeSheet({ visible, onClose, onUpgraded, mode }: TierUpgradeSheetProps) {
  const { height: screenHeight } = useWindowDimensions();
  const contentMaxHeight = Math.max(300, Math.min(500, screenHeight * 0.6));
  const { impact, notification } = useHaptics();
  const { capabilities, tier } = useTierCapabilities();

  const currentTier = capabilities.tier || tier || 1;

  const [step, setStep] = useState<string>(
    mode === 'overview' ? 'overview' : mode === 'sprout' ? 'sprout-intro' : 'bloom-intro'
  );
  const [formError, setFormError] = useState<string | null>(null);

  // Sprout form state
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [bvn, setBvn] = useState('');

  // Bloom form state
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [occupation, setOccupation] = useState('');
  const [sourceOfFunds, setSourceOfFunds] = useState('');
  const [expectedMonthlyVolume, setExpectedMonthlyVolume] = useState('');
  const [accountPurpose, setAccountPurpose] = useState('');

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialScreenId = useMemo(() => {
    if (mode === 'overview') return 'overview';
    if (mode === 'sprout') return 'sprout-intro';
    return 'bloom-intro';
  }, [mode]);

  const navigation = useNavigableBottomSheet(initialScreenId);
  const { reset: resetNavigation, navigateTo } = navigation;
  const wasVisibleRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      wasVisibleRef.current = false;
      resetNavigation(initialScreenId);
      setStep(initialScreenId);
      setFormError(null);
      setIsSubmitting(false);
      setPhone('');
      setDob('');
      setBvn('');
      setEmploymentStatus('');
      setOccupation('');
      setSourceOfFunds('');
      setExpectedMonthlyVolume('');
      setAccountPurpose('');
      return;
    }
    if (!wasVisibleRef.current) {
      wasVisibleRef.current = true;
      resetNavigation(initialScreenId);
      setStep(initialScreenId);
    }
  }, [visible, resetNavigation, initialScreenId]);

  // ── Form validation ─────────────────────────────────────────

  const phoneValid = useMemo(() => phone.replace(/\D/g, '').length >= 10, [phone]);
  const dobValid = useMemo(() => /^\d{4}-\d{2}-\d{2}$/.test(dob), [dob]);
  const bvnValid = useMemo(() => /^\d{11}$/.test(bvn), [bvn]);
  const sproutCanSubmit = useMemo(
    () => phoneValid && dobValid && bvnValid && !isSubmitting,
    [phoneValid, dobValid, bvnValid, isSubmitting]
  );

  const bloomCanSubmit = useMemo(
    () =>
      employmentStatus.trim() !== '' &&
      occupation.trim() !== '' &&
      sourceOfFunds.trim() !== '' &&
      expectedMonthlyVolume.trim() !== '' &&
      accountPurpose.trim() !== '' &&
      !isSubmitting,
    [
      employmentStatus,
      occupation,
      sourceOfFunds,
      expectedMonthlyVolume,
      accountPurpose,
      isSubmitting,
    ]
  );

  // ── Sprout submit ───────────────────────────────────────────

  const handleSproutSubmit = useCallback(async () => {
    if (!sproutCanSubmit) {
      setFormError('Fill in all fields to continue.');
      return;
    }
    setFormError(null);
    impact();
    playUISound('buttonClick');
    setIsSubmitting(true);

    try {
      const sessionRes = await fetch('/api/v1/kyc/didit/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const sessionData = await sessionRes.json();

      if (!sessionRes.ok || !sessionData.session_id) {
        throw new Error(sessionData.error || 'Failed to start identity verification');
      }

      setStep('sprout-didit');
      setIsSubmitting(false);

      // TODO: Launch Didit SDK with sessionData.session_token
      await completeSproutUpgrade(sessionData.session_id);
    } catch (error) {
      const err = error as { error?: string; message?: string };
      notification('error');
      setFormError(err?.message || 'Something went wrong. Please try again.');
      setStep('sprout-error');
      setIsSubmitting(false);
    }
  }, [sproutCanSubmit, phone, dob, bvn, impact, notification]);

  const completeSproutUpgrade = useCallback(
    async (diditSessionId: string) => {
      setIsSubmitting(true);
      try {
        const res = await fetch('/api/v1/kyc/sprout/upgrade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: phone.replace(/\D/g, ''),
            date_of_birth: dob,
            bvn,
            didit_session_id: diditSessionId,
          }),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Sprout upgrade failed');

        notification('success');
        playUISound('transactionSuccess');
        setStep('sprout-complete');
        setIsSubmitting(false);
        onUpgraded(data.kyc_tier || 2);
      } catch (error) {
        const err = error as { error?: string; message?: string };
        notification('error');
        setFormError(err?.message || 'Upgrade failed. Please try again.');
        setStep('sprout-error');
        setIsSubmitting(false);
      }
    },
    [phone, dob, bvn, notification, onUpgraded]
  );

  // ── Bloom submit ────────────────────────────────────────────

  const handleBloomSubmit = useCallback(async () => {
    if (!bloomCanSubmit) {
      setFormError('Fill in all fields to continue.');
      return;
    }
    setFormError(null);
    impact();
    playUISound('buttonClick');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/v1/kyc/bloom/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employment_status: employmentStatus,
          occupation,
          source_of_funds: sourceOfFunds,
          expected_monthly_volume: expectedMonthlyVolume,
          account_purpose: accountPurpose,
          proof_of_address_url: '',
          proof_of_address_type: 'utility_bill',
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Bloom upgrade failed');

      notification('success');
      playUISound('transactionSuccess');
      setStep('bloom-complete');
      setIsSubmitting(false);
      onUpgraded(data.kyc_tier || 3);
    } catch (error) {
      const err = error as { error?: string; message?: string };
      notification('error');
      setFormError(err?.message || 'Upgrade failed. Please try again.');
      setStep('bloom-error');
      setIsSubmitting(false);
    }
  }, [
    bloomCanSubmit,
    employmentStatus,
    occupation,
    sourceOfFunds,
    expectedMonthlyVolume,
    accountPurpose,
    impact,
    notification,
    onUpgraded,
  ]);

  // ── Navigate from overview to upgrade flow ──────────────────

  const navigateToSprout = useCallback(() => {
    impact();
    playUISound('buttonClick');
    setStep('sprout-intro');
    navigateTo('sprout-intro');
  }, [impact, navigateTo]);

  const navigateToBloom = useCallback(() => {
    impact();
    playUISound('buttonClick');
    setStep('bloom-intro');
    navigateTo('bloom-intro');
  }, [impact, navigateTo]);

  // ── Determine next tier for overview ────────────────────────

  const nextTier = useMemo(() => {
    if (!capabilities.can_receive_ngn) return 2;
    if (!capabilities.can_use_card) return 3;
    return null;
  }, [capabilities]);

  // ── All screens ─────────────────────────────────────────────

  const screens: BottomSheetScreen[] = useMemo(() => {
    const all: BottomSheetScreen[] = [];

    // Overview screen (only in overview mode)
    if (mode === 'overview') {
      all.push({
        id: 'overview',
        title: '',
        component: (
          <ScrollView style={{ maxHeight: contentMaxHeight }} showsVerticalScrollIndicator={false}>
            <View className="mb-4 mt-1">
              <Text className="text-center font-display text-[24px] leading-7 text-charcoal-primary">
                Your journey
              </Text>
              <Text className="mt-1.5 text-center font-body text-[14px] leading-5 text-ash">
                Complete each tier to unlock more features.
              </Text>
            </View>

            {TIER_META.map((meta) => {
              const state: TierState =
                meta.tier === currentTier
                  ? 'current'
                  : meta.tier < currentTier
                    ? 'unlocked'
                    : 'locked';
              return (
                <OverviewTierCard
                  key={meta.key}
                  meta={meta}
                  state={state}
                  onPress={
                    meta.tier === 2 && state === 'locked'
                      ? navigateToSprout
                      : meta.tier === 3 && state === 'locked'
                        ? navigateToBloom
                        : undefined
                  }
                />
              );
            })}

            {!nextTier && (
              <View className="mt-2 items-center py-4">
                <Text className="font-body text-[13px] text-ash">
                  You have access to all features.
                </Text>
              </View>
            )}
          </ScrollView>
        ),
      });
    }

    // ── Sprout screens ────────────────────────────────────────

    all.push({
      id: 'sprout-intro',
      title: '',
      component: (
        <ScrollView style={{ maxHeight: contentMaxHeight }} showsVerticalScrollIndicator={false}>
          <View className="mb-5 mt-2 items-center">
            <View className="size-14 items-center justify-center overflow-hidden rounded-full">
              <NgnIcon width={56} height={56} />
            </View>
          </View>
          <Text className="mb-2 text-center font-subtitle text-[22px] leading-7 text-charcoal-primary">
            Get your Naira account
          </Text>
          <Text className="mb-7 text-center font-body text-[15px] leading-[22px] text-smoke">
            Verify your identity once to unlock a named Naira account. Takes under a minute.
          </Text>

          <View className="mb-6">
            {SPROUT_FEATURES.map((f, i) => (
              <Animated.View
                key={f.title}
                entering={FadeInDown.delay(i * 60 + 80).springify()}
                className="flex-row items-start gap-4"
                style={i < SPROUT_FEATURES.length - 1 ? { marginBottom: 16 } : undefined}>
                <View
                  className="h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: f.bg }}>
                  {f.icon}
                </View>
                <View className="flex-1">
                  <Text className="font-subtitle text-[15px] text-charcoal-primary">{f.title}</Text>
                  <Text className="mt-0.5 font-body text-[13px] leading-[19px] text-smoke">
                    {f.desc}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>

          <Button
            title="Continue"
            onPress={() => {
              impact();
              setStep('sprout-form');
              navigateTo('sprout-form');
            }}
            variant="black"
          />
        </ScrollView>
      ),
    });

    all.push({
      id: 'sprout-form',
      title: 'Your details',
      component: (
        <ScrollView style={{ maxHeight: contentMaxHeight }} showsVerticalScrollIndicator={false}>
          <View className="gap-4">
            <InputField
              label="Phone number"
              value={phone}
              onChangeText={(v) => {
                setPhone(v);
                if (formError) setFormError(null);
              }}
              keyboardType="phone-pad"
              placeholder="+234 ..."
            />
            <InputField
              label="Date of birth"
              value={dob}
              onChangeText={(v) => {
                setDob(v);
                if (formError) setFormError(null);
              }}
              placeholder="YYYY-MM-DD"
            />
            <InputField
              label="Bank Verification Number (BVN)"
              value={bvn}
              onChangeText={(v) => {
                setBvn(digitsOnly(v).slice(0, 11));
                if (formError) setFormError(null);
              }}
              keyboardType="number-pad"
              maxLength={11}
              placeholder="11 digits"
              secureTextEntry
              textContentType="none"
              helperText="Dial *565*0# on your registered line to retrieve it."
            />
          </View>

          {formError ? (
            <View className="mt-4 rounded-2xl bg-coral-red/10 px-4 py-3">
              <Text className="font-body text-[13px] text-coral-red">{formError}</Text>
            </View>
          ) : null}

          <View className="mt-6">
            <Button
              title={isSubmitting ? 'Verifying...' : 'Verify identity'}
              onPress={handleSproutSubmit}
              disabled={!sproutCanSubmit}
              loading={isSubmitting}
              variant="black"
            />
          </View>

          <Text className="mb-2 mt-4 text-center font-body text-[12px] text-smoke">
            Your BVN and ID are sent securely once and never stored on this device.
          </Text>
        </ScrollView>
      ),
    });

    all.push({
      id: 'sprout-didit',
      title: 'Identity check',
      component: (
        <ScrollView style={{ maxHeight: contentMaxHeight }} showsVerticalScrollIndicator={false}>
          <View className="items-center pb-4">
            <View className="mb-4 size-16 items-center justify-center rounded-full bg-amber-50">
              <HugeiconsIcon icon={Clock01Icon} size={30} color="#F59E0B" />
            </View>
            <Text className="text-center font-subtitle text-[22px] leading-7 text-charcoal-primary">
              Completing identity check
            </Text>
            <Text className="mt-2 text-center font-body text-[15px] leading-6 text-ash">
              Please complete the ID scan and liveness check in the verification window.
            </Text>
          </View>
          {isSubmitting && (
            <View className="items-center py-8">
              <Text className="font-body text-[14px] text-smoke">Processing...</Text>
            </View>
          )}
        </ScrollView>
      ),
    });

    all.push({
      id: 'sprout-complete',
      title: '',
      component: (
        <ScrollView style={{ maxHeight: contentMaxHeight }} showsVerticalScrollIndicator={false}>
          <View className="items-center pb-4">
            <View className="mb-4 size-16 items-center justify-center rounded-full bg-emerald-50">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={30} color="#00ca48" />
            </View>
            <Text className="text-center font-subtitle text-[22px] leading-7 text-charcoal-primary">
              You&apos;re all set!
            </Text>
            <Text className="mt-2 text-center font-body text-[15px] leading-6 text-ash">
              Your Naira account is ready. You can now receive Naira transfers.
            </Text>
          </View>
          <Button title="Done" onPress={onClose} />
        </ScrollView>
      ),
    });

    all.push({
      id: 'sprout-error',
      title: '',
      component: (
        <ScrollView style={{ maxHeight: contentMaxHeight }} showsVerticalScrollIndicator={false}>
          <View className="items-center pb-4">
            <View className="mb-4 size-16 items-center justify-center rounded-full bg-red-50">
              <HugeiconsIcon icon={Alert02Icon} size={30} color="#ff2b3a" />
            </View>
            <Text className="text-center font-subtitle text-[22px] leading-7 text-charcoal-primary">
              Something went wrong
            </Text>
            {formError && (
              <Text className="mt-2 text-center font-body text-[15px] leading-6 text-ash">
                {formError}
              </Text>
            )}
          </View>
          <View className="flex-row gap-3">
            <Button
              title="Try again"
              onPress={() => {
                setFormError(null);
                setStep('sprout-form');
                navigateTo('sprout-form');
              }}
              flex
            />
            <Button title="Cancel" variant="white" onPress={onClose} flex />
          </View>
        </ScrollView>
      ),
    });

    // ── Bloom screens ─────────────────────────────────────────

    all.push({
      id: 'bloom-intro',
      title: '',
      component: (
        <ScrollView style={{ maxHeight: contentMaxHeight }} showsVerticalScrollIndicator={false}>
          <View className="mb-5 mt-2 items-center">
            <View className="size-14 items-center justify-center overflow-hidden rounded-full bg-blue-50">
              <HugeiconsIcon icon={Building04Icon} size={28} color="#0090ff" />
            </View>
          </View>
          <Text className="mb-2 text-center font-subtitle text-[22px] leading-7 text-charcoal-primary">
            Unlock Bloom
          </Text>
          <Text className="mb-7 text-center font-body text-[15px] leading-[22px] text-smoke">
            Complete a quick financial profile to unlock USD accounts, investing, and unlimited
            limits.
          </Text>

          <View className="mb-6">
            {BLOOM_FEATURES.map((f, i) => (
              <Animated.View
                key={f.title}
                entering={FadeInDown.delay(i * 60 + 80).springify()}
                className="flex-row items-start gap-4"
                style={i < BLOOM_FEATURES.length - 1 ? { marginBottom: 16 } : undefined}>
                <View
                  className="h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: f.bg }}>
                  {f.icon}
                </View>
                <View className="flex-1">
                  <Text className="font-subtitle text-[15px] text-charcoal-primary">{f.title}</Text>
                  <Text className="mt-0.5 font-body text-[13px] leading-[19px] text-smoke">
                    {f.desc}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>

          <Button
            title="Continue"
            onPress={() => {
              impact();
              setStep('bloom-financial');
              navigateTo('bloom-financial');
            }}
            variant="black"
          />
        </ScrollView>
      ),
    });

    all.push({
      id: 'bloom-financial',
      title: 'Financial profile',
      component: (
        <ScrollView style={{ maxHeight: contentMaxHeight }} showsVerticalScrollIndicator={false}>
          <View className="gap-4">
            <InputField
              label="Employment status"
              value={employmentStatus}
              onChangeText={(v) => {
                setEmploymentStatus(v);
                if (formError) setFormError(null);
              }}
              placeholder="e.g. Employed, Self-employed, Student"
            />
            <InputField
              label="Occupation"
              value={occupation}
              onChangeText={(v) => {
                setOccupation(v);
                if (formError) setFormError(null);
              }}
              placeholder="e.g. Software engineer"
            />
            <InputField
              label="Source of funds"
              value={sourceOfFunds}
              onChangeText={(v) => {
                setSourceOfFunds(v);
                if (formError) setFormError(null);
              }}
              placeholder="e.g. Salary, Business income"
            />
            <InputField
              label="Expected monthly volume (USD)"
              value={expectedMonthlyVolume}
              onChangeText={(v) => {
                setExpectedMonthlyVolume(v);
                if (formError) setFormError(null);
              }}
              placeholder="e.g. 5000"
              keyboardType="number-pad"
            />
            <InputField
              label="Account purpose"
              value={accountPurpose}
              onChangeText={(v) => {
                setAccountPurpose(v);
                if (formError) setFormError(null);
              }}
              placeholder="e.g. Savings, Business"
            />
          </View>

          {formError ? (
            <View className="mt-4 rounded-2xl bg-coral-red/10 px-4 py-3">
              <Text className="font-body text-[13px] text-coral-red">{formError}</Text>
            </View>
          ) : null}

          <View className="mt-6">
            <Button
              title={isSubmitting ? 'Submitting...' : 'Submit'}
              onPress={handleBloomSubmit}
              disabled={!bloomCanSubmit}
              loading={isSubmitting}
              variant="black"
            />
          </View>
        </ScrollView>
      ),
    });

    all.push({
      id: 'bloom-poa',
      title: 'Proof of address',
      component: (
        <ScrollView style={{ maxHeight: contentMaxHeight }} showsVerticalScrollIndicator={false}>
          <View className="items-center pb-4">
            <View className="mb-4 size-16 items-center justify-center rounded-full bg-blue-50">
              <HugeiconsIcon icon={File01Icon} size={30} color="#0090ff" />
            </View>
            <Text className="text-center font-subtitle text-[22px] leading-7 text-charcoal-primary">
              Upload proof of address
            </Text>
            <Text className="mt-2 text-center font-body text-[15px] leading-6 text-ash">
              Upload a utility bill, bank statement, or government letter dated within the last 3
              months.
            </Text>
          </View>

          <View className="mb-4 rounded-2xl border border-fog bg-warm-canvas p-4">
            <View className="flex-row items-center gap-3">
              <HugeiconsIcon icon={Camera01Icon} size={20} color="#343433" />
              <Text className="font-subtitle text-[14px] text-charcoal-primary">
                Take a photo or choose from gallery
              </Text>
            </View>
          </View>

          <Button title="Upload document" onPress={() => {}} variant="black" />
          <Button title="Skip for now" onPress={onClose} variant="white" />
        </ScrollView>
      ),
    });

    all.push({
      id: 'bloom-complete',
      title: '',
      component: (
        <ScrollView style={{ maxHeight: contentMaxHeight }} showsVerticalScrollIndicator={false}>
          <View className="items-center pb-4">
            <View className="mb-4 size-16 items-center justify-center rounded-full bg-emerald-50">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={30} color="#00ca48" />
            </View>
            <Text className="text-center font-subtitle text-[22px] leading-7 text-charcoal-primary">
              Bloom activated!
            </Text>
            <Text className="mt-2 text-center font-body text-[15px] leading-6 text-ash">
              You now have access to USD accounts, investing, and unlimited limits.
            </Text>
          </View>
          <Button title="Done" onPress={onClose} />
        </ScrollView>
      ),
    });

    all.push({
      id: 'bloom-error',
      title: '',
      component: (
        <ScrollView style={{ maxHeight: contentMaxHeight }} showsVerticalScrollIndicator={false}>
          <View className="items-center pb-4">
            <View className="mb-4 size-16 items-center justify-center rounded-full bg-red-50">
              <HugeiconsIcon icon={Alert02Icon} size={30} color="#ff2b3a" />
            </View>
            <Text className="text-center font-subtitle text-[22px] leading-7 text-charcoal-primary">
              Something went wrong
            </Text>
            {formError && (
              <Text className="mt-2 text-center font-body text-[15px] leading-6 text-ash">
                {formError}
              </Text>
            )}
          </View>
          <View className="flex-row gap-3">
            <Button
              title="Try again"
              onPress={() => {
                setFormError(null);
                setStep('bloom-financial');
                navigateTo('bloom-financial');
              }}
              flex
            />
            <Button title="Cancel" variant="white" onPress={onClose} flex />
          </View>
        </ScrollView>
      ),
    });

    return all;
  }, [
    mode,
    currentTier,
    nextTier,
    contentMaxHeight,
    step,
    formError,
    isSubmitting,
    phone,
    dob,
    bvn,
    employmentStatus,
    occupation,
    sourceOfFunds,
    expectedMonthlyVolume,
    accountPurpose,
    impact,
    notification,
    navigateToSprout,
    navigateToBloom,
    handleSproutSubmit,
    handleBloomSubmit,
    onClose,
    onUpgraded,
    sproutCanSubmit,
    bloomCanSubmit,
  ]);

  return (
    <NavigableBottomSheet
      visible={visible}
      onClose={onClose}
      navigation={navigation}
      screens={screens}
    />
  );
}
