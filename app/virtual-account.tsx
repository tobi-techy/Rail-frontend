import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { useKYCStatus } from '@/api/hooks';
import { useVirtualAccounts } from '@/api/hooks/useVirtualAccount';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { useHaptics } from '@/hooks/useHaptics';
import { Button } from '@/components/ui';
import { Skeleton } from '@/components/atoms/Skeleton';
import type { VirtualAccount } from '@/api/types/funding';
import { UsdIcon, EurIcon, GbpIcon } from '@/assets/svg';
import { VirtualAccountIntroSheet } from '@/components/sheets/VirtualAccountIntroSheet';
import {
  ArrowLeft01Icon,
  Building04Icon,
  CheckmarkCircle02Icon,
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

// ─── Copy row ───────────────────────────────────────────────────────────────
function CopyRow({ label, value }: { label: string; value: string }) {
  const { showInfo } = useFeedbackPopup();
  const { selection } = useHaptics();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    selection();
    await Clipboard.setStringAsync(value);
    setCopied(true);
    showInfo('Copied', `${label} copied`);
    setTimeout(() => setCopied(false), 1500);
  }, [value, label, selection, showInfo]);

  return (
    <Pressable
      onPress={handleCopy}
      className="flex-row items-center justify-between px-5 py-4 active:bg-gray-50"
      accessibilityRole="button"
      accessibilityLabel={`Copy ${label}`}>
      <View className="flex-1 pr-4">
        <Text className="font-body text-[13px] text-text-secondary">{label}</Text>
        <Text className="mt-1 font-subtitle text-[16px] tracking-wide text-text-primary" selectable>
          {value}
        </Text>
      </View>
      {copied ? (
        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} color="#10B981" />
      ) : (
        <HugeiconsIcon icon={Copy01Icon} size={18} color="#9CA3AF" />
      )}
    </Pressable>
  );
}

