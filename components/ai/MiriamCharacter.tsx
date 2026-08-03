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
  | 'sleepy'
  | 'annoyed'
  | 'dizzy'
  | 'nervous'
  | 'smug'
  | 'idle'
  | 'bored'
  | 'confused';

export type MiriamFacing = 'front' | 'left' | 'right' | 'auto';

interface Props {
  size?: number;
  emotion?: MiriamEmotion;
  facing?: MiriamFacing;
  isProcessing?: boolean;
  animate?: boolean;
  color?: string;
}

// ─── Emotion Presets ────────────────────────────────────────────────────────

interface EmotionPreset {
  yOffset: number;
  scaleY: number;
  rx: number;
  ry: number;
  lookBiasX: number;
  lookBiasY: number;
  blinkSpeed: number;
  blinkHold: number;
  headBias: number;
  mouth: 'flat' | 'smile' | 'frown' | 'ponder' | 'open' | 'rest';
  brows: 'calm' | 'joy' | 'worry' | 'curious' | 'wide' | 'heavy';
  cheekOpacity: number;
  cheekY: number;
}

const PRESETS: Record<MiriamEmotion, EmotionPreset> = {
  neutral: {
    yOffset: 0.36,
    scaleY: 1,
    rx: 0.058,
    ry: 0.083,
    lookBiasX: 0,
    lookBiasY: 0,
    blinkSpeed: 90,
    blinkHold: 70,
    headBias: 0,
    mouth: 'flat',
    brows: 'calm',
    cheekOpacity: 0.3,
    cheekY: 0.5,
  },
  happy: {
    yOffset: 0.38,
    scaleY: 0.58,
    rx: 0.066,
    ry: 0.075,
    lookBiasX: 0,
    lookBiasY: 1,
    blinkSpeed: 80,
    blinkHold: 60,
    headBias: 0.18,
    mouth: 'smile',
    brows: 'joy',
    cheekOpacity: 0.45,
    cheekY: 0.51,
  },
  sad: {
    yOffset: 0.39,
    scaleY: 0.72,
    rx: 0.058,
    ry: 0.075,
    lookBiasX: -0.6,
    lookBiasY: 2.2,
    blinkSpeed: 130,
    blinkHold: 110,
    headBias: -0.22,
    mouth: 'frown',
    brows: 'worry',
    cheekOpacity: 0.12,
    cheekY: 0.54,
  },
  thinking: {
    yOffset: 0.34,
    scaleY: 0.96,
    rx: 0.06,
    ry: 0.084,
    lookBiasX: 2.8,
    lookBiasY: -1.8,
    blinkSpeed: 95,
    blinkHold: 70,
    headBias: 0.36,
    mouth: 'ponder',
    brows: 'curious',
    cheekOpacity: 0.28,
    cheekY: 0.51,
  },
  surprised: {
    yOffset: 0.33,
    scaleY: 1.25,
    rx: 0.07,
    ry: 0.098,
    lookBiasX: 0,
    lookBiasY: -1,
    blinkSpeed: 120,
    blinkHold: 50,
    headBias: 0,
    mouth: 'open',
    brows: 'wide',
    cheekOpacity: 0.22,
    cheekY: 0.5,
  },
  sleepy: {
    yOffset: 0.41,
    scaleY: 0.22,
    rx: 0.067,
    ry: 0.04,
    lookBiasX: -0.4,
    lookBiasY: 1.4,
    blinkSpeed: 260,
    blinkHold: 440,
    headBias: -0.16,
    mouth: 'rest',
    brows: 'heavy',
    cheekOpacity: 0,
    cheekY: 0.5,
  },
  annoyed: {
    yOffset: 0.37,
    scaleY: 0.6,
    rx: 0.058,
    ry: 0.07,
    lookBiasX: -1.2,
    lookBiasY: 1.0,
    blinkSpeed: 100,
    blinkHold: 80,
    headBias: -0.3,
    mouth: 'frown',
    brows: 'worry',
    cheekOpacity: 0.1,
    cheekY: 0.52,
  },
  dizzy: {
    yOffset: 0.36,
    scaleY: 1.1,
    rx: 0.072,
    ry: 0.09,
    lookBiasX: 2.0,
    lookBiasY: -2.0,
    blinkSpeed: 60,
    blinkHold: 40,
    headBias: 0.1,
    mouth: 'open',
    brows: 'wide',
    cheekOpacity: 0.15,
    cheekY: 0.5,
  },
  nervous: {
    yOffset: 0.35,
    scaleY: 0.85,
    rx: 0.055,
    ry: 0.078,
    lookBiasX: 1.5,
    lookBiasY: 0.5,
    blinkSpeed: 60,
    blinkHold: 45,
    headBias: 0.12,
    mouth: 'flat',
    brows: 'worry',
    cheekOpacity: 0.35,
    cheekY: 0.52,
  },
  smug: {
    yOffset: 0.39,
    scaleY: 0.5,
    rx: 0.065,
    ry: 0.07,
    lookBiasX: 0.8,
    lookBiasY: 0.8,
    blinkSpeed: 100,
    blinkHold: 80,
    headBias: 0.25,
    mouth: 'smile',
    brows: 'calm',
    cheekOpacity: 0.4,
    cheekY: 0.51,
  },
  idle: {
    yOffset: 0.36,
    scaleY: 1.0,
    rx: 0.058,
    ry: 0.083,
    lookBiasX: 0,
    lookBiasY: 0,
    blinkSpeed: 150,
    blinkHold: 100,
    headBias: 0,
    mouth: 'flat',
    brows: 'calm',
    cheekOpacity: 0.2,
    cheekY: 0.5,
  },
  bored: {
    yOffset: 0.38,
    scaleY: 0.7,
    rx: 0.06,
    ry: 0.075,
    lookBiasX: -0.3,
    lookBiasY: 1.5,
    blinkSpeed: 180,
    blinkHold: 200,
    headBias: -0.1,
    mouth: 'flat',
    brows: 'heavy',
    cheekOpacity: 0.1,
    cheekY: 0.52,
  },
  confused: {
    yOffset: 0.35,
    scaleY: 0.9,
    rx: 0.06,
    ry: 0.085,
    lookBiasX: 1.8,
    lookBiasY: -0.5,
    blinkSpeed: 110,
    blinkHold: 70,
    headBias: 0.3,
    mouth: 'ponder',
    brows: 'curious',
    cheekOpacity: 0.2,
    cheekY: 0.5,
  },
};

