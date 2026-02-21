import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import React, { useLayoutEffect, useState, useCallback, useEffect, useMemo } from 'react';
import TransactionsEmptyIllustration from '@/assets/Illustrations/transactions-empty.svg';
import { router, useNavigation } from 'expo-router';
import { BalanceCard } from '@/components/molecules/BalanceCard';
import { StashCard } from '@/components/molecules/StashCard';
import { ArrowDown, PlusIcon, LayoutGrid, ChevronRight } from 'lucide-react-native';
import { TransactionList } from '@/components/molecules/TransactionList';
import type { Transaction } from '@/components/molecules/TransactionItem';
import { useStation, useKYCStatus } from '@/api/hooks';
import type { ActivityItem } from '@/api/types';
import { Button } from '../../components/ui';
import {
  InvestmentDisclaimerSheet,
  CryptoReceiveSheet,
  KYCVerificationSheet,
  NavigableBottomSheet,
  useNavigableBottomSheet,
  type BottomSheetScreen,
} from '@/components/sheets';
import { useAuthStore } from '@/stores/authStore';
import { PhantomIcon, SolflareIcon, SolanaIcon } from '@/assets/svg';
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

const mapActivity = (items: ActivityItem[], currency?: string): Transaction[] =>
  items.map((a) => ({
    id: a.id,
    type: VALID_ACTIVITY_TYPES.has(a.type) ? (a.type as Transaction['type']) : 'deposit',
    title: a.description,
    subtitle: a.type,
    amount: parseFloat(a.amount) || 0,
    currency: currency?.toUpperCase(),
    status: 'completed' as const,
    createdAt: new Date(a.created_at),
  }));

interface FundingActionItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  onPress: () => void;
}

function FundingOptionsList({ actions }: { actions: FundingActionItem[] }) {
  return (
    <ScrollView
      scrollEnabled={actions.length > 6}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 4 }}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          className="flex-row items-center justify-between rounded-2xl px-0 py-3.5 active:bg-gray-50"
          onPress={action.onPress}
          activeOpacity={0.6}>
          <View className="flex-1 flex-row items-center">
            <View className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-gray-100">
              {action.icon}
            </View>
            <View className="flex-1">
              <Text className="font-subtitle text-base text-text-primary">{action.label}</Text>
              {action.sublabel && (
                <Text className="mt-0.5 font-caption text-[12px] text-text-secondary">
                  {action.sublabel}
                </Text>
              )}
            </View>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ── Component ────────────────────────────────────────────

