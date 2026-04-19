import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StatusBar, Text, Pressable, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Passkey } from 'react-native-passkey';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeInUp,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import { usePasskeys, useRegisterPasskey, useStation, useVerifyPasscode } from '@/api/hooks';
import { useKYCStatus } from '@/api/hooks/useKYC';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Keypad } from '@/components/molecules/Keypad';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores';
import { SessionManager } from '@/utils/sessionManager';
import {
  safeName,
  formatCurrency,
  formatMaxAmount,
  getAmountError,
  getDestinationError,
  getFiatAccountNumberError,
  getFlowLabels,
  normalizeAmount,
  sanitizeDestinationInput,
  toDisplayAmount,
} from '@/app/withdraw/method-screen/utils';
import { usePasskeyAuthorize } from '@/hooks/usePasskeyAuthorize';
import { isPasscodeSessionError, parseApiError } from '@/utils/apiError';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { AnimatedAmount } from './method-screen/AnimatedAmount';
import {
  BRAND_RED,
  FALLBACK_AVAILABLE_BALANCE,
  LIMITS,
  MAX_INTEGER_DIGITS,
  gentleSpring,
  getMethodCopy,
  isP2PMethod,
  isWalletFundingMethod,
  resolveFlow,
  resolveMethod,
  springConfig,
} from './method-screen/constants';
import type { FiatCurrency, ProfileNamePayload, WithdrawalStep } from './method-screen/types';
import { useMobileWalletFunding } from './method-screen/useMobileWalletFunding';
import { useWithdrawalSubmit } from './method-screen/useWithdrawalSubmit';
import { useMWAWithdrawal } from './method-screen/useMWAWithdrawal';
import {
  AuthorizeScreen,
  FiatKycRequiredScreen,
  WithdrawSubmissionSheet,
} from './method-screen/sections';
import { P2PSendScreen } from './method-screen/P2PSendScreen';
import {
  WithdrawalStatusScreen,
  type WithdrawalStatusType,
} from '@/components/withdraw/WithdrawalStatusScreen';
import { WhitelistPrompt } from '@/components/withdraw/WhitelistPrompt';
import { MFAChallengeSheet } from '@/components/sheets/MFAChallengeSheet';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { usePajRates } from '@/api/hooks/usePaj';

