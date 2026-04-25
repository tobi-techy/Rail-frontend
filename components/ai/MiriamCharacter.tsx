import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

export type MiriamEmotion = 'neutral' | 'happy' | 'sad' | 'thinking' | 'surprised' | 'sleepy';

interface Props {
  size?: number;
  emotion?: MiriamEmotion;
  isProcessing?: boolean;
  animate?: boolean;
  color?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Emotion configs
// ─────────────────────────────────────────────────────────────────────────────

type EyeConfig = {
  leftY: number;
  rightY: number;
  scaleY: number;
  eyeRx: number;
  eyeRy: number;
  lookBiasX: number;
  lookBiasY: number;
};

function getEmotionConfig(size: number, emotion: MiriamEmotion): EyeConfig {
  const s = size;
  const configs: Record<MiriamEmotion, EyeConfig> = {
    neutral: {
      leftY: s * 0.32,
      rightY: s * 0.32,
      scaleY: 1,
      eyeRx: s * 0.065,
      eyeRy: s * 0.095,
      lookBiasX: 0,
      lookBiasY: 0,
    },
    happy: {
      leftY: s * 0.35,
      rightY: s * 0.35,
      scaleY: 0.55,
      eyeRx: s * 0.07,
      eyeRy: s * 0.08,
      lookBiasX: 0,
      lookBiasY: 1,
    },
    sad: {
      leftY: s * 0.31,
      rightY: s * 0.31,
      scaleY: 0.85,
      eyeRx: s * 0.065,
      eyeRy: s * 0.09,
      lookBiasX: 0,
      lookBiasY: 2,
    },
    thinking: {
      leftY: s * 0.3,
      rightY: s * 0.32,
      scaleY: 1,
      eyeRx: s * 0.065,
      eyeRy: s * 0.095,
      lookBiasX: 3,
      lookBiasY: -3,
    },
    surprised: {
      leftY: s * 0.29,
      rightY: s * 0.29,
      scaleY: 1.25,
      eyeRx: s * 0.075,
      eyeRy: s * 0.11,
      lookBiasX: 0,
      lookBiasY: -2,
    },
    sleepy: {
      leftY: s * 0.36,
      rightY: s * 0.36,
      scaleY: 0.3,
      eyeRx: s * 0.07,
      eyeRy: s * 0.05,
      lookBiasX: 0,
      lookBiasY: 1,
    },
  };
  return configs[emotion];
}

// ─────────────────────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────────────────────

export function MiriamCharacter({
  size = 64,
  emotion = 'neutral',
  isProcessing = false,
  animate = true,
  color = '#FF2E01',
}: Props) {
  const s = size;
  const center = s * 0.5;
  const radius = s * 0.48;

  // ── Shared values ─────────────────────────────────────────────────────────
  const floatY = useSharedValue(0);
  const swayX = useSharedValue(0);
  const breathe = useSharedValue(1);
  const tilt = useSharedValue(0);
  const squash = useSharedValue(1);
  const glow = useSharedValue(0);

  const blink = useSharedValue(1);
  const lookX = useSharedValue(0);
  const lookY = useSharedValue(0);

  const shouldAnimate = animate;
  const config = useMemo(() => getEmotionConfig(s, emotion), [s, emotion]);

  // ── Body idle animations ──────────────────────────────────────────────────
  useEffect(() => {
    if (!shouldAnimate) {
      cancelAnimation(floatY);
      cancelAnimation(swayX);
      cancelAnimation(breathe);
      cancelAnimation(tilt);
      cancelAnimation(squash);
      floatY.value = 0;
      swayX.value = 0;
      breathe.value = 1;
      tilt.value = 0;
      squash.value = 1;
      return;
    }

    // Bob up and down
    floatY.value = withRepeat(
      withTiming(-s * 0.06, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Sway left and right (head movement)
    swayX.value = withRepeat(
      withTiming(s * 0.04, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Breathe scale
    breathe.value = withRepeat(
      withTiming(1.03, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Tilt rotation
    tilt.value = withRepeat(
      withTiming(5, { duration: 4500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Squash / stretch
    squash.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.98, { duration: 1400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    return () => {
      cancelAnimation(floatY);
      cancelAnimation(swayX);
      cancelAnimation(breathe);
      cancelAnimation(tilt);
      cancelAnimation(squash);
    };
  }, [shouldAnimate, s, floatY, swayX, breathe, tilt, squash]);

  // ── Processing glow ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isProcessing) {
      cancelAnimation(glow);
      glow.value = 0;
      return;
    }
    glow.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    return () => cancelAnimation(glow);
  }, [isProcessing, glow]);

  // ── Random blinking ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!shouldAnimate) {
      blink.value = 1;
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleBlink = () => {
      const delay = 2000 + Math.random() * 4000;
      const holdClosed = emotion === 'sleepy' ? 400 : 80;
      const blinkSpeed = emotion === 'sleepy' ? 200 : 100;

      timeoutId = setTimeout(() => {
        const doubleBlink = Math.random() < 0.3 && emotion !== 'sleepy';

        if (doubleBlink) {
          blink.value = withSequence(
            withTiming(0.1, { duration: blinkSpeed }),
            withTiming(1, { duration: blinkSpeed }),
            withTiming(0.1, { duration: blinkSpeed }),
            withTiming(1, { duration: blinkSpeed })
          );
        } else {
          blink.value = withSequence(
            withTiming(0.1, { duration: blinkSpeed }),
            withTiming(1, { duration: holdClosed })
          );
        }
        scheduleBlink();
      }, delay);
    };

    scheduleBlink();
    return () => clearTimeout(timeoutId);
  }, [shouldAnimate, emotion, blink]);

  // ── Random looking around ─────────────────────────────────────────────────
  useEffect(() => {
    if (!shouldAnimate) {
      lookX.value = 0;
      lookY.value = 0;
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    const directions = [
      { x: 0, y: 0 },
      { x: 1.5, y: -0.5 },
      { x: -1.5, y: -0.5 },
      { x: 1, y: 1 },
      { x: -1, y: 1 },
      { x: 2, y: 0 },
      { x: -2, y: 0 },
    ];

    const scheduleLook = () => {
      const delay = 1200 + Math.random() * 2800;
      timeoutId = setTimeout(() => {
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const targetX = dir.x + config.lookBiasX;
        const targetY = dir.y + config.lookBiasY;

        lookX.value = withTiming(targetX, { duration: 350, easing: Easing.inOut(Easing.sin) });
        lookY.value = withTiming(targetY, { duration: 350, easing: Easing.inOut(Easing.sin) });
        scheduleLook();
      }, delay);
    };

    scheduleLook();
    return () => clearTimeout(timeoutId);
  }, [shouldAnimate, emotion, config, lookX, lookY]);

  // ── Animated styles ───────────────────────────────────────────────────────

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: center + swayX.value },
      { translateY: center + floatY.value },
      { rotate: `${tilt.value}deg` },
      { scaleX: breathe.value },
      { scaleY: breathe.value * squash.value },
      { translateX: -center },
      { translateY: -center },
    ],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(floatY.value, [-s * 0.06, 0], [0.22, 0.1]),
    transform: [
      { translateX: center + swayX.value * 0.5 },
      { translateY: center + s * 0.42 },
      { scaleX: interpolate(floatY.value, [-s * 0.06, 0], [0.7, 1]) },
      { translateX: -center },
      { translateY: -center },
    ],
  }));

  const glowStyle1 = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0, 0.25]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.3]) }],
  }));

  const glowStyle2 = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0, 0.15]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.5]) }],
  }));

  const ambientGlowStyle = useAnimatedStyle(() => ({
    opacity: 0.14 + interpolate(glow.value, [0, 1], [0, 0.2]),
    transform: [{ scale: 1.05 + interpolate(glow.value, [0, 1], [0, 0.15]) }],
  }));

  const leftEyeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: lookX.value * (s * 0.008) },
      { translateY: lookY.value * (s * 0.008) },
      { scaleY: blink.value * config.scaleY },
    ],
  }));

  const rightEyeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: lookX.value * (s * 0.008) },
      { translateY: lookY.value * (s * 0.008) },
      { scaleY: blink.value * config.scaleY },
    ],
  }));

  // ── Geometry ──────────────────────────────────────────────────────────────

  const leftEyeCX = s * 0.36;
  const rightEyeCX = s * 0.54;
  const eyeW = config.eyeRx * 2;
  const eyeH = config.eyeRy * 2;

  return (
    <View
      style={{ width: s, height: s }}
      accessibilityLabel={`Miriam AI assistant, ${emotion} mood`}
      accessibilityRole="image">
      {/* Ambient glow ring */}
      <Animated.View
        className="absolute inset-[-6px] rounded-full"
        style={[{ backgroundColor: color }, ambientGlowStyle]}
      />

      {/* Processing pulse rings */}
      {isProcessing && (
        <>
          <Animated.View
            className="absolute inset-[-10px] rounded-full"
            style={[{ backgroundColor: color, opacity: 0 }, glowStyle1]}
          />
          <Animated.View
            className="absolute inset-[-16px] rounded-full"
            style={[{ backgroundColor: color, opacity: 0 }, glowStyle2]}
          />
        </>
      )}

      {/* Shadow beneath */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            top: 0,
            width: s,
            height: s,
          },
          shadowStyle,
        ]}>
        <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <Ellipse
            cx={center}
            cy={center + radius * 0.9}
            rx={radius * 0.7}
            ry={radius * 0.15}
            fill="#000000"
          />
        </Svg>
      </Animated.View>

      {/* Body + Face (everything moves together) */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            top: 0,
            width: s,
            height: s,
          },
          bodyStyle,
        ]}>
        {/* Main sphere — solid brand color */}
        <View
          style={{
            position: 'absolute',
            left: center - radius,
            top: center - radius,
            width: radius * 2,
            height: radius * 2,
            borderRadius: radius,
            backgroundColor: color,
            overflow: 'hidden',
          }}>
          {/* Top-left warm highlight (creates 3D spherical feel) */}
          <View
            style={{
              position: 'absolute',
              left: -radius * 0.1,
              top: -radius * 0.15,
              width: radius * 1.4,
              height: radius * 1.4,
              borderRadius: radius * 0.7,
              backgroundColor: '#FF9A7A',
              opacity: 0.55,
            }}
          />

          {/* Bottom-right depth shadow */}
          <View
            style={{
              position: 'absolute',
              right: -radius * 0.15,
              bottom: -radius * 0.15,
              width: radius * 1.3,
              height: radius * 1.3,
              borderRadius: radius * 0.65,
              backgroundColor: '#7A1200',
              opacity: 0.45,
            }}
          />

          {/* Soft specular highlight */}
          <View
            style={{
              position: 'absolute',
              left: radius * 0.12,
              top: radius * 0.15,
              width: radius * 0.55,
              height: radius * 0.45,
              borderRadius: radius * 0.25,
              backgroundColor: '#FFFFFF',
              opacity: 0.28,
            }}
          />

          {/* Sharp pin highlight */}
          <View
            style={{
              position: 'absolute',
              left: radius * 0.18,
              top: radius * 0.22,
              width: radius * 0.18,
              height: radius * 0.14,
              borderRadius: radius * 0.09,
              backgroundColor: '#FFFFFF',
              opacity: 0.5,
            }}
          />
        </View>

        {/* Left Eye */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: leftEyeCX - config.eyeRx,
              top: config.leftY - config.eyeRy,
              width: eyeW,
              height: eyeH,
              borderRadius: config.eyeRx,
              backgroundColor: '#FFFFFF',
            },
            leftEyeStyle,
          ]}
        />

        {/* Right Eye */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: rightEyeCX - config.eyeRx,
              top: config.rightY - config.eyeRy,
              width: eyeW,
              height: eyeH,
              borderRadius: config.eyeRx,
              backgroundColor: '#FFFFFF',
            },
            rightEyeStyle,
          ]}
        />

        {/* Subtle cheek blush for happy emotion */}
        {emotion === 'happy' && (
          <>
            <View
              style={{
                position: 'absolute',
                left: s * 0.18,
                top: s * 0.48,
                width: s * 0.14,
                height: s * 0.14,
                borderRadius: s * 0.07,
                backgroundColor: '#FF7A52',
                opacity: 0.3,
              }}
            />
            <View
              style={{
                position: 'absolute',
                left: s * 0.68,
                top: s * 0.48,
                width: s * 0.14,
                height: s * 0.14,
                borderRadius: s * 0.07,
                backgroundColor: '#FF7A52',
                opacity: 0.3,
              }}
            />
          </>
        )}
      </Animated.View>
    </View>
  );
}
