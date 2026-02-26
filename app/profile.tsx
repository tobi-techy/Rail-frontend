import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from 'expo-router';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { BalanceCard } from '@/components';
import { Avatar } from '@rneui/base';
import { usePortfolioOverview } from '@/api';
import { PlusIcon } from 'lucide-react-native';
import { Button } from '../components/ui';
import { useUIStore } from '@/stores';
import { convertFromUsd, formatCurrencyAmount } from '@/utils/currency';

const Profile = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const selectedCurrency = useUIStore((s) => s.currency);
  const currencyRates = useUIStore((s) => s.currencyRates);

  // Fetch portfolio overview with automatic refetching
  const { data: portfolio, refetch } = usePortfolioOverview();

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Format currency with proper decimals
  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num)
      ? formatCurrencyAmount(0, selectedCurrency)
      : formatCurrencyAmount(
          convertFromUsd(num, selectedCurrency, currencyRates),
          selectedCurrency
        );
  };

  // Format percentage with sign
  const formatPercentage = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) {
      return '0.00%';
    }
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // Use loading placeholder values when no data yet
  const displayBalance = portfolio ? formatCurrency(portfolio.totalPortfolio) : '$00.00';
  const displayPerformance = portfolio ? formatPercentage(portfolio.performanceLast30d) : '---%';
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerLeft: () => (
        <View className="items-start pl-[14px]">
          <Text className="font-body-bold text-[40px] font-bold text-[#000] ">Portfolio</Text>
        </View>
      ),
      headerRight: () => (
        <View className="flex-row items-center gap-x-[12px] pr-[14px]">
          <Avatar size={40} rounded title="Fc" containerStyle={{ backgroundColor: '#3d4db7' }} />
        </View>
      ),
      title: '',
      headerStyle: {
        backgroundColor: 'transparent',
      },
    });
  }, [navigation]);
  return (
    <ScrollView
      className="flex-1"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
      }>
      <View className="px-[14px] ">
        <BalanceCard
          balance={displayBalance}
          percentChange={displayPerformance}
          timeframe="Last 30d"
          className="rounded-x"
        />

        <View className="mt-4 flex-row gap-3">
          <Button
            title="Apply"
            // onPress={() => router.navigate('/deposit')}
            leftIcon={<PlusIcon size={24} color="white" />}
            size="small"
          />
          {/*<Button
            title=""
            // onPress={() => router.navigate('/withdraw')}
            leftIcon={<ArrowDown size={24} color="black" />}
            size="small"
            variant="white"
          />*/}
        </View>
      </View>
    </ScrollView>
  );
};

export default Profile;
