import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { useKYCStatus } from '@/api/hooks';
import { useVirtualAccounts } from '@/api/hooks/useVirtualAccount';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { Button } from '@/components/ui';
import { Skeleton } from '@/components/atoms/Skeleton';
import type { VirtualAccount } from '@/api/types/funding';

import { UsdIcon, EurIcon, GbpIcon } from '@/assets/svg';
import { VirtualAccountIntroSheet } from '@/components/sheets/VirtualAccountIntroSheet';
import {
  ArrowLeft01Icon,
  Building04Icon,
  Copy01Icon,
  ArrowDown01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

type Currency = 'USD' | 'EUR' | 'GBP';

const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP'];

const CURRENCY_FLAG: Record<Currency, React.ComponentType<any>> = {
  USD: UsdIcon,
  EUR: EurIcon,
  GBP: GbpIcon,
};

const CURRENCY_LABEL: Record<Currency, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
};

// ─── Detail row with copy ───────────────────────────────────────────────────
function DetailRow({ label, value }: { label: string; value: string }) {
  const { showInfo } = useFeedbackPopup();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handleCopy = useCallback(async () => {
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    await Clipboard.setStringAsync(value);
    showInfo('Copied', `${label} copied to clipboard`);
  }, [value, label, showInfo, scale]);

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={handleCopy}
        activeOpacity={0.7}
        className="flex-row items-center justify-between py-3.5">
        <View className="flex-1 pr-4">
          <Text className="mb-0.5 font-body text-[12px] text-gray-400">{label}</Text>
          <Text className="font-subtitle text-[15px] text-gray-900">{value}</Text>
        </View>
        <HugeiconsIcon icon={Copy01Icon} size={16} color="#9CA3AF" />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Currency picker in header ──────────────────────────────────────────────
function CurrencyPicker({
  selected,
  onSelect,
}: {
  selected: Currency;
  onSelect: (c: Currency) => void;
}) {
  const [open, setOpen] = useState(false);
  const Flag = CURRENCY_FLAG[selected];

  return (
    <View className="relative">
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        className="flex-row items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5">
        <View className="h-6 w-6 overflow-hidden rounded-full">
          <Flag width={24} height={24} />
        </View>
        <Text className="font-subtitle text-[15px] text-gray-900">{selected}</Text>
        <HugeiconsIcon icon={ArrowDown01Icon} size={14} color="#6B7280" />
      </TouchableOpacity>

      {open && (
        <Animated.View
          entering={FadeInDown.duration(150)}
          className="absolute right-0 top-11 z-50 min-w-[180px] rounded-2xl bg-white py-2 shadow-lg"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 8,
          }}>
          {CURRENCIES.map((c) => {
            const CFlag = CURRENCY_FLAG[c];
            return (
              <TouchableOpacity
                key={c}
                onPress={() => {
                  onSelect(c);
                  setOpen(false);
                }}
                className={`flex-row items-center gap-3 px-4 py-3 ${selected === c ? 'bg-gray-50' : ''}`}>
                <View className="h-7 w-7 overflow-hidden rounded-full">
                  <CFlag width={28} height={28} />
                </View>
                <View>
                  <Text className="font-subtitle text-[14px] text-gray-900">{c}</Text>
                  <Text className="font-body text-[12px] text-gray-400">
                    {CURRENCY_LABEL[c]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
}

// ─── Account details card ───────────────────────────────────────────────────
function AccountDetails({ account }: { account: VirtualAccount }) {
  const Flag = CURRENCY_FLAG[account.currency as Currency];
  const rails = account.payment_rails?.length
    ? account.payment_rails.map((r) => r.replace(/_/g, ' ').toUpperCase()).join(', ')
    : null;

  return (
    <Animated.View entering={FadeInDown.springify()} className="flex-1 px-5">
      {/* Bank header */}
      <View className="mb-2 flex-row items-center py-4">
        <View className="mr-3 h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
          {Flag ? <Flag width={48} height={48} /> : <HugeiconsIcon icon={Building04Icon} size={22} color="#9CA3AF" />}
        </View>
        <View className="flex-1">
          <Text className="font-subtitle text-[17px] text-gray-900">
            {account.bank_name || 'Bank Account'}
          </Text>
          {account.bank_address ? (
            <Text className="mt-0.5 font-body text-[12px] text-gray-400" numberOfLines={1}>
              {account.bank_address}
            </Text>
          ) : null}
        </View>
        <View className="rounded-full bg-green-100 px-3 py-1">
          <Text className="font-body text-[12px] text-green-700">Active</Text>
        </View>
      </View>

      {/* Divider */}
      <View className="h-px bg-gray-100" />

      {/* Details */}
      <View className="rounded-2xl">
        <DetailRow label="Account Number" value={account.account_number || '—'} />
        <View className="h-px bg-gray-50" />
        {account.routing_number ? (
          <>
            <DetailRow label="Routing Number" value={account.routing_number} />
            <View className="h-px bg-gray-50" />
          </>
        ) : null}
        <DetailRow
          label="Beneficiary"
          value={account.beneficiary_name || '—'}
        />
        {account.beneficiary_address ? (
          <>
            <View className="h-px bg-gray-50" />
            <DetailRow label="Beneficiary Address" value={account.beneficiary_address} />
          </>
        ) : null}
        {rails ? (
          <>
            <View className="h-px bg-gray-50" />
            <DetailRow label="Payment Methods" value={rails} />
          </>
        ) : null}
      </View>

      {/* Info banner */}
      <View className="mt-4 flex-row rounded-2xl bg-blue-50 px-4 py-3">
        <HugeiconsIcon icon={Building04Icon} size={18} color="#3B82F6" />
        <Text className="ml-3 flex-1 font-body text-[13px] leading-[19px] text-blue-700">
          Deposits typically arrive within 1–3 business days. Wire transfers may arrive same day.
        </Text>
      </View>
    </Animated.View>
  );
}

// ─── Empty state for a currency ─────────────────────────────────────────────
function NoAccountForCurrency({
  currency,
  onSetup,
}: {
  currency: Currency;
  onSetup: () => void;
}) {
  const Flag = CURRENCY_FLAG[currency];
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="mb-4 h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gray-50">
        <Flag width={40} height={40} />
      </View>
      <Text className="mb-2 text-center font-subtitle text-lg text-gray-900">
        No {currency} account yet
      </Text>
      <Text className="mb-6 text-center font-body text-[14px] leading-5 text-gray-400">
        Create a virtual {CURRENCY_LABEL[currency]} account to start receiving deposits.
      </Text>
      <Button title={`Create ${currency} Account`} onPress={onSetup} variant="black" />
    </View>
  );
}

// ─── Root ───────────────────────────────────────────────────────────────────
export default function VirtualAccountScreen() {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
  const [showIntro, setShowIntro] = useState(false);
  const { data: kycStatus, isLoading: isKycLoading } = useKYCStatus();
  const isApproved = kycStatus?.status === 'approved';

  const {
    data: accountsData,
    refetch,
    isRefetching,
    isLoading: isAccountsLoading,
  } = useVirtualAccounts(isApproved);

  const accounts = useMemo(() => accountsData?.virtual_accounts ?? [], [accountsData]);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.currency === selectedCurrency),
    [accounts, selectedCurrency]
  );

  if (isKycLoading || isAccountsLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-5 pb-2 pt-2">
          <View className="flex-row items-center">
            <View className="mr-4 h-6 w-6 rounded-full bg-surface" />
            <Skeleton className="h-5 w-36" />
          </View>
          <Skeleton className="h-8 w-20 rounded-full" />
        </View>
        <View className="flex-1 px-5 pt-4">
          <Skeleton className="mb-4 h-16 w-full rounded-2xl" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="mb-3 h-14 w-full rounded-xl" />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pb-2 pt-2">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} className="mr-4 p-1">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#111" />
          </TouchableOpacity>
          <Text className="font-subtitle text-lg text-gray-900">Bank Account</Text>
        </View>
        <CurrencyPicker selected={selectedCurrency} onSelect={setSelectedCurrency} />
      </View>

      {selectedAccount ? (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#000" />
          }>
          <AccountDetails account={selectedAccount} />
          <View className="h-8" />
        </ScrollView>
      ) : (
        <NoAccountForCurrency
          currency={selectedCurrency}
          onSetup={() => setShowIntro(true)}
        />
      )}

      <VirtualAccountIntroSheet
        visible={showIntro}
        onClose={() => setShowIntro(false)}
        currency={selectedCurrency}
        onSuccess={() => {
          setShowIntro(false);
          refetch();
        }}
      />
    </SafeAreaView>
  );
}
