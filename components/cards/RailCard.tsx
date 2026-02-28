import React, { useMemo } from 'react';
import { Dimensions, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type CardBrand = 'VISA' | 'MASTERCARD';
export type CardOrientation = 'horizontal' | 'vertical';

export type RailCardProps = {
  brand?: CardBrand;
  holderName?: string;
  last4?: string;
  exp?: string;
  currency?: string;

  /**
   * Pattern strength (0..1). Keep low for a clean look.
   */
  patternIntensity?: number;

  /**
   * Primary accent used in the pattern (orange recommended).
   */
  accentColor?: string;

  /**
   * Convenience orientation:
   * - horizontal: regular card layout (default)
   * - vertical: rotate 90deg clockwise
   */
  orientation?: CardOrientation;

  /**
   * Fine-grained rotation override (degrees). Takes precedence over `orientation`.
   */
  rotateDeg?: number;

  /**
   * Optional extra tilt (degrees) for a premium look. Applied after base rotation.
   */
  tiltDeg?: number;

  /**
   * Optional sizing override.
   * If omitted, it uses screen width with a max.
   */
  width?: number;

  /**
   * Optional style for the outer card container.
   */
  style?: ViewStyle;
};

function hashStringToSeed(input: string) {
  // FNV-1a-ish
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function formatCardNumber(last4: string) {
  const sanitized = (last4 || '0000').replace(/\D/g, '').slice(-4).padStart(4, '0');
  return `••••  ••••  ••••  ${sanitized}`;
}

function brandMark(brand: CardBrand) {
  if (brand === 'MASTERCARD') return 'MC';
  return brand;
}

function getRotationDeg(orientation?: CardOrientation, rotateDeg?: number) {
  if (typeof rotateDeg === 'number') return rotateDeg;
  if (orientation === 'vertical') return 90;
  return 0;
}

function VisaMark() {
  return (
    <Svg width={52} height={18} viewBox="0 14 48 20">
      <Path
        d="M44.444 31.536L43.994 29.286H38.966L38.166 31.52L34.136 31.528C36.726 25.302 38.65 20.692 39.904 17.694C40.232 16.91 40.814 16.51 41.672 16.516C42.328 16.522 43.398 16.522 44.884 16.518L48 31.53L44.444 31.536ZM40.096 26.204H43.338L42.128 20.564L40.096 26.204ZM14.124 16.514L18.176 16.518L11.912 31.538L7.81 31.534C6.7785 27.5666 5.75983 23.596 4.754 19.622C4.554 18.83 4.158 18.276 3.396 18.014C2.26908 17.6376 1.13697 17.2769 0 16.932L0 16.518H6.474C7.594 16.518 8.248 17.06 8.458 18.172C8.67 19.286 9.202 22.124 10.058 26.68L14.124 16.514ZM23.744 16.518L20.542 31.536L16.684 31.53L19.88 16.514L23.744 16.518ZM31.564 16.24C32.718 16.24 34.172 16.6 35.008 16.932L34.332 20.044C33.576 19.74 32.332 19.33 31.286 19.344C29.766 19.37 28.826 20.008 28.826 20.62C28.826 21.616 30.458 22.118 32.138 23.206C34.054 24.446 34.308 25.56 34.284 26.772C34.258 29.282 32.138 31.76 27.666 31.76C25.626 31.73 24.89 31.56 23.226 30.968L23.93 27.72C25.624 28.428 26.342 28.654 27.79 28.654C29.116 28.654 30.254 28.118 30.264 27.184C30.272 26.52 29.864 26.19 28.376 25.37C26.888 24.548 24.8 23.412 24.828 21.126C24.862 18.202 27.632 16.24 31.564 16.24Z"
        fill="rgba(255,255,255,0.9)"
      />
    </Svg>
  );
}

export default function RailCard({
  brand = 'VISA',
  holderName = 'CARDHOLDER',
  last4 = '0000',
  exp = '01/30',
  currency = 'USD',
  accentColor = '#B8BDC7',
  patternIntensity = 0.22,
  orientation = 'horizontal',
  rotateDeg,
  tiltDeg = 0,
  width,
  style,
}: RailCardProps) {
  const intensity = clamp01(patternIntensity);
  const baseRotation = getRotationDeg(orientation, rotateDeg);

  const cardWidth = Math.min(width ?? SCREEN_WIDTH - 32, 440);
  const cardHeight = Math.round(cardWidth * 0.65);

  const seed = useMemo(
    () => hashStringToSeed(`${brand}|${holderName}|${last4}|${exp}|${currency}|${accentColor}`),
    [brand, holderName, last4, exp, currency, accentColor]
  );

  const art = useMemo(() => {
    const rand = mulberry32(seed);

    // Fewer, larger rounded capsule (pill) shapes: clean + minimal.
    const capsules = Array.from({ length: 3 }).map((_, i) => {
      const horizontal = i % 2 === 0;

      const h = horizontal ? 64 + rand() * 34 : 92 + rand() * 44;
      const w = horizontal ? 210 + rand() * 130 : 92 + rand() * 54;

      // Slight overscan for an “embedded” feel.
      const x = -30 + rand() * (380 - w + 60);
      const y = -25 + rand() * (240 - h + 50);

      const rx = h / 2;
      const o = (0.14 + rand() * 0.18) * intensity;

      return { x, y, w, h, rx, o };
    });

    // One tiny accent dot only — keep it subtle.
    const dot = (() => {
      const cx = 70 + rand() * 240;
      const cy = 55 + rand() * 130;
      const r = 8 + rand() * 12;
      const o = (0.06 + rand() * 0.1) * intensity;
      return { cx, cy, r, o };
    })();

    return { capsules, dot };
  }, [seed, intensity]);

  const transform: ViewStyle['transform'] = [
    { rotate: `${baseRotation}deg` },
    { rotateZ: `${tiltDeg}deg` },
  ];

  return (
    <View
      style={[
        // Use Tailwind via className as requested; only dynamic bits remain in style.
        { width: cardWidth, height: cardHeight, transform },
        style,
      ]}
      className="rounded-[32px] shadow-[0px_10px_18px_rgba(0,0,0,0.22)]">
      <View className="flex-1 overflow-hidden rounded-[32px] border border-white/10 bg-[#070708]">
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 380 240"
          preserveAspectRatio="xMidYMid slice"
          style={{ position: 'absolute', inset: 0 }}>
          <Defs>
            {/* Deep black base with subtle metallic lift */}
            <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#030304" stopOpacity="1" />
              <Stop offset="0.55" stopColor="#07080B" stopOpacity="1" />
              <Stop offset="1" stopColor="#0B0C10" stopOpacity="1" />
            </LinearGradient>

            {/* Brushed-metal sweep (subtle) */}
            <LinearGradient id="metalSweep" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
              <Stop offset="0.35" stopColor="#FFFFFF" stopOpacity="0.06" />
              <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.12" />
              <Stop offset="0.65" stopColor="#FFFFFF" stopOpacity="0.05" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>

            {/* Minimal cool highlight glow (kept black/metallic rather than orange) */}
            <LinearGradient id="accentGlow" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={accentColor} stopOpacity={0.22 * intensity} />
              <Stop offset="0.6" stopColor={accentColor} stopOpacity={0.08 * intensity} />
              <Stop offset="1" stopColor={accentColor} stopOpacity={0} />
            </LinearGradient>

            {/* Metallic edge */}
            <LinearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.22" />
              <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.07" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.18" />
            </LinearGradient>
          </Defs>

          <Rect x="0" y="0" width="380" height="240" rx="30" fill="url(#bg)" />

          {/* Subtle “brushed metal” sweep */}
          <Rect
            x="-40"
            y="-10"
            width="460"
            height="260"
            rx="30"
            fill="url(#metalSweep)"
            opacity="1"
          />

          {/* Keep pattern, but shift it to neutral metallic tones */}
          <G>
            {art.capsules.map((c, idx) => (
              <Rect
                key={`c-${idx}`}
                x={c.x}
                y={c.y}
                width={c.w}
                height={c.h}
                rx={c.rx}
                fill="#C9CED8"
                opacity={c.o * 0.85}
              />
            ))}
          </G>

          <Circle
            cx={art.dot.cx}
            cy={art.dot.cy}
            r={art.dot.r}
            fill="#D7DCE6"
            opacity={art.dot.o * 0.7}
          />

          {/* Very faint cool glow for depth */}
          <Rect
            x="-30"
            y="-30"
            width="240"
            height="200"
            rx="80"
            fill="url(#accentGlow)"
            opacity="1"
          />

          {/* Metallic edge stroke */}
          <Rect
            x="1.2"
            y="1.2"
            width="377.6"
            height="237.6"
            rx="29"
            fill="none"
            stroke="url(#edge)"
            strokeWidth="1.5"
            opacity="0.95"
          />

          {/* Soft vignette to keep it “all black” */}
          <Rect x="0" y="0" width="380" height="240" rx="30" fill="#000000" opacity="0.28" />
        </Svg>

        {/* Foreground */}
        <View className="flex-1 justify-between px-[18px] py-[16px]">
          <View className="flex-row items-start justify-between">
            {/* Visa mark */}
            <VisaMark />
          </View>

          <View className="justify-center">
            <View className="h-[46px] w-[58px] overflow-hidden rounded-[12px] border border-white/20 bg-white/5">
              <View className="absolute bottom-[7px] left-[7px] right-[7px] top-[7px] rounded-[10px] border border-white/15 bg-black/10" />
              <View className="absolute left-0 right-0 top-[16px] h-[1px] bg-white/15" />
              <View className="absolute left-0 right-0 top-[22px] h-[1px] bg-white/10" />
            </View>
          </View>

          <View className="pb-0.5">
            <Text className="text-[17.5px] font-extrabold tracking-[2px] text-white/90">
              {formatCardNumber(last4)}
            </Text>

            <View className="mt-3 flex-row items-end justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-[10px] font-extrabold tracking-[1.6px] text-white/55">
                  CARDHOLDER
                </Text>
                <Text numberOfLines={1} className="mt-1 text-[13px] font-extrabold text-white/90">
                  {holderName}
                </Text>
              </View>

              <View className="min-w-[72px] items-end">
                <Text className="text-[10px] font-extrabold tracking-[1.6px] text-white/55">
                  EXP
                </Text>
                <Text className="mt-1 text-[13px] font-extrabold text-white/90">{exp}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Specular highlight */}
        <View
          pointerEvents="none"
          className="absolute left-[-90px] top-[-130px] h-[250px] w-[280px] rounded-[220px] bg-white/10"
          style={{ transform: [{ rotate: '18deg' }] }}
        />
        <View
          pointerEvents="none"
          className="absolute bottom-[-140px] right-[-120px] h-[260px] w-[320px] rounded-[240px] bg-white/5"
          style={{ transform: [{ rotate: '-22deg' }] }}
        />
      </View>
    </View>
  );
}
