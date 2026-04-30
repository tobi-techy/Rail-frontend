import React, { useState, useMemo } from 'react';
import { Text, View, RefreshControl, TextInput, Pressable, ScrollView } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { TransactionList } from '@/components/molecules/TransactionList';
import type {
  Transaction,
  TransactionType,
  TransactionStatus,
  WithdrawalMethod,
} from '@/components/molecules/TransactionItem';
import { TransactionDetailSheet } from '@/components/sheets/TransactionDetailSheet';
import { useActivityFeed } from '@/api/hooks/useActivity';
import type { ActivityItem } from '@/api/types/activity';
import TransactionsEmptyIllustration from '@/assets/Illustrations/transactions-empty.svg';
import { NgnIcon, UsdcIcon } from '@/assets/svg';

// Convert unified ActivityItem → existing Transaction type for TransactionList/TransactionDetailSheet
function activityToTransaction(item: ActivityItem): Transaction {
  const typeMap: Record<string, TransactionType> = {
    deposit: 'deposit',
    naira_fund: 'deposit',
    p2p_receive: 'receive',
    withdrawal: 'withdraw',
    naira_withdraw: 'withdraw',
    p2p_send: 'send',
    card_payment: 'withdraw',
    investment: 'withdraw',
  };

  const statusMap: Record<string, TransactionStatus> = {
    completed: 'completed',
    pending: 'pending',
    processing: 'pending',
    failed: 'failed',
    cancelled: 'failed',
  };

  const methodMap: Record<string, WithdrawalMethod> = {
    withdrawal: 'crypto',
    naira_withdraw: 'fiat',
    p2p_send: 'p2p',
    card_payment: 'card',
  };

  // For naira transactions with dual currency, show swap icon
  const hasDualCurrency = !!item.currency.secondary;
  let icon: Transaction['icon'];
  if (hasDualCurrency) {
    icon = {
      type: 'swap' as const,
      SwapFrom: item.direction === 'in' ? NgnIcon : UsdcIcon,
      SwapTo: item.direction === 'in' ? UsdcIcon : NgnIcon,
      swapFromBg: item.direction === 'in' ? '#008751' : '#2775CA',
      swapToBg: item.direction === 'in' ? '#2775CA' : '#008751',
    };
  }

  return {
    id: item.id,
    type: typeMap[item.type] ?? 'deposit',
    title: item.title,
    subtitle: item.subtitle ?? '',
    amount: parseFloat(item.amount) || 0,
    currency: item.currency.primary,
    status: statusMap[item.status] ?? 'pending',
    createdAt: new Date(item.createdAt),
    txHash: item.txHash,
    toAddress: item.destination,
    fee: item.feeAmount,
    withdrawalMethod: methodMap[item.type],
    icon,
    metadata: {
      sourceType: item.sourceType,
      sourceId: item.sourceId,
      chain: item.chain,
      fiatAmount: item.fiatAmount,
      secondaryCurrency: item.currency.secondary,
      groupId: item.groupId,
    },
  };
}

type FilterId = 'all' | 'deposit' | 'withdraw' | 'naira' | 'p2p';

export default function History() {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');

  const filters: { id: FilterId; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'deposit', label: 'Deposits' },
    { id: 'withdraw', label: 'Withdrawals' },
    { id: 'naira', label: 'Naira' },
    { id: 'p2p', label: 'P2P' },
  ];

  const activity = useActivityFeed(50);

  const transactions = useMemo(() => {
    if (!activity.data?.items) return [];
    return activity.data.items.map(activityToTransaction);
  }, [activity.data]);

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (activeFilter !== 'all') {
      result = result.filter((t) => {
        const meta = t.metadata as Record<string, string | undefined> | undefined;
        const sourceType = meta?.sourceType;
        if (activeFilter === 'deposit') return t.type === 'deposit' || t.type === 'receive';
        if (activeFilter === 'withdraw') return t.type === 'withdraw' || t.type === 'send';
        if (activeFilter === 'naira') return sourceType === 'paj_order';
        if (activeFilter === 'p2p') return sourceType === 'p2p_transfer';
        return true;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.subtitle?.toLowerCase().includes(q) ||
          t.amount.toString().includes(q)
      );
    }
    return result;
  }, [transactions, activeFilter, search]);

  const showSkeleton = activity.isLoading && transactions.length === 0;

  return (
    <View className="flex-1 bg-background-main">
      {/* Search */}
      <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 2 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F5F5F5',
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 40,
          }}>
          <HugeiconsIcon icon={Search01Icon} size={18} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search transactions..."
            placeholderTextColor="#9CA3AF"
            style={{
              flex: 1,
              fontFamily: 'SFProDisplay-Regular',
              fontSize: 15,
              color: '#1A1A1A',
              marginLeft: 8,
            }}
          />
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 8,
          gap: 8,
          alignItems: 'center',
        }}>
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
            <Text
              style={{
                fontFamily: 'SFProDisplay-Medium',
                fontSize: 13,
                color: activeFilter === f.id ? '#FFF' : '#6B7280',
              }}>
              {f.label}
            </Text>
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
            <RefreshControl
              refreshing={activity.isRefetching}
              onRefresh={() => activity.refetch()}
              tintColor="#000"
            />
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
