import { useNavigation } from 'expo-router';
import React, { useLayoutEffect, useState, useMemo } from 'react';
import { Text, View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { TransactionList } from '@/components/molecules/TransactionList';
import type {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '@/components/molecules/TransactionItem';
import { TransactionDetailSheet } from '@/components/sheets/TransactionDetailSheet';
import { useDeposits, useWithdrawals } from '@/api/hooks/useFunding';
import type { Deposit, Withdrawal } from '@/api/types';
import TransactionsEmptyIllustration from '@/assets/Illustrations/transactions-empty.svg';

const STATUS_MAP: Record<string, TransactionStatus> = {
  completed: 'completed',
  confirmed: 'completed',
  pending: 'pending',
  processing: 'pending',
  initiated: 'pending',
  alpaca_debited: 'pending',
  bridge_processing: 'pending',
  onchain_transfer: 'pending',
  failed: 'failed',
  reversed: 'failed',
  timeout: 'failed',
};

function depositToTransaction(d: Deposit): Transaction {
  return {
    id: d.id,
    type: 'deposit' as TransactionType,
    title: 'Deposit',
    subtitle: d.chain ? `${d.currency} · ${d.chain}` : d.currency,
    amount: parseFloat(d.amount) || 0,
    currency: d.currency,
    status: STATUS_MAP[d.status] ?? 'pending',
    createdAt: new Date(d.created_at),
    txHash: d.tx_hash,
  };
}

function withdrawalToTransaction(w: Withdrawal): Transaction {
  return {
    id: w.id,
    type: 'withdraw' as TransactionType,
    title: 'Withdrawal',
    subtitle: w.destination_chain ? `USD · ${w.destination_chain}` : 'USD',
    amount: parseFloat(w.amount) || 0,
    currency: 'USD',
    status: STATUS_MAP[w.status] ?? 'pending',
    createdAt: new Date(w.created_at),
    txHash: w.tx_hash,
  };
}

export default function History() {
  const navigation = useNavigation();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const deposits = useDeposits(50);
  const withdrawals = useWithdrawals(50);

  const isLoading = deposits.isLoading || withdrawals.isLoading;
  const isRefetching = deposits.isRefetching || withdrawals.isRefetching;

  const refetch = () => {
    deposits.refetch();
    withdrawals.refetch();
  };

  const transactions = useMemo(() => {
    const mapped: Transaction[] = [
      ...(deposits.data?.deposits ?? []).map(depositToTransaction),
      ...(Array.isArray(withdrawals.data) ? withdrawals.data : []).map(withdrawalToTransaction),
    ];
    return mapped.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [deposits.data, withdrawals.data]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <View className="flex-row items-center gap-x-3 pl-md">
          <Text className="font-subtitle text-headline-1 text-text-primary">History</Text>
        </View>
      ),
      headerShown: true,
      title: '',
      headerStyle: { backgroundColor: 'transparent' },
    });
  }, [navigation]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background-main">
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background-main">
      {transactions.length === 0 ? (
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
        <ScrollView
          className="flex-1 px-md"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#000" />
          }>
          <TransactionList
            transactions={transactions}
            onTransactionPress={setSelectedTransaction}
            className="pt-md"
          />
        </ScrollView>
      )}

      <TransactionDetailSheet
        visible={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
      />
    </View>
  );
}
