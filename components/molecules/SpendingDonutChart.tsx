import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useSharedValue, withSpring } from 'react-native-reanimated';

export interface DonutSegment {
  label: string;
  amount: number;
  color: string;
}

interface Props {
  segments: DonutSegment[];
  total: string;
  subtitle?: string;
  size?: number;
  strokeWidth?: number;
}

const TAU = Math.PI * 2;
const START_ANGLE = -Math.PI / 2;
const GAP_DEG = 1.8; // degrees gap between segments
const R2D = 180 / Math.PI;

// Build a static arc path (degrees)
function makeArcPath(cx: number, cy: number, r: number, startDeg: number, sweepDeg: number) {
  const p = Skia.Path.Make();
  p.addArc({ x: cx - r, y: cy - r, width: r * 2, height: r * 2 }, startDeg, sweepDeg);
  return p;
}

function AnimatedArc({
  cx,
  cy,
  r,
  startDeg,
  sweepDeg,
  color,
  strokeWidth,
  progress,
}: {
  cx: number;
  cy: number;
  r: number;
  startDeg: number;
  sweepDeg: number;
  color: string;
  strokeWidth: number;
  progress: ReturnType<typeof useSharedValue<number>>;
}) {
  const fullPath = makeArcPath(cx, cy, r, startDeg, sweepDeg);

  return (
    <Path
      path={fullPath}
      color={color}
      style="stroke"
      strokeWidth={strokeWidth}
      strokeCap="round"
      start={0}
      end={progress}
    />
  );
}

export function SpendingDonutChart({
  segments,
  total,
  subtitle = 'Spent this month',
  size = 220,
  strokeWidth = 24,
}: Props) {
  const progress = useSharedValue(0);
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;

  useEffect(() => {
    progress.value = 0;
    progress.value = withSpring(1, { damping: 18, stiffness: 80, mass: 1.2 });
  }, [segments.length]);

  const totalValue = segments.reduce((s, seg) => s + seg.amount, 0);

  const arcs: { startDeg: number; sweepDeg: number; color: string }[] = [];
  let cursorDeg = START_ANGLE * R2D;

  if (totalValue === 0) {
    arcs.push({ startDeg: START_ANGLE * R2D, sweepDeg: 359.9, color: '#F0F0F0' });
  } else {
    segments.forEach((seg) => {
      const fraction = seg.amount / totalValue;
      const sweepDeg = fraction * 360 - (segments.length > 1 ? GAP_DEG : 0);
      arcs.push({ startDeg: cursorDeg, sweepDeg, color: seg.color });
      cursorDeg += fraction * 360;
    });
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size }}>
        <Canvas style={{ width: size, height: size }}>
          {arcs.map((arc, i) => (
            <AnimatedArc
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              startDeg={arc.startDeg}
              sweepDeg={arc.sweepDeg}
              color={arc.color}
              strokeWidth={strokeWidth}
              progress={progress}
            />
          ))}
        </Canvas>

        <View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ fontFamily: 'SF-Pro-Rounded-Bold', fontSize: 26, color: '#000', letterSpacing: -0.5 }}>
            {total}
          </Text>
          <Text style={{ fontFamily: 'SF-Pro-Rounded-Regular', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
            {subtitle}
          </Text>
        </View>
      </View>
    </View>
  );
}
