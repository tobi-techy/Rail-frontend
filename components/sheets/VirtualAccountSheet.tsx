import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, Share, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from '@/utils/platformHaptics';
import { GorhomBottomSheet } from './GorhomBottomSheet';
import { UsdIcon, EurIcon, NgnIcon } from '@/assets/svg';
import { VirtualAccountIntroSheet } from './VirtualAccountIntroSheet';
import { TierUpgradeSheet } from './TierUpgradeSheet';
import { Button } from '../ui';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useVirtualAccounts, useNgnVirtualAccount } from '@/api/hooks/useVirtualAccount';
import { useKYCStatus, useTierCapabilities } from '@/api/hooks';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import type { VirtualAccount, NgnVirtualAccount } from '@/api/types/funding';
import { Copy01Icon, CheckmarkCircle02Icon, Share01Icon } from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';

const CURRENCY_META: Record<string, { Icon: React.ComponentType<any>; label: string }> = {
  USD: { Icon: UsdIcon, label: 'US Dollar' },
  EUR: { Icon: EurIcon, label: 'Euro' },
  NGN: { Icon: NgnIcon, label: 'Nigerian Naira' },
};

function CopyRow({ label, value }: { label: string; value: string }) {
  const { showInfo } = useFeedbackPopup();
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(value);
    setCopied(true);
    showInfo('Copied', `${label} copied`);
    setTimeout(() => setCopied(false), 1500);
  }, [value, label, showInfo]);

  return (
    <Pressable
      onPress={handleCopy}
      className="flex-row items-center justify-between py-4 active:opacity-70">
      <View className="flex-1 pr-4">
        <Text className="font-body text-[13px] text-[#848281]">{label}</Text>
        <Text className="mt-1 font-subtitle text-[15px] text-[#343433]" selectable>
          {value}
        </Text>
      </View>
      {copied ? (
        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} color="#00ca48" />
      ) : (
        <HugeiconsIcon icon={Copy01Icon} size={18} color="#6366F1" />
      )}
    </Pressable>
  );
}

