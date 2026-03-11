import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useKycStore } from '@/stores/kycStore';

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
        selected ? 'border-black bg-black' : 'border-gray-200 bg-white'
      }`}>
      <Text className={`font-body text-[15px] ${selected ? 'text-white' : 'text-gray-900'}`}>
        {label}
      </Text>
      <View
        className={`size-5 rounded-full border-2 ${selected ? 'border-white bg-white' : 'border-gray-300'}`}
      />
    </Pressable>
  );
}

export default function SourceOfFundsScreen() {
  const { setSourceOfFunds, setExpectedMonthlyPayments, setAccountPurpose } = useKycStore();

  const [funds, setFunds] = useState<string | null>(null);
  const [monthly, setMonthly] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<string | null>(null);

  const canContinue = !!funds && !!monthly && !!purpose;

  const handleContinue = () => {
    setSourceOfFunds(funds);
    setExpectedMonthlyPayments(monthly);
    setAccountPurpose(purpose);
    router.push('/kyc/sumsub-sdk');
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-row items-center px-4 pb-2 pt-1">
        <Pressable
          onPress={() => router.back()}
          className="size-11 items-center justify-center"
          accessibilityRole="button">
          <ChevronLeft size={24} color="#111827" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="mb-1 font-display text-[28px] text-gray-900">About your funds</Text>
        <Text className="mb-8 font-body text-[15px] leading-6 text-gray-500">
          Required by our financial partner to activate your account.
        </Text>

        <Text className="mb-3 font-subtitle text-[13px] uppercase tracking-wide text-gray-400">
          Source of funds
        </Text>
        {SOURCE_OF_FUNDS.map((o) => (
          <OptionRow
            key={o.value}
            label={o.label}
            selected={funds === o.value}
            onPress={() => setFunds(o.value)}
          />
        ))}

        <Text className="mb-3 mt-6 font-subtitle text-[13px] uppercase tracking-wide text-gray-400">
          Expected monthly deposits
        </Text>
        {MONTHLY_PAYMENTS.map((o) => (
          <OptionRow
            key={o.value}
            label={o.label}
            selected={monthly === o.value}
            onPress={() => setMonthly(o.value)}
          />
        ))}

        <Text className="mb-3 mt-6 font-subtitle text-[13px] uppercase tracking-wide text-gray-400">
          Account purpose
        </Text>
        {ACCOUNT_PURPOSE.map((o) => (
          <OptionRow
            key={o.value}
            label={o.label}
            selected={purpose === o.value}
            onPress={() => setPurpose(o.value)}
          />
        ))}
      </ScrollView>

      <View className="px-5 pb-4 pt-2">
        <Pressable
          onPress={handleContinue}
          disabled={!canContinue}
          className={`items-center rounded-full py-4 ${canContinue ? 'bg-black' : 'bg-gray-200'}`}>
          <Text
            className={`font-subtitle text-[16px] ${canContinue ? 'text-white' : 'text-gray-400'}`}>
            Continue
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
