import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { CheckmarkCircle01Icon } from '@hugeicons/core-free-icons';

interface Props {
  currentStreak: number;
  longestStreak?: number;
  activeDates: string[];
  streakType?: string;
}

export function StreakRing({ activeDates }: Props) {
  const dateSet = new Set(activeDates);
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const weeks: { date: string; active: boolean; isToday: boolean }[][] = [];
  for (let w = 3; w >= 0; w--) {
    const week: { date: string; active: boolean; isToday: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (w * 7 + (6 - d)));
      const key = date.toISOString().split('T')[0];
      week.push({ date: key, active: dateSet.has(key), isToday: key === todayStr });
    }
    weeks.push(week);
  }

  const todayPulse = useSharedValue(1);
  useEffect(() => {
    todayPulse.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: todayPulse.value }],
  }));

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 }}>
        {days.map((d, i) => (
          <Text key={i} style={{ fontFamily: 'SFMono-Medium', fontSize: 10, color: '#9CA3AF', width: 28, textAlign: 'center' }}>{d}</Text>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, paddingHorizontal: 4 }}>
          {week.map((day, di) => {
            const dot = (
              <View style={{
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: day.active ? '#FF2E01' : 'transparent',
                borderWidth: day.active ? 0 : 1.5,
                borderColor: day.active ? 'transparent' : '#E5E7EB',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {day.active && <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} color="#FFFFFF" />}
              </View>
            );
            if (day.isToday) {
              return <Animated.View key={di} style={[{ width: 28, alignItems: 'center' }, pulseStyle]}>{dot}</Animated.View>;
            }
            return <View key={di} style={{ width: 28, alignItems: 'center' }}>{dot}</View>;
          })}
        </View>
      ))}
    </View>
  );
}
