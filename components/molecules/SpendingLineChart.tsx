import React, { useEffect, useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { Canvas, Path, LinearGradient, vec, Skia, Circle, Group } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  useDerivedValue,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';

export interface ChartDataPoint {
  label: string;
  value: number;
}

interface Props {
  data: ChartDataPoint[];
  height?: number;
  lineColor?: string;
  gradientColors?: string[];
  className?: string;
}

const CHART_HEIGHT = 180;

export function SpendingLineChart({
  data,
  height = CHART_HEIGHT,
  lineColor = '#000000',
  gradientColors = ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0)'],
  className,
}: Props) {
  const { width: screenWidth } = Dimensions.get('window');

  const animationProgress = useSharedValue(0);
  const dotRadius = useDerivedValue(() => Math.max(0, (animationProgress.value - 0.8) * 5) * 4);

  useEffect(() => {
    animationProgress.value = 0;
    animationProgress.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.exp) });
  }, [data, animationProgress]);

  const { path, fillPath, maxVal, lastPoint } = useMemo(() => {
    const cw = screenWidth;
    const skPath = Skia.Path.Make();
    const skFillPath = Skia.Path.Make();

    if (!data || data.length === 0) {
      return { path: skPath, fillPath: skFillPath, maxVal: 0, lastPoint: { x: 0, y: height } };
    }

    const count = data.length;
    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const minVal = 0;
    const range = maxVal - minVal;
    const stepX = cw / Math.max(count - 1, 1);

    data.forEach((p, i) => {
      const x = i * stepX;
      const y = height - ((p.value - minVal) / range) * height;
      if (i === 0) {
        skPath.moveTo(x, y);
      } else {
        skPath.lineTo(x, skPath.getLastPt().y);
        skPath.lineTo(x, y);
      }
    });

    const lastPt = skPath.getLastPt();
    skFillPath.addPath(skPath);
    skFillPath.lineTo(cw, height);
    skFillPath.lineTo(0, height);
    skFillPath.close();

    return { path: skPath, fillPath: skFillPath, maxVal, lastPoint: lastPt };
  }, [data, height, screenWidth]);

  return (
    <Animated.View className={className} entering={FadeInDown.duration(800).delay(100).springify()}>
      {/* Full-bleed chart canvas */}
      <View style={{ height, width: screenWidth }}>
        <Canvas style={{ flex: 1 }}>
          {/* Gradient fill */}
          <Group opacity={animationProgress}>
            <Path path={fillPath}>
              <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={gradientColors} />
            </Path>
          </Group>

          {/* Step-line */}
          <Path
            path={path}
            style="stroke"
            strokeWidth={2.5}
            color={lineColor}
            strokeJoin="round"
            end={animationProgress}
          />

          {/* End dot */}
          {data.length > 0 && (
            <Circle cx={lastPoint.x} cy={lastPoint.y} r={dotRadius} color={lineColor} />
          )}
        </Canvas>

        {/* Max-value label */}
        {data.length > 0 && (
          <Animated.View
            entering={FadeIn.duration(800).delay(600)}
            style={{
              position: 'absolute',
              right: 20,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
              opacity: 0.25,
            }}>
            <Text style={{ fontFamily: 'SF-Pro-Rounded-Regular', fontSize: 10, color: '#555' }}>
              {Math.round(maxVal)}
            </Text>
          </Animated.View>
        )}
      </View>

      {/* X-axis labels — re-padded */}
      <Animated.View
        entering={FadeIn.duration(800).delay(400)}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 12,
          paddingHorizontal: 20,
        }}>
        {data.map((d, i) => {
          if (data.length > 6 && i % 2 !== 0 && i !== data.length - 1 && i !== 0) return null;
          return (
            <Text
              key={i}
              style={{ fontFamily: 'SF-Pro-Rounded-Regular', fontSize: 12, color: '#9CA3AF' }}>
              {d.label}
            </Text>
          );
        })}
      </Animated.View>
    </Animated.View>
  );
}