const ease = Easing.inOut(Easing.sin);
const aloop = (to: number, ms: number) =>
  withRepeat(withTiming(to, { duration: ms, easing: ease }), -1, true);

const clampTurn = (value: number) => Math.max(-1, Math.min(1, value));

const getFacingTurn = (facing: MiriamFacing, preset: EmotionPreset) => {
  if (facing === 'left') return -0.9;
  if (facing === 'right') return 0.9;
  if (facing === 'front') return 0;
  return preset.headBias;
};

const getMouthPath = (s: number, mouth: EmotionPreset['mouth']) => {
  switch (mouth) {
    case 'smile':
      return {
        d: `M ${s * 0.37} ${s * 0.56} Q ${s * 0.5} ${s * 0.68} ${s * 0.63} ${s * 0.56}`,
        fill: 'none',
        strokeWidth: s * 0.04,
      };
    case 'frown':
      return {
        d: `M ${s * 0.38} ${s * 0.64} Q ${s * 0.5} ${s * 0.55} ${s * 0.62} ${s * 0.64}`,
        fill: 'none',
        strokeWidth: s * 0.035,
      };
    case 'ponder':
      return {
        d: `M ${s * 0.43} ${s * 0.61} Q ${s * 0.5} ${s * 0.64} ${s * 0.58} ${s * 0.59}`,
        fill: 'none',
        strokeWidth: s * 0.032,
      };
    case 'open':
      return {
        d: `M ${s * 0.45} ${s * 0.59} C ${s * 0.45} ${s * 0.52} ${s * 0.55} ${s * 0.52} ${
          s * 0.55
        } ${s * 0.59} C ${s * 0.55} ${s * 0.68} ${s * 0.45} ${s * 0.68} ${s * 0.45} ${s * 0.59} Z`,
        fill: '#FFFFFF',
        strokeWidth: 0,
      };
    case 'rest':
      return {
        d: `M ${s * 0.44} ${s * 0.61} Q ${s * 0.5} ${s * 0.63} ${s * 0.56} ${s * 0.61}`,
        fill: 'none',
        strokeWidth: s * 0.028,
      };
    case 'flat':
    default:
      return {
        d: `M ${s * 0.42} ${s * 0.59} Q ${s * 0.5} ${s * 0.61} ${s * 0.58} ${s * 0.59}`,
        fill: 'none',
        strokeWidth: s * 0.03,
      };
  }
};

