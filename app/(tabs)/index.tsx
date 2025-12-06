import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import React, { useLayoutEffect, useMemo, useState, useCallback } from 'react';
import { router, useNavigation } from 'expo-router';
import { BalanceCard } from '@/components/molecules/BalanceCard';
import { BasketItemCard } from '@/components/molecules/BasketItemCard';
import { ArrowDown, Bell, Grid3X3Icon, PlusIcon, User } from 'lucide-react-native';
import { TransactionList } from '@/components/molecules/TransactionList';
import type { Transaction } from '@/components/molecules/TransactionItem';
import { usePortfolioOverview } from '@/api/hooks';
import { Button } from '../../components/ui';
import { ActionSlideshow, SlideData } from '@/components/molecules/ActionSlideshow';

const Dashboard = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch portfolio overview with automatic refetching
  const { 
    data: portfolio, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = usePortfolioOverview();

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
        <View className='flex-row items-center gap-x-3 pl-[14px]'>
          <Grid3X3Icon size={28} strokeWidth={0.8} fill={"#000"} color={"#fff"}  />
      
        </View>
      ),
      headerRight: () => (
        <View className='flex-row gap-x-[12px] items-center pr-[14px]'>
         <Bell size={24} strokeWidth={2} color={"#000"} />
         <User size={24} strokeWidth={2} color={"#000"}  />
        </View>
      ),
      title: "",
      headerStyle: {
        backgroundColor: 'transparent',
      },
    })
  }, [navigation]);

  const transactions = useMemo<Transaction[]>(
    () => [
      {
        id: 'txn-1',
        title: 'Spotify Subscription',
        category: 'Subscriptions',
        amount: 9.99,
        currency: 'USD',
        type: 'DEBIT',
        status: 'COMPLETED',
        createdAt: new Date('2024-06-12T09:24:00Z'),
      },
      {
        id: 'txn-2',
        title: 'Salary Payment',
        category: 'Income',
        amount: 2450,
        currency: 'USD',
        type: 'CREDIT',
        status: 'COMPLETED',
        createdAt: new Date('2024-06-10T06:00:00Z'),
      },
      {
        id: 'txn-3',
        title: 'USDC • BTC Swap',
        category: 'Crypto',
        amount: 520,
        currency: 'USD',
        type: 'SWAP',
        status: 'PENDING',
        createdAt: new Date('2024-06-08T14:10:00Z'),
      },
      {
        id: 'txn-4',
        title: 'Starbucks Brooklyn',
        category: 'Food & Drinks',
        amount: 6.75,
        currency: 'USD',
        type: 'DEBIT',
        status: 'COMPLETED',
        createdAt: new Date('2024-06-03T11:32:00Z'),
      },
    ],
    []
  );

   // Default slides with custom actions
   const defaultSlides: SlideData[] = [
    {
      id: '1',
      title: 'Verify Your Identity',
      description: 'Complete KYC to unlock full trading features and higher limits',
      icon: 'shield-person-6',
      gradient: ['#667EEA', '#764BA2'],
      ctaText: 'Verify Now',
      onPress: () => {},
    },
    {
      id: '2',
      title: 'Get Your Dollar Card',
      description: 'Physical or virtual card for seamless global spending',
      icon: 'credit-card-8',
      gradient: ['#F093FB', '#F5576C'],
      ctaText: 'Get Card',
      onPress: () => {},
    },
    {
      id: '3',
      title: 'Copy Top Investors',
      description: 'Follow and replicate winning investment strategies',
      icon: 'data-exploration-20',
      gradient: ['#4FACFE', '#00F2FE'],
      ctaText: 'Explore',
      onPress: () => {},
    },
    {
      id: '4',
      title: 'Fund with Stablecoins',
      description: 'Top up your account using USDC or USDT instantly',
      icon: 'usdc-8',
      gradient: ['#43E97B', '#38F9D7'],
      ctaText: 'Fund Account',
      onPress: () => {},
    },
  ];

  // Only show error if no cached data exists and it's not a 404
  const is404 = error?.error?.code === 'HTTP_404';
  const showError = isError && !portfolio && !is404;
  
  // Use loading placeholder values when no data yet
  const displayBalance = portfolio ? formatCurrency(portfolio.totalPortfolio) : '$---';
  const displayPerformance = portfolio ? formatPercentage(portfolio.performanceLast30d) : '---%';
  const displayBuyingPower = portfolio ? formatCurrency(portfolio.buyingPower) : '$---';

  return (
    <ScrollView 
      className="flex-1"
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          tintColor="#000"
        />
      }
    >
      <View className="px-[14px] py-4">
        {/* Error Banner (only shows if no cached data) */}
        {showError && (
          <View className="mb-4 rounded-2xl bg-red-50 px-4 py-3">
            <Text className="text-sm font-body-bold text-red-900">Unable to load portfolio</Text>
            <Text className="mt-1 text-xs text-red-700">
              {error?.error?.message || 'Please check your connection.'}
            </Text>
            <Text 
              className="mt-2 text-xs font-body-bold text-red-600" 
              onPress={() => refetch()}
            >
              Tap to retry
            </Text>
          </View>
        )}

        {/* Portfolio Balance Card */}
        <View className="mb-6">
          <BalanceCard
            balance={displayBalance}
            percentChange={displayPerformance}
            buyingPower={displayBuyingPower}
            timeframe="Last 30d"
            className="rounded-x"
          />

      <View className="flex-row w-[80%] gap-3 mt-4">
       <Button title='Add funds' onPress={( ) => router.navigate("/deposit")} leftIcon={<PlusIcon size={24} color="white" />}  className="w-[40%]" />
       <Button title='Withdraw' onPress={( ) => router.navigate("/withdraw")} leftIcon={<ArrowDown size={24} color="black" />} variant='secondary' className="w-[40%]" />
      </View>
        </View>

          {/* Action Slideshow */}
      <ActionSlideshow 
        slides={defaultSlides}
        autoPlay={true}
        autoPlayInterval={5000}
      />

        {/* My Baskets Section */}
        <View className="mb-6">
          <Text className="text-[24px] font-body-bold mb-3">My baskets</Text>
          
          <View className="flex-row mb-4">
            <BasketItemCard
              code="GME-08"
              status="Safe"
              aum="288.56"
              performance="11.5%"
              performanceType="positive"
              badges={[
                { color: '#FF6B6B', icon: 'trending-up' },
                { color: '#4CAF50', icon: 'shield-checkmark' }
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
                { color: '#2196F3', icon: 'time' }
              ]}
              className="flex-1"
            />
          </View>
        </View>

        {/* Transaction History Section */}
        <View className="mb-8">
          <View className="rounded-3xl px- py-5">
            <TransactionList
              title="Transaction History"
              transactions={transactions}
              emptyStateMessage="No transactions to show yet."
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default Dashboard;
