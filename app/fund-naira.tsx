import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui';
import { usePajRates, usePajOnramp, usePajOrderStatus } from '@/api/hooks';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { PajVerificationSheet } from '@/components/sheets/PajVerificationSheet';
import {
  ArrowLeft01Icon,
  Copy01Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  Loading03Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

type Step = 'amount' | 'pay' | 'polling';

function CopyRow({ label, value }: { label: string; value: string }) {
  const { showInfo } = useFeedbackPopup();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(value);
    setCopied(true);
    showInfo('Copied', `${label} copied`);
    setTimeout(() => setCopied(false), 1500);
  }, [value, label, showInfo]);

  return (
    <Pressable
      onPress={handleCopy}
      className="flex-row items-center justify-between py-4 active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={`Copy ${label}`}>
      <View className="flex-1 pr-4">
        <Text className="font-body text-[13px] text-[#9CA3AF]">{label}</Text>
        <Text className="mt-1 font-subtitle text-[16px] text-[#070914]" selectable>
          {value}
        </Text>
      </View>
      {copied ? (
        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} color="#10B981" />
      ) : (
        <HugeiconsIcon icon={Copy01Icon} size={20} color="#6366F1" />
      )}
    </Pressable>
  );
}

export default function FundNairaScreen() {
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [orderDetails, setOrderDetails] = useState<{
    accountNumber: string;
    accountName: string;
    bank: string;
    fiatAmount: number;
    tokenAmount: number;
  } | null>(null);

  const { showError } = useFeedbackPopup();
  const { data: rates } = usePajRates();
  const onramp = usePajOnramp();
  const { data: orderStatus } = usePajOrderStatus(orderId, step === 'polling');

  const onrampRate = rates?.onRampRate?.rate ?? 0;
  const parsedAmount = parseFloat(amount) || 0;
  const estimatedUSDC = onrampRate > 0 ? parsedAmount / onrampRate : 0;

  const isCompleted = orderStatus?.status === 'COMPLETED';
  const isFailed = orderStatus?.status === 'FAILED';

  const handleCreateOrder = useCallback(async () => {
    if (parsedAmount < 1000) {
      showError('Minimum amount is ₦1,000');
      return;
    }
    try {
      const order = await onramp.mutateAsync({ amount: parsedAmount });
      setOrderDetails({
        accountNumber: order.accountNumber,
        accountName: order.accountName,
        bank: order.bank,
        fiatAmount: order.fiatAmount,
        tokenAmount: order.tokenAmount,
      });
      setOrderId(order.orderId);
      setStep('pay');
    } catch (err: any) {
      if (err?.code === 'PAJ_VERIFICATION_REQUIRED') {
        setShowVerification(true);
        return;
      }
      showError(err?.message || 'Failed to create order');
    }
  }, [parsedAmount, onramp, showError]);

  const handleVerified = useCallback(() => {
    setShowVerification(false);
    handleCreateOrder();
  }, [handleCreateOrder]);

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
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#111827" />
            </Pressable>
          </View>

          {step === 'amount' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <View className="mt-4">
                <Text className="font-subtitle text-[28px] text-text-primary">Fund with Naira</Text>
                <Text className="mt-2 font-body text-[14px] text-text-secondary">
                  Enter the amount in NGN. You{"'"}ll receive bank details to transfer to.
                </Text>
              </View>

              <View className="mt-8 rounded-2xl bg-surface p-5">
                <Text className="mb-2 font-body text-[13px] text-[#9CA3AF]">Amount (NGN)</Text>
                <View className="flex-row items-center">
                  <Text className="font-subtitle text-[24px] text-text-primary">₦</Text>
                  <TextInput
                    className="ml-1 flex-1 font-subtitle text-[24px] text-text-primary"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#D1D5DB"
                    autoFocus
                  />
                </View>
                {onrampRate > 0 && parsedAmount > 0 && (
                  <Text className="mt-2 font-body text-[13px] text-[#6366F1]">
                    ≈ ${estimatedUSDC.toFixed(2)} USDC at ₦{onrampRate.toLocaleString()}/USD
                  </Text>
                )}
              </View>

              <View className="mt-6">
                <Button
                  title="Continue"
                  variant="black"
                  loading={onramp.isPending}
                  disabled={parsedAmount < 1000}
                  onPress={handleCreateOrder}
                />
              </View>

              {parsedAmount > 0 && parsedAmount < 1000 && (
                <Text className="mt-3 text-center font-body text-[12px] text-[#EF4444]">
                  Minimum amount is ₦1,000
                </Text>
              )}
            </Animated.View>
          )}

          {step === 'pay' && orderDetails && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <View className="mt-4">
                <Text className="font-subtitle text-[28px] text-text-primary">
                  Transfer to this account
                </Text>
                <Text className="mt-2 font-body text-[14px] text-text-secondary">
                  Send exactly ₦{orderDetails.fiatAmount.toLocaleString()} to the account below.
                  Your balance will be credited automatically.
                </Text>
              </View>

              <View className="mt-6 rounded-2xl bg-surface px-5">
                <CopyRow label="Bank" value={orderDetails.bank} />
                <View className="h-px bg-[#EBEBEB]" />
                <CopyRow label="Account Number" value={orderDetails.accountNumber} />
                <View className="h-px bg-[#EBEBEB]" />
                <CopyRow label="Account Name" value={orderDetails.accountName} />
                <View className="h-px bg-[#EBEBEB]" />
                <CopyRow
                  label="Amount"
                  value={`₦${orderDetails.fiatAmount.toLocaleString()}`}
                />
              </View>

              <View className="mt-4 flex-row items-start gap-2 rounded-xl bg-[#FFF7ED] p-3">
                <HugeiconsIcon icon={InformationCircleIcon} size={16} color="#F59E0B" />
                <Text className="flex-1 font-body text-[12px] leading-4 text-[#92400E]">
                  Transfer the exact amount. Different amounts may delay your deposit.
                </Text>
              </View>

              <View className="mt-6">
                <Button
                  title="I've sent the money"
                  variant="black"
                  onPress={() => setStep('polling')}
                />
              </View>
            </Animated.View>
          )}

          {step === 'polling' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <View className="mt-16 items-center">
                {isCompleted ? (
                  <>
                    <View className="mb-4 size-16 items-center justify-center rounded-full bg-[#ECFDF5]">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={32} color="#10B981" />
                    </View>
                    <Text className="font-subtitle text-[24px] text-text-primary">
                      Deposit received!
                    </Text>
                    <Text className="mt-2 text-center font-body text-[14px] text-text-secondary">
                      ₦{orderDetails?.fiatAmount.toLocaleString()} has been credited to your
                      account.
                    </Text>
                    <View className="mt-8 w-full">
                      <Button title="Done" variant="black" onPress={() => router.back()} />
                    </View>
                  </>
                ) : isFailed ? (
                  <>
                    <Text className="font-subtitle text-[24px] text-text-primary">
                      Something went wrong
                    </Text>
                    <Text className="mt-2 text-center font-body text-[14px] text-text-secondary">
                      Your deposit could not be processed. Please contact support.
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
                      Waiting for payment
                    </Text>
                    <Text className="mt-2 text-center font-body text-[14px] text-text-secondary">
                      We{"'"}re checking for your transfer. This usually takes a few minutes.
                    </Text>
                    <Text className="mt-1 font-body text-[12px] text-[#9CA3AF]">
                      Status: {orderStatus?.status || 'Checking...'}
                    </Text>
                  </>
                )}
              </View>
            </Animated.View>
          )}

          {/* Powered by */}
          <Text className="mb-8 mt-8 text-center font-body text-[11px] text-[#9CA3AF]">
            Powered by Paj Cash
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <PajVerificationSheet
        visible={showVerification}
        onClose={() => setShowVerification(false)}
        onVerified={handleVerified}
      />
    </SafeAreaView>
  );
}