// ─── Currency picker ────────────────────────────────────────────────────────
function CurrencyPicker({
  selected,
  onSelect,
}: {
  selected: Currency;
  onSelect: (c: Currency) => void;
}) {
  const [open, setOpen] = useState(false);
  const { selection } = useHaptics();
  const Flag = CURRENCY_FLAG[selected];

  return (
    <View className="relative z-50">
      <Pressable
        onPress={() => {
          selection();
          setOpen(!open);
        }}
        className="flex-row items-center gap-2 rounded-full bg-gray-50 px-3 py-2">
        <View className="size-6 overflow-hidden rounded-full">
          <Flag width={24} height={24} />
        </View>
        <Text className="font-subtitle text-[14px] text-text-primary">{selected}</Text>
        <HugeiconsIcon icon={ArrowDown01Icon} size={14} color="#6B7280" />
      </Pressable>

      {open && (
        <Animated.View
          entering={FadeInDown.duration(150)}
          className="absolute right-0 top-12 min-w-[180px] rounded-2xl bg-white py-2"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.08,
            shadowRadius: 24,
            elevation: 8,
          }}>
          {CURRENCIES.map((c) => {
            const CFlag = CURRENCY_FLAG[c];
            return (
              <Pressable
                key={c}
                onPress={() => {
                  selection();
                  onSelect(c);
                  setOpen(false);
                }}
                className={`flex-row items-center gap-3 px-4 py-3 ${selected === c ? 'bg-gray-50' : ''}`}>
                <View className="size-7 overflow-hidden rounded-full">
                  <CFlag width={28} height={28} />
                </View>
                <View>
                  <Text className="font-subtitle text-[14px] text-text-primary">{c}</Text>
                  <Text className="font-body text-[12px] text-text-secondary">
                    {CURRENCY_LABEL[c]}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
}

// ─── Account card ───────────────────────────────────────────────────────────
function AccountCard({ account }: { account: VirtualAccount }) {
  const Flag = CURRENCY_FLAG[account.currency as Currency];
  const rails = account.payment_rails?.length
    ? account.payment_rails.map((r) => r.replace(/_/g, ' ').toUpperCase()).join(' · ')
    : null;

  return (
    <Animated.View entering={FadeInDown.duration(350)} className="flex-1">
      {/* Bank identity */}
      <View className="items-center px-5 pb-6 pt-8">
        <View className="mb-4 size-16 items-center justify-center overflow-hidden rounded-full bg-gray-50">
          {Flag ? (
            <Flag width={48} height={48} />
          ) : (
            <HugeiconsIcon icon={Building04Icon} size={28} color="#9CA3AF" />
          )}
        </View>
        <Text className="font-subtitle text-[18px] text-text-primary">
          {account.bank_name || 'Bank Account'}
        </Text>
        {account.bank_address ? (
          <Text className="mt-1 font-body text-[13px] text-text-secondary" numberOfLines={1}>
            {account.bank_address}
          </Text>
        ) : null}
        <View className="mt-3 rounded-full bg-emerald-50 px-3 py-1">
          <Text className="font-subtitle text-[12px] text-emerald-600">Active</Text>
        </View>
      </View>

      {/* Details */}
      <View className="mx-5 overflow-hidden rounded-2xl bg-gray-50">
        <CopyRow label="Account Number" value={account.account_number || '—'} />
        {account.routing_number ? (
          <>
            <View className="mx-5 h-px bg-gray-100" />
            <CopyRow label="Routing Number" value={account.routing_number} />
          </>
        ) : null}
        <View className="mx-5 h-px bg-gray-100" />
        <CopyRow label="Beneficiary Name" value={account.beneficiary_name || '—'} />
        {account.beneficiary_address ? (
          <>
            <View className="mx-5 h-px bg-gray-100" />
            <CopyRow label="Beneficiary Address" value={account.beneficiary_address} />
          </>
        ) : null}
        {rails ? (
          <>
            <View className="mx-5 h-px bg-gray-100" />
            <CopyRow label="Payment Rails" value={rails} />
          </>
        ) : null}
      </View>

      {/* Info */}
      <View className="mx-5 mt-4 flex-row items-start gap-3 rounded-2xl bg-blue-50 px-4 py-3.5">
        <HugeiconsIcon icon={Building04Icon} size={16} color="#3B82F6" style={{ marginTop: 2 }} />
        <Text className="flex-1 font-body text-[13px] leading-[19px] text-blue-700">
          Deposits typically arrive within 1–3 business days. Wire transfers may arrive same day.
        </Text>
      </View>
    </Animated.View>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────
function EmptyState({ currency, onSetup }: { currency: Currency; onSetup: () => void }) {
  const Flag = CURRENCY_FLAG[currency];
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="mb-5 size-20 items-center justify-center overflow-hidden rounded-full bg-gray-50">
        <Flag width={48} height={48} />
      </View>
      <Text className="mb-2 text-center font-subtitle text-[20px] text-text-primary">
        No {currency} account yet
      </Text>
      <Text className="mb-8 text-center font-body text-[14px] leading-5 text-text-secondary">
        Create a virtual {CURRENCY_LABEL[currency]} account to receive deposits.
      </Text>
      <Button title={`Create ${currency} Account`} onPress={onSetup} />
    </View>
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────────
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
        <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
          <View className="flex-row items-center gap-4">
            <View className="size-6 rounded-full bg-gray-100" />
            <Skeleton className="h-5 w-32" />
          </View>
          <Skeleton className="h-9 w-20 rounded-full" />
        </View>
        <View className="items-center pt-10">
          <Skeleton className="mb-4 size-16 rounded-full" />
          <Skeleton className="mb-2 h-5 w-40" />
          <Skeleton className="h-4 w-28" />
        </View>
        <View className="mt-8 px-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="mb-1 h-16 w-full" />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#111" />
          </Pressable>
          <Text className="font-subtitle text-[18px] text-text-primary">Bank Account</Text>
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
          <AccountCard account={selectedAccount} />
          <View className="h-8" />
        </ScrollView>
      ) : (
        <EmptyState currency={selectedCurrency} onSetup={() => setShowIntro(true)} />
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
