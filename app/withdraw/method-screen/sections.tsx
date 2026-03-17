import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Clipboard,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
  Copy,
  Globe,
  Fuel,
  Building2,
  User,
} from 'lucide-react-native';
import { router } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';
import { BottomSheet, KYCVerificationSheet } from '@/components/sheets';
import { Button, Input } from '@/components/ui';
import { SolanaIcon, MaticIcon, AvalancheIcon, UsdcIcon } from '@/assets/svg';
import { SUPPORTED_CHAINS } from '@/utils/chains';
import { useHaptics } from '@/hooks/useHaptics';
import { useKycStore } from '@/stores/kycStore';
import { isKycInReview } from '@/api/types/kyc';
import { formatCurrency } from './utils';
import type { MethodCopy } from './types';
import { cn } from '@/utils/cn';

type FiatKycRequiredScreenProps = {
  kycStatus: any;
  onStartVerification: () => void;
  showKycSheet: boolean;
  onCloseKycSheet: () => void;
};

type AuthorizeScreenProps = {
  authorizeTitle: string;
  authError: string;
  authPasscode: string;
  isAuthorizing: boolean;
  isSubmitting: boolean;
  authorizingTitle?: string;
  onClose: () => void;
  onPasscodeAuthorize: (code: string) => void;
  onPasskeyPress: () => void;
  onValueChange: (value: string) => void;
  showPasskey: boolean;
  submittingTitle: string;
  // transaction summary
  summaryAmount?: number;
  // lockout
  pinAttemptsRemaining?: number;
  isLockedOut?: boolean;
  lockoutSecondsRemaining?: number;
};

type WithdrawDetailsSheetProps = {
  destinationError: string;
  destinationInput: string;
  didTryDestination: boolean;
  fundingError: string;
  isAssetTradeMethod: boolean;
  isFiatMethod: boolean;
  isCryptoMethod?: boolean;
  isFundFlow: boolean;
  isFundingActionLoading: boolean;
  isMobileWalletFundingFlow: boolean;
  methodCopy: MethodCopy;
  numericAmount: number;
  onClose: () => void;
  onDestinationChange: (value: string) => void;
  destinationChain?: string;
  onChainChange?: (chain: string) => void;
  onSubmit: () => void;
  visible: boolean;
  // fiat bank details
  fiatAccountHolderName?: string;
  onFiatAccountHolderNameChange?: (value: string) => void;
  fiatAccountNumber?: string;
  onFiatAccountNumberChange?: (value: string) => void;
  fiatAccountNumberError?: string;
  didTryFiatAccount?: boolean;
  category: string;
  onCategoryChange: (value: string) => void;
  narration: string;
  onNarrationChange: (value: string) => void;
  feeAmount: number;
  totalAmount: number;
};

type WithdrawSubmissionSheetProps = {
  fundingSignature: string;
  isAssetTradeMethod: boolean;
  isFundFlow: boolean;
  isFundingCompleteState: boolean;
  isFundingPendingState: boolean;
  isFundingWaitingState: boolean;
  onClose: () => void;
  visible: boolean;
};

type WithdrawConfirmSheetProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  numericAmount: number;
  // method context
  isFiatMethod: boolean;
  isCryptoMethod: boolean;
  isP2PMethod: boolean;
  isFundFlow: boolean;
  methodTitle: string;
  // fiat
  fiatAccountHolderName?: string;
  fiatAccountNumber?: string;
  fiatRoutingNumber?: string;
  // crypto
  destinationAddress?: string;
  destinationChain?: string;
  // p2p
  recipientName?: string;
  recipientIdentifier?: string;
  note?: string;
  category?: string;
  narration?: string;
  feeAmount?: number;
  totalAmount?: number;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CHAIN_ICONS: Record<string, React.ComponentType<any>> = {
  'SOL-DEVNET': SolanaIcon,
  'MATIC-AMOY': MaticIcon,
  'AVAX-FUJI': AvalancheIcon,
};

const WITHDRAWAL_CATEGORIES = [
  'Transfer',
  'Bills',
  'Food',
  'Shopping',
  'Travel',
  'Savings',
  'Crypto',
  'Other',
] as const;

const maskAccountNumber = (value?: string) => {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, '');
  if (!digits) return undefined;
  return `••••${digits.slice(-4)}`;
};

