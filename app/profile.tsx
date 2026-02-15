import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from 'expo-router';
import React, { useCallback, useLayoutEffect, useState, useMemo } from 'react';
import { Chart, BalanceCard } from '@/components';
import { Avatar } from '@rneui/base';
import { usePortfolioOverview } from '@/api';
import { ArrowDown, PlusIcon } from 'lucide-react-native';
import { Button } from '../components/ui';

const Profile = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch portfolio overview with automatic refetching
  const { data: portfolio, isError, error, refetch } = usePortfolioOverview();

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
    return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
  };

  // Format percentage with sign
  const formatPercentage = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) {
      return '0.00%';
    }
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // Only show error if no cached data exists and it's not a 404
  const is404 = error?.error?.code === 'HTTP_404';
  const showError = isError && !portfolio && !is404;

  // Use loading placeholder values when no data yet
  const displayBalance = portfolio ? formatCurrency(portfolio.totalPortfolio) : '$00.00';
  const displayPerformance = portfolio ? formatPercentage(portfolio.performanceLast30d) : '---%';
  const displayBuyingPower = portfolio ? formatCurrency(portfolio.buyingPower) : '$---';

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
  // Prepare chart data (7 points) based on portfolio total (flat series)
  const chartValue = portfolio ? parseFloat(portfolio.totalPortfolio) || 0 : 0;
  const chartData = useMemo(
    () => Array.from({ length: 7 }, () => ({ value: chartValue })),
    [chartValue]
  );

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
          buyingPower={displayBuyingPower}
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
