import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { useKYCFlow } from '@/api/hooks/useKYCFlow';
import { kycService } from '@/api/services/kyc.service';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import { useAnalytics, ANALYTICS_EVENTS } from '@/utils/analytics';
import { ArrowLeft01Icon, CheckmarkCircle01Icon } from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';
import { KycSuccess, KycErrorBanner } from '@/components/kyc';
import type { TransformedApiError } from '@/api/types';

// ── Options ──────────────────────────────────────────────────────

const EMPLOYMENT_STATUS = [
  { value: 'employed', label: 'Employed' },
  { value: 'self_employed', label: 'Self-employed' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'student', label: 'Student' },
  { value: 'retired', label: 'Retired' },
];

const OCCUPATION = [
  { value: '152011', label: 'Software / Technology' },
  { value: '113011', label: 'Management / Executive' },
  { value: '132011', label: 'Finance / Accounting' },
  { value: '211011', label: 'Healthcare / Medical' },
  { value: '251000', label: 'Education / Teaching' },
  { value: '411011', label: 'Sales / Marketing' },
  { value: '471011', label: 'Construction / Trades' },
  { value: '531000', label: 'Transportation / Logistics' },
  { value: '391000', label: 'Personal Services' },
  { value: '999999', label: 'Other' },
];

const SOURCE_OF_FUNDS = [
  { value: 'salary', label: 'Salary / Employment' },
  { value: 'business_income', label: 'Business income' },
  { value: 'investments_loans', label: 'Investments' },
  { value: 'savings', label: 'Savings' },
  { value: 'sale_of_assets_real_estate', label: 'Sale of assets' },
  { value: 'inheritance', label: 'Inheritance / Gift' },
  { value: 'pension_retirement', label: 'Pension / Retirement' },
  { value: 'government_benefits', label: 'Government benefits' },
];

const MONTHLY_VOLUME = [
  { value: '0_4999', label: 'Under $5,000' },
  { value: '5000_24999', label: '$5,000 – $24,999' },
  { value: '25000_99999', label: '$25,000 – $99,999' },
  { value: '100000_plus', label: '$100,000+' },
];

const ACCOUNT_PURPOSE = [
  { value: 'personal_or_living_expenses', label: 'Personal / living expenses' },
  { value: 'receive_salary', label: 'Receive salary' },
  { value: 'investment_purposes', label: 'Investment' },
  { value: 'receive_payment_for_freelancing', label: 'Freelancing' },
  { value: 'purchase_goods_and_services', label: 'Purchase goods & services' },
  { value: 'payments_to_friends_or_family_abroad', label: 'Send money abroad' },
  { value: 'business_transactions', label: 'Business transactions' },
  { value: 'other', label: 'Other' },
];

// ── Option row ───────────────────────────────────────────────────

function OptionRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { selection } = useHaptics();
  return (
    <Pressable
      onPress={() => {
        selection();
        onPress();
      }}
      className={`mb-2 flex-row items-center justify-between rounded-2xl border px-4 py-3.5 ${
        selected ? 'border-midnight bg-midnight' : 'border-fog bg-white'
      }`}>
      <Text
        className={`font-body text-[15px] ${selected ? 'text-white' : 'text-charcoal-primary'}`}
        maxFontSizeMultiplier={1.4}>
        {label}
      </Text>
      <View
        className={`size-5 rounded-full border-2 ${selected ? 'border-white bg-white' : 'border-fog'}`}
      />
    </Pressable>
  );
}

// ── Screen ───────────────────────────────────────────────────────

type Step = 'form' | 'success' | 'error';

