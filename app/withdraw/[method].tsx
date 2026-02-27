import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Passkey } from 'react-native-passkey';
import { ArrowLeft, CheckCircle2, ShieldAlert, X } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  FadeInUp,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import { useKYCStatus, useStation, useVerifyPasscode } from '@/api/hooks';
import { useWalletAddresses } from '@/api/hooks/useWallet';
import { authService } from '@/api/services';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Keypad } from '@/components/molecules/Keypad';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';
import { BottomSheet, KYCVerificationSheet } from '@/components/sheets';
import { Button, Input } from '@/components/ui';
import {
  useDeposits,
  useInitiateFiatWithdrawal,
  useInitiateWithdrawal,
} from '@/api/hooks/useFunding';
import { invalidateQueries, queryClient, queryKeys } from '@/api/queryClient';
import { useAuthStore } from '@/stores/authStore';
import { SessionManager } from '@/utils/sessionManager';
import { SOLANA_TESTNET_CHAIN } from '@/utils/chains';
import { ANALYTICS_EVENTS, useAnalytics } from '@/utils/analytics';
import {
  getNativePasskey,
  isPasskeyCancelledError,
  getPasskeyFallbackMessage,
} from '@/utils/passkeyNative';
import { layout, moderateScale, responsive } from '@/utils/layout';
import type { Deposit } from '@/api/types';
import {
  beginPasskeyPrompt,
  canStartPasskeyPrompt,
  endPasskeyPrompt,
  markPasskeyPromptSuccess,
} from '@/utils/passkeyPromptGuard';

const BRAND_RED = '#FF2E01';

const springConfig = { damping: 15, stiffness: 200, mass: 0.8 };
const gentleSpring = { damping: 20, stiffness: 150, mass: 1 };
const FUNDING_POLL_INTERVAL_MS = 2_000;
const FUNDING_POLL_TIMEOUT_MS = 90_000;

type WithdrawMethod = 'fiat' | 'crypto';
type ExtendedWithdrawMethod = WithdrawMethod | 'phantom' | 'solflare' | 'asset-buy' | 'asset-sell';
type FundingFlow = 'send' | 'fund';

const METHOD_ALIASES: Record<string, ExtendedWithdrawMethod> = {
  fiat: 'fiat',
  crypto: 'crypto',
  phantom: 'phantom',
  solflare: 'solflare',
  'fund-phantom': 'phantom',
  'fund-solflare': 'solflare',
  'asset-buy': 'asset-buy',
  'asset-sell': 'asset-sell',
  'stock-buy': 'asset-buy',
  'stock-sell': 'asset-sell',
  'buy-stock': 'asset-buy',
  'sell-stock': 'asset-sell',
  buy: 'asset-buy',
  sell: 'asset-sell',
};

const resolveMethod = (value?: string): ExtendedWithdrawMethod => {
  if (!value) return 'crypto';
  return METHOD_ALIASES[value.toLowerCase()] ?? 'crypto';
};

const resolveFlow = (value?: string): FundingFlow => {
  if (!value) return 'send';
  return value.toLowerCase() === 'fund' ? 'fund' : 'send';
};

const isWalletFundingMethod = (method: ExtendedWithdrawMethod): method is 'phantom' | 'solflare' =>
  method === 'phantom' || method === 'solflare';

const LIMITS: Record<ExtendedWithdrawMethod, number> = {
  fiat: 10_000,
  crypto: 50_000,
  phantom: 50_000,
  solflare: 50_000,
  'asset-buy': 100_000,
  'asset-sell': 100_000,
};

const FALLBACK_AVAILABLE_BALANCE = 0;
const MAX_INTEGER_DIGITS = 12;

const METHOD_COPY: Record<
  ExtendedWithdrawMethod,
  {
    title: string;
    subtitle: string;
    limitLabel: string;
    detailTitle: string;
    detailHint: string;
    detailLabel: string;
    detailPlaceholder: string;
  }
