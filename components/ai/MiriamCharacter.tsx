import React, { useEffect, useMemo, useCallback } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

// ─── Types ──────────────────────────────────────────────────────────────────

export type MiriamEmotion =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'thinking'
  | 'surprised'
  | 'sleepy';

interface Props {
  size?: number;
  emotion?: MiriamEmotion;
  isProcessing?: boolean;
  animate?: boolean;
  color?: string;
}

// ─── Emotion Eye Presets ────────────────────────────────────────────────────

interface EyePreset {
  yOffset: number;
  scaleY: number;
  rx: number;
  ry: number;
  lookBiasX: number;
  lookBiasY: number;
  blinkSpeed: number;
  blinkHold: number;
}

const PRESETS: Record<MiriamEmotion, EyePreset> = {
  neutral:   { yOffset: 0.36, scaleY: 1,    rx: 0.06,  ry: 0.085, lookBiasX: 0,  lookBiasY: 0,  blinkSpeed: 90,  blinkHold: 70  },
  happy:     { yOffset: 0.38, scaleY: 0.6,  rx: 0.065, ry: 0.075, lookBiasX: 0,  lookBiasY: 1,  blinkSpeed: 80,  blinkHold: 60  },
  sad:       { yOffset: 0.37, scaleY: 0.8,  rx: 0.06,  ry: 0.08,  lookBiasX: 0,  lookBiasY: 2,  blinkSpeed: 120, blinkHold: 100 },
  thinking:  { yOffset: 0.34, scaleY: 1,    rx: 0.06,  ry: 0.085, lookBiasX: 3,  lookBiasY: -2, blinkSpeed: 90,  blinkHold: 70  },
  surprised: { yOffset: 0.33, scaleY: 1.3,  rx: 0.07,  ry: 0.1,   lookBiasX: 0,  lookBiasY: -1, blinkSpeed: 100, blinkHold: 50  },
  sleepy:    { yOffset: 0.40, scaleY: 0.25, rx: 0.065, ry: 0.04,  lookBiasX: 0,  lookBiasY: 1,  blinkSpeed: 250, blinkHold: 400 },
};

const ease = Easing.inOut(Easing.sin);
const aloop = (to: number, ms: number) =>
  withRepeat(withTiming(to, { duration: ms, easing: ease }), -1, true);

// ─── Component ──────────────────────────────────────────────────────────────

