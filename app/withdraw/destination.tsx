import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
  TextInput,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, Input } from '@/components/ui';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  ArrowDown01Icon,
  ScanIcon,
  MoneyReceiveSquareIcon,
  CreditCardIcon,
  Coffee01Icon,
  ShoppingBag01Icon,
  Airplane01Icon,
  Wallet01Icon,
  InternetIcon,
  GiftIcon,
  UserMultiple02Icon,
  MoreIcon,
  Search01Icon,
  Add01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons';
import { ChainLogo } from '@/components/ChainLogo';
import { DiceBearAvatar } from '@/components/atoms/DiceBearAvatar';
import {
  SUPPORTED_CHAINS,
  isEVMChain,
  getChainConfig,
  getWithdrawalChainsForCurrency,
} from '@/utils/chains';
import { GorhomBottomSheet } from '@/components/sheets/GorhomBottomSheet';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useHaptics } from '@/hooks/useHaptics';
import { useUIStore } from '@/stores';
import { getCurrencyConfig } from '@/utils/currencyConfig';
import {
  getDestinationError,
  getFiatAccountNumberError,
  getBicError,
  sanitizeDestinationInput,
  formatCurrency,
  formatSortCode,
  safeName,
} from './method-screen/utils';
import type { FiatCurrency } from './method-screen/types';
import {
  usePajRates,
  usePajBanks,
  usePajResolveBankAccount,
  usePajOfframp,
  usePajSavedBanks,
  usePajAddBankAccount,
  usePajOrderStatus,
} from '@/api/hooks/usePaj';
import { useVerifyPasscode } from '@/api/hooks';
import type { PajBank, PajSavedBankAccount } from '@/api/types/paj';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import {
  WithdrawalStatusScreen,
  type WithdrawalStatusType,
} from '@/components/withdraw/WithdrawalStatusScreen';
import { useAuthStore } from '@/stores/authStore';
import { usePasskeyAuthorize } from '@/hooks/usePasskeyAuthorize';
import { NgnIcon } from '@/assets/svg';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';
import { parseApiError } from '@/utils/apiError';

const FIAT_RECIPIENTS_KEY = 'rail:fiat_recent_recipients';

interface FiatRecipient {
  id: string;
  accountHolderName: string;
  accountNumber: string;
  routingNumber: string;
  currency: string;
  lastUsed: number;
}