const maskAddress = (value?: string) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (trimmed.length <= 12) return trimmed;
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-6)}`;
};

const resolveFromTo = ({
  isAssetTradeMethod,
  isFiatMethod,
  isCryptoMethod,
  isFundFlow,
  isMobileWalletFundingFlow,
  destinationInput,
  fiatAccountHolderName,
  fiatAccountNumber,
}: {
  isAssetTradeMethod: boolean;
  isFiatMethod: boolean;
  isCryptoMethod: boolean;
  isFundFlow: boolean;
  isMobileWalletFundingFlow: boolean;
  destinationInput: string;
  fiatAccountHolderName?: string;
  fiatAccountNumber?: string;
}) => {
  const fromLabel = isFundFlow ? 'External wallet' : 'Rail balance';

  if (isAssetTradeMethod) {
    return {
      fromLabel,
      toLabel: destinationInput ? destinationInput.toUpperCase() : 'Selected asset',
    };
  }

  if (isFiatMethod) {
    const maskedAccount = maskAccountNumber(fiatAccountNumber);
    const accountName = fiatAccountHolderName?.trim() || 'Bank account';
    return {
      fromLabel,
      toLabel: maskedAccount ? `${accountName} ${maskedAccount}` : accountName,
    };
  }

  if (isCryptoMethod) {
    if (isMobileWalletFundingFlow) {
      return { fromLabel: 'Mobile wallet', toLabel: 'Rail balance' };
    }
    const masked = maskAddress(destinationInput);
    return {
      fromLabel,
      toLabel: masked || 'Wallet address',
    };
  }

  return { fromLabel, toLabel: destinationInput || 'Destination' };
};

function ChainPill({
  chain,
  selected,
  onPress,
}: {
  chain: (typeof SUPPORTED_CHAINS)[0];
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const Icon = CHAIN_ICONS[chain.chain];
  const { selection } = useHaptics();

  return (
    <AnimatedPressable
      style={[
        animStyle,
        {
          backgroundColor: selected ? chain.color + '18' : '#F3F4F6',
          borderWidth: selected ? 1.5 : 1,
          borderColor: selected ? chain.color : 'transparent',
        },
      ]}
      onPress={() => {
        selection();
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 20, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      }}
      className="flex-1 items-center rounded-2xl px-2 py-3"
      accessibilityRole="button"
      accessibilityLabel={`Select ${chain.label}`}>
      {/* USDC + chain icon stack */}
      <View className="relative mb-2 size-10 items-center justify-center">
        <View
          className="size-10 items-center justify-center rounded-full"
          style={{ backgroundColor: chain.color + '22' }}>
          {Icon && <Icon width={22} height={22} />}
        </View>
        <View className="absolute -bottom-1 -right-1 size-5 items-center justify-center rounded-full bg-white shadow-sm">
          <UsdcIcon width={13} height={13} />
        </View>
      </View>
      <Text
        className="font-subtitle text-[12px]"
        style={{ color: selected ? chain.color : '#374151' }}>
        {chain.shortLabel}
      </Text>
    </AnimatedPressable>
  );
}

function getKycProgressScreen(state: ReturnType<typeof useKycStore.getState>): string {
  const { taxId, employmentStatus, investmentPurposes, disclosuresConfirmed, sumsubToken } = state;

  // If user has SumSub token, they're in the middle of ID verification
  if (sumsubToken) {
    return '/kyc/sumsub-sdk';
  }

  // If user has completed disclosures and submitted, they should be going to SumSub
  // But if sumsubToken is null (failed to get or session expired), go to disclosures to resubmit
  if (disclosuresConfirmed && taxId && employmentStatus && investmentPurposes.length > 0) {
    return '/kyc/disclosures';
  }

  // If user has started about-you (employment + investment goals), go to disclosures
  if (employmentStatus && investmentPurposes.length > 0 && taxId) {
    return '/kyc/disclosures';
  }

  // If user has started tax-id, go to about-you
  if (taxId) {
    return '/kyc/about-you';
  }

  // Nothing started, go to beginning
  return '/kyc/tax-id';
}

export function FiatKycRequiredScreen({
  kycStatus,
  showKycSheet,
  onCloseKycSheet,
}: FiatKycRequiredScreenProps) {
  const { taxId, employmentStatus, investmentPurposes, disclosuresConfirmed, sumsubToken } =
    useKycStore();

  const hasStartedKyc =
    taxId.trim().length > 0 ||
    employmentStatus !== null ||
    investmentPurposes.length > 0 ||
    disclosuresConfirmed ||
    sumsubToken !== null;

  const handleVerificationPress = useCallback(() => {
    if (hasStartedKyc) {
      const state = useKycStore.getState();
      const screen = getKycProgressScreen(state);
      router.push(screen as never);
    } else {
      router.push('/kyc');
    }
  }, [hasStartedKyc]);

  const isPending = isKycInReview(kycStatus);

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
            {isPending ? (
              <>
                <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                  <ShieldAlert size={32} color="#F59E0B" />
                </View>
                <Text className="mb-2 font-subtitle text-xl text-gray-900">
                  Verification in Progress
                </Text>
                <Text className="mb-8 text-center font-body text-sm text-gray-500">
                  Your identity verification is being processed. This usually takes a few minutes.
                </Text>
                <View className="w-full gap-y-3">
                  <Button title="Check Status" onPress={onCloseKycSheet} />
                  <Button
                    title="Use Crypto Instead"
                    variant="white"
                    onPress={() => router.replace('/withdraw/crypto' as never)}
                  />
                </View>
              </>
            ) : (
              <>
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
                  <Button
                    title={hasStartedKyc ? 'Continue Verification' : 'Start Verification'}
                    onPress={handleVerificationPress}
                  />
                  <Button
                    title="Use Crypto Instead"
                    variant="white"
                    onPress={() => router.replace('/withdraw/crypto' as never)}
                  />
                </View>
              </>
            )}
          </View>
        </SafeAreaView>

        <KYCVerificationSheet
          visible={showKycSheet}
          onClose={onCloseKycSheet}
          kycStatus={kycStatus}
        />
      </>
    </ErrorBoundary>
  );
}

export function AuthorizeScreen({
  authorizeTitle,
  authError,
  authPasscode,
  isAuthorizing,
  isSubmitting,
  authorizingTitle,
  onClose,
  onPasscodeAuthorize,
  onPasskeyPress,
  onValueChange,
  showPasskey,
  submittingTitle,
  summaryAmount,
  pinAttemptsRemaining,
  isLockedOut,
  lockoutSecondsRemaining,
}: AuthorizeScreenProps) {
  const subtitle =
    summaryAmount !== undefined
      ? `Enter your 4-digit PIN to approve $${formatCurrency(summaryAmount)} withdrawal.`
      : 'Enter your 4-digit PIN to approve this withdrawal.';

  const statusLabel = isSubmitting ? submittingTitle : authorizingTitle || 'Authorizing...';

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="white" />

        <View className="px-4 pt-2">
          <TouchableOpacity
            className="size-11 items-center justify-center rounded-full bg-gray-100"
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <ArrowLeft size={20} color="#111111" />
          </TouchableOpacity>
        </View>

        <View className="px-4 pt-2">
          {(isAuthorizing || isSubmitting) && (
            <View className="mt-2 flex-row items-center gap-2">
              <ActivityIndicator size="small" color="#111111" />
              <Text className="font-body text-sm text-text-secondary">{statusLabel}</Text>
            </View>
          )}

          {isLockedOut && lockoutSecondsRemaining !== undefined && (
            <View className="mt-3 rounded-xl bg-red-50 px-4 py-3">
              <Text className="font-subtitle text-sm text-red-600">
                Too many failed attempts. Try again in {lockoutSecondsRemaining}s.
              </Text>
            </View>
          )}

          {!isLockedOut && pinAttemptsRemaining !== undefined && pinAttemptsRemaining <= 3 && (
            <View className="mt-3 rounded-xl bg-amber-50 px-4 py-3">
              <Text className="font-body text-sm text-amber-700">
                {pinAttemptsRemaining} attempt{pinAttemptsRemaining !== 1 ? 's' : ''} remaining
                before lockout.
              </Text>
            </View>
          )}
        </View>

        <PasscodeInput
          title={authorizeTitle}
          subtitle={subtitle}
          length={4}
          value={authPasscode}
          onValueChange={onValueChange}
          onComplete={isLockedOut ? undefined : onPasscodeAuthorize}
          errorText={authError}
          showPasskey={showPasskey}
          onPasskey={isLockedOut ? undefined : onPasskeyPress}
          autoSubmit
          variant="light"
          className="mt-4 flex-1"
        />
      </SafeAreaView>
    </ErrorBoundary>
  );
}

export function WithdrawDetailsSheet({
  destinationError,
  destinationInput,
  didTryDestination,
  fundingError,
  isAssetTradeMethod,
  isFiatMethod,
  isCryptoMethod,
  isFundFlow,
  isFundingActionLoading,
  isMobileWalletFundingFlow,
  methodCopy,
  numericAmount,
  onClose,
  onDestinationChange,
  destinationChain = 'SOL-DEVNET',
  onChainChange,
  onSubmit,
  visible,
  fiatAccountHolderName,
  onFiatAccountHolderNameChange,
  fiatAccountNumber,
  onFiatAccountNumberChange,
  fiatAccountNumberError,
  didTryFiatAccount,
  category,
  onCategoryChange,
  narration,
  onNarrationChange,
  feeAmount,
  totalAmount,
}: WithdrawDetailsSheetProps) {
  const { fromLabel, toLabel } = resolveFromTo({
    isAssetTradeMethod,
    isFiatMethod,
    isCryptoMethod: Boolean(isCryptoMethod),
    isFundFlow,
    isMobileWalletFundingFlow,
    destinationInput,
    fiatAccountHolderName,
    fiatAccountNumber,
  });

  return (
    <BottomSheet visible={visible} onClose={onClose} showCloseButton dismissible>
      <View className="pb-1">
        <Text className="pr-10 font-subtitle text-[22px] text-text-primary">
          {methodCopy.detailTitle}
        </Text>
        <Text className="mt-2 font-body text-[14px] text-text-secondary">
          {methodCopy.detailHint}
        </Text>

        {/* Chain picker — only for crypto withdrawal */}
        {isCryptoMethod && !isMobileWalletFundingFlow && onChainChange && (
          <View className="mt-5">
            <Text className="mb-2 font-body text-[13px] text-text-secondary">Network</Text>
            <View className="flex-row gap-2">
              {SUPPORTED_CHAINS.map((c) => (
                <ChainPill
                  key={c.chain}
                  chain={c}
                  selected={destinationChain === c.chain}
                  onPress={() => onChainChange(c.chain)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Fiat: holder name → account number → routing number */}
        {isFiatMethod && onFiatAccountHolderNameChange && onFiatAccountNumberChange ? (
          <View className="mt-5 gap-4">
            <Input
              label="Account holder name"
              value={fiatAccountHolderName ?? ''}
              onChangeText={onFiatAccountHolderNameChange}
              placeholder="Full name on bank account"
              autoCapitalize="words"
              autoCorrect={false}
              className="h-14 rounded-xl"
            />
            <Input
              label="Account number"
              value={fiatAccountNumber ?? ''}
              onChangeText={onFiatAccountNumberChange}
              placeholder="4–17 digit account number"
              keyboardType="number-pad"
              autoCorrect={false}
              className="h-14 rounded-xl"
              error={didTryFiatAccount ? fiatAccountNumberError : undefined}
            />
            <Input
              label={methodCopy.detailLabel}
              value={destinationInput}
              onChangeText={onDestinationChange}
              placeholder={methodCopy.detailPlaceholder}
              keyboardType="number-pad"
              autoCorrect={false}
              className="h-14 rounded-xl"
              error={
                didTryDestination || destinationInput.length > 0 ? destinationError : undefined
              }
            />
          </View>
        ) : !isMobileWalletFundingFlow ? (
          <View className="mt-5">
            <Input
              label={methodCopy.detailLabel}
              value={destinationInput}
              onChangeText={onDestinationChange}
              placeholder={methodCopy.detailPlaceholder}
              autoCapitalize={isAssetTradeMethod ? 'characters' : 'none'}
              autoCorrect={false}
              keyboardType="default"
              className="h-14 rounded-xl"
              error={
                didTryDestination || destinationInput.length > 0 ? destinationError : undefined
              }
            />
          </View>
        ) : null}

        <View className="mt-5 gap-4">
          <View>
            <Text className="mb-2 font-body text-[13px] text-text-secondary">Category</Text>
            <View className="flex-row flex-wrap gap-2">
              {WITHDRAWAL_CATEGORIES.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => onCategoryChange(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${item} category`}
                  className={cn(
                    'rounded-full border px-3 py-2',
                    category === item ? 'border-black bg-black' : 'border-gray-200 bg-white'
                  )}>
                  <Text
                    className={cn(
                      'font-body text-[13px]',
                      category === item ? 'text-white' : 'text-text-primary'
                    )}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Input
            label="Narration"
            value={narration}
            onChangeText={onNarrationChange}
            placeholder="Add a note (optional)"
            multiline
            numberOfLines={3}
            className="rounded-xl"
          />
        </View>

        <View className="mt-5 rounded-2xl bg-surface px-4 py-3">
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
          <View className="mt-2 flex-row items-center justify-between">
            <Text className="font-body text-[13px] text-text-secondary">Fees</Text>
            <Text
              className="font-subtitle text-[15px] text-text-primary"
              style={{ fontVariant: ['tabular-nums'] }}>
              ${formatCurrency(feeAmount)}
            </Text>
          </View>
          <View className="mt-2 flex-row items-center justify-between">
            <Text className="font-body text-[13px] text-text-secondary">Total cost</Text>
            <Text
              className="font-subtitle text-[15px] text-text-primary"
              style={{ fontVariant: ['tabular-nums'] }}>
              ${formatCurrency(totalAmount)}
            </Text>
          </View>
          {isMobileWalletFundingFlow && (
            <>
              <View className="mt-2 flex-row items-center justify-between">
                <Text className="font-body text-[13px] text-text-secondary">Network</Text>
                <Text className="font-subtitle text-[15px] text-text-primary">Solana Devnet</Text>
              </View>
              <View className="mt-2 flex-row items-center justify-between">
                <Text className="font-body text-[13px] text-text-secondary">Asset</Text>
                <Text className="font-subtitle text-[15px] text-text-primary">USDC</Text>
              </View>
            </>
          )}
          {isCryptoMethod && !isMobileWalletFundingFlow && (
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="font-body text-[13px] text-text-secondary">Network</Text>
              <Text className="font-subtitle text-[15px] text-text-primary">
                {SUPPORTED_CHAINS.find((c) => c.chain === destinationChain)?.label ??
                  destinationChain}
              </Text>
            </View>
          )}
          <View className="mt-2 flex-row items-center justify-between">
            <Text className="font-body text-[13px] text-text-secondary">From</Text>
            <Text className="font-subtitle text-[15px] text-text-primary">{fromLabel}</Text>
          </View>
          <View className="mt-2 flex-row items-center justify-between">
            <Text className="font-body text-[13px] text-text-secondary">To</Text>
            <Text
              className="ml-6 flex-1 text-right font-subtitle text-[15px] text-text-primary"
              numberOfLines={1}>
              {toLabel}
            </Text>
          </View>
          <View className="mt-2 flex-row items-center justify-between">
            <Text className="font-body text-[13px] text-text-secondary">Method</Text>
            <Text className="font-subtitle text-[15px] text-text-primary">{methodCopy.title}</Text>
          </View>
        </View>

        {fundingError ? (
          <Text className="mt-3 font-body text-[13px] text-red-600">{fundingError}</Text>
        ) : null}

        <Button
          title={isMobileWalletFundingFlow ? 'Open wallet' : 'Continue'}
          className="mt-5"
          onPress={onSubmit}
          disabled={isFundingActionLoading}
          loading={isFundingActionLoading}
        />
      </View>
    </BottomSheet>
  );
}

