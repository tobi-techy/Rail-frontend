import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Skeleton } from '@/components/atoms/Skeleton';

interface HealthScoreLeverProps {
  score: number; // 0–100
  isLoading?: boolean;
  height?: number;
}

const AnimatedView = Animated.createAnimatedComponent(View);

function getScoreColor(score: number): string {
  if (score >= 70) return '#00ca48';
  if (score >= 40) return '#ffbb26';
  return '#ff2b3a';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs work';
}

export function HealthScoreLever({ score, isLoading, height = 120 }: HealthScoreLeverProps) {
  const clampedScore = Math.min(100, Math.max(0, score));
  const handlePosition = useSharedValue(clampedScore);
  const scale = useSharedValue(1);

  useEffect(() => {
    handlePosition.value = withDelay(300, withSpring(clampedScore, { damping: 18, stiffness: 90 }));
  }, [clampedScore, handlePosition]);

  const handleStyle = useAnimatedStyle(() => {
    const pct = handlePosition.value / 100;
    const trackHeight = height - 16;
    const y = trackHeight * (1 - pct);
    return {
      transform: [{ translateY: y }, { scale: scale.value }],
    };
  });

  const color = getScoreColor(clampedScore);
  const label = getScoreLabel(clampedScore);

  if (isLoading) {
    return (
      <View className="items-center" style={{ height }}>
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="mt-2 h-2 w-14" />
        <Skeleton className="mt-1 h-2 w-10" />
      </View>
    );
  }

  return (
    <View className="items-center" style={{ height }}>
      {/* Track */}
      <View
        className="w-3 items-center overflow-hidden rounded-full"
        style={{ height: height - 16, backgroundColor: '#f2f2f2' }}>
        <LinearGradient
          colors={['#00ca48', '#ffbb26', '#ff2b3a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ width: '100%', height: '100%' }}
        />
      </View>

      {/* Handle */}
      <AnimatedView
        style={[
          handleStyle,
          {
            position: 'absolute',
            top: 0,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: color,
            borderWidth: 2.5,
            borderColor: '#ffffff',
            shadowColor: color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.35,
            shadowRadius: 4,
            elevation: 4,
          },
        ]}
      />

      {/* Score text */}
      <Text className="mt-2 font-mono-semibold text-[13px] text-charcoal-primary">
        {clampedScore}
      </Text>
      <Text className="font-caption text-[10px] text-ash">{label}</Text>
    </View>
  );
}