export default function BloomUpgradeScreen() {
  const insets = useSafeAreaInsets();
  const { track } = useAnalytics();
  const { impact, notification } = useHaptics();

  const { tier, refetchAll } = useKYCFlow(false);

  const [step, setStep] = useState<Step>('form');
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [occupation, setOccupation] = useState('');
  const [sourceOfFunds, setSourceOfFunds] = useState('');
  const [expectedMonthlyVolume, setExpectedMonthlyVolume] = useState('');
  const [accountPurpose, setAccountPurpose] = useState('');

  const canSubmit = useMemo(
    () =>
      employmentStatus.trim() !== '' &&
      occupation.trim() !== '' &&
      sourceOfFunds.trim() !== '' &&
      expectedMonthlyVolume.trim() !== '' &&
      accountPurpose.trim() !== '' &&
      step === 'form',
    [employmentStatus, occupation, sourceOfFunds, expectedMonthlyVolume, accountPurpose, step]
  );

  // ── Smart skip: if already Bloom tier ──────────────────────────

  useEffect(() => {
    if (tier >= 3) {
      setStep('success');
    }
  }, [tier]);

  // ── Submit ─────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;

    setFormError(null);
    impact();
    playUISound('buttonClick');
    setStep('form');

    try {
      await kycService.bloomUpgrade({
        employment_status: employmentStatus,
        occupation,
        source_of_funds: sourceOfFunds,
        expected_monthly_volume: expectedMonthlyVolume,
        account_purpose: accountPurpose,
      });

      notification('success');
      playUISound('transactionSuccess');
      track(ANALYTICS_EVENTS.KYC_VERIFICATION_COMPLETED, { tier: 3 });
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
    employmentStatus,
    occupation,
    sourceOfFunds,
    expectedMonthlyVolume,
    accountPurpose,
    impact,
    notification,
    track,
    refetchAll,
  ]);

  // ── Success ────────────────────────────────────────────────────

  if (step === 'success') {
    return (
      <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top', 'bottom']}>
        <KycSuccess
          title="Bloom activated!"
          description="You now have access to USD accounts, the Rail Debit Card, and investing."
          actionLabel="Done"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  // ── Form ───────────────────────────────────────────────────────

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
          Unlock Bloom
        </Text>
        <Text className="mt-2 font-body text-[15px] leading-6 text-ash" maxFontSizeMultiplier={1.4}>
          Complete your financial profile to access USD accounts, the Rail Debit Card, and
          investing.
        </Text>

        {/* What you unlock */}
        <View className="mt-6 rounded-2xl border border-stone-surface bg-stone-surface p-4">
          <Text
            className="mb-2 font-subtitle text-[13px] text-graphite"
            maxFontSizeMultiplier={1.4}>
            What you unlock:
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {['USD accounts', 'Rail Debit Card', 'Investing'].map((label) => (
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

        {/* Employment status */}
        <Text
          className="mb-3 mt-8 font-subtitle text-[13px] uppercase tracking-wide text-smoke"
          maxFontSizeMultiplier={1.4}>
          Employment status
        </Text>
        {EMPLOYMENT_STATUS.map((o) => (
          <OptionRow
            key={o.value}
            label={o.label}
            selected={employmentStatus === o.value}
            onPress={() => setEmploymentStatus(o.value)}
          />
        ))}

        {/* Occupation */}
        <Text
          className="mb-3 mt-6 font-subtitle text-[13px] uppercase tracking-wide text-smoke"
          maxFontSizeMultiplier={1.4}>
          Occupation
        </Text>
        {OCCUPATION.map((o) => (
          <OptionRow
            key={o.value}
            label={o.label}
            selected={occupation === o.value}
            onPress={() => setOccupation(o.value)}
          />
        ))}

        {/* Source of funds */}
        <Text
          className="mb-3 mt-6 font-subtitle text-[13px] uppercase tracking-wide text-smoke"
          maxFontSizeMultiplier={1.4}>
          Source of funds
        </Text>
        {SOURCE_OF_FUNDS.map((o) => (
          <OptionRow
            key={o.value}
            label={o.label}
            selected={sourceOfFunds === o.value}
            onPress={() => setSourceOfFunds(o.value)}
          />
        ))}

        {/* Expected monthly volume */}
        <Text
          className="mb-3 mt-6 font-subtitle text-[13px] uppercase tracking-wide text-smoke"
          maxFontSizeMultiplier={1.4}>
          Expected monthly deposits
        </Text>
        {MONTHLY_VOLUME.map((o) => (
          <OptionRow
            key={o.value}
            label={o.label}
            selected={expectedMonthlyVolume === o.value}
            onPress={() => setExpectedMonthlyVolume(o.value)}
          />
        ))}

        {/* Account purpose */}
        <Text
          className="mb-3 mt-6 font-subtitle text-[13px] uppercase tracking-wide text-smoke"
          maxFontSizeMultiplier={1.4}>
          Account purpose
        </Text>
        {ACCOUNT_PURPOSE.map((o) => (
          <OptionRow
            key={o.value}
            label={o.label}
            selected={accountPurpose === o.value}
            onPress={() => setAccountPurpose(o.value)}
          />
        ))}

        {formError && <KycErrorBanner message={formError} />}
      </ScrollView>

      <View className="px-6" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <Button
          title={step === 'error' ? 'Try again' : 'Continue'}
          onPress={handleSubmit}
          disabled={!canSubmit}
        />
      </View>
    </SafeAreaView>
  );
}
