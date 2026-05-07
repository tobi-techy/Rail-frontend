import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, Pressable, View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  FadeInUp,
  SlideInUp,
} from 'react-native-reanimated';
import { useStation, useVerifyPasscode } from '@/api/hooks';
import { useFundStash } from '@/api/hooks/useFunding';
import { Keypad } from '@/components/molecules/Keypad';
import { Button } from '@/components/ui';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { usePasskeyAuthorize } from '@/hooks/usePasskeyAuthorize';
import { parseApiError, isPasscodeSessionError } from '@/utils/apiError';
import { safeName } from './withdraw/method-screen/utils';
import {
  WithdrawalStatusScreen,
  type WithdrawalStatusType,
} from '@/components/withdraw/WithdrawalStatusScreen';
import { AuthorizeScreen } from './withdraw/method-screen/sections';
import { AnimatedAmount } from './withdraw/method-screen/AnimatedAmount';
import { formatCurrency, toDisplayAmount, normalizeAmount, formatMaxAmount } from './withdraw/method-screen/utils';
import { MAX_INTEGER_DIGITS } from './withdraw/method-screen/constants';
import { Cancel01Icon } from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';
import { useAuthStore } from '@/stores/authStore';
import { Passkey } from 'react-native-passkey';

const BRAND_COLOR = '#ff3e00';
const gentleSpring = { damping: 20, stiffness: 150, mass: 1 };
const springConfig = { damping: 15, stiffness: 200, mass: 0.8 };

