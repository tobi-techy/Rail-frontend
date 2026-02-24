import { View, Text, ScrollView, RefreshControl } from 'react-native';
import React, { useLayoutEffect, useState, useCallback, useEffect } from 'react';
import TransactionsEmptyIllustration from '@/assets/Illustrations/transactions-empty.svg';
import { router, useNavigation } from 'expo-router';
import { BalanceCard } from '@/components/molecules/BalanceCard';
import { StashCard } from '@/components/molecules/StashCard';
import { ArrowDown, PlusIcon, LayoutGrid } from 'lucide-react-native';
import { TransactionList } from '@/components/molecules/TransactionList';
import type { Transaction } from '@/components/molecules/TransactionItem';
import { useStation, useKYCStatus } from '@/api/hooks';
import type { ActivityItem } from '@/api/types';
import { Button } from '../../components/ui';
import {
  ActionSheet,
  InvestmentDisclaimerSheet,
  CryptoReceiveSheet,
  KYCVerificationSheet,
  MoreFundingOptionsSheet,
} from '@/components/sheets';
import { useAuthStore } from '@/stores/authStore';
import { BankIcon, CashIcon, CoinIcon, InvestmentIcon } from '@/assets/svg/filled';
import { invalidateQueries } from '@/api/queryClient';

// ── Helpers ──────────────────────────────────────────────

const fmt = (value: string | undefined, fallback = '$0.00') => {
  const n = parseFloat(value ?? '');
  return isNaN(n) ? fallback : `$${n.toFixed(2)}`;
};

const fmtPct = (value: string | undefined) => {
  const n = parseFloat(value ?? '');
  if (isNaN(n)) return '---%';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
};

const splitDollars = (value: string) => {
  const n = parseFloat(value ?? '');
  if (isNaN(n)) return { dollars: '$0', cents: '.00' };
  const [d, c] = n.toFixed(2).split('.');
  return { dollars: `$${d}`, cents: `.${c}` };
};

const parseMoney = (value: string | undefined) => {
  const n = parseFloat(value ?? '');
  return Number.isFinite(n) ? n : 0;
};

const VALID_ACTIVITY_TYPES = new Set(['send', 'receive', 'swap', 'deposit', 'withdraw']);

const mapActivity = (items: ActivityItem[]): Transaction[] =>
  items.map((a) => ({
    id: a.id,
    type: VALID_ACTIVITY_TYPES.has(a.type) ? (a.type as Transaction['type']) : 'deposit',
    title: a.description,
    subtitle: a.type,
    amount: parseFloat(a.amount) || 0,
    status: 'completed' as const,
    createdAt: new Date(a.created_at),
  }));

// ── Component ────────────────────────────────────────────

