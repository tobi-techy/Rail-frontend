import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StatusBar, Text, Pressable, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInUp, FadeIn, SlideInUp } from 'react-native-reanimated';
import { useKYCStatus } from '@/api/hooks/useKYC';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Keypad } from '@/components/molecules/Keypad';
import { Button } from '@/components/ui';
import { isPasscodeSessionError, parseApiError } from '@/utils/apiError';
import { commitmentDeclineMessage, isCommitmentExceededError } from '@/utils/spendingCommitment';
import { AnimatedAmount } from '@/components/withdraw/method-screen/AnimatedAmount';
import {
  BRAND_RED,
  isP2PMethod,
  isWalletFundingMethod,
  resolveFlow,
  resolveMethod,
} from '@/components/withdraw/method-screen/constants';
import type { FiatCurrency, WithdrawalStep } from '@/components/withdraw/method-screen/types';
import { getFlowLabels, formatCurrency } from '@/components/withdraw/method-screen/utils';
import { useMobileWalletFunding } from '@/components/withdraw/method-screen/useMobileWalletFunding';
import { useWithdrawalSubmit } from '@/components/withdraw/method-screen/useWithdrawalSubmit';
import { useMWAWithdrawal } from '@/components/withdraw/method-screen/useMWAWithdrawal';
import { useWithdrawalAmount } from '@/components/withdraw/method-screen/useWithdrawalAmount';
import { useWithdrawalAuthorize } from '@/components/withdraw/method-screen/useWithdrawalAuthorize';
import { useAmountNudge } from '@/components/withdraw/method-screen/useAmountNudge';
import { useAmountAnimations } from '@/components/withdraw/method-screen/useAmountAnimations';
import {
  AuthorizeScreen,
  FiatKycRequiredScreen,
  WithdrawSubmissionSheet,
} from '@/components/withdraw/method-screen/sections';
import { P2PSendScreen } from '@/components/withdraw/method-screen/P2PSendScreen';
import {
  WithdrawalStatusScreen,
  type WithdrawalStatusType,
} from '@/components/withdraw/WithdrawalStatusScreen';
import { WhitelistPrompt } from '@/components/withdraw/WhitelistPrompt';
import { MFAChallengeSheet } from '@/components/sheets/MFAChallengeSheet';
import { Cancel01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import { useButtonFeedback } from '@/hooks/useButtonFeedback';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import * as Haptics from '@/utils/platformHaptics';

export default function WithdrawAmountScreen() {
  const insets = useSafeAreaInsets();
  const triggerFeedback = useButtonFeedback();
  const { impact } = useHaptics();
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

  // ── Route params ──────────────────────────────────────────────────────────
  const selectedMethod = resolveMethod(
    typeof params.method === 'string' ? params.method : undefined
  );
  const requestedFlow = resolveFlow(typeof params.flow === 'string' ? params.flow : undefined);
  const asset = typeof params.asset === 'string' ? params.asset : undefined;

  const isP2P = isP2PMethod(selectedMethod);
  const isFundFlow = requestedFlow === 'fund' && Platform.OS === 'android';
  const isFiatMethod = selectedMethod === 'fiat';
  const isNairaFlow = asset === 'NGN';
  const isAssetTradeMethod = selectedMethod === 'asset-buy' || selectedMethod === 'asset-sell';
  const isAssetBuyMethod = selectedMethod === 'asset-buy';
  const isCryptoDestinationMethod =
    selectedMethod === 'crypto' || selectedMethod === 'phantom' || selectedMethod === 'solflare';
  const isMobileWalletFundingFlow = isFundFlow && isWalletFundingMethod(selectedMethod);
  const isMWAWithdrawMethod = selectedMethod === 'mwa-withdraw';

  // ── Destination state (synced from params) ────────────────────────────────
  const [destinationInput, setDestinationInput] = useState(params.destinationInput ?? '');
  const [destinationChain, setDestinationChain] = useState(params.destinationChain ?? 'SOL');
  const [fiatAccountHolderName] = useState(params.fiatAccountHolderName ?? '');
  const [fiatAccountNumber] = useState(params.fiatAccountNumber ?? '');
  const [fiatCurrency] = useState<FiatCurrency>((params.fiatCurrency as FiatCurrency) ?? 'USD');
  const [fiatBic] = useState(params.fiatBic ?? '');
  const [category] = useState(params.category ?? 'Transfer');
  const [narration] = useState(params.narration ?? '');

  useEffect(() => {
    if (params.destinationInput) setDestinationInput(params.destinationInput);
  }, [params.destinationInput]);
  useEffect(() => {
    if (params.destinationChain) setDestinationChain(params.destinationChain);
  }, [params.destinationChain]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [isSubmissionSheetVisible, setIsSubmissionSheetVisible] = useState(false);
  const [isAuthVisible, setIsAuthVisible] = useState(false);
  const [withdrawalStatus, setWithdrawalStatus] = useState<WithdrawalStatusType | null>(null);
  const [withdrawalErrorMsg, setWithdrawalErrorMsg] = useState('');
  const [showWhitelistPrompt, setShowWhitelistPrompt] = useState(false);
  const [showMFASheet, setShowMFASheet] = useState(false);
  const [showKycSheet, setShowKycSheet] = useState(false);
  const [, setCurrentStep] = useState<WithdrawalStep>('amount');

  // ── Amount logic ──────────────────────────────────────────────────────────
  const amount = useWithdrawalAmount({ selectedMethod, isFundFlow, isFiatMethod, asset });
  const { numericAmount, rawAmount } = amount;

  // ── Nudge logic ───────────────────────────────────────────────────────────
  const nudgeCurrency = isCryptoDestinationMethod ? 'USDC' : asset || amount.storeCurrency;
  const nudge = useAmountNudge({
    numericAmount,
    amountError: amount.amountError,
    availableBalance: amount.availableBalance,
    maxWithdrawable: amount.maxWithdrawable,
    feeAmount: amount.feeAmount,
    isFundFlow,
    isNGNAsset: amount.isNGNAsset,
    limitLabel: amount.methodCopy.limitLabel,
  });

  // ── Animations ────────────────────────────────────────────────────────────
  const anim = useAmountAnimations(rawAmount);

  // ── Submission logic ──────────────────────────────────────────────────────
  const openSubmissionSheet = useCallback(() => {
    setIsAuthVisible(false);
    setWithdrawalStatus('success');
    setIsSubmissionSheetVisible(true);
  }, []);

  const funding = useMobileWalletFunding({
    enabled: isMobileWalletFundingFlow,
    selectedMethod,
    numericAmount,
    spendBalance: undefined,
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
      setIsAuthVisible(false);
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

  const onSubmitAuthorizedWithdrawal = useCallback(() => {
    if (isMWAWithdrawMethod) {
      setIsAuthVisible(false);
      void mwaWithdrawal.startWithdrawal();
      return;
    }
    withdrawal.submit({
      onSuccess: openSubmissionSheet,
      onError: (err: unknown) => {
        if (isPasscodeSessionError(err)) {
          setIsAuthVisible(true);
          return;
        }
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
        setIsAuthVisible(false);
        setWithdrawalErrorMsg(
          isCommitmentExceededError(err)
            ? commitmentDeclineMessage(err)
            : parseApiError(
                err,
                `${isFundFlow ? 'Funding' : 'Withdrawal'} failed. Please try again.`
              )
        );
        setWithdrawalStatus('failed');
      },
    });
  }, [withdrawal, openSubmissionSheet, isFundFlow, isMWAWithdrawMethod, mwaWithdrawal]);

  // ── Authorization ─────────────────────────────────────────────────────────
  const auth = useWithdrawalAuthorize({
    selectedMethod,
    numericAmount,
    isFundFlow,
    isMWAWithdrawMethod,
    isVisible: isAuthVisible,
    setIsVisible: setIsAuthVisible,
    onSubmitWithdrawal: onSubmitAuthorizedWithdrawal,
    onWhitelistRequired: () => setShowWhitelistPrompt(true),
    onMFARequired: () => setShowMFASheet(true),
    onWithdrawalFailed: (msg) => {
      setWithdrawalErrorMsg(msg);
      setWithdrawalStatus('failed');
    },
  });

  // ── Confirm return effect ─────────────────────────────────────────────────
  useEffect(() => {
    if (params._confirm !== '1') return;
    auth.handleConfirmReturn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params._confirm]);

  // ── KYC ───────────────────────────────────────────────────────────────────
  const { data: kycStatus, isLoading: isKycStatusLoading } = useKYCStatus(
    isFiatMethod && !isNairaFlow
  );
  const isFiatApproved = kycStatus?.status === 'approved';

  // ── Continue handler ──────────────────────────────────────────────────────
  const onContinuePress = useCallback(() => {
    funding.reset();
    mwaWithdrawal.reset();
    if (!amount.canContinue) return;
    if (isMWAWithdrawMethod) {
      setIsAuthVisible(true);
      return;
    }

    const amountStr = numericAmount.toFixed(2);

    // Crypto with pre-filled address → go to crypto confirm
    if (isCryptoDestinationMethod && params.destinationInput && params.destinationChain) {
      router.push({
        pathname: '/withdraw/crypto/confirm' as never,
        params: {
          amount: amountStr,
          destinationInput: params.destinationInput,
          destinationChain: params.destinationChain,
          currency: nudgeCurrency,
        },
      });
      return;
    }

    // Route to currency-specific flow
    const currency = nudgeCurrency;
    if (currency === 'NGN') {
      router.push({
        pathname: '/withdraw/ngn/recipients' as never,
      });
    } else if (currency === 'EUR') {
      router.push({
        pathname: '/withdraw/eur/recipients' as never,
        params: { amount: amountStr, currency },
      });
    } else if (currency === 'GBP') {
      router.push({
        pathname: '/withdraw/gbp/recipients' as never,
        params: { amount: amountStr, currency },
      });
    } else {
      // Default: USD
      router.push({
        pathname: '/withdraw/usd/recipients' as never,
        params: { amount: amountStr, currency: 'USD' },
      });
    }
  }, [
    amount.canContinue,
    funding,
    isMWAWithdrawMethod,
    isCryptoDestinationMethod,
    mwaWithdrawal,
    numericAmount,
    nudgeCurrency,
    params.destinationInput,
    params.destinationChain,
  ]);

  // ── Derived display ───────────────────────────────────────────────────────
  const { balanceLabel, flowTitle, authorizeTitle, submittingTitle } = useMemo(
    () => getFlowLabels({ isAssetBuyMethod, isAssetTradeMethod, isFundFlow }),
    [isAssetBuyMethod, isAssetTradeMethod, isFundFlow]
  );
  const isFundingWaitingState = isMobileWalletFundingFlow && funding.isFundingPending;
  const isFundingPendingState =
    isMobileWalletFundingFlow && !funding.isFundingPending && funding.fundingTimedOut;
  const isFundingCompleteState =
    isMobileWalletFundingFlow && !funding.isFundingPending && funding.fundingConfirmed;

  const onCloseSubmittedSheet = useCallback(() => {
    setIsSubmissionSheetVisible(false);
    amount.resetAmount();
    setDestinationInput('');
    funding.reset();
  }, [amount, funding]);

  const onDismissSubmittedSheet = useCallback(() => {
    if (isMobileWalletFundingFlow && funding.isFundingPending) {
      setIsSubmissionSheetVisible(false);
      return;
    }
    onCloseSubmittedSheet();
  }, [funding.isFundingPending, isMobileWalletFundingFlow, onCloseSubmittedSheet]);

  // ═══════════════════════════════════════════════════════════════════════════
  // EARLY RETURNS
  // ═══════════════════════════════════════════════════════════════════════════

  if (isFiatMethod && !isNairaFlow && isKycStatusLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-warm-canvas">
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  if (isFiatMethod && !isNairaFlow && !isFiatApproved) {
    return (
      <FiatKycRequiredScreen
        kycStatus={kycStatus}
        showKycSheet={showKycSheet}
        onStartVerification={() => setShowKycSheet(true)}
        onCloseKycSheet={() => setShowKycSheet(false)}
      />
    );
  }

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
    const statusAmount = amount.isNGNAsset
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
                setIsAuthVisible(true);
              }
            : undefined
        }
      />
    );
  }

  if (isAuthVisible) {
    return (
      <AuthorizeScreen
        authorizeTitle={authorizeTitle}
        authError={auth.passkey.authError}
        authPasscode={auth.passkey.authPasscode}
        isAuthorizing={auth.isAuthorizing}
        isSubmitting={withdrawal.isSubmitting}
        authorizingTitle={auth.authorizingTitle}
        onClose={() => {
          if (!auth.isAuthorizing && !withdrawal.isSubmitting) setIsAuthVisible(false);
        }}
        onPasscodeAuthorize={auth.onPasscodeAuthorize}
        onPasskeyPress={auth.handlePasskeyPress}
        onValueChange={auth.passkey.onAuthPasscodeChange}
        showPasskey={auth.passkeySupported}
        submittingTitle={submittingTitle}
        summaryAmount={numericAmount}
        pinAttemptsRemaining={auth.MAX_PIN_ATTEMPTS - auth.pinAttempts}
        isLockedOut={!!auth.lockoutUntil}
        lockoutSecondsRemaining={auth.lockoutSecondsRemaining}
      />
    );
  }

  if (isP2P) {
    return <P2PSendScreen />;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN AMOUNT ENTRY UI
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1" style={{ backgroundColor: BRAND_RED }} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={BRAND_RED} />
        <View className="flex-1 px-5">
          {/* Header */}
          <Animated.View
            entering={FadeIn.duration(400)}
            style={anim.headerAnimatedStyle}
            className="flex-row items-center justify-between pb-2 pt-1">
            <Pressable
              className="size-11 items-center justify-center rounded-full bg-white/20"
              onPress={() => {
                router.back();
              }}
              accessibilityRole="button"
              accessibilityLabel="Close withdraw flow">
              <HugeiconsIcon icon={Cancel01Icon} size={20} color="#FFFFFF" />
            </Pressable>
            <Text className="font-subtitle text-[20px] text-white" maxFontSizeMultiplier={1.3}>
              {flowTitle}
            </Text>
            <View className="size-11" />
          </Animated.View>

          {/* Amount display */}
          <View className="flex-1 items-center justify-center px-2">
            <Text className="font-body text-[13px] text-white/80" maxFontSizeMultiplier={1.4}>
              {amount.methodCopy.title}
            </Text>
            <View className="mt-2">
              <AnimatedAmount amount={amount.displayAmount} prefix={asset === 'NGN' ? '₦' : '$'} />
            </View>

            {!isFundFlow && (
              <Animated.View
                entering={FadeInUp.delay(200).duration(400)}
                style={anim.pillsAnimatedStyle}
                className="mt-6 flex-row items-center justify-center gap-2">
                <View className="flex-row items-center rounded-full bg-white/20 px-3 py-2">
                  <Text className="font-body text-[13px] text-white/90" maxFontSizeMultiplier={1.4}>
                    {balanceLabel}: {amount.isNGNAsset ? '₦' : '$'}
                    {formatCurrency(amount.availableBalance)}
                  </Text>
                </View>
                {numericAmount > 0 && isFiatMethod && (
                  <Animated.View
                    entering={FadeIn.springify()}
                    className="flex-row items-center rounded-full bg-white/90 px-3 py-2">
                    <Text
                      className="font-body text-[13px]"
                      style={{ color: BRAND_RED }}
                      maxFontSizeMultiplier={1.4}>
                      Fee: ${formatCurrency(amount.feeAmount)}
                    </Text>
                  </Animated.View>
                )}
                <Pressable
                  onPress={() => {
                    triggerFeedback();
                    amount.onMaxPress();
                  }}
                  className="rounded-full bg-parchment-card px-4 py-2"
                  accessibilityRole="button"
                  accessibilityLabel="Set maximum withdrawal amount">
                  <Text
                    className="font-subtitle text-[13px]"
                    style={{ color: BRAND_RED }}
                    maxFontSizeMultiplier={1.4}>
                    Max
                  </Text>
                </Pressable>
              </Animated.View>
            )}
          </View>

          {/* Send button + keypad */}
          <Animated.View entering={SlideInUp.delay(100).duration(500)} className="px-0 pb-3 pt-1">
            {isMWAWithdrawMethod && !!mwaWithdrawal.error && (
              <Animated.View entering={FadeIn.duration(200)}>
                <Text
                  className="mb-2 font-body text-[13px] text-white/90"
                  maxFontSizeMultiplier={1.4}>
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
              disabled={!amount.canContinue}
              loading={mwaWithdrawal.isLoading}
              variant="white"
              className="bg-warm-canvas"
            />
          </Animated.View>

          <Animated.View
            entering={SlideInUp.delay(100).duration(500)}
            style={anim.keypadAnimatedStyle}>
            <Keypad
              className="pb-2"
              onKeyPress={amount.onAmountKeyPress}
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
