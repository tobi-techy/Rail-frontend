import { View, Text, ScrollView, RefreshControl, Pressable, Platform } from 'react-native';
import React, { useLayoutEffect, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { router, useNavigation, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import TransactionsEmptyIllustration from '@/assets/Illustrations/transactions-empty.svg';
import { PhantomIcon, SolflareIcon, SolanaIcon, VisaWhite } from '@/assets/svg';
import { BalanceCard } from '@/components/molecules/BalanceCard';
import { StashCard } from '@/components/molecules/StashCard';
import { GameplayCard } from '@/components/molecules/GameplayCard';
import { FeatureBanner } from '@/components/molecules/FeatureBanner';
import { TransactionList } from '@/components/molecules/TransactionList';
import { NotificationBell } from '@/components/molecules/NotificationBell';
import { Button } from '@/components/ui';
import {
  InvestmentDisclaimerSheet,
  KYCVerificationSheet,
  GorhomBottomSheet,
  SpendBreakdownSheet,
  VirtualAccountSheet,
} from '@/components/sheets';
import { SheetHeader, ExpandableOptionList } from '@/components/sheets/FundingSheetComponents';
import { TransactionDetailSheet } from '@/components/sheets/TransactionDetailSheet';
import { SolanaPayScanSheet } from '@/components/sheets/SolanaPayScanSheet';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { isFeatureEnabled, FeatureGates } from '@/utils/featureGate';
import { ROUTES } from '@/constants/routes';
import { useStation, useKYCStatus } from '@/api/hooks';
import { useGameplayProfile } from '@/api/hooks/useGameplay';
import { useCards } from '@/api/hooks/useCard';
import { useDeposits, useWithdrawals } from '@/api/hooks/useFunding';
import {
  normalizeWithdrawals,
  depositToTransaction,
  withdrawalToTransaction,
  pajOrderToTransaction,
} from '@/utils/transactionNormalizer';
import { useAuthStore } from '@/stores/authStore';
import { usePajOrders } from '@/api/hooks/usePaj';
import { useUIStore } from '@/stores';
import type { Currency } from '@/stores/uiStore';
import { invalidateQueries } from '@/api/queryClient';
import { convertFromUsd, formatCurrencyAmount, type FxRates } from '@/utils/currency';
import gleap from '@/utils/gleap';
import type { Transaction } from '@/components/molecules/TransactionItem';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  ArrowDownLeft01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  BankIcon,
  Money01Icon,
  CreditCardIcon,
  InternetIcon,
  Message01Icon,
  SavingsIcon,
  UserGroupIcon,
  Wallet01Icon,
  ArrowMoveDownLeftIcon,
  ArrowDataTransferHorizontalIcon,
  ChartIncreaseIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ExpandableActionMenu } from '@/components/molecules/ExpandableActionMenu';

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

const CreditSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View className="mb-6">
    <Text className="mb-2 font-button text-[15px] text-black">{title}</Text>
    {typeof children === 'string' ? (
      <Text className="font-body text-[14px] leading-[22px] text-black/70">{children}</Text>
    ) : (
      children
    )}
  </View>
);

const CreditBullet = ({ children }: { children: React.ReactNode }) => (
  <View className="mb-2 flex-row">
    <Text className="mr-3 font-body text-[14px] text-black/40">•</Text>
    <Text className="flex-1 font-body text-[14px] leading-[22px] text-black/70">{children}</Text>
  </View>
);

function FundingRow({ action, isLast }: { action: FundingAction; isLast: boolean }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      style={animStyle}
      className={`flex-row items-center justify-between py-3.5${isLast ? '' : ' border-b border-gray-100'}`}
      onPress={action.comingSoon ? undefined : action.onPress}
      onPressIn={() => {
        if (!action.comingSoon) scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      }}
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
        <HugeiconsIcon icon={ArrowRight01Icon} size={20} color="#9CA3AF" />
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
  return (
    <ErrorBoundary>
      <DashboardScreen />
    </ErrorBoundary>
  );
}

