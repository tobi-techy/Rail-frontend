import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Canvas, RoundedRect, Group } from '@shopify/react-native-skia';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  useDerivedValue,
  Easing,
  SharedValue,
} from 'react-native-reanimated';

interface BarChartProps {
  data: number[];
  periods?: string[];
  activePeriod?: string;
  onPeriodChange?: (period: string) => void;
  height?: number;
  barColor?: string;
  className?: string;
}

const DEFAULT_PERIODS = ['1D', '1W', '1M', '6M', '1Y'];

function AnimatedBar({
  x,
  targetHeight,
  maxHeight,
  barWidth,
  color,
  index,
  animationProgress,
}: {
  x: number;
  targetHeight: number;
  maxHeight: number;
  barWidth: number;
  color: string;
  index: number;
  animationProgress: SharedValue<number>;
}) {
  const delayFactor = index * 0.015;

  const height = useDerivedValue(() => {
    const progress = Math.max(
      0,
      Math.min(1, (animationProgress.value - delayFactor) / (1 - delayFactor))
    );
    return Math.max(progress * targetHeight, 4);
  });

  const y = useDerivedValue(() => maxHeight - height.value);

  return (
    <RoundedRect x={x} y={y} width={barWidth} height={height} r={barWidth / 2} color={color} />
  );
}

export function BarChart({
  data,
  periods = DEFAULT_PERIODS,
  activePeriod = '6M',
  onPeriodChange,
  height = 120,
  barColor = '#D4D4D4',
  className,
}: BarChartProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [selectedPeriod, setSelectedPeriod] = useState(activePeriod);
  const animationProgress = useSharedValue(0);

  const chartWidth = screenWidth - 48;
  const gap = 3;
  const barWidth = Math.max(3, (chartWidth - gap * (data.length - 1)) / data.length);

  const maxValue = Math.max(...data, 1);
  const normalizedData = data.map((v) => (v / maxValue) * height);

  useEffect(() => {
    animationProgress.value = 0;
    animationProgress.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [selectedPeriod]);

  const handlePeriodChange = useCallback(
    (period: string) => {
      setSelectedPeriod(period);
      onPeriodChange?.(period);
    },
    [onPeriodChange]
  );

  return (
    <View className={className}>
      <Canvas style={{ width: chartWidth, height }}>
        <Group>
          {normalizedData.map((barHeight, i) => (
            <AnimatedBar
              key={`${selectedPeriod}-${i}`}
              x={i * (barWidth + gap)}
              targetHeight={Math.max(barHeight, 4)}
              maxHeight={height}
              barWidth={barWidth}
              color={barColor}
              index={i}
              animationProgress={animationProgress}
            />
          ))}
        </Group>
      </Canvas>

      <View className="mt-4 flex-row items-center justify-center gap-1">
        {periods.map((period) => (
          <PeriodButton
            key={period}
            period={period}
            isActive={selectedPeriod === period}
            onPress={handlePeriodChange}
          />
        ))}
      </View>
    </View>
  );
}

function PeriodButton({
  period,
  isActive,
  onPress,
}: {
  period: string;
  isActive: boolean;
  onPress: (period: string) => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={() => onPress(period)}
      onPressIn={() => {
        scale.value = withSpring(0.9, { damping: 15 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15 });
      }}>
      <Animated.View
        className={`rounded-full px-4 py-2 ${isActive ? 'bg-black/5' : ''}`}
        style={animatedStyle}>
        <Text className={`text-sm font-medium ${isActive ? 'text-black' : 'text-neutral-400'}`}>
          {period}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
