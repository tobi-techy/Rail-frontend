import { View, Text, ScrollView, RefreshControl, Pressable, Platform } from 'react-native';
import React, { useLayoutEffect, useState, useCallback, useEffect, useMemo } from 'react';
import { router, useNavigation, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhantomIcon, SolflareIcon, SolanaIcon, VisaWhite } from '@/assets/svg';
import { BalanceCard } from '@/components/molecules/BalanceCard';
import { StashCard } from '@/components/molecules/StashCard';
import { GameplayCard } from '@/components/molecules/GameplayCard';
import { NotificationBell } from '@/components/molecules/NotificationBell';
import { HomeHeader } from '@/components/molecules/HomeHeader';
import { Button } from '@/components/ui';
import {
  InvestmentDisclaimerSheet,
  KYCVerificationSheet,
  GorhomBottomSheet,
  SpendBreakdownSheet,
  StashPerformanceSheet,
  VirtualAccountSheet,
} from '@/components/sheets';
import { SheetHeader, ExpandableOptionList } from '@/components/sheets/FundingSheetComponents';
import { TransactionDetailSheet } from '@/components/sheets/TransactionDetailSheet';
import { SolanaPayScanSheet } from '@/components/sheets/SolanaPayScanSheet';
import { MiriamHealthWidget } from '@/components/ai/MiriamHealthWidget';
import { MiriamActivitySheet } from '@/components/ai/MiriamActivitySheet';
import { MiriamSuggestionsSheet } from '@/components/ai/MiriamSuggestionsSheet';
import { MiriamMandateSheet } from '@/components/ai/MiriamMandateSheet';
import { MiriamIntroSheet } from '@/components/ai/MiriamIntroSheet';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { useAmbientHomescreen } from '@/hooks/useAmbientHomescreen';
import aiService from '@/api/services/ai.service';
import { ROUTES } from '@/constants/routes';
import { getKycResumeRoute } from '@/utils/onboardingFlow';
import { useStation, useKYCStatus, useTOSStatus, useAcceptTOS } from '@/api/hooks';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores';
import type { Currency } from '@/stores/uiStore';
import { invalidateQueries } from '@/api/queryClient';
import { convertFromUsd, formatCurrencyAmount, type FxRates } from '@/utils/currency';
import gleap from '@/utils/gleap';
import type { Transaction } from '@/components/molecules/TransactionItem';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  ArrowDownLeft01Icon,
  ArrowUpRight01Icon,
  BankIcon,
  InternetIcon,
  Message01Icon,
  UserGroupIcon,
  Wallet01Icon,
  ChartIncreaseIcon,
  IconComponent as HugeiconsIcon,
  CreditCardIcon,
  SavingsIcon,
} from '@/lib/icons';

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
  badge?: string;
  disabled?: boolean;
}

const PEOPLE_TRANSFER_FEATURES_ENABLED = false;

const CreditSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View className="mb-6">
    <Text className="mb-2 font-button text-[15px] text-charcoal-primary">{title}</Text>
    {typeof children === 'string' ? (
      <Text className="font-body text-[14px] leading-[22px] text-ash">{children}</Text>
    ) : (
      children
    )}
  </View>
);