const Dashboard = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [showReceiveSheet, setShowReceiveSheet] = useState(false);
  const [showSendSheet, setShowSendSheet] = useState(false);
  const [showCryptoReceive, setShowCryptoReceive] = useState(false);
  const [showKYCSheet, setShowKYCSheet] = useState(false);
  const receiveSheetNavigation = useNavigableBottomSheet('receive-main');
  const sendSheetNavigation = useNavigableBottomSheet('send-main');
  const { navigateTo: navigateReceiveTo, reset: resetReceiveSheet } = receiveSheetNavigation;
  const { navigateTo: navigateSendTo, reset: resetSendSheet } = sendSheetNavigation;

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

  const handleReceiveCryptoPress = useCallback(() => {
    setShowReceiveSheet(false);
    setShowCryptoReceive(true);
  }, []);

  const handleCloseReceiveSheet = useCallback(() => {
    setShowReceiveSheet(false);
  }, []);

  const handleCloseSendSheet = useCallback(() => {
    setShowSendSheet(false);
  }, []);

  useEffect(() => {
    if (!showReceiveSheet) {
      resetReceiveSheet('receive-main');
    }
  }, [showReceiveSheet, resetReceiveSheet]);

  useEffect(() => {
    if (!showSendSheet) {
      resetSendSheet('send-main');
    }
  }, [showSendSheet, resetSendSheet]);

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
  const transactions = station?.recent_activity
    ? mapActivity(station.recent_activity, station.currency)
    : [];

  const receiveMainActions = useMemo<FundingActionItem[]>(
    () => [
      {
        id: 'fiat',
        label: 'Fiat',
        sublabel: 'Receive assets via US bank account',
        icon: <BankIcon width={32} height={32} color="#6366F1" />,
        onPress: handleFiatPress,
      },
      {
        id: 'crypto',
        label: 'Crypto',
        sublabel: 'Receive assets via wallet address',
        icon: <CoinIcon width={32} height={32} color="#6366F1" />,
        onPress: handleReceiveCryptoPress,
      },
      {
        id: 'more',
        label: 'More Options',
        sublabel: 'Pick from several other options to fund account',
        icon: <LayoutGrid width={28} height={28} color="#6366F1" />,
        onPress: () => navigateReceiveTo('receive-more'),
      },
    ],
    [handleFiatPress, handleReceiveCryptoPress, navigateReceiveTo]
  );

  const receiveMoreActions = useMemo<FundingActionItem[]>(
    () => [
      {
        id: 'phantom',
        label: 'Phantom',
        sublabel: 'Connect Phantom wallet',
        icon: <PhantomIcon width={28} height={28} />,
        onPress: handleCloseReceiveSheet,
      },
      {
        id: 'solflare',
        label: 'Solflare',
        sublabel: 'Connect Solflare wallet',
        icon: <SolflareIcon width={28} height={28} />,
        onPress: handleCloseReceiveSheet,
      },
      {
        id: 'solana-pay',
        label: 'Solana Pay',
        sublabel: 'Pay with Solana Pay',
        icon: <SolanaIcon width={28} height={28} />,
        onPress: handleCloseReceiveSheet,
      },
      {
        id: 'wire',
        label: 'Wire Transfer',
        sublabel: 'Receive via wire transfer',
        icon: <BankIcon width={28} height={28} color="#6366F1" />,
        onPress: handleCloseReceiveSheet,
      },
    ],
    [handleCloseReceiveSheet]
  );

  const sendMainActions = useMemo<FundingActionItem[]>(
    () => [
      {
        id: 'fiat',
        label: 'Fiat',
        sublabel: 'Send to US bank account',
        icon: <BankIcon width={28} height={28} color="#6366F1" />,
        onPress: () => startWithdrawalFlow('fiat'),
      },
      {
        id: 'crypto',
        label: 'To Wallet',
        sublabel: 'Send to wallet address',
        icon: <CoinIcon width={32} height={32} color="#6366F1" />,
        onPress: () => startWithdrawalFlow('crypto'),
      },
      {
        id: 'more',
        label: 'More Options',
        sublabel: 'Pick from several other options to send funds out',
        icon: <LayoutGrid width={28} height={28} color="#6366F1" />,
        onPress: () => navigateSendTo('send-more'),
      },
    ],
    [navigateSendTo, startWithdrawalFlow]
  );

  const sendMoreActions = useMemo<FundingActionItem[]>(
    () => [
      {
        id: 'phantom',
        label: 'Phantom',
        sublabel: 'Send using Phantom wallet',
        icon: <PhantomIcon width={28} height={28} />,
        onPress: handleCloseSendSheet,
      },
      {
        id: 'solflare',
        label: 'Solflare',
        sublabel: 'Send using Solflare wallet',
        icon: <SolflareIcon width={28} height={28} />,
        onPress: handleCloseSendSheet,
      },
      {
        id: 'solana-pay',
        label: 'Solana Pay',
        sublabel: 'Send with Solana Pay',
        icon: <SolanaIcon width={28} height={28} />,
        onPress: handleCloseSendSheet,
      },
      {
        id: 'wire',
        label: 'Wire Transfer',
        sublabel: 'Send through wire transfer',
        icon: <BankIcon width={28} height={28} color="#6366F1" />,
        onPress: handleCloseSendSheet,
      },
    ],
    [handleCloseSendSheet]
  );

  const receiveScreens = useMemo<BottomSheetScreen[]>(
    () => [
      {
        id: 'receive-main',
        title: 'Add Funds',
        subtitle: 'Choose one of the options\nbelow to add funds',
        component: <FundingOptionsList actions={receiveMainActions} />,
      },
      {
        id: 'receive-more',
        title: 'More deposit options',
        component: <FundingOptionsList actions={receiveMoreActions} />,
      },
    ],
    [receiveMainActions, receiveMoreActions]
  );

  const sendScreens = useMemo<BottomSheetScreen[]>(
    () => [
      {
        id: 'send-main',
        title: 'Send Funds',
        subtitle: 'Choose one of the options\nbelow to send funds',
        component: <FundingOptionsList actions={sendMainActions} />,
      },
      {
        id: 'send-more',
        title: 'More send options',
        component: <FundingOptionsList actions={sendMoreActions} />,
      },
    ],
    [sendMainActions, sendMoreActions]
  );

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
      <NavigableBottomSheet
        visible={showReceiveSheet}
        onClose={handleCloseReceiveSheet}
        screens={receiveScreens}
        navigation={receiveSheetNavigation}
      />

      {/* Send Sheet */}
      <NavigableBottomSheet
        visible={showSendSheet}
        onClose={handleCloseSendSheet}
        screens={sendScreens}
        navigation={sendSheetNavigation}
      />

      {/* KYC Verification Sheet */}
      <KYCVerificationSheet
        visible={showKYCSheet}
        onClose={() => setShowKYCSheet(false)}
        kycStatus={kycStatus}
      />

      <InvestmentDisclaimerSheet visible={showDisclaimer} onAccept={handleAcceptDisclaimer} />
      <CryptoReceiveSheet visible={showCryptoReceive} onClose={() => setShowCryptoReceive(false)} />
    </ScrollView>
  );
};

export default Dashboard;