export default function WithdrawAmountScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user as ProfileNamePayload | undefined);
  const { showError, showSuccess } = useFeedbackPopup();
  const { data: station, refetch: refetchStation } = useStation();
  const { data: passkeys, isLoading: isPasskeysLoading } = usePasskeys();
  const { mutateAsync: registerPasskey, isPending: isRegisteringPasskey } = useRegisterPasskey();
  const params = useLocalSearchParams<{
    method?: string;
    symbol?: string;
    flow?: string;
    asset?: string;
    _confirm?: string;
    destinationInput?: string;
    destinationChain?: string;
    fiatAccountHolderName?: string;
    fiatAccountNumber?: string;
    fiatCurrency?: string;
    fiatBic?: string;
    category?: string;
    narration?: string;
  }>();

  const selectedMethod = resolveMethod(
    typeof params.method === 'string' ? params.method : undefined
  );
  const requestedFlow = resolveFlow(typeof params.flow === 'string' ? params.flow : undefined);

  const isP2P = isP2PMethod(selectedMethod);
  const isFundFlow = requestedFlow === 'fund' && Platform.OS === 'android';
  const methodCopy = useMemo(
    () => getMethodCopy(selectedMethod, isFundFlow),
    [isFundFlow, selectedMethod]
  );

  const isFiatMethod = selectedMethod === 'fiat';
  const isAssetTradeMethod = selectedMethod === 'asset-buy' || selectedMethod === 'asset-sell';
  const isAssetBuyMethod = selectedMethod === 'asset-buy';
  const isCryptoDestinationMethod =
    selectedMethod === 'crypto' || selectedMethod === 'phantom' || selectedMethod === 'solflare';
  const isMobileWalletFundingFlow = isFundFlow && isWalletFundingMethod(selectedMethod);
  const isMWAWithdrawMethod = selectedMethod === 'mwa-withdraw';

  const { data: kycStatus, isLoading: isKycStatusLoading } = useKYCStatus(isFiatMethod);
  const isFiatApproved = kycStatus?.status === 'approved';
  const prefilledAssetSymbol = useMemo(() => {
    if (!isAssetTradeMethod) return '';
    return (typeof params.symbol === 'string' ? params.symbol : '')
      .toUpperCase()
      .replace(/[^A-Z0-9.-]/g, '')
      .slice(0, 12);
  }, [isAssetTradeMethod, params.symbol]);

  const [rawAmount, setRawAmount] = useState('0');
  const [didTryContinue, setDidTryContinue] = useState(false);
  // Step-based flow state — restored from params when returning from confirm screen
  const [currentStep, setCurrentStep] = useState<WithdrawalStep>('amount');
  const [destinationInput, setDestinationInput] = useState(
    params.destinationInput ?? prefilledAssetSymbol
  );
  const [destinationChain, setDestinationChain] = useState(params.destinationChain ?? 'SOL');
  const [didTryDestination, setDidTryDestination] = useState(false);
  const [didTryFiatAccount, setDidTryFiatAccount] = useState(false);
  const [fiatAccountHolderName, setFiatAccountHolderName] = useState(
    params.fiatAccountHolderName ?? ''
  );
  const [fiatAccountNumber, setFiatAccountNumber] = useState(params.fiatAccountNumber ?? '');
  const [fiatCurrency, setFiatCurrency] = useState<FiatCurrency>(
    (params.fiatCurrency as FiatCurrency) ?? 'USD'
  );
  const [fiatBic, setFiatBic] = useState(params.fiatBic ?? '');
  const [category, setCategory] = useState(params.category ?? 'Transfer');
  const [narration, setNarration] = useState(params.narration ?? '');
  const [isAuthorizeScreenVisible, setIsAuthorizeScreenVisible] = useState(false);
  const [isConfirmSheetVisible, setIsConfirmSheetVisible] = useState(false);
  const [isSubmissionSheetVisible, setIsSubmissionSheetVisible] = useState(false);
  const [withdrawalStatus, setWithdrawalStatus] = useState<WithdrawalStatusType | null>(null);
  const [withdrawalErrorMsg, setWithdrawalErrorMsg] = useState('');
  const [showWhitelistPrompt, setShowWhitelistPrompt] = useState(false);
  const [showMFASheet, setShowMFASheet] = useState(false);
  const [submitWithActiveSession, setSubmitWithActiveSession] = useState(false);
  const [showKycSheet, setShowKycSheet] = useState(false);
  // PIN lockout
  const [pinAttempts, setPinAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutSecondsRemaining, setLockoutSecondsRemaining] = useState(0);
  // session fingerprint — binds auth to a specific amount+method
  const [authorizedFingerprint, setAuthorizedFingerprint] = useState<string | null>(null);

  useEffect(() => {
    if (!isAssetTradeMethod || !prefilledAssetSymbol) return;
    setDestinationInput((c) => c || prefilledAssetSymbol);
  }, [isAssetTradeMethod, prefilledAssetSymbol]);

  const passkeySupported = Passkey.isSupported() && Boolean(safeName(user?.email));
  const hasPasskey = (passkeys?.length ?? 0) > 0;
  const passkeyAvailable = passkeySupported && hasPasskey;

  // ── Derived amounts ───────────────────────────────────────────────────────

  const asset = typeof params.asset === 'string' ? params.asset : undefined;
  const isNGNAsset = asset === 'NGN';
  const { data: pajRatesData } = usePajRates();
  const ngnRate = pajRatesData?.offRampRate?.rate ?? 0;
  const railFeeUSD = pajRatesData?.railFee ?? 0.06;

  const availableBalance = useMemo(() => {
    const source =
      selectedMethod === 'asset-buy'
        ? station?.broker_cash
        : selectedMethod === 'asset-sell'
          ? station?.invest_balance
          : station?.spend_balance;
    const parsed = Number.parseFloat(source ?? '');
    const usdBalance = Number.isFinite(parsed) && parsed >= 0 ? parsed : FALLBACK_AVAILABLE_BALANCE;
    return isNGNAsset && ngnRate > 0 ? usdBalance * ngnRate : usdBalance;
  }, [
    selectedMethod,
    station?.broker_cash,
    station?.invest_balance,
    station?.spend_balance,
    isNGNAsset,
    ngnRate,
  ]);

  const withdrawalLimit =
    isNGNAsset && ngnRate > 0 ? LIMITS[selectedMethod] * ngnRate : LIMITS[selectedMethod];
  const maxWithdrawable = isFundFlow
    ? withdrawalLimit
    : Math.min(withdrawalLimit, availableBalance);
  const numericAmount = useMemo(() => {
    const n = Number.parseFloat(rawAmount);
    return Number.isFinite(n) ? n : 0;
  }, [rawAmount]);
  const feeAmount = useMemo(() => {
    if (numericAmount <= 0) return 0;
    if (isFiatMethod) {
      if (asset === 'NGN') return railFeeUSD;
      return 1.0;
    }
    if (destinationChain === 'SOL' || !destinationChain) return 0.1;
    return 0.5;
  }, [numericAmount, isFiatMethod, asset, destinationChain, railFeeUSD]);
  const totalAmount = useMemo(() => numericAmount + feeAmount, [feeAmount, numericAmount]);

  const amountError = useMemo(
    () =>
      getAmountError({
        availableBalance,
        isFundFlow,
        limitLabel: methodCopy.limitLabel,
        numericAmount,
        withdrawalLimit,
        feeAmount,
        currencySymbol: isNGNAsset ? '₦' : '$',
      }),
    [
      availableBalance,
      isFundFlow,
      methodCopy.limitLabel,
      numericAmount,
      withdrawalLimit,
      feeAmount,
      isNGNAsset,
    ]
  );
  const destinationError = useMemo(
    () =>
      getDestinationError({
        destinationInput,
        isAssetTradeMethod,
        isCryptoDestinationMethod,
        isFiatMethod,
        isMobileWalletFundingFlow,
        destinationChain,
        fiatCurrency,
      }),
    [
      destinationInput,
      isAssetTradeMethod,
      isCryptoDestinationMethod,
      isFiatMethod,
      isMobileWalletFundingFlow,
      destinationChain,
      fiatCurrency,
    ]
  );

  const canContinue = numericAmount > 0 && !amountError;

  const fiatAccountNumberError = useMemo(
    () => getFiatAccountNumberError(fiatAccountNumber, fiatCurrency),
    [fiatAccountNumber, fiatCurrency]
  );

  const canSaveDestination =
    !destinationError &&
    (!isFiatMethod || (fiatAccountHolderName.trim().length >= 2 && !fiatAccountNumberError));

  // Lockout countdown
  useEffect(() => {
    if (!lockoutUntil) return;
    const tick = setInterval(() => {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setLockoutSecondsRemaining(0);
        setPinAttempts(0);
      } else {
        setLockoutSecondsRemaining(remaining);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [lockoutUntil]);

  // ── Animations ────────────────────────────────────────────────────────────

  const headerOpacity = useSharedValue(0);
  const keypadTranslateY = useSharedValue(60);
  const pillsScale = useSharedValue(0.8);
  const pillsOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
    keypadTranslateY.value = withSpring(0, { ...gentleSpring, damping: 18 });
  }, []);

  useEffect(() => {
    if (Number(rawAmount) > 0) {
      pillsScale.value = withSpring(1, springConfig);
      pillsOpacity.value = withTiming(1, { duration: 300 });
    } else {
      pillsScale.value = withSpring(0.9, gentleSpring);
      pillsOpacity.value = withTiming(0.7, { duration: 200 });
    }
  }, [rawAmount]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const keypadAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: keypadTranslateY.value }],
    opacity: interpolate(keypadTranslateY.value, [60, 0], [0, 1]),
  }));
  const pillsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pillsScale.value }],
    opacity: pillsOpacity.value,
  }));

  // ── Hooks ─────────────────────────────────────────────────────────────────

  const { mutate: verifyPasscode, isPending: isPasscodeVerifying } = useVerifyPasscode();

  const openSubmissionSheet = useCallback(() => {
    setIsAuthorizeScreenVisible(false);
    setWithdrawalStatus('success');
    setIsSubmissionSheetVisible(true);
  }, []);

  const funding = useMobileWalletFunding({
    enabled: isMobileWalletFundingFlow,
    selectedMethod,
    numericAmount,
    spendBalance: station?.spend_balance,
    onConfirmed: openSubmissionSheet,
    onTimedOut: openSubmissionSheet,
  });

  const mwaWithdrawal = useMWAWithdrawal({
    enabled: isMWAWithdrawMethod,
    numericAmount,
    onSuccess: openSubmissionSheet,
    category,
    narration,
  });

  const withdrawal = useWithdrawalSubmit({
    selectedMethod,
    numericAmount,
    destinationInput,
    destinationChain,
    isFundFlow,
    onStartMobileWalletFunding: () => {
      setIsAuthorizeScreenVisible(false);
      void funding.startFunding(() => {
        setCurrentStep('amount');
        setIsSubmissionSheetVisible(true);
      });
    },
    asset,
    fiatCurrency,
    fiatAccountHolderName,
    fiatAccountNumber,
    fiatBic,
    category,
    narration,
  });

  const txFingerprint = `${selectedMethod}:${numericAmount.toFixed(2)}`;
  const passkeyPromptScope = `withdraw-authorize:${safeName(user?.email) || 'unknown'}:${txFingerprint}`;

  const onSubmitAuthorizedWithdrawal = useCallback(() => {
    if (isMWAWithdrawMethod) {
      setIsAuthorizeScreenVisible(false);
      void mwaWithdrawal.startWithdrawal();
      return;
    }
    withdrawal.submit({
      onSuccess: openSubmissionSheet,
      onError: (err: unknown) => {
        if (isPasscodeSessionError(err)) {
          setIsAuthorizeScreenVisible(true);
          passkey.setAuthError('Authorization expired. Confirm with passkey or PIN to continue.');
          return;
        }
        // Security: intercept whitelist and MFA step-up errors
        const errMsg = parseApiError(err, '');
        if (
          errMsg.toLowerCase().includes('not whitelisted') ||
          errMsg.toLowerCase().includes('cooling period')
        ) {
          setShowWhitelistPrompt(true);
          return;
        }
        if (errMsg.toLowerCase().includes('step_up') || errMsg.toLowerCase().includes('mfa')) {
          setShowMFASheet(true);
          return;
        }
        setIsAuthorizeScreenVisible(false);
        setWithdrawalErrorMsg(
          parseApiError(err, `${isFundFlow ? 'Funding' : 'Withdrawal'} failed. Please try again.`)
        );
        setWithdrawalStatus('failed');
      },
    });
  }, [withdrawal, openSubmissionSheet, isFundFlow, isMWAWithdrawMethod, mwaWithdrawal]); // passkey ref resolved below

  const passkey = usePasskeyAuthorize({
    email: user?.email,
    passkeyPromptScope,
    autoTrigger: isAuthorizeScreenVisible && passkeyAvailable,
    onAuthorized: onSubmitAuthorizedWithdrawal,
  });

  const isAuthorizing = isPasscodeVerifying || passkey.isPasskeyLoading || isRegisteringPasskey;
  const authorizingTitle = isRegisteringPasskey ? 'Creating passkey...' : undefined;
  const isSubmitting = withdrawal.isSubmitting;

  const handlePasskeyPress = useCallback(() => {
    if (isAuthorizing || isSubmitting || lockoutUntil) return;
    if (!passkeySupported) {
      passkey.setAuthError('Passkey is unavailable. Enter your PIN to continue.');
      return;
    }
    if (!isPasskeysLoading && !hasPasskey) {
      Alert.alert('Create a passkey?', 'Set up a passkey to approve withdrawals faster.', [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Create passkey',
          onPress: async () => {
            try {
              await registerPasskey(undefined);
              showSuccess('Passkey ready', 'You can now approve with passkey.');
              passkey.onPasskeyAuthorize();
            } catch (err: any) {
              const message = String(err?.message || '');
              if (err?.name === 'NotAllowedError' || message.toLowerCase().includes('cancel')) {
                return;
              }
              showError('Passkey setup failed', err?.message || 'Could not create passkey.');
            }
          },
        },
      ]);
      return;
    }
    passkey.onPasskeyAuthorize();
  }, [
    hasPasskey,
    isAuthorizing,
    isPasskeysLoading,
    isSubmitting,
    lockoutUntil,
    passkey,
    passkeySupported,
    registerPasskey,
    showError,
    showSuccess,
  ]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const hasActivePasscodeSession = useCallback(() => {
    const s = useAuthStore.getState();
    const sessionValid =
      s.isAuthenticated && !!s.passcodeSessionToken && !SessionManager.isPasscodeSessionExpired();
    // Session must have been authorized for the exact same amount+method
    return sessionValid && authorizedFingerprint === txFingerprint;
  }, [authorizedFingerprint, txFingerprint]);

  const onAmountKeyPress = useCallback(
    (key: string) => {
      setRawAmount((current) => {
        if (key === 'backspace')
          return current === '0' ? current : normalizeAmount(current.slice(0, -1));
        if (key === 'decimal') return current.includes('.') ? current : `${current}.`;
        if (!/^\d$/.test(key)) return current;
        if (current.includes('.')) {
          const [int, dec = ''] = current.split('.');
          return dec.length >= 2 ? current : `${int}.${dec}${key}`;
        }
        const next = (current === '0' ? key : `${current}${key}`).replace(/^0+(?=\d)/, '') || '0';
        if (next.length > MAX_INTEGER_DIGITS) return current;
        if (maxWithdrawable > 0 && Number.parseFloat(next) > maxWithdrawable)
          return formatMaxAmount(maxWithdrawable);
        return next;
      });
    },
    [maxWithdrawable]
  );

  const onMaxPress = useCallback(() => {
    setRawAmount(formatMaxAmount(maxWithdrawable));
  }, [maxWithdrawable]);

  // When returning from the confirm screen, open auth immediately
  useEffect(() => {
    if (params._confirm !== '1') return;
    passkey.onAuthPasscodeChange('');
    if (hasActivePasscodeSession()) {
      setSubmitWithActiveSession(true);
    } else {
      setAuthorizedFingerprint(null);
      setIsAuthorizeScreenVisible(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params._confirm]);

  useEffect(() => {
    if (!submitWithActiveSession) return;
    setSubmitWithActiveSession(false);
    onSubmitAuthorizedWithdrawal();
  }, [onSubmitAuthorizedWithdrawal, submitWithActiveSession]);

  const onContinuePress = useCallback(() => {
    setDidTryContinue(true);
    funding.reset();
    mwaWithdrawal.reset();
    if (!canContinue) return;
    if (isMWAWithdrawMethod) {
      passkey.onAuthPasscodeChange('');
      passkey.setAuthError('');
      setAuthorizedFingerprint(null);
      setIsAuthorizeScreenVisible(true);
      return;
    }
    router.push({
      pathname: '/withdraw/destination',
      params: {
        method: selectedMethod,
        amount: numericAmount.toFixed(2),
        isFiatMethod: String(isFiatMethod),
        isCryptoMethod: String(isCryptoDestinationMethod),
        isAssetTradeMethod: String(isAssetTradeMethod),
        methodTitle: methodCopy.title,
        detailLabel: methodCopy.detailLabel,
        detailPlaceholder: methodCopy.detailPlaceholder,
        detailHint: methodCopy.detailHint,
        availableBalance: String(availableBalance),
        withdrawalLimit: String(maxWithdrawable),
        currency: isCryptoDestinationMethod ? 'USDC' : asset || useUIStore.getState().currency,
      },
    });
  }, [
    canContinue,
    funding,
    isMWAWithdrawMethod,
    mwaWithdrawal,
    passkey,
    selectedMethod,
    numericAmount,
    isFiatMethod,
    isCryptoDestinationMethod,
    isAssetTradeMethod,
    methodCopy,
    availableBalance,
    maxWithdrawable,
  ]);

  const MAX_PIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION_MS = 30_000;

  const onPasscodeAuthorize = useCallback(
    (code: string) => {
      if (isAuthorizing || isSubmitting || lockoutUntil) return;
      passkey.setAuthError('');
      verifyPasscode(
        { passcode: code },
        {
          onSuccess: (result) => {
            if (!result.verified) {
              const next = pinAttempts + 1;
              setPinAttempts(next);
              if (next >= MAX_PIN_ATTEMPTS) {
                const until = Date.now() + LOCKOUT_DURATION_MS;
                setLockoutUntil(until);
                setLockoutSecondsRemaining(LOCKOUT_DURATION_MS / 1000);
                passkey.setAuthError('Too many failed attempts. You are temporarily locked out.');
              } else {
                passkey.setAuthError(
                  `Invalid PIN. ${MAX_PIN_ATTEMPTS - next} attempt${MAX_PIN_ATTEMPTS - next !== 1 ? 's' : ''} remaining.`
                );
              }
              passkey.onAuthPasscodeChange('');
              return;
            }
            setPinAttempts(0);
            setLockoutUntil(null);
            setAuthorizedFingerprint(txFingerprint);
            onSubmitAuthorizedWithdrawal();
          },
          onError: (err: unknown) => {
            passkey.setAuthError(parseApiError(err, 'Failed to verify PIN.'));
            passkey.onAuthPasscodeChange('');
          },
        }
      );
    },
    [
      isAuthorizing,
      isSubmitting,
      lockoutUntil,
      onSubmitAuthorizedWithdrawal,
      passkey,
      pinAttempts,
      txFingerprint,
      verifyPasscode,
    ]
  );

  const onCloseSubmittedSheet = useCallback(() => {
    setIsSubmissionSheetVisible(false);
    setRawAmount('0');
    setDestinationInput('');
    setDidTryContinue(false);
    setDidTryDestination(false);
    funding.reset();
  }, [funding]);

  const onDismissSubmittedSheet = useCallback(() => {
    if (isMobileWalletFundingFlow && funding.isFundingPending) {
      setIsSubmissionSheetVisible(false);
      return;
    }
    onCloseSubmittedSheet();
  }, [funding.isFundingPending, isMobileWalletFundingFlow, onCloseSubmittedSheet]);

  // ── Derived display ───────────────────────────────────────────────────────

  const displayAmount = toDisplayAmount(rawAmount);
  const { balanceLabel, flowTitle, authorizeTitle, submittingTitle } = useMemo(
    () => getFlowLabels({ isAssetBuyMethod, isAssetTradeMethod, isFundFlow }),
    [isAssetBuyMethod, isAssetTradeMethod, isFundFlow]
  );
  const isFundingWaitingState = isMobileWalletFundingFlow && funding.isFundingPending;
  const isFundingPendingState =
    isMobileWalletFundingFlow && !funding.isFundingPending && funding.fundingTimedOut;
  const isFundingCompleteState =
    isMobileWalletFundingFlow && !funding.isFundingPending && funding.fundingConfirmed;

  // ── Early returns ─────────────────────────────────────────────────────────

  if (isFiatMethod && isKycStatusLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  if (isFiatMethod && !isFiatApproved) {
    return (
      <FiatKycRequiredScreen
        kycStatus={kycStatus}
        showKycSheet={showKycSheet}
        onStartVerification={() => setShowKycSheet(true)}
        onCloseKycSheet={() => setShowKycSheet(false)}
      />
    );
  }

  // ── Full-screen withdrawal status ─────────────────────────────────────────
  if (showWhitelistPrompt) {
    return (
      <SafeAreaView className="flex-1 justify-center px-5" edges={['top', 'bottom']}>
        <WhitelistPrompt
          address={destinationInput}
          chain={destinationChain ?? 'SOL'}
          onWhitelist={() => {
            setShowWhitelistPrompt(false);
            router.push('/whitelist' as never);
          }}
          onDismiss={() => setShowWhitelistPrompt(false)}
        />
      </SafeAreaView>
    );
  }

  if (withdrawalStatus) {
    const statusAmount = isNGNAsset
      ? `₦${formatCurrency(numericAmount)}`
      : `$${formatCurrency(numericAmount)}`;
    const recipientLabel =
      fiatAccountHolderName ||
      (destinationInput
        ? `${destinationInput.slice(0, 6)}...${destinationInput.slice(-4)}`
        : undefined);
    const statusMessage =
      withdrawalStatus === 'failed'
        ? withdrawalErrorMsg
        : withdrawalStatus === 'success' && isFiatMethod
          ? "Usually arrives in 2–5 minutes. We'll notify you when it lands."
          : withdrawalStatus === 'success'
            ? 'Your withdrawal has been submitted to the network.'
            : undefined;
    return (
      <WithdrawalStatusScreen
        status={withdrawalStatus}
        amount={statusAmount}
        recipient={recipientLabel}
        message={statusMessage}
        onDone={() => router.replace('/(tabs)' as never)}
        onRetry={
          withdrawalStatus === 'failed'
            ? () => {
                setWithdrawalStatus(null);
                setWithdrawalErrorMsg('');
                setIsAuthorizeScreenVisible(true);
              }
            : undefined
        }
      />
    );
  }

  if (isAuthorizeScreenVisible) {
    return (
      <AuthorizeScreen
        authorizeTitle={authorizeTitle}
        authError={passkey.authError}
        authPasscode={passkey.authPasscode}
        isAuthorizing={isAuthorizing}
        isSubmitting={isSubmitting}
        authorizingTitle={authorizingTitle}
        onClose={() => {
          if (!isAuthorizing && !isSubmitting) setIsAuthorizeScreenVisible(false);
        }}
        onPasscodeAuthorize={onPasscodeAuthorize}
        onPasskeyPress={handlePasskeyPress}
        onValueChange={passkey.onAuthPasscodeChange}
        showPasskey={passkeySupported}
        submittingTitle={submittingTitle}
        summaryAmount={numericAmount}
        pinAttemptsRemaining={MAX_PIN_ATTEMPTS - pinAttempts}
        isLockedOut={!!lockoutUntil}
        lockoutSecondsRemaining={lockoutSecondsRemaining}
      />
    );
  }

  if (isP2P) {
    return <P2PSendScreen />;
  }

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1" style={{ backgroundColor: BRAND_RED }} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={BRAND_RED} />

        <View className="flex-1 px-5">
          <Animated.View
            entering={FadeIn.duration(400)}
            style={headerAnimatedStyle}
            className="flex-row items-center justify-between pb-2 pt-1">
            <Pressable
              className="size-11 items-center justify-center rounded-full bg-white/20"
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Close withdraw flow">
              <HugeiconsIcon icon={Cancel01Icon} size={20} color="#FFFFFF" />
            </Pressable>
            <Text className="font-subtitle text-[20px] text-white">{flowTitle}</Text>
            <View className="size-11" />
          </Animated.View>

          <View className="flex-1 items-center justify-center px-2">
            <Text className="font-body text-[13px] text-white/80">{methodCopy.title}</Text>
            <View className="mt-2">
              <AnimatedAmount amount={displayAmount} prefix={asset === 'NGN' ? '₦' : '$'} />
            </View>

            {/*{numericAmount > 0 && (
              <Animated.View entering={FadeIn.duration(300)}>
                <Text className="mt-2 text-center font-body text-[13px] text-white/90">
                  {amountError || 'Looks good. You can continue.'}
                </Text>
              </Animated.View>
            )}*/}

            {!isFundFlow && (
              <Animated.View
                entering={FadeInUp.delay(200).duration(400)}
                style={pillsAnimatedStyle}
                className="mt-6 flex-row items-center justify-center gap-2">
                <View className="flex-row items-center rounded-full bg-white/20 px-3 py-2">
                  <Text className="font-body text-[13px] text-white/90">
                    {balanceLabel}: {isNGNAsset ? '₦' : '$'}
                    {formatCurrency(availableBalance)}
                  </Text>
                </View>
                {numericAmount > 0 && isFiatMethod && (
                  <Animated.View
                    entering={FadeIn.springify()}
                    className="flex-row items-center rounded-full bg-white/90 px-3 py-2">
                    <Text className="font-body text-[13px]" style={{ color: BRAND_RED }}>
                      Fee: ${formatCurrency(feeAmount)}
                    </Text>
                  </Animated.View>
                )}
                <Pressable
                  onPress={onMaxPress}
                  className="rounded-full bg-white px-4 py-2"
                  accessibilityRole="button"
                  accessibilityLabel="Set maximum withdrawal amount">
                  <Text className="font-subtitle text-[13px]" style={{ color: BRAND_RED }}>
                    Max
                  </Text>
                </Pressable>
              </Animated.View>
            )}
          </View>

          <Animated.View entering={SlideInUp.delay(100).duration(500)} className="px-0 pb-3 pt-1">
            {isMWAWithdrawMethod && !!mwaWithdrawal.error && (
              <Animated.View entering={FadeIn.duration(200)}>
                <Text className="mb-2 font-body text-[13px] text-white/90">
                  {mwaWithdrawal.error}
                </Text>
              </Animated.View>
            )}
            <Button
              title={
                mwaWithdrawal.isConnecting
                  ? 'Opening wallet...'
                  : mwaWithdrawal.isSubmitting
                    ? 'Sending...'
                    : 'Send'
              }
              onPress={onContinuePress}
              disabled={!canContinue}
              loading={mwaWithdrawal.isLoading}
              variant="white"
              className="bg-white"
            />
          </Animated.View>

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

        <View style={{ paddingBottom: Math.max(insets.bottom, 12) }} />

        <WithdrawSubmissionSheet
          visible={isSubmissionSheetVisible}
          onClose={onDismissSubmittedSheet}
          isFundingWaitingState={isFundingWaitingState}
          isFundingPendingState={isFundingPendingState}
          isFundingCompleteState={isFundingCompleteState}
          isAssetTradeMethod={isAssetTradeMethod}
          isFundFlow={isFundFlow}
          fundingSignature={funding.fundingSignature}
        />
        <MFAChallengeSheet
          visible={showMFASheet}
          onClose={() => setShowMFASheet(false)}
          onVerified={() => {
            setShowMFASheet(false);
            onSubmitAuthorizedWithdrawal();
          }}
        />
      </SafeAreaView>
    </ErrorBoundary>
  );
}
