import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

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
        withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [todayPulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: todayPulse.value }],
  }));

  return (
    <View>
      <View className="mb-2 flex-row justify-between px-1">
        {days.map((d, i) => (
          <Text
            key={i}
            className="w-8 text-center font-mono-medium text-[10px] text-text-tertiary">
            {d}
          </Text>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} className="mb-2 flex-row justify-between px-1">
          {week.map((day, di) => {
            const dot = (
              <View
                className={`h-8 w-8 items-center justify-center rounded-full ${
                  day.active
                    ? 'bg-primary'
                    : 'border-2 border-gray-200 bg-transparent'
                }`}
              />
            );
            if (day.isToday) {
              return (
                <Animated.View
                  key={di}
                  className="w-8 items-center"
                  style={pulseStyle}>
                  {dot}
                </Animated.View>
              );
            }
            return (
              <View key={di} className="w-8 items-center">
                {dot}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
