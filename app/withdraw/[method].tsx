import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StatusBar, Text, Pressable, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Passkey } from 'react-native-passkey';
import { X } from 'lucide-react-native';
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
import type { ProfileNamePayload } from './method-screen/types';
import { useMobileWalletFunding } from './method-screen/useMobileWalletFunding';
import { useWithdrawalSubmit } from './method-screen/useWithdrawalSubmit';
import { useMWAWithdrawal } from './method-screen/useMWAWithdrawal';
import {
  AuthorizeScreen,
  FiatKycRequiredScreen,
  WithdrawConfirmSheet,
  WithdrawDetailsSheet,
  WithdrawSubmissionSheet,
} from './method-screen/sections';
import { P2PSendScreen } from './method-screen/P2PSendScreen';

export default function WithdrawAmountScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user as ProfileNamePayload | undefined);
  const { showError, showSuccess } = useFeedbackPopup();
  const { data: station, refetch: refetchStation } = useStation();
  const { data: passkeys, isLoading: isPasskeysLoading } = usePasskeys();
  const { mutateAsync: registerPasskey, isPending: isRegisteringPasskey } = useRegisterPasskey();
  const params = useLocalSearchParams<{ method?: string; symbol?: string; flow?: string }>();

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
  const [isDetailsSheetVisible, setIsDetailsSheetVisible] = useState(false);
  const [destinationInput, setDestinationInput] = useState(prefilledAssetSymbol);
  const [destinationChain, setDestinationChain] = useState('SOL');
  const [didTryDestination, setDidTryDestination] = useState(false);
  const [didTryFiatAccount, setDidTryFiatAccount] = useState(false);
  const [fiatAccountHolderName, setFiatAccountHolderName] = useState('');
  const [fiatAccountNumber, setFiatAccountNumber] = useState('');
  const [category, setCategory] = useState('Transfer');
  const [narration, setNarration] = useState('');
  const [isAuthorizeScreenVisible, setIsAuthorizeScreenVisible] = useState(false);
  const [isConfirmSheetVisible, setIsConfirmSheetVisible] = useState(false);
  const [isSubmissionSheetVisible, setIsSubmissionSheetVisible] = useState(false);
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

  const availableBalance = useMemo(() => {
    const source =
      selectedMethod === 'asset-buy'
        ? station?.broker_cash
        : selectedMethod === 'asset-sell'
          ? station?.invest_balance
          : station?.spend_balance;
    const parsed = Number.parseFloat(source ?? '');
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : FALLBACK_AVAILABLE_BALANCE;
  }, [selectedMethod, station?.broker_cash, station?.invest_balance, station?.spend_balance]);

  const withdrawalLimit = LIMITS[selectedMethod];
  const maxWithdrawable = isFundFlow
    ? withdrawalLimit
    : Math.min(withdrawalLimit, availableBalance);
  const numericAmount = useMemo(() => {
    const n = Number.parseFloat(rawAmount);
    return Number.isFinite(n) ? n : 0;
  }, [rawAmount]);
  const feeAmount = useMemo(
    () => (isFiatMethod && numericAmount > 0 ? 1 : 0),
    [isFiatMethod, numericAmount]
  );
  const totalAmount = useMemo(() => numericAmount + feeAmount, [feeAmount, numericAmount]);

  const amountError = useMemo(
    () =>
      getAmountError({
        availableBalance,
        isFundFlow,
        limitLabel: methodCopy.limitLabel,
        numericAmount,
        withdrawalLimit,
      }),
    [availableBalance, isFundFlow, methodCopy.limitLabel, numericAmount, withdrawalLimit]
  );
  const destinationError = useMemo(
    () =>
      getDestinationError({
        destinationInput,
        isAssetTradeMethod,
        isCryptoDestinationMethod,
        isFiatMethod,
        isMobileWalletFundingFlow,
      }),
    [
      destinationInput,
      isAssetTradeMethod,
      isCryptoDestinationMethod,
      isFiatMethod,
      isMobileWalletFundingFlow,
    ]
  );

  const canContinue = numericAmount > 0 && !amountError;

  const fiatAccountNumberError = useMemo(
    () => getFiatAccountNumberError(fiatAccountNumber),
    [fiatAccountNumber]
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
        setIsDetailsSheetVisible(false);
        setIsSubmissionSheetVisible(true);
      });
    },
    fiatAccountHolderName,
    fiatAccountNumber,
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
        setIsAuthorizeScreenVisible(true);
        passkey.setAuthError(
          parseApiError(err, `${isFundFlow ? 'Funding' : 'Withdrawal'} failed. Please try again.`)
        );
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
        if (Number.parseFloat(next) > maxWithdrawable) return formatMaxAmount(maxWithdrawable);
        return next;
      });
    },
    [maxWithdrawable]
  );

  const onMaxPress = useCallback(() => {
    setRawAmount(formatMaxAmount(maxWithdrawable));
  }, [maxWithdrawable]);

  const onContinuePress = useCallback(() => {
    setDidTryContinue(true);
    funding.reset();
    mwaWithdrawal.reset();
    if (!canContinue) return;
    if (isMWAWithdrawMethod) {
      passkey.onAuthPasscodeChange('');
      passkey.setAuthError('');
      setAuthorizedFingerprint(null);
      setIsConfirmSheetVisible(true);
      return;
    }
    setDidTryDestination(false);
    setIsDetailsSheetVisible(true);
  }, [canContinue, funding, isMWAWithdrawMethod, mwaWithdrawal, passkey]);

  const onSaveDestination = useCallback(() => {
    if (isMobileWalletFundingFlow) {
      void funding.startFunding(() => {
        setIsDetailsSheetVisible(false);
        setIsSubmissionSheetVisible(true);
      });
      return;
    }
    setDidTryDestination(true);
    setDidTryFiatAccount(true);
    passkey.setAuthError('');
    if (!canSaveDestination) return;
    setIsDetailsSheetVisible(false);
    setIsConfirmSheetVisible(true);
  }, [canSaveDestination, funding, isMobileWalletFundingFlow, passkey]);

  const onConfirmTransaction = useCallback(() => {
    setIsConfirmSheetVisible(false);
    if (isMWAWithdrawMethod) {
      setIsAuthorizeScreenVisible(true);
      return;
    }
    passkey.onAuthPasscodeChange('');
    if (hasActivePasscodeSession()) {
      setSubmitWithActiveSession(true);
      return;
    }
    setAuthorizedFingerprint(null);
    setIsAuthorizeScreenVisible(true);
  }, [hasActivePasscodeSession, isMWAWithdrawMethod, passkey]);

  useEffect(() => {
    if (!submitWithActiveSession) return;
    setSubmitWithActiveSession(false);
    onSubmitAuthorizedWithdrawal();
  }, [onSubmitAuthorizedWithdrawal, submitWithActiveSession]);

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

  const onDestinationChange = useCallback(
    (value: string) => {
      setDidTryDestination(false);
      setDestinationInput(sanitizeDestinationInput({ value, isFiatMethod, isAssetTradeMethod }));
    },
    [isAssetTradeMethod, isFiatMethod]
  );

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
              <X size={20} color="#FFFFFF" />
            </Pressable>
            <Text className="font-subtitle text-[20px] text-white">{flowTitle}</Text>
            <View className="size-11" />
          </Animated.View>

          <View className="flex-1 items-center justify-center px-2">
            <Text className="font-body text-[13px] text-white/80">{methodCopy.title}</Text>
            <View className="mt-2">
              <AnimatedAmount amount={displayAmount} />
            </View>

            {numericAmount > 0 && (
              <Animated.View entering={FadeIn.duration(300)}>
                <Text className="mt-2 text-center font-body text-[13px] text-white/90">
                  {amountError || 'Looks good. You can continue.'}
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

        <Animated.View
          entering={SlideInUp.delay(200).duration(500)}
          className="border-t border-white/20 px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          {didTryContinue && !!amountError && (
            <Animated.View entering={FadeIn.duration(200)}>
              <Text className="mb-2 font-body text-[13px] text-white/90">{amountError}</Text>
            </Animated.View>
          )}
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
                  : 'Continue'
            }
            onPress={onContinuePress}
            disabled={!canContinue || mwaWithdrawal.isLoading}
            loading={mwaWithdrawal.isLoading}
            variant="white"
            className="bg-white"
          />
        </Animated.View>

        <WithdrawDetailsSheet
          visible={isDetailsSheetVisible}
          onClose={() => setIsDetailsSheetVisible(false)}
          methodCopy={methodCopy}
          numericAmount={numericAmount}
          isAssetTradeMethod={isAssetTradeMethod}
          isFundFlow={isFundFlow}
          isMobileWalletFundingFlow={isMobileWalletFundingFlow}
          isFiatMethod={isFiatMethod}
          isCryptoMethod={isCryptoDestinationMethod}
          destinationInput={destinationInput}
          onDestinationChange={onDestinationChange}
          destinationChain={destinationChain}
          onChainChange={setDestinationChain}
          didTryDestination={didTryDestination}
          destinationError={destinationError}
          fundingError={funding.fundingError}
          onSubmit={onSaveDestination}
          isFundingActionLoading={isSubmitting || funding.isLaunchingWallet}
          fiatAccountHolderName={fiatAccountHolderName}
          onFiatAccountHolderNameChange={setFiatAccountHolderName}
          fiatAccountNumber={fiatAccountNumber}
          onFiatAccountNumberChange={setFiatAccountNumber}
          fiatAccountNumberError={fiatAccountNumberError}
          didTryFiatAccount={didTryFiatAccount}
          category={category}
          onCategoryChange={setCategory}
          narration={narration}
          onNarrationChange={setNarration}
          feeAmount={feeAmount}
          totalAmount={totalAmount}
        />

        <WithdrawConfirmSheet
          visible={isConfirmSheetVisible}
          onClose={() => setIsConfirmSheetVisible(false)}
          onConfirm={onConfirmTransaction}
          numericAmount={numericAmount}
          isFiatMethod={isFiatMethod}
          isCryptoMethod={isCryptoDestinationMethod}
          isP2PMethod={false}
          isFundFlow={isFundFlow}
          methodTitle={methodCopy.title}
          fiatAccountHolderName={fiatAccountHolderName}
          fiatAccountNumber={fiatAccountNumber}
          fiatRoutingNumber={destinationInput}
          destinationAddress={isCryptoDestinationMethod ? destinationInput : undefined}
          destinationChain={destinationChain}
          category={category}
          narration={narration}
          feeAmount={feeAmount}
          totalAmount={totalAmount}
        />

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
      </SafeAreaView>
    </ErrorBoundary>
  );
}
