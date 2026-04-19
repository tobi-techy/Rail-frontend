import { useNavigation } from 'expo-router';
import React, { useState, useMemo } from 'react';
import { Text, View, RefreshControl, TextInput, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { TransactionList } from '@/components/molecules/TransactionList';
import type { Transaction } from '@/components/molecules/TransactionItem';
import { TransactionDetailSheet } from '@/components/sheets/TransactionDetailSheet';
import { useDeposits, useWithdrawals } from '@/api/hooks/useFunding';
import { useCardTransactions } from '@/api/hooks/useCard';
import { useP2PTransfers } from '@/api/hooks/useP2P';
import type { Withdrawal } from '@/api/types';
import {
  normalizeWithdrawals,
  depositToTransaction,
  withdrawalToTransaction,
  p2pToTransaction,
  pajOrderToTransaction,
} from '@/utils/transactionNormalizer';
import { usePajOrders } from '@/api/hooks/usePaj';
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
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const insets = useSafeAreaInsets();

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'deposit', label: 'Deposits' },
    { id: 'withdraw', label: 'Withdrawals' },
    { id: 'card', label: 'Card' },
    { id: 'p2p', label: 'P2P' },
  ];

  const deposits = useDeposits(50);
  const withdrawals = useWithdrawals(50);
  const cardTxQuery = useCardTransactions({ limit: 50 });
  const p2pTransfers = useP2PTransfers();
  const pajOrders = usePajOrders();

  const isLoading = deposits.isLoading || withdrawals.isLoading || cardTxQuery.isLoading || p2pTransfers.isLoading;
  const isRefetching =
    deposits.isRefetching || withdrawals.isRefetching || cardTxQuery.isRefetching || p2pTransfers.isRefetching;

  const refetch = () => {
    deposits.refetch();
    withdrawals.refetch();
    cardTxQuery.refetch();
    p2pTransfers.refetch();
    pajOrders.refetch();
  };

  const transactions = useMemo(() => {
    const withdrawalRows = normalizeWithdrawals(withdrawals.data);
    const cardRows: Transaction[] = (cardTxQuery.data?.transactions ?? []).map(cardTxToTransaction);
    const p2pRows: Transaction[] = (p2pTransfers.data ?? []).map(p2pToTransaction);
    const pajRows: Transaction[] = (pajOrders.data?.orders ?? []).map(pajOrderToTransaction);

    const mapped: Transaction[] = [
      ...(deposits.data?.deposits ?? []).map(depositToTransaction),
      ...withdrawalRows.map(withdrawalToTransaction),
      ...cardRows,
      ...p2pRows,
      ...pajRows,
    ];
    return mapped.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [deposits.data, withdrawals.data, cardTxQuery.data, p2pTransfers.data, pajOrders.data]);

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (activeFilter !== 'all') {
      result = result.filter((t) => {
        if (activeFilter === 'deposit') return t.type === 'deposit';
        if (activeFilter === 'withdraw') return t.type === 'withdraw' && t.withdrawalMethod !== 'card';
        if (activeFilter === 'card') return t.withdrawalMethod === 'card';
        if (activeFilter === 'p2p') return t.type === 'p2p_send' || t.type === 'p2p_receive';
        return true;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.subtitle?.toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
      );
    }
    return result;
  }, [transactions, activeFilter, search]);

  const showSkeleton = isLoading && transactions.length === 0;

  return (
    <View className="flex-1 bg-background-main" style={{ paddingTop: insets.top }}>
      {/* Search */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 12, height: 44 }}>
          <HugeiconsIcon icon={Search01Icon} size={18} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search transactions..."
            placeholderTextColor="#9CA3AF"
            style={{ flex: 1, fontFamily: 'SFProDisplay-Regular', fontSize: 15, color: '#1A1A1A', marginLeft: 8 }}
          />
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, gap: 8 }}>
        {filters.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => setActiveFilter(f.id)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: activeFilter === f.id ? '#1A1A1A' : '#F5F5F5',
            }}>
            <Text style={{
              fontFamily: 'SFProDisplay-Medium',
              fontSize: 13,
              color: activeFilter === f.id ? '#FFF' : '#6B7280',
            }}>{f.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {!showSkeleton && filteredTransactions.length === 0 ? (
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
          transactions={filteredTransactions}
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
