import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { ArrowLeft, Copy, CheckCircle, Building2, ChevronRight } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useKYCStatus } from '@/api/hooks';
import { useVirtualAccounts } from '@/api/hooks/useVirtualAccount';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { Button } from '@/components/ui';
import { Skeleton } from '@/components/atoms/Skeleton';
import type { VirtualAccount } from '@/api/types/funding';

import { UsdIcon, EurIcon, GbpIcon } from '@/assets/svg';
import { VirtualAccountIntroSheet } from '@/components/sheets/VirtualAccountIntroSheet';

type Currency = 'USD' | 'EUR' | 'GBP';

const CURRENCY_ICON: Record<Currency, React.ReactNode> = {
  USD: <UsdIcon width={48} height={48} />,
  EUR: <EurIcon width={48} height={48} />,
  GBP: <GbpIcon width={48} height={48} />,
};

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
        className="flex-row items-center justify-between border-b border-gray-100 py-4">
        <View className="flex-1">
          <Text className="mb-0.5 font-body text-[12px] text-gray-400">{label}</Text>
          <Text className="font-subtitle text-[15px] text-gray-900">{value}</Text>
        </View>
        <Copy size={16} color="#9CA3AF" />
      </TouchableOpacity>
    </Animated.View>
  );
}

function AccountCard({ account }: { account: VirtualAccount }) {
  const isPending = account.status === 'pending';
  const currencyIcon = CURRENCY_ICON[account.currency as Currency];

  return (
    <Animated.View
      entering={FadeInDown.springify()}
      className="mb-4 rounded-3xl bg-gray-50 px-5 py-2">
      <View className="flex-row items-center border-b border-gray-100 py-4">
        <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
          {currencyIcon ?? <Building2 size={22} color="#9CA3AF" />}
        </View>
        <View className="flex-1">
          <Text className="font-subtitle text-[16px] text-gray-900">
            {account.currency} Account
          </Text>
          <Text className="font-body text-[13px] text-gray-400">
            {isPending ? 'Setting up…' : 'Ready for deposits'}
          </Text>
        </View>
        <View className={`rounded-full px-3 py-1 ${isPending ? 'bg-amber-100' : 'bg-green-100'}`}>
          <Text
            className={`font-body text-[12px] ${isPending ? 'text-amber-700' : 'text-green-700'}`}>
            {isPending ? 'Pending' : 'Active'}
          </Text>
        </View>
      </View>

      <DetailRow label="Bank Name" value={account.bank_name || 'Lead Bank'} />
      <DetailRow
        label="Account Holder"
        value={account.beneficiary_name || 'Rail Technologies Inc.'}
      />
      <DetailRow label="Account Number" value={account.account_number || '—'} />
      {account.routing_number ? (
        <DetailRow label="Routing Number" value={account.routing_number} />
      ) : null}
      <DetailRow label="Account Type" value="Checking" />
    </Animated.View>
  );
}

// ─── Accounts list screen ───────────────────────────────────────────────────
function AccountsScreen({
  accounts,
  isRefetching,
  refetch,
  onAddMore,
}: {
  accounts: VirtualAccount[];
  isRefetching: boolean;
  refetch: () => void;
  onAddMore: () => void;
}) {
  return (
    <ScrollView
      className="flex-1 px-5"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#000" />
      }>
      <Animated.View entering={FadeInDown.springify()} className="mb-6 items-center pt-4">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <CheckCircle size={32} color="#22C55E" />
        </View>
        <Text className="mb-1 font-subtitle text-xl text-gray-900">Account Ready</Text>
        <Text className="text-center font-body text-[14px] text-gray-500">
          Transfer funds to start your 70/30 split
        </Text>
      </Animated.View>

      {accounts.map((account) => (
        <AccountCard key={account.id} account={account} />
      ))}

      {/* Add another currency */}
      <TouchableOpacity
        onPress={onAddMore}
        className="mb-4 flex-row items-center justify-between rounded-3xl border border-dashed border-gray-200 px-5 py-4">
        <Text className="font-body text-[14px] text-gray-400">Add another currency account</Text>
        <ChevronRight size={18} color="#9CA3AF" />
      </TouchableOpacity>

      <View className="mb-4 flex-row rounded-2xl bg-blue-50 px-4 py-3">
        <Building2 size={18} color="#3B82F6" />
        <Text className="ml-3 flex-1 font-body text-[13px] leading-[19px] text-blue-700">
          Deposits typically arrive within 1–3 business days. Wire transfers may arrive same day.
        </Text>
      </View>
      <View className="h-8" />
    </ScrollView>
  );
}

// ─── Root ───────────────────────────────────────────────────────────────────
export default function VirtualAccountScreen() {
  const [showIntro, setShowIntro] = useState(false);
  const { data: kycStatus, isLoading: isKycLoading } = useKYCStatus();
  const isApproved = kycStatus?.status === 'approved';

  const {
    data: accountsData,
    refetch,
    isRefetching,
    isLoading: isAccountsLoading,
  } = useVirtualAccounts(isApproved);

  const accounts = accountsData?.virtual_accounts ?? [];
  const hasAccounts = accounts.length > 0;

  // Auto-show intro sheet when no accounts exist
  const [introShown, setIntroShown] = useState(false);
  React.useEffect(() => {
    if (!isAccountsLoading && !isKycLoading && !hasAccounts && !introShown) {
      setShowIntro(true);
      setIntroShown(true);
    }
  }, [isAccountsLoading, isKycLoading, hasAccounts, introShown]);

  if (isKycLoading || isAccountsLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center px-5 pb-2 pt-2">
          <View className="mr-4 h-6 w-6 rounded-full bg-surface" />
          <Skeleton className="h-5 w-36" />
        </View>
        <View className="flex-1 px-5 pt-4">
          <Skeleton className="mb-4 h-44 w-full rounded-2xl" />
          <Skeleton className="mb-3 h-4 w-28" />
          {Array.from({ length: 3 }).map((_, i) => (
            <View
              key={i}
              className="mb-3 flex-row items-center justify-between rounded-xl bg-surface px-4 py-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-5 pb-2 pt-2">
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} className="mr-4 p-1">
          <ArrowLeft size={24} color="#111" />
        </TouchableOpacity>
        <Text className="font-subtitle text-lg text-gray-900">Bank Accounts</Text>
      </View>

      {hasAccounts ? (
        <AccountsScreen
          accounts={accounts}
          isRefetching={isRefetching}
          refetch={refetch}
          onAddMore={() => setShowIntro(true)}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Building2 size={28} color="#9CA3AF" />
          </View>
          <Text className="mb-2 text-center font-subtitle text-lg text-gray-900">
            No accounts yet
          </Text>
          <Text className="mb-6 text-center font-body text-[14px] leading-5 text-gray-400">
            Create a virtual bank account to start receiving deposits.
          </Text>
          <Button title="Get Started" onPress={() => setShowIntro(true)} variant="black" />
        </View>
      )}

      <VirtualAccountIntroSheet
        visible={showIntro}
        onClose={() => setShowIntro(false)}
        onSuccess={() => {
          setShowIntro(false);
          refetch();
        }}
      />
    </SafeAreaView>
  );
}
