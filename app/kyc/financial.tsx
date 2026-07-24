import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProgressBar } from '@/components/atoms/ProgressBar';
import { Button } from '@/components/ui';
import { useStartDiditSession } from '@/api/hooks/useKYC';
import {
  COUNTRY_KYC_REQUIREMENTS,
  COUNTRY_LABELS,
  EMPLOYMENT_STATUS_OPTIONS,
  type KycDisclosures,
} from '@/api/types/kyc';
import { useKycStore } from '@/stores/kycStore';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import { ArrowLeft01Icon, CheckmarkCircle01Icon } from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';
import type { TransformedApiError } from '@/api/types';

// ── Disclosure copy ──────────────────────────────────────────────

const DISCLOSURE_COPY: Record<keyof KycDisclosures, string> = {
  is_control_person: 'I am a control person of a publicly traded company.',
  is_affiliated_exchange_or_finra: 'I am affiliated with a stock exchange or FINRA member.',
  is_politically_exposed: 'I am a politically exposed person (PEP).',
  immediate_family_exposed: 'An immediate family member is a politically exposed person.',
};

const DISCLOSURE_HELP: Record<keyof KycDisclosures, string> = {
  is_control_person: 'A control person has significant influence over a publicly traded company.',
  is_affiliated_exchange_or_finra:
    'Select "Yes" if you work for a stock exchange or FINRA member firm.',
  is_politically_exposed: 'A PEP is someone entrusted with prominent public functions.',
  immediate_family_exposed: 'Select "Yes" if an immediate family member is a PEP.',
};

// ── Source of funds options ──────────────────────────────────────

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

const MONTHLY_PAYMENTS = [
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

const OCCUPATIONS = [
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

// ── Section header ───────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-8">
      <Text
        className="mb-3 font-subtitle text-[13px] uppercase tracking-wide text-smoke"
        maxFontSizeMultiplier={1.4}>
        {title}
      </Text>
      {children}
    </View>
  );
}

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

