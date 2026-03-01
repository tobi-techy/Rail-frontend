import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native';
import React, { useLayoutEffect, useState, useCallback, useEffect, useMemo } from 'react';
import { router, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import {
  ArrowDownLeft,
  ArrowUpRight,
  LayoutGrid,
  ChevronRight,
  MessageCircle,
  Landmark,
  Wallet,
} from 'lucide-react-native';
import Avatar, { genConfig } from '@zamplyy/react-native-nice-avatar';

import TransactionsEmptyIllustration from '@/assets/Illustrations/transactions-empty.svg';
import { PhantomIcon, SolflareIcon, SolanaIcon } from '@/assets/svg';
import { EarnIcon, AllocationIcon } from '@/assets/svg/filled';
import { BalanceCard } from '@/components/molecules/BalanceCard';
import { StashCard } from '@/components/molecules/StashCard';
import { FeatureBanner } from '@/components/molecules/FeatureBanner';
import { TransactionList } from '@/components/molecules/TransactionList';
import { NotificationBell } from '@/components/molecules/NotificationBell';
import { Button } from '@/components/ui';
import {
  InvestmentDisclaimerSheet,
  KYCVerificationSheet,
  NavigableBottomSheet,
  useNavigableBottomSheet,
  type BottomSheetScreen,
} from '@/components/sheets';
import { TransactionDetailSheet } from '@/components/sheets/TransactionDetailSheet';
import { SolanaPayScanSheet } from '@/components/sheets/SolanaPayScanSheet';import { useStation, useKYCStatus } from '@/api/hooks';
import { useDeposits, useWithdrawals } from '@/api/hooks/useFunding';
import type { Deposit, Withdrawal } from '@/api/types';
import {
  normalizeWithdrawals,
  depositToTransaction,
  withdrawalToTransaction,
} from '@/utils/transactionNormalizer';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores';
import type { Currency } from '@/stores/uiStore';
import { invalidateQueries } from '@/api/queryClient';
import { convertFromUsd, formatCurrencyAmount, type FxRates } from '@/utils/currency';
import gleap from '@/utils/gleap';
import type { Transaction } from '@/components/molecules/TransactionItem';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (value: string | undefined, currency: Currency, rates: FxRates, fallback = '---') => {
  const n = parseFloat(value ?? '');
  return isNaN(n) ? fallback : formatCurrencyAmount(convertFromUsd(n, currency, rates), currency);
};

const fmtPct = (value: string | undefined) => {
  const n = parseFloat(value ?? '');
  if (isNaN(n)) return '---%';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
};

const splitDollars = (value: string, currency: Currency, rates: FxRates) => {
  const n = parseFloat(value ?? '');
  if (isNaN(n)) return { dollars: formatCurrencyAmount(0, currency), cents: '' };
  const formatted = formatCurrencyAmount(convertFromUsd(n, currency, rates), currency);
  const match = formatted.match(/^(.+?)([.,]\d{2})$/);
  return match ? { dollars: match[1], cents: match[2] } : { dollars: formatted, cents: '' };
};


// ── FundingOptionsList ────────────────────────────────────────────────────────

interface FundingAction {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  onPress: () => void;
  comingSoon?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function FundingRow({ action, isLast }: { action: FundingAction; isLast: boolean }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      style={animStyle}
      className={`flex-row items-center justify-between py-3.5${isLast ? '' : ' border-b border-gray-100'}`}
      onPress={action.comingSoon ? undefined : action.onPress}
      onPressIn={() => { if (!action.comingSoon) scale.value = withSpring(0.97, { damping: 20, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 20, stiffness: 300 }); }}
      disabled={action.comingSoon}>
      <View className={`flex-1 flex-row items-center${action.comingSoon ? ' opacity-40' : ''}`}>
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
      {action.comingSoon ? (
        <View className="rounded-full bg-gray-100 px-2 py-0.5">
          <Text className="font-caption text-[11px] text-gray-400">Soon</Text>
        </View>
      ) : (
        <ChevronRight size={20} color="#9CA3AF" />
      )}
    </AnimatedPressable>
  );
}

function FundingOptionsList({ actions }: { actions: FundingAction[] }) {
  return (
    <View style={{ paddingBottom: 4 }}>
      {actions.map((action, i) => (
        <FundingRow key={action.id} action={action} isLast={i === actions.length - 1} />
      ))}
    </View>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === 'android';
  const navigation = useNavigation();

  const [refreshing, setRefreshing] = useState(false);
  const [showReceiveSheet, setShowReceiveSheet] = useState(false);
  const [showSendSheet, setShowSendSheet] = useState(false);
  const [showSolanaPayScan, setShowSolanaPayScan] = useState(false);
  const [showKYCSheet, setShowKYCSheet] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const receiveNav = useNavigableBottomSheet('receive-main');
  const sendNav = useNavigableBottomSheet('send-main');

  // Disclaimer
  const hasAcknowledgedDisclaimer = useAuthStore((s) => s.hasAcknowledgedDisclaimer);
  const setHasAcknowledgedDisclaimer = useAuthStore((s) => s.setHasAcknowledgedDisclaimer);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    if (hasAcknowledgedDisclaimer) return;
    const t = setTimeout(() => setShowDisclaimer(true), 500);
    return () => clearTimeout(t);
  }, [hasAcknowledgedDisclaimer]);

  // Data
  const { data: station, refetch, isPending: isStationPending } = useStation();
  const deposits = useDeposits(10);
  const withdrawals = useWithdrawals(10);
  const { data: kycStatus } = useKYCStatus();

  const userFirstName = useAuthStore((s) => s.user?.firstName);
  const userLastName = useAuthStore((s) => s.user?.lastName);
  const userEmail = useAuthStore((s) => s.user?.email);
  const selectedCurrency = useUIStore((s) => s.currency);
  const currencyRates = useUIStore((s) => s.currencyRates);

  const avatarName = useMemo(
    () => [userFirstName, userLastName].filter(Boolean).join(' ') || userEmail || 'Rail User',
    [userFirstName, userLastName, userEmail]
  );
  const avatarConfig = useMemo(() => {
    // Derive deterministic avatar config from name string
    let hash = 0;
    for (let i = 0; i < avatarName.length; i++) {
      hash = (hash * 31 + avatarName.charCodeAt(i)) >>> 0;
    }
    const pick = <T,>(arr: T[]): T => arr[(hash = (hash * 1664525 + 1013904223) >>> 0, hash % arr.length)];
    return genConfig({
      sex: pick(['man', 'woman'] as const),
      faceColor: pick(['#F9C9B6', '#AC6651', '#FDDBB4', '#D08B5B', '#EDB98A']),
      hairStyle: pick(['normal', 'thick', 'mohawk', 'womanLong', 'womanShort'] as const),
      hairColor: pick(['#000', '#FC909F', '#77311D', '#D2EFF3', '#506AF4']),
      bgColor: pick(['#FFEDEF', '#E0DDFF', '#D2EFF3', '#FFEDEF', '#F4D150']),
    });
  }, [avatarName]);

  // Reset sheet nav on close
  useEffect(() => {
    if (!showReceiveSheet) receiveNav.reset('receive-main');
  }, [showReceiveSheet, receiveNav]);
  useEffect(() => {
    if (!showSendSheet) sendNav.reset('send-main');
  }, [showSendSheet, sendNav]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        deposits.refetch(),
        withdrawals.refetch(),
        invalidateQueries.station(),
        invalidateQueries.funding(),
        invalidateQueries.allocation(),
        invalidateQueries.wallet(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, deposits, withdrawals]);

  useEffect(() => {
    return navigation.addListener('focus', () => {
      void refetch();
      void deposits.refetch();
      void withdrawals.refetch();
      void invalidateQueries.station();
      void invalidateQueries.wallet();
    });
  }, [navigation, refetch, deposits, withdrawals]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: '',
      headerStyle: { backgroundColor: '#FFFFFF' },
      headerShadowVisible: false,
      headerLeft: () => (
        <View className="flex-row items-center gap-x-3 pl-md">
          <Avatar size={36} {...avatarConfig} />
          <Text className="font-subtitle text-headline-1">Station</Text>
        </View>
      ),
      headerRight: () => (
        <View className="flex-row items-center gap-x-4 pr-md">
          <Pressable onPress={() => gleap.open()} hitSlop={8}>
            <MessageCircle size={22} color="#111" strokeWidth={1.8} />
          </Pressable>
          <NotificationBell />
        </View>
      ),
    });
  }, [navigation, avatarConfig]);

  // Derived values
  const hasData = Boolean(station?.total_balance) && !isStationPending;
  const balance = hasData ? fmt(station?.total_balance, selectedCurrency, currencyRates) : '---';
  const monthChange = hasData ? fmtPct(station?.balance_trends?.spend?.month_change) : '---';
  const spend = hasData
    ? splitDollars(station?.spend_balance ?? '0', selectedCurrency, currencyRates)
    : { dollars: '---', cents: '' };
  const stashOnly = hasData
    ? Math.max(
        0,
        (parseFloat(station?.invest_balance ?? '0') || 0) -
          (parseFloat(station?.broker_cash ?? '0') || 0)
      )
    : 0;
  const stash = hasData
    ? splitDollars(stashOnly.toFixed(2), selectedCurrency, currencyRates)
    : { dollars: '---', cents: '' };

  const transactions = useMemo(() => {
    const rows: Transaction[] = [
      ...(deposits.data?.deposits ?? []).map(depositToTransaction),
      ...normalizeWithdrawals(withdrawals.data).map(withdrawalToTransaction),
    ];
    return rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 3);
  }, [deposits.data, withdrawals.data]);

  const kycApproved = kycStatus?.status === 'approved';

  const openKYC = useCallback(() => {
    setShowReceiveSheet(false);
    setShowSendSheet(false);
    setShowKYCSheet(true);
  }, []);

  const startWithdrawal = useCallback(
    (method: 'fiat' | 'crypto' | 'phantom' | 'solflare', flow: 'send' | 'fund' = 'send') => {
      if (method === 'fiat' && !kycApproved) {
        openKYC();
        return;
      }
      setShowSendSheet(false);
      setShowReceiveSheet(false);
      requestAnimationFrame(() =>
        router.push({ pathname: '/withdraw/[method]', params: { method, flow } } as never)
      );
    },
    [kycApproved, openKYC]
  );

  // Funding action lists
  const receiveMainActions = useMemo<FundingAction[]>(
    () => [
      {
        id: 'fiat',
        label: 'Fiat',
        sublabel: 'Receive assets via US bank account',
        icon: <Landmark size={26} color="#6366F1" />,
        onPress: () => {
          setShowReceiveSheet(false);
          kycApproved ? router.push('/virtual-account' as never) : openKYC();
        },
      },
      {
        id: 'crypto',
        label: 'Crypto',
        sublabel: 'Receive assets via wallet address',
        icon: <Wallet size={26} color="#6366F1" />,
        onPress: () => {
          setShowReceiveSheet(false);
          router.push('/receive' as never);
        },
      },
      {
        id: 'more',
        label: 'More Options',
        sublabel: 'Pick from several other options to fund account',
        icon: <LayoutGrid width={28} height={28} color="#6366F1" />,
        onPress: () => receiveNav.navigateTo('receive-more'),
      },
    ],
    [kycApproved, openKYC, receiveNav]
  );

  const receiveMoreActions = useMemo<FundingAction[]>(
    () => [
      ...(isAndroid
        ? [
            {
              id: 'phantom',
              label: 'Phantom',
              sublabel: 'Send USDC from Phantom to Rail',
              icon: <PhantomIcon width={28} height={28} />,
              onPress: () => startWithdrawal('phantom', 'fund'),
            },
            {
              id: 'solflare',
              label: 'Solflare',
              sublabel: 'Send USDC from Solflare to Rail',
              icon: <SolflareIcon width={28} height={28} />,
              onPress: () => startWithdrawal('solflare', 'fund'),
            },
          ]
        : []),
      {
        id: 'solana-pay',
        label: 'Solana Pay',
        sublabel: 'Pay with Solana Pay',
        icon: <SolanaIcon width={28} height={28} />,
        onPress: () => {
          setShowReceiveSheet(false);
          setShowSolanaPayScan(true);
        },
      },
    ],
    [isAndroid, startWithdrawal]
  );

  const sendMainActions = useMemo<FundingAction[]>(
    () => [
      {
        id: 'fiat',
        label: 'Fiat',
        sublabel: 'Send to US bank account',
        icon: <Landmark size={26} color="#6366F1" />,
        onPress: () => startWithdrawal('fiat'),
      },
      {
        id: 'crypto',
        label: 'To Wallet',
        sublabel: 'Send to wallet address',
        icon: <Wallet size={26} color="#6366F1" />,
        onPress: () => startWithdrawal('crypto'),
      },
      {
        id: 'more',
        label: 'More Options',
        sublabel: 'Pick from several other options to send funds out',
        icon: <LayoutGrid width={28} height={28} color="#6366F1" />,
        onPress: () => sendNav.navigateTo('send-more'),
      },
    ],
    [sendNav, startWithdrawal]
  );

  const sendMoreActions = useMemo<FundingAction[]>(
    () => [
      ...(isAndroid
        ? [
            {
              id: 'phantom',
              label: 'Phantom',
              sublabel: 'Send using Phantom wallet',
              icon: <PhantomIcon width={28} height={28} />,
              onPress: () => startWithdrawal('phantom'),
            },
            {
              id: 'solflare',
              label: 'Solflare',
              sublabel: 'Send using Solflare wallet',
              icon: <SolflareIcon width={28} height={28} />,
              onPress: () => startWithdrawal('solflare'),
            },
            {
              id: 'solana-pay',
              label: 'Solana Pay',
              sublabel: 'Send with Solana Pay',
              icon: <SolanaIcon width={28} height={28} />,
              onPress: () => {
                setShowSendSheet(false);
                setShowSolanaPayScan(true);
              },
            },
          ]
        : []),
    ],
    [isAndroid, startWithdrawal]
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
      <View className="px-md" style={{ paddingBottom: insets.bottom + 80 }}>
        <BalanceCard
          balance={balance}
          percentChange={monthChange}
          timeframe="Last 30d"
          className="rounded-x"
          isLoading={isStationPending}
        />

        <View className="mb-2 flex-row gap-3">
          <Button
            title="Receive"
            onPress={() => setShowReceiveSheet(true)}
            leftIcon={<ArrowDownLeft size={20} color="white" />}
            size="small"
            variant="black"
          />
          <Button
            title="Send"
            onPress={() => setShowSendSheet(true)}
            leftIcon={<ArrowUpRight size={20} color="black" />}
            size="small"
            variant="white"
          />
        </View>

        <View className="mt-5 flex-row gap-3">
          <StashCard
            title="Spend"
            amount={spend.dollars}
            amountCents={spend.cents}
            icon={<EarnIcon width={36} height={36} />}
            className="flex-1"
            isLoading={isStationPending}
            onPress={() => router.push('/spending-stash')}
          />
          <StashCard
            title="Stash"
            amount={stash.dollars}
            amountCents={stash.cents}
            icon={<AllocationIcon width={36} height={36} />}
            className="flex-1"
            isLoading={isStationPending}
          />
        </View>

        <FeatureBanner kycApproved={kycApproved} onKYCPress={() => setShowKYCSheet(true)} />

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
              scrollEnabled={false}
            />
          )}
        </View>
      </View>

      <NavigableBottomSheet
        visible={showReceiveSheet}
        onClose={() => setShowReceiveSheet(false)}
        screens={receiveScreens}
        navigation={receiveNav}
      />
      <NavigableBottomSheet
        visible={showSendSheet}
        onClose={() => setShowSendSheet(false)}
        screens={sendScreens}
        navigation={sendNav}
      />
      <KYCVerificationSheet
        visible={showKYCSheet}
        onClose={() => setShowKYCSheet(false)}
        kycStatus={kycStatus}
      />
      <InvestmentDisclaimerSheet
        visible={showDisclaimer}
        onAccept={() => {
          setHasAcknowledgedDisclaimer(true);
          setShowDisclaimer(false);
        }}
      />
      <SolanaPayScanSheet
        visible={showSolanaPayScan}
        onClose={() => setShowSolanaPayScan(false)}
        onConfirmed={() => {
          setShowSolanaPayScan(false);
          void invalidateQueries.station();
          void invalidateQueries.funding();
        }}
      />
      <TransactionDetailSheet
        visible={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
      />
    </ScrollView>
  );
}