export function WithdrawConfirmSheet({
  visible,
  onClose,
  onConfirm,
  numericAmount,
  isFiatMethod,
  isCryptoMethod,
  isP2PMethod,
  isFundFlow,
  methodTitle,
  fiatAccountHolderName,
  fiatAccountNumber,
  fiatRoutingNumber,
  destinationAddress,
  destinationChain,
  recipientName,
  recipientIdentifier,
  note,
  category,
  narration,
  feeAmount = 0,
  totalAmount,
}: WithdrawConfirmSheetProps) {
  const chainLabel = destinationChain
    ? (SUPPORTED_CHAINS.find((c) => c.chain === destinationChain)?.label ?? destinationChain)
    : undefined;

  const maskedAccount = maskAccountNumber(fiatAccountNumber);

  const maskedRouting = fiatRoutingNumber ? `••••${fiatRoutingNumber.slice(-4)}` : undefined;

  const resolvedTotal = totalAmount ?? numericAmount + feeAmount;

  const { fromLabel, toLabel } = resolveFromTo({
    isAssetTradeMethod: false,
    isFiatMethod,
    isCryptoMethod,
    isFundFlow,
    isMobileWalletFundingFlow: false,
    destinationInput: destinationAddress || '',
    fiatAccountHolderName,
    fiatAccountNumber,
  });

  return (
    <BottomSheet visible={visible} onClose={onClose} showCloseButton dismissible>
      <View className="pb-2">
        {/* Header */}
        <Text className="text-center font-subtitle text-[22px] text-text-primary">
          Confirm Transaction
        </Text>
        <Text className="mt-1 text-center font-body text-[13px] text-text-secondary">
          {isCryptoMethod
            ? 'Review all details carefully. Crypto withdrawals cannot be reversed.'
            : isP2PMethod
              ? 'Review the recipient and amount before sending.'
              : 'Review your bank details and amount before continuing.'}
        </Text>

        {/* Big amount */}
        <View className="mt-6 items-center">
          <Text className="font-subtitle text-[52px] leading-[56px] text-text-primary">
            <Text style={{ fontVariant: ['tabular-nums'] }}>${formatCurrency(numericAmount)}</Text>
          </Text>
          <View className="mt-1 flex-row items-center gap-1">
            <Building2 size={13} color="#9CA3AF" />
            <Text className="font-body text-[13px] text-text-secondary">{methodTitle}</Text>
          </View>
        </View>

        {/* Details card */}
        <View className="mt-6 overflow-hidden rounded-2xl bg-surface">
          {/* Fiat */}
          {isFiatMethod && (
            <>
              <View className="flex-row items-center justify-between px-4 py-3.5">
                <Text className="font-body text-[14px] text-text-secondary">Account holder</Text>
                <Text className="font-subtitle text-[14px] text-text-primary">
                  {fiatAccountHolderName || '—'}
                </Text>
              </View>
              <View className="mx-4 h-px bg-gray-100" />
              <View className="flex-row items-center justify-between px-4 py-3.5">
                <Text className="font-body text-[14px] text-text-secondary">Account number</Text>
                <Text className="font-subtitle text-[14px] text-text-primary">
                  {maskedAccount || '—'}
                </Text>
              </View>
              <View className="mx-4 h-px bg-gray-100" />
              <View className="flex-row items-center justify-between px-4 py-3.5">
                <Text className="font-body text-[14px] text-text-secondary">Routing number</Text>
                <Text className="font-subtitle text-[14px] text-text-primary">
                  {maskedRouting || '—'}
                </Text>
              </View>
            </>
          )}

          {/* Crypto */}
          {isCryptoMethod && (
            <>
              <View className="px-4 py-3.5">
                <Text className="mb-1 font-body text-[13px] text-text-secondary">
                  Recipient address
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text
                    className="flex-1 font-subtitle text-[13px] text-text-primary"
                    numberOfLines={1}
                    ellipsizeMode="middle">
                    {destinationAddress || '—'}
                  </Text>
                  {destinationAddress ? (
                    <Pressable
                      onPress={() => Clipboard.setString(destinationAddress)}
                      hitSlop={8}
                      className="ml-3">
                      <Copy size={15} color="#9CA3AF" />
                    </Pressable>
                  ) : null}
                </View>
              </View>
              {chainLabel && (
                <>
                  <View className="mx-4 h-px bg-gray-100" />
                  <View className="flex-row items-center justify-between px-4 py-3.5">
                    <View className="flex-row items-center gap-2">
                      <Globe size={15} color="#6B7280" />
                      <Text className="font-body text-[14px] text-text-secondary">Network</Text>
                    </View>
                    <Text className="font-subtitle text-[14px] text-text-primary">
                      {chainLabel}
                    </Text>
                  </View>
                </>
              )}
            </>
          )}

          {/* P2P */}
          {isP2PMethod && (
            <>
              <View className="flex-row items-center justify-between px-4 py-3.5">
                <View className="flex-row items-center gap-2">
                  <User size={15} color="#6B7280" />
                  <Text className="font-body text-[14px] text-text-secondary">Recipient</Text>
                </View>
                <View className="items-end">
                  <Text className="font-subtitle text-[14px] text-text-primary">
                    {recipientName || recipientIdentifier || '—'}
                  </Text>
                  {recipientIdentifier && recipientName && (
                    <Text className="font-body text-[12px] text-text-secondary">
                      {recipientIdentifier}
                    </Text>
                  )}
                </View>
              </View>
              {note ? (
                <>
                  <View className="mx-4 h-px bg-gray-100" />
                  <View className="flex-row items-center justify-between px-4 py-3.5">
                    <Text className="font-body text-[14px] text-text-secondary">Note</Text>
                    <Text
                      className="ml-8 flex-1 text-right font-body text-[14px] text-text-primary"
                      numberOfLines={2}>
                      {note}
                    </Text>
                  </View>
                </>
              ) : null}
            </>
          )}

          {!isP2PMethod && (
            <>
              <View className="mx-4 h-px bg-gray-100" />
              <View className="flex-row items-center justify-between px-4 py-3.5">
                <Text className="font-body text-[14px] text-text-secondary">From</Text>
                <Text className="font-subtitle text-[14px] text-text-primary">{fromLabel}</Text>
              </View>
              <View className="mx-4 h-px bg-gray-100" />
              <View className="flex-row items-center justify-between px-4 py-3.5">
                <Text className="font-body text-[14px] text-text-secondary">To</Text>
                <Text
                  className="ml-8 flex-1 text-right font-subtitle text-[14px] text-text-primary"
                  numberOfLines={1}>
                  {toLabel}
                </Text>
              </View>
              <View className="mx-4 h-px bg-gray-100" />
              <View className="flex-row items-center justify-between px-4 py-3.5">
                <View className="flex-row items-center gap-2">
                  <Fuel size={15} color="#6B7280" />
                  <Text className="font-body text-[14px] text-text-secondary">Fees</Text>
                </View>
                <Text className="font-subtitle text-[14px] text-text-primary">
                  ${formatCurrency(feeAmount)}
                </Text>
              </View>
              <View className="mx-4 h-px bg-gray-100" />
              <View className="flex-row items-center justify-between px-4 py-3.5">
                <View className="flex-row items-center gap-2">
                  <Building2 size={15} color="#6B7280" />
                  <Text className="font-body text-[14px] text-text-secondary">Total cost</Text>
                </View>
                <Text className="font-subtitle text-[14px] text-text-primary">
                  ${formatCurrency(resolvedTotal)}
                </Text>
              </View>
              <View className="mx-4 h-px bg-gray-100" />
              <View className="flex-row items-center justify-between px-4 py-3.5">
                <Text className="font-body text-[14px] text-text-secondary">Category</Text>
                <Text className="font-subtitle text-[14px] text-text-primary">
                  {category || 'Transfer'}
                </Text>
              </View>
              <View className="mx-4 h-px bg-gray-100" />
              <View className="flex-row items-center justify-between px-4 py-3.5">
                <Text className="font-body text-[14px] text-text-secondary">Narration</Text>
                <Text
                  className="ml-8 flex-1 text-right font-body text-[14px] text-text-primary"
                  numberOfLines={2}>
                  {narration?.trim() || '—'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Actions */}
        <View className="mt-6 flex-row gap-3">
          <Button title="Cancel" variant="white" onPress={onClose} flex />
          <Button title="Continue" onPress={onConfirm} flex />
        </View>
      </View>
    </BottomSheet>
  );
}

export function WithdrawSubmissionSheet({
  fundingSignature,
  isAssetTradeMethod,
  isFundFlow,
  isFundingCompleteState,
  isFundingPendingState,
  isFundingWaitingState,
  onClose,
  visible,
}: WithdrawSubmissionSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} showCloseButton={false} dismissible>
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
          onPress={onClose}
        />
      </View>
    </BottomSheet>
  );
}
