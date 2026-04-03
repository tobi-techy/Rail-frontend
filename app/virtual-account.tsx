import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
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
  ArrowDown01Icon,
  Copy01Icon,
  CheckmarkCircle02Icon,
  Share01Icon,
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
function DetailRow({ label, value }: { label: string; value: string }) {
  const { showInfo } = useFeedbackPopup();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(value);
    setCopied(true);
    showInfo('Copied', `${label} copied`);
    setTimeout(() => setCopied(false), 1500);
  }, [value, label, showInfo]);

  return (
    <Pressable
      onPress={handleCopy}
      className="flex-row items-center justify-between py-5 active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={`Copy ${label}`}>
      <View className="flex-1 pr-4">
        <Text className="font-body text-[13px] text-[#9CA3AF]">{label}</Text>
        <Text className="mt-1.5 font-subtitle text-[16px] text-[#070914]" selectable>
          {value}
        </Text>
      </View>
      {copied ? (
        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} color="#10B981" />
      ) : (
        <HugeiconsIcon icon={Copy01Icon} size={20} color="#6366F1" />
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
  const Flag = CURRENCY_FLAG[selected];

  return (
    <View className="relative z-50">
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          setOpen(!open);
        }}
        className="flex-row items-center gap-2 rounded-full bg-[#F3F4F6] px-3 py-2">
        <View className="size-6 overflow-hidden rounded-full">
          <Flag width={24} height={24} />
        </View>
        <Text className="font-subtitle text-[14px] text-[#070914]">{selected}</Text>
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
                  Haptics.selectionAsync();
                  onSelect(c);
                  setOpen(false);
                }}
                className={`flex-row items-center gap-3 px-4 py-3 ${selected === c ? 'bg-gray-50' : ''}`}>
                <View className="size-7 overflow-hidden rounded-full">
                  <CFlag width={28} height={28} />
                </View>
                <View>
                  <Text className="font-subtitle text-[14px] text-[#070914]">{c}</Text>
                  <Text className="font-body text-[12px] text-[#9CA3AF]">{CURRENCY_LABEL[c]}</Text>
                </View>
              </Pressable>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
}

// ─── Account details ────────────────────────────────────────────────────────
function AccountDetails({ account }: { account: VirtualAccount }) {
  const rails = account.payment_rails?.length
    ? account.payment_rails.map((r) => r.replace(/_/g, ' ').toUpperCase()).join(' · ')
    : null;

  const handleShare = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const lines = [
      `${account.currency} Account Details`,
      '',
      `Name: ${account.beneficiary_name || '—'}`,
      `Account Number: ${account.account_number || '—'}`,
      account.routing_number ? `Routing Number: ${account.routing_number}` : '',
      account.bank_name ? `Bank: ${account.bank_name}` : '',
      account.bank_address ? `Address: ${account.bank_address}` : '',
      rails ? `Payment Rails: ${rails}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    Share.share({ message: lines });
  }, [account, rails]);

  return (
    <Animated.View entering={FadeInDown.duration(350)} className="flex-1">
      <View className="px-6">
        {/* Divider card */}
        <View className="mt-2 rounded-2xl bg-[#F9FAFB] px-5">
          {account.beneficiary_name ? (
            <>
              <DetailRow label="Name" value={account.beneficiary_name} />
              <View className="h-px bg-[#E5E7EB]" />
            </>
          ) : null}

          <DetailRow label="Account number" value={account.account_number || '—'} />

          {account.routing_number ? (
            <>
              <View className="h-px bg-[#E5E7EB]" />
              <DetailRow label="Routing number (for wire and ACH)" value={account.routing_number} />
            </>
          ) : null}

          {account.bank_name ? (
            <>
              <View className="h-px bg-[#E5E7EB]" />
              <DetailRow label="Bank name" value={account.bank_name} />
            </>
          ) : null}

          {account.bank_address ? (
            <>
              <View className="h-px bg-[#E5E7EB]" />
              <DetailRow label="Address" value={account.bank_address} />
            </>
          ) : null}

          {rails ? (
            <>
              <View className="h-px bg-[#E5E7EB]" />
              <DetailRow label="Payment rails" value={rails} />
            </>
          ) : null}

          <View className="h-px bg-[#E5E7EB]" />
          <DetailRow label="Account type" value="Checking" />
        </View>

        {/* Share button */}
        <Pressable
          onPress={handleShare}
          className="mt-5 flex-row items-center justify-center gap-2 rounded-2xl bg-[#EEF2FF] py-4 active:opacity-80">
          <HugeiconsIcon icon={Share01Icon} size={18} color="#6366F1" />
          <Text className="font-subtitle text-[15px] text-[#6366F1]">Share details</Text>
        </Pressable>
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
      <Text className="mb-2 text-center font-subtitle text-[20px] text-[#070914]">
        No {currency} account yet
      </Text>
      <Text className="mb-8 text-center font-body text-[14px] leading-5 text-[#9CA3AF]">
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
        <View className="px-6 pt-4">
          <Skeleton className="mb-6 h-6 w-6 rounded-full" />
          <Skeleton className="mb-2 h-9 w-64" />
          <Skeleton className="h-4 w-48" />
        </View>
        <View className="mt-8 px-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="mb-3 h-16 w-full rounded-xl" />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-3">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6]"
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#070914" strokeWidth={2} />
        </Pressable>
        <CurrencyPicker selected={selectedCurrency} onSelect={setSelectedCurrency} />
      </View>

      {selectedAccount ? (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#000" />
          }>
          {/* Title */}
          <View className="px-6 pt-6">
            <Text className="font-heading text-[30px] leading-[36px] text-[#070914]">
              Add money to your{'\n'}
              {selectedCurrency} account
            </Text>
            <Text className="mt-2 font-body text-[15px] text-[#9CA3AF]">
              Make a transfer to your account details below
            </Text>
          </View>

          <View className="mt-4">
            <AccountDetails account={selectedAccount} />
          </View>
          <View className="h-10" />
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
