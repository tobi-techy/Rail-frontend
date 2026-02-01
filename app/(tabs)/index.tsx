import { View, Text, ScrollView, RefreshControl } from 'react-native';
import React, { useLayoutEffect, useMemo, useState, useCallback } from 'react';
import TransactionsEmptyIllustration from '@/assets/Illustrations/transactions-empty.svg';
import { router, useNavigation } from 'expo-router';
import { BalanceCard } from '@/components/molecules/BalanceCard';
import { StashCard } from '@/components/molecules/StashCard';
import { ArrowDown, DollarSign, Grid3X3Icon, PlusIcon, Wallet } from 'lucide-react-native';
import { TransactionList } from '@/components/molecules/TransactionList';
import type { Transaction } from '@/components/molecules/TransactionItem';
import { usePortfolioOverview } from '@/api/hooks';
import { Button } from '../../components/ui';
import { ActionSheet } from '@/components/sheets';
import UsdcIcon from '@/assets/svg/usdc.svg';
import {
  SendIcon,
  ReceiveIcon,
  BankIcon,
  CashIcon,
  CoinIcon,
  InvestmentIcon,
} from '@/assets/svg/filled';

const Dashboard = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [showReceiveSheet, setShowReceiveSheet] = useState(false);
  const [showSendSheet, setShowSendSheet] = useState(false);

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
          <Text className="font-subtitle text-headline-1">{'Station'}</Text>
        </View>
      ),
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

          <View className="mb-2 flex-row gap-3">
            <Button
              title="Receive"
              onPress={() => setShowReceiveSheet(true)}
              leftIcon={<PlusIcon size={24} color="white" />}
              size="small"
              variant="black"
            />
            <Button
              title="Send"
              onPress={() => setShowSendSheet(true)}
              leftIcon={<ArrowDown size={24} color="black" />}
              size="small"
              variant="white"
            />
          </View>
        </>

        {/* Stash Cards */}
        <View className="mb- flex-row gap-3">
          <StashCard
            title="Spending Stash"
            amount="$00"
            amountCents=".00"
            icon={<CashIcon width={40} height={40} color="white" />}
            className="flex-1"
            onPress={() => router.navigate('/spending-stash')}
          />
          <StashCard
            title="Investment Stash"
            amount="$00"
            amountCents=".00"
            icon={<InvestmentIcon width={40} height={40} color="white" />}
            className="flex-1"
            onPress={() => router.navigate('/investment-stash')}
          />
        </View>

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
              <TransactionList title="Transaction History" transactions={transactions} />
            )}
          </View>
        </>
      </View>

      {/* Receive Sheet */}
      <ActionSheet
        visible={showReceiveSheet}
        onClose={() => setShowReceiveSheet(false)}
        illustration={
          <View className="relative">
            <ReceiveIcon width={46} height={46} />
          </View>
        }
        title="Add Funds"
        subtitle={'Choose one of the options\nbelow to add funds'}
        actions={[
          {
            id: 'fiat',
            label: 'Fiat',
            sublabel: 'Receive assets via US bank account',
            icon: <BankIcon width={32} height={32} color="#6366F1" />,
            iconBgColor: '',
            onPress: () => router.push('/deposit/fiat' as any),
          },
          {
            id: 'crypto',
            label: 'Crypto',
            sublabel: 'Receive assets via wallet address',
            icon: <CoinIcon width={32} height={32} color="#6366F1" />,
            iconColor: '#F97316',
            iconBgColor: '',
            onPress: () => router.push('/deposit/crypto' as any),
          },
        ]}
      />

      {/* Send Sheet */}
      <ActionSheet
        visible={showSendSheet}
        onClose={() => setShowSendSheet(false)}
        illustration={
          <View className="relative">
            <SendIcon width={46} height={46} color="white" />
          </View>
        }
        title="Send Funds"
        subtitle={'Choose one of the options\nbelow to send funds'}
        actions={[
          {
            id: 'fiat',
            label: 'Fiat',
            sublabel: 'Send to US bank account',
            icon: <BankIcon width={28} height={28} color="#6366F1" />,
            iconBgColor: '',
            onPress: () => router.push('/withdraw/fiat' as any),
          },
          {
            id: 'crypto',
            label: 'Crypto',
            sublabel: 'Send to wallet address',
            icon: <CoinIcon width={32} height={32} color="#6366F1" />,
            iconColor: '#F97316',
            iconBgColor: '',
            onPress: () => router.push('/withdraw/crypto' as any),
          },
        ]}
      />
    </ScrollView>
  );
};

export default Dashboard;
