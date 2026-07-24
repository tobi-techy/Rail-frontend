import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useKYCFlow } from '@/api/hooks/useKYCFlow';
import { kycService } from '@/api/services/kyc.service';
import { useAnalytics, ANALYTICS_EVENTS } from '@/utils/analytics';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import { ArrowLeft01Icon, CheckmarkCircle01Icon } from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';
import {
  KycFullPageLoading,
  KycSuccess,
  KycErrorBanner,
  KycWarningBanner,
  NgnProvisioning,
} from '@/components/kyc';
import type { TransformedApiError } from '@/api/types';

// ── Helpers ──────────────────────────────────────────────────────

const digitsOnly = (v: string) => v.replace(/\D/g, '');

type Step =
  | 'checking' // Initial: checking if we can skip
  | 'auto-provisioning' // Auto-provisioning NGN account
  | 'form' // Collecting phone / DOB / BVN
  | 'didit' // Didit SDK open
  | 'success' // All done
  | 'error'; // Something went wrong

// ── Screen ───────────────────────────────────────────────────────

export default function SproutUpgradeScreen() {
  const insets = useSafeAreaInsets();
  const { track } = useAnalytics();
  const { impact, notification } = useHaptics();

  // User profile (may have phone / DOB already)
  const user = useAuthStore((s) => s.user);
  const profilePhone = user?.phone ?? user?.phoneNumber ?? '';
  const profileDob = user?.dateOfBirth ?? '';

  // Consolidated KYC + NGN state
  const { kycStatus, canReceiveNgn, hasNgnAccount, isNgnLoading, autoProvisionNgn, refetchAll } =
    useKYCFlow(canReceiveNgn);

  const [step, setStep] = useState<Step>('checking');
  const [formError, setFormError] = useState<string | null>(null);
  const [autoProvisionError, setAutoProvisionError] = useState<string | null>(null);
  const [useExistingDidit, setUseExistingDidit] = useState(false);

  // Form state — pre-fill from profile
  const [phone, setPhone] = useState(profilePhone);
  const [dob, setDob] = useState(profileDob);
  const [bvn, setBvn] = useState('');

  // Derived
  const phoneValid = useMemo(() => digitsOnly(phone).length >= 10, [phone]);
  const dobValid = useMemo(() => /^\d{4}-\d{2}-\d{2}$/.test(dob), [dob]);
  const bvnValid = useMemo(() => /^\d{11}$/.test(bvn), [bvn]);
  const canSubmit = phoneValid && dobValid && bvnValid;

  // ── Smart skip ──────────────────────────────────────────────────
  // Already has NGN account → success.
  // Capability enabled but no account → auto-provision (zero user input).
  // BVN verified + Didit session exists → simplified BVN-only form.
  // Otherwise → full form.

  useEffect(() => {
    if (step !== 'checking') return;

    const timeout = setTimeout(() => setStep('form'), 10_000);

    if (!kycStatus) return () => clearTimeout(timeout);
    if (canReceiveNgn && isNgnLoading) return () => clearTimeout(timeout);

    // Already has an NGN account — nothing to do
    if (hasNgnAccount) {
      clearTimeout(timeout);
      setStep('success');
      return;
    }

    // Has NGN capability but no account — try auto-provision
    if (canReceiveNgn && !hasNgnAccount) {
      clearTimeout(timeout);
      setStep('auto-provisioning');
      autoProvisionNgn()
        .then(() => {
          notification('success');
          playUISound('transactionSuccess');
          track(ANALYTICS_EVENTS.KYC_VERIFICATION_COMPLETED, { tier: 2 });
          refetchAll();
          setStep('success');
        })
        .catch((err: Error) => {
          notification('error');
          if (kycStatus.bvn_verified && kycStatus.provider_reference) {
            setUseExistingDidit(true);
          }
          setAutoProvisionError(
            err.message || 'Unable to set up account automatically. Please fill in your details.'
          );
          setStep('form');
        });
      return;
    }

    // BVN verified + Didit session — simplified form
    if (kycStatus.bvn_verified && kycStatus.provider_reference) {
      clearTimeout(timeout);
      setUseExistingDidit(true);
      setStep('form');
      return;
    }

    clearTimeout(timeout);
    setStep('form');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kycStatus, isNgnLoading, hasNgnAccount, canReceiveNgn]);

  // ── Form submit ──────────────────────────────────────────────────

  const handleFormSubmit = useCallback(async () => {
    if (!canSubmit) {
      setFormError('Fill in all fields to continue.');
      return;
    }

    setFormError(null);
    impact();
    playUISound('buttonClick');

    try {
      let diditSessionId: string;

      if (useExistingDidit && kycStatus?.provider_reference) {
        diditSessionId = kycStatus.provider_reference;
      } else {
        setStep('didit');

        const sessionData = await kycService.startDiditSession({});
        if (!sessionData.session_id) {
          throw new Error('Failed to start identity verification');
        }

        const { startVerification, VerificationStatus } =
          await import('@didit-protocol/sdk-react-native');

        const token = sessionData.session_token;
        if (!token) throw new Error('No session token received from server');

        const result = await startVerification(token, { closeOnComplete: true });

        if (result.type === 'cancelled') {
          setStep('form');
          return;
        }

        if (result.type !== 'completed' || result.session.status !== VerificationStatus.Approved) {
          const msg =
            result.type === 'completed' && result.session.status === VerificationStatus.Declined
              ? 'Identity verification was not approved. Please try again.'
              : result.type === 'completed'
                ? 'Identity verification is still being reviewed. Check back shortly.'
                : result.error?.message || 'Verification failed. Please try again.';
          setFormError(msg);
          setStep('error');
          return;
        }

        diditSessionId = result.session.sessionId;
      }

      await kycService.sproutUpgrade({
        phone: digitsOnly(phone),
        date_of_birth: dob,
        bvn,
        didit_session_id: diditSessionId,
      });

      notification('success');
      playUISound('transactionSuccess');
      track(ANALYTICS_EVENTS.KYC_VERIFICATION_COMPLETED, { tier: 2 });
      refetchAll();
      setStep('success');
    } catch (error) {
      const apiError = error as TransformedApiError;
      notification('error');
      setFormError(apiError?.message || 'Something went wrong. Please try again.');
      setStep('error');
    }
  }, [
    canSubmit,
    phone,
    dob,
    bvn,
    useExistingDidit,
    kycStatus,
    impact,
    notification,
    track,
    refetchAll,
  ]);

  // ── Render ──────────────────────────────────────────────────────

  if (step === 'checking') {
    return (
      <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top', 'bottom']}>
        <KycFullPageLoading />
      </SafeAreaView>
    );
  }

  if (step === 'success') {
    return (
      <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top', 'bottom']}>
        <KycSuccess
          title="You're all set!"
          description="Your Naira account is being set up. You'll see your account details in a moment."
          actionLabel="Done"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  if (step === 'auto-provisioning') {
    return (
      <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top', 'bottom']}>
        <NgnProvisioning />
      </SafeAreaView>
    );
  }

  if (step === 'didit') {
    return (
      <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top', 'bottom']}>
        <KycFullPageLoading label="Completing identity check" />
      </SafeAreaView>
    );
  }

  // ── Form / Error states ────────────────────────────────────────

  const hasProfilePhone = !!profilePhone;
  const hasProfileDob = !!profileDob;

  return (
    <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top', 'bottom']}>
      <View className="flex-row items-center px-4 pb-2 pt-1">
        <Pressable
          onPress={() => router.back()}
          className="size-11 items-center justify-center"
          accessibilityRole="button">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#343433" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 32 }}>
        <Text
          className="font-display text-[23px] text-charcoal-primary"
          maxFontSizeMultiplier={1.3}>
          Get your Naira account
        </Text>
        <Text className="mt-2 font-body text-[15px] leading-6 text-ash" maxFontSizeMultiplier={1.4}>
          {useExistingDidit
            ? 'Your identity is already verified. Just enter your BVN to finish setup.'
            : hasProfilePhone && hasProfileDob
              ? 'Your phone and date of birth are on file. Just enter your BVN to finish verification.'
              : 'Enter your details to receive Naira transfers into a named account.'}
        </Text>

        {autoProvisionError && <KycWarningBanner message={autoProvisionError} />}

        {/* What you unlock */}
        <View className="mt-6 rounded-2xl border border-stone-surface bg-stone-surface p-4">
          <Text
            className="mb-2 font-subtitle text-[13px] text-graphite"
            maxFontSizeMultiplier={1.4}>
            What you unlock:
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {['Naira account', 'Higher limits', 'Instant transfers'].map((label) => (
              <View
                key={label}
                className="flex-row items-center gap-1.5 rounded-full border border-fog bg-parchment-card px-3 py-1.5">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} color="#00ca48" />
                <Text className="font-body text-[12px] text-graphite" maxFontSizeMultiplier={1.4}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Phone */}
        <Text
          className="mb-2 mt-8 font-subtitle text-[13px] uppercase tracking-wide text-smoke"
          maxFontSizeMultiplier={1.4}>
          Phone number
        </Text>
        {hasProfilePhone ? (
          <View className="rounded-2xl border border-fog bg-parchment-card px-4 py-3.5">
            <Text
              className="font-body text-[15px] text-charcoal-primary"
              maxFontSizeMultiplier={1.4}>
              {profilePhone}
            </Text>
            <Text className="mt-1 font-body text-[12px] text-ash" maxFontSizeMultiplier={1.4}>
              From your profile
            </Text>
          </View>
        ) : (
          <TextInput
            className="rounded-2xl border border-fog bg-white px-4 py-3.5 font-body text-[15px] text-charcoal-primary"
            placeholder="0801 234 5678"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(v) => setPhone(digitsOnly(v))}
            maxLength={14}
          />
        )}

        {/* Date of birth */}
        <Text
          className="mb-2 mt-6 font-subtitle text-[13px] uppercase tracking-wide text-smoke"
          maxFontSizeMultiplier={1.4}>
          Date of birth
        </Text>
        {hasProfileDob ? (
          <View className="rounded-2xl border border-fog bg-parchment-card px-4 py-3.5">
            <Text
              className="font-body text-[15px] text-charcoal-primary"
              maxFontSizeMultiplier={1.4}>
              {profileDob}
            </Text>
            <Text className="mt-1 font-body text-[12px] text-ash" maxFontSizeMultiplier={1.4}>
              From your profile
            </Text>
          </View>
        ) : (
          <TextInput
            className="rounded-2xl border border-fog bg-white px-4 py-3.5 font-body text-[15px] text-charcoal-primary"
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9ca3af"
            keyboardType="numbers-and-punctuation"
            value={dob}
            onChangeText={setDob}
            maxLength={10}
          />
        )}

        {/* BVN */}
        <Text
          className="mb-2 mt-6 font-subtitle text-[13px] uppercase tracking-wide text-smoke"
          maxFontSizeMultiplier={1.4}>
          Bank Verification Number
        </Text>
        <TextInput
          className="rounded-2xl border border-fog bg-white px-4 py-3.5 font-body text-[15px] text-charcoal-primary"
          placeholder="11-digit BVN"
          placeholderTextColor="#9ca3af"
          keyboardType="number-pad"
          value={bvn}
          onChangeText={(v) => setBvn(digitsOnly(v))}
          maxLength={11}
        />
        <Text className="mt-2 font-body text-[12px] leading-4 text-ash" maxFontSizeMultiplier={1.4}>
          Dial *565*0# from your registered line to find your BVN.
        </Text>

        {formError && <KycErrorBanner message={formError} />}
      </ScrollView>

      <View className="px-6" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <Button
          title={step === 'error' ? 'Try again' : 'Continue'}
          onPress={handleFormSubmit}
          disabled={!canSubmit}
        />
      </View>
    </SafeAreaView>
  );
}
