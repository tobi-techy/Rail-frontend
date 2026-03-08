/**
 * P2P Send Screen
 *
 * Flow:
 *   1. Red amount keypad (full screen) — user enters amount, taps Continue
 *   2. BottomSheet slides up over the red screen:
 *        - "Send $X to" headline
 *        - Unified search bar (RailTag / email / phone — all in one)
 *        - Recents list
 *        - Contacts section header
 *      → tap a recipient → note input appears inline in same sheet
 *        - "Send $X to [Avatar] Name for ___"
 *        - Continue / Send button
 *   3. Success overlay
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, AlertTriangle, CheckCircle2, Search, X } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useStation, useVerifyPasscode } from '@/api/hooks';
import { Button } from '@/components/ui';
import { Keypad } from '@/components/molecules/Keypad';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';
import { useAuthStore } from '@/stores/authStore';
import { SessionManager } from '@/utils/sessionManager';
import { usePasskeyAuthorize } from '@/hooks/usePasskeyAuthorize';
import {
  safeName,
  formatCurrency,
  formatMaxAmount,
  normalizeAmount,
  toDisplayAmount,
} from './utils';
import { WithdrawConfirmSheet } from './sections';
import {
  p2pService,
  type P2PLookupResponse,
  type P2PRecentRecipient,
} from '@/api/services/p2p.service';
import { BRAND_RED, gentleSpring, springConfig } from './constants';
import { AnimatedAmount } from './AnimatedAmount';
import { parseApiError, isPasscodeSessionError } from '@/utils/apiError';

const MAX_DIGITS = 12;
const P2P_LIMIT = 10_000;
const SHEET_SPRING = { damping: 30, stiffness: 400, mass: 0.8 };

// ── Helpers ───────────────────────────────────────────────────────────────────

function displayName(r?: P2PRecentRecipient | P2PLookupResponse['user'] | null): string {
  if (!r) return '';
  const full = `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim();
  return full || r.railTag || '';
}

function initials(r?: P2PRecentRecipient | P2PLookupResponse['user'] | null): string {
  if (!r) return '?';
  const f = r.firstName?.[0] ?? '';
  const l = r.lastName?.[0] ?? '';
  return (f + l).toUpperCase() || (r.railTag?.[1] ?? '?').toUpperCase();
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ chars, size = 44 }: { chars: string; size?: number }) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#EBEBEB' }}
      className="items-center justify-center">
      <Text style={{ fontSize: size * 0.38, fontFamily: 'SF-Pro-Rounded-Medium', color: '#111' }}>
        {chars}
      </Text>
    </View>
  );
}

// ── Recipient row ─────────────────────────────────────────────────────────────

function RecipientRow({
  name,
  sub,
  chars,
  onPress,
}: {
  name: string;
  sub?: string;
  chars: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  return (
    <Animated.View style={useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))}>
      <Pressable
        className="flex-row items-center gap-3 py-3"
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 20, stiffness: 300 });
        }}>
        <Avatar chars={chars} />
        <View className="flex-1">
          <Text className="font-subtitle text-[15px] text-text-primary">{name}</Text>
          {sub ? <Text className="font-body text-[13px] text-text-secondary">{sub}</Text> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Recipient {
  identifier: string;
  name: string;
  chars: string;
  isUser: boolean;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function P2PSendScreenContent() {
  const insets = useSafeAreaInsets();
  const { data: station } = useStation();
  const balance = Math.max(0, parseFloat(station?.spend_balance ?? '0') || 0);
  const user = useAuthStore((s) => s.user as { email?: string } | undefined);

  // amount state
  const [rawAmount, setRawAmount] = useState('0');
  const numericAmount = parseFloat(rawAmount) || 0;
  const maxSend = Math.min(P2P_LIMIT, balance);
  const amountOk = numericAmount > 0 && numericAmount <= maxSend;

  // sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<P2PLookupResponse | null>(null);
  const [isLooking, setIsLooking] = useState(false);
  const [recents, setRecents] = useState<P2PRecentRecipient[]>([]);
  const [selected, setSelected] = useState<Recipient | null>(null);
  const [pendingNonUserRecipient, setPendingNonUserRecipient] = useState<Recipient | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  // auth gate
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);
  const [pinAttempts, setPinAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutSecondsRemaining, setLockoutSecondsRemaining] = useState(0);
  const noteRef = useRef<TextInput>(null);

  const { mutate: verifyPasscode, isPending: isPasscodeVerifying } = useVerifyPasscode();

  useEffect(() => {
    const { Passkey } = require('react-native-passkey');
    setPasskeyAvailable(Passkey.isSupported() && Boolean(safeName(user?.email)));
  }, [user?.email]);

  // Lockout countdown
  useEffect(() => {
    if (!lockoutUntil) return;
    const tick = setInterval(() => {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setLockoutSecondsRemaining(0);
        setPinAttempts(0);
      } else {
        setLockoutSecondsRemaining(remaining);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [lockoutUntil]);

  const doSend = useCallback(async () => {
    if (!selected) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await p2pService.send({
        identifier: selected.identifier,
        amount: numericAmount.toFixed(2),
        note: note.trim() || undefined,
      });
      setSheetOpen(false);
      setSuccess(true);
    } catch (e: unknown) {
      if (isPasscodeSessionError(e)) {
        setShowAuthScreen(true);
        passkey.setAuthError('Authorization expired. Please verify your PIN again.');
        return;
      }
      setSubmitError(parseApiError(e, 'Send failed. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [selected, numericAmount, note]);

  const passkeyPromptScope = `p2p-send:${safeName(user?.email) || 'unknown'}:${numericAmount.toFixed(2)}`;

  const passkey = usePasskeyAuthorize({
    email: user?.email,
    passkeyPromptScope,
    autoTrigger: showAuthScreen && passkeyAvailable,
    onAuthorized: doSend,
  });

  const onPasscodeAuthorize = useCallback(
    (code: string) => {
      if (isPasscodeVerifying || isSubmitting || lockoutUntil) return;
      passkey.setAuthError('');
      verifyPasscode(
        { passcode: code },
        {
          onSuccess: (result) => {
            if (!result.verified) {
              const next = pinAttempts + 1;
              setPinAttempts(next);
              if (next >= 5) {
                const until = Date.now() + 30_000;
                setLockoutUntil(until);
                setLockoutSecondsRemaining(30);
                passkey.setAuthError('Too many failed attempts. Try again in 30s.');
              } else {
                passkey.setAuthError(
                  `Invalid PIN. ${5 - next} attempt${5 - next !== 1 ? 's' : ''} remaining.`
                );
              }
              passkey.onAuthPasscodeChange('');
              return;
            }
            setPinAttempts(0);
            setLockoutUntil(null);
            setShowAuthScreen(false);
            void doSend();
          },
          onError: (err: unknown) => {
            passkey.setAuthError(parseApiError(err, 'Failed to verify PIN.'));
            passkey.onAuthPasscodeChange('');
          },
        }
      );
    },
    [isPasscodeVerifying, isSubmitting, lockoutUntil, doSend, passkey, pinAttempts, verifyPasscode]
  );

  const submit = useCallback(() => {
    if (!selected) return;
    setShowConfirmSheet(true);
  }, [selected]);

  const onConfirmSend = useCallback(() => {
    setShowConfirmSheet(false);
    passkey.setAuthError('');
    passkey.onAuthPasscodeChange('');
    setShowAuthScreen(true);
  }, [passkey]);

  // amount screen animations
  const pillsScale = useSharedValue(0.9);
  const pillsOpacity = useSharedValue(0);
  useEffect(() => {
    if (numericAmount > 0) {
      pillsScale.value = withSpring(1, springConfig);
      pillsOpacity.value = withTiming(1, { duration: 250 });
    } else {
      pillsScale.value = withSpring(0.9, gentleSpring);
      pillsOpacity.value = withTiming(0.5, { duration: 200 });
    }
  }, [rawAmount]);
  const pillsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pillsScale.value }],
    opacity: pillsOpacity.value,
  }));

  // sheet slide animation
  const translateY = useSharedValue(800);
  const keyboardOffset = useSharedValue(0);
  const openSheet = useCallback(() => {
    setSheetOpen(true);
    translateY.value = withSpring(0, SHEET_SPRING);
  }, []);
  const closeSheet = useCallback(() => {
    translateY.value = withSpring(800, SHEET_SPRING, () => runOnJS(setSheetOpen)(false));
    setSelected(null);
    setQuery('');
    setNote('');
    setSubmitError('');
  }, []);
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    bottom: 12 + insets.bottom + keyboardOffset.value,
  }));

  // Lift sheet when keyboard appears
  useEffect(() => {
    if (!sheetOpen) return;
    const KB_SPRING = { damping: 22, stiffness: 280, mass: 0.8 };
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = Keyboard.addListener(showEvent, (e) => {
      keyboardOffset.value = withSpring(e.endCoordinates.height - insets.bottom, KB_SPRING);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      keyboardOffset.value = withSpring(0, KB_SPRING);
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [sheetOpen, insets.bottom, keyboardOffset]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 800) runOnJS(closeSheet)();
      else translateY.value = withSpring(0, SHEET_SPRING);
    });

  // load recents
  useEffect(() => {
    p2pService
      .getRecentRecipients()
      .then(setRecents)
      .catch(() => {});
  }, []);

  // debounced lookup
  useEffect(() => {
    if (query.length < 2) {
      setLookupResult(null);
      return;
    }
    const t = setTimeout(async () => {
      setIsLooking(true);
      try {
        setLookupResult(await p2pService.lookup(query.trim()));
      } catch {
        setLookupResult(null);
      } finally {
        setIsLooking(false);
      }
    }, 380);
    return () => clearTimeout(t);
  }, [query]);

  // keypad
  const onKey = useCallback(
    (key: string) => {
      setRawAmount((cur) => {
        if (key === 'backspace') return cur === '0' ? cur : normalizeAmount(cur.slice(0, -1));
        if (key === 'decimal') return cur.includes('.') ? cur : `${cur}.`;
        if (!/^\d$/.test(key)) return cur;
        if (cur.includes('.')) {
          const [i, d = ''] = cur.split('.');
          return d.length >= 2 ? cur : `${i}.${d}${key}`;
        }
        const next = (cur === '0' ? key : `${cur}${key}`).replace(/^0+(?=\d)/, '') || '0';
        if (next.length > MAX_DIGITS) return cur;
        if (parseFloat(next) > maxSend) return formatMaxAmount(maxSend);
        return next;
      });
    },
    [maxSend]
  );

  const pickRecipient = useCallback((r: Recipient) => {
    Keyboard.dismiss();
    if (!r.isUser) {
      // Show non-user confirmation before proceeding
      setPendingNonUserRecipient(r);
      return;
    }
    setSelected(r);
    setTimeout(() => noteRef.current?.focus(), 300);
  }, []);

  const confirmNonUserRecipient = useCallback(() => {
    if (!pendingNonUserRecipient) return;
    setSelected(pendingNonUserRecipient);
    setPendingNonUserRecipient(null);
    setTimeout(() => noteRef.current?.focus(), 300);
  }, [pendingNonUserRecipient]);

  // ── Success screen ────────────────────────────────────────────────────────
  // ── Auth screen ───────────────────────────────────────────────────────────
  if (showAuthScreen) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
          <Pressable
            className="size-11 items-center justify-center rounded-full bg-gray-100"
            onPress={() => setShowAuthScreen(false)}>
            <ArrowLeft size={20} color="#111" />
          </Pressable>
          <Text className="font-subtitle text-[20px] text-text-primary">Confirm send</Text>
          <View className="size-11" />
        </View>
        <View className="mx-5 mt-2 rounded-2xl bg-surface px-4 py-3">
          <View className="flex-row items-center justify-between">
            <Text className="font-body text-[13px] text-text-secondary">Amount</Text>
            <Text className="font-subtitle text-[15px] text-text-primary">
              ${formatCurrency(numericAmount)}
            </Text>
          </View>
          <View className="mt-1 flex-row items-center justify-between">
            <Text className="font-body text-[13px] text-text-secondary">To</Text>
            <Text className="font-subtitle text-[15px] text-text-primary">{selected?.name}</Text>
          </View>
        </View>
        {!!lockoutUntil && (
          <View className="mx-5 mt-3 rounded-xl bg-red-50 px-4 py-3">
            <Text className="font-subtitle text-[13px] text-red-600">
              Too many failed attempts. Try again in {lockoutSecondsRemaining}s.
            </Text>
          </View>
        )}
        {!lockoutUntil && pinAttempts > 0 && pinAttempts < 5 && (
          <View className="mx-5 mt-3 rounded-xl bg-amber-50 px-4 py-3">
            <Text className="font-body text-[13px] text-amber-700">
              {5 - pinAttempts} attempt{5 - pinAttempts !== 1 ? 's' : ''} remaining before lockout.
            </Text>
          </View>
        )}
        <PasscodeInput
          subtitle="Enter your PIN to confirm this send"
          length={4}
          value={passkey.authPasscode}
          onValueChange={passkey.onAuthPasscodeChange}
          onComplete={lockoutUntil ? undefined : onPasscodeAuthorize}
          errorText={passkey.authError}
          showToggle
          showFingerprint={passkeyAvailable}
          onFingerprint={lockoutUntil ? undefined : passkey.onPasskeyAuthorize}
          autoSubmit
          variant="light"
          className="mt-3 flex-1"
        />
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <Animated.View
          entering={FadeInDown.springify().damping(18)}
          className="flex-1 items-center justify-center px-8">
          <View className="mb-6 size-20 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 size={36} color="#10B981" />
          </View>
          <Text className="text-center font-subtitle text-[32px] leading-[38px] text-text-primary">
            ${formatCurrency(numericAmount)}
            {'\n'}sent
          </Text>
          <Text className="mt-3 text-center font-body text-[15px] text-text-secondary">
            {selected?.isUser
              ? `${selected.name} will receive it instantly.`
              : `${selected?.name} will get an invite to claim it.`}
          </Text>
          {note ? (
            <View className="mt-4 rounded-2xl bg-surface px-5 py-3">
              <Text className="text-center font-body text-[14px] text-text-secondary">
                &quot;{note}&quot;
              </Text>
            </View>
          ) : null}
          <Button title="Done" className="mt-10 w-full" onPress={() => router.back()} />
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ── Amount screen (red keypad) ────────────────────────────────────────────
  return (
    <>
      <SafeAreaView className="flex-1" style={{ backgroundColor: BRAND_RED }} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={BRAND_RED} />

        <View className="flex-1 px-5">
          {/* Header */}
          <Animated.View
            entering={FadeIn.duration(350)}
            className="flex-row items-center justify-between pb-2 pt-1">
            <Pressable
              className="size-11 items-center justify-center rounded-full bg-white/20"
              onPress={() => router.back()}>
              <ArrowLeft size={20} color="#fff" />
            </Pressable>
            <Text className="font-subtitle text-[17px] text-white">Send to People</Text>
            <View className="size-11" />
          </Animated.View>

          {/* Amount */}
          <View className="flex-1 items-center justify-center">
            <Animated.View entering={FadeIn.delay(80).duration(350)}>
              <Text className="mb-2 text-center font-body text-[13px] text-white/70">
                How much?
              </Text>
            </Animated.View>
            <AnimatedAmount amount={toDisplayAmount(rawAmount)} />

            <Animated.View style={pillsStyle} className="mt-5 flex-row items-center gap-2">
              <View className="rounded-full bg-white/20 px-3 py-1.5">
                <Text className="font-body text-[13px] text-white/90">
                  Balance: ${formatCurrency(balance)}
                </Text>
              </View>
              <Pressable
                className="rounded-full bg-white px-4 py-1.5"
                onPress={() => setRawAmount(formatMaxAmount(maxSend))}>
                <Text className="font-subtitle text-[13px]" style={{ color: BRAND_RED }}>
                  Max
                </Text>
              </Pressable>
            </Animated.View>
          </View>

          {/* Keypad */}
          <Animated.View entering={FadeInUp.delay(120).duration(400)}>
            <Keypad
              className="pb-2"
              onKeyPress={onKey}
              backspaceIcon="delete"
              variant="dark"
              leftKey="decimal"
            />
          </Animated.View>
        </View>

        {/* Continue */}
        <View
          className="border-t border-white/20 px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <Button title="Continue" onPress={openSheet} disabled={!amountOk} variant="white" />
        </View>
      </SafeAreaView>

      {/* ── Recipient / Note sheet ── */}
      {sheetOpen && (
        <Modal
          visible
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={closeSheet}>
          <GestureHandlerRootView style={StyleSheet.absoluteFill}>
            {/* Blurred backdrop showing red screen behind */}
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={selected ? undefined : closeSheet}
              />
            </BlurView>

            <GestureDetector gesture={pan}>
              <Animated.View
                style={[
                  sheetStyle,
                  {
                    position: 'absolute',
                    left: 12,
                    right: 12,
                    borderRadius: 32,
                    backgroundColor: '#fff',
                    paddingTop: 12,
                    maxHeight: '88%',
                    overflow: 'hidden',
                  },
                ]}>
                {/* Drag handle */}
                <View className="mb-3 items-center">
                  <View className="h-1 w-10 rounded-full bg-gray-200" />
                </View>

                {/* ── No recipient selected: search ── */}
                {!selected ? (
                  <Animated.View entering={FadeIn.duration(200)} className="flex-1">
                    {/* Header row */}
                    <View className="flex-row items-start justify-between px-6 pb-4">
                      <View className="flex-1 pr-4">
                        <Text className="font-subtitle text-[28px] leading-[34px] text-text-primary">
                          Send{' '}
                          <Text style={{ color: BRAND_RED }}>${formatCurrency(numericAmount)}</Text>{' '}
                          <Text className="text-text-secondary">to</Text>
                        </Text>
                      </View>
                      <Pressable
                        className="mt-1 size-9 items-center justify-center rounded-full bg-surface"
                        onPress={closeSheet}
                        hitSlop={8}>
                        <X size={16} color="#6B7280" />
                      </Pressable>
                    </View>

                    {/* Search bar */}
                    <View
                      className="mx-6 mb-4 flex-row items-center gap-3 rounded-2xl bg-surface px-4"
                      style={{ height: 50 }}>
                      <Search size={17} color="#9CA3AF" />
                      <TextInput
                        className="flex-1 font-body text-[15px] text-text-primary"
                        placeholder="Name, @railtag, email, phone…"
                        placeholderTextColor="#9CA3AF"
                        value={query}
                        onChangeText={setQuery}
                        autoFocus
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="search"
                      />
                      {isLooking ? (
                        <ActivityIndicator size="small" color="#9CA3AF" />
                      ) : query.length > 0 ? (
                        <Pressable
                          onPress={() => {
                            setQuery('');
                            setLookupResult(null);
                          }}
                          hitSlop={8}>
                          <X size={15} color="#9CA3AF" />
                        </Pressable>
                      ) : null}
                    </View>

                    <ScrollView
                      className="flex-1 px-6"
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={false}>
                      {/* Lookup results */}
                      {query.length >= 2 && lookupResult?.canSend && (
                        <Animated.View entering={FadeInDown.duration(220)}>
                          {lookupResult.found && lookupResult.user ? (
                            <RecipientRow
                              name={displayName(lookupResult.user)}
                              sub={lookupResult.user.railTag}
                              chars={initials(lookupResult.user)}
                              onPress={() =>
                                pickRecipient({
                                  identifier: query.trim(),
                                  name: displayName(lookupResult.user),
                                  chars: initials(lookupResult.user),
                                  isUser: true,
                                })
                              }
                            />
                          ) : (
                            <RecipientRow
                              name={query.trim()}
                              sub={
                                lookupResult.message ?? "Not on Rail yet — they'll get an invite"
                              }
                              chars={(query.trim()[0] ?? '?').toUpperCase()}
                              onPress={() =>
                                pickRecipient({
                                  identifier: query.trim(),
                                  name: query.trim(),
                                  chars: (query.trim()[0] ?? '?').toUpperCase(),
                                  isUser: false,
                                })
                              }
                            />
                          )}
                        </Animated.View>
                      )}

                      {/* Recents */}
                      {!query && recents.length > 0 && (
                        <Animated.View entering={FadeInDown.delay(60).duration(300)}>
                          {recents.map((r) => (
                            <RecipientRow
                              key={r.recipientId}
                              name={displayName(r)}
                              sub={r.railTag}
                              chars={initials(r)}
                              onPress={() =>
                                pickRecipient({
                                  identifier: r.railTag ?? r.recipientId,
                                  name: displayName(r),
                                  chars: initials(r),
                                  isUser: true,
                                })
                              }
                            />
                          ))}
                        </Animated.View>
                      )}

                      {/* Contacts section header */}
                      {!query && (
                        <Animated.View entering={FadeInDown.delay(120).duration(300)}>
                          <Text className="mb-1 mt-4 font-subtitle text-[17px] text-text-primary">
                            Contacts
                          </Text>
                          <Text className="font-body text-[13px] text-text-secondary">
                            Search above to find someone by name, @railtag, or email.
                          </Text>
                        </Animated.View>
                      )}

                      <View style={{ height: 32 }} />
                    </ScrollView>
                  </Animated.View>
                ) : (
                  /* ── Recipient selected: note input ── */
                  <Animated.View entering={FadeInDown.duration(280)} className="px-6 pb-4">
                    {/* Back + headline */}
                    <Pressable
                      className="mb-4 size-9 items-center justify-center rounded-full bg-surface"
                      onPress={() => {
                        setSelected(null);
                        setNote('');
                        setSubmitError('');
                      }}>
                      <ArrowLeft size={16} color="#111" />
                    </Pressable>

                    {/* "Send $X to [Avatar] Name for" */}
                    <View className="mb-5">
                      <Text className="font-subtitle text-[26px] leading-[32px] text-text-primary">
                        Send{' '}
                        <Text style={{ color: BRAND_RED }}>${formatCurrency(numericAmount)}</Text>
                        {'\n'}to
                      </Text>
                      <View className="mt-1 flex-row items-center gap-2">
                        <Avatar chars={selected.chars} size={28} />
                        <Text className="font-subtitle text-[26px] text-text-primary">
                          {selected.name.split(' ')[0]}
                        </Text>
                        <Text className="font-subtitle text-[26px] text-text-secondary">for</Text>
                      </View>
                    </View>

                    {/* Note input — inline Cash App style */}
                    <View className="mb-5 flex-row items-center border-b border-gray-200 pb-3">
                      <TextInput
                        ref={noteRef}
                        className="flex-1 font-body text-[17px] text-text-primary"
                        placeholder="What's it for?"
                        placeholderTextColor="#9CA3AF"
                        value={note}
                        onChangeText={setNote}
                        maxLength={255}
                        returnKeyType="done"
                        blurOnSubmit
                      />
                      {note.length > 0 && (
                        <Pressable
                          onPress={submit}
                          className="ml-3 items-center justify-center rounded-full px-4 py-2"
                          style={{ backgroundColor: BRAND_RED }}>
                          <Text className="font-subtitle text-[14px] text-white">Send</Text>
                        </Pressable>
                      )}
                    </View>

                    {submitError ? (
                      <Animated.View entering={FadeIn.duration(200)} className="mb-3">
                        <Text className="font-body text-[13px] text-red-500">{submitError}</Text>
                      </Animated.View>
                    ) : null}

                    <Button
                      title={isSubmitting ? 'Sending…' : `Send $${formatCurrency(numericAmount)}`}
                      onPress={submit}
                      disabled={isSubmitting}
                      loading={isSubmitting}
                    />
                    <Pressable className="mt-3 items-center py-2" onPress={submit}>
                      <Text className="font-body text-[14px] text-text-secondary">Skip note</Text>
                    </Pressable>
                  </Animated.View>
                )}
              </Animated.View>
            </GestureDetector>
          </GestureHandlerRootView>
        </Modal>
      )}

      {/* ── Transaction confirm sheet ── */}
      <WithdrawConfirmSheet
        visible={showConfirmSheet}
        onClose={() => setShowConfirmSheet(false)}
        onConfirm={onConfirmSend}
        numericAmount={numericAmount}
        isFiatMethod={false}
        isCryptoMethod={false}
        isP2PMethod
        isFundFlow={false}
        methodTitle="Send to People"
        recipientName={selected?.name}
        recipientIdentifier={selected?.identifier}
        note={note || undefined}
      />

      {/* ── Non-user confirmation modal ── */}
      {!!pendingNonUserRecipient && (
        <Modal visible transparent animationType="fade" statusBarTranslucent>
          <View
            style={StyleSheet.absoluteFill}
            className="items-center justify-center bg-black/50 px-6">
            <Animated.View
              entering={FadeInDown.springify().damping(20)}
              className="w-full rounded-3xl bg-white p-6">
              <View className="mb-4 size-12 items-center justify-center rounded-full bg-amber-50">
                <AlertTriangle size={24} color="#F59E0B" />
              </View>
              <Text className="font-subtitle text-[20px] text-text-primary">
                {pendingNonUserRecipient.name} isn&apos;t on Rail yet
              </Text>
              <Text className="mt-2 font-body text-[14px] text-text-secondary">
                They&apos;ll receive an invite to claim your ${formatCurrency(numericAmount)} once
                they sign up. Are you sure you want to continue?
              </Text>
              <Button title="Yes, continue" className="mt-5" onPress={confirmNonUserRecipient} />
              <Pressable
                className="mt-3 items-center py-2"
                onPress={() => setPendingNonUserRecipient(null)}>
                <Text className="font-body text-[14px] text-text-secondary">Cancel</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>
      )}
    </>
  );
}

export function P2PSendScreen() {
  return (
    <ErrorBoundary>
      <P2PSendScreenContent />
    </ErrorBoundary>
  );
}
