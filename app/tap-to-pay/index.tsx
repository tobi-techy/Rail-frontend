import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, Pressable, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withRepeat,
  withTiming,
  withDelay,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTapToPay, type NearbyPeer } from '@/hooks/useTapToPay';
import { useNearbyPermissions } from '@/hooks/useNearbyPermissions';
import { useAuthStore } from '@/stores/authStore';
import { useStation, useVerifyPasscode } from '@/api/hooks';
import { p2pService } from '@/api/services/p2p.service';
import { Keypad } from '@/components/molecules/Keypad';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';
import { Button } from '@/components/ui';
import { AnimatedAmount } from '@/app/withdraw/method-screen/AnimatedAmount';
import { normalizeAmount, formatCurrency, formatMaxAmount, toDisplayAmount } from '@/app/withdraw/method-screen/utils';
import { parseApiError } from '@/utils/apiError';
import { ArrowLeft01Icon, Wifi01Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

const BRAND_COLOR = '#FF2E01';
const DISCOVERY_TIMEOUT_MS = 20_000;
const MAX_DIGITS = 9;
const P2P_LIMIT = 10_000;

// ── Distance helpers ──────────────────────────────────────────────────────────

function distanceLabel(meters: number | undefined): string | null {
  if (meters == null) return null;
  if (meters < 0.15) return 'Right here';
  if (meters < 1) return `${Math.round(meters * 100)}cm`;
  return `${meters.toFixed(1)}m`;
}

function distanceColor(meters: number | undefined): string {
  if (meters == null) return '#10B981';
  if (meters < 0.15) return '#10B981'; // green — tap range
  if (meters < 1) return '#F59E0B';    // amber — close
  return '#9CA3AF';                     // gray — far
}

// ── Staggered Pulse Rings ─────────────────────────────────────────────────────

function PulseRing({ delay = 0, size = 128, haptic = false }: { delay?: number; size?: number; haptic?: boolean }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(withTiming(2.4, { duration: 2200, easing: Easing.out(Easing.ease) }), -1, false)
    );
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(0, { duration: 2200, easing: Easing.out(Easing.ease) }), -1, false)
    );
  }, []);

  useAnimatedReaction(
    () => scale.value,
    (current, previous) => {
      if (haptic && previous !== null && previous > 1.5 && current < 1.1) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  );

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[style, { width: size, height: size, borderRadius: size / 2 }]}
      className="absolute border-2 border-[#FF2E01]"
    />
  );
}

// ── Peer Avatar (discovery radar) ─────────────────────────────────────────────

