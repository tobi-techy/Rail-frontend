import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import React, { useLayoutEffect, useMemo, useState, useCallback } from 'react';
import TransactionsEmptyIllustration from '@/assets/Illustrations/transactions-empty.svg';
import { router, useNavigation } from 'expo-router';
import { BalanceCard } from '@/components/molecules/BalanceCard';
import { StashCard } from '@/components/molecules/StashCard';
import { ArrowDown, Bell, DollarSign, Grid3X3Icon, PlusIcon, User } from 'lucide-react-native';
import { TransactionList } from '@/components/molecules/TransactionList';
import type { Transaction } from '@/components/molecules/TransactionItem';
import { usePortfolioOverview } from '@/api/hooks';
import { Button } from '../../components/ui';
import { ActionButton } from '@/components';

const Dashboard = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

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
    return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
  };

  // Format percentage with sign
  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerLeft: () => (
        <View className="flex-row items-center gap-x-3 pl-[14px]">
          {/*<Grid3X3Icon size={28} strokeWidth={0.8} fill={'#000'} color={'#fff'} />*/}
          <Text className="font-subtitle text-[18px]">{'Wallet'}</Text>
        </View>
      ),
      // headerRight: () => (
      //   <TouchableOpacity className='bg-primary-tertiary px-[18px] py-[4px] mr-2 flex-row items-center rounded-full'>
      //     {/*<PlusIcon size={28} strokeWidth={0.8} fill={'#000'} color={'#fff'} />*/}
      //     <Text className='text-body font-body text-[#fff]'>14 points</Text>
      //   </TouchableOpacity>
      // ),
      title: '',
      headerStyle: {
        backgroundColor: 'transparent',
      },
    });
  }, [navigation]);

  const transactions = useMemo<Transaction[]>(() => [], []);

  // Use loading placeholder values when no data yet
  const displayBalance = portfolio ? formatCurrency(portfolio.totalPortfolio) : '$00.00';
  const displayPerformance = portfolio ? formatPercentage(portfolio.performanceLast30d) : '---%';
  const displayBuyingPower = portfolio ? formatCurrency(portfolio.buyingPower) : '$---';

  return (
    <ScrollView
      className="min-h-screen flex-1"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
      }>
      <View className="px-[14px]">
        {/* Portfolio Balance Card */}
        <>
          <BalanceCard
            balance={displayBalance}
            percentChange={displayPerformance}
            buyingPower={displayBuyingPower}
            timeframe="Last 30d"
            className="rounded-x"
          />

          <View className="flex-row gap-3">
            <Button
              title="Receive"
              // onPress={() => router.navigate('/deposit')}
              leftIcon={<PlusIcon size={24} color="white" />}
              size="small"
              variant="black"
            />
            <Button
              title="Send"
              // onPress={() => router.navigate('/withdraw')}
              leftIcon={<ArrowDown size={24} color="black" />}
              size="small"
              variant="white"
            />
            <ActionButton icon="more-horizontal" label="" />
          </View>
        </>

        {/* Stash Cards */}
        <View className="mb- flex-row gap-3">
          <StashCard
            title="Spending Stash"
            amount="$00"
            amountCents=".00"
            icon={
              <View className="h-9 w-9 items-center justify-center rounded-[12px] bg-[#4A89F7]">
                <DollarSign size={14} color="white" />
              </View>
            }
            className="flex-1"
          />
          <StashCard
            title="Investment Stash"
            amount="$00"
            amountCents=".00"
            icon={
              <View className="h-9 w-9 items-center justify-center rounded-[12px] bg-[#FF8A65]">
                <Grid3X3Icon size={14} color="white" fill="white" />
              </View>
            }
            className="flex-1"
          />
        </View>

        {/* My Baskets Section */}
        {/*<>
          <Text className="font-subtitle text-headline-2">My tracks</Text>

          <View className="flex-row">
            <BasketItemCard
              code="GME-08"
              status="Safe"
              aum="288.56"
              performance="11.5%"
              performanceType="positive"
              badges={[
                { color: '#FF6B6B', icon: 'trending-up' },
                { color: '#4CAF50', icon: 'shield-checkmark' },
              ]}
              className="mr-3 flex-1"
            />

            <BasketItemCard
              code="FRVR"
              status="Safe"
              aum="512.03"
              performance="8.2%"
              performanceType="positive"
              badges={[
                { color: '#4CAF50', icon: 'shield-checkmark' },
                { color: '#2196F3', icon: 'time' },
              ]}
              className="flex-1"
            />
          </View>
        </>*/}

        {/* Transaction History Section */}
        <>
          <View className="rounded-3xl py-5">
            {transactions.length === 0 ? (
              <View className="items-center justify-center rounded-3xl bg-white px-5 py-8">
                <TransactionsEmptyIllustration width={220} height={140} />
                <Text className="mt-4 text-center font-subtitle text-headline-2 text-gray-900">
                  No transactions yet
                </Text>
                <Text className="mt-2 text-center font-body text-base text-gray-500">
                  Your activity will show up here once you receive or send funds.
                </Text>
              </View>
            ) : (
              <TransactionList
                title="Transaction History"
                transactions={transactions}
                emptyStateMessage="No transactions to show yet."
              />
            )}
          </View>
        </>
      </View>
    </ScrollView>
  );
};

export default Dashboard;
