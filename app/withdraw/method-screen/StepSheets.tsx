import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Button, Input } from '@/components/ui';
import { SolanaIcon, MaticIcon, UsdcIcon } from '@/assets/svg';
import AvalancheIcon from '@/assets/svg/avalanche.svg';
import { SUPPORTED_CHAINS } from '@/utils/chains';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Clock01Icon,
  CreditCardIcon,
  InformationCircleIcon,
  InternetIcon,
  MoneyReceiveSquareIcon,
  ShieldEnergyIcon,
  UserIcon,
  Wallet01Icon,
} from '@hugeicons/core-free-icons';
import { useHaptics } from '@/hooks/useHaptics';
import { formatCurrency } from './utils';
import type { MethodCopy } from './types';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const MAX_SNAP = Math.round(SCREEN_HEIGHT * 0.85);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CeloIconImg = require('@/assets/svg/celo.webp') as ImageSourcePropType;
const BaseIconImg = require('@/assets/svg/base.jpeg') as ImageSourcePropType;

const CHAIN_ICONS: Record<string, React.ComponentType<any> | ImageSourcePropType> = {
  SOL: SolanaIcon,
  MATIC: MaticIcon,
  CELO: CeloIconImg,
  BASE: BaseIconImg,
  AVAX: AvalancheIcon,
};

// ── Step 2: Destination Sheet ─────────────────────────────────────────────

export type DestinationSheetProps = {
  visible: boolean;
  onClose: () => void;
  onContinue: () => void;
  methodCopy: MethodCopy;
  isFiatMethod: boolean;
  isCryptoMethod: boolean;
  destinationInput: string;
  onDestinationChange: (value: string) => void;
  destinationError?: string;
  didTryDestination: boolean;
  destinationChain: string;
  onChainChange: (chain: string) => void;
  fiatAccountHolderName: string;
  onFiatAccountHolderNameChange: (value: string) => void;
  fiatAccountNumber: string;
  onFiatAccountNumberChange: (value: string) => void;
  fiatAccountNumberError?: string;
  didTryFiatAccount: boolean;
  numericAmount: number;
};