function PeerAvatar({
  peer,
  distance,
  index,
  total,
  onPress,
}: {
  peer: NearbyPeer;
  distance: number | undefined;
  index: number;
  total: number;
  onPress: () => void;
}) {
  const angle = (index * (2 * Math.PI)) / Math.max(total, 1) - Math.PI / 2;
  // Closer peers orbit nearer to center when UWB distance is available
  const baseRadius = 140;
  const radius = distance != null ? Math.min(baseRadius, Math.max(80, distance * 100)) : baseRadius;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const dist = distanceLabel(distance);
  const color = distanceColor(distance);

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      entering={FadeIn.delay(index * 80).duration(400).springify().damping(16)}
      style={[animStyle, { position: 'absolute', transform: [{ translateX: x }, { translateY: y }] }]}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        onPressIn={() => { scale.value = withSpring(0.9, { damping: 18, stiffness: 300 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 18, stiffness: 300 }); }}
        className="items-center"
        style={{ width: 76 }}>
        <View className="mb-1.5 h-14 w-14 items-center justify-center rounded-full bg-[#FFF0ED]"
          style={{ shadowColor: BRAND_COLOR, shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}>
          <Text className="font-subtitle text-[20px] text-[#FF2E01]">
            {peer.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text className="font-subtitle text-[12px] text-[#070914]" numberOfLines={1}>
          {peer.displayName.split(' ')[0]}
        </Text>
        {dist && (
          <View className="mt-0.5 rounded-full px-2 py-0.5" style={{ backgroundColor: `${color}18` }}>
            <Text style={{ color, fontSize: 9, fontWeight: '600' }}>{dist}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ── Incoming Request ──────────────────────────────────────────────────────────

function IncomingRequest({
  senderName,
  amount,
  onAccept,
  onDecline,
}: {
  senderName: string;
  amount: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <Animated.View entering={FadeInUp.duration(400)} className="flex-1 items-center justify-center px-6">
      <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-[#FFF0ED]">
        <Text className="font-heading text-[32px] text-[#FF2E01]">
          {senderName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text className="font-subtitle text-[18px] text-[#070914]">{senderName}</Text>
      <Text className="mt-2 font-body text-[15px] text-[#9CA3AF]">wants to send you</Text>
      <Text className="font-heading mt-4 text-[48px] text-[#070914]">${amount}</Text>
      <View className="mt-12 w-full flex-row gap-3">
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onDecline(); }}
          className="flex-1 items-center rounded-2xl bg-[#FEF2F2] py-4">
          <Text className="font-subtitle text-[15px] text-[#EF4444]">Decline</Text>
        </Pressable>
        <Pressable
          onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onAccept(); }}
          className="flex-1 items-center rounded-2xl bg-[#070914] py-4">
          <Text className="font-subtitle text-[15px] text-white">Accept</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function TapToPayScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const railtag = user?.railTag || user?.email?.split('@')[0] || 'user';
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Rail User';
  const { data: station } = useStation();
  const balance = Math.max(0, parseFloat(station?.spend_balance ?? '0') || 0);
  const maxSend = Math.min(P2P_LIMIT, balance);

  const {
    peers, peerDistances, incomingRequest, transferAccepted, transferDeclined,
    isSupported, start, stop, sendIntent, respond,
  } = useTapToPay(railtag, displayName);

  const { status: permStatus, request: requestPerms, openSettings } = useNearbyPermissions();

  // UI state
  const [selectedPeer, setSelectedPeer] = useState<NearbyPeer | null>(null);
  const [rawAmount, setRawAmount] = useState('0');
  const [success, setSuccess] = useState(false);
  const [sendError, setSendError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [discoveryTimedOut, setDiscoveryTimedOut] = useState(false);

  // Auth state
  const [showAuth, setShowAuth] = useState(false);
  const [authPasscode, setAuthPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [pinAttempts, setPinAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const { mutate: verifyPasscode, isPending: isVerifying } = useVerifyPasscode();
  const pendingSendRef = useRef<{ peer: NearbyPeer; amount: string; nonce: string } | null>(null);

  const numericAmount = parseFloat(rawAmount) || 0;
  const amountOk = numericAmount > 0;

  // Start/stop discovery (request permissions first on Android)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const granted = await requestPerms();
      if (!cancelled && granted) start();
    })();
    return () => { cancelled = true; stop(); };
  }, [start, stop, requestPerms]);

  // Discovery timeout
  useEffect(() => {
    if (peers.length > 0) { setDiscoveryTimedOut(false); return; }
    const t = setTimeout(() => { if (peers.length === 0) setDiscoveryTimedOut(true); }, DISCOVERY_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [peers.length]);

  // Lockout countdown
  useEffect(() => {
    if (!lockoutUntil) return;
    const tick = setInterval(() => {
      const rem = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (rem <= 0) { setLockoutUntil(null); setLockoutSeconds(0); setPinAttempts(0); }
      else setLockoutSeconds(rem);
    }, 1000);
    return () => clearInterval(tick);
  }, [lockoutUntil]);

  // Handle transfer accepted
  useEffect(() => {
    if (!transferAccepted || !pendingSendRef.current) return;
    const { nonce } = transferAccepted;
    const pending = pendingSendRef.current;
    pendingSendRef.current = null; // clear immediately to prevent double-confirm
    if (nonce !== pending.nonce) {
      setSendError('Transfer response did not match. Please try again.');
      return;
    }
    (async () => {
      setIsSending(true);
      setSendError('');
      try {
        const idempotencyKey = `tap-${pending.nonce}-${Date.now()}`;
        await p2pService.tapConfirm({ nonce: pending.nonce, idempotencyKey });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccess(true);
      } catch (e) {
        setSendError(parseApiError(e, 'Transfer failed. Please try again.'));
      } finally {
        setIsSending(false);
      }
    })();
  }, [transferAccepted]);

  // Keypad handler
  const onKey = useCallback((key: string) => {
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
      if (maxSend > 0 && parseFloat(next) > maxSend) return formatMaxAmount(maxSend);
      return next;
    });
  }, [maxSend]);

  const onContinue = useCallback(() => {
    if (!selectedPeer || !amountOk) return;
    setAuthPasscode('');
    setAuthError('');
    setShowAuth(true);
  }, [selectedPeer, amountOk]);

  const onAuthorized = useCallback(async () => {
    setShowAuth(false);
    if (!selectedPeer) return;
    try {
      const intentResp = await p2pService.tapIntent({
        recipientRailtag: selectedPeer.railtag,
        amount: parseFloat(rawAmount).toFixed(2),
      });
      pendingSendRef.current = { peer: selectedPeer, amount: rawAmount, nonce: intentResp.nonce };
      sendIntent(selectedPeer.peerId, rawAmount, intentResp.nonce);
    } catch (e) {
      setSendError(parseApiError(e, 'Could not create transfer. Please try again.'));
    }
  }, [selectedPeer, rawAmount, sendIntent]);

  const onPasscodeComplete = useCallback((code: string) => {
    if (isVerifying || lockoutUntil) return;
    setAuthError('');
    verifyPasscode({ passcode: code }, {
      onSuccess: (result) => {
        if (!result.verified) {
          const next = pinAttempts + 1;
          setPinAttempts(next);
          if (next >= 5) {
            setLockoutUntil(Date.now() + 30_000);
            setLockoutSeconds(30);
            setAuthError('Too many attempts. Try again in 30s.');
          } else {
            setAuthError(`Invalid PIN. ${5 - next} attempt${5 - next !== 1 ? 's' : ''} left.`);
          }
          setAuthPasscode('');
          return;
        }
        setPinAttempts(0);
        onAuthorized();
      },
      onError: (err) => {
        setAuthError(parseApiError(err, 'Verification failed.'));
        setAuthPasscode('');
      },
    });
  }, [isVerifying, lockoutUntil, pinAttempts, verifyPasscode, onAuthorized]);

  const resetFlow = useCallback(() => {
    setSelectedPeer(null);
    setRawAmount('0');
    setSuccess(false);
    setSendError('');
    setIsSending(false);
    pendingSendRef.current = null;
  }, []);

  // Discovery status text
  const statusText = useMemo(() => {
    if (peers.length > 0) return 'Tap someone to send';
    if (discoveryTimedOut) return 'No one nearby';
    return 'Looking for nearby users…';
  }, [peers.length, discoveryTimedOut]);

  const subtitleText = useMemo(() => {
    if (peers.length > 0) {
      const count = peers.length;
      return `${count} ${count === 1 ? 'person' : 'people'} found nearby`;
    }
    if (discoveryTimedOut) return 'Make sure they have Tap to Pay open too';
    return 'Ask them to open Tap to Pay too';
  }, [peers.length, discoveryTimedOut]);

  // ── Permissions denied (Android) ────────────────────────────────────────
  if (permStatus === 'denied' || permStatus === 'blocked') {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-8">
        <View className="mb-5 h-16 w-16 items-center justify-center rounded-full bg-[#FFF0ED]">
          <HugeiconsIcon icon={Wifi01Icon} size={28} color="#FF2E01" />
        </View>
        <Text className="text-center font-subtitle text-[18px] text-[#070914]">
          Permissions required
        </Text>
        <Text className="mt-2 text-center font-body text-[14px] text-[#9CA3AF]">
          Tap to Pay needs Bluetooth and location access to find nearby users
        </Text>
        {permStatus === 'blocked' ? (
          <Button title="Open Settings" className="mt-6" onPress={openSettings} />
        ) : (
          <Button title="Grant Access" className="mt-6" onPress={async () => {
            const ok = await requestPerms();
            if (ok) start();
          }} />
        )}
        <Button title="Go back" variant="ghost" className="mt-3" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  // ── Not supported ─────────────────────────────────────────────────────────
  if (!isSupported) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-8">
        <View className="mb-5 h-16 w-16 items-center justify-center rounded-full bg-[#FFF0ED]">
          <HugeiconsIcon icon={Wifi01Icon} size={28} color="#FF2E01" />
        </View>
        <Text className="text-center font-subtitle text-[18px] text-[#070914]">
          Tap to Pay isn't available on this device
        </Text>
        <Text className="mt-2 text-center font-body text-[14px] text-[#9CA3AF]">
          This feature requires a compatible device
        </Text>
        <Button title="Go back" variant="ghost" className="mt-6" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  // ── Auth screen ───────────────────────────────────────────────────────────
  if (showAuth) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
          <Pressable
            className="size-11 items-center justify-center rounded-full bg-gray-100"
            onPress={() => setShowAuth(false)}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#111" />
          </Pressable>
          <Text className="font-subtitle text-[20px] text-text-primary">Confirm send</Text>
          <View className="size-11" />
        </View>
        <PasscodeInput
          subtitle={`Enter PIN to send $${formatCurrency(numericAmount)} to ${selectedPeer?.displayName}`}
          length={4}
          value={authPasscode}
          onValueChange={setAuthPasscode}
          onComplete={lockoutUntil ? undefined : onPasscodeComplete}
          errorText={authError}
          autoSubmit
          variant="light"
          className="mt-3 flex-1"
        />
      </SafeAreaView>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (success) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Animated.View entering={FadeInDown.springify().damping(18)} className="items-center px-8">
          <View className="mb-2 h-20 w-20 items-center justify-center rounded-full bg-[#ECFDF5]">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={48} color="#10B981" />
          </View>
          <Text className="mt-3 font-subtitle text-[22px] text-[#070914]">Sent!</Text>
          <Text className="mt-2 text-center font-body text-[15px] text-[#9CA3AF]">
            ${formatCurrency(numericAmount)} sent to {selectedPeer?.displayName}
          </Text>
          <Button title="Done" className="mt-10 w-full" onPress={() => { resetFlow(); router.back(); }} />
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ── Incoming request ──────────────────────────────────────────────────────
  if (incomingRequest) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" />
        <IncomingRequest
          senderName={incomingRequest.senderName}
          amount={incomingRequest.amount}
          onAccept={() => respond(incomingRequest.peerId, true, incomingRequest.nonce)}
          onDecline={() => respond(incomingRequest.peerId, false, '')}
        />
      </SafeAreaView>
    );
  }

  // ── Amount entry ──────────────────────────────────────────────────────────
  if (selectedPeer) {
    const peerDist = peerDistances[selectedPeer.peerId];
    const dist = distanceLabel(peerDist);

    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#FF2E01' }} edges={['top']}>
        <StatusBar barStyle="light-content" />
        <View className="flex-1 px-5">
          <Animated.View entering={FadeIn.duration(350)} className="flex-row items-center justify-between pb-2 pt-1">
            <Pressable
              className="size-11 items-center justify-center rounded-full bg-white/20"
              onPress={resetFlow}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#fff" />
            </Pressable>
            <View className="items-center">
              <Text className="font-subtitle text-[17px] text-white">
                Send to {selectedPeer.displayName}
              </Text>
              {dist && (
                <Text className="mt-0.5 font-body text-[12px] text-white/60">{dist} away</Text>
              )}
            </View>
            <View className="size-11" />
          </Animated.View>

          <View className="flex-1 items-center justify-center">
            <AnimatedAmount amount={toDisplayAmount(rawAmount)} />
          </View>

          {sendError ? (
            <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} className="mb-2">
              <Text className="text-center font-body text-[13px] text-white/90">{sendError}</Text>
            </Animated.View>
          ) : null}

          <View className="pb-3 pt-1">
            <Button
              title={isSending ? 'Sending…' : 'Send'}
              onPress={onContinue}
              disabled={!amountOk || isSending}
              variant="white"
            />
          </View>

          <Keypad
            className="pb-2"
            onKeyPress={onKey}
            backspaceIcon="delete"
            variant="dark"
            leftKey="decimal"
          />
        </View>
        <View style={{ paddingBottom: Math.max(insets.bottom, 12) }} />
      </SafeAreaView>
    );
  }

  // ── Discovery screen ──────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      <View className="flex-row items-center gap-4 px-6 pt-3">
        <Pressable
          onPress={() => { stop(); router.back(); }}
          className="h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6]">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#070914" strokeWidth={2} />
        </Pressable>
        <View className="flex-1">
          <Text className="font-subtitle text-[18px] text-[#070914]">Tap to Pay</Text>
        </View>
        {peers.length > 0 && (
          <Animated.View entering={FadeIn.duration(300)} className="rounded-full bg-[#ECFDF5] px-3 py-1">
            <Text className="font-caption text-[11px] text-[#10B981]">
              {peers.length} nearby
            </Text>
          </Animated.View>
        )}
      </View>

      <View className="flex-1 items-center justify-center">
        {/* Peer avatars orbiting the pulse */}
        {peers.map((peer, i) => (
          <PeerAvatar
            key={peer.peerId}
            peer={peer}
            distance={peerDistances[peer.peerId]}
            index={i}
            total={peers.length}
            onPress={() => setSelectedPeer(peer)}
          />
        ))}

        {/* Center pulse + icon */}
        <PulseRing delay={0} size={160} haptic />
        <PulseRing delay={700} size={160} />
        <PulseRing delay={1400} size={160} />
        <View className="h-40 w-40 items-center justify-center rounded-full bg-[#FFF0ED]"
          style={{ shadowColor: BRAND_COLOR, shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 4 }, elevation: 8 }}>
          <HugeiconsIcon icon={Wifi01Icon} size={48} color="#FF2E01" />
          {peers.length === 0 && !discoveryTimedOut && (
            <ActivityIndicator size="small" color="#FF2E01" style={{ position: 'absolute', bottom: -28 }} />
          )}
        </View>

        {/* Status text */}
        <View className="absolute bottom-24 items-center px-6">
          <Text className="font-subtitle text-[16px] text-[#070914]">{statusText}</Text>
          <Text className="mt-1 font-body text-[13px] text-[#9CA3AF]">{subtitleText}</Text>
          {discoveryTimedOut && peers.length === 0 && (
            <Button
              title="Retry"
              variant="ghost"
              className="mt-3"
              onPress={async () => {
                setDiscoveryTimedOut(false);
                stop();
                const ok = await requestPerms();
                if (ok) start();
              }}
            />
          )}
        </View>
      </View>

      {transferDeclined && (
        <Animated.View
          entering={FadeInUp.duration(200)}
          exiting={FadeOut.duration(300)}
          className="absolute bottom-10 left-6 right-6 items-center rounded-2xl bg-[#FEF2F2] py-3">
          <Text className="font-body text-[14px] text-[#EF4444]">Transfer was declined</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
