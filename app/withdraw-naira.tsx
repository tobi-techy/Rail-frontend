import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, Pressable, StatusBar, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, TextInput, Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import Animated, { FadeInDown, FadeIn, FadeInUp, SlideInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui';
import { Keypad } from '@/components/molecules/Keypad';
import { AnimatedAmount } from '@/app/withdraw/method-screen/AnimatedAmount';
import {
  normalizeAmount, toDisplayAmount, formatCurrency,
} from '@/app/withdraw/method-screen/utils';
import {
  usePajRates, usePajBanks, usePajResolveBankAccount, usePajOfframp,
  usePajOrderStatus, usePajSavedBanks, usePajAddBankAccount, useStation,
  useVerifyPasscode,
} from '@/api/hooks';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { usePasskeyAuthorize } from '@/hooks/usePasskeyAuthorize';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';
import { useAuthStore } from '@/stores/authStore';
import { BankPickerSheet } from '@/components/sheets/BankPickerSheet';
import {
  ArrowLeft01Icon, CheckmarkCircle02Icon, Cancel01Icon,
  BankIcon, ArrowDown01Icon, Search01Icon, Add01Icon, ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { DiceBearAvatar } from '@/components/atoms/DiceBearAvatar';
import { Confetti } from '@/components/atoms/Confetti';
import { NgnIcon } from '@/assets/svg';
import type { PajBank, PajSavedBankAccount } from '@/api/types/paj';

const BRAND_RED = '#FF2E01';
const MAX_INTEGER_DIGITS = 10;

type Step = 'amount' | 'recipients' | 'newRecipient' | 'confirm' | 'auth' | 'polling';

export default function WithdrawNairaScreen() {
  const insets = useSafeAreaInsets();
  const { showError } = useFeedbackPopup();
  const navigation = useNavigation();
  const safeGoBack = useCallback(() => {
    navigation.canGoBack() ? router.back() : router.replace('/(tabs)');
  }, [navigation]);

  // ── State ───────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('amount');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState<PajBank | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [rawAmount, setRawAmount] = useState('0');
  const [orderId, setOrderId] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [saveBankDetails, setSaveBankDetails] = useState(true);

  // Auth state
  const [pinAttempts, setPinAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const user = useAuthStore((s) => s.user);
  const { mutate: verifyPasscode, isPending: isVerifying } = useVerifyPasscode();

  // ── API ─────────────────────────────────────────────────────────────────
  const { data: ratesData } = usePajRates();
  const { data: banksData, isLoading: banksLoading, isFetching: banksFetching, error: banksError, refetch: refetchBanks } = usePajBanks();
  const { data: savedBanksData, refetch: refetchSavedBanks } = usePajSavedBanks();
  const resolveBank = usePajResolveBankAccount();
  const addBank = usePajAddBankAccount();
  const offramp = usePajOfframp();
  const { data: orderStatus } = usePajOrderStatus(orderId, step === 'polling');
  const { data: station } = useStation();

  useFocusEffect(useCallback(() => { refetchBanks(); refetchSavedBanks(); }, [refetchBanks, refetchSavedBanks]));

  // Proactive Paj session guard — redirect before the user hits an API error
  const needsPajSession = (banksError as any)?.code === 'PAJ_VERIFICATION_REQUIRED';

  const offRampRate = ratesData?.offRampRate?.rate ?? 0;
  const railFeeUSD = ratesData?.railFee ?? 0.06;
  const minWithdrawalNGN = ratesData?.minWithdrawalNGN ?? 1500;
  const parsedAmount = useMemo(() => { const n = parseFloat(rawAmount); return Number.isFinite(n) ? n : 0; }, [rawAmount]);
  const estimatedUSDC = offRampRate > 0 ? parsedAmount / offRampRate : 0;
  const availableBalance = useMemo(() => { const p = parseFloat(station?.spend_balance ?? ''); return Number.isFinite(p) && p >= 0 ? p : 0; }, [station?.spend_balance]);
  const canContinueAmount = parsedAmount >= minWithdrawalNGN;
  const isCompleted = orderStatus?.status === 'COMPLETED';
  const isFailed = orderStatus?.status === 'FAILED';
  const [pollingTimedOut, setPollingTimedOut] = useState(false);

  // Timeout polling after 3 minutes to avoid infinite spinner
  useEffect(() => {
    if (step !== 'polling' || isCompleted || isFailed) { setPollingTimedOut(false); return; }
    const timer = setTimeout(() => setPollingTimedOut(true), 3 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [step, isCompleted, isFailed]);

  // Haptic feedback on terminal status
  useEffect(() => {
    if (isCompleted) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (isFailed) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [isCompleted, isFailed]);
  const banks = banksData?.banks ?? [];
  const savedBanks = savedBanksData?.accounts ?? [];

  // Passkey auth
  const passkeyScope = `naira-withdraw:${user?.email || 'unknown'}:${parsedAmount}`;
  const passkey = usePasskeyAuthorize({
    email: user?.email,
    passkeyPromptScope: passkeyScope,
    autoTrigger: false,
    onAuthorized: () => handleConfirmWithdrawal(),
  });

  useEffect(() => {
    if (!lockoutUntil) return;
    const tick = setInterval(() => {
      const rem = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (rem <= 0) { setLockoutUntil(null); setLockoutSeconds(0); setPinAttempts(0); }
      else setLockoutSeconds(rem);
    }, 1000);
    return () => clearInterval(tick);
  }, [lockoutUntil]);

  const onPasscodeComplete = useCallback((code: string) => {
    if (isVerifying || lockoutUntil) return;
    passkey.setAuthError('');
    verifyPasscode({ passcode: code }, {
      onSuccess: (result) => {
        if (!result.verified) {
          const next = pinAttempts + 1;
          setPinAttempts(next);
          if (next >= 5) {
            setLockoutUntil(Date.now() + 30_000);
            setLockoutSeconds(30);
            passkey.setAuthError('Too many attempts. Try again in 30s.');
          } else {
            passkey.setAuthError(`Invalid PIN. ${5 - next} attempt${5 - next !== 1 ? 's' : ''} left.`);
          }
          passkey.onAuthPasscodeChange('');
          return;
        }
        setPinAttempts(0);
        handleConfirmWithdrawal();
      },
      onError: () => { passkey.setAuthError('Verification failed.'); passkey.onAuthPasscodeChange(''); },
    });
  }, [isVerifying, lockoutUntil, pinAttempts, verifyPasscode]);

  // Filter saved banks by search
  const filteredSavedBanks = useMemo(() => {
    if (!searchQuery.trim()) return savedBanks;
    const q = searchQuery.toLowerCase();
    return savedBanks.filter(
      (b) => b.accountName.toLowerCase().includes(q) || b.accountNumber.includes(q) || b.bank.toLowerCase().includes(q)
    );
  }, [savedBanks, searchQuery]);

  const initials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  };

  // ── Select saved recipient ──────────────────────────────────────────────
  const selectSavedBank = useCallback((saved: PajSavedBankAccount) => {
    if (needsPajSession) { router.push('/paj-verify'); return; }
    Haptics.selectionAsync();
    const matchedBank = banks.find((b) => b.name === saved.bank || b.id === saved.bank);
    setSelectedBank(matchedBank ?? null);
    setAccountNumber(saved.accountNumber);
    setAccountName(saved.accountName);
    setStep('confirm');
  }, [needsPajSession, banks]);

  // ── Auto-resolve account ────────────────────────────────────────────────
  useEffect(() => {
    if (accountNumber.length === 10 && selectedBank) {
      let stale = false;
      resolveBank.mutate(
        { bankId: selectedBank.id, accountNumber },
        {
          onSuccess: (data) => { if (!stale) { setAccountName(data.accountName); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } },
          onError: (err: any) => {
            if (stale) return;
            setAccountName('');
            if (err?.code === 'PAJ_VERIFICATION_REQUIRED') { router.push('/paj-verify'); return; }
            showError('Could not verify this account number');
          },
        }
      );
      return () => { stale = true; };
    } else if (step === 'newRecipient') { setAccountName(''); }
  }, [accountNumber, selectedBank]);

  // ── Keypad ──────────────────────────────────────────────────────────────
  const onAmountKeyPress = useCallback((key: string) => {
    setRawAmount((cur) => {
      if (key === 'backspace') return cur === '0' ? cur : normalizeAmount(cur.slice(0, -1));
      if (key === 'decimal') return cur.includes('.') ? cur : `${cur}.`;
      if (!/^\d$/.test(key)) return cur;
      if (cur.includes('.')) { const [i, d = ''] = cur.split('.'); return d.length >= 2 ? cur : `${i}.${d}${key}`; }
      const next = (cur === '0' ? key : `${cur}${key}`).replace(/^0+(?=\d)/, '') || '0';
      return next.length > MAX_INTEGER_DIGITS ? cur : next;
    });
  }, []);

  // ── Navigation ──────────────────────────────────────────────────────────
  const goBack = useCallback(() => {
    switch (step) {
      case 'amount': safeGoBack(); break;
      case 'recipients': setStep('amount'); break;
      case 'newRecipient': setStep('recipients'); setSelectedBank(null); setAccountNumber(''); setAccountName(''); break;
      case 'confirm': setStep('recipients'); break;
      case 'auth': setStep('confirm'); break;
      default: safeGoBack();
    }
  }, [step, safeGoBack]);

  const goToConfirm = useCallback(() => {
    if (needsPajSession) { router.push('/paj-verify'); return; }
    if (saveBankDetails && selectedBank && accountName) {
      addBank.mutate({ bankId: selectedBank.id, accountNumber }, { onSuccess: () => refetchSavedBanks() });
    }
    setStep('confirm');
  }, [needsPajSession, saveBankDetails, selectedBank, accountName, accountNumber, addBank, refetchSavedBanks]);

  // ── Confirm withdrawal ─────────────────────────────────────────────────
  const handleConfirmWithdrawal = useCallback(async () => {
    if (!selectedBank || !accountNumber || parsedAmount < minWithdrawalNGN) return;
    try {
      const order = await offramp.mutateAsync({ bankId: selectedBank.id, accountNumber, amount: parsedAmount });
      setOrderId(order.orderId);
      setStep('polling');
    } catch (err: any) {
      if (err?.code === 'PAJ_VERIFICATION_REQUIRED') { router.push('/paj-verify'); return; }
      if (err?.code === 'INSUFFICIENT_BALANCE') { showError('Insufficient balance for this withdrawal'); return; }
      showError(err?.message || 'Failed to create withdrawal');
    }
  }, [selectedBank, accountNumber, parsedAmount, offramp, showError]);

  // ═══════════════════════════════════════════════════════════════════════
  // STEP: Recipients (recipient-first)
  // ═══════════════════════════════════════════════════════════════════════
  if (step === 'recipients') {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View className="px-5 pb-2 pt-1">
          <Pressable className="size-11 items-center justify-center rounded-full bg-surface" onPress={() => setStep('amount')}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#111827" />
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(250)}>
            <Text className="font-subtitle text-[28px] text-text-primary">Send to bank account</Text>
            <Text className="mt-1 font-body text-[14px] text-text-secondary">
              Send ₦{parsedAmount.toLocaleString()} to a recent or new recipient
            </Text>
          </Animated.View>

          {/* Search */}
          <Animated.View entering={FadeInUp.delay(60).duration(250)} className="mt-6">
            <View className="flex-row items-center gap-3 rounded-2xl bg-[#F3F4F6] px-4" style={{ height: 52 }}>
              <HugeiconsIcon icon={Search01Icon} size={18} color="#9CA3AF" />
              <TextInput
                className="flex-1 font-body text-[15px] text-text-primary"
                placeholder="Search by account name"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <HugeiconsIcon icon={Cancel01Icon} size={15} color="#9CA3AF" />
                </Pressable>
              )}
            </View>
          </Animated.View>

          {/* Send to new recipient */}
          <Animated.View entering={FadeInUp.delay(100).duration(250)} className="mt-5">
            <Pressable
              className="flex-row items-center justify-between rounded-2xl bg-[#F9FAFB] px-4 py-4"
              onPress={() => { setSelectedBank(null); setAccountNumber(''); setAccountName(''); setStep('newRecipient'); }}>
              <View className="flex-row items-center gap-3">
                <View className="size-11 items-center justify-center rounded-full bg-[#3B82F6]">
                  <HugeiconsIcon icon={Add01Icon} size={20} color="#fff" />
                </View>
                <Text className="font-subtitle text-[15px] text-text-primary">Send to a new recipient</Text>
              </View>
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#9CA3AF" />
            </Pressable>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STEP: New Recipient form — brand-forward design
  // ═══════════════════════════════════════════════════════════════════════
  if (step === 'newRecipient') {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
          <View className="flex-1">
            <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View className="flex-row items-center px-5 pb-2 pt-1">
                <Pressable className="size-11 items-center justify-center rounded-full bg-surface" onPress={goBack}>
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#111827" />
                </Pressable>
              </View>

              <View className="mt-4 px-5">
                <Text className="font-subtitle text-[28px] text-text-primary">New Recipient</Text>
                <Text className="mt-1 mb-6 font-body text-[14px] text-text-secondary">Enter the recipient&apos;s bank details</Text>

                {/* Bank picker */}
                <Animated.View entering={FadeInUp.delay(40).duration(250)}>
                  <Text className="mb-2 font-subtitle text-[13px] text-text-secondary">Select bank</Text>
                  <Pressable
                    className="flex-row items-center justify-between rounded-2xl border border-[#E5E7EB] px-4"
                    style={{ height: 56 }}
                    onPress={() => setShowBankPicker(true)}>
                    {selectedBank ? (
                      <View className="flex-row items-center gap-3">
                        <View className="size-8 items-center justify-center rounded-lg" style={{ backgroundColor: '#FFF5F2' }}>
                          <HugeiconsIcon icon={BankIcon} size={16} color="#FF2E01" />
                        </View>
                        <Text className="font-subtitle text-[15px] text-text-primary">{selectedBank.name}</Text>
                      </View>
                    ) : (
                      <Text className="font-body text-[15px] text-[#9CA3AF]">Choose a bank</Text>
                    )}
                    <HugeiconsIcon icon={ArrowDown01Icon} size={20} color="#9CA3AF" />
                  </Pressable>
                </Animated.View>

                {/* Account number */}
                <Animated.View entering={FadeInUp.delay(80).duration(250)} className="mt-5">
                  <Text className="mb-2 font-subtitle text-[13px] text-text-secondary">Account Number</Text>
                  <View
                    className="flex-row items-center rounded-2xl border border-[#E5E7EB] px-4"
                    style={{ height: 56, opacity: selectedBank ? 1 : 0.5 }}>
                    <TextInput
                      className="flex-1 font-body text-[16px] text-text-primary"
                      placeholder="Enter 10-digit account number"
                      placeholderTextColor="#C4C4C4"
                      value={accountNumber}
                      onChangeText={(t: string) => setAccountNumber(t.replace(/\D/g, '').slice(0, 10))}
                      keyboardType="numeric"
                      maxLength={10}
                      editable={!!selectedBank}
                    />
                    {accountNumber.length > 0 && (
                      <Pressable onPress={() => { setAccountNumber(''); setAccountName(''); }} hitSlop={8}>
                        <HugeiconsIcon icon={Cancel01Icon} size={16} color="#9CA3AF" />
                      </Pressable>
                    )}
                  </View>
                </Animated.View>

                {/* Resolving indicator */}
                {resolveBank.isPending && (
                  <Animated.View entering={FadeIn.duration(200)} className="mt-3 flex-row items-center gap-2 px-1">
                    <ActivityIndicator size="small" color="#FF2E01" />
                    <Text className="font-body text-[13px]" style={{ color: '#FF2E01' }}>Verifying account...</Text>
                  </Animated.View>
                )}

                {/* Resolved account name */}
                {accountName !== '' && (
                  <Animated.View entering={FadeInUp.springify().damping(18)} className="mt-4">
                    <View className="flex-row items-center gap-3 rounded-2xl px-4 py-4" style={{ backgroundColor: '#F0FDF4' }}>
                      <View className="size-9 items-center justify-center rounded-full" style={{ backgroundColor: '#DCFCE7' }}>
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} color="#16A34A" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-body text-[12px] text-[#16A34A]">Account verified</Text>
                        <Text className="font-subtitle text-[15px] text-text-primary">{accountName}</Text>
                      </View>
                    </View>
                  </Animated.View>
                )}

                {/* Save toggle */}
                {accountName !== '' && (
                  <Animated.View entering={FadeIn.delay(100).duration(200)} className="mt-4 flex-row items-center justify-between px-1">
                    <Text className="font-body text-[14px] text-text-secondary">Save bank details</Text>
                    <Pressable
                      onPress={() => setSaveBankDetails(!saveBankDetails)}
                      className="h-7 w-12 justify-center rounded-full px-0.5"
                      style={{ backgroundColor: saveBankDetails ? '#FF2E01' : '#E5E7EB' }}>
                      <Animated.View
                        className="size-6 rounded-full bg-white"
                        style={{
                          alignSelf: saveBankDetails ? 'flex-end' : 'flex-start',
                          shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 2,
                        }}
                      />
                    </Pressable>
                  </Animated.View>
                )}
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>

        {/* Sticky CTA — outside KAV so it stays at screen bottom */}
        <View className="border-t border-gray-100 bg-white px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <Button title="Continue" variant="orange" disabled={!accountName} onPress={goToConfirm} />
        </View>

        <BankPickerSheet
          visible={showBankPicker}
          onClose={() => setShowBankPicker(false)}
          banks={banks}
          loading={banksLoading || banksFetching}
          onSelect={(bank: PajBank) => { Haptics.selectionAsync(); setSelectedBank(bank); setAccountNumber(''); setAccountName(''); setShowBankPicker(false); }}
        />
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STEP: Auth (passcode/passkey)
  // ═══════════════════════════════════════════════════════════════════════
  if (step === 'auth') {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
          <Pressable className="size-11 items-center justify-center rounded-full bg-surface" onPress={() => setStep('confirm')}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#111" />
          </Pressable>
          <Text className="font-subtitle text-[17px] text-text-primary">Authorize</Text>
          <View className="size-11" />
        </View>
        <PasscodeInput
          subtitle={`Enter PIN to send ₦${parsedAmount.toLocaleString()} to ${accountName}`}
          length={4}
          value={passkey.authPasscode}
          onValueChange={passkey.onAuthPasscodeChange}
          onComplete={lockoutUntil ? undefined : onPasscodeComplete}
          errorText={passkey.authError}
          autoSubmit
          variant="light"
          className="mt-3 flex-1"
        />
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STEP: Amount (red keypad)
  // ═══════════════════════════════════════════════════════════════════════
  if (step === 'amount') {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: BRAND_RED }} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={BRAND_RED} />
        <View className="flex-1 px-5">
          <Animated.View entering={FadeIn.duration(400)} className="flex-row items-center justify-between pb-2 pt-1">
            <Pressable className="size-11 items-center justify-center rounded-full bg-white/20" onPress={goBack}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#FFFFFF" />
            </Pressable>
            <View className="items-center">
              <Text className="font-subtitle text-[17px] text-white">Withdraw Naira</Text>
              <Text className="mt-0.5 font-body text-[12px] text-white/70" numberOfLines={1}>
                To {accountName}
              </Text>
            </View>
            <View className="size-11" />
          </Animated.View>

          <View className="flex-1 items-center justify-center px-2">
            <Text className="font-body text-[13px] text-white/80">Enter amount in NGN</Text>
            <View className="mt-2">
              <AnimatedAmount amount={toDisplayAmount(rawAmount)} prefix="₦" />
            </View>
            {offRampRate > 0 && parsedAmount > 0 && (
              <Animated.View entering={FadeIn.duration(300)}>
                <Text className="mt-2 text-center font-body text-[13px] text-white/90">
                  ≈ ${estimatedUSDC.toFixed(2)} USDC at ₦{offRampRate.toLocaleString()}/USD
                </Text>
              </Animated.View>
            )}
            <Animated.View entering={FadeInUp.delay(200).duration(400)} className="mt-6 flex-row items-center justify-center gap-2">
              <View className="flex-row items-center rounded-full bg-white/20 px-3 py-2">
                <Text className="font-body text-[13px] text-white/90">Balance: ${formatCurrency(availableBalance)}</Text>
              </View>
              <Pressable
                className="rounded-full bg-white/30 px-3 py-2"
                onPress={() => {
                  const maxNGN = Math.floor((availableBalance - railFeeUSD) * offRampRate);
                  if (maxNGN > 0 && offRampRate > 0) setRawAmount(String(maxNGN));
                }}>
                <Text className="font-subtitle text-[13px] text-white">Max</Text>
              </Pressable>
            </Animated.View>
            {offRampRate > 0 && (
              <Animated.View entering={FadeIn.delay(300).duration(300)} className="mt-3">
                <Text className="text-center font-body text-[12px] text-white/60">
                  Rate: ₦{offRampRate.toLocaleString()}/USD · Fee: ₦{Math.round(railFeeUSD * offRampRate).toLocaleString()}
                </Text>
              </Animated.View>
            )}
          </View>

          <Animated.View entering={SlideInUp.delay(100).duration(500)} className="pb-3 pt-1">
            <Button title="Continue" onPress={() => { if (needsPajSession) { router.push('/paj-verify'); return; } setStep('recipients'); }} disabled={!canContinueAmount} variant="white" />
            {parsedAmount > 0 && parsedAmount < minWithdrawalNGN && (
              <Text className="mt-2 text-center font-body text-[12px] text-white/70">Minimum withdrawal is ₦{minWithdrawalNGN.toLocaleString()}</Text>
            )}
          </Animated.View>

          <Animated.View entering={SlideInUp.delay(100).duration(500)}>
            <Keypad className="pb-2" onKeyPress={onAmountKeyPress} backspaceIcon="delete" variant="dark" leftKey="decimal" />
          </Animated.View>
          <View style={{ paddingBottom: Math.max(insets.bottom, 12) }} />
        </View>
        <Text className="absolute bottom-2 left-0 right-0 text-center font-body text-[11px] text-white/40">Powered by Paj Cash</Text>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STEPS: Confirm + Polling (white background)
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1">
          <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
            <View className="flex-row items-center pb-2 pt-1">
              {step !== 'polling' && (
                <Pressable className="size-11 items-center justify-center rounded-full bg-surface" onPress={goBack}>
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#111827" />
                </Pressable>
              )}
            </View>

            {step === 'confirm' && (
              <Animated.View entering={FadeInDown.duration(300)}>
                {/* Amount hero — matches crypto confirm screen */}
                <Animated.View entering={FadeInUp.duration(250)} className="items-center py-8">
                  <View className="mb-3 size-14 items-center justify-center overflow-hidden rounded-full">
                    <NgnIcon width={56} height={56} />
                  </View>
                  <Text className="font-mono-semibold text-[42px] leading-[46px] text-text-primary" style={{ letterSpacing: -1 }}>
                    ₦{parsedAmount.toLocaleString()}
                  </Text>
                  <Text className="mt-1 font-body text-[14px] text-text-secondary">≈ ${estimatedUSDC.toFixed(2)} USDC</Text>
                </Animated.View>

                {/* Destination card */}
                <Text className="mb-2 ml-1 font-body text-[12px] uppercase tracking-wider text-text-secondary">Destination</Text>
                <View className="overflow-hidden rounded-3xl bg-surface">
                  {([
                    ['Recipient', accountName],
                    ['Bank', selectedBank?.name],
                    ['Account', accountNumber],
                  ] as [string, string | undefined][]).map(([label, value], i, arr) => (
                    <React.Fragment key={label}>
                      <View className="flex-row items-center justify-between px-5 py-4">
                        <Text className="font-body text-[14px] text-text-secondary">{label}</Text>
                        <Text className="font-subtitle text-[14px] text-text-primary">{value}</Text>
                      </View>
                      {i < arr.length - 1 && <View className="mx-5 h-px bg-gray-100" />}
                    </React.Fragment>
                  ))}
                </View>

                {/* Transaction card — fee matches backend RailNGNWithdrawalFee constant */}
                <Text className="mb-2 ml-1 mt-4 font-body text-[12px] uppercase tracking-wider text-text-secondary">Transaction</Text>
                <View className="overflow-hidden rounded-3xl bg-surface">
                  {([
                    ['Rate', `₦${offRampRate.toLocaleString()}/USD`],
                    ['Rail fee', `₦${offRampRate > 0 ? Math.round(railFeeUSD * offRampRate).toLocaleString() : '—'}`],
                    ['Total', `₦${offRampRate > 0 ? Math.round((estimatedUSDC + railFeeUSD) * offRampRate).toLocaleString() : parsedAmount.toLocaleString()}`],
                  ] as [string, string][]).map(([label, value], i, arr) => (
                    <React.Fragment key={label}>
                      <View className="flex-row items-center justify-between px-5 py-4">
                        <Text className={`${label === 'Total' ? 'font-subtitle' : 'font-body'} text-[14px] ${label === 'Total' ? 'text-text-primary' : 'text-text-secondary'}`}>{label}</Text>
                        <Text className={`font-subtitle text-[${label === 'Total' ? '16' : '14'}px] text-text-primary`}>{value}</Text>
                      </View>
                      {i < arr.length - 1 && <View className="mx-5 h-px bg-gray-100" />}
                    </React.Fragment>
                  ))}
                </View>
              </Animated.View>
            )}

            {step === 'polling' && (
              <View className="flex-1 items-center justify-center" style={{ minHeight: 400 }}>
                {isCompleted && <Confetti />}

                {isCompleted ? (
                  <Animated.View entering={FadeInDown.duration(400)} className="items-center px-4">
                    <Animated.View entering={FadeIn.delay(100).duration(300)} className="mb-6 size-20 items-center justify-center rounded-full bg-[#ECFDF5]">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={40} color="#10B981" />
                    </Animated.View>
                    <Animated.Text entering={FadeInDown.delay(200).duration(400)} className="font-mono-semibold text-[36px] text-text-primary" style={{ letterSpacing: -1 }}>
                      ₦{parsedAmount.toLocaleString()}
                    </Animated.Text>
                    <Animated.Text entering={FadeIn.delay(350).duration(300)} className="mt-3 font-subtitle text-[20px] text-text-primary">
                      Withdrawal sent
                    </Animated.Text>
                    <Animated.Text entering={FadeIn.delay(450).duration(300)} className="mt-2 text-center font-body text-[14px] leading-[20px] text-text-secondary">
                      On its way to {accountName} at {selectedBank?.name}
                    </Animated.Text>
                    <Animated.View entering={FadeInDown.delay(550).duration(400)} className="mt-10 w-full gap-3">
                      <Button title="Share receipt" variant="black" onPress={() => {
                        Share.share({ message: `Rail Money\n\nWithdrawal Receipt\n━━━━━━━━━━━━━━━━━━\nAmount: ₦${parsedAmount.toLocaleString()}\nTo: ${accountName}\nBank: ${selectedBank?.name}\nAccount: ${accountNumber}\nDate: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}\nStatus: Completed\n━━━━━━━━━━━━━━━━━━\nSent via Rail Money` });
                      }} />
                      <Button title="Done" variant="white" onPress={safeGoBack} />
                    </Animated.View>
                  </Animated.View>
                ) : isFailed ? (
                  <Animated.View entering={FadeInDown.duration(400)} className="items-center px-4">
                    <Animated.View entering={FadeIn.delay(100).duration(300)} className="mb-6 size-20 items-center justify-center rounded-full bg-[#FEF2F2]">
                      <HugeiconsIcon icon={Cancel01Icon} size={36} color="#EF4444" />
                    </Animated.View>
                    <Animated.Text entering={FadeInDown.delay(200).duration(400)} className="font-subtitle text-[20px] text-text-primary">
                      Withdrawal failed
                    </Animated.Text>
                    <Animated.Text entering={FadeIn.delay(350).duration(300)} className="mt-2 text-center font-body text-[14px] leading-[20px] text-text-secondary">
                      Your funds have been returned to your balance.{'\n'}Please try again.
                    </Animated.Text>
                    <Animated.View entering={FadeInDown.delay(450).duration(400)} className="mt-10 w-full gap-3">
                      <Button title="Try again" variant="black" onPress={() => { setStep('confirm'); setOrderId(''); setPollingTimedOut(false); }} />
                      <Button title="Go home" variant="white" onPress={safeGoBack} />
                    </Animated.View>
                  </Animated.View>
                ) : (
                  <Animated.View entering={FadeInDown.duration(400)} className="items-center px-4">
                    <Animated.View entering={FadeIn.delay(100).duration(300)} className="mb-6 size-20 items-center justify-center rounded-full bg-[#FFF7ED]">
                      <ActivityIndicator size="small" color="#EA580C" />
                    </Animated.View>
                    <Animated.Text entering={FadeInDown.delay(200).duration(400)} className="font-subtitle text-[20px] text-text-primary">
                      {pollingTimedOut ? 'Taking longer than expected' : 'Processing'}
                    </Animated.Text>
                    <Animated.Text entering={FadeIn.delay(350).duration(300)} className="mt-2 text-center font-body text-[14px] leading-[20px] text-text-secondary">
                      {pollingTimedOut
                        ? 'Your withdrawal is still being processed.\nCheck back in your transaction history.'
                        : `Sending ₦${parsedAmount.toLocaleString()} to ${selectedBank?.name}`}
                    </Animated.Text>
                    {!pollingTimedOut && (
                      <Animated.Text entering={FadeIn.delay(450).duration(300)} className="mt-3 text-center font-body text-[12px] text-text-secondary/60">
                        Usually arrives in 2–5 minutes
                      </Animated.Text>
                    )}
                    <Animated.View entering={FadeInDown.delay(500).duration(400)} className="mt-10 w-full">
                      <Button title="Done" variant="white" onPress={safeGoBack} />
                      <Text className="mt-2 text-center font-body text-[12px] text-text-secondary">
                        We'll notify you when it's complete
                      </Text>
                    </Animated.View>
                  </Animated.View>
                )}
              </View>
            )}

            <Text className="mb-8 mt-8 text-center font-body text-[11px] text-[#9CA3AF]">Powered by Paj Cash</Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {step === 'confirm' && (
        <View className="flex-row gap-3 border-t border-gray-100 bg-white px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <View className="flex-1">
            <Button title="Cancel" variant="ghost" onPress={safeGoBack} />
          </View>
          <View className="flex-[2]">
            <Button title="Confirm & Send" variant="orange" onPress={() => { passkey.setAuthError(''); passkey.onAuthPasscodeChange(''); setStep('auth'); }} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
