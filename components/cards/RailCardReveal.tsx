/**
 * RailCardReveal — tap to reveal full card details behind Face ID / Touch ID.
 * Uses crypto-js for HMAC (crypto.subtle not available in Hermes/React Native).
 * Sensitive data never touches your backend (Bridge PCI endpoint called directly).
 * Tap again to flip back and clear data.
 */
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import RailCard, { type RailCardProps } from './RailCard';
import { cardService } from '@/api/services/card.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const CryptoJS = require('crypto-js') as {
  HmacSHA256: (message: string, key: string) => { toString: (enc?: unknown) => string };
  enc: { Base64: unknown };
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BRIDGE_PCI_BASE = __DEV__
  ? 'https://cards-pci.sandbox.bridge.xyz'
  : 'https://cards-pci.bridge.xyz';

async function generateClientSecret(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// crypto-js HMAC-SHA256 — works in Hermes (no crypto.subtle needed)
// Bridge spec: HMAC-SHA256("nonce:{timestamp}", secret) → base64
function deriveNonce(secret: string, timestamp: number): string {
  return CryptoJS.HmacSHA256(`nonce:${timestamp}`, secret).toString(CryptoJS.enc.Base64);
}

function CardBack({
  cardNumber,
  cvv,
  expiry,
  holderName,
  width,
  height,
}: {
  cardNumber: string;
  cvv: string;
  expiry: string;
  holderName: string;
  width: number;
  height: number;
}) {
  const formatted = cardNumber.replace(/(.{4})/g, '$1  ').trim();
  return (
    <View
      style={{ width, height }}
      className="overflow-hidden rounded-sm border border-white/10 bg-[#070708]">
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 380 240"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0 }}>
        <Defs>
          <LinearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#030304" stopOpacity="1" />
            <Stop offset="0.55" stopColor="#07080B" stopOpacity="1" />
            <Stop offset="1" stopColor="#0B0C10" stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="sweep2" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
            <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.08" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="edge2" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.22" />
            <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.07" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.18" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="380" height="240" rx="30" fill="url(#bg2)" />
        <Rect x="-40" y="-10" width="460" height="260" rx="30" fill="url(#sweep2)" />
        <Rect
          x="1.2"
          y="1.2"
          width="377.6"
          height="237.6"
          rx="29"
          fill="none"
          stroke="url(#edge2)"
          strokeWidth="1.5"
          opacity="0.95"
        />
        <Rect x="0" y="0" width="380" height="240" rx="30" fill="#000000" opacity="0.28" />
      </Svg>
      <View className="flex-1 justify-end px-[18px] pb-[16px]">
        <Text className="text-[17.5px] font-extrabold tracking-[2px] text-white/90">
          {formatted}
        </Text>
        <View className="mt-4 flex-row items-end justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-[10px] font-extrabold tracking-[1.6px] text-white/55">
              CARDHOLDER
            </Text>
            <Text numberOfLines={1} className="mt-1 text-[13px] font-extrabold text-white/90">
              {holderName}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-[10px] font-extrabold tracking-[1.6px] text-white/55">EXP</Text>
            <Text className="mt-1 text-[13px] font-extrabold text-white/90">{expiry}</Text>
          </View>
          <View className="ml-5 items-end">
            <Text className="text-[10px] font-extrabold tracking-[1.6px] text-white/55">CVV</Text>
            <Text className="mt-1 text-[13px] font-extrabold text-white/90">{cvv}</Text>
          </View>
        </View>
      </View>
      <View
        pointerEvents="none"
        className="absolute left-[-90px] top-[-130px] h-[250px] w-[280px] rounded-[220px] bg-white/10"
        style={{ transform: [{ rotate: '18deg' }] }}
      />
    </View>
  );
}

export type RailCardRevealProps = RailCardProps & { cardId: string };

export default function RailCardReveal({ cardId, ...cardProps }: RailCardRevealProps) {
  const cardWidth = Math.min(cardProps.width ?? SCREEN_WIDTH - 32, 440);
  const cardHeight = Math.round(cardWidth * 0.65);

  const flip = useSharedValue(0);
  const isFlipped = useRef(false);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<{ number: string; cvv: string; expiry: string } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` },
    ],
    backfaceVisibility: 'hidden',
    position: 'absolute',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(flip.value, [0, 1], [180, 360])}deg` },
    ],
    backfaceVisibility: 'hidden',
    position: 'absolute',
  }));

  const handleTap = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Flip back — clear sensitive data
    if (isFlipped.current) {
      flip.value = withSpring(0, { damping: 14, stiffness: 120 });
      isFlipped.current = false;
      setTimeout(() => setDetails(null), 400);
      return;
    }

    // Biometrics only — no passcode fallback
    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: "Confirm it's you to reveal card details",
      disableDeviceFallback: true,
      cancelLabel: 'Cancel',
    });
    if (!auth.success) return;

    setLoading(true);
    setError(null);

    try {
      if (!cardId) throw new Error('No card ID');

      const secret = await generateClientSecret();
      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = deriveNonce(secret, timestamp);

      const { ephemeral_key } = await cardService.getEphemeralKey(cardId, nonce);

      const pciRes = await fetch(
        `${BRIDGE_PCI_BASE}/v0/card_details/?secret=${encodeURIComponent(secret)}&timestamp=${timestamp}`,
        { headers: { Authorization: `Bearer ${ephemeral_key}` } }
      );
      if (!pciRes.ok) {
        const body = await pciRes.text().catch(() => '');
        throw new Error(`Bridge PCI ${pciRes.status}: ${body}`);
      }

      const data = await pciRes.json();
      setDetails({
        number: data.card_number,
        cvv: data.card_security_code,
        expiry: data.expiry_date,
      });

      flip.value = withSpring(1, { damping: 14, stiffness: 120 });
      isFlipped.current = true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (__DEV__) console.error('[CardReveal]', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [cardId, flip]);

  return (
    <TouchableOpacity
      onPress={handleTap}
      activeOpacity={1}
      style={{ width: cardWidth, height: cardHeight }}>
      <Animated.View style={[frontStyle, { width: cardWidth, height: cardHeight }]}>
        <RailCard {...cardProps} width={cardWidth} />
        {loading && (
          <View className="absolute inset-0 items-center justify-center rounded-sm bg-black/40">
            <ActivityIndicator color="#fff" />
          </View>
        )}
        {error && (
          <View className="absolute inset-0 items-center justify-center rounded-sm bg-black/60 px-4">
            <Text className="text-center text-xs text-red-400">{error}</Text>
          </View>
        )}
      </Animated.View>

      <Animated.View style={[backStyle, { width: cardWidth, height: cardHeight }]}>
        {details ? (
          <CardBack
            cardNumber={details.number}
            cvv={details.cvv}
            expiry={details.expiry}
            holderName={cardProps.holderName ?? 'CARDHOLDER'}
            width={cardWidth}
            height={cardHeight}
          />
        ) : (
          <View
            style={{ width: cardWidth, height: cardHeight }}
            className="overflow-hidden rounded-sm bg-[#070708]"
          />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}
