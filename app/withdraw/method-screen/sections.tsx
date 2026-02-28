import React from 'react';
import { ActivityIndicator, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react-native';
import { router } from 'expo-router';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';
import { BottomSheet, KYCVerificationSheet } from '@/components/sheets';
import { Button, Input } from '@/components/ui';
import { formatCurrency } from './utils';
import type { MethodCopy } from './types';

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
  onClose: () => void;
  onPasscodeAuthorize: (code: string) => void;
  onPasskeyAuthorize: () => void;
  onValueChange: (value: string) => void;
  passkeyAvailable: boolean;
  submittingTitle: string;
};

type WithdrawDetailsSheetProps = {
  destinationError: string;
  destinationInput: string;
  didTryDestination: boolean;
  fundingError: string;
  isAssetTradeMethod: boolean;
  isFiatMethod: boolean;
  isFundFlow: boolean;
  isFundingActionLoading: boolean;
  isMobileWalletFundingFlow: boolean;
  methodCopy: MethodCopy;
  numericAmount: number;
  onClose: () => void;
  onDestinationChange: (value: string) => void;
  onSubmit: () => void;
  visible: boolean;
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

export function FiatKycRequiredScreen({
  kycStatus,
  onStartVerification,
  showKycSheet,
  onCloseKycSheet,
}: FiatKycRequiredScreenProps) {
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
            <Text className="mb-2 font-subtitle text-xl text-gray-900">Verification Required</Text>
            <Text className="mb-8 text-center font-body text-sm text-gray-500">
              Complete identity verification to withdraw fiat to a bank account.
            </Text>
            <View className="w-full gap-y-3">
              <Button title="Start Verification" onPress={onStartVerification} />
              <Button
                title="Use Crypto Instead"
                variant="white"
                onPress={() => router.replace('/withdraw/crypto' as never)}
              />
            </View>
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
  onClose,
  onPasscodeAuthorize,
  onPasskeyAuthorize,
  onValueChange,
  passkeyAvailable,
  submittingTitle,
}: AuthorizeScreenProps) {
  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="white" />

        <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
          <TouchableOpacity
            className="size-11 items-center justify-center rounded-full bg-gray-100"
            onPress={onClose}
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
          onValueChange={onValueChange}
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

export function WithdrawDetailsSheet({
  destinationError,
  destinationInput,
  didTryDestination,
  fundingError,
  isAssetTradeMethod,
  isFiatMethod,
  isFundFlow,
  isFundingActionLoading,
  isMobileWalletFundingFlow,
  methodCopy,
  numericAmount,
  onClose,
  onDestinationChange,
  onSubmit,
  visible,
}: WithdrawDetailsSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} showCloseButton dismissible>
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
                <Text className="font-subtitle text-[15px] text-text-primary">Solana Devnet</Text>
              </View>
              <View className="mt-2 flex-row items-center justify-between">
                <Text className="font-body text-[13px] text-text-secondary">Asset</Text>
                <Text className="font-subtitle text-[15px] text-text-primary">USDC</Text>
              </View>
            </>
          )}
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
