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
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

interface BarChartProps {
  data: number[];
  periods?: string[];
  activePeriod?: string;
  onPeriodChange?: (period: string) => void;
  height?: number;
  barColor?: string;
  subtitle?: string;
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
  const delayFactor = index * 0.012;

  const height = useDerivedValue(() => {
    const progress = Math.max(
      0,
      Math.min(1, (animationProgress.value - delayFactor) / (1 - delayFactor))
    );
    return Math.max(progress * targetHeight, 2);
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
  height = 80,
  barColor = '#6366F1',
  subtitle,
  className,
}: BarChartProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [selectedPeriod, setSelectedPeriod] = useState(activePeriod);
  const animationProgress = useSharedValue(0);

  const chartWidth = screenWidth;
  const barWidth = 4;
  const gap = (chartWidth - barWidth * data.length) / (data.length - 1);

  const maxValue = Math.max(...data, 1);
  const normalizedData = data.map((v) => (v / maxValue) * height);

  useEffect(() => {
    animationProgress.value = 0;
    animationProgress.value = withTiming(1, {
      duration: 600,
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
      {subtitle && (
        <Animated.Text
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          key={selectedPeriod}
          className="mb-3 text-center font-body text-xs text-neutral-400">
          {subtitle}
        </Animated.Text>
      )}

      <View style={{ width: screenWidth, left: -16 }}>
        <Canvas style={{ width: chartWidth, height }}>
          <Group>
            {normalizedData.map((barHeight, i) => (
              <AnimatedBar
                key={`${selectedPeriod}-${i}`}
                x={i * (barWidth + gap)}
                targetHeight={Math.max(barHeight, 2)}
                maxHeight={height}
                barWidth={barWidth}
                color={barColor}
                index={i}
                animationProgress={animationProgress}
              />
            ))}
          </Group>
        </Canvas>
      </View>

      <View className="mt-5 flex-row items-center justify-center">
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
        scale.value = withSpring(0.92, { damping: 15 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15 });
      }}>
      <Animated.View
        className={`mx-1 rounded-full px-4 py-2 ${isActive ? 'bg-neutral-100' : ''}`}
        style={animatedStyle}>
        <Text className={`text-sm font-medium ${isActive ? 'text-black' : 'text-neutral-300'}`}>
          {period}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
