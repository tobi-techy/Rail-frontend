import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown, FadeIn, FadeInUp, SlideInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui';
import { Keypad } from '@/components/molecules/Keypad';
import { AnimatedAmount } from '@/app/withdraw/method-screen/AnimatedAmount';
import {
  normalizeAmount,
  formatMaxAmount,
  toDisplayAmount,
  formatCurrency,
} from '@/app/withdraw/method-screen/utils';
import {
  usePajRates,
  usePajBanks,
  usePajResolveBankAccount,
  usePajOfframp,
  usePajOrderStatus,
  useStation,
} from '@/api/hooks';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import {
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  Search01Icon,
  Loading03Icon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import type { PajBank } from '@/api/types/paj';

const BRAND_RED = '#FF2E01';
const MAX_INTEGER_DIGITS = 10;

type Step = 'amount' | 'bank' | 'account' | 'confirm' | 'polling';

export default function WithdrawNairaScreen() {
  const [step, setStep] = useState<Step>('amount');
  const [selectedBank, setSelectedBank] = useState<PajBank | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [rawAmount, setRawAmount] = useState('0');
  const [bankSearch, setBankSearch] = useState('');
  const [orderId, setOrderId] = useState('');

  const { showError } = useFeedbackPopup();
  const { data: ratesData } = usePajRates();
  const {
    data: banksData,
    isLoading: banksLoading,
    error: banksError,
    refetch: refetchBanks,
  } = usePajBanks();
  const resolveBank = usePajResolveBankAccount();
  const offramp = usePajOfframp();
  const { data: orderStatus } = usePajOrderStatus(orderId, step === 'polling');
  const { data: station } = useStation();
  const insets = useSafeAreaInsets();

  // Refetch banks when returning from paj-verify (session may now be valid)
  useFocusEffect(
    useCallback(() => {
      if (banksError) refetchBanks();
    }, [banksError, refetchBanks])
  );

  const offRampRate = ratesData?.offRampRate?.rate ?? 0;
  const parsedAmount = useMemo(() => {
    const n = parseFloat(rawAmount);
    return Number.isFinite(n) ? n : 0;
  }, [rawAmount]);
  const estimatedUSDC = offRampRate > 0 ? parsedAmount / offRampRate : 0;
  const availableBalance = useMemo(() => {
    const parsed = parseFloat(station?.spend_balance ?? '');
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }, [station?.spend_balance]);
  const displayAmount = toDisplayAmount(rawAmount);
  const canContinue = parsedAmount >= 1000;
  const isCompleted = orderStatus?.status === 'COMPLETED';
  const isFailed = orderStatus?.status === 'FAILED';

  const banks = banksData?.banks ?? [];
  const filteredBanks = useMemo(() => {
    if (!bankSearch) return banks;
    const q = bankSearch.toLowerCase();
    return banks.filter((b) => b.name.toLowerCase().includes(q));
  }, [banks, bankSearch]);

  // When moving to bank step, check if Paj session is needed
  const goToBankStep = useCallback(() => {
    if (banksError) {
      router.push('/paj-verify');
      return;
    }
    setStep('bank');
  }, [banksError]);

  const onAmountKeyPress = useCallback((key: string) => {
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
      return next;
    });
  }, []);

  // Auto-resolve when account number is 10 digits
  useEffect(() => {
    if (accountNumber.length === 10 && selectedBank) {
      resolveBank.mutate(
        { bankId: selectedBank.id, accountNumber },
        {
          onSuccess: (data) => {
            setAccountName(data.accountName);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
          onError: (err: any) => {
            setAccountName('');
            if (err?.code === 'PAJ_VERIFICATION_REQUIRED') {
              router.push('/paj-verify');
              return;
            }
            showError('Could not verify this account number');
          },
        }
      );
    } else {
      setAccountName('');
    }
  }, [accountNumber, selectedBank]);

  const handleSelectBank = useCallback((bank: PajBank) => {
    Haptics.selectionAsync();
    setSelectedBank(bank);
    setAccountNumber('');
    setAccountName('');
    setStep('account');
  }, []);

  const goBack = useCallback(() => {
    switch (step) {
      case 'amount':
        router.back();
        break;
      case 'bank':
        setStep('amount');
        break;
      case 'account':
        setStep('bank');
        break;
      case 'confirm':
        setStep('account');
        break;
      default:
        router.back();
    }
  }, [step]);

  const handleConfirmWithdrawal = useCallback(async () => {
    if (!selectedBank || !accountNumber || parsedAmount < 1000) return;
    try {
      const order = await offramp.mutateAsync({
        bankId: selectedBank.id,
        accountNumber,
        amount: parsedAmount,
      });
      setOrderId(order.orderId);
      setStep('polling');
    } catch (err: any) {
      if (err?.code === 'PAJ_VERIFICATION_REQUIRED') {
        router.push('/paj-verify');
        return;
      }
      if (err?.code === 'INSUFFICIENT_BALANCE') {
        showError('Insufficient balance for this withdrawal');
        return;
      }
      showError(err?.message || 'Failed to create withdrawal');
    }
  }, [selectedBank, accountNumber, parsedAmount, offramp, showError]);

  // Amount step uses the red keypad screen (matches [method].tsx)
  if (step === 'amount') {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: BRAND_RED }} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={BRAND_RED} />
        <View className="flex-1 px-5">
          <Animated.View
            entering={FadeIn.duration(400)}
            className="flex-row items-center justify-between pb-2 pt-1">
            <Pressable
              className="size-11 items-center justify-center rounded-full bg-white/20"
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Close">
              <HugeiconsIcon icon={Cancel01Icon} size={20} color="#FFFFFF" />
            </Pressable>
            <Text className="font-subtitle text-[20px] text-white">Withdraw Naira</Text>
            <View className="size-11" />
          </Animated.View>

          <View className="flex-1 items-center justify-center px-2">
            <Text className="font-body text-[13px] text-white/80">Enter amount in NGN</Text>
            <View className="mt-2">
              <AnimatedAmount amount={displayAmount} prefix="₦" />
            </View>
            {offRampRate > 0 && parsedAmount > 0 && (
              <Animated.View entering={FadeIn.duration(300)}>
                <Text className="mt-2 text-center font-body text-[13px] text-white/90">
                  ≈ ${estimatedUSDC.toFixed(2)} USDC at ₦{offRampRate.toLocaleString()}/USD
                </Text>
              </Animated.View>
            )}
            <Animated.View
              entering={FadeInUp.delay(200).duration(400)}
              className="mt-6 flex-row items-center justify-center gap-2">
              <View className="flex-row items-center rounded-full bg-white/20 px-3 py-2">
                <Text className="font-body text-[13px] text-white/90">
                  Balance: ${formatCurrency(availableBalance)}
                </Text>
              </View>
            </Animated.View>
          </View>

          <Animated.View entering={SlideInUp.delay(100).duration(500)} className="px-0 pb-3 pt-1">
            <Button
              title="Continue"
              onPress={goToBankStep}
              disabled={!canContinue}
              variant="white"
              className="bg-white"
            />
            {parsedAmount > 0 && parsedAmount < 1000 && (
              <Text className="mt-2 text-center font-body text-[12px] text-white/70">
                Minimum withdrawal is ₦1,000
              </Text>
            )}
          </Animated.View>

          <Animated.View entering={SlideInUp.delay(100).duration(500)}>
            <Keypad
              className="pb-2"
              onKeyPress={onAmountKeyPress}
              backspaceIcon="delete"
              variant="dark"
              leftKey="decimal"
            />
          </Animated.View>

          <View style={{ paddingBottom: Math.max(insets.bottom, 12) }} />
        </View>

        <Text className="absolute bottom-2 left-0 right-0 text-center font-body text-[11px] text-white/40">
          Powered by Paj Cash
        </Text>
      </SafeAreaView>
    );
  }

  // Remaining steps use white background
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          className="flex-1 px-5"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="flex-row items-center pb-2 pt-1">
            <Pressable
              className="size-11 items-center justify-center rounded-full bg-surface"
              onPress={goBack}
              accessibilityRole="button"
              accessibilityLabel="Go back">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#111827" />
            </Pressable>
          </View>

          {/* Step 2: Select bank */}
          {step === 'bank' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <View className="mt-4">
                <Text className="font-subtitle text-[28px] text-text-primary">
                  Select your bank
                </Text>
                <Text className="mt-2 font-body text-[14px] text-text-secondary">
                  Choose the bank to receive ₦{parsedAmount.toLocaleString()}
                </Text>
              </View>

              <View className="mt-6 flex-row items-center rounded-2xl bg-surface px-4 py-3">
                <HugeiconsIcon icon={Search01Icon} size={18} color="#9CA3AF" />
                <TextInput
                  className="ml-2 flex-1 font-body text-[15px] text-text-primary"
                  placeholder="Search banks..."
                  placeholderTextColor="#9CA3AF"
                  value={bankSearch}
                  onChangeText={setBankSearch}
                  autoFocus={banks.length > 0}
                />
              </View>

              {banksLoading ? (
                <View className="mt-8 items-center">
                  <ActivityIndicator color="#6366F1" />
                  <Text className="mt-2 font-body text-[13px] text-[#9CA3AF]">
                    Loading banks...
                  </Text>
                </View>
              ) : filteredBanks.length === 0 ? (
                <View className="mt-8 items-center">
                  <Text className="font-body text-[14px] text-text-secondary">
                    {bankSearch ? 'No banks match your search' : 'No banks available'}
                  </Text>
                </View>
              ) : (
                <View className="mt-4 overflow-hidden rounded-2xl bg-surface">
                  {filteredBanks.map((bank, i) => (
                    <Pressable
                      key={bank.id}
                      className="flex-row items-center px-4 py-3.5 active:bg-[#F3F4F6]"
                      style={
                        i < filteredBanks.length - 1
                          ? { borderBottomWidth: 1, borderBottomColor: '#EBEBEB' }
                          : undefined
                      }
                      onPress={() => handleSelectBank(bank)}>
                      <Text className="flex-1 font-subtitle text-[15px] text-text-primary">
                        {bank.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </Animated.View>
          )}

          {/* Step 3: Enter account number */}
          {step === 'account' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <View className="mt-4">
                <Text className="font-subtitle text-[28px] text-text-primary">
                  {selectedBank?.name}
                </Text>
                <Text className="mt-2 font-body text-[14px] text-text-secondary">
                  Enter your 10-digit account number
                </Text>
              </View>

              <View className="mt-8 rounded-2xl bg-surface p-5">
                <Text className="mb-2 font-body text-[13px] text-[#9CA3AF]">Account Number</Text>
                <TextInput
                  className="font-subtitle text-[24px] text-text-primary"
                  value={accountNumber}
                  onChangeText={(t) => setAccountNumber(t.replace(/\D/g, '').slice(0, 10))}
                  keyboardType="numeric"
                  placeholder="0000000000"
                  placeholderTextColor="#D1D5DB"
                  maxLength={10}
                  autoFocus
                />
                {resolveBank.isPending && (
                  <View className="mt-3 flex-row items-center gap-2">
                    <ActivityIndicator size="small" color="#6366F1" />
                    <Text className="font-body text-[13px] text-[#6366F1]">Verifying...</Text>
                  </View>
                )}
                {accountName !== '' && (
                  <View className="mt-3 flex-row items-center gap-2">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} color="#10B981" />
                    <Text className="font-subtitle text-[15px] text-[#10B981]">{accountName}</Text>
                  </View>
                )}
              </View>

              <View className="mt-6">
                <Button
                  title="Review withdrawal"
                  variant="black"
                  disabled={!accountName}
                  onPress={() => setStep('confirm')}
                />
              </View>
            </Animated.View>
          )}

          {/* Step 4: Confirm */}
          {step === 'confirm' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <View className="mt-4">
                <Text className="font-subtitle text-[28px] text-text-primary">
                  Confirm withdrawal
                </Text>
              </View>

              <View className="mt-6 rounded-2xl bg-surface px-5 py-4">
                <View className="flex-row justify-between py-2">
                  <Text className="font-body text-[13px] text-[#9CA3AF]">To</Text>
                  <Text className="font-subtitle text-[15px] text-text-primary">{accountName}</Text>
                </View>
                <View className="h-px bg-[#EBEBEB]" />
                <View className="flex-row justify-between py-2">
                  <Text className="font-body text-[13px] text-[#9CA3AF]">Bank</Text>
                  <Text className="font-subtitle text-[15px] text-text-primary">
                    {selectedBank?.name}
                  </Text>
                </View>
                <View className="h-px bg-[#EBEBEB]" />
                <View className="flex-row justify-between py-2">
                  <Text className="font-body text-[13px] text-[#9CA3AF]">Account</Text>
                  <Text className="font-subtitle text-[15px] text-text-primary">
                    {accountNumber}
                  </Text>
                </View>
                <View className="h-px bg-[#EBEBEB]" />
                <View className="flex-row justify-between py-2">
                  <Text className="font-body text-[13px] text-[#9CA3AF]">Amount</Text>
                  <Text className="font-subtitle text-[15px] text-text-primary">
                    ₦{parsedAmount.toLocaleString()}
                  </Text>
                </View>
                <View className="h-px bg-[#EBEBEB]" />
                <View className="flex-row justify-between py-2">
                  <Text className="font-body text-[13px] text-[#9CA3AF]">Estimated debit</Text>
                  <Text className="font-subtitle text-[15px] text-[#6366F1]">
                    ~${estimatedUSDC.toFixed(2)} USDC
                  </Text>
                </View>
              </View>

              <View className="mt-6">
                <Button
                  title="Confirm withdrawal"
                  variant="black"
                  loading={offramp.isPending}
                  onPress={handleConfirmWithdrawal}
                />
              </View>
            </Animated.View>
          )}

          {/* Step 5: Polling */}
          {step === 'polling' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <View className="mt-16 items-center">
                {isCompleted ? (
                  <>
                    <View className="mb-4 size-16 items-center justify-center rounded-full bg-[#ECFDF5]">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={32} color="#10B981" />
                    </View>
                    <Text className="font-subtitle text-[24px] text-text-primary">
                      Withdrawal sent!
                    </Text>
                    <Text className="mt-2 text-center font-body text-[14px] text-text-secondary">
                      ₦{parsedAmount.toLocaleString()} is on its way to {accountName} at{' '}
                      {selectedBank?.name}.
                    </Text>
                    <View className="mt-8 w-full">
                      <Button title="Done" variant="black" onPress={() => router.back()} />
                    </View>
                  </>
                ) : isFailed ? (
                  <>
                    <Text className="font-subtitle text-[24px] text-text-primary">
                      Withdrawal failed
                    </Text>
                    <Text className="mt-2 text-center font-body text-[14px] text-text-secondary">
                      Your funds have been returned to your balance. Please try again.
                    </Text>
                    <View className="mt-8 w-full">
                      <Button title="Go back" variant="black" onPress={() => router.back()} />
                    </View>
                  </>
                ) : (
                  <>
                    <View className="mb-4 size-16 items-center justify-center rounded-full bg-[#EEF2FF]">
                      <HugeiconsIcon icon={Loading03Icon} size={28} color="#6366F1" />
                    </View>
                    <Text className="font-subtitle text-[24px] text-text-primary">
                      Processing withdrawal
                    </Text>
                    <Text className="mt-2 text-center font-body text-[14px] text-text-secondary">
                      Sending ₦{parsedAmount.toLocaleString()} to {selectedBank?.name}. This usually
                      takes a few minutes.
                    </Text>
                  </>
                )}
              </View>
            </Animated.View>
          )}

          <Text className="mb-8 mt-8 text-center font-body text-[11px] text-[#9CA3AF]">
            Powered by Paj Cash
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