// ── Persist recent fiat recipients locally ────────────────────────────────
async function loadFiatRecipients(): Promise<FiatRecipient[]> {
  try {
    const raw = await AsyncStorage.getItem(FIAT_RECIPIENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveFiatRecipient(r: Omit<FiatRecipient, 'id' | 'lastUsed'>): Promise<void> {
  const all = await loadFiatRecipients();
  const key = `${r.routingNumber}-${r.accountNumber}`;
  const existing = all.findIndex((x) => `${x.routingNumber}-${x.accountNumber}` === key);
  const entry: FiatRecipient = { ...r, id: key, lastUsed: Date.now() };
  if (existing >= 0) all[existing] = entry;
  else all.unshift(entry);
  await AsyncStorage.setItem(FIAT_RECIPIENTS_KEY, JSON.stringify(all.slice(0, 20)));
}

const CATEGORIES: { label: string; icon: any; color: string }[] = [
  { label: 'Transfer', icon: MoneyReceiveSquareIcon, color: '#3B82F6' },
  { label: 'Bills', icon: CreditCardIcon, color: '#EF4444' },
  { label: 'Food', icon: Coffee01Icon, color: '#F97316' },
  { label: 'Shopping', icon: ShoppingBag01Icon, color: '#8B5CF6' },
  { label: 'Travel', icon: Airplane01Icon, color: '#06B6D4' },
  { label: 'Savings', icon: Wallet01Icon, color: '#10B981' },
  { label: 'Crypto', icon: InternetIcon, color: '#6366F1' },
  { label: 'Friends', icon: UserMultiple02Icon, color: '#EC4899' },
  { label: 'Gifts', icon: GiftIcon, color: '#F59E0B' },
  { label: 'Other', icon: MoreIcon, color: '#6B7280' },
];

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
};

type FlowStep = 'recipients' | 'form';

export default function DestinationScreen() {
  const insets = useSafeAreaInsets();
  const { selection } = useHaptics();
  const scrollRef = useRef<ScrollView>(null);
  const params = useLocalSearchParams<{
    method: string;
    amount: string;
    isFiatMethod?: string;
    isCryptoMethod?: string;
    isAssetTradeMethod?: string;
    detailLabel?: string;
    detailPlaceholder?: string;
    detailHint?: string;
    methodTitle?: string;
    availableBalance?: string;
    withdrawalLimit?: string;
    currency?: string;
  }>();

  const isFiatMethod = params.isFiatMethod === 'true';
  const isCryptoMethod = params.isCryptoMethod === 'true';
  const isAssetTradeMethod = params.isAssetTradeMethod === 'true';
  const numericAmount = parseFloat(params.amount ?? '0') || 0;

  // Chain-specific fees: Solana $0.10, EVM $0.50, Fiat USD/EUR/GBP $1.00, NGN ~₦100 ($0.06)
  const getFee = () => {
    if (numericAmount <= 0) return 0;
    if (isFiatMethod) {
      const fc = params.currency ?? storeCurrency;
      if (fc === 'NGN') return 0.06;
      return 1.0;
    }
    // Crypto
    if (destinationChain === 'SOL') return 0.1;
    return 0.5;
  };
  const feeAmount = getFee();
  const totalAmount = numericAmount + feeAmount;

  const storeCurrency = useUIStore((s) => s.currency);
  const currencyCode = params.currency ?? storeCurrency;
  const cc = getCurrencyConfig(currencyCode);
  const CurrencyIcon = cc.Icon;
  const assetLabel = cc.code;
  const isStablecoin = cc.type === 'stablecoin';

  // Derive fiat currency from the asset selected in the home screen chain picker
  const fiatCurrency: FiatCurrency = (
    ['USD', 'EUR', 'GBP', 'NGN'].includes(currencyCode) ? currencyCode : 'USD'
  ) as FiatCurrency;
  const isNGN = isFiatMethod && fiatCurrency === 'NGN';

  // ── Recipient-first flow state (fiat only) ──────────────────────────────
  const [flowStep, setFlowStep] = useState<FlowStep>(isFiatMethod ? 'recipients' : 'form');
  const [recentRecipients, setRecentRecipients] = useState<FiatRecipient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isFiatMethod) loadFiatRecipients().then(setRecentRecipients);
  }, [isFiatMethod]);

  const filteredRecipients = useMemo(() => {
    if (!searchQuery.trim()) return recentRecipients;
    const q = searchQuery.toLowerCase();
    return recentRecipients.filter(
      (r) =>
        r.accountHolderName.toLowerCase().includes(q) ||
        r.accountNumber.includes(q) ||
        r.routingNumber.includes(q)
    );
  }, [recentRecipients, searchQuery]);

  // ── Form state ──────────────────────────────────────────────────────────
  const [destinationInput, setDestinationInput] = useState('');
  const [destinationChain, setDestinationChain] = useState('SOL');

  // Filter chains to only show those that support the selected currency
  const withdrawalChains = useMemo(
    () => getWithdrawalChainsForCurrency(currencyCode),
    [currencyCode]
  );

  // Reset chain if it doesn't support the currency
  useEffect(() => {
    if (
      isCryptoMethod &&
      withdrawalChains.length > 0 &&
      !withdrawalChains.some((c) => c.chain === destinationChain)
    ) {
      setDestinationChain(withdrawalChains[0].chain);
    }
  }, [isCryptoMethod, withdrawalChains, destinationChain]);

  // ── NGN (Paj Cash) state ────────────────────────────────────────────────
  const { data: pajRates } = usePajRates();
  const { data: pajBanksData, error: pajBanksError } = usePajBanks();
  const { data: pajSavedBanks } = usePajSavedBanks();
  const pajResolve = usePajResolveBankAccount();
  const pajOfframp = usePajOfframp();
  const pajAddBank = usePajAddBankAccount();
  const { showSuccess, showError: showErrorPopup } = useFeedbackPopup();
  const [ngnBank, setNgnBank] = useState<PajBank | null>(null);
  const [ngnAccountNumber, setNgnAccountNumber] = useState('');
  const [ngnAccountName, setNgnAccountName] = useState('');
  const [ngnBankSheetOpen, setNgnBankSheetOpen] = useState(false);
  const [ngnBankSearch, setNgnBankSearch] = useState('');
  const [ngnSaveBank, setNgnSaveBank] = useState(true);
  const [ngnSubmitting, setNgnSubmitting] = useState(false);
  const [ngnStatus, setNgnStatus] = useState<WithdrawalStatusType | null>(null);
  const [ngnErrorMsg, setNgnErrorMsg] = useState('');
  // ── NGN auth state ──────────────────────────────────────────────────────
  const [ngnShowAuth, setNgnShowAuth] = useState(false);
  const [ngnShowConfirm, setNgnShowConfirm] = useState(false);
  const [ngnPinAttempts, setNgnPinAttempts] = useState(0);
  const [ngnLockoutUntil, setNgnLockoutUntil] = useState<number | null>(null);
  const [ngnLockoutSeconds, setNgnLockoutSeconds] = useState(0);
  const user = useAuthStore((s) => s.user as { email?: string } | undefined);
  const { mutate: verifyPasscode, isPending: isPasscodeVerifying } = useVerifyPasscode();
  const pajBanks: PajBank[] = pajBanksData?.banks ?? [];
  const savedBanksList: PajSavedBankAccount[] = (pajSavedBanks as any)?.accounts ?? [];
  const offRampRate = pajRates?.offRampRate?.rate ?? 0;
  const ngnAmount = isNGN ? numericAmount : 0;
  const ngnUsdEquivalent = isNGN && offRampRate > 0 ? numericAmount / offRampRate : 0;
  const filteredPajBanks = useMemo(() => {
    if (!ngnBankSearch.trim()) return pajBanks;
    const q = ngnBankSearch.toLowerCase();
    return pajBanks.filter((b) => b.name.toLowerCase().includes(q));
  }, [pajBanks, ngnBankSearch]);

  // ── NGN auth: lockout timer ─────────────────────────────────────────────
  useEffect(() => {
    if (!ngnLockoutUntil) return;
    const tick = setInterval(() => {
      const rem = Math.ceil((ngnLockoutUntil - Date.now()) / 1000);
      if (rem <= 0) {
        setNgnLockoutUntil(null);
        setNgnLockoutSeconds(0);
        setNgnPinAttempts(0);
      } else setNgnLockoutSeconds(rem);
    }, 1000);
    return () => clearInterval(tick);
  }, [ngnLockoutUntil]);

  // ── NGN auth: execute offramp after auth ────────────────────────────────
  const executeNgnOfframp = useCallback(async () => {
    if (!ngnBank) return;
    setNgnShowAuth(false);
    setNgnSubmitting(true);
    try {
      if (ngnSaveBank) {
        pajAddBank.mutate({ bankId: ngnBank.id, accountNumber: ngnAccountNumber });
      }
      await pajOfframp.mutateAsync({
        bankId: ngnBank.id,
        accountNumber: ngnAccountNumber,
        amount: numericAmount,
      });
      setNgnStatus('success');
    } catch (err: any) {
      if (err?.code === 'PAJ_VERIFICATION_REQUIRED') {
        router.push('/paj-verify' as never);
        return;
      }
      setNgnErrorMsg(err?.message || 'Please try again');
      setNgnStatus('failed');
    } finally {
      setNgnSubmitting(false);
    }
  }, [
    ngnBank,
    ngnSaveBank,
    ngnAccountNumber,
    numericAmount,
    ngnAmount,
    pajOfframp,
    pajAddBank,
    showSuccess,
    showErrorPopup,
  ]);

  const ngnPasskeyScope = `ngn-offramp:${safeName(user?.email) || 'unknown'}:${numericAmount.toFixed(2)}`;
  const [ngnPasskeyAvailable, setNgnPasskeyAvailable] = useState(false);
  useEffect(() => {
    try {
      const { Passkey } = require('react-native-passkey');
      setNgnPasskeyAvailable(Passkey.isSupported() && Boolean(safeName(user?.email)));
    } catch { setNgnPasskeyAvailable(false); }
  }, [user?.email]);
  const ngnPasskey = usePasskeyAuthorize({
    email: user?.email,
    passkeyPromptScope: ngnPasskeyScope,
    autoTrigger: false,
    onAuthorized: executeNgnOfframp,
  });

  const onNgnPasscodeComplete = useCallback(
    (code: string) => {
      if (isPasscodeVerifying || ngnLockoutUntil) return;
      ngnPasskey.setAuthError('');
      verifyPasscode(
        { passcode: code },
        {
          onSuccess: (result) => {
            if (!result.verified) {
              const next = ngnPinAttempts + 1;
              setNgnPinAttempts(next);
              if (next >= 5) {
                setNgnLockoutUntil(Date.now() + 30_000);
                setNgnLockoutSeconds(30);
                ngnPasskey.setAuthError('Too many attempts. Try again in 30s.');
              } else {
                ngnPasskey.setAuthError(
                  `Invalid PIN. ${5 - next} attempt${5 - next !== 1 ? 's' : ''} left.`
                );
              }
              ngnPasskey.onAuthPasscodeChange('');
              return;
            }
            setNgnPinAttempts(0);
            void executeNgnOfframp();
          },
          onError: (err: unknown) => {
            ngnPasskey.setAuthError(parseApiError(err, 'Verification failed.'));
            ngnPasskey.onAuthPasscodeChange('');
          },
        }
      );
    },
    [
      isPasscodeVerifying,
      ngnLockoutUntil,
      ngnPinAttempts,
      verifyPasscode,
      executeNgnOfframp,
      ngnPasskey,
    ]
  );

  // Auto-resolve NGN account name
  useEffect(() => {
    if (!isNGN || !ngnBank || ngnAccountNumber.length !== 10) {
      setNgnAccountName('');
      return;
    }
    let stale = false;
    pajResolve.mutate(
      { bankId: ngnBank.id, accountNumber: ngnAccountNumber },
      {
        onSuccess: (d) => {
          if (!stale) setNgnAccountName(d.accountName);
        },
        onError: () => {
          if (!stale) setNgnAccountName('');
        },
      }
    );
    return () => {
      stale = true;
    };
  }, [isNGN, ngnBank?.id, ngnAccountNumber]);

  // Redirect to Paj verify if session needed
  useEffect(() => {
    if (isNGN && (pajBanksError as any)?.code === 'PAJ_VERIFICATION_REQUIRED') {
      router.push('/paj-verify' as never);
    }
  }, [isNGN, pajBanksError]);
  const [fiatAccountHolderName, setFiatAccountHolderName] = useState('');
  const [fiatAccountNumber, setFiatAccountNumber] = useState('');
  const [fiatBic, setFiatBic] = useState('');
  const [category, setCategory] = useState('Transfer');
  const [narration, setNarration] = useState('');
  const [didTry, setDidTry] = useState(false);
  const [chainSheetOpen, setChainSheetOpen] = useState(false);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);

  const selectedChain = getChainConfig(destinationChain as any);
  const selectedCategory = CATEGORIES.find((c) => c.label === category) ?? CATEGORIES[0];

  const destinationError = useMemo(
    () =>
      getDestinationError({
        destinationInput,
        isAssetTradeMethod,
        isCryptoDestinationMethod: isCryptoMethod,
        isFiatMethod,
        isMobileWalletFundingFlow: false,
        destinationChain,
        fiatCurrency,
      }),
    [
      destinationInput,
      isAssetTradeMethod,
      isCryptoMethod,
      isFiatMethod,
      destinationChain,
      fiatCurrency,
    ]
  );

  const fiatAccountNumberError = useMemo(
    () => getFiatAccountNumberError(fiatAccountNumber, fiatCurrency),
    [fiatAccountNumber, fiatCurrency]
  );

  const fiatBicError = useMemo(() => getBicError(fiatBic), [fiatBic]);

  const canContinue = isFiatMethod
    ? fiatCurrency === 'NGN'
      ? Boolean(ngnBank && ngnAccountNumber.length === 10 && ngnAccountName)
      : fiatCurrency === 'EUR'
        ? fiatAccountHolderName.trim().length >= 2 &&
          !destinationError &&
          destinationInput.length >= 15 &&
          !fiatBicError
        : fiatCurrency === 'GBP'
          ? fiatAccountHolderName.trim().length >= 2 &&
            !destinationError &&
            !fiatAccountNumberError &&
            fiatAccountNumber.length === 8
          : fiatAccountHolderName.trim().length >= 2 &&
            fiatAccountNumber.length >= 4 &&
            !fiatAccountNumberError &&
            destinationInput.length >= 9
    : destinationInput.length > 0 && !destinationError;

  const selectRecipient = useCallback(
    (r: FiatRecipient) => {
      selection();
      setFiatAccountHolderName(r.accountHolderName);
      setFiatAccountNumber(r.accountNumber);
      setDestinationInput(r.routingNumber);
      setFlowStep('form');
    },
    [selection]
  );

  const onContinue = useCallback(async () => {
    setDidTry(true);
    if (!canContinue) return;

    // NGN: trigger auth screen before offramp
    if (isNGN && ngnBank) {
      ngnPasskey.setAuthError('');
      ngnPasskey.onAuthPasscodeChange('');
      setNgnShowConfirm(true);
      return;
    }

    // Save fiat recipient for future use
    if (isFiatMethod) {
      saveFiatRecipient({
        accountHolderName: fiatAccountHolderName.trim(),
        accountNumber: fiatCurrency === 'EUR' ? '' : fiatAccountNumber,
        routingNumber: destinationInput,
        currency: fiatCurrency,
      });
    }
    router.push({
      pathname: '/withdraw/confirm',
      params: {
        ...params,
        destinationInput,
        destinationChain,
        fiatAccountHolderName,
        fiatAccountNumber,
        fiatCurrency,
        ...(fiatCurrency === 'EUR' && fiatBic ? { fiatBic } : {}),
        category,
        narration,
        currency: currencyCode,
      },
    });
  }, [
    canContinue,
    isNGN,
    ngnBank,
    ngnAccountNumber,
    ngnSaveBank,
    ngnAmount,
    numericAmount,
    pajOfframp,
    pajAddBank,
    showSuccess,
    showErrorPopup,
    destinationInput,
    destinationChain,
    fiatAccountHolderName,
    fiatAccountNumber,
    fiatCurrency,
    fiatBic,
    category,
    narration,
    params,
    currencyCode,
    isFiatMethod,
  ]);

  const showError = didTry || destinationInput.length > 0;

  const handleInputFocus = useCallback((y: number) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 120), animated: true });
    }, 300);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // NGN: Auth screen (passcode/passkey before offramp)
  // ═══════════════════════════════════════════════════════════════════════
  // NGN: Full-screen withdrawal status
  // ═══════════════════════════════════════════════════════════════════════
  if (ngnStatus) {
    return (
      <WithdrawalStatusScreen
        status={ngnStatus}
        amount={`₦${formatCurrency(numericAmount)}`}
        recipient={ngnAccountName}
        message={ngnStatus === 'failed' ? ngnErrorMsg : undefined}
        onDone={() => router.replace('/(tabs)' as never)}
        onRetry={
          ngnStatus === 'failed'
            ? () => {
                setNgnStatus(null);
                setNgnErrorMsg('');
                setNgnShowConfirm(true);
              }
            : undefined
        }
      />
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // NGN: Confirm review screen
  // ═══════════════════════════════════════════════════════════════════════
  if (ngnShowConfirm && !ngnShowAuth) {
    if (ngnSubmitting) {
      return (
        <SafeAreaView className="flex-1 bg-white items-center justify-center" edges={['top', 'bottom']}>
          <ActivityIndicator size="small" color="#EA580C" />
          <Text className="mt-4 font-subtitle text-[17px] text-text-primary">Processing withdrawal…</Text>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
          <Pressable
            className="size-11 items-center justify-center rounded-full bg-surface"
            onPress={() => setNgnShowConfirm(false)}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#111827" />
          </Pressable>
          <Text className="font-subtitle text-[17px] text-text-primary">Review</Text>
          <View className="size-11" />
        </View>
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {/* Amount hero */}
          <View className="items-center py-8">
            <View className="mb-3 size-14 items-center justify-center overflow-hidden rounded-full">
              <NgnIcon width={56} height={56} />
            </View>
            <Text className="font-mono-semibold text-[42px] leading-[46px] text-text-primary" style={{ letterSpacing: -1 }}>
              ₦{formatCurrency(numericAmount)}
            </Text>
            {ngnUsdEquivalent > 0 && (
              <Text className="mt-1 font-body text-[14px] text-text-secondary">≈ ${ngnUsdEquivalent.toFixed(2)} USDC</Text>
            )}
          </View>

          {/* Destination card */}
          <Text className="mb-2 ml-1 font-body text-[12px] uppercase tracking-wider text-text-secondary">Destination</Text>
          <View className="overflow-hidden rounded-3xl bg-surface">
            <View className="flex-row items-center justify-between px-5 py-4">
              <Text className="font-body text-[14px] text-text-secondary">Recipient</Text>
              <Text className="ml-6 max-w-[60%] text-right font-subtitle text-[14px] text-text-primary" numberOfLines={1}>{ngnAccountName}</Text>
            </View>
            <View className="mx-5 h-px bg-gray-100" />
            <View className="flex-row items-center justify-between px-5 py-4">
              <Text className="font-body text-[14px] text-text-secondary">Bank</Text>
              <Text className="font-subtitle text-[14px] text-text-primary">{ngnBank?.name}</Text>
            </View>
            <View className="mx-5 h-px bg-gray-100" />
            <View className="flex-row items-center justify-between px-5 py-4">
              <Text className="font-body text-[14px] text-text-secondary">Account</Text>
              <Text className="font-subtitle text-[14px] text-text-primary">{ngnAccountNumber}</Text>
            </View>
            <View className="mx-5 h-px bg-gray-100" />
            <View className="flex-row items-center justify-between px-5 py-4">
              <Text className="font-body text-[14px] text-text-secondary">Source</Text>
              <Text className="font-subtitle text-[14px] text-text-primary">Spend Wallet</Text>
            </View>
          </View>

          {/* Transaction card */}
          <Text className="mb-2 ml-1 mt-4 font-body text-[12px] uppercase tracking-wider text-text-secondary">Transaction</Text>
          <View className="overflow-hidden rounded-3xl bg-surface">
            {offRampRate > 0 && (
              <>
                <View className="flex-row items-center justify-between px-5 py-4">
                  <Text className="font-body text-[14px] text-text-secondary">Rate</Text>
                  <Text className="font-subtitle text-[14px] text-text-primary">₦{offRampRate.toLocaleString()}/USD</Text>
                </View>
                <View className="mx-5 h-px bg-gray-100" />
              </>
            )}
            <View className="flex-row items-center justify-between px-5 py-4">
              <Text className="font-body text-[14px] text-text-secondary">Rail fee</Text>
              <Text className="font-subtitle text-[14px] text-text-primary">₦{offRampRate > 0 ? Math.round(0.06 * offRampRate).toLocaleString() : '—'}</Text>
            </View>
            <View className="mx-5 h-px bg-gray-100" />
            <View className="flex-row items-center justify-between px-5 py-4">
              <Text className="font-subtitle text-[14px] text-text-primary">Total</Text>
              <Text className="font-subtitle text-[16px] text-text-primary">₦{offRampRate > 0 ? Math.round((ngnUsdEquivalent + 0.06) * offRampRate).toLocaleString() : formatCurrency(numericAmount)}</Text>
            </View>
          </View>

          <Text className="mt-4 font-body text-[12px] leading-[18px] text-text-secondary">
            * Please verify bank details. Incorrect details may result in failed or delayed transfers.
          </Text>
        </ScrollView>

        <View
          className="flex-row gap-3 border-t border-gray-100 bg-white px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <View className="flex-1">
            <Button title="Cancel" variant="ghost" onPress={() => setNgnShowConfirm(false)} />
          </View>
          <View className="flex-[2]">
            <Button title="Confirm & Send" variant="orange" onPress={() => setNgnShowAuth(true)} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  if (ngnShowAuth) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
          <Pressable
            className="size-11 items-center justify-center rounded-full bg-surface"
            onPress={() => setNgnShowAuth(false)}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#111" />
          </Pressable>
          <Text className="font-subtitle text-[17px] text-text-primary">Authorize</Text>
          <View className="size-11" />
        </View>
        <PasscodeInput
          subtitle={`Enter PIN to send ₦${ngnAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} to ${ngnAccountName}`}
          length={4}
          value={ngnPasskey.authPasscode}
          onValueChange={ngnPasskey.onAuthPasscodeChange}
          onComplete={ngnLockoutUntil ? undefined : onNgnPasscodeComplete}
          errorText={ngnPasskey.authError}
          showToggle
          showFingerprint={ngnPasskeyAvailable}
          onFingerprint={ngnLockoutUntil ? undefined : ngnPasskey.onPasskeyAuthorize}
          autoSubmit
          variant="light"
          className="mt-3 flex-1"
        />
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FIAT: Recipient-first screen
  // ═══════════════════════════════════════════════════════════════════════
  if (isFiatMethod && flowStep === 'recipients') {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View className="px-5 pb-2 pt-1">
          <Pressable
            className="size-11 items-center justify-center rounded-full bg-surface"
            onPress={() => router.back()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#111827" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-5"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInUp.duration(250)}>
            <Text className="font-subtitle text-[28px] text-text-primary">Send to bank</Text>
            <Text className="mt-1 font-body text-[14px] text-text-secondary">
              Send {isStablecoin ? '' : cc.symbol}
              {formatCurrency(numericAmount)} {assetLabel} to a recent or new recipient
            </Text>
          </Animated.View>

          {/* Search */}
          <Animated.View entering={FadeInUp.delay(60).duration(250)} className="mt-6">
            <View
              className="flex-row items-center gap-3 rounded-2xl bg-[#F3F4F6] px-4"
              style={{ height: 52 }}>
              <HugeiconsIcon icon={Search01Icon} size={18} color="#9CA3AF" />
              <TextInput
                className="flex-1 font-body text-[15px] text-text-primary"
                placeholder="Search by account name"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <HugeiconsIcon icon={Cancel01Icon} size={15} color="#9CA3AF" />
                </Pressable>
              )}
            </View>
          </Animated.View>

          {/* New recipient */}
          <Animated.View entering={FadeInUp.delay(100).duration(250)} className="mt-5">
            <Pressable
              className="flex-row items-center justify-between rounded-2xl bg-[#F9FAFB] px-4 py-4"
              onPress={() => {
                setFiatAccountHolderName('');
                setFiatAccountNumber('');
                setDestinationInput('');
                setNgnBank(null);
                setNgnAccountNumber('');
                setNgnAccountName('');
                setFlowStep('form');
              }}>
              <View className="flex-row items-center gap-3">
                <View className="size-11 items-center justify-center rounded-full bg-[#3B82F6]">
                  <HugeiconsIcon icon={Add01Icon} size={20} color="#fff" />
                </View>
                <Text className="font-subtitle text-[15px] text-text-primary">
                  Send to a new recipient
                </Text>
              </View>
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#9CA3AF" />
            </Pressable>
          </Animated.View>

          <View className="my-5 h-px bg-gray-100" />

          {/* Recent Recipients */}
          <Animated.View entering={FadeInUp.delay(140).duration(250)}>
            <Text className="mb-3 font-subtitle text-[15px] text-text-primary">
              Recent Recipients
            </Text>
            {isNGN ? (
              /* NGN: Paj saved bank accounts */
              savedBanksList.length === 0 ? (
                <Text className="py-6 text-center font-body text-[14px] text-text-secondary">
                  No saved recipients yet
                </Text>
              ) : (
                savedBanksList
                  .filter((s) => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      s.accountName.toLowerCase().includes(q) || s.bank.toLowerCase().includes(q)
                    );
                  })
                  .map((s, i) => {
                    const bank = pajBanks.find((b) => b.name === s.bank || b.id === s.bank);
                    return (
                      <Animated.View
                        key={s.id}
                        entering={FadeInUp.delay(160 + i * 40).duration(200)}>
                        <Pressable
                          className="flex-row items-center gap-3 rounded-2xl px-2 py-3 active:bg-surface"
                          onPress={() => {
                            selection();
                            if (bank) setNgnBank(bank);
                            setNgnAccountNumber(s.accountNumber);
                            setNgnAccountName(s.accountName);
                            setFlowStep('form');
                          }}>
                          <DiceBearAvatar seed={s.accountName} size={44} />
                          <View className="flex-1">
                            <Text
                              className="font-subtitle text-[15px] text-text-primary"
                              numberOfLines={1}>
                              {s.accountName}
                            </Text>
                            <Text
                              className="font-body text-[13px] text-text-secondary"
                              numberOfLines={1}>
                              {bank?.name ?? s.bank} · ••{s.accountNumber.slice(-4)}
                            </Text>
                          </View>
                        </Pressable>
                      </Animated.View>
                    );
                  })
              )
            ) : /* USD/EUR/GBP: Local saved recipients */
            filteredRecipients.length === 0 ? (
              <Text className="py-6 text-center font-body text-[14px] text-text-secondary">
                {searchQuery ? 'No matching recipients' : 'No recent recipients yet'}
              </Text>
            ) : (
              filteredRecipients.map((r, i) => (
                <Animated.View key={r.id} entering={FadeInUp.delay(160 + i * 40).duration(200)}>
                  <Pressable
                    className="flex-row items-center gap-3 rounded-2xl px-2 py-3 active:bg-surface"
                    onPress={() => selectRecipient(r)}>
                    <DiceBearAvatar seed={r.accountHolderName} size={44} />
                    <View className="flex-1">
                      <Text
                        className="font-subtitle text-[15px] text-text-primary"
                        numberOfLines={1}>
                        {r.accountHolderName}
                      </Text>
                      <Text className="font-body text-[13px] text-text-secondary" numberOfLines={1}>
                        ••••{r.accountNumber.slice(-4)} | {r.routingNumber}
                      </Text>
                    </View>
                  </Pressable>
                </Animated.View>
              ))
            )}
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Form screen (fiat new recipient / crypto destination)
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
        <Pressable
          className="size-11 items-center justify-center rounded-full bg-surface"
          onPress={() => (isFiatMethod ? setFlowStep('recipients') : router.back())}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#111827" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          ref={scrollRef}
          className="flex-1 px-5"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}>
          <Animated.View entering={FadeInUp.duration(250)} className="mb-5 mt-2">
            <Text className="font-subtitle text-[28px] text-text-primary">
              {isFiatMethod ? 'New Recipient' : `Send ${assetLabel}`}
            </Text>
          </Animated.View>

          {/* Amount pill (crypto only) */}
          {!isFiatMethod && (
            <Animated.View entering={FadeInUp.duration(250)} className="mb-6 mt-4">
              <View className="flex-row items-center justify-between rounded-2xl bg-surface px-4 py-3.5">
                <Text className="font-body text-[13px] text-text-secondary">Sending</Text>
                <View className="flex-row items-center gap-2">
                  <CurrencyIcon width={18} height={18} />
                  <Text className="font-subtitle text-[16px] text-text-primary">
                    {isStablecoin ? '' : cc.symbol}
                    {formatCurrency(numericAmount)} {assetLabel}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Address / Routing */}
          <Animated.View entering={FadeInUp.delay(40).duration(250)} className="mb-4">
            {!isFiatMethod && (
              <Input
                label="Address"
                value={destinationInput}
                onChangeText={(v: string) =>
                  setDestinationInput(
                    sanitizeDestinationInput({ value: v, isFiatMethod, isAssetTradeMethod })
                  )
                }
                placeholder={params.detailPlaceholder ?? 'Long press to paste'}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="default"
                returnKeyType="next"
                error={showError ? destinationError : undefined}
                rightAccessory={
                  <Pressable hitSlop={8}>
                    <HugeiconsIcon icon={ScanIcon} size={20} color="#9CA3AF" />
                  </Pressable>
                }
                onFocus={() => handleInputFocus(0)}
              />
            )}
          </Animated.View>

          {/* Network selector (crypto) */}
          {isCryptoMethod && (
            <Animated.View entering={FadeInUp.delay(80).duration(250)} className="mb-4">
              <Text className="mb-2 font-subtitle text-[13px] text-text-secondary">Network</Text>
              <Pressable
                onPress={() => {
                  selection();
                  setChainSheetOpen(true);
                }}
                className="flex-row items-center justify-between rounded-xl border border-[#D4D4D8] px-4 py-3.5">
                <View className="flex-row items-center gap-3">
                  <View className="relative size-8 items-center justify-center">
                    <View
                      className="size-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: selectedChain.color + '14' }}>
                      <ChainLogo chain={destinationChain} size={18} />
                    </View>
                    <View className="absolute -bottom-1 -right-1 size-4 items-center justify-center rounded-full bg-white">
                      <CurrencyIcon width={12} height={12} />
                    </View>
                  </View>
                  <View>
                    <Text className="font-subtitle text-[15px] text-text-primary">
                      {selectedChain.label}
                    </Text>
                    <Text className="font-body text-[12px] text-text-secondary">
                      {assetLabel} · {selectedChain.shortLabel}
                      {isEVMChain(destinationChain as any) ? ' · EVM' : ''}
                    </Text>
                  </View>
                </View>
                <HugeiconsIcon icon={ArrowDown01Icon} size={18} color="#9CA3AF" />
              </Pressable>
            </Animated.View>
          )}

          {/* Fiat bank fields */}
          {isFiatMethod && (
            <Animated.View entering={FadeInUp.delay(80).duration(250)} className="mb-4 gap-4">
              {!isNGN && (
                <Input
                  label="Account Holder"
                  value={fiatAccountHolderName}
                  onChangeText={setFiatAccountHolderName}
                  placeholder="Full name on bank account"
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                  onFocus={() => handleInputFocus(150)}
                />
              )}

              {fiatCurrency === 'USD' && (
                <>
                  <Input
                    label="Routing Number"
                    value={destinationInput}
                    onChangeText={(v: string) =>
                      setDestinationInput(
                        sanitizeDestinationInput({
                          value: v,
                          isFiatMethod,
                          isAssetTradeMethod,
                          fiatCurrency,
                        })
                      )
                    }
                    placeholder="9-digit routing number"
                    keyboardType="number-pad"
                    autoCorrect={false}
                    returnKeyType="next"
                    error={showError ? destinationError : undefined}
                    onFocus={() => handleInputFocus(200)}
                  />
                  <Input
                    label="Account Number"
                    value={fiatAccountNumber}
                    onChangeText={setFiatAccountNumber}
                    placeholder="4–17 digit account number"
                    keyboardType="number-pad"
                    autoCorrect={false}
                    returnKeyType="done"
                    error={didTry ? fiatAccountNumberError : undefined}
                    onFocus={() => handleInputFocus(300)}
                  />
                </>
              )}

              {fiatCurrency === 'EUR' && (
                <>
                  <Input
                    label="IBAN"
                    value={destinationInput}
                    onChangeText={(v: string) =>
                      setDestinationInput(
                        sanitizeDestinationInput({
                          value: v,
                          isFiatMethod,
                          isAssetTradeMethod,
                          fiatCurrency,
                        })
                      )
                    }
                    placeholder="e.g. DE89370400440532013000"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="next"
                    error={showError ? destinationError : undefined}
                    onFocus={() => handleInputFocus(200)}
                  />
                  <Input
                    label="BIC / SWIFT (optional)"
                    value={fiatBic}
                    onChangeText={setFiatBic}
                    placeholder="e.g. COBADEFFXXX"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="done"
                    error={didTry ? fiatBicError : undefined}
                    onFocus={() => handleInputFocus(300)}
                  />
                </>
              )}

              {fiatCurrency === 'GBP' && (
                <>
                  <Input
                    label="Sort Code"
                    value={formatSortCode(destinationInput)}
                    onChangeText={(v: string) =>
                      setDestinationInput(v.replace(/\D/g, '').slice(0, 6))
                    }
                    placeholder="XX-XX-XX"
                    keyboardType="number-pad"
                    autoCorrect={false}
                    returnKeyType="next"
                    error={showError ? destinationError : undefined}
                    onFocus={() => handleInputFocus(200)}
                  />
                  <Input
                    label="Account Number"
                    value={fiatAccountNumber}
                    onChangeText={(v: string) =>
                      setFiatAccountNumber(v.replace(/\D/g, '').slice(0, 8))
                    }
                    placeholder="8-digit account number"
                    keyboardType="number-pad"
                    autoCorrect={false}
                    returnKeyType="done"
                    error={didTry ? fiatAccountNumberError : undefined}
                    onFocus={() => handleInputFocus(300)}
                  />
                </>
              )}

              {/* NGN: Bank picker + account number + auto-resolved name */}
              {fiatCurrency === 'NGN' && (
                <>
                  <View>
                    <Text className="mb-1.5 font-subtitle text-[13px] text-text-secondary">
                      Bank
                    </Text>
                    <Pressable
                      onPress={() => {
                        selection();
                        setNgnBankSheetOpen(true);
                      }}
                      className="flex-row items-center justify-between rounded-xl border border-[#D4D4D8] px-4 py-3.5">
                      <Text
                        className={`font-body text-[15px] ${ngnBank ? 'text-text-primary' : 'text-[#9CA3AF]'}`}>
                        {ngnBank?.name ?? 'Select bank'}
                      </Text>
                      <HugeiconsIcon icon={ArrowDown01Icon} size={18} color="#9CA3AF" />
                    </Pressable>
                  </View>
                  <Input
                    label="Account Number"
                    value={ngnAccountNumber}
                    onChangeText={(v: string) =>
                      setNgnAccountNumber(v.replace(/\D/g, '').slice(0, 10))
                    }
                    placeholder="10-digit account number"
                    keyboardType="number-pad"
                    autoCorrect={false}
                    returnKeyType="done"
                    error={
                      didTry && ngnAccountNumber.length > 0 && ngnAccountNumber.length !== 10
                        ? 'Must be 10 digits'
                        : undefined
                    }
                    onFocus={() => handleInputFocus(250)}
                  />
                  {ngnAccountName ? (
                    <Animated.View
                      entering={FadeIn.duration(200)}
                      className="flex-row items-center gap-2 rounded-xl bg-[#F0FDF4] px-4 py-3">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} color="#16A34A" />
                      <Text className="flex-1 font-subtitle text-[14px] text-[#16A34A]">
                        {ngnAccountName}
                      </Text>
                    </Animated.View>
                  ) : pajResolve.isPending ? (
                    <View className="flex-row items-center gap-2 rounded-xl bg-[#F9FAFB] px-4 py-3">
                      <Text className="font-body text-[13px] text-text-secondary">
                        Resolving account…
                      </Text>
                    </View>
                  ) : null}
                  {/* Save toggle */}
                  <Pressable
                    onPress={() => setNgnSaveBank(!ngnSaveBank)}
                    className="flex-row items-center gap-2 py-1">
                    <View
                      className={`size-5 items-center justify-center rounded ${ngnSaveBank ? 'bg-[#070914]' : 'border border-[#D4D4D8]'}`}>
                      {ngnSaveBank && <Text className="text-[10px] text-white">✓</Text>}
                    </View>
                    <Text className="font-body text-[13px] text-text-secondary">
                      Save this recipient
                    </Text>
                  </Pressable>
                </>
              )}
            </Animated.View>
          )}

          <View className="my-2 h-px bg-gray-100" />

          {/* Category picker */}
          <Animated.View entering={FadeInUp.delay(120).duration(250)} className="mb-4 mt-4">
            <Text className="mb-2 font-subtitle text-[13px] text-text-secondary">Category</Text>
            <Pressable
              onPress={() => {
                selection();
                setCategorySheetOpen(true);
              }}
              className="flex-row items-center justify-between rounded-xl border border-[#D4D4D8] px-4 py-3.5">
              <View className="flex-row items-center gap-3">
                <View
                  className="size-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: selectedCategory.color + '18' }}>
                  <HugeiconsIcon
                    icon={selectedCategory.icon}
                    size={16}
                    color={selectedCategory.color}
                  />
                </View>
                <Text className="font-body text-[15px] text-text-primary">
                  {selectedCategory.label}
                </Text>
              </View>
              <HugeiconsIcon icon={ArrowDown01Icon} size={18} color="#9CA3AF" />
            </Pressable>
          </Animated.View>

          {/* Note */}
          <Animated.View entering={FadeInUp.delay(160).duration(250)}>
            <Input
              label="Note"
              value={narration}
              onChangeText={setNarration}
              placeholder="What's this for? (optional)"
              maxLength={255}
              multiline
              returnKeyType="done"
              blurOnSubmit
              onFocus={() => handleInputFocus(450)}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky footer — outside KeyboardAvoidingView so it stays at screen bottom */}
      <View
        className="border-t border-gray-100 bg-white px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <View className="mb-3 gap-1.5">
          <View className="flex-row items-center justify-between px-1">
            <Text className="font-body text-[13px] text-text-secondary">Amount</Text>
            <Text className="font-body text-[13px] text-text-primary">
              {isNGN
                ? `₦${formatCurrency(numericAmount)}`
                : `${isStablecoin ? '' : cc.symbol}${formatCurrency(numericAmount)} ${assetLabel}`}
            </Text>
          </View>
          {isNGN && offRampRate > 0 && (
            <View className="flex-row items-center justify-between px-1">
              <Text className="font-body text-[13px] text-text-secondary">Rate</Text>
              <Text className="font-body text-[13px] text-text-primary">
                ₦{offRampRate.toLocaleString()}/USD
              </Text>
            </View>
          )}
          {isNGN && ngnUsdEquivalent > 0 && (
            <View className="flex-row items-center justify-between px-1">
              <Text className="font-body text-[13px] text-text-secondary">USD equivalent</Text>
              <Text className="font-subtitle text-[13px] text-text-primary">
                ≈ ${ngnUsdEquivalent.toFixed(2)}
              </Text>
            </View>
          )}
          {!isNGN && feeAmount > 0 && (
            <View className="flex-row items-center justify-between px-1">
              <Text className="font-body text-[13px] text-text-secondary">Network fee</Text>
              <Text className="font-body text-[13px] text-text-primary">
                ${formatCurrency(feeAmount)}
              </Text>
            </View>
          )}
          <View className="mx-1 my-1 h-px bg-gray-100" />
          <View className="flex-row items-center justify-between px-1">
            <Text className="font-subtitle text-[14px] text-text-primary">Total</Text>
            <Text className="font-subtitle text-[16px] text-text-primary">
              {isNGN
                ? `₦${formatCurrency(numericAmount)}`
                : `${isStablecoin ? '' : cc.symbol}${formatCurrency(totalAmount)} ${assetLabel}`}
            </Text>
          </View>
        </View>
        <Button
          title={isNGN ? (ngnSubmitting ? 'Sending…' : 'Confirm & Send') : 'Review & Confirm'}
          variant="orange"
          onPress={onContinue}
          disabled={ngnSubmitting}
        />
      </View>

      {/* Chain picker sheet */}
      <GorhomBottomSheet
        visible={chainSheetOpen}
        onClose={() => setChainSheetOpen(false)}
        showCloseButton={false}>
        <Text className="font-subtitle text-[20px] text-[#070914]">Select Network</Text>
        <Text className="mb-5 font-body text-[13px] text-[#9CA3AF]">
          Choose the network to withdraw {assetLabel} on
        </Text>

        {/* Bridge-native chains */}
        {withdrawalChains.some((c) => c.via === 'bridge') && (
          <Text className="mb-2 font-caption text-[11px] uppercase tracking-wider text-[#9CA3AF]">
            Networks
          </Text>
        )}
        {withdrawalChains
          .filter((c) => c.via === 'bridge')
          .map((chain) => {
            const selected = destinationChain === chain.chain;
            return (
              <Pressable
                key={chain.chain}
                onPress={() => {
                  selection();
                  setDestinationChain(chain.chain);
                  setChainSheetOpen(false);
                }}
                className="mb-2 flex-row items-center gap-4 rounded-2xl border border-[#F3F4F6] bg-white px-4 py-3.5 active:bg-[#F9FAFB]">
                <View
                  className="size-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: chain.color + '14' }}>
                  <ChainLogo chain={chain.chain} size={22} />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="font-subtitle text-[15px] text-[#070914]">{chain.label}</Text>
                    {isEVMChain(chain.chain) && (
                      <View className="rounded-md bg-[#F3F4F6] px-1.5 py-0.5">
                        <Text className="font-caption text-[10px] text-[#9CA3AF]">EVM</Text>
                      </View>
                    )}
                  </View>
                  <Text className="font-body text-[13px] text-[#9CA3AF]">
                    {assetLabel} · {chain.shortLabel}
                  </Text>
                </View>
                {selected && (
                  <View className="h-5 w-5 items-center justify-center rounded-full bg-[#070914]">
                    <Text className="font-subtitle text-[10px] text-white">✓</Text>
                  </View>
                )}
              </Pressable>
            );
          })}

        {/* ChainRails-routed chains */}
        {withdrawalChains.some((c) => c.via === 'chainrails') && (
          <Text className="mb-2 mt-3 font-caption text-[11px] uppercase tracking-wider text-[#9CA3AF]">
            Cross-chain
          </Text>
        )}
        {withdrawalChains
          .filter((c) => c.via === 'chainrails')
          .map((chain) => {
            const selected = destinationChain === chain.chain;
            return (
              <Pressable
                key={chain.chain}
                onPress={() => {
                  selection();
                  setDestinationChain(chain.chain);
                  setChainSheetOpen(false);
                }}
                className="mb-2 flex-row items-center gap-4 rounded-2xl border border-[#F3F4F6] bg-white px-4 py-3.5 active:bg-[#F9FAFB]">
                <View
                  className="size-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: chain.color + '14' }}>
                  <ChainLogo chain={chain.chain} size={22} />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="font-subtitle text-[15px] text-[#070914]">{chain.label}</Text>
                    {isEVMChain(chain.chain) && (
                      <View className="rounded-md bg-[#F3F4F6] px-1.5 py-0.5">
                        <Text className="font-caption text-[10px] text-[#9CA3AF]">EVM</Text>
                      </View>
                    )}
                  </View>
                  <Text className="font-body text-[13px] text-[#9CA3AF]">
                    {assetLabel} · {chain.shortLabel}
                  </Text>
                </View>
                {selected && (
                  <View className="h-5 w-5 items-center justify-center rounded-full bg-[#070914]">
                    <Text className="font-subtitle text-[10px] text-white">✓</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
      </GorhomBottomSheet>

      {/* Category picker sheet */}
      <GorhomBottomSheet
        visible={categorySheetOpen}
        onClose={() => setCategorySheetOpen(false)}
        showCloseButton={false}>
        <Text className="font-subtitle text-[20px] text-text-primary">Select Category</Text>
        <Text className="mb-5 mt-1 font-body text-[13px] text-text-secondary">
          Categorize this transaction for your records
        </Text>
        <View className="gap-1">
          {CATEGORIES.map((cat) => {
            const selected = category === cat.label;
            return (
              <Pressable
                key={cat.label}
                onPress={() => {
                  selection();
                  setCategory(cat.label);
                  setCategorySheetOpen(false);
                }}
                className="flex-row items-center gap-4 rounded-2xl px-4 py-3.5 active:bg-surface"
                style={selected ? { backgroundColor: '#F9FAFB' } : undefined}>
                <View
                  className="size-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: cat.color + '18' }}>
                  <HugeiconsIcon icon={cat.icon} size={20} color={cat.color} />
                </View>
                <Text
                  className={`flex-1 text-[15px] ${selected ? 'font-subtitle text-text-primary' : 'font-body text-text-secondary'}`}>
                  {cat.label}
                </Text>
                {selected && (
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} color="#111827" />
                )}
              </Pressable>
            );
          })}
        </View>
      </GorhomBottomSheet>

      {/* NGN bank picker sheet */}
      <GorhomBottomSheet
        visible={ngnBankSheetOpen}
        onClose={() => {
          setNgnBankSheetOpen(false);
          setNgnBankSearch('');
        }}
        showCloseButton={false}
        snapPoints={['70%']}>
        <Text className="font-subtitle text-[20px] text-text-primary">Select Bank</Text>
        <View
          className="mb-4 mt-4 flex-row items-center gap-3 rounded-2xl bg-[#F3F4F6] px-4"
          style={{ height: 48 }}>
          <HugeiconsIcon icon={Search01Icon} size={18} color="#9CA3AF" />
          <BottomSheetTextInput
            className="flex-1 font-body text-[15px] text-text-primary"
            placeholder="Search banks"
            placeholderTextColor="#9CA3AF"
            value={ngnBankSearch}
            onChangeText={setNgnBankSearch}
            autoCorrect={false}
            style={{ flex: 1, fontFamily: 'SFProDisplay-Regular', fontSize: 15, color: '#070914' }}
          />
        </View>
        <ScrollView
          style={{ maxHeight: 400 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Saved banks first */}
          {savedBanksList.length > 0 && !ngnBankSearch && (
            <>
              <Text className="mb-2 font-caption text-[11px] uppercase tracking-wider text-[#9CA3AF]">
                Saved
              </Text>
              {savedBanksList.map((s) => {
                const bank = pajBanks.find((b) => b.name === s.bank || b.id === s.bank);
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => {
                      selection();
                      if (bank) setNgnBank(bank);
                      setNgnAccountNumber(s.accountNumber);
                      setNgnAccountName(s.accountName);
                      setNgnBankSheetOpen(false);
                    }}
                    className="flex-row items-center gap-3 rounded-xl px-2 py-3 active:bg-[#F9FAFB]">
                    <View className="size-9 items-center justify-center rounded-full bg-[#F3F4F6]">
                      <Text className="font-subtitle text-[12px] text-text-secondary">
                        {(bank?.name ?? s.bank).slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-subtitle text-[14px] text-text-primary">
                        {s.accountName}
                      </Text>
                      <Text className="font-body text-[12px] text-text-secondary">
                        {bank?.name ?? s.bank} · ••{s.accountNumber.slice(-4)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
              <View className="my-3 h-px bg-gray-100" />
              <Text className="mb-2 font-caption text-[11px] uppercase tracking-wider text-[#9CA3AF]">
                All Banks
              </Text>
            </>
          )}
          {filteredPajBanks.map((bank) => (
            <Pressable
              key={bank.id}
              onPress={() => {
                selection();
                setNgnBank(bank);
                setNgnAccountNumber('');
                setNgnAccountName('');
                setNgnBankSheetOpen(false);
              }}
              className="flex-row items-center gap-3 rounded-xl px-2 py-3 active:bg-[#F9FAFB]">
              <View className="size-9 items-center justify-center rounded-full bg-[#F3F4F6]">
                <Text className="font-subtitle text-[12px] text-text-secondary">
                  {bank.name.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <Text className="flex-1 font-body text-[14px] text-text-primary">{bank.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </GorhomBottomSheet>
    </SafeAreaView>
  );
}
