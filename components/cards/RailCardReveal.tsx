/**
 * RailCardReveal
 *
 * Wraps RailCard with a 3-D flip. Tapping the card:
 *  1. Generates a client secret + HMAC nonce (Web Crypto / expo-crypto)
 *  2. POSTs the nonce to our backend → gets ephemeral_key back
 *  3. Calls Bridge PCI endpoint directly with ephemeral_key + secret + timestamp
 *  4. Flips to the back face showing full PAN / CVV / expiry
 *
 * Sensitive data is never stored — cleared when the card flips back.
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
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import RailCard, { type RailCardProps } from './RailCard';
import { cardService } from '@/api/services/card.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BRIDGE_PCI_BASE = __DEV__
  ? 'https://cards-pci.sandbox.bridge.xyz'
  : 'https://cards-pci.bridge.xyz';

// ─── nonce helpers ────────────────────────────────────────────────────────────

async function generateClientSecret(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function deriveNonce(secret: string, timestamp: number): Promise<string> {
  const message = `nonce:${timestamp}`;
  const keyData = new TextEncoder().encode(secret);
  const msgData = new TextEncoder().encode(message);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, msgData);
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

// ─── back-face card ───────────────────────────────────────────────────────────

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

      <View className="flex-1 justify-between px-[18px] py-[16px]">
        {/* PAN */}
        <View className="mt-auto flex-1 justify-end justify-center pb-1">
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
      </View>

      {/* specular */}
      <View
        pointerEvents="none"
        className="absolute left-[-90px] top-[-130px] h-[250px] w-[280px] rounded-[220px] bg-white/10"
        style={{ transform: [{ rotate: '18deg' }] }}
      />
    </View>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export type RailCardRevealProps = RailCardProps & {
  cardId: string;
};

export default function RailCardReveal({ cardId, ...cardProps }: RailCardRevealProps) {
  const cardWidth = Math.min(cardProps.width ?? SCREEN_WIDTH - 32, 440);
  const cardHeight = Math.round(cardWidth * 0.65);

  const flip = useSharedValue(0); // 0 = front, 1 = back
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

    if (isFlipped.current) {
      // flip back — clear sensitive data
      flip.value = withSpring(0, { damping: 14, stiffness: 120 });
      isFlipped.current = false;
      setTimeout(() => setDetails(null), 400);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const secret = await generateClientSecret();
      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = await deriveNonce(secret, timestamp);

      const { ephemeral_key } = await cardService.getEphemeralKey(cardId, nonce);

      const pciRes = await fetch(
        `${BRIDGE_PCI_BASE}/v0/card_details/?secret=${encodeURIComponent(secret)}&timestamp=${timestamp}`,
        { headers: { Authorization: `Bearer ${ephemeral_key}` } }
      );

      if (!pciRes.ok) throw new Error(`Bridge PCI ${pciRes.status}`);

      const data = await pciRes.json();
      setDetails({
        number: data.card_number,
        cvv: data.card_security_code,
        expiry: data.expiry_date,
      });

      flip.value = withSpring(1, { damping: 14, stiffness: 120 });
      isFlipped.current = true;
    } catch (e: any) {
      setError('Could not reveal card details');
    } finally {
      setLoading(false);
    }
  }, [cardId, flip]);

  const holderName = cardProps.holderName ?? 'CARDHOLDER';

  return (
    <TouchableOpacity
      onPress={handleTap}
      activeOpacity={0.95}
      style={{ width: cardWidth, height: cardHeight }}>
      <Animated.View style={[frontStyle, { width: cardWidth, height: cardHeight }]}>
        <RailCard {...cardProps} width={cardWidth} />
      </Animated.View>

      <Animated.View style={[backStyle, { width: cardWidth, height: cardHeight }]}>
        {details ? (
          <CardBack
            cardNumber={details.number}
            cvv={details.cvv}
            expiry={details.expiry}
            holderName={holderName}
            width={cardWidth}
            height={cardHeight}
          />
        ) : (
          // placeholder back while loading
          <View
            style={{ width: cardWidth, height: cardHeight }}
            className="items-center justify-center overflow-hidden rounded-sm bg-[#070708]">
            {loading && <ActivityIndicator color="#fff" />}
            {error && <Text className="text-sm text-red-400">{error}</Text>}
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}
