import React, { useLayoutEffect, useCallback, useMemo } from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Plus, ArrowUpRight, Eye, EyeOff } from 'lucide-react-native';
import { useNavigation, router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { RailCard } from '../cards';
import { TransactionList } from '../molecules/TransactionList';
import { TransactionItemSkeleton, type Transaction } from '../molecules/TransactionItem';
import { MaskedBalance } from '../molecules/MaskedBalance';
import { Button } from '../ui/Button';
import { useUIStore } from '@/stores';
import { useCards, useCardTransactions } from '@/api/hooks/useCard';
import { useSpendingStash } from '@/api/hooks/useSpending';
import { queryKeys } from '@/api/queryClient';
import type { CardTransaction } from '@/api/types/card';

/** Map backend card transaction → TransactionList item */
function mapCardTransaction(tx: CardTransaction): Transaction {
  const isCredit = tx.type === 'refund' || tx.type === 'reversal';
  const typeMap: Record<string, Transaction['type']> = {
    authorization: 'withdraw',
    capture: 'withdraw',
    refund: 'receive',
    reversal: 'receive',
  };
  const statusMap: Record<string, Transaction['status']> = {
    pending: 'pending',
    completed: 'completed',
    declined: 'failed',
    reversed: 'completed',
  };

  return {
    id: tx.id,
    type: typeMap[tx.type] ?? 'withdraw',
    title: tx.merchant_name ?? (isCredit ? 'Refund' : 'Card Payment'),
    subtitle: tx.merchant_category ?? tx.type,
    amount: isCredit ? Math.abs(parseFloat(tx.amount)) : -Math.abs(parseFloat(tx.amount)),
    currency: tx.currency?.toUpperCase() ?? 'USD',
    merchant: tx.merchant_name ?? undefined,
    status: statusMap[tx.status] ?? 'pending',
    createdAt: new Date(tx.created_at),
    icon: {
      type: 'icon' as const,
      iconName: 'credit-card',
      bgColor: '#F3F4F6',
    },
  };
}

const CardMainScreen = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { isBalanceVisible, toggleBalanceVisibility } = useUIStore();

  const { data: cardsData, isLoading: cardsLoading } = useCards();
  const { data: txData, isLoading: txLoading } = useCardTransactions({ limit: 50 });
  const { data: spendData } = useSpendingStash();

  const activeCard = useMemo(
    () => cardsData?.cards?.find((c) => c.status === 'active') ?? cardsData?.cards?.[0],
    [cardsData]
  );

  const balance = useMemo(() => {
    const raw = spendData?.balance?.spending_balance;
    if (!raw) return '$0.00';
    const num = parseFloat(raw);
    return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
  }, [spendData]);

  const transactions = useMemo(() => txData?.transactions?.map(mapCardTransaction) ?? [], [txData]);

  const isLoading = cardsLoading || txLoading;

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.card.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.spending.stash() });
  }, [queryClient]);

  const handleSettings = useCallback(() => {
    router.push('/card-settings' as never);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor="#000" />
        }>
        <View className="px-5">
          {/* Header */}
          <View className="flex-row items-center pb-2 pt-1">
            <View className="mr-2.5 h-8 w-8 items-center justify-center rounded-lg bg-black">
              <Text className="text-[10px] font-bold tracking-wider text-white">VISA</Text>
            </View>
            <Text className="font-headline text-headline-3 text-gray-900">Card</Text>
          </View>

          {/* Balance */}
          <View className="mt-3">
            <Text className="font-body text-caption text-gray-400">Balance</Text>
            <View className="mt-1 flex-row items-center">
              <MaskedBalance
                value={balance}
                visible={isBalanceVisible}
                textClass="text-balance-lg"
                colorClass="text-text-primary"
              />
              <TouchableOpacity
                onPress={toggleBalanceVisibility}
                className="ml-2.5"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                {isBalanceVisible ? (
                  <Eye size={22} color="#9CA3AF" strokeWidth={1.5} />
                ) : (
                  <EyeOff size={22} color="#9CA3AF" strokeWidth={1.5} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Card */}
          <View className="mt-5 items-center">
            <View
              style={{
                shadowColor: '#000',
                shadowOpacity: Platform.OS === 'ios' ? 0.12 : 0,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 10 },
                elevation: Platform.OS === 'android' ? 8 : 0,
              }}>
              <RailCard
                brand="VISA"
                holderName={activeCard ? 'CARDHOLDER' : 'CARDHOLDER'}
                last4={activeCard?.last_4 ?? '••••'}
                exp={activeCard?.expiry ?? '••/••'}
                currency="USD"
                accentColor="#FF6A00"
                patternIntensity={0.35}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View className="mt-5 flex-row items-center gap-3">
            <View className="flex-1 flex-row gap-3">
              <Button
                title="Top up"
                variant="white"
                size="small"
                flex
                leftIcon={<Plus size={18} color="#111" />}
                onPress={() => {}}
              />
              <Button
                title="Withdraw"
                variant="black"
                size="small"
                flex
                leftIcon={<ArrowUpRight size={18} color="#fff" />}
                onPress={() => {}}
              />
            </View>
            <TouchableOpacity
              onPress={handleSettings}
              activeOpacity={0.7}
              className="h-11 w-11 items-center justify-center rounded-xl bg-gray-100">
              <Settings size={20} color="#374151" strokeWidth={1.8} />
            </TouchableOpacity>
          </View>

          {/* Transactions */}
          <View className="mt-7">
            <Text className="mb-3 font-headline text-headline-3 text-gray-900">Transactions</Text>

            {isLoading ? (
              <View>
                {Array.from({ length: 4 }).map((_, i) => (
                  <TransactionItemSkeleton key={i} />
                ))}
              </View>
            ) : transactions.length === 0 ? (
              <View className="items-center py-10">
                <Text className="font-body text-body text-gray-400">No transactions yet</Text>
                <Text className="mt-1 font-body text-caption text-gray-300">
                  Use your card to see activity here
                </Text>
              </View>
            ) : (
              <TransactionList transactions={transactions} scrollEnabled={false} />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CardMainScreen;
export { CardMainScreen };
