import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { GorhomBottomSheet } from './GorhomBottomSheet';
import { Skeleton } from '@/components/atoms/Skeleton';
import { useStation } from '@/api/hooks';
import { useUIStore } from '@/stores';
import { formatCurrencyAmount, convertFromUsd } from '@/utils/currency';
import { ArrowRight01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import { router } from 'expo-router';

interface StashPerformanceSheetProps {
  visible: boolean;
  onClose: () => void;
}

const LOCK_PERIOD_DAYS = 90;
const APY_RATE = 0.045;

// Mini sparkline chart showing yield growth
function YieldChart({ height = 64 }: { height?: number }) {
  // Simulated yield growth curve (smooth upward trend)
  const points = [0, 2, 5, 4, 8, 12, 11, 15, 18, 22, 20, 25, 30, 28, 34, 38, 42, 45, 48, 52];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const chartW = 280;
  const chartH = height - 8;
  const stepX = chartW / (points.length - 1);

  const toY = (v: number) => chartH - ((v - min) / (max - min)) * (chartH - 4) - 2;

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${toY(p)}`).join(' ');

  const areaD = `${pathD} L ${(points.length - 1) * stepX} ${chartH} L 0 ${chartH} Z`;

  const lastX = (points.length - 1) * stepX;
  const lastY = toY(points[points.length - 1]);

  return (
    <View style={{ height }}>
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 ${chartW} ${height}`}
        preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#00ca48" stopOpacity="0.15" />
            <Stop offset="1" stopColor="#00ca48" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={areaD} fill="url(#chartGrad)" />
        <Path
          d={pathD}
          stroke="#00ca48"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={lastX} cy={lastY} r={3} fill="#00ca48" />
      </Svg>
    </View>
  );
}

function StatCard({
  label,
  value,
  accent,
  delay,
}: {
  label: string;
  value: string;
  accent?: boolean;
  delay: number;
}) {
  return (
    <Animated.View
      entering={FadeInUp.duration(250).delay(delay)}
      className="flex-1 rounded-2xl bg-[#f5f4f2] p-3.5">
      <Text className="font-body text-[11px] text-ash">{label}</Text>
      <Text
        className={`mt-1 font-mono-semibold text-base tabular-nums ${accent ? 'text-meadow-green' : 'text-charcoal-primary'}`}>
        {value}
      </Text>
    </Animated.View>
  );
}

export function StashPerformanceSheet({ visible, onClose }: StashPerformanceSheetProps) {
  const { data: station, isPending } = useStation();
  const isBalanceVisible = useUIStore((s) => s.isBalanceVisible);
  const selectedCurrency = useUIStore((s) => s.currency);
  const currencyRates = useUIStore((s) => s.currencyRates);

  const stashBalance = parseFloat(station?.invest_balance ?? '0');
  const dailyYield = (stashBalance * APY_RATE) / 365;
  const monthlyYield = dailyYield * 30;
  const totalYieldEstimate = monthlyYield * 3;

  const daysLocked = 47;
  const daysRemaining = Math.max(0, LOCK_PERIOD_DAYS - daysLocked);
  const progress = Math.round(((LOCK_PERIOD_DAYS - daysRemaining) / LOCK_PERIOD_DAYS) * 100);

  const formatAmount = (amount: number) => {
    const converted = convertFromUsd(amount, selectedCurrency, currencyRates);
    return formatCurrencyAmount(converted, selectedCurrency);
  };

  const stashDisplay = isBalanceVisible ? formatAmount(stashBalance) : '••••';
  const dailyDisplay = isBalanceVisible ? formatAmount(dailyYield) : '••••';
  const monthlyDisplay = isBalanceVisible ? formatAmount(monthlyYield) : '••••';
  const totalDisplay = isBalanceVisible ? formatAmount(totalYieldEstimate) : '••••';

  return (
    <GorhomBottomSheet visible={visible} onClose={onClose} showCloseButton={false} dismissible>
      <View className="gap-4 pb-2 pt-1">
        {/* Header: Balance + APY */}
        <Animated.View
          entering={FadeInUp.duration(300)}
          className="flex-row items-start justify-between">
          <View>
            <Text className="font-body text-xs text-ash">Stash Balance</Text>
            {isPending ? (
              <Skeleton className="mt-1 h-8 w-32" />
            ) : (
              <Text className="mt-0.5 font-mono-semibold text-3xl tabular-nums text-charcoal-primary">
                {stashDisplay}
              </Text>
            )}
          </View>
          <View className="mt-1 rounded-full bg-meadow-green/10 px-2.5 py-1">
            <Text className="font-mono-semibold text-xs text-meadow-green">
              {(APY_RATE * 100).toFixed(1)}%
            </Text>
          </View>
        </Animated.View>

        {/* Growth Chart */}
        <Animated.View
          entering={FadeIn.duration(400).delay(100)}
          className="rounded-2xl bg-[#f5f4f2] p-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="font-body-medium text-xs text-ash">Growth</Text>
            <Text className="font-body text-[10px] text-meadow-green">+{totalDisplay} earned</Text>
          </View>
          <YieldChart />
        </Animated.View>

        {/* Stats Grid */}
        <View className="flex-row gap-2.5">
          <StatCard label="Daily" value={dailyDisplay} delay={150} />
          <StatCard label="Monthly" value={monthlyDisplay} delay={200} />
          <StatCard label="Total" value={totalDisplay} accent delay={250} />
        </View>

        {/* Lockdown Progress */}
        <Animated.View
          entering={FadeInUp.duration(300).delay(300)}
          className="rounded-2xl bg-[#f5f4f2] p-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-body-medium text-sm text-charcoal-primary">
                {daysRemaining > 0 ? `${daysRemaining} days left` : 'Withdraw now'}
              </Text>
              <Text className="mt-0.5 font-body text-[11px] text-ash">
                {daysRemaining > 0
                  ? `${progress}% complete · ${daysRemaining > 60 ? '3%' : daysRemaining > 30 ? '2%' : '1%'} early fee`
                  : 'Withdrawal window open'}
              </Text>
            </View>
            <View className="bg-meadow-green/12 h-9 w-9 items-center justify-center rounded-full">
              <Text className="font-mono-semibold text-[11px] text-meadow-green">{progress}%</Text>
            </View>
          </View>
          {/* Progress bar */}
          <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-fog/30">
            <View
              className="h-full rounded-full bg-meadow-green"
              style={{ width: `${progress}%` }}
            />
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInUp.duration(300).delay(350)} className="gap-2.5 pt-1">
          <Pressable
            onPress={() => {
              onClose();
              router.push('/fund-stash' as never);
            }}
            className="items-center rounded-2xl bg-charcoal-primary py-3.5">
            <Text className="font-body-medium text-sm text-white">Add to Stash</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              onClose();
              router.push('/withdraw/early-withdraw' as never);
            }}
            className="flex-row items-center justify-center gap-1 rounded-2xl bg-[#f5f4f2] py-3">
            <Text className="font-body-medium text-sm text-charcoal-primary">
              {daysRemaining === 0 ? 'Withdraw' : 'Early Withdraw'}
            </Text>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="#343433" />
          </Pressable>
        </Animated.View>
      </View>
    </GorhomBottomSheet>
  );
}
