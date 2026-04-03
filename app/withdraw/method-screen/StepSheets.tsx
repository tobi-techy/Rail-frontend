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
              {SUPPORTED_CHAINS.slice(0, 4).map((chain) => (
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
  category: string;
  narration: string;
};

export function ConfirmSheet({
  visible,
  onClose,
  onConfirm,
  numericAmount,
  feeAmount,
  totalAmount,
  methodTitle,
  isCryptoMethod,
  isFiatMethod,
  destinationChain,
  destinationInput,
  fiatAccountHolderName,
  fiatAccountNumber,
  category,
  narration,
}: ConfirmSheetProps) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['80%', MAX_SNAP], []);

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
        <View className="items-center">
          <Text className="text-center font-subtitle text-[22px] text-text-primary">
            Confirm Withdrawal
          </Text>
          <Text className="mt-2 text-center font-body text-[13px] text-text-secondary">
            {isCryptoMethod
              ? 'Crypto withdrawals cannot be reversed. Please verify the address carefully.'
              : 'Review your withdrawal details before confirming.'}
          </Text>
        </View>

        <View className="mt-6 items-center">
          <Text className="font-subtitle text-[48px] leading-[52px] text-text-primary">
            <Text style={{ fontVariant: ['tabular-nums'] }}>${formatCurrency(numericAmount)}</Text>
          </Text>
          <Text className="mt-1 font-body text-[14px] text-text-secondary">{methodTitle}</Text>
        </View>

        <View className="mt-6 overflow-hidden rounded-2xl bg-surface">
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
                  {maskAccount(fiatAccountNumber) || '—'}
                </Text>
              </View>
              <View className="mx-4 h-px bg-gray-100" />
              <View className="flex-row items-center justify-between px-4 py-3.5">
                <Text className="font-body text-[14px] text-text-secondary">Routing</Text>
                <Text className="font-subtitle text-[14px] text-text-primary">
                  {maskAddress(destinationInput) || '—'}
                </Text>
              </View>
            </>
          )}

          {isCryptoMethod && (
            <>
              <View className="flex-row items-center justify-between px-4 py-3.5">
                <Text className="font-body text-[14px] text-text-secondary">Address</Text>
                <Text className="font-subtitle text-[14px] text-text-primary" numberOfLines={1}>
                  {maskAddress(destinationInput)}
                </Text>
              </View>
              <View className="mx-4 h-px bg-gray-100" />
              <View className="flex-row items-center justify-between px-4 py-3.5">
                <Text className="font-body text-[14px] text-text-secondary">Network</Text>
                <Text className="font-subtitle text-[14px] text-text-primary">
                  {SUPPORTED_CHAINS.find((c) => c.chain === destinationChain)?.label ??
                    destinationChain}
                </Text>
              </View>
            </>
          )}

          <View className="mx-4 h-px bg-gray-100" />
          <View className="flex-row items-center justify-between px-4 py-3.5">
            <Text className="font-body text-[14px] text-text-secondary">Category</Text>
            <Text className="font-subtitle text-[14px] text-text-primary">{category}</Text>
          </View>

          {narration && (
            <>
              <View className="mx-4 h-px bg-gray-100" />
              <View className="px-4 py-3.5">
                <Text className="font-body text-[14px] text-text-secondary">Note</Text>
                <Text className="mt-1 font-body text-[14px] text-text-primary">
                  `&quot;`{narration}`&quot;`
                </Text>
              </View>
            </>
          )}

          <View className="mx-4 h-px bg-gray-100" />
          <View className="flex-row items-center justify-between px-4 py-3.5">
            <Text className="font-body text-[14px] text-text-secondary">Amount</Text>
            <Text className="font-subtitle text-[14px] text-text-primary">
              ${formatCurrency(numericAmount)}
            </Text>
          </View>

          {feeAmount > 0 && (
            <>
              <View className="mx-4 h-px bg-gray-100" />
              <View className="flex-row items-center justify-between px-4 py-3.5">
                <Text className="font-body text-[14px] text-text-secondary">Fee</Text>
                <Text className="font-subtitle text-[14px] text-text-primary">
                  ${formatCurrency(feeAmount)}
                </Text>
              </View>
            </>
          )}

          <View className="mx-4 h-px bg-gray-100" />
          <View className="flex-row items-center justify-between px-4 py-3.5">
            <Text className="font-subtitle text-[14px] text-text-primary">Total</Text>
            <Text className="font-subtitle text-[16px]" style={{ color: '#FF2E01' }}>
              ${formatCurrency(totalAmount)}
            </Text>
          </View>
        </View>

        <Button title="Confirm & Authorize" className="mt-6" onPress={onConfirm} />
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
