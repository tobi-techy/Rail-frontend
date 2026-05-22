import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from '@/utils/platformHaptics';
import { useKYCStatus } from '@/api/hooks';
import { useVirtualAccounts } from '@/api/hooks/useVirtualAccount';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { Button } from '@/components/ui';
import { Skeleton } from '@/components/atoms/Skeleton';
import type { VirtualAccount } from '@/api/types/funding';
import CountryFlag from 'react-native-country-flag';
import { VirtualAccountIntroSheet } from '@/components/sheets/VirtualAccountIntroSheet';
import {
  ArrowLeft01Icon,
  ArrowDown01Icon,
  Copy01Icon,
  CheckmarkCircle02Icon,
  Share01Icon,
} from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';

type Currency = 'USD' | 'EUR';
const CURRENCIES: Currency[] = ['USD', 'EUR'];
const CURRENCY_ISO: Record<Currency, string> = {
  USD: 'US',
  EUR: 'EU',
};
const CURRENCY_LABEL: Record<Currency, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
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
        <Text className="font-body text-[13px] text-[#848281]">{label}</Text>
        <Text className="mt-1.5 font-subtitle text-[16px] text-[#343433]" selectable>
          {value}
        </Text>
      </View>
      {copied ? (
        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} color="#00ca48" />
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
  const flagCode = CURRENCY_ISO[selected];

  return (
    <View className="relative z-50">
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          setOpen(!open);
        }}
        className="flex-row items-center gap-2 rounded-full bg-[#f2f0ed] px-3 py-2">
        <View className="size-6 overflow-hidden rounded-full">
          <CountryFlag isoCode={flagCode} size={20} />
        </View>
        <Text className="font-subtitle text-[14px] text-[#343433]">{selected}</Text>
        <HugeiconsIcon icon={ArrowDown01Icon} size={14} color="#848281" />
      </Pressable>

      {open && (
        <Animated.View
          entering={FadeInDown.duration(150)}
          className="absolute right-0 top-12 min-w-[180px] rounded-2xl bg-parchment-card py-2"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.08,
            shadowRadius: 24,
            elevation: 8,
          }}>
          {CURRENCIES.map((c) => {
            const cFlagCode = CURRENCY_ISO[c];
            return (
              <Pressable
                key={c}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelect(c);
                  setOpen(false);
                }}
                className={`flex-row items-center gap-3 px-4 py-3 ${selected === c ? 'bg-stone-surface' : ''}`}>
                <View className="size-7 overflow-hidden rounded-full">
                  <CountryFlag isoCode={cFlagCode} size={22} />
                </View>
                <View>
                  <Text className="font-subtitle text-[14px] text-[#343433]">{c}</Text>
                  <Text className="font-body text-[12px] text-[#848281]">{CURRENCY_LABEL[c]}</Text>
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
        <View className="mt-2 rounded-2xl bg-[#f8f7f4] px-5">
          {account.beneficiary_name ? (
            <>
              <DetailRow label="Name" value={account.beneficiary_name} />
              <View className="h-px bg-[#f2f0ed]" />
            </>
          ) : null}

          <DetailRow label="Account number" value={account.account_number || '—'} />

          {account.routing_number ? (
            <>
              <View className="h-px bg-[#f2f0ed]" />
              <DetailRow label="Routing number (for wire and ACH)" value={account.routing_number} />
            </>
          ) : null}

          {account.bank_name ? (
            <>
              <View className="h-px bg-[#f2f0ed]" />
              <DetailRow label="Bank name" value={account.bank_name} />
            </>
          ) : null}

          {account.bank_address ? (
            <>
              <View className="h-px bg-[#f2f0ed]" />
              <DetailRow label="Address" value={account.bank_address} />
            </>
          ) : null}

          {rails ? (
            <>
              <View className="h-px bg-[#f2f0ed]" />
              <DetailRow label="Payment rails" value={rails} />
            </>
          ) : null}

          <View className="h-px bg-[#f2f0ed]" />
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
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="mb-5 size-20 items-center justify-center overflow-hidden rounded-full bg-stone-surface">
        <CountryFlag isoCode={CURRENCY_ISO[currency]} size={36} />
      </View>
      <Text className="mb-2 text-center font-subtitle text-[20px] text-[#343433]">
        No {currency} account yet
      </Text>
      <Text className="mb-8 text-center font-body text-[14px] leading-5 text-[#848281]">
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
      <SafeAreaView className="flex-1 bg-warm-canvas">
        <View className="px-6 pt-4">
          <Skeleton className="mb-6 h-6 w-6 rounded-full" />
          <Skeleton className="mb-2 h-9 w-64" />
          <Skeleton className="h-4 w-48" />
        </View>
        <View className="mt-8 px-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="mb-3 h-16 w-full rounded-lg" />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-warm-canvas">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-3">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="h-10 w-10 items-center justify-center rounded-full bg-[#f2f0ed]"
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#343433" strokeWidth={2} />
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
            <Text className="font-headline-1 text-[30px] leading-[36px] text-[#343433]">
              Add money to your{'\n'}
              {selectedCurrency} account
            </Text>
            <Text className="mt-2 font-body text-[15px] text-[#848281]">
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
