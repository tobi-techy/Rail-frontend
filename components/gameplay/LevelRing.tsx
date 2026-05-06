import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface LevelRingProps {
  size?: number;
  strokeWidth?: number;
  progress?: number; // 0-100
  glow?: boolean;
}

export function LevelRing({
  size = 128,
  strokeWidth = 5,
  progress = 0,
  glow = true,
}: LevelRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(Math.min(progress, 100) / 100, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [animatedProgress, progress]);

  const progressProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const glowProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
    opacity: 0.15 + animatedProgress.value * 0.25,
  }));

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#f2f0ed"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Glow arc (wider, behind) */}
        {glow && (
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke="#ff3e00"
            strokeWidth={strokeWidth + 4}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animatedProps={glowProps}
          />
        )}
        {/* Progress arc */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke="#ff3e00"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={progressProps}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
    </View>
  );
}
