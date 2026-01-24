import { View, Text, ScrollView, RefreshControl } from 'react-native';
import React, { useLayoutEffect, useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useNavigation } from 'expo-router';
import { BalanceCard } from '@/components/molecules/BalanceCard';
import { BarChart } from '@/components/molecules/BarChart';
import { ArrowDown, Grid3x3Icon, PersonStanding } from 'lucide-react-native';
import type { Transaction } from '@/components/molecules/TransactionItem';
import { Button } from '../../components/ui';
import { FloatingBackButton } from '@/components/FloatingBackButton';
import { AnimatedScreen } from '@/components/AnimatedScreen';

const PERIODS = ['1D', '1W', '1M', '6M', '1Y'];

const generateChartData = (period: string): number[] => {
  const counts: Record<string, number> = {
    '1D': 24,
    '1W': 28,
    '1M': 30,
    '6M': 40,
    '1Y': 48,
  };
  const count = counts[period] || 40;
  return Array.from({ length: count }, () => 20 + Math.random() * 80);
};

const PERIOD_SUBTITLES: Record<string, string> = {
  '1D': "Today's performance",
  '1W': 'Past 7 days',
  '1M': 'Past 30 days',
  '6M': 'Past 6 months',
  '1Y': 'Past year',
};

export default function InvestmentStashScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [activePeriod, setActivePeriod] = useState('6M');
  const [chartData, setChartData] = useState(() => generateChartData('6M'));
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    refreshTimeoutRef.current = setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handlePeriodChange = useCallback((period: string) => {
    setActivePeriod(period);
    setChartData(generateChartData(period));
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <View className="flex-row items-center gap-x-3">
          <View className="h-6 w-6 items-center justify-center rounded-[12px] bg-[#FF8A65]">
            <Grid3x3Icon size={12} color="white" fill="white" />
          </View>
          <Text className="font-subtitle text-subtitle">Investment</Text>
        </View>
      ),
      headerStyle: { backgroundColor: '#fff' },
    });
  }, [navigation]);

  const transactions = useMemo<Transaction[]>(() => [], []);

  // TODO: Replace with actual data fetching from API (RAIL-XXX)
  const displayBalance = '$00.00';
  const displayPerformance = '+00.00%';
  const displayBuyingPower = '$00.00';

  return (
    <AnimatedScreen>
      <View className="flex-1 bg-white">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
          }>
          <View className="px-4">
            <BalanceCard
              balance={displayBalance}
              percentChange={displayPerformance}
              buyingPower={displayBuyingPower}
              timeframe={activePeriod}
            />

            <View className="mt-4 flex-row gap-3">
              <Button
                title="Become a Conductor"
                leftIcon={<PersonStanding size={20} color="white" />}
                size="small"
                variant="black"
                disabled
              />
              <Button
                title="Withdraw"
                leftIcon={<ArrowDown size={20} color="black" />}
                size="small"
                variant="white"
                disabled
              />
            </View>
          </View>
          <BarChart
            data={chartData}
            periods={PERIODS}
            activePeriod={activePeriod}
            onPeriodChange={handlePeriodChange}
            subtitle={PERIOD_SUBTITLES[activePeriod]}
            height={100}
            className="mt-8"
          />
        </ScrollView>
        <FloatingBackButton />
      </View>
    </AnimatedScreen>
  );
}