export default function KycFinancialScreen() {
  const insets = useSafeAreaInsets();
  const { impact } = useHaptics();
  const scrollRef = useRef<ScrollView>(null);

  const {
    country,
    employmentStatus,
    sourceOfFunds,
    expectedMonthlyPayments,
    accountPurpose,
    mostRecentOccupation,
    actingAsIntermediary,
    disclosures,
    disclosuresConfirmed,
    investmentPurposes,
    setEmploymentStatus,
    setSourceOfFunds,
    setExpectedMonthlyPayments,
    setAccountPurpose,
    setMostRecentOccupation,
    setActingAsIntermediary,
    setDisclosure,
    setDisclosuresConfirmed,
    toggleInvestmentPurpose,
    clearInvestmentPurposes,
    setDiditSession,
    setLocalSubmissionPendingAt,
    setMissingProfileFields,
    hasCompletedStep,
    addCompletedStep,
    diditSessionToken,
  } = useKycStore();

  const startSession = useStartDiditSession();
  const [submitError, setSubmitError] = useState('');

  // Skip if already done and we have a session token
  useEffect(() => {
    if (hasCompletedStep('financial') && diditSessionToken) {
      router.replace('/kyc/didit-sdk');
    }
  }, []);

  // If tax ID was lost (app kill), redirect back
  const taxId = useKycStore((s) => s.taxId);
  if (!taxId) {
    return (
      <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center px-8">
          <Text
            className="mb-4 text-center font-display text-[22px] text-charcoal-primary"
            maxFontSizeMultiplier={1.3}>
            Session interrupted
          </Text>
          <Text
            className="mb-8 text-center font-body text-[15px] leading-6 text-ash"
            maxFontSizeMultiplier={1.4}>
            Your session was interrupted. Please re-enter your identity details.
          </Text>
          <Pressable
            onPress={() => router.replace('/kyc')}
            className="rounded-full bg-primary px-8 py-4"
            accessibilityRole="button">
            <Text className="font-subtitle text-[15px] text-white" maxFontSizeMultiplier={1.3}>
              Start over
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const requirement = COUNTRY_KYC_REQUIREMENTS[country];
  const requiredDisclosureKeys = requirement.requiredDisclosures;
  const allDisclosuresAnswered = requiredDisclosureKeys.every(
    (key) => disclosures[key] !== undefined
  );

  const canSubmit =
    !!employmentStatus &&
    !!sourceOfFunds &&
    !!expectedMonthlyPayments &&
    !!accountPurpose &&
    !!mostRecentOccupation &&
    disclosuresConfirmed &&
    allDisclosuresAnswered &&
    !startSession.isPending;

  const handleSubmit = async () => {
    setSubmitError('');
    setLocalSubmissionPendingAt(null);

    try {
      const result = await startSession.mutateAsync({
        tax_id: taxId,
        tax_id_type: useKycStore.getState().taxIdType,
        issuing_country: country,
        disclosures: disclosures as KycDisclosures,
        source_of_funds: sourceOfFunds!,
        employment_status: employmentStatus ?? undefined,
        expected_monthly_payments_usd: expectedMonthlyPayments!,
        account_purpose: accountPurpose!,
        most_recent_occupation: mostRecentOccupation!,
        acting_as_intermediary: actingAsIntermediary,
      });
      setDiditSession(result.session_token, result.session_id);
      addCompletedStep('financial');
      if (result.status === 'existing_session') {
        setLocalSubmissionPendingAt(new Date().toISOString());
        router.replace('/kyc/pending');
      } else {
        setLocalSubmissionPendingAt(new Date().toISOString());
        router.replace('/kyc/didit-sdk');
      }
    } catch (error) {
      const apiError = error as TransformedApiError;
      const missingFields = Array.isArray(apiError?.details?.missing_fields)
        ? (apiError.details.missing_fields as string[])
        : [];

      if (missingFields.length > 0) {
        setMissingProfileFields(missingFields);
        router.replace('/kyc/profile-gaps');
        return;
      }

      setSubmitError(apiError?.message || 'Could not start verification. Please try again.');
    }
  };

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pb-2 pt-1">
          <Pressable
            className="size-11 items-center justify-center rounded-full bg-stone-surface"
            onPress={() => router.back()}
            accessibilityRole="button">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#343433" />
          </Pressable>
          <Text className="font-subtitle text-[13px] text-ash" maxFontSizeMultiplier={1.4}>
            Step 2 of 2
          </Text>
          <View className="size-11" />
        </View>

        <View className="px-4">
          <ProgressBar progress={100} height={6} />
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 24, paddingBottom: 120 }}>
          <Text
            className="font-display text-[23px] text-charcoal-primary"
            maxFontSizeMultiplier={1.3}>
            Financial profile
          </Text>
          <Text
            className="mt-2 font-body text-[15px] leading-6 text-ash"
            maxFontSizeMultiplier={1.4}>
            Required for {COUNTRY_LABELS[country]} account compliance. Takes about 2 minutes.
          </Text>

          {/* Trust signal */}
          <View className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
            <Text
              className="font-body text-[13px] leading-5 text-blue-800"
              maxFontSizeMultiplier={1.4}>
              Your information is securely encrypted and only used for account verification.
            </Text>
          </View>

          {/* ── Employment Status ──────────────────────────────── */}
          <Section title="Employment status">
            {EMPLOYMENT_STATUS_OPTIONS.map((o) => (
              <OptionRow
                key={o.value}
                label={o.label}
                selected={employmentStatus === o.value}
                onPress={() => setEmploymentStatus(o.value)}
              />
            ))}
          </Section>

          {/* ── Source of Funds ────────────────────────────────── */}
          <Section title="Source of funds">
            {SOURCE_OF_FUNDS.map((o) => (
              <OptionRow
                key={o.value}
                label={o.label}
                selected={sourceOfFunds === o.value}
                onPress={() => setSourceOfFunds(o.value)}
              />
            ))}
          </Section>

          {/* ── Expected Monthly Deposits ──────────────────────── */}
          <Section title="Expected monthly deposits">
            {MONTHLY_PAYMENTS.map((o) => (
              <OptionRow
                key={o.value}
                label={o.label}
                selected={expectedMonthlyPayments === o.value}
                onPress={() => setExpectedMonthlyPayments(o.value)}
              />
            ))}
          </Section>

          {/* ── Occupation ─────────────────────────────────────── */}
          <Section title="Most recent occupation">
            {OCCUPATIONS.map((o) => (
              <OptionRow
                key={o.value}
                label={o.label}
                selected={mostRecentOccupation === o.value}
                onPress={() => setMostRecentOccupation(o.value)}
              />
            ))}
          </Section>

          {/* ── Account Purpose ────────────────────────────────── */}
          <Section title="Account purpose">
            {ACCOUNT_PURPOSE.map((o) => (
              <OptionRow
                key={o.value}
                label={o.label}
                selected={accountPurpose === o.value}
                onPress={() => setAccountPurpose(o.value)}
              />
            ))}
          </Section>

          {/* ── Intermediary toggle ────────────────────────────── */}
          <View className="mt-8 flex-row items-center justify-between rounded-2xl border border-fog bg-parchment-card px-4 py-3.5">
            <View className="flex-1 pr-4">
              <Text
                className="font-body text-[15px] text-charcoal-primary"
                maxFontSizeMultiplier={1.4}>
                Acting as intermediary?
              </Text>
              <Text className="mt-0.5 font-body text-[13px] text-smoke" maxFontSizeMultiplier={1.4}>
                Are you transacting on behalf of another person or entity?
              </Text>
            </View>
            <Switch
              value={actingAsIntermediary}
              onValueChange={(v) => {
                playUISound('toggle');
                setActingAsIntermediary(v);
              }}
              trackColor={{ false: '#e5e7eb', true: '#000' }}
              thumbColor="#fff"
            />
          </View>

          {/* ── Declarations ───────────────────────────────────── */}
          <Section title="Declarations">
            <View className="rounded-2xl border border-fog bg-parchment-card px-4 py-2">
              {requiredDisclosureKeys.map((key, index) => (
                <View
                  key={key}
                  className={`py-4 ${index < requiredDisclosureKeys.length - 1 ? 'border-b border-stone-surface' : ''}`}>
                  <Text
                    className="font-body text-[14px] leading-5 text-charcoal-primary"
                    maxFontSizeMultiplier={1.4}>
                    {DISCLOSURE_COPY[key]}
                  </Text>
                  <Text
                    className="mt-1 font-caption text-[12px] leading-4 text-ash"
                    maxFontSizeMultiplier={1.4}>
                    {DISCLOSURE_HELP[key]}
                  </Text>
                  <View className="mt-3 flex-row gap-2">
                    {(['No', 'Yes'] as const).map((label) => {
                      const isYes = label === 'Yes';
                      const isActive = disclosures[key] === isYes;
                      return (
                        <Pressable
                          key={label}
                          onPress={() => {
                            impact();
                            setDisclosure(key, isYes);
                          }}
                          className={`min-h-[40px] flex-1 items-center justify-center rounded-full border ${
                            isActive ? 'border-midnight bg-midnight' : 'border-fog bg-white'
                          }`}
                          accessibilityRole="button">
                          <Text
                            className={`font-subtitle text-[13px] ${isActive ? 'text-white' : 'text-graphite'}`}
                            maxFontSizeMultiplier={1.4}>
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>

            {/* Confirmation checkbox */}
            <Pressable
              onPress={() => {
                impact();
                setDisclosuresConfirmed(!disclosuresConfirmed);
              }}
              className="mt-4 flex-row items-start gap-3 rounded-2xl bg-stone-surface px-4 py-4"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: disclosuresConfirmed }}>
              <View
                className={`mt-0.5 size-5 items-center justify-center rounded border ${
                  disclosuresConfirmed ? 'border-midnight bg-midnight' : 'border-fog bg-white'
                }`}>
                {disclosuresConfirmed && (
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    size={12}
                    color="#FFFFFF"
                    strokeWidth={3}
                  />
                )}
              </View>
              <Text
                className="flex-1 font-body text-[13px] leading-5 text-graphite"
                maxFontSizeMultiplier={1.4}>
                I confirm all submitted information is accurate and belongs to me.
              </Text>
            </Pressable>
          </Section>

          {submitError && (
            <View className="mt-4 rounded-2xl bg-coral-red/10 px-4 py-3">
              <Text
                className="font-body text-[12px] leading-5 text-coral-red"
                maxFontSizeMultiplier={1.4}>
                {submitError}
              </Text>
            </View>
          )}
        </ScrollView>

        <View
          className="absolute bottom-0 left-0 right-0 border-t border-stone-surface bg-parchment-card px-4 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <Button
            title={startSession.isPending ? 'Starting verification…' : 'Continue to verification'}
            onPress={handleSubmit}
            disabled={!canSubmit}
          />
        </View>
      </SafeAreaView>
    </ErrorBoundary>
  );
}
