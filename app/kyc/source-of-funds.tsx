import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Switch } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKycStore } from '@/stores/kycStore';
import { useStartDiditSession } from '@/api/hooks/useKYC';
import type { TransformedApiError } from '@/api/types';
import type { KycDisclosures } from '@/api/types/kyc';
import { ArrowLeft01Icon } from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';

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

function OptionRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`mb-2 flex-row items-center justify-between rounded-2xl border px-4 py-3.5 ${
        selected ? 'border-midnight bg-black' : 'border-fog bg-white'
      }`}>
      <Text
        className={`font-body text-[15px] ${selected ? 'text-white' : 'text-charcoal-primary'}`}>
        {label}
      </Text>
      <View
        className={`size-5 rounded-full border-2 ${selected ? 'border-white bg-white' : 'border-fog'}`}
      />
    </Pressable>
  );
}

export default function SourceOfFundsScreen() {
  const {
    country,
    taxId,
    taxIdType,
    disclosures,
    employmentStatus,
    sourceOfFunds: savedFunds,
    expectedMonthlyPayments: savedMonthly,
    accountPurpose: savedPurpose,
    accountPurposeOther: savedPurposeOther,
    mostRecentOccupation: savedOccupation,
    actingAsIntermediary: savedIntermediary,
    setSourceOfFunds,
    setExpectedMonthlyPayments,
    setAccountPurpose,
    setAccountPurposeOther,
    setMostRecentOccupation,
    setActingAsIntermediary,
    setDiditSession,
    setLocalSubmissionPendingAt,
    setMissingProfileFields,
    hasCompletedStep,
    addCompletedStep,
    diditSessionToken,
  } = useKycStore();

  const startSession = useStartDiditSession();

  // Pre-fill from store so retry after SDK failure doesn't lose data
  const [funds, setFunds] = useState<string | null>(savedFunds);
  const [monthly, setMonthly] = useState<string | null>(savedMonthly);
  const [purpose, setPurpose] = useState<string | null>(savedPurpose);
  const [purposeOther, setPurposeOther] = useState(savedPurposeOther ?? '');
  const [occupation, setOccupation] = useState<string | null>(savedOccupation);
  const [intermediary, setIntermediary] = useState(savedIntermediary);
  const [submitError, setSubmitError] = useState('');

  // Skip if already done and we have a session token
  useEffect(() => {
    if (hasCompletedStep('source-of-funds') && diditSessionToken) {
      router.replace('/kyc/didit-sdk');
    }
  }, []);

  const scrollRef = useRef<ScrollView>(null);
  const sectionYRef = useRef<{
    monthly: number;
    purpose: number;
    occupation: number;
    intermediary: number;
  }>({
    monthly: 0,
    purpose: 0,
    occupation: 0,
    intermediary: 0,
  });

  const scrollToSection = (section: keyof typeof sectionYRef.current) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: sectionYRef.current[section] - 20, animated: true });
    }, 300);
  };

  // If taxId was lost (app kill), show a prompt instead of silently redirecting
  if (!taxId) {
    return (
      <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center font-display text-[22px] text-charcoal-primary">
            Session interrupted
          </Text>
          <Text className="mb-8 text-center font-body text-[15px] leading-6 text-ash">
            Your session was interrupted. Please re-enter your tax ID to continue with verification.
          </Text>
          <Pressable
            onPress={() => router.replace('/kyc/tax-id')}
            className="rounded-full bg-primary px-8 py-4"
            accessibilityRole="button">
            <Text className="font-subtitle text-[15px] text-white">Re-enter Tax ID</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const canContinue =
    !!funds &&
    !!monthly &&
    !!purpose &&
    (purpose !== 'other' || purposeOther.trim().length > 0) &&
    !!occupation &&
    !startSession.isPending;

  const handleContinue = async () => {
    setSourceOfFunds(funds);
    setExpectedMonthlyPayments(monthly);
    setAccountPurpose(purpose);
    setAccountPurposeOther(purpose === 'other' ? purposeOther.trim() : null);
    setMostRecentOccupation(occupation);
    setActingAsIntermediary(intermediary);
    setLocalSubmissionPendingAt(null);
    setSubmitError('');

    try {
      const result = await startSession.mutateAsync({
        tax_id: taxId,
        tax_id_type: taxIdType,
        issuing_country: country,
        disclosures: disclosures as KycDisclosures,
        source_of_funds: funds!,
        employment_status: employmentStatus ?? undefined,
        expected_monthly_payments_usd: monthly!,
        account_purpose: purpose!,
        account_purpose_other: purpose === 'other' ? purposeOther.trim() : undefined,
        most_recent_occupation: occupation!,
        acting_as_intermediary: intermediary,
      });
      setDiditSession(result.session_token, result.session_id);
      addCompletedStep('source-of-funds');
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
    <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top', 'bottom']}>
      <View className="flex-row items-center px-4 pb-2 pt-1">
        <Pressable
          onPress={() => router.back()}
          className="size-11 items-center justify-center"
          accessibilityRole="button">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#343433" />
        </Pressable>
      </View>

      <View className="px-4 pb-2">
        <View className="h-1.5 overflow-hidden rounded-full bg-fog">
          <View className="h-full w-full rounded-full bg-midnight" />
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="mb-1 font-display text-[28px] text-charcoal-primary">
          About your funds
        </Text>
        <Text className="mb-6 font-body text-[15px] leading-6 text-ash">
          This helps our financial partner verify your account and comply with regulations.
        </Text>

        <View className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
          <Text className="font-body text-[13px] leading-5 text-blue-800">
            Your information is securely encrypted and only used for account verification.
          </Text>
        </View>

        <Text className="mb-3 font-subtitle text-[13px] uppercase tracking-wide text-smoke">
          Source of funds
        </Text>
        {SOURCE_OF_FUNDS.map((o) => (
          <OptionRow
            key={o.value}
            label={o.label}
            selected={funds === o.value}
            onPress={() => {
              const isFirst = !funds;
              setFunds(o.value);
              if (isFirst) scrollToSection('monthly');
            }}
          />
        ))}

        <View
          onLayout={(e) => {
            sectionYRef.current.monthly = e.nativeEvent.layout.y;
          }}>
          <Text className="mb-3 mt-6 font-subtitle text-[13px] uppercase tracking-wide text-smoke">
            Expected monthly deposits
          </Text>
        </View>
        {MONTHLY_PAYMENTS.map((o) => (
          <OptionRow
            key={o.value}
            label={o.label}
            selected={monthly === o.value}
            onPress={() => {
              const isFirst = !monthly;
              setMonthly(o.value);
              if (isFirst) scrollToSection('purpose');
            }}
          />
        ))}

        <View
          onLayout={(e) => {
            sectionYRef.current.purpose = e.nativeEvent.layout.y;
          }}>
          <Text className="mb-3 mt-6 font-subtitle text-[13px] uppercase tracking-wide text-smoke">
            Account purpose
          </Text>
        </View>
        {ACCOUNT_PURPOSE.map((o) => (
          <OptionRow
            key={o.value}
            label={o.label}
            selected={purpose === o.value}
            onPress={() => {
              const isFirst = !purpose;
              setPurpose(o.value);
              if (isFirst && o.value !== 'other') scrollToSection('occupation');
            }}
          />
        ))}

        {purpose === 'other' && (
          <TextInput
            className="mb-2 mt-2 rounded-2xl border border-fog px-4 py-3.5 font-body text-[15px] text-charcoal-primary"
            placeholder="Please describe"
            placeholderTextColor="#9ca3af"
            value={purposeOther}
            onChangeText={setPurposeOther}
          />
        )}

        <View
          onLayout={(e) => {
            sectionYRef.current.occupation = e.nativeEvent.layout.y;
          }}>
          <Text className="mb-3 mt-6 font-subtitle text-[13px] uppercase tracking-wide text-smoke">
            Most recent occupation
          </Text>
        </View>
        {OCCUPATIONS.map((o) => (
          <OptionRow
            key={o.value}
            label={o.label}
            selected={occupation === o.value}
            onPress={() => {
              const isFirst = !occupation;
              setOccupation(o.value);
              if (isFirst) scrollToSection('intermediary');
            }}
          />
        ))}

        <View
          onLayout={(e) => {
            sectionYRef.current.intermediary = e.nativeEvent.layout.y;
          }}>
          <View className="mt-6 flex-row items-center justify-between rounded-2xl border border-fog px-4 py-3.5">
            <View className="flex-1 pr-4">
              <Text className="font-body text-[15px] text-charcoal-primary">
                Acting as intermediary?
              </Text>
              <Text className="mt-0.5 font-body text-[13px] text-smoke">
                Are you transacting on behalf of another person or entity?
              </Text>
            </View>
            <Switch
              value={intermediary}
              onValueChange={setIntermediary}
              trackColor={{ false: '#e5e7eb', true: '#000' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {!!submitError && (
          <View className="mt-3 rounded-2xl bg-coral-red/10 px-4 py-3">
            <Text className="font-body text-[12px] leading-5 text-red-700">{submitError}</Text>
          </View>
        )}
      </ScrollView>

      <View className="px-5 pb-4 pt-2">
        <Pressable
          onPress={handleContinue}
          disabled={!canContinue}
          className={`items-center rounded-full py-4 ${canContinue ? 'bg-primary' : 'bg-fog'}`}>
          <Text
            className={`font-subtitle text-[16px] ${canContinue ? 'text-white' : 'text-smoke'}`}>
            {startSession.isPending ? 'Starting verification…' : 'Continue'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