const getBrowPaths = (s: number, brows: EmotionPreset['brows']) => {
  switch (brows) {
    case 'joy':
      return [
        `M ${s * 0.3} ${s * 0.29} Q ${s * 0.37} ${s * 0.23} ${s * 0.44} ${s * 0.29}`,
        `M ${s * 0.56} ${s * 0.29} Q ${s * 0.63} ${s * 0.23} ${s * 0.7} ${s * 0.29}`,
      ];
    case 'worry':
      return [
        `M ${s * 0.3} ${s * 0.32} L ${s * 0.44} ${s * 0.37}`,
        `M ${s * 0.56} ${s * 0.37} L ${s * 0.7} ${s * 0.32}`,
      ];
    case 'curious':
      return [
        `M ${s * 0.29} ${s * 0.27} Q ${s * 0.37} ${s * 0.22} ${s * 0.45} ${s * 0.29}`,
        `M ${s * 0.56} ${s * 0.34} Q ${s * 0.64} ${s * 0.3} ${s * 0.72} ${s * 0.32}`,
      ];
    case 'wide':
      return [
        `M ${s * 0.3} ${s * 0.25} Q ${s * 0.37} ${s * 0.2} ${s * 0.44} ${s * 0.25}`,
        `M ${s * 0.56} ${s * 0.25} Q ${s * 0.63} ${s * 0.2} ${s * 0.7} ${s * 0.25}`,
      ];
    case 'heavy':
      return [
        `M ${s * 0.29} ${s * 0.35} Q ${s * 0.37} ${s * 0.39} ${s * 0.45} ${s * 0.35}`,
        `M ${s * 0.55} ${s * 0.35} Q ${s * 0.63} ${s * 0.39} ${s * 0.71} ${s * 0.35}`,
      ];
    case 'calm':
    default:
      return [
        `M ${s * 0.31} ${s * 0.3} Q ${s * 0.37} ${s * 0.27} ${s * 0.43} ${s * 0.3}`,
        `M ${s * 0.57} ${s * 0.3} Q ${s * 0.63} ${s * 0.27} ${s * 0.69} ${s * 0.3}`,
      ];
  }
};

// ─── Component ──────────────────────────────────────────────────────────────

