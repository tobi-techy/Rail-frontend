import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import React, { useLayoutEffect, useMemo, useState, useCallback } from 'react';
import { router, useNavigation } from 'expo-router';
import { BalanceCard } from '@/components/molecules/BalanceCard';
import { ArrowDown, ArrowLeft, TrendingUp } from 'lucide-react-native';
import { TransactionList } from '@/components/molecules/TransactionList';
import type { Transaction } from '@/components/molecules/TransactionItem';
import { Button } from '@/components/ui';
import { Chart } from '@/components/atoms/Chart';
import InvestmentsEmptyIllustration from '@/assets/Illustrations/investments-empty.svg';

const PERIODS = ['1D', '1W', '1M', '6M', '1Y', 'ALL'];

const MOCK_CHART_DATA = [
  { value: 100 },
  { value: 120 },
  { value: 115 },
  { value: 140 },
  { value: 135 },
  { value: 160 },
  { value: 155 },
  { value: 180 },
  { value: 175 },
  { value: 200 },
  { value: 195 },
  { value: 220 },
  { value: 240 },
  { value: 235 },
  { value: 260 },
];

export default function InvestmentStashScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const [activePeriod, setActivePeriod] = useState('6M');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerLeft: () => (
        <View className="flex-row items-center gap-x-3 pl-[14px]">
          {/*<Grid3X3Icon size={28} strokeWidth={0.8} fill={'#000'} color={'#fff'} />*/}
          <Text className="font-subtitle text-headline-1">{'Investment'}</Text>
        </View>
      ),
      title: '',
      headerStyle: {
        backgroundColor: 'transparent',
      },
    });
  }, [navigation]);

  const transactions = useMemo<Transaction[]>(() => [], []);

  const displayBalance = '$12,450.00';
  const displayPerformance = '+12.50%';
  const displayBuyingPower = '$2,340.00';
  const isPositive = !displayPerformance.startsWith('-');

  return (
    <ScrollView
      className="min-h-screen flex-1 bg-white"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
      }>
      <View className="px-[14px]">
        {/* Balance Card */}
        <BalanceCard
          balance={displayBalance}
          percentChange={displayPerformance}
          buyingPower={displayBuyingPower}
          timeframe={activePeriod}
        />

        {/* Action Buttons */}
        <View className="mt-6 flex-row gap-3">
          <Button
            title="Apply"
            // leftIcon={<TrendingUp size={20} color="white" />}
            size="small"
            variant="black"
          />
          <Button
            title="Withdraw"
            leftIcon={<ArrowDown size={20} color="black" />}
            size="small"
            variant="white"
          />
        </View>

        {/* Transaction History Section */}
        <View className="py-5">
          {transactions.length === 0 ? (
            <View className="items-center justify-center rounded-3xl bg-white px-5 py-8">
              <InvestmentsEmptyIllustration width={220} height={140} />
              <Text className="mt-4 text-center font-subtitle text-headline-2 text-gray-900">
                No investments yet
              </Text>
              <Text className="mt-2 text-center font-body text-base text-gray-500">
                Start investing to see your portfolio activity here.
              </Text>
            </View>
          ) : (
            <TransactionList
              title="Investment Activity"
              transactions={transactions}
              emptyStateMessage="No activity to show yet."
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}