export function DestinationSheet({
  visible,
  onClose,
  onContinue,
  methodCopy,
  isFiatMethod,
  isCryptoMethod,
  destinationInput,
  onDestinationChange,
  destinationError,
  didTryDestination,
  destinationChain,
  onChainChange,
  fiatAccountHolderName,
  onFiatAccountHolderNameChange,
  fiatAccountNumber,
  onFiatAccountNumberChange,
  fiatAccountNumberError,
  didTryFiatAccount,
  numericAmount,
}: DestinationSheetProps) {
  const insets = useSafeAreaInsets();
  const { selection } = useHaptics();
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['70%', MAX_SNAP], []);

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const canContinue = useMemo(() => {
    if (isFiatMethod) {
      return (
        fiatAccountHolderName.trim().length >= 2 &&
        fiatAccountNumber.length >= 4 &&
        !fiatAccountNumberError &&
        destinationInput.length >= 9
      );
    }
    return destinationInput.length > 0 && !destinationError;
  }, [
    isFiatMethod,
    fiatAccountHolderName,
    fiatAccountNumber,
    fiatAccountNumberError,
    destinationInput,
    destinationError,
  ]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.indicator}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize">
      <BottomSheetScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="mb-5">
          <Text className="font-subtitle text-[24px] text-text-primary">
            Where to send <Text style={{ color: '#FF2E01' }}>${formatCurrency(numericAmount)}</Text>
          </Text>
          <Text className="mt-2 font-body text-[14px] text-text-secondary">
            {methodCopy.detailHint}
          </Text>
        </View>

        {isCryptoMethod && (
          <View className="mb-5">
            <Text className="mb-3 font-body text-[13px] text-text-secondary">Select network</Text>
            <View className="flex-row gap-2">
              {SUPPORTED_CHAINS.map((chain) => (
                <ChainPill
                  key={chain.chain}
                  chain={chain}
                  selected={destinationChain === chain.chain}
                  onPress={() => {
                    selection();
                    onChainChange(chain.chain);
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {isFiatMethod && (
          <View className="gap-4">
            <Input
              label="Account holder name"
              value={fiatAccountHolderName}
              onChangeText={onFiatAccountHolderNameChange}
              placeholder="Full name on bank account"
              autoCapitalize="words"
              autoCorrect={false}
              className="h-14 rounded-xl"
            />
            <Input
              label="Account number"
              value={fiatAccountNumber}
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
        )}

        {!isFiatMethod && (
          <Input
            label={methodCopy.detailLabel}
            value={destinationInput}
            onChangeText={onDestinationChange}
            placeholder={methodCopy.detailPlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
            className="h-14 rounded-xl"
            error={didTryDestination || destinationInput.length > 0 ? destinationError : undefined}
          />
        )}

        <Button title="Continue" className="mt-6" onPress={onContinue} disabled={!canContinue} />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

// ── Chain Pill Component ──────────────────────────────────────────────────

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
  const isImageIcon = chain.chain === 'CELO' || chain.chain === 'BASE';

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
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 20, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      }}
      className="flex-1 items-center rounded-2xl px-2 py-3"
      accessibilityRole="button"
      accessibilityLabel={`Select ${chain.label}`}>
      <View className="relative mb-2 size-10 items-center justify-center">
        <View
          className="size-10 items-center justify-center rounded-full"
          style={{ backgroundColor: chain.color + '22' }}>
          {isImageIcon ? (
            <Image
              source={iconValue as ImageSourcePropType}
              style={{ width: 22, height: 22, borderRadius: 11 }}
            />
          ) : // @ts-ignore - SVG components
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

// ── Step 3: Details Sheet ──────────────────────────────────────────────────

export type DetailsSheetProps = {
  visible: boolean;
  onClose: () => void;
  onContinue: () => void;
  numericAmount: number;
  feeAmount: number;
  totalAmount: number;
  category: string;
  onCategoryChange: (value: string) => void;
  narration: string;
  onNarrationChange: (value: string) => void;
  methodCopy: MethodCopy;
  isCryptoMethod: boolean;
  destinationChain: string;
  destinationInput: string;
  fiatAccountHolderName?: string;
  fiatAccountNumber?: string;
};

const WITHDRAWAL_CATEGORIES = [
  { label: 'Transfer', color: '#3B82F6' },
  { label: 'Bills', color: '#EF4444' },
  { label: 'Food', color: '#F97316' },
  { label: 'Shopping', color: '#8B5CF6' },
  { label: 'Travel', color: '#06B6D4' },
  { label: 'Savings', color: '#10B981' },
  { label: 'Crypto', color: '#6366F1' },
  { label: 'Other', color: '#6B7280' },
] as const;

export function DetailsSheet({
  visible,
  onClose,
  onContinue,
  numericAmount,
  feeAmount,
  totalAmount,
  category,
  onCategoryChange,
  narration,
  onNarrationChange,
  methodCopy,
  isCryptoMethod,
  destinationChain,
  destinationInput,
  fiatAccountHolderName,
  fiatAccountNumber,
}: DetailsSheetProps) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['75%', MAX_SNAP], []);

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const maskAddress = (addr: string) => {
    if (!addr || addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  const maskAccount = (acc?: string) => {
    if (!acc) return '';
    return `••••${acc.slice(-4)}`;
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.indicator}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize">
      <BottomSheetScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="mb-5">
          <Text className="font-subtitle text-[24px] text-text-primary">Add details</Text>
          <Text className="mt-2 font-body text-[14px] text-text-secondary">
            Categorize and add a note for your records
          </Text>
        </View>

        <View className="mb-5">
          <Text className="mb-3 font-body text-[13px] text-text-secondary">Category</Text>
          <View className="flex-row flex-wrap gap-2">
            {WITHDRAWAL_CATEGORIES.map((cat) => {
              const isSelected = category === cat.label;
              return (
                <Pressable
                  key={cat.label}
                  onPress={() => onCategoryChange(cat.label)}
                  className="flex-row items-center rounded-full px-4 py-2"
                  style={{
                    backgroundColor: isSelected ? cat.color + '18' : '#F3F4F6',
                    borderWidth: isSelected ? 1.5 : 0,
                    borderColor: cat.color,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${cat.label}`}>
                  <View
                    className="mr-2 size-6 items-center justify-center rounded-full"
                    style={{ backgroundColor: cat.color + '22' }}>
                    <Text style={{ fontSize: 12, color: cat.color }}>{cat.label[0]}</Text>
                  </View>
                  <Text
                    className="font-body text-[14px]"
                    style={{ color: isSelected ? cat.color : '#374151' }}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mb-5">
          <Text className="mb-3 font-body text-[13px] text-text-secondary">Note (optional)</Text>
          <BottomSheetTextInput
            style={{
              backgroundColor: '#F9FAFB',
              borderRadius: 12,
              padding: 16,
              fontFamily: 'InstrumentSans-Regular',
              fontSize: 15,
              color: '#111',
              minHeight: 80,
              textAlignVertical: 'top',
            }}
            placeholder="What's this for?"
            placeholderTextColor="#9CA3AF"
            value={narration}
            onChangeText={onNarrationChange}
            maxLength={255}
            multiline
          />
        </View>

        <View className="rounded-2xl bg-surface px-4 py-4">
          <Text className="mb-3 font-subtitle text-[15px] text-text-primary">Summary</Text>

          <View className="flex-row items-center justify-between py-2">
            <Text className="font-body text-[14px] text-text-secondary">Amount</Text>
            <Text className="font-subtitle text-[14px] text-text-primary">
              ${formatCurrency(numericAmount)}
            </Text>
          </View>

          {feeAmount > 0 && (
            <View className="flex-row items-center justify-between py-2">
              <Text className="font-body text-[14px] text-text-secondary">Fee</Text>
              <Text className="font-subtitle text-[14px] text-text-primary">
                ${formatCurrency(feeAmount)}
              </Text>
            </View>
          )}

          <View className="flex-row items-center justify-between py-2">
            <Text className="font-body text-[14px] text-text-secondary">Total</Text>
            <Text className="font-subtitle text-[14px] text-text-primary">
              ${formatCurrency(totalAmount)}
            </Text>
          </View>

          <View className="my-2 h-px bg-gray-100" />

          {isCryptoMethod && (
            <View className="flex-row items-center justify-between py-2">
              <Text className="font-body text-[14px] text-text-secondary">Network</Text>
              <Text className="font-subtitle text-[14px] text-text-primary">
                {SUPPORTED_CHAINS.find((c) => c.chain === destinationChain)?.label ??
                  destinationChain}
              </Text>
            </View>
          )}

          <View className="flex-row items-center justify-between py-2">
            <Text className="font-body text-[14px] text-text-secondary">To</Text>
            <Text className="font-subtitle text-[14px] text-text-primary" numberOfLines={1}>
              {isCryptoMethod
                ? maskAddress(destinationInput)
                : fiatAccountHolderName
                  ? `${fiatAccountHolderName} ${maskAccount(fiatAccountNumber)}`
                  : 'Bank account'}
            </Text>
          </View>

          <View className="flex-row items-center justify-between py-2">
            <Text className="font-body text-[14px] text-text-secondary">Method</Text>
            <Text className="font-subtitle text-[14px] text-text-primary">{methodCopy.title}</Text>
          </View>
        </View>

        <Button title="Review & Confirm" className="mt-6" onPress={onContinue} />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

// ── Step 4: Confirm Sheet ──────────────────────────────────────────────────

export type ConfirmSheetProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  numericAmount: number;
  feeAmount: number;
  totalAmount: number;
  methodTitle: string;
  isCryptoMethod: boolean;
  isFiatMethod: boolean;
  destinationChain: string;
  destinationInput: string;
  fiatAccountHolderName?: string;
  fiatAccountNumber?: string;
  asset?: string;
  availableBalance?: number;
  withdrawalLimit?: number;
  category: string;
  narration: string;
};

const ASSET_ICONS: Record<string, React.ComponentType<any>> = {
  USD: require('@/assets/svg/usd.svg').default,
  EUR: require('@/assets/svg/eur.svg').default,
  NGN: require('@/assets/svg/ngn.svg').default,
  USDC: require('@/assets/svg/usdc.svg').default,
  USDT: require('@/assets/svg/usdt.svg').default,
  EURC: require('@/assets/svg/eurc.svg').default,
  PYUSD: require('@/assets/svg/pyusd.svg').default,
};

export function ConfirmSheet({
  visible,
  onClose,
  onConfirm,
  numericAmount,
  feeAmount,
  totalAmount,
  isCryptoMethod,
  isFiatMethod,
  destinationChain,
  destinationInput,
  fiatAccountHolderName,
  fiatAccountNumber,
  asset,
  availableBalance,
  withdrawalLimit,
}: ConfirmSheetProps) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['80%', MAX_SNAP], []);

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} pressBehavior="close" />
    ),
    []
  );

  const maskAddr = (a: string) => (!a || a.length <= 12 ? a : `${a.slice(0, 6)}…..${a.slice(-6)}`);
  const chainLabel = SUPPORTED_CHAINS.find((c) => c.chain === destinationChain)?.label ?? destinationChain;
  const displayAsset = asset || (isFiatMethod ? 'USD' : 'USDC');
  const AssetIcon = ASSET_ICONS[displayAsset];

  const wholePart = formatCurrency(Math.floor(numericAmount));
  const decimalPart = (numericAmount % 1).toFixed(2).slice(1);

  const DetailRow = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
    <View className="flex-row items-center justify-between px-4 py-3">
      <View className="flex-row items-center gap-2.5">
        <HugeiconsIcon icon={icon} size={18} color="#6B7280" />
        <Text className="font-body text-[14px] text-[#6B7280]">{label}</Text>
      </View>
      <Text className="max-w-[55%] text-right font-subtitle text-[14px] text-[#070914]" numberOfLines={1}>{value}</Text>
    </View>
  );

  const Divider = () => <View className="mx-4 h-px bg-[#E5E7EB]" />;

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: '#fff', borderRadius: 24 }}
      handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 36 }}
      keyboardBehavior="interactive">
      <BottomSheetScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: Math.max(insets.bottom, 20) }}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="flex-row items-center justify-between">
          <Pressable onPress={onClose} hitSlop={12} className="size-9 items-center justify-center rounded-full bg-[#F3F4F6]">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} color="#374151" />
          </Pressable>
          <Text className="font-subtitle text-[17px] text-[#070914]">Confirm Transaction</Text>
          <View className="size-9 items-center justify-center rounded-full bg-[#F3F4F6]">
            <HugeiconsIcon icon={InformationCircleIcon} size={18} color="#9CA3AF" />
          </View>
        </View>

        {/* Transfer Amount */}
        <View className="mt-6">
          <Text className="font-body text-[13px] text-[#9CA3AF]">Transfer Amount</Text>
          <View className="mt-2 flex-row items-end justify-between">
            <Text style={{ fontVariant: ['tabular-nums'] }}>
              <Text className="font-subtitle text-[40px] leading-[44px] text-[#070914]">{wholePart}</Text>
              <Text className="font-subtitle text-[24px] text-[#9CA3AF]">{decimalPart}</Text>
            </Text>
            <View className="flex-row items-center gap-1.5 rounded-full bg-[#F3F4F6] px-3 py-1.5">
              {AssetIcon && <AssetIcon width={20} height={20} />}
              <Text className="font-subtitle text-[13px] text-[#070914]">{displayAsset}</Text>
            </View>
          </View>
          {availableBalance !== null && availableBalance !== undefined && (
            <Text className="mt-1 font-body text-[13px] text-[#9CA3AF]">
              Balance: <Text className="font-subtitle text-[#070914]">{formatCurrency(availableBalance)} USDC</Text>
            </Text>
          )}
        </View>

        {/* Details Section */}
        <View className="mt-6">
          <Text className="mb-2 font-body text-[13px] text-[#9CA3AF]">Details</Text>
          <View className="rounded-2xl bg-[#F9FAFB]">
            {isCryptoMethod && (
              <>
                <DetailRow icon={UserIcon} label="Address" value={maskAddr(destinationInput)} />
                <Divider />
                <DetailRow icon={InternetIcon} label="Network" value={chainLabel} />
                <Divider />
                <DetailRow icon={Wallet01Icon} label="Source" value="Spend Wallet" />
              </>
            )}
            {isFiatMethod && (
              <>
                <DetailRow icon={UserIcon} label="Account Holder" value={fiatAccountHolderName || '—'} />
                <Divider />
                <DetailRow icon={CreditCardIcon} label="Account" value={fiatAccountNumber ? `••••${fiatAccountNumber.slice(-4)}` : '—'} />
                <Divider />
                <DetailRow icon={ArrowRight01Icon} label="Routing" value={maskAddr(destinationInput) || '—'} />
                <Divider />
                <DetailRow icon={Wallet01Icon} label="Source" value="Spend Wallet" />
              </>
            )}
          </View>
        </View>

        {/* Note Section */}
        <View className="mt-5">
          <Text className="mb-2 font-body text-[13px] text-[#9CA3AF]">Note</Text>
          <View className="rounded-2xl bg-[#F9FAFB]">
            {withdrawalLimit !== null && withdrawalLimit !== undefined && withdrawalLimit > 0 && (
              <>
                <DetailRow icon={Clock01Icon} label="Daily Limit" value={`${formatCurrency(totalAmount)} of ${formatCurrency(withdrawalLimit)} USDC`} />
                <Divider />
              </>
            )}
            <DetailRow icon={MoneyReceiveSquareIcon} label="Fee" value={`$${formatCurrency(feeAmount)}`} />
            <Divider />
            <View className="flex-row items-center justify-between px-4 py-3">
              <View className="flex-row items-center gap-2.5">
                <HugeiconsIcon icon={ShieldEnergyIcon} size={18} color="#070914" />
                <Text className="font-subtitle text-[14px] text-[#070914]">Total</Text>
              </View>
              <Text className="font-subtitle text-[16px] text-[#FF2E01]">${formatCurrency(totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View className="mt-6 flex-row gap-3">
          <View className="flex-1">
            <Button title="Cancel" variant="ghost" onPress={onClose} />
          </View>
          <View className="flex-1">
            <Button title="Confirm" variant="black" onPress={onConfirm} />
          </View>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  indicator: {
    backgroundColor: '#D1D5DB',
    width: 36,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
