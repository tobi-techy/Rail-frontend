import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Copy,
  Building2,
  CheckCircle,
  ShieldAlert,
  DollarSign,
  Euro,
  AlertCircle,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useKYCStatus } from '@/api/hooks';
import { useVirtualAccounts } from '@/api/hooks/useVirtualAccount';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui';
import { KYCVerificationSheet } from '@/components/sheets';
import type { VirtualAccount } from '@/api/types/funding';

function DetailRow({ label, value }: { label: string; value: string }) {
  const { showInfo } = useFeedbackPopup();

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(value);
    showInfo('Copied', `${label} copied to clipboard`);
  }, [value, label, showInfo]);

  return (
    <TouchableOpacity
      onPress={handleCopy}
      activeOpacity={0.7}
      className="flex-row items-center justify-between border-b border-gray-100 py-4 last:border-b-0">
      <View className="flex-1">
        <Text className="mb-1 font-body text-[13px] text-gray-400">{label}</Text>
        <Text className="font-subtitle text-[16px] text-gray-900">{value}</Text>
      </View>
      <Copy size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

function AccountCard({ account }: { account: VirtualAccount }) {
  const isUSD = account.currency === 'USD';
  const CurrencyIcon = isUSD ? DollarSign : Euro;
  const isPending = account.status === 'pending';

  return (
    <View className="mb-4 rounded-3xl bg-gray-50 px-5 py-2">
      {/* Currency header */}
      <View className="flex-row items-center border-b border-gray-100 py-4">
        <View
          className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${isUSD ? 'bg-green-100' : 'bg-blue-100'}`}>
          <CurrencyIcon size={20} color={isUSD ? '#22C55E' : '#3B82F6'} />
        </View>
        <View className="flex-1">
          <Text className="font-subtitle text-[16px] text-gray-900">
            {account.currency} Account
          </Text>
          <Text className="font-body text-[13px] text-gray-500">
            {isPending ? 'Setting up...' : 'Ready for deposits'}
          </Text>
        </View>
        {isPending ? (
          <View className="rounded-full bg-amber-100 px-3 py-1">
            <Text className="font-body text-[12px] text-amber-700">Pending</Text>
          </View>
        ) : (
          <View className="rounded-full bg-green-100 px-3 py-1">
            <Text className="font-body text-[12px] text-green-700">Active</Text>
          </View>
        )}
      </View>

      {/* Account details */}
      <DetailRow label="Bank Name" value={account.bank_name || 'Lead Bank'} />
      <DetailRow
        label="Account Holder"
        value={account.beneficiary_name || 'Rail Technologies Inc.'}
      />
      <DetailRow label="Account Number" value={account.account_number || '—'} />
      {account.routing_number && (
        <DetailRow label="Routing Number" value={account.routing_number} />
      )}
      <DetailRow label="Account Type" value="Checking" />
    </View>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <AlertCircle size={32} color="#9CA3AF" />
      </View>
      <Text className="mb-2 font-subtitle text-xl text-gray-900">No Accounts Yet</Text>
      <Text className="text-center font-body text-sm text-gray-500">
        Your bank accounts are being set up. This usually takes a few moments after verification.
      </Text>
    </View>
  );
}

export default function VirtualAccountScreen() {
  const [showKYCSheet, setShowKYCSheet] = useState(false);
  const { data: kycStatus, isLoading: isKycLoading } = useKYCStatus();
  const {
    data: accountsData,
    refetch,
    isRefetching,
    isLoading: isAccountsLoading,
  } = useVirtualAccounts(kycStatus?.status === 'approved');

  const isApproved = kycStatus?.status === 'approved';
  const accounts = accountsData?.virtual_accounts ?? [];
  const hasAccounts = accounts.length > 0;

  // Loading state
  if (isKycLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  // KYC not approved - show verification prompt
  if (!isApproved) {
    return (
      <>
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center px-5 pb-4 pt-2">
            <TouchableOpacity onPress={() => router.back()} hitSlop={12} className="mr-4 p-1">
              <ArrowLeft size={24} color="#111" />
            </TouchableOpacity>
            <Text className="font-subtitle text-lg text-gray-900">Bank Account</Text>
          </View>
          <View className="flex-1 items-center justify-center px-6">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-amber-50">
              <ShieldAlert size={32} color="#F59E0B" />
            </View>
            <Text className="mb-2 font-subtitle text-xl text-gray-900">Verification Required</Text>
            <Text className="mb-8 text-center font-body text-sm text-gray-500">
              Complete identity verification to access your bank account details.
            </Text>
            <Button title="Start Verification" onPress={() => setShowKYCSheet(true)} />
          </View>
        </SafeAreaView>

        <KYCVerificationSheet
          visible={showKYCSheet}
          onClose={() => setShowKYCSheet(false)}
          kycStatus={kycStatus}
        />
      </>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center px-5 pb-4 pt-2">
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} className="mr-4 p-1">
            <ArrowLeft size={24} color="#111" />
          </TouchableOpacity>
          <Text className="font-subtitle text-lg text-gray-900">Bank Accounts</Text>
        </View>

        {isAccountsLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#000" />
            <Text className="mt-4 font-body text-sm text-gray-500">Loading accounts...</Text>
          </View>
        ) : !hasAccounts ? (
          <EmptyState />
        ) : (
          <ScrollView
            className="flex-1 px-5"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#000" />
            }>
            {/* Status badge */}
            <View className="mb-6 items-center pt-4">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-green-50">
                <CheckCircle size={32} color="#22C55E" />
              </View>
              <Text className="mb-1 font-subtitle text-xl text-gray-900">Accounts Ready</Text>
              <Text className="text-center font-body text-[14px] text-gray-500">
                Transfer funds to these accounts to fund your Rail wallet
              </Text>
            </View>

            {/* Account cards */}
            {accounts.map((account: VirtualAccount) => (
              <AccountCard key={account.id} account={account} />
            ))}

            {/* Info note */}
            <View className="mt-2 flex-row rounded-2xl bg-blue-50 px-4 py-3">
              <Building2 size={18} color="#3B82F6" className="mt-0.5" />
              <Text className="ml-3 flex-1 font-body text-[13px] leading-[19px] text-blue-700">
                Deposits typically arrive within 1–3 business days. Wire transfers may arrive same
                day.
              </Text>
            </View>

            <View className="h-8" />
          </ScrollView>
        )}
      </SafeAreaView>
    </ErrorBoundary>
  );
}
