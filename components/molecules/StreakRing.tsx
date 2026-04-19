import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { FireIcon, Target01Icon, CheckmarkCircle01Icon } from '@hugeicons/core-free-icons';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── Streak milestones ────────────────────────────────────────────
const MILESTONES = [
  { days: 3, label: 'Spark', icon: FireIcon },
  { days: 7, label: 'On Fire', icon: FireIcon },
  { days: 14, label: 'Committed', icon: Target01Icon },
  { days: 30, label: 'Unstoppable', icon: FireIcon },
  { days: 60, label: 'Iron Will', icon: Target01Icon },
  { days: 90, label: 'Diamond', icon: Target01Icon },
  { days: 365, label: 'Legend', icon: FireIcon },
];

function getNextMilestone(current: number) {
  return MILESTONES.find((m) => m.days > current) ?? MILESTONES[MILESTONES.length - 1];
}

function getCurrentMilestone(current: number) {
  const passed = MILESTONES.filter((m) => m.days <= current);
  return passed.length > 0 ? passed[passed.length - 1] : null;
}

// ── Ring ─────────────────────────────────────────────────────────
function Ring({ progress, size = 140, strokeWidth = 6 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withSpring(Math.min(progress, 1), { damping: 20, stiffness: 80 });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      {/* Background ring */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#F3F4F6"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress ring */}
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#FF2E01"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        animatedProps={animatedProps}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ── Week dots (last 4 weeks) ─────────────────────────────────────
function WeekDots({ activeDates }: { activeDates: string[] }) {
  const dateSet = new Set(activeDates);
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Build 4 weeks of data
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
    <View style={{ marginTop: 24 }}>
      {/* Day labels */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 }}>
        {days.map((d, i) => (
          <Text key={i} style={{ fontFamily: 'SFMono-Medium', fontSize: 10, color: '#9CA3AF', width: 28, textAlign: 'center' }}>
            {d}
          </Text>
        ))}
      </View>
      {/* Week rows */}
      {weeks.map((week, wi) => (
        <View key={wi} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, paddingHorizontal: 4 }}>
          {week.map((day, di) => {
            const dot = (
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: day.active ? '#FF2E01' : 'transparent',
                  borderWidth: day.active ? 0 : 1.5,
                  borderColor: day.active ? 'transparent' : '#E5E7EB',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {day.active && (
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} color="#FFFFFF" />
                )}
              </View>
            );

            if (day.isToday) {
              return (
                <Animated.View key={di} style={[{ width: 28, alignItems: 'center' }, pulseStyle]}>
                  {dot}
                </Animated.View>
              );
            }
            return <View key={di} style={{ width: 28, alignItems: 'center' }}>{dot}</View>;
          })}
        </View>
      ))}
    </View>
  );
}

// ── Next milestone card ──────────────────────────────────────────
function MilestoneCard({ currentStreak }: { currentStreak: number }) {
  const next = getNextMilestone(currentStreak);
  const prev = getCurrentMilestone(currentStreak);
  const prevDays = prev?.days ?? 0;
  const progress = next.days > prevDays ? (currentStreak - prevDays) / (next.days - prevDays) : 1;
  const remaining = next.days - currentStreak;

  if (remaining <= 0) return null;

  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(400)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7ED',
        borderRadius: 16,
        padding: 14,
        marginTop: 20,
        gap: 12,
      }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF0ED', alignItems: 'center', justifyContent: 'center' }}>
        <HugeiconsIcon icon={next.icon} size={20} color="#FF2E01" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'SFProDisplay-Semibold', fontSize: 14, color: '#1A1A1A' }}>
          {remaining} more day{remaining !== 1 ? 's' : ''} to {next.label}
        </Text>
        <View style={{ height: 4, backgroundColor: '#FED7AA', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
          <View style={{ height: 4, width: `${Math.min(progress * 100, 100)}%`, backgroundColor: '#FF2E01', borderRadius: 2 }} />
        </View>
      </View>
    </Animated.View>
  );
}

// ── Main export ──────────────────────────────────────────────────
interface Props {
  currentStreak: number;
  longestStreak?: number;
  activeDates: string[];
  streakType?: string;
}

export function StreakRing({ currentStreak, longestStreak, activeDates, streakType }: Props) {
  const next = getNextMilestone(currentStreak);
  const prev = getCurrentMilestone(currentStreak);
  const prevDays = prev?.days ?? 0;
  const ringProgress = next.days > prevDays ? (currentStreak - prevDays) / (next.days - prevDays) : 1;

  // Flame breathe animation for active streaks
  const flameScale = useSharedValue(1);
  useEffect(() => {
    if (currentStreak > 0) {
      flameScale.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      );
    }
  }, [currentStreak]);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flameScale.value }],
  }));

  return (
    <View>
      {/* Ring + center content */}
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: 140, height: 140, alignItems: 'center', justifyContent: 'center' }}>
          <Ring progress={ringProgress} />
          {/* Center content */}
          <View style={{ position: 'absolute', alignItems: 'center' }}>
            <Animated.View style={flameStyle}>
              <HugeiconsIcon icon={FireIcon} size={22} color={currentStreak > 0 ? '#FF2E01' : '#D1D5DB'} />
            </Animated.View>
            <Text style={{ fontFamily: 'SFMono-Semibold', fontSize: 36, color: '#1A1A1A', marginTop: 2, letterSpacing: -1 }}>
              {currentStreak}
            </Text>
            <Text style={{ fontFamily: 'SFProDisplay-Regular', fontSize: 12, color: '#8C8C8C', marginTop: -2 }}>
              day{currentStreak !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Longest streak */}
        {longestStreak != null && longestStreak > 0 && (
          <Text style={{ fontFamily: 'SFMono-Medium', fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>
            Longest: {longestStreak} days
          </Text>
        )}
      </View>

      {/* Week dots */}
      <WeekDots activeDates={activeDates} />

      {/* Next milestone */}
      <MilestoneCard currentStreak={currentStreak} />
    </View>
  );
}