function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === 'android';
  const navigation = useNavigation();

  const [refreshing, setRefreshing] = useState(false);
  const [showReceiveSheet, setShowReceiveSheet] = useState(false);
  const [showSendSheet, setShowSendSheet] = useState(false);
  const [showSolanaPayScan, setShowSolanaPayScan] = useState(false);
  const [showKYCSheet, setShowKYCSheet] = useState(false);
  const [showMicroLoanSheet, setShowMicroLoanSheet] = useState(false);
  const [showSpendBreakdown, setShowSpendBreakdown] = useState(false);
  const [showCardComingSheet, setShowCardComingSheet] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showVirtualAccountSheet, setShowVirtualAccountSheet] = useState(false);

  // Local currency for send/receive sheets — does NOT affect balance card
  const [sheetCurrency, setSheetCurrency] = useState<Currency>('USD');
  const onSheetCurrencyChange = useCallback((c: Currency) => setSheetCurrency(c), []);

  const openReceiveSheet = useCallback(() => {
    setSheetCurrency('USD');
    setShowReceiveSheet(true);
  }, []);
  const openSendSheet = useCallback(() => {
    setSheetCurrency('USD');
    setShowSendSheet(true);
  }, []);

  const receiveNav = { reset: (_?: string) => {}, navigateTo: () => {} }; // placeholder
  const sendNav = { reset: (_?: string) => {}, navigateTo: () => {} }; // placeholder

  // Disclaimer
  const hasAcknowledgedDisclaimer = useAuthStore((s) => s.hasAcknowledgedDisclaimer);
  const setHasAcknowledgedDisclaimer = useAuthStore((s) => s.setHasAcknowledgedDisclaimer);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    if (hasAcknowledgedDisclaimer || !isAuthenticated) return;
    const t = setTimeout(() => setShowDisclaimer(true), 800);
    return () => clearTimeout(t);
  }, [hasAcknowledgedDisclaimer, isAuthenticated]);

  // Data
  const {
    data: station,
    refetch,
    isPending: isStationPending,
    isError: isStationError,
  } = useStation();
  const { data: cardsData } = useCards();
  const { data: gameplayData, isPending: isGameplayPending } = useGameplayProfile();
  const deposits = useDeposits(10);
  const withdrawals = useWithdrawals(10);
  const pajOrders = usePajOrders();
  const { data: kycStatus, refetch: refetchKYC } = useKYCStatus();

  // Refetch KYC status every time this screen comes into focus
  // so users who just completed KYC don't see stale gates
  useFocusEffect(
    useCallback(() => {
      void refetchKYC();
    }, [refetchKYC])
  );

  const userFirstName = useAuthStore((s) => s.user?.firstName);
  const userLastName = useAuthStore((s) => s.user?.lastName);
  const userEmail = useAuthStore((s) => s.user?.email);
  const selectedCurrency = useUIStore((s) => s.currency);
  const currencyRates = useUIStore((s) => s.currencyRates);

  const avatarName = useMemo(
    () => [userFirstName, userLastName].filter(Boolean).join(' ') || userEmail || 'Rail User',
    [userFirstName, userLastName, userEmail]
  );

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

  const focusRefetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (focusRefetchTimer.current) clearTimeout(focusRefetchTimer.current);
      focusRefetchTimer.current = setTimeout(() => {
        void refetch();
        void deposits.refetch();
        void withdrawals.refetch();
        void invalidateQueries.station();
        void invalidateQueries.wallet();
      }, 300);
    });
    return () => {
      if (focusRefetchTimer.current) clearTimeout(focusRefetchTimer.current);
      unsubscribe();
    };
  }, [navigation, refetch, deposits, withdrawals]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View className="flex-row items-center gap-x-4 pr-md">
          <Pressable onPress={() => gleap.open()} hitSlop={8}>
            <HugeiconsIcon icon={Message01Icon} size={22} color="#111" strokeWidth={1.8} />
          </Pressable>
          <NotificationBell />
        </View>
      ),
    });
  }, [navigation]);

  // Derived values
  const hasData = Boolean(station?.total_balance) && !isStationPending;
  const balance = hasData ? fmt(station?.total_balance, selectedCurrency, currencyRates) : '---';
  const monthChange = hasData ? fmtPct(station?.balance_trends?.spend?.month_change) : '---';
  const spend = hasData
    ? splitDollars(station?.spend_balance ?? '0', selectedCurrency, currencyRates)
    : { dollars: '---', cents: '' };
  const stash = hasData
    ? splitDollars(station?.invest_balance ?? '0', selectedCurrency, currencyRates)
    : { dollars: '---', cents: '' };

  const transactions = useMemo(() => {
    const rows: Transaction[] = [
      ...(deposits.data?.deposits ?? []).map(depositToTransaction),
      ...normalizeWithdrawals(withdrawals.data).map(withdrawalToTransaction),
      ...(pajOrders.data?.orders ?? []).map(pajOrderToTransaction),
    ];
    return rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 3);
  }, [deposits.data, withdrawals.data, pajOrders.data]);

  const kycApproved = kycStatus?.status === 'approved' && kycStatus?.verified === true;

  const hasCard = Boolean(cardsData?.cards && cardsData.cards.length > 0);

  const startWithdrawal = useCallback(
    (
      method: 'fiat' | 'crypto' | 'phantom' | 'solflare' | 'mwa-withdraw' | 'mwa-fund',
      flow: 'send' | 'fund' = 'send'
    ) => {
      setShowSendSheet(false);
      setShowReceiveSheet(false);
      router.push({
        pathname: '/withdraw/[method]',
        params: { method, flow, asset: sheetCurrency },
      } as never);
    },
    [sheetCurrency]
  );

  // Feature gate — checks profile completion then KYC
  const { requireFeature } = useFeatureGate();
  const gateFeature = useCallback(
    (action: () => void) => {
      requireFeature(action, {
        onProfileRequired: () => {
          setShowSendSheet(false);
          setShowReceiveSheet(false);
          router.push(ROUTES.AUTH.COMPLETE_PROFILE.DATE_OF_BIRTH as never);
        },
        onKycRequired: () => {
          setShowSendSheet(false);
          setShowReceiveSheet(false);
          setShowKYCSheet(true);
        },
      });
    },
    [requireFeature]
  );

  // Funding action lists
  const isSheetFiat =
    sheetCurrency === 'USD' ||
    sheetCurrency === 'EUR' ||
    sheetCurrency === 'GBP' ||
    sheetCurrency === 'NGN' ||
    sheetCurrency === 'GHS' ||
    sheetCurrency === 'KES' ||
    sheetCurrency === 'CAD';

  const receiveMainActions = useMemo<FundingAction[]>(
    () =>
      isSheetFiat
        ? [
            ...(sheetCurrency === 'NGN'
              ? [
                  {
                    id: 'naira-fund',
                    label: 'Fund with Naira',
                    sublabel: 'Deposit NGN via bank transfer',
                    icon: <HugeiconsIcon icon={BankIcon} size={20} color="#008751" />,
                    onPress: () =>
                      gateFeature(() => {
                        setShowReceiveSheet(false);
                        router.push('/fund-naira' as never);
                      }),
                  },
                ]
              : [
                  {
                    id: 'fiat',
                    label: `Receive ${sheetCurrency}`,
                    sublabel: `Receive via ${sheetCurrency === 'EUR' ? 'SEPA' : 'bank'} transfer`,
                    icon: <HugeiconsIcon icon={BankIcon} size={20} color="#6366F1" />,
                    onPress: () =>
                      gateFeature(() => {
                        setShowReceiveSheet(false);
                        setShowVirtualAccountSheet(true);
                      }),
                  },
                ]),
            {
              id: 'crypto',
              label: 'Receive via Crypto',
              sublabel: 'Receive stablecoins via wallet address',
              icon: <HugeiconsIcon icon={Wallet01Icon} size={20} color="#6366F1" />,
              onPress: () =>
                gateFeature(() => {
                  setShowReceiveSheet(false);
                  router.push('/receive' as never);
                }),
            },
          ]
        : [
            {
              id: 'crypto',
              label: `Receive ${sheetCurrency}`,
              sublabel: 'Receive via wallet address',
              icon: <HugeiconsIcon icon={Wallet01Icon} size={20} color="#6366F1" />,
              onPress: () =>
                gateFeature(() => {
                  setShowReceiveSheet(false);
                  router.push('/receive' as never);
                }),
            },
            {
              id: 'cross-chain',
              label: 'Deposit from any chain',
              sublabel: 'ETH, Arbitrum, Base, Starknet, BNB & more',
              icon: <HugeiconsIcon icon={InternetIcon} size={20} color="#6366F1" />,
              onPress: () =>
                gateFeature(() => {
                  setShowReceiveSheet(false);
                  router.push('/fund-crosschain');
                }),
            },
          ],
    [sheetCurrency, isSheetFiat, gateFeature]
  );

  const receiveMoreActions = useMemo<FundingAction[]>(
    () => [
      ...(isAndroid
        ? [
            {
              id: 'mwa-fund',
              label: 'Seed Vault / MWA',
              sublabel: 'Fund with any Solana wallet — Seed Vault on Seeker',
              icon: <SolanaIcon width={28} height={28} />,
              onPress: () => gateFeature(() => startWithdrawal('mwa-fund', 'fund')),
            },
            {
              id: 'phantom',
              label: 'Phantom',
              sublabel: 'Send USDC from Phantom to Rail',
              icon: <PhantomIcon width={28} height={28} />,
              onPress: () => gateFeature(() => startWithdrawal('phantom', 'fund')),
            },
            {
              id: 'solflare',
              label: 'Solflare',
              sublabel: 'Send USDC from Solflare to Rail',
              icon: <SolflareIcon width={28} height={28} />,
              onPress: () => gateFeature(() => startWithdrawal('solflare', 'fund')),
            },
          ]
        : []),
      {
        id: 'solana-pay',
        label: 'Solana Pay',
        sublabel: 'Pay with Solana Pay',
        icon: <SolanaIcon width={28} height={28} />,
        onPress: () =>
          gateFeature(() => {
            setShowReceiveSheet(false);
            setShowSolanaPayScan(true);
          }),
      },
    ],
    [isAndroid, startWithdrawal, gateFeature]
  );

  const startP2P = useCallback(() => {
    gateFeature(() => {
      setShowSendSheet(false);
      router.push({ pathname: '/withdraw/[method]', params: { method: 'p2p' } } as never);
    });
  }, [gateFeature]);

  const sendMainActions = useMemo<FundingAction[]>(
    () =>
      isSheetFiat
        ? [
            ...(sheetCurrency === 'NGN'
              ? [
                  {
                    id: 'naira-withdraw',
                    label: 'Withdraw to bank',
                    sublabel: 'Send NGN to Nigerian bank account',
                    icon: <HugeiconsIcon icon={BankIcon} size={20} color="#008751" />,
                    onPress: () => gateFeature(() => startWithdrawal('fiat')),
                  },
                ]
              : [
                  {
                    id: 'fiat',
                    label: `Send out ${sheetCurrency}`,
                    sublabel:
                      sheetCurrency === 'EUR'
                        ? 'Send via SEPA transfer'
                        : sheetCurrency === 'GHS'
                          ? 'Send to Ghanaian bank account'
                          : sheetCurrency === 'KES'
                            ? 'Send to Kenyan bank account'
                            : sheetCurrency === 'CAD'
                              ? 'Send to Canadian bank account'
                              : 'Send to US bank account',
                    icon: <HugeiconsIcon icon={BankIcon} size={20} color="#6366F1" />,
                    onPress: () => gateFeature(() => startWithdrawal('fiat')),
                  },
                ]),
            {
              id: 'p2p',
              label: 'Send to People',
              sublabel: 'Via RailTag, email, or phone',
              icon: <HugeiconsIcon icon={UserGroupIcon} size={26} color="#FF2E01" />,
              onPress: startP2P,
            },
          ]
        : [
            {
              id: 'crypto',
              label: `Send ${sheetCurrency}`,
              sublabel: 'Send to wallet address',
              icon: <HugeiconsIcon icon={Wallet01Icon} size={20} color="#6366F1" />,
              onPress: () => gateFeature(() => startWithdrawal('crypto')),
            },
            {
              id: 'p2p',
              label: 'Send to People',
              sublabel: 'Via RailTag, email, or phone',
              icon: <HugeiconsIcon icon={UserGroupIcon} size={26} color="#FF2E01" />,
              onPress: startP2P,
            },
          ],
    [startWithdrawal, startP2P, sheetCurrency, isSheetFiat, gateFeature]
  );

  const sendMoreActions = useMemo<FundingAction[]>(
    () => [
      ...(isSheetFiat
        ? [
            {
              id: 'crypto',
              label: 'Send to Wallet',
              sublabel: 'Send stablecoins to wallet address',
              icon: <HugeiconsIcon icon={Wallet01Icon} size={20} color="#6366F1" />,
              onPress: () => gateFeature(() => startWithdrawal('crypto')),
            },
            ...(Platform.OS === 'ios'
              ? [
                  {
                    id: 'tap-to-pay',
                    label: 'Tap to Pay',
                    sublabel: 'Send to someone nearby',
                    icon: <HugeiconsIcon icon={Wallet01Icon} size={20} color="#6366F1" />,
                    onPress: () =>
                      gateFeature(() => {
                        setShowSendSheet(false);
                        router.push('/tap-to-pay' as never);
                      }),
                  },
                ]
              : []),
          ]
        : [
            {
              id: 'fiat',
              label: 'Send out fiat',
              sublabel: 'Send to bank account',
              icon: <HugeiconsIcon icon={BankIcon} size={20} color="#6366F1" />,
              onPress: () => gateFeature(() => startWithdrawal('fiat')),
            },
          ]),
      ...(isAndroid
        ? [
            {
              id: 'phantom',
              label: 'Phantom',
              sublabel: 'Send using Phantom wallet',
              icon: <PhantomIcon width={28} height={28} />,
              onPress: () => gateFeature(() => startWithdrawal('phantom')),
            },
            {
              id: 'solflare',
              label: 'Solflare',
              sublabel: 'Send using Solflare wallet',
              icon: <SolflareIcon width={28} height={28} />,
              onPress: () => gateFeature(() => startWithdrawal('solflare')),
            },
            {
              id: 'solana-pay',
              label: 'Solana Pay',
              sublabel: 'Send with Solana Pay',
              icon: <SolanaIcon width={28} height={28} />,
              onPress: () =>
                gateFeature(() => {
                  setShowSendSheet(false);
                  setShowSolanaPayScan(true);
                }),
            },
          ]
        : []),
    ],
    [isAndroid, isSheetFiat, startWithdrawal, gateFeature]
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

        {isStationError && !isStationPending && (
          <Text className="mb-2 text-center font-body text-[12px] text-red-400">
            Unable to load balance — pull to refresh
          </Text>
        )}

        <View className="mb-2 flex-row items-center gap-3">
          <Button
            title="Receive"
            onPress={openReceiveSheet}
            leftIcon={<HugeiconsIcon icon={ArrowDownLeft01Icon} size={20} color="white" />}
            size="small"
            variant="black"
          />
          <Button
            title="Send"
            onPress={openSendSheet}
            leftIcon={<HugeiconsIcon icon={ArrowUpRight01Icon} size={20} color="black" />}
            size="small"
            variant="white"
          />
          <ExpandableActionMenu
            items={[
              {
                id: 'fund-stash',
                label: 'Fund Stash',
                icon: SavingsIcon,
                iconColor: '#16A34A',
                onPress: () => router.push('/spending-stash/transfer' as never),
              },
              {
                id: 'withdraw',
                label: 'Withdraw',
                icon: ArrowMoveDownLeftIcon,
                iconColor: '#EA580C',
                onPress: () => router.push('/withdraw' as never),
              },
              {
                id: 'swap',
                label: 'Swap',
                icon: ArrowDataTransferHorizontalIcon,
                iconColor: '#2563EB',
                onPress: () => router.push('/market' as never),
              },
              {
                id: 'invest',
                label: 'Invest',
                icon: ChartIncreaseIcon,
                iconColor: '#7C3AED',
                onPress: () => router.push('/investment-stash' as never),
              },
            ]}
          />
        </View>

        <View className="mt-5 flex-row gap-3">
          <StashCard
            title="Spend"
            amount={spend.dollars}
            amountCents={spend.cents}
            icon={<HugeiconsIcon icon={CreditCardIcon} size={26} color="white" strokeWidth={1.8} />}
            cardColor="#FF2E01"
            className="flex-1"
            isLoading={isStationPending}
            onPress={() => gateFeature(() => setShowSpendBreakdown(true))}
          />
          <StashCard
            title="Stash"
            amount={stash.dollars}
            amountCents={stash.cents}
            icon={<HugeiconsIcon icon={SavingsIcon} size={26} color="white" strokeWidth={1.8} />}
            cardColor="#00E011"
            className="flex-1"
            isLoading={isStationPending}
          />
        </View>
        <View className="mt-5 flex-row gap-3">
          <StashCard
            title="Card"
            amount={spend.dollars}
            amountCents={spend.cents}
            icon={<VisaWhite width={32} height={32} strokeWidth={1.8} />}
            cardColor="#000"
            className="max-w-[50%] flex-1"
            isLoading={isStationPending}
            getStarted={!hasCard}
            onPress={() => gateFeature(() => setShowCardComingSheet(true))}
          />
          <GameplayCard
            data={gameplayData}
            isLoading={isGameplayPending}
            className="max-w-[50%] flex-1"
          />
        </View>

        <FeatureBanner
          kycApproved={kycApproved}
          hasCard={hasCard}
          onKYCPress={() => setShowKYCSheet(true)}
        />

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
            <>
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="font-subtitle text-subtitle text-text-primary">
                  Recent Activity
                </Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/history' as never)}
                  accessibilityRole="button"
                  accessibilityLabel="See all transactions"
                  className="min-h-[44px] flex-row items-center">
                  <Text className="font-caption text-caption text-text-secondary">See all</Text>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="#757575" />
                </Pressable>
              </View>
              <TransactionList
                transactions={transactions}
                onTransactionPress={setSelectedTransaction}
                scrollEnabled={false}
              />
            </>
          )}
        </View>
      </View>

      <GorhomBottomSheet
        visible={showReceiveSheet}
        onClose={() => setShowReceiveSheet(false)}
        showCloseButton={false}>
        <SheetHeader
          title="Receive Funds"
          showCurrencySelector
          selectedCurrency={sheetCurrency}
          onCurrencyChange={onSheetCurrencyChange}
        />
        <ExpandableOptionList main={receiveMainActions} more={receiveMoreActions} />
      </GorhomBottomSheet>
      <GorhomBottomSheet
        visible={showSendSheet}
        onClose={() => setShowSendSheet(false)}
        showCloseButton={false}>
        <SheetHeader
          title="Send Funds"
          showCurrencySelector
          selectedCurrency={sheetCurrency}
          onCurrencyChange={onSheetCurrencyChange}
        />
        <ExpandableOptionList main={sendMainActions} more={sendMoreActions} />
      </GorhomBottomSheet>
      <SpendBreakdownSheet
        visible={showSpendBreakdown}
        onClose={() => setShowSpendBreakdown(false)}
        onViewDetails={() => {
          setShowSpendBreakdown(false);
          router.push('/spending-stash');
        }}
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
      <VirtualAccountSheet
        visible={showVirtualAccountSheet}
        onClose={() => setShowVirtualAccountSheet(false)}
        currency={sheetCurrency === 'EUR' ? 'EUR' : sheetCurrency === 'NGN' ? 'NGN' : 'USD'}
      />
      <GorhomBottomSheet visible={showMicroLoanSheet} onClose={() => setShowMicroLoanSheet(false)}>
        <View className="px-5">
          <Text className="font-subtitle text-[20px] text-[#070914]">Rail Credit</Text>
          <Text className="mt-1 font-body text-[14px] text-[#9CA3AF]">
            Spend beyond your balance. Repay automatically.
          </Text>
          <View className="mt-5">
            <CreditSection title="How It Works">
              Money comes in — Rail detects your inflow and automatically gives you a safe credit
              advance based on your cashflow. Spend beyond your balance when you need to. Your next
              deposit repays it automatically. No applications, no billing cycles, no stress.
            </CreditSection>
            <CreditSection title="What You Get">
              <CreditBullet>Credit that feels like part of your normal money</CreditBullet>
              <CreditBullet>Automatic repayment from your next deposit</CreditBullet>
              <CreditBullet>Safe limit based on your actual income — not promises</CreditBullet>
              <CreditBullet>No applications, no forms, no waiting</CreditBullet>
              <CreditBullet>
                Build credit behavior while building wealth simultaneously
              </CreditBullet>
            </CreditSection>
            <CreditSection title="Your Safe Credit Limit">
              Your limit is calculated from your average net inflow, income stability, past
              repayment behavior, and how much Rail can safely lend. New users start with a
              conservative limit that grows as you use Rail consistently.
            </CreditSection>
            <View className="mb-4 rounded-2xl bg-[#F9FAFB] p-4">
              <Text className="font-body text-[13px] leading-[20px] text-[#9CA3AF]">
                Rail Credit is designed for short-term liquidity — not long-term debt. Advances are
                automatically repaid from your next deposit. Only spend what you can repay.
              </Text>
            </View>
          </View>
        </View>
      </GorhomBottomSheet>
      <GorhomBottomSheet
        visible={showCardComingSheet}
        onClose={() => setShowCardComingSheet(false)}>
        <View className="px-5">
          <Text className="font-subtitle text-[20px] text-[#070914]">Rail Card</Text>
          <Text className="mt-1 font-body text-[14px] text-[#9CA3AF]">
            Your USDC balance. Anywhere Visa is accepted.
          </Text>
          <View className="mt-5">
            <CreditSection title="What It Is">
              A virtual Visa debit card powered directly by your Rail spend balance. No bank account
              needed. No currency conversion delays. Your USDC converts instantly at checkout —
              spend it like regular money, anywhere in the world.
            </CreditSection>
            <CreditSection title="What You Get">
              <CreditBullet>Virtual Visa card — works online and in-app instantly</CreditBullet>
              <CreditBullet>Apple Pay and Google Pay support</CreditBullet>
              <CreditBullet>Round-ups on every purchase go straight to your stash</CreditBullet>
              <CreditBullet>Real-time transaction notifications</CreditBullet>
              <CreditBullet>Freeze and unfreeze from the app in one tap</CreditBullet>
              <CreditBullet>Daily spending limits you control</CreditBullet>
            </CreditSection>
            <CreditSection title="How Round-Ups Work">
              Every card purchase rounds up to the nearest dollar. The difference goes automatically
              to your stash — earning yield while you spend. Small amounts, compounded over time,
              add up.
            </CreditSection>
            <View className="mb-4 rounded-2xl bg-[#F9FAFB] p-4">
              <Text className="font-body text-[13px] leading-[20px] text-[#9CA3AF]">
                Rail Card is coming soon. You&apos;ll be notified when it&apos;s available for your
                account. KYC verification is required to activate the card.
              </Text>
            </View>
          </View>
        </View>
      </GorhomBottomSheet>
    </ScrollView>
  );
}