const Dashboard = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [showReceiveSheet, setShowReceiveSheet] = useState(false);
  const [showSendSheet, setShowSendSheet] = useState(false);
  const [showCryptoReceive, setShowCryptoReceive] = useState(false);
  const [showKYCSheet, setShowKYCSheet] = useState(false);
  const [moreOptionsMode, setMoreOptionsMode] = useState<'deposit' | 'send' | null>(null);

  // Disclaimer
  const hasAcknowledgedDisclaimer = useAuthStore((s) => s.hasAcknowledgedDisclaimer);
  const setHasAcknowledgedDisclaimer = useAuthStore((s) => s.setHasAcknowledgedDisclaimer);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    if (!hasAcknowledgedDisclaimer) {
      const timer = setTimeout(() => setShowDisclaimer(true), 500);
      return () => clearTimeout(timer);
    }
  }, [hasAcknowledgedDisclaimer]);

  const handleAcceptDisclaimer = () => {
    setHasAcknowledgedDisclaimer(true);
    setShowDisclaimer(false);
  };

  // Station data
  const { data: station, refetch } = useStation();

  // KYC — prefetch so fiat button responds instantly
  const { data: kycStatus } = useKYCStatus();

  const handleFiatPress = useCallback(() => {
    setShowReceiveSheet(false);
    if (kycStatus?.status === 'approved') {
      router.push('/virtual-account' as any);
    } else {
      setShowKYCSheet(true);
    }
  }, [kycStatus]);

  const startWithdrawalFlow = useCallback(
    (method: 'fiat' | 'crypto') => {
      if (method === 'fiat' && kycStatus?.status !== 'approved') {
        setShowSendSheet(false);
        setShowReceiveSheet(false);
        setShowKYCSheet(true);
        return;
      }

      setShowSendSheet(false);
      setShowReceiveSheet(false);

      // Let bottom sheet dismissal settle before route transition.
      requestAnimationFrame(() => {
        router.push(`/withdraw/${method}` as any);
      });
    },
    [kycStatus?.status]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), invalidateQueries.wallet()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerLeft: () => (
        <View className="flex-row items-center gap-x-3 pl-md">
          <Text className="font-subtitle text-headline-1">Station</Text>
        </View>
      ),
      title: '',
      headerStyle: { backgroundColor: 'transparent' },
    });
  }, [navigation]);

  // Derived display values
  const balance = fmt(station?.total_balance, '$00.00');
  const monthChange = fmtPct(station?.balance_trends?.spend?.month_change);
  const spend = splitDollars(station?.spend_balance ?? '0');
  const investTotal = parseMoney(station?.invest_balance);
  const brokerCash = parseMoney(station?.broker_cash);
  const stashOnly = Math.max(0, investTotal - brokerCash);
  const stash = splitDollars(stashOnly.toFixed(2));
  const invest = splitDollars(investTotal.toFixed(2));
  const transactions = station?.recent_activity ? mapActivity(station.recent_activity) : [];

  return (
    <ScrollView
      className="min-h-screen flex-1"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
      }>
      <View className="px-md">
        {/* Balance */}
        <BalanceCard
          balance={balance}
          percentChange={monthChange}
          timeframe="Last 30d"
          className="rounded-x"
        />

        <View className="mb-2 flex-row gap-3">
          <Button
            title="Receive"
            onPress={() => setShowReceiveSheet(true)}
            leftIcon={<PlusIcon size={24} color="white" />}
            size="small"
            variant="black"
          />
          <Button
            title="Send"
            onPress={() => setShowSendSheet(true)}
            leftIcon={<ArrowDown size={24} color="black" />}
            size="small"
            variant="white"
          />
        </View>

        {/* Stash Cards — disabled until feature is complete */}

        <View className="mt-5 flex-row gap-3">
          <StashCard
            title="Spending Stash"
            amount={spend.dollars}
            amountCents={spend.cents}
            icon={<CashIcon width={40} height={40} color="white" />}
            className="flex-1"
            onPress={() => router.push('/spending-stash')}
          />
          <StashCard
            title="Investment Stash"
            amount={stash.dollars}
            amountCents={stash.cents}
            icon={<InvestmentIcon width={40} height={40} color="white" />}
            className="flex-1"
            onPress={() => router.push('/investment-stash')}
          />
        </View>

        {/* Transactions */}
        <View className="rounded-3xl py-5">
          {transactions.length === 0 ? (
            <View className="items-center justify-center rounded-3xl bg-white px-5 py-8">
              <TransactionsEmptyIllustration width={220} height={140} />
              <Text className="mt-4 text-center font-subtitle text-headline-2 text-gray-900">
                No transactions yet
              </Text>
              <Text className="mt-2 text-center font-body text-base text-gray-500">
                Your activity will show up here once you receive or send funds.
              </Text>
            </View>
          ) : (
            <TransactionList title="Recent Activity" transactions={transactions} />
          )}
        </View>
      </View>

      {/* Receive Sheet */}
      <ActionSheet
        visible={showReceiveSheet}
        onClose={() => setShowReceiveSheet(false)}
        title="Add Funds"
        subtitle={'Choose one of the options\nbelow to add funds'}
        actions={[
          {
            id: 'fiat',
            label: 'Fiat',
            sublabel: 'Receive assets via US bank account',
            icon: <BankIcon width={32} height={32} color="#6366F1" />,
            iconBgColor: '',
            onPress: handleFiatPress,
          },
          {
            id: 'crypto',
            label: 'Crypto',
            sublabel: 'Receive assets via wallet address',
            icon: <CoinIcon width={32} height={32} color="#6366F1" />,
            iconColor: '#F97316',
            iconBgColor: '',
            onPress: () => setShowCryptoReceive(true),
          },
          {
            id: 'more',
            label: 'More Options',
            sublabel: 'Pick from several other options to fund account',
            icon: <LayoutGrid width={28} height={28} color="#6366F1" />,
            iconBgColor: '',
            onPress: () => {
              setShowReceiveSheet(false);
              setMoreOptionsMode('deposit');
            },
          },
        ]}
      />

      {/* Send Sheet */}
      <ActionSheet
        visible={showSendSheet}
        onClose={() => setShowSendSheet(false)}
        title="Send Funds"
        subtitle={'Choose one of the options\nbelow to send funds'}
        actions={[
          {
            id: 'fiat',
            label: 'Fiat',
            sublabel: 'Send to US bank account',
            icon: <BankIcon width={28} height={28} color="#6366F1" />,
            iconBgColor: '',
            onPress: () => startWithdrawalFlow('fiat'),
          },
          {
            id: 'crypto',
            label: 'To Wallet',
            sublabel: 'Send to wallet address',
            icon: <CoinIcon width={32} height={32} color="#6366F1" />,
            iconColor: '#F97316',
            iconBgColor: '',
            onPress: () => startWithdrawalFlow('crypto'),
          },
          {
            id: 'more',
            label: 'More Options',
            sublabel: 'Pick from several other options to send funds out',
            icon: <LayoutGrid width={28} height={28} color="#6366F1" />,
            iconBgColor: '',
            onPress: () => {
              setShowSendSheet(false);
              setMoreOptionsMode('send');
            },
          },
        ]}
      />

      {/* KYC Verification Sheet */}
      <KYCVerificationSheet
        visible={showKYCSheet}
        onClose={() => setShowKYCSheet(false)}
        kycStatus={kycStatus}
      />

      <InvestmentDisclaimerSheet visible={showDisclaimer} onAccept={handleAcceptDisclaimer} />
      <CryptoReceiveSheet visible={showCryptoReceive} onClose={() => setShowCryptoReceive(false)} />
      <MoreFundingOptionsSheet
        visible={moreOptionsMode !== null}
        onClose={() => setMoreOptionsMode(null)}
        mode={moreOptionsMode ?? 'deposit'}
      />
    </ScrollView>
  );
};

export default Dashboard;