const CreditBullet = ({ children }: { children: React.ReactNode }) => (
  <View className="mb-2 flex-row">
    <Text className="mr-3 font-body text-[14px] text-smoke">•</Text>
    <Text className="flex-1 font-body text-[14px] leading-[22px] text-ash">{children}</Text>
  </View>
);

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
  useAmbientHomescreen(); // "Hey Miriam" listens while this screen is focused

  const [refreshing, setRefreshing] = useState(false);
  const [showReceiveSheet, setShowReceiveSheet] = useState(false);
  const [showSendSheet, setShowSendSheet] = useState(false);
  const [showSolanaPayScan, setShowSolanaPayScan] = useState(false);
  const [showKYCSheet, setShowKYCSheet] = useState(false);
  const [showMicroLoanSheet, setShowMicroLoanSheet] = useState(false);
  const [showSpendBreakdown, setShowSpendBreakdown] = useState(false);
  const [showStashPerformance, setShowStashPerformance] = useState(false);
  const [showCardComingSheet, setShowCardComingSheet] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showVirtualAccountSheet, setShowVirtualAccountSheet] = useState(false);
  const [showMiriamActivity, setShowMiriamActivity] = useState(false);
  const [showMiriamSuggestions, setShowMiriamSuggestions] = useState(false);
  const [showMiriamMandates, setShowMiriamMandates] = useState(false);
  const [pendingSuggestionsCount, setPendingSuggestionsCount] = useState(0);

  // Handle deep-link params from push notifications
  const { openMiriamActivity, openMiriamSuggestions } = useLocalSearchParams<{
    openMiriamActivity?: string;
    openMiriamSuggestions?: string;
  }>();
  useEffect(() => {
    if (openMiriamActivity === 'true') setShowMiriamActivity(true);
  }, [openMiriamActivity]);
  useEffect(() => {
    if (openMiriamSuggestions === 'true') setShowMiriamSuggestions(true);
  }, [openMiriamSuggestions]);

  // Local currency for send/receive sheets — does NOT affect balance card
  const [sheetCurrency, setSheetCurrency] = useState<Currency>('USD');
  const onSheetCurrencyChange = useCallback((c: Currency) => setSheetCurrency(c), []);

  const openReceiveSheet = useCallback(() => {
    setSheetCurrency('USD');
    setShowReceiveSheet(true);
  }, []);
  const openSendSheet = useCallback(() => {
    // NGN is the default currency when sending funds
    setSheetCurrency('NGN');
    setShowSendSheet(true);
  }, []);

  const receiveNav = useMemo(() => ({ reset: (_?: string) => {}, navigateTo: () => {} }), []);
  const sendNav = useMemo(() => ({ reset: (_?: string) => {}, navigateTo: () => {} }), []);

  // Disclaimer
  const { data: tosStatus } = useTOSStatus();
  const { mutate: acceptTOS } = useAcceptTOS();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || tosStatus?.accepted) return;
    // Only show once we know the status (not while loading)
    if (tosStatus && !tosStatus.accepted) {
      const t = setTimeout(() => setShowDisclaimer(true), 800);
      return () => clearTimeout(t);
    }
  }, [tosStatus, isAuthenticated]);

  // Data
  const {
    data: station,
    refetch,
    isPending: isStationPending,
    isError: isStationError,
  } = useStation();
  // hasCard now comes from station response — no separate API call needed
  const hasCard = station?.has_card ?? false;
  // Gameplay feature-gated — disabled for now
  const gameplayData = undefined;
  const isGameplayPending = false;

  // Fetch pending Miriam suggestions count (badge)
  useEffect(() => {
    aiService
      .getMiriamSuggestions()
      .then((res: any) => {
        const data = res?.data ?? [];
        setPendingSuggestionsCount(Array.isArray(data) ? data.length : 0);
      })
      .catch(() => {});
  }, []);
  const [kycEnabled, setKycEnabled] = useState(false);
  const { data: kycStatus, refetch: refetchKYC } = useKYCStatus(kycEnabled);

  // Defer KYC fetch until after first paint
  useEffect(() => {
    const t = setTimeout(() => setKycEnabled(true), 1500);
    return () => clearTimeout(t);
  }, []);

  // Refetch KYC status every time this screen comes into focus
  // so users who just completed KYC don't see stale gates
  useFocusEffect(
    useCallback(() => {
      if (kycEnabled) void refetchKYC();
    }, [refetchKYC, kycEnabled])
  );

  const selectedCurrency = useUIStore((s) => s.currency);
  const currencyRates = useUIStore((s) => s.currencyRates);

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
        invalidateQueries.station(),
        invalidateQueries.funding(),
        invalidateQueries.allocation(),
        invalidateQueries.wallet(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // React Query's refetchOnWindowFocus handles tab focus refetching — no manual listener needed

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <HomeHeader />,
      headerTitleContainerStyle: { width: '70%' },
      headerRight: () => (
        <View className="flex-row items-center gap-x-4 pr-md">
          <Pressable onPress={() => gleap.open()} hitSlop={8}>
            <HugeiconsIcon icon={Message01Icon} size={22} color="#343433" strokeWidth={1.8} />
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

  const startWithdrawal = useCallback(
    (
      method: 'fiat' | 'crypto' | 'phantom' | 'solflare' | 'mwa-withdraw' | 'mwa-fund',
      flow: 'send' | 'fund' = 'send'
    ) => {
      setShowSendSheet(false);
      setShowReceiveSheet(false);

      // Crypto goes to chain selection first (amount screen comes after address entry)
      if (method === 'crypto') {
        router.push({
          pathname: '/withdraw/select-chain',
          params: { currency: sheetCurrency },
        } as never);
        return;
      }

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
          const resumeRoute = getKycResumeRoute(useAuthStore.getState().currentOnboardingStep);
          router.push(resumeRoute as never);
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

  // Crypto & Naira: no gate — backend enforces limits

  // Funding action lists
  const isSheetFiat =
    sheetCurrency === 'USD' ||
    sheetCurrency === 'EUR' ||
    sheetCurrency === 'GBP' ||
    sheetCurrency === 'NGN' ||
    sheetCurrency === 'GHS' ||
    sheetCurrency === 'KES';

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
                    onPress: () => {
                      setShowReceiveSheet(false);
                      router.push('/fund-naira' as never);
                    },
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
              onPress: () => {
                setShowReceiveSheet(false);
                router.push('/receive' as never);
              },
            },
            {
              id: 'fund-stash',
              label: 'Fund Stash',
              sublabel: 'Move spend balance into your stash',
              icon: <HugeiconsIcon icon={SavingsIcon} size={20} color="#00ca48" />,
              onPress: () => {
                setShowReceiveSheet(false);
                router.push('/fund-stash' as never);
              },
            },
          ]
        : [
            {
              id: 'crypto',
              label: `Receive ${sheetCurrency}`,
              sublabel: 'Receive via wallet address',
              icon: <HugeiconsIcon icon={Wallet01Icon} size={20} color="#6366F1" />,
              onPress: () => {
                setShowReceiveSheet(false);
                router.push('/receive' as never);
              },
            },
            {
              id: 'cross-chain',
              label: 'Deposit from any chain',
              sublabel: 'ETH, Arbitrum, Base, Starknet, BNB & more',
              icon: <HugeiconsIcon icon={InternetIcon} size={20} color="#6366F1" />,
              onPress: () => {
                setShowReceiveSheet(false);
                router.push('/fund-crosschain');
              },
            },
            {
              id: 'fund-stash',
              label: 'Fund Stash',
              sublabel: 'Move spend balance into your stash',
              icon: <HugeiconsIcon icon={SavingsIcon} size={20} color="#00ca48" />,
              onPress: () => {
                setShowReceiveSheet(false);
                router.push('/fund-stash' as never);
              },
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
              onPress: () => startWithdrawal('mwa-fund', 'fund'),
            },
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

  const startP2P = useCallback(() => {
    setShowSendSheet(false);
    router.push({ pathname: '/withdraw/[method]', params: { method: 'p2p' } } as never);
  }, []);

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
                    onPress: () => startWithdrawal('fiat'),
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
                            : sheetCurrency === 'GBP'
                              ? 'Send to UK bank account'
                              : 'Send to US bank account',
                    icon: <HugeiconsIcon icon={BankIcon} size={20} color="#6366F1" />,
                    onPress: () => gateFeature(() => startWithdrawal('fiat')),
                  },
                ]),
            {
              id: 'withdraw-stash',
              label: 'Withdraw from Stash',
              sublabel: 'Move funds out of your investment stash',
              icon: <HugeiconsIcon icon={ChartIncreaseIcon} size={20} color="#ff3e00" />,
              onPress: () => {
                setShowSendSheet(false);
                router.push('/withdraw/early-withdraw' as never);
              },
            },
          ]
        : [
            {
              id: 'crypto',
              label: `Send ${sheetCurrency}`,
              sublabel: 'Send to wallet address',
              icon: <HugeiconsIcon icon={Wallet01Icon} size={20} color="#6366F1" />,
              onPress: () => startWithdrawal('crypto'),
            },
            {
              id: 'withdraw-stash',
              label: 'Withdraw from Stash',
              sublabel: 'Move funds out of your investment stash',
              icon: <HugeiconsIcon icon={ChartIncreaseIcon} size={20} color="#ff3e00" />,
              onPress: () => {
                setShowSendSheet(false);
                router.push('/withdraw/early-withdraw' as never);
              },
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
              onPress: () => startWithdrawal('crypto'),
            },
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
    [isAndroid, isSheetFiat, startWithdrawal, gateFeature]
  );

  return (
    <View className="flex-1">
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
            isLoading={isStationPending || refreshing}
          />

          {isStationError && !isStationPending && (
            <Text className="mb-2 text-center font-body text-[12px] text-coral-red">
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
          </View>

          <View className="mt-5 flex-row gap-3">
            <StashCard
              title="Spend"
              amount={spend.dollars}
              amountCents={spend.cents}
              icon={<CreditCardIcon size={26} color="white" weight="fill" />}
              cardColor="#ff3e00"
              className="flex-1"
              isLoading={isStationPending}
              // onPress={() => setShowSpendBreakdown(true)}
            />
            <StashCard
              title="Stash"
              amount={stash.dollars}
              amountCents={stash.cents}
              icon={<SavingsIcon size={26} color="white" weight="fill" />}
              cardColor="#0A7A3B"
              className="flex-1"
              isLoading={isStationPending}
              // onPress={() => setShowStashPerformance(true)}}
            />
          </View>
          <View className="mt-3 flex-row gap-3">
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
            {/* GameplayCard — feature-gated, re-enable when gameplay is ready */}
            {false && (
              <GameplayCard data={gameplayData} isLoading={isGameplayPending} className="flex-1" />
            )}
          </View>

          {/* Miriam: Health widget + suggestions badge */}
          <MiriamHealthWidget />
          {pendingSuggestionsCount > 0 && (
            <Pressable
              onPress={() => setShowMiriamSuggestions(true)}
              className="mt-2 flex-row items-center justify-between rounded-2xl bg-[#ff3e0010] px-4 py-3">
              <Text className="font-body text-[13px] text-charcoal-primary">
                {pendingSuggestionsCount} new suggestion{pendingSuggestionsCount !== 1 ? 's' : ''}{' '}
                from Miriam
              </Text>
              <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} color="#ff3e00" />
            </Pressable>
          )}
        </View>

        {showReceiveSheet && (
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
        )}
        {showSendSheet && (
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
        )}
        <SpendBreakdownSheet
          visible={showSpendBreakdown}
          onClose={() => setShowSpendBreakdown(false)}
          onViewDetails={() => {
            setShowSpendBreakdown(false);
            router.push('/spending-stash');
          }}
        />
        <StashPerformanceSheet
          visible={showStashPerformance}
          onClose={() => setShowStashPerformance(false)}
        />
        {showKYCSheet && (
          <KYCVerificationSheet
            visible={showKYCSheet}
            onClose={() => setShowKYCSheet(false)}
            kycStatus={kycStatus}
          />
        )}
        <InvestmentDisclaimerSheet
          visible={showDisclaimer}
          onAccept={() => {
            acceptTOS();
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
        {showVirtualAccountSheet && (
          <VirtualAccountSheet
            visible={showVirtualAccountSheet}
            onClose={() => setShowVirtualAccountSheet(false)}
            currency={sheetCurrency === 'EUR' ? 'EUR' : sheetCurrency === 'NGN' ? 'NGN' : 'USD'}
          />
        )}
        {showMicroLoanSheet && (
          <GorhomBottomSheet
            visible={showMicroLoanSheet}
            onClose={() => setShowMicroLoanSheet(false)}>
            <View className="px-5">
              <Text className="font-subtitle text-[20px] text-charcoal-primary">Rail Credit</Text>
              <Text className="mt-1 font-body text-[14px] text-ash">
                Spend beyond your balance. Repay automatically.
              </Text>
              <View className="mt-5">
                <CreditSection title="How It Works">
                  Money comes in — Rail detects your inflow and automatically gives you a safe
                  credit advance based on your cashflow. Spend beyond your balance when you need to.
                  Your next deposit repays it automatically. No applications, no billing cycles, no
                  stress.
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
                <View className="mb-4 rounded-2xl bg-parchment-card p-4">
                  <Text className="font-body text-[13px] leading-[20px] text-ash">
                    Rail Credit is designed for short-term liquidity — not long-term debt. Advances
                    are automatically repaid from your next deposit. Only spend what you can repay.
                  </Text>
                </View>
              </View>
            </View>
          </GorhomBottomSheet>
        )}
        {showCardComingSheet && (
          <GorhomBottomSheet
            visible={showCardComingSheet}
            onClose={() => setShowCardComingSheet(false)}>
            <View className="px-5">
              <Text className="font-subtitle text-[20px] text-charcoal-primary">Rail Card</Text>
              <Text className="mt-1 font-body text-[14px] text-ash">
                Your USDC balance. Anywhere Visa is accepted.
              </Text>
              <View className="mt-5">
                <CreditSection title="What It Is">
                  A virtual Visa debit card powered directly by your Rail spend balance. No bank
                  account needed. No currency conversion delays. Your USDC converts instantly at
                  checkout — spend it like regular money, anywhere in the world.
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
                  Every card purchase rounds up to the nearest dollar. The difference goes
                  automatically to your stash — earning yield while you spend. Small amounts,
                  compounded over time, add up.
                </CreditSection>
                <View className="mb-4 rounded-2xl bg-parchment-card p-4">
                  <Text className="font-body text-[13px] leading-[20px] text-ash">
                    Rail Card is coming soon. You&apos;ll be notified when it&apos;s available for
                    your account. KYC verification is required to activate the card.
                  </Text>
                </View>
              </View>
            </View>
          </GorhomBottomSheet>
        )}
      </ScrollView>

      <MiriamActivitySheet
        visible={showMiriamActivity}
        onClose={() => setShowMiriamActivity(false)}
        onOpenMandates={() => {
          setShowMiriamActivity(false);
          setShowMiriamMandates(true);
        }}
      />
      <MiriamSuggestionsSheet
        visible={showMiriamSuggestions}
        onClose={() => setShowMiriamSuggestions(false)}
        onMandateCreated={() => {
          setPendingSuggestionsCount((n) => Math.max(0, n - 1));
          setShowMiriamMandates(true);
        }}
      />
      <MiriamMandateSheet
        visible={showMiriamMandates}
        onClose={() => setShowMiriamMandates(false)}
      />
      <MiriamIntroSheet onDismiss={() => {}} />
    </View>
  );
}