export function MiriamCharacter({
  size = 64,
  emotion = 'neutral',
  facing = 'auto',
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
  const headTurn = useSharedValue(getFacingTurn(facing, preset));

  // ── Body idle ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!animate) {
      [bobY, swayX, tilt, breathe].forEach((v) => cancelAnimation(v));
      bobY.value = 0;
      swayX.value = 0;
      tilt.value = 0;
      breathe.value = 1;
      return;
    }
    // Set starting positions so reverse-repeat swings both directions
    swayX.value = -s * 0.04;
    tilt.value = -3;

    bobY.value = aloop(-s * 0.05, 2400);
    swayX.value = withRepeat(withTiming(s * 0.04, { duration: 1600, easing: ease }), -1, true);
    tilt.value = withRepeat(withTiming(3, { duration: 2000, easing: ease }), -1, true);
    breathe.value = aloop(1.02, 2800);
    return () => [bobY, swayX, tilt, breathe].forEach((v) => cancelAnimation(v));
  }, [animate, bobY, breathe, s, swayX, tilt]);

  // ── Head turns ─────────────────────────────────────────────────────────

  useEffect(() => {
    const targetTurn = getFacingTurn(facing, preset);

    cancelAnimation(headTurn);

    if (!animate || facing !== 'auto') {
      headTurn.value = withTiming(targetTurn, { duration: 360, easing: ease });
      return;
    }

    const leftTurn = clampTurn(targetTurn - 0.65);
    const rightTurn = clampTurn(targetTurn + 0.65);

    headTurn.value = targetTurn;
    headTurn.value = withRepeat(
      withSequence(
        withTiming(rightTurn, { duration: 1500, easing: ease }),
        withDelay(600, withTiming(targetTurn, { duration: 900, easing: ease })),
        withTiming(leftTurn, { duration: 1500, easing: ease }),
        withDelay(700, withTiming(targetTurn, { duration: 900, easing: ease }))
      ),
      -1,
      false
    );
  }, [animate, facing, headTurn, preset]);

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
  }, [isProcessing, animate, s, swayX]);

  // ── Blinking ────────────────────────────────────────────────────────────

  const scheduleBlink = useCallback(() => {
    if (!animate) {
      blink.value = 1;
      return undefined;
    }
    let tid: ReturnType<typeof setTimeout>;
    const run = () => {
      tid = setTimeout(
        () => {
          const { blinkSpeed: spd, blinkHold: hold } = preset;
          const dbl = Math.random() < 0.25 && emotion !== 'sleepy';
          blink.value = dbl
            ? withSequence(
                withTiming(0.05, { duration: spd }),
                withTiming(1, { duration: spd }),
                withDelay(
                  80,
                  withSequence(
                    withTiming(0.05, { duration: spd }),
                    withTiming(1, { duration: hold })
                  )
                )
              )
            : withSequence(withTiming(0.05, { duration: spd }), withTiming(1, { duration: hold }));
          run();
        },
        2200 + Math.random() * 3500
      );
    };
    run();
    return () => clearTimeout(tid);
  }, [animate, blink, emotion, preset]);

  useEffect(() => scheduleBlink(), [scheduleBlink]);

  // ── Look direction ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!animate) {
      lookX.value = 0;
      lookY.value = 0;
      return;
    }
    const dirs = [
      [0, 0],
      [1.5, -0.5],
      [-1.5, -0.5],
      [1, 1],
      [-1, 1],
      [2, 0],
      [-2, 0],
    ];
    let tid: ReturnType<typeof setTimeout>;
    const run = () => {
      tid = setTimeout(
        () => {
          const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
          lookX.value = withTiming(dx + preset.lookBiasX, { duration: 300, easing: ease });
          lookY.value = withTiming(dy + preset.lookBiasY, { duration: 300, easing: ease });
          run();
        },
        1500 + Math.random() * 2500
      );
    };
    run();
    return () => clearTimeout(tid);
  }, [animate, emotion, lookX, lookY, preset]);

  // ── Animated styles ─────────────────────────────────────────────────────

  const bodyAnim = useAnimatedStyle(() => ({
    transform: [
      { translateY: bobY.value },
      { translateX: swayX.value },
      { rotate: `${tilt.value}deg` },
      { scale: breathe.value },
    ],
  }));

  const headAnim = useAnimatedStyle(() => {
    const turn = headTurn.value;

    return {
      transform: [
        { translateX: turn * s * 0.018 },
        { rotate: `${turn * 2.5}deg` },
        { scaleX: 1 - Math.abs(turn) * 0.055 },
      ],
    };
  });

  const faceAnim = useAnimatedStyle(() => {
    const turn = headTurn.value;

    return {
      transform: [
        { translateX: turn * s * 0.078 },
        { rotate: `${turn * -1.3}deg` },
        { scaleX: 1 - Math.abs(turn) * 0.09 },
      ],
    };
  });

  const leftEyeAnim = useAnimatedStyle(() => {
    const farSide = Math.max(headTurn.value, 0);

    return {
      opacity: 1 - farSide * 0.18,
      transform: [
        { translateX: lookX.value * s * 0.008 },
        { translateY: lookY.value * s * 0.008 },
        { scaleX: 1 - farSide * 0.26 },
        { scaleY: blink.value * preset.scaleY },
      ],
    };
  });

  const rightEyeAnim = useAnimatedStyle(() => {
    const farSide = Math.max(-headTurn.value, 0);

    return {
      opacity: 1 - farSide * 0.18,
      transform: [
        { translateX: lookX.value * s * 0.008 },
        { translateY: lookY.value * s * 0.008 },
        { scaleX: 1 - farSide * 0.26 },
        { scaleY: blink.value * preset.scaleY },
      ],
    };
  });

  // ── Eye geometry ────────────────────────────────────────────────────────

  // ── Eye geometry ────────────────────────────────────────────────────────

  const eyeW = preset.rx * s * 2.2;
  const eyeH = preset.ry * s * 2.8;
  const eyeRadius = eyeW / 2;
  const eyeY = preset.yOffset * s - eyeH / 2;
  const leftX = s * 0.36 - eyeW / 2;
  const rightX = s * 0.56 - eyeW / 2;

  const pad = s * 0.08;

  return (
    <View
      style={{
        width: s,
        height: s,
        overflow: 'visible',
      }}
      accessibilityLabel={`Miriam AI assistant, ${emotion} mood`}
      accessibilityRole="image">
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
        ]}>
        {/* Head mass turns separately from the idle sway so left/right modes feel directional. */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              top: 0,
              width: s + pad * 2,
              height: s + pad * 2,
            },
            headAnim,
          ]}>
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
            }}>
            {/* Glossy left sheen — the left half catches the light (the lit side) */}
            <View
              style={{
                position: 'absolute',
                left: -r * 0.15,
                top: -r * 0.2,
                width: r * 1.35,
                height: r * 2.4,
                borderRadius: r * 0.9,
                backgroundColor: '#FFFFFF',
                opacity: 0.1,
                transform: [{ rotate: '-18deg' }],
              }}
            />

            {/* Bottom-right depth — keeps the sphere round */}
            <View
              style={{
                position: 'absolute',
                right: -r * 0.12,
                bottom: -r * 0.12,
                width: r * 1.15,
                height: r * 1.15,
                borderRadius: r * 0.58,
                backgroundColor: '#A02010',
                opacity: 0.22,
              }}
            />

            {/* Soft highlight dot — small, top-left */}
            <View
              style={{
                position: 'absolute',
                left: r * 0.28,
                top: r * 0.34,
                width: r * 0.3,
                height: r * 0.3,
                borderRadius: r * 0.15,
                backgroundColor: '#FFFFFF',
                opacity: 0.16,
              }}
            />

            {/* Soft highlight dot — medium, mid-right */}
            <View
              style={{
                position: 'absolute',
                left: r * 1.28,
                top: r * 0.62,
                width: r * 0.42,
                height: r * 0.42,
                borderRadius: r * 0.21,
                backgroundColor: '#FFFFFF',
                opacity: 0.18,
              }}
            />
          </View>
        </Animated.View>

        <Animated.View
          style={[
            {
              position: 'absolute',
              left: pad,
              top: pad,
              width: s,
              height: s,
            },
            faceAnim,
          ]}>
          {/* Left Eye */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: leftX,
                top: eyeY,
                width: eyeW,
                height: eyeH,
                borderRadius: eyeW / 2,
                backgroundColor: '#FFFFFF',
              },
              leftEyeAnim,
            ]}
          />

          {/* Right Eye */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: rightX,
                top: eyeY,
                width: eyeW,
                height: eyeH,
                borderRadius: eyeW / 2,
                backgroundColor: '#FFFFFF',
              },
              rightEyeAnim,
            ]}
          />

          {preset.cheekOpacity > 0 && (
            <>
              <View
                style={{
                  position: 'absolute',
                  left: s * 0.19,
                  top: s * preset.cheekY,
                  width: s * 0.1,
                  height: s * 0.065,
                  borderRadius: s * 0.05,
                  backgroundColor: '#FFB39A',
                  opacity: preset.cheekOpacity,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  left: s * 0.71,
                  top: s * preset.cheekY,
                  width: s * 0.1,
                  height: s * 0.065,
                  borderRadius: s * 0.05,
                  backgroundColor: '#FFB39A',
                  opacity: preset.cheekOpacity,
                }}
              />
            </>
          )}

          {emotion === 'sad' && (
            <View
              style={{
                position: 'absolute',
                left: s * 0.62,
                top: s * 0.45,
                width: s * 0.035,
                height: s * 0.07,
                borderRadius: s * 0.02,
                backgroundColor: '#9CE7FF',
                opacity: 0.9,
              }}
            />
          )}

          {emotion === 'thinking' && (
            <View
              style={{
                position: 'absolute',
                left: s * 0.68,
                top: s * 0.22,
                width: s * 0.045,
                height: s * 0.045,
                borderRadius: s * 0.023,
                backgroundColor: '#FFFFFF',
                opacity: 0.58,
              }}
            />
          )}
        </Animated.View>
      </Animated.View>
    </View>
  );
}
