import React, { useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Clipboard,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Pressable,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';
import { GorhomBottomSheet, KYCVerificationSheet } from '@/components/sheets';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Button, Input } from '@/components/ui';
import { SolanaIcon, MaticIcon, UsdcIcon, BnbIcon, StarknetIcon } from '@/assets/svg';
import AvalancheIcon from '@/assets/svg/avalanche.svg';
import { SUPPORTED_CHAINS } from '@/utils/chains';
import { useHaptics } from '@/hooks/useHaptics';
import { useKycStore } from '@/stores/kycStore';
import { isKycInReview } from '@/api/types/kyc';
import { formatCurrency, formatSortCode } from './utils';
import type { FiatCurrency, MethodCopy } from './types';
import { cn } from '@/utils/cn';
import { useWithdrawalLimits } from '@/api/hooks';
import { WITHDRAWAL_LIMITS } from '@/lib/constants';
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  Building04Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  CreditCardIcon,
  FuelIcon,
  GiftIcon,
  InformationCircleIcon,
  InternetIcon,
  MoneyReceiveSquareIcon,
  MoreIcon,
  Coffee01Icon,
  ShieldEnergyIcon,
  ShoppingBag01Icon,
  Airplane01Icon,
  UserIcon,
  UserMultiple02Icon,
  Wallet01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

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
  fiatCurrency?: FiatCurrency;
  onFiatCurrencyChange?: (value: FiatCurrency) => void;
  fiatAccountHolderName?: string;
  onFiatAccountHolderNameChange?: (value: string) => void;
  fiatAccountNumber?: string;
  onFiatAccountNumberChange?: (value: string) => void;
  fiatAccountNumberError?: string;
  didTryFiatAccount?: boolean;
  fiatBic?: string;
  onFiatBicChange?: (value: string) => void;
  fiatBicError?: string;
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

const BaseIconImg = require('@/assets/svg/base.jpeg') as ImageSourcePropType;

const CHAIN_ICONS: Record<string, React.ComponentType<any> | ImageSourcePropType> = {
  SOL: SolanaIcon,
  MATIC: MaticIcon,
  BASE: BaseIconImg,
  AVAX: AvalancheIcon,
  BSC: BnbIcon,
  STARKNET: StarknetIcon,
};

const WITHDRAWAL_CATEGORIES = [
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
  const iconValue = CHAIN_ICONS[chain.chain];
  const isImageIcon = chain.chain === 'BASE';
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
          {isImageIcon ? (
            <Image
              source={iconValue as ImageSourcePropType}
              style={{ width: 22, height: 22, borderRadius: 11 }}
            />
          ) : // @ts-ignore - SVG component
          iconValue ? (
            React.createElement(iconValue as React.ComponentType<any>, { width: 22, height: 22 })
          ) : null}
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
  const { taxId, employmentStatus, investmentPurposes, disclosuresConfirmed, diditSessionToken } =
    state;

  // If user has a Didit session token, they're in the middle of ID verification
  if (diditSessionToken) {
    return '/kyc/didit-sdk';
  }

  // If user has completed disclosures and submitted, they should be going to Didit
  // But if diditSessionToken is null (failed to get or session expired), go to disclosures to resubmit
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

function CategoryPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const pickerRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();

  const selected = WITHDRAWAL_CATEGORIES.find((c) => c.label === value) ?? WITHDRAWAL_CATEGORIES[0];

  const open = useCallback(() => pickerRef.current?.present(), []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <>
      <Pressable
        onPress={open}
        className="h-14 flex-row items-center justify-between rounded-xl border border-gray-200 bg-white px-4"
        accessibilityRole="button"
        accessibilityLabel={`Category: ${value}`}>
        <View className="flex-row items-center gap-3">
          <View
            className="size-8 items-center justify-center rounded-full"
            style={{ backgroundColor: selected.color + '18' }}>
            <HugeiconsIcon icon={selected.icon} size={16} color={selected.color} />
          </View>
          <Text className="font-body text-[15px] text-text-primary">{value}</Text>
        </View>
        <HugeiconsIcon icon={ArrowDown01Icon} size={20} color="#9CA3AF" />
      </Pressable>

      <BottomSheetModal
        ref={pickerRef}
        enableDynamicSizing
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: '#FFF',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
        handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 36 }}>
        <BottomSheetView style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <Text className="px-6 pb-3 pt-1 font-subtitle text-[18px] text-text-primary">
            Select category
          </Text>
          {WITHDRAWAL_CATEGORIES.map((item) => {
            const isSelected = value === item.label;
            return (
              <Pressable
                key={item.label}
                onPress={() => {
                  onChange(item.label);
                  pickerRef.current?.dismiss();
                }}
                className="flex-row items-center gap-4 px-6 py-3.5 active:bg-gray-50"
                accessibilityRole="button"
                accessibilityLabel={`Select ${item.label}`}>
                <View
                  className="size-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: item.color + '18' }}>
                  <HugeiconsIcon icon={item.icon} size={20} color={item.color} />
                </View>
                <Text
                  className={cn(
                    'flex-1 text-[15px]',
                    isSelected ? 'font-subtitle text-text-primary' : 'font-body text-text-secondary'
                  )}>
                  {item.label}
                </Text>
                {isSelected && (
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} color="#111" />
                )}
              </Pressable>
            );
          })}
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}

