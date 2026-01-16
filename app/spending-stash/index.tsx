import { View, Text, ScrollView, RefreshControl } from 'react-native';
import React, { useLayoutEffect, useMemo, useState, useCallback } from 'react';
import { useNavigation } from 'expo-router';
import { BalanceCard } from '@/components/molecules/BalanceCard';
import { ArrowDown, DollarSignIcon, PersonStanding } from 'lucide-react-native';
import { TransactionList } from '@/components/molecules/TransactionList';
import type { Transaction } from '@/components/molecules/TransactionItem';
import { Button } from '../../components/ui';
import InvestmentsEmptyIllustration from '@/assets/Illustrations/investments-empty.svg';
import { FloatingBackButton } from '@/components/FloatingBackButton';
import { AnimatedScreen } from '@/components/AnimatedScreen';

export default function SpendingStashScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [activePeriod, setActivePeriod] = useState('6M');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <View className="flex-row items-center gap-x-3">
          <View className="h-9 w-9 items-center justify-center rounded-[12px] bg-[#4A89F7]">
            <DollarSignIcon size={14} color="white" />
          </View>
          <Text className="font-subtitle text-headline-1">Spending</Text>
        </View>
      ),
    });
  }, [navigation]);

  const transactions = useMemo<Transaction[]>(() => [], []);

  const displayBalance = '$00.00';
  const displayPerformance = '+00.00%';

  return (
    <AnimatedScreen>
      <View className="flex-1 bg-white">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
          }>
          <View className="px-[14px]">
            <BalanceCard
              balance={displayBalance}
              percentChange={displayPerformance}
              timeframe={activePeriod}
            />

            <View className="mt-6 flex-row gap-3">
              <Button
                title="Become a Creator"
                leftIcon={<PersonStanding size={20} color="white" />}
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
        <FloatingBackButton />
      </View>
    </AnimatedScreen>
  );
}
