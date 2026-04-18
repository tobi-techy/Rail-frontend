import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useNavigation } from 'expo-router';
import Animated, { FadeInDown, FadeIn, SlideInUp } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui';
import { Keypad } from '@/components/molecules/Keypad';
import { AnimatedAmount } from '@/app/withdraw/method-screen/AnimatedAmount';
import { normalizeAmount, toDisplayAmount } from '@/app/withdraw/method-screen/utils';
import { usePajRates, usePajOnramp, usePajOrderStatus } from '@/api/hooks';
import { invalidateQueries } from '@/api/queryClient';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import {
  ArrowLeft01Icon,
  Copy01Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  Loading03Icon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

const BRAND_RED = '#FF2E01';
const MAX_INTEGER_DIGITS = 10;

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
  const [rawAmount, setRawAmount] = useState('0');
  const [orderId, setOrderId] = useState('');
  const [orderDetails, setOrderDetails] = useState<{
    accountNumber: string;
    accountName: string;
    bank: string;
    fiatAmount: number;
    tokenAmount: number;
    fee: number;
  } | null>(null);

  const { showError } = useFeedbackPopup();
  const navigation = useNavigation();
  const safeGoBack = useCallback(() => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, [navigation]);
  const { data: rates } = usePajRates();
  const onramp = usePajOnramp();
  const { data: orderStatus } = usePajOrderStatus(orderId, step === 'polling');
  const insets = useSafeAreaInsets();

  const onrampRate = rates?.onRampRate?.rate ?? 0;
  const parsedAmount = parseFloat(rawAmount) || 0;
  const estimatedUSDC = onrampRate > 0 ? parsedAmount / onrampRate : 0;
  const displayAmount = toDisplayAmount(rawAmount);
  const canContinue = parsedAmount >= 100;

  const isCompleted = orderStatus?.status === 'COMPLETED';
  const isFailed = orderStatus?.status === 'FAILED';

  // Refresh balances & gameplay streak when deposit completes
  React.useEffect(() => {
    if (isCompleted) {
      invalidateQueries.station();
      invalidateQueries.wallet();
      invalidateQueries.funding();
      invalidateQueries.gameplay();
    }
  }, [isCompleted]);

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

  const handleCreateOrder = useCallback(async () => {
    if (parsedAmount < 100) {
      showError('Minimum amount is ₦100');
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
        fee: order.fee ?? 0,
      });
      setOrderId(order.orderId);
      setStep('pay');
    } catch (err: any) {
      if (err?.code === 'PAJ_VERIFICATION_REQUIRED') {
        router.push('/paj-verify');
        return;
      }
      showError(err?.message || 'Failed to create order');
    }
  }, [parsedAmount, onramp, showError]);

  // Amount step uses the red keypad screen
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
              onPress={safeGoBack}
              accessibilityRole="button"
              accessibilityLabel="Close">
              <HugeiconsIcon icon={Cancel01Icon} size={20} color="#FFFFFF" />
            </Pressable>
            <Text className="font-subtitle text-[20px] text-white">Fund with Naira</Text>
            <View className="size-11" />
          </Animated.View>

          <View className="flex-1 items-center justify-center px-2">
            <Text className="font-body text-[13px] text-white/80">Enter amount in NGN</Text>
            <View className="mt-2">
              <AnimatedAmount amount={displayAmount} prefix="₦" />
            </View>
            {onrampRate > 0 && parsedAmount > 0 && (
              <Animated.View entering={FadeIn.duration(300)}>
                <Text className="mt-2 text-center font-body text-[13px] text-white/90">
                  ≈ ${estimatedUSDC.toFixed(2)} USDC at ₦{onrampRate.toLocaleString()}/USD
                </Text>
              </Animated.View>
            )}
          </View>

          <Animated.View entering={SlideInUp.delay(100).duration(500)} className="px-0 pb-3 pt-1">
            <Button
              title="Continue"
              onPress={handleCreateOrder}
              disabled={!canContinue}
              loading={onramp.isPending}
              variant="white"
              className="bg-white"
            />
            {parsedAmount > 0 && parsedAmount < 100 && (
              <Text className="mt-2 text-center font-body text-[12px] text-white/70">
                Minimum amount is ₦100
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
              onPress={safeGoBack}
              accessibilityRole="button"
              accessibilityLabel="Go back">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#111827" />
            </Pressable>
          </View>

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
                <CopyRow label="Amount" value={`₦${orderDetails.fiatAmount.toLocaleString()}`} />
              </View>

              {/* Fee breakdown */}
              <View className="mt-4 rounded-2xl bg-surface px-5 py-3">
                <View className="flex-row items-center justify-between py-2">
                  <Text className="font-body text-[13px] text-[#9CA3AF]">PAJ fee</Text>
                  <Text className="font-subtitle text-[14px] text-[#070914]">
                    {orderDetails.fee > 0 ? `$${orderDetails.fee.toFixed(2)} USDC` : 'Free'}
                  </Text>
                </View>
                <View className="h-px bg-[#EBEBEB]" />
                <View className="flex-row items-center justify-between py-2">
                  <Text className="font-body text-[13px] text-[#9CA3AF]">You&apos;ll receive</Text>
                  <Text className="font-subtitle text-[14px] text-[#10B981]">
                    ~${(orderDetails.tokenAmount - orderDetails.fee).toFixed(2)} USDC
                  </Text>
                </View>
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
                      <Button title="Done" variant="black" onPress={safeGoBack} />
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
                      <Button title="Go back" variant="black" onPress={safeGoBack} />
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
    </SafeAreaView>
  );
}