export function MiriamCharacter({
  size = 64,
  emotion = 'neutral',
  isProcessing = false,
  animate = true,
  color = '#EF4A2F',
}: Props) {
  const s = size;
  const r = s * 0.44;
  const preset = useMemo(() => PRESETS[emotion], [emotion]);

  const bobY = useSharedValue(0);
  const swayX = useSharedValue(0);
  const tilt = useSharedValue(0);
  const breathe = useSharedValue(1);
  const blink = useSharedValue(1);
  const lookX = useSharedValue(0);
  const lookY = useSharedValue(0);

  // ── Body idle ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!animate) {
      [bobY, swayX, tilt, breathe].forEach(v => cancelAnimation(v));
      bobY.value = 0; swayX.value = 0; tilt.value = 0; breathe.value = 1;
      return;
    }
    // Set starting positions so reverse-repeat swings both directions
    swayX.value = -s * 0.04;
    tilt.value = -3;

    bobY.value = aloop(-s * 0.05, 2400);
    swayX.value = withRepeat(withTiming(s * 0.04, { duration: 1600, easing: ease }), -1, true);
    tilt.value = withRepeat(withTiming(3, { duration: 2000, easing: ease }), -1, true);
    breathe.value = aloop(1.02, 2800);
    return () => [bobY, swayX, tilt, breathe].forEach(v => cancelAnimation(v));
  }, [animate, s]);

  // ── Processing → faster/wider sway ──────────────────────────────────────

  useEffect(() => {
    if (!isProcessing) {
      if (animate) {
        cancelAnimation(swayX);
        swayX.value = -s * 0.04;
        swayX.value = withRepeat(withTiming(s * 0.04, { duration: 1600, easing: ease }), -1, true);
      }
      return;
    }
    cancelAnimation(swayX);
    swayX.value = -s * 0.07;
    swayX.value = withRepeat(withTiming(s * 0.07, { duration: 400, easing: ease }), -1, true);
  }, [isProcessing, animate, s]);

  // ── Blinking ────────────────────────────────────────────────────────────

  const scheduleBlink = useCallback(() => {
    if (!animate) { blink.value = 1; return undefined; }
    let tid: ReturnType<typeof setTimeout>;
    const run = () => {
      tid = setTimeout(() => {
        const { blinkSpeed: spd, blinkHold: hold } = preset;
        const dbl = Math.random() < 0.25 && emotion !== 'sleepy';
        blink.value = dbl
          ? withSequence(
              withTiming(0.05, { duration: spd }),
              withTiming(1, { duration: spd }),
              withDelay(80, withSequence(
                withTiming(0.05, { duration: spd }),
                withTiming(1, { duration: hold }),
              )),
            )
          : withSequence(
              withTiming(0.05, { duration: spd }),
              withTiming(1, { duration: hold }),
            );
        run();
      }, 2200 + Math.random() * 3500);
    };
    run();
    return () => clearTimeout(tid);
  }, [animate, emotion, preset]);

  useEffect(() => scheduleBlink(), [scheduleBlink]);

  // ── Look direction ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!animate) { lookX.value = 0; lookY.value = 0; return; }
    const dirs = [[0,0],[1.5,-0.5],[-1.5,-0.5],[1,1],[-1,1],[2,0],[-2,0]];
    let tid: ReturnType<typeof setTimeout>;
    const run = () => {
      tid = setTimeout(() => {
        const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
        lookX.value = withTiming(dx + preset.lookBiasX, { duration: 300, easing: ease });
        lookY.value = withTiming(dy + preset.lookBiasY, { duration: 300, easing: ease });
        run();
      }, 1500 + Math.random() * 2500);
    };
    run();
    return () => clearTimeout(tid);
  }, [animate, emotion, preset]);

  // ── Animated styles ─────────────────────────────────────────────────────

  const bodyAnim = useAnimatedStyle(() => ({
    transform: [
      { translateY: bobY.value },
      { translateX: swayX.value },
      { rotate: `${tilt.value}deg` },
      { scale: breathe.value },
    ],
  }));

  const eyeAnim = useAnimatedStyle(() => ({
    transform: [
      { translateX: lookX.value * s * 0.008 },
      { translateY: lookY.value * s * 0.008 },
      { scaleY: blink.value * preset.scaleY },
    ],
  }));

  // ── Eye geometry ────────────────────────────────────────────────────────

  const eyeW = preset.rx * s * 2;
  const eyeH = preset.ry * s * 2;
  const eyeY = preset.yOffset * s - eyeH / 2;
  const leftX = s * 0.36 - eyeW / 2;
  const rightX = s * 0.56 - eyeW / 2;

  // Padding so head movement isn't clipped
  const pad = s * 0.15;

  return (
    <View
      style={{
        width: s,
        height: s,
        overflow: 'visible',
      }}
      accessibilityLabel={`Miriam AI assistant, ${emotion} mood`}
      accessibilityRole="image"
    >
      {/* Soft outer glow ring — static, thin pinkish halo */}
      <View
        style={{
          position: 'absolute',
          left: (s - r * 2.16) / 2,
          top: (s - r * 2.16) / 2,
          width: r * 2.16,
          height: r * 2.16,
          borderRadius: r * 1.08,
          backgroundColor: 'rgba(239, 74, 47, 0.18)',
        }}
      />

      {/* Body group — bobs, sways, tilts as one unit */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: -pad,
            top: -pad,
            width: s + pad * 2,
            height: s + pad * 2,
            overflow: 'visible',
          },
          bodyAnim,
        ]}
      >
        {/* Main sphere */}
        <View
          style={{
            position: 'absolute',
            left: pad + (s - r * 2) / 2,
            top: pad + (s - r * 2) / 2,
            width: r * 2,
            height: r * 2,
            borderRadius: r,
            backgroundColor: color,
            overflow: 'hidden',
          }}
        >
          {/* Top-left warm highlight — subtle */}
          <View
            style={{
              position: 'absolute',
              left: -r * 0.1,
              top: -r * 0.15,
              width: r * 1.2,
              height: r * 1.2,
              borderRadius: r * 0.6,
              backgroundColor: '#FF9E80',
              opacity: 0.3,
            }}
          />

          {/* Bottom-right depth — subtle */}
          <View
            style={{
              position: 'absolute',
              right: -r * 0.1,
              bottom: -r * 0.1,
              width: r * 1.1,
              height: r * 1.1,
              borderRadius: r * 0.55,
              backgroundColor: '#A02010',
              opacity: 0.2,
            }}
          />

          {/* Tiny specular dot */}
          <View
            style={{
              position: 'absolute',
              left: r * 0.25,
              top: r * 0.28,
              width: r * 0.12,
              height: r * 0.09,
              borderRadius: r * 0.06,
              backgroundColor: '#FFFFFF',
              opacity: 0.3,
            }}
          />
        </View>

        {/* Left Eye */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: pad + leftX,
              top: pad + eyeY,
              width: eyeW,
              height: eyeH,
              borderRadius: eyeW / 2,
              backgroundColor: '#FFFFFF',
            },
            eyeAnim,
          ]}
        />

        {/* Right Eye */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: pad + rightX,
              top: pad + eyeY,
              width: eyeW,
              height: eyeH,
              borderRadius: eyeW / 2,
              backgroundColor: '#FFFFFF',
            },
            eyeAnim,
          ]}
        />

        {/* Happy cheek blush */}
        {emotion === 'happy' && (
          <>
            <View
              style={{
                position: 'absolute',
                left: pad + s * 0.19,
                top: pad + s * 0.50,
                width: s * 0.1,
                height: s * 0.07,
                borderRadius: s * 0.05,
                backgroundColor: '#FF8060',
                opacity: 0.25,
              }}
            />
            <View
              style={{
                position: 'absolute',
                left: pad + s * 0.71,
                top: pad + s * 0.50,
                width: s * 0.1,
                height: s * 0.07,
                borderRadius: s * 0.05,
                backgroundColor: '#FF8060',
                opacity: 0.25,
              }}
            />
          </>
        )}
      </Animated.View>
    </View>
  );
}
