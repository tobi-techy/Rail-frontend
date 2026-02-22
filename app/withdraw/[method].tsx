import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StatusBar, Text, TouchableOpacity, View } from 'react-native';
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
import { authService } from '@/api/services';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Keypad } from '@/components/molecules/Keypad';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';
import { BottomSheet, KYCVerificationSheet } from '@/components/sheets';
import { Button, Input } from '@/components/ui';
import { useInitiateFiatWithdrawal, useInitiateWithdrawal } from '@/api/hooks/useFunding';
import { useAuthStore } from '@/stores/authStore';
import { SessionManager } from '@/utils/sessionManager';

const BRAND_RED = '#FF2E01';

const springConfig = { damping: 15, stiffness: 200, mass: 0.8 };
const gentleSpring = { damping: 20, stiffness: 150, mass: 1 };

type WithdrawMethod = 'fiat' | 'crypto';

const LIMITS: Record<WithdrawMethod, number> = {
  fiat: 10_000,
  crypto: 50_000,
};

const FALLBACK_AVAILABLE_BALANCE = 0;
const MAX_INTEGER_DIGITS = 12;

const METHOD_COPY: Record<
  WithdrawMethod,
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

const isPasskeyCancelledError = (error: any) => {
  const code = String(error?.code || error?.error || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();

  return (
    code.includes('usercancel') ||
    code.includes('cancel') ||
    code.includes('abort') ||
    message.includes('cancelled') ||
    message.includes('canceled')
  );
};

const getPasskeyFallbackMessage = (error: any) => {
  const code = String(error?.code || error?.error || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();

  if (code === 'NOCREDENTIALS' || message.includes('no credentials')) {
    return 'No passkey found on this device. Enter your PIN.';
  }

  if (code === 'INVALID_SESSION') {
    return 'Passkey session expired. Please try again or enter your PIN.';
  }

  if (code === 'NETWORK_ERROR' || code === 'NETWORK_TIMEOUT' || error?.status === 0) {
    return 'Network issue during passkey sign-in. Enter your PIN.';
  }

  return 'Passkey verification failed. Enter your PIN to continue.';
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
  const fontSize = len <= 4 ? 95 : len <= 7 ? 79 : len <= 10 ? 58 : len <= 14 ? 40 : 42;

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
  const { data: station } = useStation();
  const params = useLocalSearchParams<{ method?: string }>();

  const selectedMethod: WithdrawMethod =
    params.method === 'fiat' || params.method === 'crypto' ? params.method : 'crypto';
  const { data: kycStatus, isLoading: isKycStatusLoading } = useKYCStatus(
    selectedMethod === 'fiat'
  );
  const isFiatApproved = kycStatus?.status === 'approved';

  const [rawAmount, setRawAmount] = useState('0');
  const [didTryContinue, setDidTryContinue] = useState(false);
  const [isDetailsSheetVisible, setIsDetailsSheetVisible] = useState(false);
  const [destinationInput, setDestinationInput] = useState('');
  const [didTryDestination, setDidTryDestination] = useState(false);
  const [isAuthorizeScreenVisible, setIsAuthorizeScreenVisible] = useState(false);
  const [authPasscode, setAuthPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [isSubmissionSheetVisible, setIsSubmissionSheetVisible] = useState(false);
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);
  const [showKycSheet, setShowKycSheet] = useState(false);

  const { mutate: initiateWithdrawal, isPending: isSubmittingCrypto } = useInitiateWithdrawal();
  const { mutate: initiateFiatWithdrawal, isPending: isSubmittingFiat } =
    useInitiateFiatWithdrawal();
  const { mutate: verifyPasscode, isPending: isPasscodeVerifying } = useVerifyPasscode();
  const isSubmitting = isSubmittingCrypto || isSubmittingFiat;
  const isAuthorizing = isPasscodeVerifying || isPasskeyLoading;

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
    const parsed = Number.parseFloat(station?.spend_balance ?? '');
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
    return FALLBACK_AVAILABLE_BALANCE;
  }, [station?.spend_balance]);

  const withdrawalLimit = LIMITS[selectedMethod];
  const maxWithdrawable = Math.min(withdrawalLimit, availableBalance);

  const numericAmount = useMemo(() => {
    const parsed = Number.parseFloat(rawAmount);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [rawAmount]);

  const amountError = useMemo(() => {
    if (numericAmount <= 0) return 'Enter an amount greater than $0.00.';
    if (numericAmount > withdrawalLimit) {
      return `This amount is above your ${selectedMethod} withdrawal limit of $${formatCurrency(withdrawalLimit)}.`;
    }
    if (numericAmount > availableBalance) {
      return `Insufficient funds. You need $${formatCurrency(numericAmount - availableBalance)} more.`;
    }
    return '';
  }, [availableBalance, numericAmount, selectedMethod, withdrawalLimit]);

  const destinationError = useMemo(() => {
    if (!destinationInput.trim()) {
      return selectedMethod === 'fiat'
        ? 'Routing number is required.'
        : 'Wallet address is required.';
    }

    if (selectedMethod === 'fiat') {
      const digitsOnly = destinationInput.replace(/\D/g, '');
      if (digitsOnly.length !== 9) {
        return 'Routing number must be exactly 9 digits.';
      }
    }

    if (selectedMethod === 'crypto') {
      const trimmedAddress = destinationInput.trim();
      if (trimmedAddress.length < 18) {
        return 'Wallet address looks too short.';
      }
    }

    return '';
  }, [destinationInput, selectedMethod]);

  const canContinue = Boolean(numericAmount > 0 && !amountError);
  const canSaveDestination = Boolean(!destinationError);

  const onAmountKeyPress = useCallback((key: string) => {
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
  }, [maxWithdrawable]);

  const onMaxPress = useCallback(() => {
    setDidTryContinue(false);
    setRawAmount(formatMaxAmount(maxWithdrawable));
  }, [maxWithdrawable]);

  const onContinuePress = useCallback(() => {
    setDidTryContinue(true);

    if (!canContinue) {
      return;
    }

    setDidTryDestination(false);
    setIsDetailsSheetVisible(true);
  }, [canContinue]);

  const onSaveDestination = useCallback(() => {
    setDidTryDestination(true);
    setAuthError('');

    if (!canSaveDestination) return;

    setIsDetailsSheetVisible(false);
    setAuthPasscode('');
    setIsAuthorizeScreenVisible(true);
  }, [canSaveDestination]);

  const onCloseSubmittedSheet = useCallback(() => {
    setIsSubmissionSheetVisible(false);
    setRawAmount('0');
    setDestinationInput('');
    setDidTryContinue(false);
    setDidTryDestination(false);
  }, []);

  const onSubmitAuthorizedWithdrawal = useCallback(() => {
    const normalizedAmount = Number(numericAmount.toFixed(2));
    const destination = destinationInput.trim();

    const onSuccess = () => {
      setIsAuthorizeScreenVisible(false);
      setIsSubmissionSheetVisible(true);
      setAuthPasscode('');
      setAuthError('');
    };

    const onError = (err: any) => {
      setAuthError(err?.message || 'Withdrawal failed. Please try again.');
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
  }, [destinationInput, initiateFiatWithdrawal, initiateWithdrawal, numericAmount, selectedMethod]);

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

    setAuthError('');
    setIsPasskeyLoading(true);

    try {
      const beginResponse = await authService.beginPasskeyLogin({ email });
      const passkeyRequest = normalizePasskeyGetRequest(beginResponse.options);
      const assertion = await Passkey.get(passkeyRequest);

      const finishResponse = await authService.finishPasskeyLogin({
        sessionId: beginResponse.sessionId,
        response: {
          ...assertion,
          type: assertion.type || 'public-key',
        },
      });

      const nowIso = new Date().toISOString();
      const tokenExpiresAt = finishResponse.expiresAt
        ? new Date(finishResponse.expiresAt).toISOString()
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const passcodeSessionExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      useAuthStore.setState({
        user: finishResponse.user,
        accessToken: finishResponse.accessToken,
        refreshToken: finishResponse.refreshToken,
        isAuthenticated: true,
        pendingVerificationEmail: null,
        onboardingStatus: finishResponse.user.onboardingStatus || null,
        lastActivityAt: nowIso,
        tokenIssuedAt: nowIso,
        tokenExpiresAt,
        passcodeSessionToken: 'passkey-login',
        passcodeSessionExpiresAt,
      });
      SessionManager.schedulePasscodeSessionExpiry(passcodeSessionExpiresAt);

      onSubmitAuthorizedWithdrawal();
    } catch (err: any) {
      if (isPasskeyCancelledError(err)) {
        setAuthError('Passkey cancelled. Enter your PIN to continue.');
        return;
      }
      setAuthError(getPasskeyFallbackMessage(err));
    } finally {
      setIsPasskeyLoading(false);
    }
  }, [isAuthorizing, isSubmitting, onSubmitAuthorizedWithdrawal, user?.email]);

  const onDestinationChange = useCallback(
    (value: string) => {
      setDidTryDestination(false);

      if (selectedMethod === 'fiat') {
        setDestinationInput(value.replace(/\D/g, '').slice(0, 9));
        return;
      }

      setDestinationInput(value);
    },
    [selectedMethod]
  );

  const methodCopy = METHOD_COPY[selectedMethod];
  const displayAmount = toDisplayAmount(rawAmount);

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

  if (selectedMethod === 'fiat' && isKycStatusLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  if (selectedMethod === 'fiat' && !isFiatApproved) {
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
            <Text className="font-subtitle text-[20px] text-text-primary">Confirm withdrawal</Text>
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
                  {isSubmitting ? 'Submitting withdrawal...' : 'Authorizing...'}
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
            <Text className="font-subtitle text-[20px] text-white">Withdraw</Text>
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

            {/* Balance, Fee & Max Section with scale animation */}
            <Animated.View
              entering={FadeInUp.delay(200).duration(400)}
              style={pillsAnimatedStyle}
              className="mt-6 flex-row items-center justify-center gap-2">
              <View className="flex-row items-center rounded-full bg-white/20 px-3 py-2">
                <Text className="font-body text-[13px] text-white/90">
                  Balance: ${formatCurrency(availableBalance)}
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

            <View className="mt-5">
              <Input
                label={methodCopy.detailLabel}
                value={destinationInput}
                onChangeText={onDestinationChange}
                placeholder={methodCopy.detailPlaceholder}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType={selectedMethod === 'fiat' ? 'number-pad' : 'default'}
                className="h-14 rounded-xl"
                error={
                  didTryDestination || destinationInput.length > 0 ? destinationError : undefined
                }
              />
            </View>

            <View className="mt-4 rounded-2xl bg-surface px-4 py-3">
              <View className="flex-row items-center justify-between">
                <Text className="font-body text-[13px] text-text-secondary">Withdrawal amount</Text>
                <Text
                  className="font-subtitle text-[15px] text-text-primary"
                  style={{ fontVariant: ['tabular-nums'] }}>
                  ${formatCurrency(numericAmount)}
                </Text>
              </View>
              <View className="mt-2 flex-row items-center justify-between">
                <Text className="font-body text-[13px] text-text-secondary">Method</Text>
                <Text className="font-subtitle text-[15px] capitalize text-text-primary">
                  {selectedMethod}
                </Text>
              </View>
            </View>

            <Button
              title="Continue"
              className="mt-5"
              onPress={onSaveDestination}
              disabled={isSubmitting}
              loading={isSubmitting}
            />
          </View>
        </BottomSheet>

        <BottomSheet
          visible={isSubmissionSheetVisible}
          onClose={onCloseSubmittedSheet}
          showCloseButton={false}
          dismissible>
          <View className="items-center pb-1">
            <View className="size-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 size={28} color="#10B981" />
            </View>
            <Text className="mt-5 text-center font-subtitle text-[30px] leading-[36px] text-text-primary">
              Withdrawal{'\n'}submitted
            </Text>
            <Text className="mt-3 text-center font-body text-[16px] text-text-secondary">
              Your transaction is on its way. You can check History for live status.
            </Text>

            <Button
              title="Close"
              className="mt-6 bg-surface"
              variant="white"
              onPress={onCloseSubmittedSheet}
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
