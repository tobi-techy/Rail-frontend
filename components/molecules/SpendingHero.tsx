import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { Snowflake } from 'lucide-react-native';

interface Props {
  spent: string;        // e.g. "243.50"
  monthlyLimit: string; // e.g. "1000.00"
  trend: string;        // e.g. "+12%" or "-4%"
  isFrozen?: boolean;
}

const SIZE = 200;
const STROKE = 6;
const R = (SIZE - STROKE) / 2;
const CX = SIZE / 2;
const CY = SIZE / 2;

function makeArc(startDeg: number, sweepDeg: number) {
  const p = Skia.Path.Make();
  p.addArc({ x: CX - R, y: CY - R, width: R * 2, height: R * 2 }, startDeg, sweepDeg);
  return p;
}

const TRACK_START = -210;
const TRACK_SWEEP = 240;
const trackPath = makeArc(TRACK_START, TRACK_SWEEP);
const fillPath  = makeArc(TRACK_START, TRACK_SWEEP);

export function SpendingHero({ spent, monthlyLimit, trend, isFrozen }: Props) {
  const progress = useSharedValue(0);

  const spentNum = parseFloat(spent) || 0;
  const limitNum = parseFloat(monthlyLimit) || 1;
  const pct = Math.min(spentNum / limitNum, 1);
  const isOver = pct >= 0.8;
  const isUp = trend.startsWith('+');

  useEffect(() => {
    progress.value = withTiming(pct, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [pct]);

  return (
    <View style={{ alignItems: 'center', paddingTop: 8 }}>
      <View style={{ width: SIZE, height: SIZE }}>
        <Canvas style={{ width: SIZE, height: SIZE }}>
          {/* Track */}
          <Path
            path={trackPath}
            color="#EBEBEB"
            style="stroke"
            strokeWidth={STROKE}
            strokeCap="round"
          />
          {/* Fill */}
          <Path
            path={fillPath}
            color={isOver ? '#FF2E01' : '#000'}
            style="stroke"
            strokeWidth={STROKE}
            strokeCap="round"
            start={0}
            end={progress}
          />
        </Canvas>

        {/* Center content */}
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          alignItems: 'center', justifyContent: 'center',
        }}>
          {isFrozen && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              backgroundColor: '#EFF6FF', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3,
              marginBottom: 8,
            }}>
              <Snowflake size={11} color="#3B82F6" strokeWidth={2} />
              <Text style={{ fontFamily: 'SF-Pro-Rounded-Medium', fontSize: 11, color: '#3B82F6' }}>Frozen</Text>
            </View>
          )}
          <Text style={{ fontFamily: 'SF-Pro-Rounded-Regular', fontSize: 13, color: '#9CA3AF' }}>
            spent
          </Text>
          <Text style={{ fontFamily: 'SF-Pro-Rounded-Bold', fontSize: 38, color: '#000', letterSpacing: -1, lineHeight: 44 }}>
            ${spentNum.toFixed(2)}
          </Text>
          <Text style={{ fontFamily: 'SF-Pro-Rounded-Regular', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
            of ${limitNum.toLocaleString()} limit
          </Text>
          <Text style={{
            fontFamily: 'SF-Pro-Rounded-Medium', fontSize: 12, marginTop: 6,
            color: isUp ? '#FF2E01' : '#00C853',
          }}>
            {trend} vs last month
          </Text>
        </View>
      </View>
    </View>
  );
}
