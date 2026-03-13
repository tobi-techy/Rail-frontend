import { useNavigation } from 'expo-router';
import React, { useLayoutEffect, useState, useMemo } from 'react';
import { Text, View, RefreshControl } from 'react-native';
import { TransactionList } from '@/components/molecules/TransactionList';
import type { Transaction } from '@/components/molecules/TransactionItem';
import { TransactionDetailSheet } from '@/components/sheets/TransactionDetailSheet';
import { useDeposits, useWithdrawals } from '@/api/hooks/useFunding';
import { useCardTransactions } from '@/api/hooks/useCard';
import type { Withdrawal } from '@/api/types';
import {
  normalizeWithdrawals,
  depositToTransaction,
  withdrawalToTransaction,
} from '@/utils/transactionNormalizer';
import TransactionsEmptyIllustration from '@/assets/Illustrations/transactions-empty.svg';

function cardTxToTransaction(tx: any): Transaction {
  return {
    id: tx.id,
    type: 'withdraw' as const,
    title: tx.merchant_name || 'Card transaction',
    subtitle: tx.merchant_category || 'Card',
    amount: Math.abs(parseFloat(tx.amount) || 0),
    currency: 'USD',
    status:
      tx.status === 'completed' ? 'completed' : tx.status === 'declined' ? 'failed' : 'pending',
    createdAt: new Date(tx.created_at || tx.updated_at || '1970-01-01T00:00:00Z'),
    withdrawalMethod: 'card' as any,
  };
}

export default function History() {
  const navigation = useNavigation();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const deposits = useDeposits(50);
  const withdrawals = useWithdrawals(50);
  const cardTxQuery = useCardTransactions({ limit: 50 });

  const isLoading = deposits.isLoading || withdrawals.isLoading || cardTxQuery.isLoading;
  const isRefetching =
    deposits.isRefetching || withdrawals.isRefetching || cardTxQuery.isRefetching;

  const refetch = () => {
    deposits.refetch();
    withdrawals.refetch();
    cardTxQuery.refetch();
  };

  const transactions = useMemo(() => {
    const withdrawalRows = normalizeWithdrawals(withdrawals.data);
    const cardRows: Transaction[] = (cardTxQuery.data?.transactions ?? []).map(cardTxToTransaction);

    const mapped: Transaction[] = [
      ...(deposits.data?.deposits ?? []).map(depositToTransaction),
      ...withdrawalRows.map(withdrawalToTransaction),
      ...cardRows,
    ];
    return mapped.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [deposits.data, withdrawals.data, cardTxQuery.data]);
  const showSkeleton = isLoading && transactions.length === 0;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <View className="flex-row items-center gap-x-3 pl-md">
          <Text className="font-subtitle text-headline-1 text-text-primary">Activity</Text>
        </View>
      ),
      headerShown: true,
      title: '',
      headerStyle: { backgroundColor: '#FFFFFF' },
      headerShadowVisible: false,
    });
  }, [navigation]);

  return (
    <View className="flex-1 bg-background-main">
      {!showSkeleton && transactions.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <TransactionsEmptyIllustration width={220} height={140} />
          <Text className="mt-4 text-center font-subtitle text-subtitle text-text-primary">
            No transactions yet
          </Text>
          <Text className="mt-2 text-center font-body text-caption text-text-secondary">
            Your transaction history will appear here once you start using Rail
          </Text>
        </View>
      ) : (
        <TransactionList
          transactions={transactions}
          onTransactionPress={setSelectedTransaction}
          className="flex-1 px-md pt-md"
          isLoading={showSkeleton}
          loadingItems={6}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#000" />
          }
        />
      )}

      <TransactionDetailSheet
        visible={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
      />
    </View>
  );
}
