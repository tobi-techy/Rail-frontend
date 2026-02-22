import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Pressable } from 'react-native';
import React, { useLayoutEffect, useState, useCallback, useEffect, useMemo } from 'react';
import TransactionsEmptyIllustration from '@/assets/Illustrations/transactions-empty.svg';
import { router, useNavigation } from 'expo-router';
import { BalanceCard } from '@/components/molecules/BalanceCard';
import { StashCard } from '@/components/molecules/StashCard';
import {
  ArrowDown,
  PlusIcon,
  LayoutGrid,
  ChevronRight,
  Bell,
  MessageCircle,
} from 'lucide-react-native';
import { TransactionList } from '@/components/molecules/TransactionList';
import { FeedbackSheet } from '@/components/sheets/FeedbackSheet';import type { Transaction } from '@/components/molecules/TransactionItem';
import { useStation, useKYCStatus } from '@/api/hooks';
import { useDeposits, useWithdrawals } from '@/api/hooks/useFunding';
import type { ActivityItem, Deposit, Withdrawal } from '@/api/types';
import { Button } from '../../components/ui';
import {
  InvestmentDisclaimerSheet,
  CryptoReceiveSheet,
  KYCVerificationSheet,
  NavigableBottomSheet,
  useNavigableBottomSheet,
  type BottomSheetScreen,
} from '@/components/sheets';
import { TransactionDetailSheet } from '@/components/sheets/TransactionDetailSheet';
import { useAuthStore } from '@/stores/authStore';
import Avatar, { genConfig } from '@zamplyy/react-native-nice-avatar';
import { PhantomIcon, SolflareIcon, SolanaIcon } from '@/assets/svg';
import { BankIcon, CoinIcon, EarnIcon, AllocationIcon, CardIcon } from '@/assets/svg/filled';
import { VisaLogo } from '@/assets/svg';
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

type TransactionStatus = 'completed' | 'pending' | 'failed';
type WithdrawalListResponse = Withdrawal[] | { withdrawals?: Withdrawal[] } | undefined;

const STATUS_MAP: Record<string, TransactionStatus> = {
  completed: 'completed',
  confirmed: 'completed',
  success: 'completed',
  pending: 'pending',
  processing: 'pending',
  initiated: 'pending',
  awaiting_confirmation: 'pending',
  alpaca_debited: 'pending',
  bridge_processing: 'pending',
  onchain_transfer: 'pending',
  on_chain_transfer: 'pending',
  failed: 'failed',
  rejected: 'failed',
  cancelled: 'failed',
  canceled: 'failed',
  error: 'failed',
  reversed: 'failed',
  timeout: 'failed',
};

const normalizeStatus = (s?: string) => (s || '').toLowerCase().trim();

const depositToTx = (d: Deposit): Transaction => ({
  id: d.id,
  type: 'deposit',
  title: 'Deposit',
  subtitle: d.chain ? `${d.currency} · ${d.chain}` : d.currency,
  amount: parseFloat(d.amount) || 0,
  currency: d.currency,
  status: STATUS_MAP[normalizeStatus(d.status)] ?? 'pending',
  createdAt: new Date(d.created_at),
  txHash: d.tx_hash,
});

const withdrawalToTx = (w: Withdrawal): Transaction => ({
  id: w.id,
  type: 'withdraw',
  title: 'Withdrawal',
  subtitle: w.destination_chain ? `USD · ${w.destination_chain}` : 'USD',
  amount: parseFloat(w.amount) || 0,
  currency: 'USD',
  status: STATUS_MAP[normalizeStatus(w.status)] ?? 'pending',
  createdAt: new Date(w.created_at || w.updated_at || new Date().toISOString()),
  txHash: w.tx_hash,
});

const normalizeWithdrawals = (data: WithdrawalListResponse): Withdrawal[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.withdrawals ?? [];
};

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
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
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
  const deposits = useDeposits(10);
  const withdrawals = useWithdrawals(10);

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
      await Promise.all([
        refetch(),
        deposits.refetch(),
        withdrawals.refetch(),
        invalidateQueries.wallet(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, deposits, withdrawals]);

  const user = useAuthStore((s) => s.user);
  const avatarName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Rail User';
  const avatarConfig = useMemo(() => genConfig(avatarName), [avatarName]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerLeft: () => (
        <View className="flex-row items-center gap-x-3 pl-md">
          <Avatar size={36} {...avatarConfig} />
          <Text className="font-subtitle text-headline-1">Station</Text>
        </View>
      ),
      headerRight: () => (
        <View className="flex-row items-center gap-x-4 pr-md">
          <Pressable onPress={() => setShowFeedback(true)} hitSlop={8}>
            <MessageCircle size={22} color="#111" strokeWidth={1.8} />
          </Pressable>
          <Pressable hitSlop={8}>
            <Bell size={22} color="#111" strokeWidth={1.8} />
          </Pressable>
        </View>
      ),
      title: '',
      headerStyle: { backgroundColor: 'transparent' },
    });
  }, [navigation, avatarName, setShowFeedback]);

  // Derived display values
  const balance = fmt(station?.total_balance, '$00.00');
  const monthChange = fmtPct(station?.balance_trends?.spend?.month_change);
  const spend = splitDollars(station?.spend_balance ?? '0');
  const investTotal = parseMoney(station?.invest_balance);
  const brokerCash = parseMoney(station?.broker_cash);
  const stashOnly = Math.max(0, investTotal - brokerCash);
  const stash = splitDollars(stashOnly.toFixed(2));
  const transactions = useMemo(() => {
    const rows: Transaction[] = [
      ...(deposits.data?.deposits ?? []).map(depositToTx),
      ...normalizeWithdrawals(withdrawals.data as WithdrawalListResponse).map(withdrawalToTx),
    ];
    return rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 3);
  }, [deposits.data, withdrawals.data]);

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
      <View className="px-md pb-32">
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

        {/* Stash Cards */}
        <View className="mt-5 gap-3">
          <View className="flex-row gap-3">
            <StashCard
              title="Spend"
              amount={spend.dollars}
              amountCents={spend.cents}
              icon={<EarnIcon width={36} height={36} />}
              className="flex-1"
              // onPress={() => router.push('/spending-stash')}
            />
            <StashCard
              title="Stash"
              amount={stash.dollars}
              amountCents={stash.cents}
              icon={<AllocationIcon width={36} height={36} />}
              className="flex-1"
              // onPress={() => router.push('/investment-stash')}
            />
          </View>
          {/*<View className="flex-row gap-3">
            <StashCard
              title="Rail+ Card"
              amount="$0"
              amountCents=".00"
              icon={<VisaLogo color={'#fff'} width={36} height={24} />}
              className="flex-1"
              // onPress={() => router.push('/spending-stash/card' as any)}
            />
            <StashCard
              title="Rail+ Card"
              amount="$0"
              amountCents=".00"
              icon={<VisaLogo color={'#fff'} width={36} height={24} />}
              className="flex-1"
              // onPress={() => router.push('/spending-stash/card' as any)}
            />
          </View>*/}
        </View>

        {/* Transactions */}
        <View className="py-5">
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
            <TransactionList
              transactions={transactions}
              title="Recent Activity"
              onTransactionPress={setSelectedTransaction}
            />
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
      <TransactionDetailSheet
        visible={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
      />
      <FeedbackSheet visible={showFeedback} onClose={() => setShowFeedback(false)} />
    </ScrollView>
  );
};

export default Dashboard;