export default function FundStashScreen() {
  const { showError } = useFeedbackPopup();
  const { data: station } = useStation();
  const { mutateAsync: executeFundStash, isPending: isSubmitting } = useFundStash();
  const { mutate: verifyPasscode, isPending: isPasscodeVerifying } = useVerifyPasscode();
  const user = useAuthStore((s) => s.user);

  const [rawAmount, setRawAmount] = useState('0');
  const [status, setStatus] = useState<WithdrawalStatusType | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  const [pinAttempts, setPinAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutSecondsRemaining, setLockoutSecondsRemaining] = useState(0);
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);

  useEffect(() => {
    setPasskeyAvailable(Passkey.isSupported() && Boolean(safeName(user?.email)));
  }, [user?.email]);

  useEffect(() => {
    if (!lockoutUntil) return;
    const tick = setInterval(() => {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (remaining <= 0) { setLockoutUntil(null); setLockoutSecondsRemaining(0); setPinAttempts(0); }
      else setLockoutSecondsRemaining(remaining);
    }, 1000);
    return () => clearInterval(tick);
  }, [lockoutUntil]);

  const spendBalance = useMemo(() => {
    const parsed = parseFloat(station?.spend_balance ?? '');
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }, [station?.spend_balance]);

  const numericAmount = useMemo(() => {
    const n = parseFloat(rawAmount);
    return Number.isFinite(n) ? n : 0;
  }, [rawAmount]);

  const amountError = useMemo(() => {
    if (numericAmount <= 0) return null;
    if (numericAmount < 1) return 'Minimum $1.00';
    if (numericAmount > spendBalance) return 'Exceeds spend balance';
    return null;
  }, [numericAmount, spendBalance]);

  const canContinue = numericAmount >= 1 && !amountError;

  const onAmountKeyPress = useCallback((key: string) => {
    if (key === 'backspace') {
      setRawAmount((prev) => (prev.length <= 1 ? '0' : normalizeAmount(prev.slice(0, -1))));
      return;
    }
    if (key === 'decimal') {
      setRawAmount((prev) => (prev.includes('.') ? prev : prev + '.'));
      return;
    }
    setRawAmount((prev) => {
      const next = prev === '0' ? key : prev + key;
      if (next.includes('.')) {
        const [, dec = ''] = next.split('.');
        if (dec.length > 2) return prev;
      }
      const [intPart] = next.split('.');
      if (intPart.replace(/^0+/, '').length > MAX_INTEGER_DIGITS) return prev;
      return normalizeAmount(next);
    });
  }, []);

  const onMaxPress = useCallback(() => {
    if (spendBalance <= 0) return;
    setRawAmount(formatMaxAmount(spendBalance));
  }, [spendBalance]);

  // ── Ref-stable transfer function ────────────────────────────────────────
  const authErrorRef = useRef<(msg: string) => void>(() => {});
  const doTransfer = useCallback(async () => {
    try {
      await executeFundStash(numericAmount.toFixed(2));
      setShowAuthScreen(false);
      setStatus('success');
    } catch (err) {
      if (isPasscodeSessionError(err)) {
        setShowAuthScreen(true);
        authErrorRef.current('Authorization expired. Please verify again.');
        return;
      }
      setShowAuthScreen(false);
      const msg = parseApiError(err, 'Transfer failed. Please try again.');
      setErrorMsg(msg);
      setStatus('failed');
      showError(msg);
    }
  }, [executeFundStash, numericAmount, showError]);

  // ── Passkey authorize ───────────────────────────────────────────────────
  const passkeyPromptScope = `fund-stash:${safeName(user?.email) || 'unknown'}:${numericAmount.toFixed(2)}`;
  const passkey = usePasskeyAuthorize({
    email: user?.email,
    passkeyPromptScope,
    autoTrigger: showAuthScreen && passkeyAvailable,
    onAuthorized: doTransfer,
  });

  // Keep ref in sync so doTransfer can set auth errors without circular dep
  useEffect(() => { authErrorRef.current = passkey.setAuthError; }, [passkey.setAuthError]);

  // ── Passcode authorize ──────────────────────────────────────────────────
  const doTransferRef = useRef(doTransfer);
  useEffect(() => { doTransferRef.current = doTransfer; }, [doTransfer]);

  const onPasscodeAuthorize = useCallback((code: string) => {
    if (isPasscodeVerifying || isSubmitting || lockoutUntil) return;
    passkey.setAuthError('');
    verifyPasscode({ passcode: code }, {
      onSuccess: (result) => {
        if (!result.verified) {
          const next = pinAttempts + 1;
          setPinAttempts(next);
          if (next >= 5) {
            setLockoutUntil(Date.now() + 30_000);
            setLockoutSecondsRemaining(30);
            passkey.setAuthError('Too many attempts. Try again in 30s.');
          } else {
            passkey.setAuthError(`Invalid PIN. ${5 - next} left.`);
          }
          passkey.onAuthPasscodeChange('');
          return;
        }
        setPinAttempts(0);
        setLockoutUntil(null);
        void doTransferRef.current();
      },
      onError: (err: unknown) => {
        passkey.setAuthError(parseApiError(err, 'Failed to verify PIN.'));
        passkey.onAuthPasscodeChange('');
      },
    });
  }, [isPasscodeVerifying, isSubmitting, lockoutUntil, passkey, pinAttempts, verifyPasscode]);

  const onCTAPress = useCallback(() => {
    if (!canContinue) return;
    passkey.setAuthError('');
    passkey.onAuthPasscodeChange('');
    setShowAuthScreen(true);
  }, [canContinue, passkey]);

  // ── Animations ──────────────────────────────────────────────────────────
  const headerOpacity = useSharedValue(0);
  const keypadTranslateY = useSharedValue(60);
  const pillsScale = useSharedValue(0.8);
  const pillsOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
    keypadTranslateY.value = withSpring(0, { ...gentleSpring, damping: 18 });
  }, []);

  useEffect(() => {
    if (numericAmount > 0) {
      pillsScale.value = withSpring(1, springConfig);
      pillsOpacity.value = withTiming(1, { duration: 300 });
    } else {
      pillsScale.value = withSpring(0.9, gentleSpring);
      pillsOpacity.value = withTiming(0.7, { duration: 200 });
    }
  }, [numericAmount]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const keypadAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: keypadTranslateY.value }],
    opacity: interpolate(keypadTranslateY.value, [60, 0], [0, 1]),
  }));
  const pillsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pillsScale.value }],
    opacity: pillsOpacity.value,
  }));

  if (showAuthScreen) {
    return (
      <AuthorizeScreen
        authorizeTitle="Authorize Transfer"
        authError={passkey.authError}
        authPasscode={passkey.authPasscode}
        isAuthorizing={passkey.isPasskeyLoading || isPasscodeVerifying}
        isSubmitting={isSubmitting}
        authorizingTitle="Verifying..."
        submittingTitle="Moving to stash..."
        summaryAmount={numericAmount}
        onClose={() => setShowAuthScreen(false)}
        onPasscodeAuthorize={onPasscodeAuthorize}
        onPasskeyPress={passkey.onPasskeyAuthorize}
        onValueChange={passkey.onAuthPasscodeChange}
        showPasskey={passkeyAvailable}
        pinAttemptsRemaining={pinAttempts > 0 ? 5 - pinAttempts : undefined}
        isLockedOut={!!lockoutUntil}
        lockoutSecondsRemaining={lockoutSecondsRemaining}
      />
    );
  }

  if (status) {
    return (
      <WithdrawalStatusScreen
        status={status}
        amount={`$${formatCurrency(numericAmount)}`}
        message={
          status === 'success'
            ? `$${numericAmount.toFixed(2)} moved to your investment stash.`
            : errorMsg
        }
        onDone={() => router.replace('/(tabs)' as never)}
        onRetry={status === 'failed' ? () => { setStatus(null); setErrorMsg(''); } : undefined}
      />
    );
  }

  const displayAmount = toDisplayAmount(rawAmount);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: BRAND_COLOR }} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_COLOR} />
      <View className="flex-1 px-5">
        <Animated.View entering={FadeIn.duration(400)} style={headerAnimatedStyle} className="flex-row items-center justify-between pb-2 pt-1">
          <Pressable className="size-11 items-center justify-center rounded-full bg-white/20" onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close">
            <HugeiconsIcon icon={Cancel01Icon} size={20} color="#FFFFFF" />
          </Pressable>
          <Text className="font-subtitle text-[20px] text-white">Fund Stash</Text>
          <View className="size-11" />
        </Animated.View>

        <View className="flex-1 items-center justify-center px-2">
          <Text className="font-body text-[13px] text-white/80">From Spend</Text>
          <View className="mt-2"><AnimatedAmount amount={displayAmount} prefix="$" /></View>
          <Animated.View entering={FadeInUp.delay(200).duration(400)} style={pillsAnimatedStyle} className="mt-6 flex-row items-center justify-center gap-2">
            <View className="flex-row items-center rounded-full bg-white/20 px-3 py-2">
              <Text className="font-body text-[13px] text-white/90">Spend: ${formatCurrency(spendBalance)}</Text>
            </View>
            <Pressable onPress={onMaxPress} className="rounded-full bg-parchment-card px-4 py-2" accessibilityRole="button" accessibilityLabel="Set maximum amount">
              <Text className="font-subtitle text-[13px]" style={{ color: BRAND_COLOR }}>Max</Text>
            </Pressable>
          </Animated.View>
        </View>

        <Animated.View entering={SlideInUp.delay(100).duration(500)} className="px-0 pb-3 pt-1">
          <Button title="Move to Stash" onPress={onCTAPress} disabled={!canContinue} variant="white" className="bg-warm-canvas" />
        </Animated.View>
        <Animated.View entering={SlideInUp.delay(100).duration(500)} style={keypadAnimatedStyle}>
          <Keypad className="pb-2" onKeyPress={onAmountKeyPress} backspaceIcon="delete" variant="dark" leftKey="decimal" />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
