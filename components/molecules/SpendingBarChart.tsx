import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Canvas, RoundedRect } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useDerivedValue,
  withTiming,
  Easing,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export interface BarChartMonth {
  month: string; // e.g. "Jan"
  value: number; // spending amount
}

interface Props {
  data: BarChartMonth[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  height?: number;
}

const BAR_RADIUS = 8;
const CHART_HEIGHT = 140;
const MIN_BAR_H = 6;

function Bar({
  x,
  barWidth,
  value,
  maxValue,
  chartHeight,
  isSelected,
  animProgress,
}: {
  x: number;
  barWidth: number;
  value: number;
  maxValue: number;
  chartHeight: number;
  isSelected: boolean;
  animProgress: ReturnType<typeof useSharedValue<number>>;
}) {
  const targetH = maxValue > 0 ? Math.max((value / maxValue) * chartHeight, MIN_BAR_H) : MIN_BAR_H;

  const h = useDerivedValue(() =>
    Math.max(targetH * animProgress.value, MIN_BAR_H)
  );
  const y = useDerivedValue(() => chartHeight - h.value);

  // selected=black, has value=dark grey, zero=light grey
  const color = isSelected ? '#000000' : value > 0 ? '#C0C0C0' : '#EBEBEB';

  return (
    <RoundedRect
      x={x}
      y={y}
      width={barWidth}
      height={h}
      r={BAR_RADIUS}
      color={color}
    />
  );
}

export function SpendingBarChart({ data, selectedIndex, onSelect, height = CHART_HEIGHT }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const PAD = 24;
  const chartWidth = screenWidth - PAD * 2;
  const count = data.length || 1;
  const gap = 6;
  const barWidth = (chartWidth - gap * (count - 1)) / count;
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const animProgress = useSharedValue(0);
  React.useEffect(() => {
    animProgress.value = 0;
    animProgress.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
  }, [data]);

  return (
    <View style={{ paddingHorizontal: PAD }}>
      {/* Value labels above bars */}
      <View style={{ height: 20, flexDirection: 'row', marginBottom: 4 }}>
        {data.map((d, i) => (
          <View key={i} style={{ width: barWidth + (i < count - 1 ? gap : 0), alignItems: 'center' }}>
            {i === selectedIndex && (
              <Text style={{ fontFamily: 'SF-Pro-Rounded-Semibold', fontSize: 11, color: '#000' }}>
                {d.value > 0 ? `$${Math.round(d.value)}` : ''}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Bars */}
      <Canvas style={{ width: chartWidth, height }}>
        {/* Baseline track */}
        <RoundedRect x={0} y={height - MIN_BAR_H} width={chartWidth} height={MIN_BAR_H} r={4} color="#F2F2F2" />
        {data.map((d, i) => (
          <Bar
            key={i}
            x={i * (barWidth + gap)}
            barWidth={barWidth}
            value={d.value}
            maxValue={maxValue}
            chartHeight={height}
            isSelected={i === selectedIndex}
            animProgress={animProgress}
          />
        ))}
      </Canvas>

      {/* Month labels + tap targets */}
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        {data.map((d, i) => (
          <MonthLabel
            key={i}
            label={d.month}
            isSelected={i === selectedIndex}
            width={barWidth + (i < count - 1 ? gap : 0)}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(i);
            }}
          />
        ))}
      </View>
    </View>
  );
}

function MonthLabel({
  label,
  isSelected,
  width,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  width: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.88, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      style={{ width, alignItems: 'center' }}>
      <Animated.Text
        style={[
          style,
          {
            fontFamily: isSelected ? 'SF-Pro-Rounded-Semibold' : 'SF-Pro-Rounded-Regular',
            fontSize: 12,
            color: isSelected ? '#000' : '#9CA3AF',
          },
        ]}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}