> = {
  fiat: {
    title: 'Withdraw to Bank',
    subtitle: 'Send USD to a linked US bank account',
    limitLabel: 'Fiat withdrawal limit',
    detailTitle: 'Add bank routing number',
    detailHint: 'We use this routing number to deliver your fiat withdrawal.',
    detailLabel: 'Routing number',
    detailPlaceholder: '9-digit routing number',
  },
  crypto: {
    title: 'Withdraw to Wallet',
    subtitle: 'Send assets to an external wallet address',
    limitLabel: 'Crypto withdrawal limit',
    detailTitle: 'Add wallet address',
    detailHint: 'Double-check this address. Crypto withdrawals cannot be reversed.',
    detailLabel: 'Wallet address',
    detailPlaceholder: 'Paste wallet address',
  },
  phantom: {
    title: 'Send to Phantom',
    subtitle: 'Send assets to your Phantom wallet',
    limitLabel: 'Wallet withdrawal limit',
    detailTitle: 'Add Phantom wallet address',
    detailHint: 'Use your Solana wallet address from Phantom.',
    detailLabel: 'Phantom wallet address',
    detailPlaceholder: 'Paste Phantom address',
  },
  solflare: {
    title: 'Send to Solflare',
    subtitle: 'Send assets to your Solflare wallet',
    limitLabel: 'Wallet withdrawal limit',
    detailTitle: 'Add Solflare wallet address',
    detailHint: 'Use your Solana wallet address from Solflare.',
    detailLabel: 'Solflare wallet address',
    detailPlaceholder: 'Paste Solflare address',
  },
  'asset-buy': {
    title: 'Buy asset',
    subtitle: 'Set amount and symbol for an asset buy',
    limitLabel: 'Asset buy limit',
    detailTitle: 'Add asset symbol',
    detailHint: 'Use the symbol you want to buy, like AAPL, SPY, or BTC.',
    detailLabel: 'Asset symbol',
    detailPlaceholder: 'AAPL',
  },
  'asset-sell': {
    title: 'Sell asset',
    subtitle: 'Set amount and symbol for an asset sell',
    limitLabel: 'Asset sell limit',
    detailTitle: 'Add asset symbol',
    detailHint: 'Use the symbol you want to sell, like AAPL, SPY, or BTC.',
    detailLabel: 'Asset symbol',
    detailPlaceholder: 'AAPL',
  },
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const toDisplayAmount = (rawAmount: string) => {
  const normalized = rawAmount || '0';
  const hasDecimal = normalized.includes('.');
  const [intPartRaw, decimalPart = ''] = normalized.split('.');

  const intPart = intPartRaw.replace(/^0+(?=\d)/, '') || '0';
  const groupedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return hasDecimal ? `${groupedInt}.${decimalPart}` : groupedInt;
};

const normalizeAmount = (nextValue: string) => {
  if (!nextValue || nextValue === '.') {
    return '0';
  }

  if (nextValue.includes('.')) {
    const [intPartRaw, decimalPart = ''] = nextValue.split('.');
    const intPart = intPartRaw.replace(/^0+(?=\d)/, '') || '0';
    return `${intPart}.${decimalPart}`;
  }

  return nextValue.replace(/^0+(?=\d)/, '') || '0';
};

const formatMaxAmount = (amount: number) => {
  const fixed = amount.toFixed(2);
  return fixed.endsWith('.00') ? String(Math.trunc(amount)) : fixed;
};

type ProfileNamePayload = {
  email?: string;
};

type WebAuthnOptionsPayload = {
  publicKey?: Record<string, any>;
  [key: string]: any;
};

const safeName = (value?: string) => value?.trim() || '';

const normalizePasskeyGetRequest = (options: WebAuthnOptionsPayload) => {
  const publicKey = (options?.publicKey ?? options) as Record<string, any>;

  if (!publicKey?.challenge || !publicKey?.rpId) {
    throw new Error('Invalid passkey options from server');
  }

  return {
    challenge: publicKey.challenge,
    rpId: publicKey.rpId,
    timeout: publicKey.timeout,
    allowCredentials: publicKey.allowCredentials,
    userVerification: publicKey.userVerification,
    extensions: publicKey.extensions,
  };
};

// Animated amount display component with smooth transitions
function AnimatedAmount({ amount }: { amount: string }) {
  const scale = useSharedValue(1);
  const prevAmountRef = useRef(amount);

  useEffect(() => {
    if (prevAmountRef.current !== amount) {
      scale.value = withSequence(
        withTiming(1.03, { duration: 80 }),
        withSpring(1, { damping: 12, stiffness: 300, mass: 0.5 })
      );
      prevAmountRef.current = amount;
    }
  }, [amount]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Dynamic font size based on character count (including $ sign)
  const displayText = `$${amount}`;
  const len = displayText.length;
  const baseSize =
    len <= 4
      ? responsive({ default: 95, tall: 89, android: 84 })
      : len <= 7
        ? responsive({ default: 79, tall: 74, android: 68 })
        : len <= 10
          ? responsive({ default: 58, tall: 54, android: 50 })
          : len <= 14
            ? responsive({ default: 40, tall: 38, android: 36 })
            : responsive({ default: 42, tall: 39, android: 37 });
  const fontSize = moderateScale(baseSize, layout.isSeekerDevice ? 0.35 : 0.45);

  return (
    <Animated.View style={animatedStyle} className="w-full">
      <Text
        style={{
          fontFamily: 'SF-Pro-Rounded-Bold',
          fontSize,
          color: '#FFFFFF',
          textAlign: 'center',
          fontVariant: ['tabular-nums'],
        }}
        numberOfLines={1}>
        {displayText}
      </Text>
    </Animated.View>
  );
}

export default function WithdrawAmountScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user as ProfileNamePayload | undefined);
  const { data: station, refetch: refetchStation } = useStation();
  const params = useLocalSearchParams<{ method?: string; symbol?: string; flow?: string }>();

  const selectedMethod = resolveMethod(
    typeof params.method === 'string' ? params.method : undefined
  );
  const requestedFlow = resolveFlow(typeof params.flow === 'string' ? params.flow : undefined);
  const isFundFlow = requestedFlow === 'fund' && Platform.OS === 'android';
  const methodCopy = useMemo(() => {
    const base = METHOD_COPY[selectedMethod];
    if (!isFundFlow) return base;

    if (selectedMethod === 'phantom') {
      return {
        ...base,
        title: 'Fund with Phantom',
        subtitle: 'Send USDC from Phantom into your Rail wallet',
        limitLabel: 'Funding limit',
        detailTitle: 'Confirm funding details',
        detailHint: 'You will be redirected to Phantom to confirm this transfer.',
        detailLabel: 'Wallet',
        detailPlaceholder: 'Phantom',
      };
    }

    if (selectedMethod === 'solflare') {
      return {
        ...base,
        title: 'Fund with Solflare',
        subtitle: 'Send USDC from Solflare into your Rail wallet',
        limitLabel: 'Funding limit',
        detailTitle: 'Confirm funding details',
        detailHint: 'You will be redirected to Solflare to confirm this transfer.',
        detailLabel: 'Wallet',
        detailPlaceholder: 'Solflare',
      };
    }

    if (selectedMethod === 'crypto') {
      return {
        ...base,
        title: 'Fund with Wallet',
        subtitle: 'Move assets from your wallet into Rail',
        limitLabel: 'Funding limit',
      };
    }

    return base;
  }, [isFundFlow, selectedMethod]);
  const isFiatMethod = selectedMethod === 'fiat';
  const isAssetTradeMethod = selectedMethod === 'asset-buy' || selectedMethod === 'asset-sell';
  const isAssetBuyMethod = selectedMethod === 'asset-buy';
  const isCryptoDestinationMethod =
    selectedMethod === 'crypto' || selectedMethod === 'phantom' || selectedMethod === 'solflare';
  const isMobileWalletFundingFlow = isFundFlow && isWalletFundingMethod(selectedMethod);
  const { data: kycStatus, isLoading: isKycStatusLoading } = useKYCStatus(isFiatMethod);
  const isFiatApproved = kycStatus?.status === 'approved';
  const prefilledAssetSymbol = useMemo(() => {
    if (!isAssetTradeMethod) return '';
    const raw = typeof params.symbol === 'string' ? params.symbol : '';
    return raw
      .toUpperCase()
      .replace(/[^A-Z0-9.-]/g, '')
      .slice(0, 12);
  }, [isAssetTradeMethod, params.symbol]);

  const [rawAmount, setRawAmount] = useState('0');
  const [didTryContinue, setDidTryContinue] = useState(false);
  const [isDetailsSheetVisible, setIsDetailsSheetVisible] = useState(false);
  const [destinationInput, setDestinationInput] = useState(prefilledAssetSymbol);
  const [didTryDestination, setDidTryDestination] = useState(false);
  const [isAuthorizeScreenVisible, setIsAuthorizeScreenVisible] = useState(false);
  const [authPasscode, setAuthPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [isSubmissionSheetVisible, setIsSubmissionSheetVisible] = useState(false);
  const [submitWithActiveSession, setSubmitWithActiveSession] = useState(false);
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);
  const [showKycSheet, setShowKycSheet] = useState(false);
  const [fundingError, setFundingError] = useState('');
  const [fundingSignature, setFundingSignature] = useState('');
  const [isFundingPending, setIsFundingPending] = useState(false);
  const [fundingTimedOut, setFundingTimedOut] = useState(false);
  const [fundingConfirmed, setFundingConfirmed] = useState(false);
  const [isLaunchingWallet, setIsLaunchingWallet] = useState(false);
  const [fundingStartMs, setFundingStartMs] = useState<number | null>(null);
  const [fundingBaselineBalance, setFundingBaselineBalance] = useState<number | null>(null);

  const { track } = useAnalytics();

  useEffect(() => {
    if (!isAssetTradeMethod || !prefilledAssetSymbol) return;
    setDestinationInput((current) => current || prefilledAssetSymbol);
  }, [isAssetTradeMethod, prefilledAssetSymbol]);

  const { refetch: refetchWalletAddress } = useWalletAddresses(SOLANA_TESTNET_CHAIN);
  const deposits = useDeposits(30, 0);
  const { mutate: initiateWithdrawal, isPending: isSubmittingCrypto } = useInitiateWithdrawal();
  const { mutate: initiateFiatWithdrawal, isPending: isSubmittingFiat } =
    useInitiateFiatWithdrawal();
  const { mutate: verifyPasscode, isPending: isPasscodeVerifying } = useVerifyPasscode();
  const isSubmitting = isSubmittingCrypto || isSubmittingFiat;
  const isFundingActionLoading = isSubmitting || isLaunchingWallet;
  const isAuthorizing = isPasscodeVerifying || isPasskeyLoading;
  const passkeyPromptScope = `withdraw-authorize:${safeName(user?.email) || 'unknown'}`;

  // Animation values
  const headerOpacity = useSharedValue(0);
  const keypadTranslateY = useSharedValue(60);
  const pillsScale = useSharedValue(0.8);
  const pillsOpacity = useSharedValue(0);

  useEffect(() => {
    // Entrance animations
    headerOpacity.value = withTiming(1, { duration: 400 });
    keypadTranslateY.value = withSpring(0, { ...gentleSpring, damping: 18 });
  }, []);

  useEffect(() => {
    // Animate pills when amount changes from/to zero
    if (Number(rawAmount) > 0) {
      pillsScale.value = withSpring(1, springConfig);
      pillsOpacity.value = withTiming(1, { duration: 300 });
    } else {
      pillsScale.value = withSpring(0.9, gentleSpring);
      pillsOpacity.value = withTiming(0.7, { duration: 200 });
    }
  }, [rawAmount]);

  useEffect(() => {
    const hasEmail = Boolean(safeName(user?.email));
    setPasskeyAvailable(Passkey.isSupported() && hasEmail);
  }, [user?.email]);

  const availableBalance = useMemo(() => {
    const source =
      selectedMethod === 'asset-buy'
        ? station?.broker_cash
        : selectedMethod === 'asset-sell'
          ? station?.invest_balance
          : station?.spend_balance;
    const parsed = Number.parseFloat(source ?? '');
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
    return FALLBACK_AVAILABLE_BALANCE;
  }, [selectedMethod, station?.broker_cash, station?.invest_balance, station?.spend_balance]);

  const withdrawalLimit = LIMITS[selectedMethod];
  const maxWithdrawable = isFundFlow
    ? withdrawalLimit
    : Math.min(withdrawalLimit, availableBalance);

  const numericAmount = useMemo(() => {
    const parsed = Number.parseFloat(rawAmount);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [rawAmount]);

  const amountError = useMemo(() => {
    if (numericAmount <= 0) return 'Enter an amount greater than $0.00.';
    if (numericAmount > withdrawalLimit) {
      return `This amount is above your ${methodCopy.limitLabel.toLowerCase()} of $${formatCurrency(withdrawalLimit)}.`;
    }
    if (!isFundFlow && numericAmount > availableBalance) {
      return `Insufficient funds. You need $${formatCurrency(numericAmount - availableBalance)} more.`;
    }
    return '';
  }, [availableBalance, isFundFlow, methodCopy.limitLabel, numericAmount, withdrawalLimit]);

  const destinationError = useMemo(() => {
    if (isMobileWalletFundingFlow) {
      return '';
    }

    if (!destinationInput.trim()) {
      if (selectedMethod === 'fiat') return 'Routing number is required.';
      if (selectedMethod === 'asset-buy' || selectedMethod === 'asset-sell') {
        return 'Asset symbol is required.';
      }
      return 'Wallet address is required.';
    }

    if (isFiatMethod) {
      const digitsOnly = destinationInput.replace(/\D/g, '');
      if (digitsOnly.length !== 9) {
        return 'Routing number must be exactly 9 digits.';
      }
    }

    if (isAssetTradeMethod) {
      const ticker = destinationInput.trim().toUpperCase();
      if (!/^[A-Z][A-Z0-9.-]{0,11}$/.test(ticker)) {
        return 'Enter a valid asset symbol (e.g. AAPL).';
      }
    }

    if (isCryptoDestinationMethod) {
      const trimmedAddress = destinationInput.trim();
      if (trimmedAddress.length < 18) {
        return 'Wallet address looks too short.';
      }
    }

    return '';
  }, [
    destinationInput,
    isAssetTradeMethod,
    isCryptoDestinationMethod,
    isFiatMethod,
    isMobileWalletFundingFlow,
    selectedMethod,
  ]);

  const canContinue = Boolean(numericAmount > 0 && !amountError);
  const canSaveDestination = Boolean(!destinationError);

  const onAmountKeyPress = useCallback(
    (key: string) => {
      setDidTryContinue(false);

      setRawAmount((current) => {
        if (key === 'backspace') {
          if (current === '0') return current;
          const nextValue = current.slice(0, -1);
          return normalizeAmount(nextValue);
        }

        if (key === 'decimal') {
          if (current.includes('.')) return current;
          return `${current}.`;
        }

        if (!/^\d$/.test(key)) {
          return current;
        }

        if (current.includes('.')) {
          const [intPart, decimalPart = ''] = current.split('.');
          if (decimalPart.length >= 2) return current;
          return `${intPart}.${decimalPart}${key}`;
        }

        const nextInt = current === '0' ? key : `${current}${key}`;
        const trimmedInt = nextInt.replace(/^0+(?=\d)/, '') || '0';

        if (trimmedInt.length > MAX_INTEGER_DIGITS) {
          return current;
        }

        // Cap input at the maximum withdrawable amount
        const nextNumeric = Number.parseFloat(trimmedInt);
        if (nextNumeric > maxWithdrawable) {
          return formatMaxAmount(maxWithdrawable);
        }

        return trimmedInt;
      });
    },
    [maxWithdrawable]
  );

  const onMaxPress = useCallback(() => {
    setDidTryContinue(false);
    setRawAmount(formatMaxAmount(maxWithdrawable));
  }, [maxWithdrawable]);

  const onContinuePress = useCallback(() => {
    setDidTryContinue(true);
    setFundingError('');

    if (!canContinue) {
      return;
    }

    setDidTryDestination(false);
    setIsDetailsSheetVisible(true);
  }, [canContinue]);

  const hasDepositWithSignature = useCallback(
    (entries: Deposit[] | undefined, signature: string) => {
      if (!entries?.length || !signature.trim()) return false;
      const target = signature.trim().toLowerCase();
      return entries.some((entry) => String(entry.tx_hash || '').toLowerCase() === target);
    },
    []
  );

  const checkFundingConfirmation = useCallback(async () => {
    if (!isMobileWalletFundingFlow || !fundingStartMs) return;

    const elapsed = Date.now() - fundingStartMs;
    if (elapsed > FUNDING_POLL_TIMEOUT_MS) {
      setIsFundingPending(false);
      setFundingTimedOut(true);
      setIsSubmissionSheetVisible(true);
      track('deposit_failed', {
        wallet: selectedMethod,
        amount: Number(numericAmount.toFixed(2)),
        signature: fundingSignature || undefined,
        reason: 'poll_timeout',
      });
      return;
    }

    const [depositsResult, stationResult] = await Promise.all([
      deposits.refetch(),
      refetchStation(),
      invalidateQueries.funding(),
      invalidateQueries.station(),
    ]);

    const signatureConfirmed = hasDepositWithSignature(
      depositsResult.data?.deposits,
      fundingSignature
    );
    const latestSpend = Number.parseFloat(stationResult.data?.spend_balance ?? '');
    const baseline = fundingBaselineBalance ?? 0;
    const balanceConfirmed =
      Number.isFinite(latestSpend) &&
      latestSpend >= baseline + Number(numericAmount.toFixed(2)) - 0.01;

    if (!signatureConfirmed && !balanceConfirmed) return;

    setIsFundingPending(false);
    setFundingTimedOut(false);
    setFundingConfirmed(true);
    setIsSubmissionSheetVisible(true);
    track(ANALYTICS_EVENTS.DEPOSIT_COMPLETED, {
      wallet: selectedMethod,
      amount: Number(numericAmount.toFixed(2)),
      signature: fundingSignature || undefined,
      confirmation: signatureConfirmed ? 'tx_hash' : 'balance_delta',
    });
    void Promise.all([
      queryClient.refetchQueries({ queryKey: queryKeys.station.home(), type: 'active' }),
      queryClient.refetchQueries({ queryKey: queryKeys.funding.all, type: 'active' }),
      queryClient.refetchQueries({ queryKey: queryKeys.wallet.all, type: 'active' }),
    ]);
  }, [
    deposits,
    fundingBaselineBalance,
    fundingSignature,
    fundingStartMs,
    hasDepositWithSignature,
    isMobileWalletFundingFlow,
    numericAmount,
    refetchStation,
    selectedMethod,
    track,
  ]);

  const startMobileWalletFunding = useCallback(async () => {
    if (!isMobileWalletFundingFlow) return;

    setFundingError('');
    setFundingTimedOut(false);
    setFundingConfirmed(false);
    setIsLaunchingWallet(true);

    try {
      const walletResult = await refetchWalletAddress();
      const recipientOwnerAddress = walletResult.data?.address?.trim();
      if (!recipientOwnerAddress) {
        throw new Error('Unable to load your Rail wallet address. Please try again.');
      }

      const nextFundingAmount = Number(numericAmount.toFixed(2));
      const baselineBalance = Number.parseFloat(station?.spend_balance ?? '');
      setFundingBaselineBalance(Number.isFinite(baselineBalance) ? baselineBalance : 0);

      track(ANALYTICS_EVENTS.DEPOSIT_INITIATED, {
        wallet: selectedMethod,
        amount: nextFundingAmount,
      });

      const { startMobileWalletFunding: startMobileWalletFundingTransfer } =
        await import('@/services/solanaFunding');

      const fundingResult = await startMobileWalletFundingTransfer({
        wallet: selectedMethod,
        amountUsd: nextFundingAmount,
        recipientOwnerAddress,
      });

      setIsDetailsSheetVisible(false);
      setIsSubmissionSheetVisible(true);
      setIsFundingPending(true);
      setFundingSignature(fundingResult.signature);
      setFundingStartMs(Date.now());
      setDestinationInput('');
    } catch (error) {
      const errorCode = String(
        (error as { code?: string })?.code ||
          (error as { category?: string })?.category ||
          'UNKNOWN'
      );
      const message = String(
        (error as { message?: string })?.message || 'Funding failed. Please try again.'
      );
      setFundingError(message);
      track('deposit_failed', {
        wallet: selectedMethod,
        amount: Number(numericAmount.toFixed(2)),
        reason: errorCode,
      });
    } finally {
      setIsLaunchingWallet(false);
    }
  }, [
    isMobileWalletFundingFlow,
    numericAmount,
    refetchWalletAddress,
    selectedMethod,
    station?.spend_balance,
    track,
  ]);

  useEffect(() => {
    if (!isFundingPending) return;
    const pollTimer = setInterval(() => {
      void checkFundingConfirmation();
    }, FUNDING_POLL_INTERVAL_MS);
    return () => clearInterval(pollTimer);
  }, [checkFundingConfirmation, isFundingPending]);

  useEffect(() => {
    if (!isFundingPending) return;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void checkFundingConfirmation();
      }
    });
    return () => subscription.remove();
  }, [checkFundingConfirmation, isFundingPending]);

  const hasActivePasscodeSession = useCallback(() => {
    const authState = useAuthStore.getState();
    if (!authState.isAuthenticated || !authState.passcodeSessionToken) {
      return false;
    }
    return !SessionManager.isPasscodeSessionExpired();
  }, []);

  const onSaveDestination = useCallback(() => {
    if (isMobileWalletFundingFlow) {
      void startMobileWalletFunding();
      return;
    }

    setDidTryDestination(true);
    setAuthError('');

    if (!canSaveDestination) return;

    setIsDetailsSheetVisible(false);
    setAuthPasscode('');
    if (hasActivePasscodeSession()) {
      setIsAuthorizeScreenVisible(false);
      setSubmitWithActiveSession(true);
      return;
    }

    setIsAuthorizeScreenVisible(true);
  }, [
    canSaveDestination,
    hasActivePasscodeSession,
    isMobileWalletFundingFlow,
    startMobileWalletFunding,
  ]);

  const onCloseSubmittedSheet = useCallback(() => {
    setIsSubmissionSheetVisible(false);
    setRawAmount('0');
    setDestinationInput('');
    setDidTryContinue(false);
    setDidTryDestination(false);
    setFundingError('');
    setFundingSignature('');
    setIsFundingPending(false);
    setFundingTimedOut(false);
    setFundingConfirmed(false);
    setFundingStartMs(null);
    setFundingBaselineBalance(null);
  }, []);

  const onDismissSubmittedSheet = useCallback(() => {
    if (isMobileWalletFundingFlow && isFundingPending) {
      setIsSubmissionSheetVisible(false);
      return;
    }
    onCloseSubmittedSheet();
  }, [isFundingPending, isMobileWalletFundingFlow, onCloseSubmittedSheet]);

  const onSubmitAuthorizedWithdrawal = useCallback(() => {
    const normalizedAmount = Number(numericAmount.toFixed(2));
    const destination = destinationInput.trim();

    const onSuccess = () => {
      setIsAuthorizeScreenVisible(false);
      setIsSubmissionSheetVisible(true);
      setAuthPasscode('');
      setAuthError('');
      void Promise.all([
        invalidateQueries.station(),
        invalidateQueries.funding(),
        invalidateQueries.allocation(),
        invalidateQueries.wallet(),
        queryClient.refetchQueries({ queryKey: queryKeys.station.home(), type: 'active' }),
        queryClient.refetchQueries({ queryKey: queryKeys.funding.all, type: 'active' }),
      ]);
    };

    const onError = (err: any) => {
      const errorMarker = String(err?.code || err?.error?.code || err?.message || '').toUpperCase();
      if (
        errorMarker.includes('PASSCODE_SESSION_REQUIRED') ||
        errorMarker.includes('PASSCODE_SESSION_INVALID')
      ) {
        setIsAuthorizeScreenVisible(true);
        setAuthError('Authorization expired. Confirm with passkey or PIN to continue.');
        return;
      }

      setIsAuthorizeScreenVisible(true);
      setAuthError(
        err?.message || `${isFundFlow ? 'Funding' : 'Withdrawal'} failed. Please try again.`
      );
    };

    if (selectedMethod === 'crypto') {
      initiateWithdrawal(
        {
          amount: normalizedAmount,
          destination_address: destination,
        },
        {
          onSuccess,
          onError,
        }
      );
      return;
    }

    if (selectedMethod === 'phantom' || selectedMethod === 'solflare') {
      if (isFundFlow) {
        setIsAuthorizeScreenVisible(false);
        setAuthPasscode('');
        setAuthError('');
        void startMobileWalletFunding();
        return;
      }

      initiateWithdrawal(
        {
          amount: normalizedAmount,
          destination_address: destination,
        },
        {
          onSuccess,
          onError,
        }
      );
      return;
    }

    if (selectedMethod === 'asset-buy' || selectedMethod === 'asset-sell') {
      setIsAuthorizeScreenVisible(false);
      setAuthPasscode('');
      setAuthError('');
      router.push({
        pathname: '/market-asset/trade',
        params: {
          symbol: destination.toUpperCase(),
          side: selectedMethod === 'asset-buy' ? 'buy' : 'sell',
          amount: normalizedAmount.toFixed(2),
        },
      } as any);
      return;
    }

    initiateFiatWithdrawal(
      {
        amount: normalizedAmount,
        currency: 'USD',
        routing_number: destination.replace(/\D/g, ''),
      },
      {
        onSuccess,
        onError,
      }
    );
  }, [
    destinationInput,
    initiateFiatWithdrawal,
    initiateWithdrawal,
    isFundFlow,
    numericAmount,
    selectedMethod,
    startMobileWalletFunding,
  ]);

  useEffect(() => {
    if (!submitWithActiveSession) return;
    setSubmitWithActiveSession(false);
    onSubmitAuthorizedWithdrawal();
  }, [onSubmitAuthorizedWithdrawal, submitWithActiveSession]);

  const onPasscodeAuthorize = useCallback(
    (code: string) => {
      if (isAuthorizing || isSubmitting) return;

      setAuthError('');

      verifyPasscode(
        { passcode: code },
        {
          onSuccess: (result) => {
            if (!result.verified) {
              setAuthError('Invalid PIN. Please try again.');
              setAuthPasscode('');
              return;
            }
            onSubmitAuthorizedWithdrawal();
          },
          onError: (err: any) => {
            setAuthError(err?.error?.message || err?.message || 'Failed to verify PIN.');
            setAuthPasscode('');
          },
        }
      );
    },
    [isAuthorizing, isSubmitting, onSubmitAuthorizedWithdrawal, verifyPasscode]
  );

  const onPasskeyAuthorize = useCallback(async () => {
    if (isAuthorizing || isSubmitting) return;

    const email = safeName(user?.email);
    if (!Passkey.isSupported() || !email) {
      setAuthError('Passkey is unavailable. Enter your PIN to continue.');
      return;
    }

    if (!canStartPasskeyPrompt(passkeyPromptScope, 'manual')) return;
    if (!beginPasskeyPrompt()) return;

    setAuthError('');
    setIsPasskeyLoading(true);

    try {
      const beginResponse = await authService.beginPasskeyLogin({ email });
      const passkeyRequest = normalizePasskeyGetRequest(beginResponse.options);
      const assertion = await getNativePasskey(passkeyRequest);

      const finishResponse = await authService.finishPasskeyLogin({
        sessionId: beginResponse.sessionId,
        response: {
          ...assertion,
          type: assertion.type || 'public-key',
        },
      });

      const nowIso = new Date().toISOString();
      const passcodeSessionToken = String(finishResponse.passcodeSessionToken || '').trim();
      if (!passcodeSessionToken) {
        const missingSessionError: any = new Error(
          'Passcode session not issued after passkey login'
        );
        missingSessionError.code = 'PASSCODE_SESSION_UNAVAILABLE_AFTER_PASSKEY';
        throw missingSessionError;
      }
      const tokenExpiresAt = finishResponse.expiresAt
        ? new Date(finishResponse.expiresAt).toISOString()
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const passcodeSessionExpiresAt = finishResponse.passcodeSessionExpiresAt
        ? new Date(finishResponse.passcodeSessionExpiresAt).toISOString()
        : new Date(Date.now() + 10 * 60 * 1000).toISOString();

      useAuthStore.setState({
        user: finishResponse.user,
        accessToken: finishResponse.accessToken,
        refreshToken: finishResponse.refreshToken,
        csrfToken: finishResponse.csrfToken || useAuthStore.getState().csrfToken,
        isAuthenticated: true,
        pendingVerificationEmail: null,
        onboardingStatus: finishResponse.user.onboardingStatus || null,
        lastActivityAt: nowIso,
        tokenIssuedAt: nowIso,
        tokenExpiresAt,
        passcodeSessionToken,
        passcodeSessionExpiresAt,
      });
      SessionManager.schedulePasscodeSessionExpiry(passcodeSessionExpiresAt);
      markPasskeyPromptSuccess(passkeyPromptScope);

      onSubmitAuthorizedWithdrawal();
    } catch (err: any) {
      if (isPasskeyCancelledError(err)) {
        setAuthError('Passkey cancelled. Enter your PIN to continue.');
        return;
      }
      setAuthError(getPasskeyFallbackMessage(err));
    } finally {
      endPasskeyPrompt();
      setIsPasskeyLoading(false);
    }
  }, [isAuthorizing, isSubmitting, onSubmitAuthorizedWithdrawal, passkeyPromptScope, user?.email]);

  const onDestinationChange = useCallback(
    (value: string) => {
      setDidTryDestination(false);

      if (isFiatMethod) {
        setDestinationInput(value.replace(/\D/g, '').slice(0, 9));
        return;
      }

      if (isAssetTradeMethod) {
        setDestinationInput(
          value
            .toUpperCase()
            .replace(/[^A-Z0-9.-]/g, '')
            .slice(0, 12)
        );
        return;
      }

      setDestinationInput(value);
    },
    [isAssetTradeMethod, isFiatMethod]
  );

  const displayAmount = toDisplayAmount(rawAmount);
  const balanceLabel = isAssetBuyMethod
    ? 'Buying power'
    : isAssetTradeMethod
      ? 'Invest balance'
      : 'Balance';
  const flowTitle = isAssetTradeMethod ? 'Trade' : isFundFlow ? 'Fund' : 'Withdraw';
  const authorizeTitle = isAssetTradeMethod
    ? 'Confirm order'
    : isFundFlow
      ? 'Confirm funding'
      : 'Confirm withdrawal';
  const submittingTitle = isAssetTradeMethod
    ? 'Preparing order...'
    : isFundFlow
      ? 'Submitting funding...'
      : 'Submitting withdrawal...';
  const isFundingWaitingState = isMobileWalletFundingFlow && isFundingPending;
  const isFundingPendingState = isMobileWalletFundingFlow && !isFundingPending && fundingTimedOut;
  const isFundingCompleteState = isMobileWalletFundingFlow && !isFundingPending && fundingConfirmed;

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const keypadAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: keypadTranslateY.value }],
    opacity: interpolate(keypadTranslateY.value, [60, 0], [0, 1]),
  }));

  const pillsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pillsScale.value }],
    opacity: pillsOpacity.value,
  }));

  if (isFiatMethod && isKycStatusLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  if (isFiatMethod && !isFiatApproved) {
    return (
      <ErrorBoundary>
        <>
          <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" backgroundColor="white" />
            <View className="flex-row items-center px-5 pb-4 pt-2">
              <TouchableOpacity onPress={() => router.back()} hitSlop={12} className="mr-4 p-1">
                <ArrowLeft size={24} color="#111" />
              </TouchableOpacity>
              <Text className="font-subtitle text-lg text-gray-900">Withdraw</Text>
            </View>
            <View className="flex-1 items-center justify-center px-6">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                <ShieldAlert size={32} color="#F59E0B" />
              </View>
              <Text className="mb-2 font-subtitle text-xl text-gray-900">
                Verification Required
              </Text>
              <Text className="mb-8 text-center font-body text-sm text-gray-500">
                Complete identity verification to withdraw fiat to a bank account.
              </Text>
              <View className="w-full gap-y-3">
                <Button title="Start Verification" onPress={() => setShowKycSheet(true)} />
                <Button
                  title="Use Crypto Instead"
                  variant="white"
                  onPress={() => router.replace('/withdraw/crypto' as any)}
                />
              </View>
            </View>
          </SafeAreaView>

          <KYCVerificationSheet
            visible={showKycSheet}
            onClose={() => setShowKycSheet(false)}
            kycStatus={kycStatus}
          />
        </>
      </ErrorBoundary>
    );
  }

  if (isAuthorizeScreenVisible) {
    return (
      <ErrorBoundary>
        <SafeAreaView className="flex-1 bg-white">
          <StatusBar barStyle="dark-content" backgroundColor="white" />

          <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
            <TouchableOpacity
              className="size-11 items-center justify-center rounded-full bg-gray-100"
              onPress={() => {
                if (isAuthorizing || isSubmitting) return;
                setIsAuthorizeScreenVisible(false);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back">
              <ArrowLeft size={20} color="#111111" />
            </TouchableOpacity>
            <Text className="font-subtitle text-[20px] text-text-primary">{authorizeTitle}</Text>
            <View className="size-11" />
          </View>

          <View className="px-6 pt-4">
            <Text className="font-body text-[14px] text-text-secondary">
              Use passkey or your account PIN to authorize this transaction.
            </Text>

            {(isAuthorizing || isSubmitting) && (
              <View className="mt-3 flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#111111" />
                <Text className="font-body text-[13px] text-text-secondary">
                  {isSubmitting ? submittingTitle : 'Authorizing...'}
                </Text>
              </View>
            )}
          </View>

          <PasscodeInput
            subtitle="Use passkey or enter your account PIN"
            length={4}
            value={authPasscode}
            onValueChange={(value) => {
              setAuthPasscode(value);
              if (authError) setAuthError('');
            }}
            onComplete={onPasscodeAuthorize}
            errorText={authError}
            showToggle
            showFingerprint={passkeyAvailable}
            onFingerprint={onPasskeyAuthorize}
            autoSubmit
            variant="light"
            className="mt-3 flex-1"
          />
        </SafeAreaView>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1" style={{ backgroundColor: BRAND_RED }} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={BRAND_RED} />

        <View className="flex-1 px-5">
          {/* Header with fade animation */}
          <Animated.View
            entering={FadeIn.duration(400)}
            style={headerAnimatedStyle}
            className="flex-row items-center justify-between pb-2 pt-1">
            <TouchableOpacity
              className="size-11 items-center justify-center rounded-full bg-white/20"
              onPress={() => router.back()}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close withdraw flow">
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text className="font-subtitle text-[20px] text-white">{flowTitle}</Text>
            <View className="size-11" />
          </Animated.View>

          {/* Main content */}
          <View className="flex-1 items-center justify-center px-2">
            <Text className="font-body text-[13px] text-white/80">{methodCopy.title}</Text>

            {/* Animated amount display */}
            <View className="mt-2">
              <AnimatedAmount amount={displayAmount} />
            </View>

            {/* Success/Error messages with fade animation */}
            {numericAmount > 0 && !amountError && (
              <Animated.View entering={FadeIn.duration(300)}>
                <Text className="mt-2 text-center font-body text-[13px] text-white/90">
                  Looks good. You can continue.
                </Text>
              </Animated.View>
            )}

            {numericAmount > 0 && !!amountError && (
              <Animated.View entering={FadeIn.duration(300)}>
                <Text className="mt-2 text-center font-body text-[13px] text-white/90">
                  {amountError}
                </Text>
              </Animated.View>
            )}

            {!isFundFlow && (
              <Animated.View
                entering={FadeInUp.delay(200).duration(400)}
                style={pillsAnimatedStyle}
                className="mt-6 flex-row items-center justify-center gap-2">
                <View className="flex-row items-center rounded-full bg-white/20 px-3 py-2">
                  <Text className="font-body text-[13px] text-white/90">
                    {balanceLabel}: ${formatCurrency(availableBalance)}
                  </Text>
                </View>

                {numericAmount > 0 && (
                  <Animated.View
                    entering={FadeIn.springify()}
                    className="flex-row items-center rounded-full bg-white/90 px-3 py-2">
                    <Text className="font-body text-[13px]" style={{ color: BRAND_RED }}>
                      Fee: $1.00
                    </Text>
                  </Animated.View>
                )}

                <TouchableOpacity
                  onPress={onMaxPress}
                  activeOpacity={0.7}
                  className="rounded-full bg-white px-4 py-2"
                  accessibilityRole="button"
                  accessibilityLabel="Set maximum withdrawal amount">
                  <Text className="font-subtitle text-[13px]" style={{ color: BRAND_RED }}>
                    Max
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>

          {/* Keypad with slide up animation */}
          <Animated.View entering={SlideInUp.delay(100).duration(500)} style={keypadAnimatedStyle}>
            <Keypad
              className="pb-2"
              onKeyPress={onAmountKeyPress}
              backspaceIcon="delete"
              variant="dark"
              leftKey="decimal"
            />
          </Animated.View>
        </View>

        {/* Continue button section with slide up animation */}
        <Animated.View
          entering={SlideInUp.delay(200).duration(500)}
          className="border-t border-white/20 px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          {didTryContinue && !!amountError && (
            <Animated.View entering={FadeIn.duration(200)}>
              <Text className="mb-2 font-body text-[13px] text-white/90">{amountError}</Text>
            </Animated.View>
          )}

          <Button
            title="Continue"
            onPress={onContinuePress}
            disabled={!canContinue}
            variant="white"
            className="bg-white"
          />
        </Animated.View>

        <BottomSheet
          visible={isDetailsSheetVisible}
          onClose={() => setIsDetailsSheetVisible(false)}
          showCloseButton
          dismissible>
          <View className="pb-1">
            <Text className="pr-10 font-subtitle text-[22px] text-text-primary">
              {methodCopy.detailTitle}
            </Text>
            <Text className="mt-2 font-body text-[14px] text-text-secondary">
              {methodCopy.detailHint}
            </Text>

            {!isMobileWalletFundingFlow && (
              <View className="mt-5">
                <Input
                  label={methodCopy.detailLabel}
                  value={destinationInput}
                  onChangeText={onDestinationChange}
                  placeholder={methodCopy.detailPlaceholder}
                  autoCapitalize={isAssetTradeMethod ? 'characters' : 'none'}
                  autoCorrect={false}
                  keyboardType={isFiatMethod ? 'number-pad' : 'default'}
                  className="h-14 rounded-xl"
                  error={
                    didTryDestination || destinationInput.length > 0 ? destinationError : undefined
                  }
                />
              </View>
            )}

            <View className="mt-4 rounded-2xl bg-surface px-4 py-3">
              <View className="flex-row items-center justify-between">
                <Text className="font-body text-[13px] text-text-secondary">
                  {isAssetTradeMethod
                    ? 'Order amount'
                    : isFundFlow
                      ? 'Funding amount'
                      : 'Withdrawal amount'}
                </Text>
                <Text
                  className="font-subtitle text-[15px] text-text-primary"
                  style={{ fontVariant: ['tabular-nums'] }}>
                  ${formatCurrency(numericAmount)}
                </Text>
              </View>
              {isMobileWalletFundingFlow && (
                <>
                  <View className="mt-2 flex-row items-center justify-between">
                    <Text className="font-body text-[13px] text-text-secondary">Network</Text>
                    <Text className="font-subtitle text-[15px] text-text-primary">
                      Solana Devnet
                    </Text>
                  </View>
                  <View className="mt-2 flex-row items-center justify-between">
                    <Text className="font-body text-[13px] text-text-secondary">Asset</Text>
                    <Text className="font-subtitle text-[15px] text-text-primary">USDC</Text>
                  </View>
                </>
              )}
              <View className="mt-2 flex-row items-center justify-between">
                <Text className="font-body text-[13px] text-text-secondary">Method</Text>
                <Text className="font-subtitle text-[15px] text-text-primary">
                  {methodCopy.title}
                </Text>
              </View>
            </View>

            {fundingError ? (
              <Text className="mt-3 font-body text-[13px] text-red-600">{fundingError}</Text>
            ) : null}

            <Button
              title={isMobileWalletFundingFlow ? 'Open wallet' : 'Continue'}
              className="mt-5"
              onPress={onSaveDestination}
              disabled={isFundingActionLoading}
              loading={isFundingActionLoading}
            />
          </View>
        </BottomSheet>

        <BottomSheet
          visible={isSubmissionSheetVisible}
          onClose={onDismissSubmittedSheet}
          showCloseButton={false}
          dismissible>
          <View className="items-center pb-1">
            {isFundingWaitingState ? (
              <View className="size-16 items-center justify-center rounded-full bg-blue-100">
                <ActivityIndicator size="small" color="#2563EB" />
              </View>
            ) : (
              <View className="size-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 size={28} color="#10B981" />
              </View>
            )}
            <Text className="mt-5 text-center font-subtitle text-[30px] leading-[36px] text-text-primary">
              {isFundingWaitingState
                ? 'Waiting for\ndeposit confirmation'
                : isFundingPendingState
                  ? 'Funding\npending'
                  : isFundingCompleteState
                    ? 'Account\nfunded'
                    : `${isAssetTradeMethod ? 'Order' : isFundFlow ? 'Funding' : 'Withdrawal'}\nsubmitted`}
            </Text>
            <Text className="mt-3 text-center font-body text-[16px] text-text-secondary">
              {isFundingWaitingState
                ? 'Keep this app open while we detect your deposit on Solana.'
                : isFundingPendingState
                  ? 'We are still waiting for confirmation. You can close this and check History shortly.'
                  : isFundingCompleteState
                    ? 'Your Rail balance has been updated.'
                    : isFundFlow
                      ? 'Your funding transaction is on its way. You can check History for live status.'
                      : 'Your transaction is on its way. You can check History for live status.'}
            </Text>

            {!!fundingSignature && (
              <Text className="mt-3 text-center font-caption text-[12px] text-text-secondary">
                Signature: {fundingSignature}
              </Text>
            )}

            <Button
              title={isFundingWaitingState ? 'Hide' : 'Close'}
              className="mt-6 bg-surface"
              variant="white"
              onPress={onDismissSubmittedSheet}
            />
          </View>
        </BottomSheet>

        <KYCVerificationSheet
          visible={showKycSheet}
          onClose={() => setShowKycSheet(false)}
          kycStatus={kycStatus}
        />
      </SafeAreaView>
    </ErrorBoundary>
  );
}