const FIAT_CURRENCIES: { value: FiatCurrency; label: string; flag: string }[] = [
  { value: 'USD', label: 'USD', flag: '🇺🇸' },
  { value: 'EUR', label: 'EUR', flag: '🇪🇺' },
  { value: 'GBP', label: 'GBP', flag: '🇬🇧' },
  { value: 'NGN', label: 'NGN', flag: '🇳🇬' },
];

function FiatCurrencyPicker({
  value,
  onChange,
}: {
  value: FiatCurrency;
  onChange: (v: FiatCurrency) => void;
}) {
  const { selection } = useHaptics();
  return (
    <View className="mb-4 flex-row gap-2">
      {FIAT_CURRENCIES.map((c) => {
        const selected = value === c.value;
        return (
          <Pressable
            key={c.value}
            onPress={() => {
              selection();
              onChange(c.value);
            }}
            className={cn(
              'flex-1 flex-row items-center justify-center gap-1.5 rounded-full py-2.5',
              selected ? 'bg-gray-900' : 'bg-gray-100'
            )}
            accessibilityRole="button"
            accessibilityLabel={`Select ${c.label}`}>
            <Text className="text-[14px]">{c.flag}</Text>
            <Text
              className={cn(
                'font-subtitle text-[13px]',
                selected ? 'text-white' : 'text-gray-600'
              )}>
              {c.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function FiatKycRequiredScreen({
  kycStatus,
  showKycSheet,
  onCloseKycSheet,
}: FiatKycRequiredScreenProps) {
  const { taxId, employmentStatus, investmentPurposes, disclosuresConfirmed, diditSessionToken } =
    useKycStore();

  const hasStartedKyc =
    taxId.trim().length > 0 ||
    employmentStatus !== null ||
    investmentPurposes.length > 0 ||
    disclosuresConfirmed ||
    diditSessionToken !== null;

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
              <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#111" />
            </TouchableOpacity>
            <Text className="font-subtitle text-lg text-gray-900">Withdraw</Text>
          </View>
          <View className="flex-1 justify-center px-6">
            {isPending ? (
              <>
                <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                  <HugeiconsIcon icon={ShieldEnergyIcon} size={32} color="#F59E0B" />
                </View>
                <Text className="mb-2 font-subtitle text-xl text-gray-900">
                  Verification in Progress
                </Text>
                <Text className="mb-8 font-body text-sm text-gray-500">
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
                  <HugeiconsIcon icon={ShieldEnergyIcon} size={32} color="#F59E0B" />
                </View>
                <Text className="mb-2 font-subtitle text-xl text-gray-900">
                  One-time verification needed
                </Text>
                <Text className="mb-6 font-body text-sm leading-5 text-gray-500">
                  To send money to your bank account, we're required by financial regulations to
                  verify your identity. It takes under 5 minutes and only needs to be done once.
                </Text>
                <View className="mb-8 gap-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <Text className="font-subtitle text-[13px] text-gray-700">
                    Once verified, you can:
                  </Text>
                  <View className="flex-row items-center gap-3">
                    <HugeiconsIcon icon={Building04Icon} size={16} color="#6B7280" />
                    <Text className="font-body text-[13px] text-gray-600">
                      Withdraw to your bank account
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <HugeiconsIcon icon={CreditCardIcon} size={16} color="#6B7280" />
                    <Text className="font-body text-[13px] text-gray-600">
                      Get a Rail Debit Card
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <HugeiconsIcon icon={MoneyReceiveSquareIcon} size={16} color="#6B7280" />
                    <Text className="font-body text-[13px] text-gray-600">
                      Deposit from your bank
                    </Text>
                  </View>
                </View>
                <View className="w-full gap-y-3">
                  <Button
                    title={hasStartedKyc ? 'Continue Verification' : 'Verify Identity — 5 min'}
                    onPress={handleVerificationPress}
                  />
                  <Button
                    title="Use Crypto Instead"
                    variant="white"
                    onPress={() => router.replace('/withdraw/crypto' as never)}
                  />
                </View>
                <Text className="mt-4 text-center font-body text-[11px] text-gray-400">
                  Your data is encrypted and never sold to third parties.
                </Text>
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
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#111111" />
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
  destinationChain = 'SOL',
  onChainChange,
  onSubmit,
  visible,
  fiatAccountHolderName,
  onFiatAccountHolderNameChange,
  fiatAccountNumber,
  onFiatAccountNumberChange,
  fiatAccountNumberError,
  didTryFiatAccount,
  fiatCurrency = 'USD',
  onFiatCurrencyChange,
  fiatBic,
  onFiatBicChange,
  fiatBicError,
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
    <GorhomBottomSheet visible={visible} onClose={onClose} showCloseButton dismissible>
      <View className="pb-1">
        <Text className="pr-10 font-subtitle text-[22px] text-text-primary">
          {methodCopy.detailTitle}
        </Text>
        <Text className="mt-2 font-body text-[14px] text-text-secondary">
          {methodCopy.detailHint}
        </Text>

        {/* Fiat: currency picker → currency-specific fields */}
        {isFiatMethod && onFiatAccountHolderNameChange && onFiatAccountNumberChange ? (
          <View className="mt-5 gap-4">
            {onFiatCurrencyChange && null /* currency is now set by the home screen chain picker */}

            {fiatCurrency === 'USD' && (
              <>
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
                  label="Routing number"
                  value={destinationInput}
                  onChangeText={onDestinationChange}
                  placeholder="9-digit routing number"
                  keyboardType="number-pad"
                  autoCorrect={false}
                  className="h-14 rounded-xl"
                  error={
                    didTryDestination || destinationInput.length > 0 ? destinationError : undefined
                  }
                />
              </>
            )}

            {fiatCurrency === 'EUR' && (
              <>
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
                  label="IBAN"
                  value={destinationInput}
                  onChangeText={onDestinationChange}
                  placeholder="e.g. DE89370400440532013000"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  className="h-14 rounded-xl"
                  error={
                    didTryDestination || destinationInput.length > 0 ? destinationError : undefined
                  }
                />
                {onFiatBicChange && (
                  <Input
                    label="BIC / SWIFT (optional)"
                    value={fiatBic ?? ''}
                    onChangeText={onFiatBicChange}
                    placeholder="e.g. COBADEFFXXX"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    className="h-14 rounded-xl"
                    error={fiatBicError}
                  />
                )}
              </>
            )}

            {fiatCurrency === 'GBP' && (
              <>
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
                  label="Sort code"
                  value={formatSortCode(destinationInput)}
                  onChangeText={(v) => onDestinationChange(v.replace(/\D/g, '').slice(0, 6))}
                  placeholder="XX-XX-XX"
                  keyboardType="number-pad"
                  autoCorrect={false}
                  className="h-14 rounded-xl"
                  error={
                    didTryDestination || destinationInput.length > 0 ? destinationError : undefined
                  }
                />
                <Input
                  label="Account number"
                  value={fiatAccountNumber ?? ''}
                  onChangeText={onFiatAccountNumberChange}
                  placeholder="8-digit account number"
                  keyboardType="number-pad"
                  autoCorrect={false}
                  className="h-14 rounded-xl"
                  error={didTryFiatAccount ? fiatAccountNumberError : undefined}
                />
              </>
            )}
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
            <CategoryPicker value={category} onChange={onCategoryChange} />
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
                <Text className="font-subtitle text-[15px] text-text-primary">Solana</Text>
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
    </GorhomBottomSheet>
  );
}

function WithdrawalLimitsInfo() {
  const { data, isPlaceholderData } = useWithdrawalLimits();
  if (!data) return null;

  const remaining = Math.max(0, data.daily_limit - data.daily_used);
  const formattedRemaining = remaining >= 1000
    ? `$${(remaining / 1000).toFixed(remaining % 1000 === 0 ? 0 : 1)}k`
    : `$${formatCurrency(remaining)}`;

  return (
    <View className="mt-3 flex-row items-center gap-1.5 px-1">
      {isPlaceholderData && (
        <HugeiconsIcon icon={InformationCircleIcon} size={13} color="#9CA3AF" />
      )}
      <Text className="font-body text-[12px] text-gray-400">
        Daily limit: {formattedRemaining} remaining · Withdrawals today: {data.withdrawals_today} of{' '}
        {data.max_withdrawals_per_day}
      </Text>
    </View>
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
    <GorhomBottomSheet visible={visible} onClose={onClose} showCloseButton dismissible>
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
            <HugeiconsIcon icon={Building04Icon} size={13} color="#9CA3AF" />
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
                      <HugeiconsIcon icon={Copy01Icon} size={15} color="#9CA3AF" />
                    </Pressable>
                  ) : null}
                </View>
              </View>
              {chainLabel && (
                <>
                  <View className="mx-4 h-px bg-gray-100" />
                  <View className="flex-row items-center justify-between px-4 py-3.5">
                    <View className="flex-row items-center gap-2">
                      <HugeiconsIcon icon={InternetIcon} size={15} color="#6B7280" />
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
                  <HugeiconsIcon icon={UserIcon} size={15} color="#6B7280" />
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
                  <HugeiconsIcon icon={FuelIcon} size={15} color="#6B7280" />
                  <Text className="font-body text-[14px] text-text-secondary">Fees</Text>
                </View>
                <Text className="font-subtitle text-[14px] text-text-primary">
                  ${formatCurrency(feeAmount)}
                </Text>
              </View>
              <View className="mx-4 h-px bg-gray-100" />
              <View className="flex-row items-center justify-between px-4 py-3.5">
                <View className="flex-row items-center gap-2">
                  <HugeiconsIcon icon={Building04Icon} size={15} color="#6B7280" />
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

        {/* Withdrawal rate limits */}
        <WithdrawalLimitsInfo />

        {/* Actions */}
        <View className="mt-6 flex-row gap-3">
          <Button title="Cancel" variant="white" onPress={onClose} flex />
          <Button title="Continue" onPress={onConfirm} flex />
        </View>
      </View>
    </GorhomBottomSheet>
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
    <GorhomBottomSheet visible={visible} onClose={onClose} showCloseButton={false} dismissible>
      <View className="items-center pb-1">
        {isFundingWaitingState ? (
          <View className="size-16 items-center justify-center rounded-full bg-blue-100">
            <ActivityIndicator size="small" color="#2563EB" />
          </View>
        ) : (
          <View className="size-16 items-center justify-center rounded-full bg-green-100">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={28} color="#10B981" />
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
    </GorhomBottomSheet>
  );
}
