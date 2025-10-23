import { View, Text, ScrollView } from 'react-native';
import React, { useLayoutEffect, useMemo } from 'react';
import { router, useNavigation } from 'expo-router';
import { BalanceCard } from '@/components/molecules/BalanceCard';
import { BasketItemCard } from '@/components/molecules/BasketItemCard';
import { Bell, Grid3X3Icon, User } from 'lucide-react-native';
import { TransactionList } from '@/components/molecules/TransactionList';
import type { Transaction } from '@/components/molecules/TransactionItem';

const Dashboard = () => {
  const navigation = useNavigation();

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

  return (
    <ScrollView className="flex-1">
      <View className="px-[14px] py-4">
        {/* Portfolio Balance Card */}
        <View className="mb-6">
          <BalanceCard
            balance="$00.00"
            percentChange="00.00%"
            timeframe="Last 30d"
            className="rounded-x"
            onReceivePress={() => router.push('/deposit')}
            onWithdrawPress={() => router.push('/withdraw')}
          />
          
         
        </View>

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