function AccountCard({ account }: { account: VirtualAccount }) {
  const rails = account.payment_rails?.length
    ? account.payment_rails.map((r) => r.replace(/_/g, ' ').toUpperCase()).join(' \u00b7 ')
    : null;

  const handleShare = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const lines = [
      `${account.currency} Account Details`,
      '',
      account.beneficiary_name ? `Name: ${account.beneficiary_name}` : '',
      `Account Number: ${account.account_number || '\u2014'}`,
      account.routing_number ? `Routing Number: ${account.routing_number}` : '',
      account.bank_name ? `Bank: ${account.bank_name}` : '',
      rails ? `Payment Rails: ${rails}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    Share.share({ message: lines });
  }, [account, rails]);

  return (
    <View>
      <Text className="mb-3 font-body text-[14px] text-[#848281]">
        Transfer to these details to fund your account
      </Text>
      <View className="rounded-2xl bg-[#f8f7f4] px-4">
        {account.beneficiary_name ? (
          <>
            <CopyRow label="Name" value={account.beneficiary_name} />
            <View className="h-px bg-[#f7f2e8]" />
          </>
        ) : null}
        <CopyRow label="Account number" value={account.account_number || '\u2014'} />
        {account.routing_number ? (
          <>
            <View className="h-px bg-[#f7f2e8]" />
            <CopyRow label="Routing number" value={account.routing_number} />
          </>
        ) : null}
        {account.bank_name ? (
          <>
            <View className="h-px bg-[#f7f2e8]" />
            <CopyRow label="Bank" value={account.bank_name} />
          </>
        ) : null}
        {account.bank_address ? (
          <>
            <View className="h-px bg-[#f7f2e8]" />
            <CopyRow label="Address" value={account.bank_address} />
          </>
        ) : null}
        {rails ? (
          <>
            <View className="h-px bg-[#f7f2e8]" />
            <CopyRow label="Payment rails" value={rails} />
          </>
        ) : null}
      </View>
      <Pressable
        onPress={handleShare}
        className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl bg-[#EEF2FF] py-3.5 active:opacity-80">
        <HugeiconsIcon icon={Share01Icon} size={18} color="#6366F1" />
        <Text className="font-subtitle text-[14px] text-[#6366F1]">Share details</Text>
      </Pressable>
    </View>
  );
}

interface VirtualAccountSheetProps {
  visible: boolean;
  onClose: () => void;
  currency: 'USD' | 'EUR' | 'NGN';
}

function NgnAccountCard({ account }: { account: NgnVirtualAccount }) {
  const isPending = account.status === 'pending';

  const handleShare = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const lines = [
      'NGN Account Details',
      '',
      account.beneficiary_name ? `Name: ${account.beneficiary_name}` : '',
      `Account Number: ${account.account_number || '\u2014'}`,
      account.bank_name ? `Bank: ${account.bank_name}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    Share.share({ message: lines });
  }, [account]);

  if (isPending) {
    return (
      <View className="items-center py-6">
        <ActivityIndicator size="small" color="#000" />
        <Text className="mt-4 text-center font-subtitle text-[16px] text-[#343433]">
          Setting up your Naira account
        </Text>
        <Text className="mt-1 text-center font-body text-[13px] text-[#848281]">
          This usually takes a moment. Check back shortly.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text className="mb-3 font-body text-[14px] text-[#848281]">
        Transfer to these details to fund your account
      </Text>
      <View className="rounded-2xl bg-[#f8f7f4] px-4">
        {account.beneficiary_name ? (
          <>
            <CopyRow label="Account name" value={account.beneficiary_name} />
            <View className="h-px bg-[#f7f2e8]" />
          </>
        ) : null}
        <CopyRow label="Account number" value={account.account_number || '\u2014'} />
        {account.bank_name ? (
          <>
            <View className="h-px bg-[#f7f2e8]" />
            <CopyRow label="Bank" value={account.bank_name} />
          </>
        ) : null}
      </View>
      <Pressable
        onPress={handleShare}
        className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl bg-[#EEF2FF] py-3.5 active:opacity-80">
        <HugeiconsIcon icon={Share01Icon} size={18} color="#6366F1" />
        <Text className="font-subtitle text-[14px] text-[#6366F1]">Share details</Text>
      </Pressable>
    </View>
  );
}

function NgnSheetBody() {
  const [showTierSheet, setShowTierSheet] = useState(false);
  const { capabilities, refetch } = useTierCapabilities();
  const canReceiveNgn = capabilities.can_receive_ngn;
  const {
    data: ngnResponse,
    isLoading,
    error: ngnError,
    refetch: refetchNgn,
  } = useNgnVirtualAccount(canReceiveNgn);
  const account = ngnResponse?.virtual_account;
  const meta = CURRENCY_META.NGN;

  return (
    <>
      <View className="mb-5 flex-row items-center gap-3">
        <View className="size-12 items-center justify-center overflow-hidden rounded-full">
          <meta.Icon width={48} height={48} />
        </View>
        <View>
          <Text className="font-subtitle text-[20px] text-[#343433]">NGN Account</Text>
          <Text className="font-body text-[13px] text-[#848281]">{meta.label}</Text>
        </View>
      </View>

      {canReceiveNgn && isLoading ? (
        <View className="items-center py-12">
          <ActivityIndicator size="small" color="#000" />
        </View>
      ) : canReceiveNgn && account ? (
        <NgnAccountCard account={account} />
      ) : ngnError && canReceiveNgn ? (
        <View className="items-center py-6">
          <Text className="mb-1 font-subtitle text-[17px] text-[#343433]">
            Couldn&apos;t load account
          </Text>
          <Text className="mb-6 text-center font-body text-[13px] text-[#848281]">
            Something went wrong fetching your Naira account details.
          </Text>
          <Button
            title="Try again"
            onPress={() => {
              refetchNgn();
            }}
            variant="orange"
          />
        </View>
      ) : (
        <View className="items-center py-6">
          <View className="mb-4 size-16 items-center justify-center overflow-hidden rounded-full">
            <meta.Icon width={64} height={64} />
          </View>
          <Text className="mb-1 font-subtitle text-[17px] text-[#343433]">
            Get your Naira account
          </Text>
          <Text className="mb-6 text-center font-body text-[13px] text-[#848281]">
            Verify your identity to receive Naira transfers into a named account.
          </Text>
          <Button
            title="Verify to continue"
            onPress={() => setShowTierSheet(true)}
            variant="orange"
          />
        </View>
      )}

      <TierUpgradeSheet
        visible={showTierSheet}
        onClose={() => setShowTierSheet(false)}
        onUpgraded={() => {
          setShowTierSheet(false);
          refetch();
          refetchNgn();
        }}
        mode="overview"
      />
    </>
  );
}

export function VirtualAccountSheet({ visible, onClose, currency }: VirtualAccountSheetProps) {
  const [showIntro, setShowIntro] = useState(false);
  const { data: kycStatus } = useKYCStatus();
  const isApproved = kycStatus?.status === 'approved';
  const {
    data: accountsData,
    isLoading,
    refetch,
  } = useVirtualAccounts(isApproved && currency !== 'NGN');
  const accounts = useMemo(() => accountsData?.virtual_accounts ?? [], [accountsData]);
  const account = useMemo(
    () => accounts.find((a) => a.currency === currency),
    [accounts, currency]
  );
  const meta = CURRENCY_META[currency] || CURRENCY_META.USD;

  if (currency === 'NGN') {
    return (
      <GorhomBottomSheet visible={visible} onClose={onClose}>
        <ErrorBoundary>
          <NgnSheetBody />
        </ErrorBoundary>
      </GorhomBottomSheet>
    );
  }

  return (
    <>
      <GorhomBottomSheet visible={visible} onClose={onClose}>
        <ErrorBoundary>
          {/* Header */}
          <View className="mb-5 flex-row items-center gap-3">
            <View className="size-12 items-center justify-center overflow-hidden rounded-full">
              <meta.Icon width={48} height={48} />
            </View>
            <View>
              <Text className="font-subtitle text-[20px] text-[#343433]">{currency} Account</Text>
              <Text className="font-body text-[13px] text-[#848281]">{meta.label}</Text>
            </View>
          </View>

          {isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="small" color="#000" />
            </View>
          ) : account ? (
            <AccountCard account={account} />
          ) : (
            <View className="items-center py-6">
              <View className="mb-4 size-16 items-center justify-center overflow-hidden rounded-full">
                <meta.Icon width={64} height={64} />
              </View>
              <Text className="mb-1 font-subtitle text-[17px] text-[#343433]">
                No {currency} account yet
              </Text>
              <Text className="mb-6 text-center font-body text-[13px] text-[#848281]">
                Create a virtual {meta.label} account to receive deposits.
              </Text>
              <Button
                title={`Create ${currency} Account`}
                onPress={() => setShowIntro(true)}
                variant="orange"
              />
            </View>
          )}
        </ErrorBoundary>
      </GorhomBottomSheet>

      <VirtualAccountIntroSheet
        visible={showIntro}
        onClose={() => setShowIntro(false)}
        currency={currency}
        onSuccess={() => {
          setShowIntro(false);
          refetch();
        }}
      />
    </>
  );
}
