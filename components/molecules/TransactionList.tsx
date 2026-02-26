import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { Skeleton } from '../atoms';
import { TransactionItem, Transaction, TransactionItemSkeleton } from './TransactionItem';

export interface TransactionListProps extends Omit<ViewProps, 'children'> {
  transactions: Transaction[];
  title?: string;
  onTransactionPress?: (transaction: Transaction) => void;
  isLoading?: boolean;
  loadingItems?: number;
}

type GroupedTransactions = { label: string; data: Transaction[] }[];

const groupByDate = (transactions: Transaction[]): GroupedTransactions => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: Record<string, Transaction[]> = {};

  transactions.forEach((tx) => {
    const txDate = new Date(tx.createdAt);
    let label: string;

    if (txDate.toDateString() === today.toDateString()) {
      label = 'Today';
    } else if (txDate.toDateString() === yesterday.toDateString()) {
      label = 'Yesterday';
    } else if (txDate > weekAgo) {
      label = 'This Week';
    } else {
      label = txDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(tx);
  });

  return Object.entries(groups).map(([label, data]) => ({ label, data }));
};

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  title,
  onTransactionPress,
  isLoading = false,
  loadingItems = 6,
  ...props
}) => {
  if (isLoading) {
    const firstGroupCount = Math.max(1, Math.ceil(loadingItems / 2));
    const secondGroupCount = Math.max(0, loadingItems - firstGroupCount);

    return (
      <View {...props}>
        {title && (
          <Text className="mb-md font-headline-2 text-headline-3 text-text-primary">{title}</Text>
        )}

        <View className="mb-md">
          <Skeleton className="mb-sm h-3 w-[80px] rounded-sm" />
          {Array.from({ length: firstGroupCount }).map((_, index) => (
            <TransactionItemSkeleton key={`tx-skeleton-group-1-${index}`} />
          ))}
        </View>

        {secondGroupCount > 0 && (
          <View className="mb-md">
            <Skeleton className="mb-sm h-3 w-[94px] rounded-sm" />
            {Array.from({ length: secondGroupCount }).map((_, index) => (
              <TransactionItemSkeleton key={`tx-skeleton-group-2-${index}`} />
            ))}
          </View>
        )}
      </View>
    );
  }

  const grouped = groupByDate(transactions);

  return (
    <View {...props}>
      {title && (
        <Text className="mb-md font-headline-2 text-headline-3 text-text-primary">{title}</Text>
      )}
      {grouped.map((group) => (
        <View key={group.label} className="mb-md">
          <Text className="mb-sm font-caption text-[13px] uppercase tracking-wide text-text-secondary">
            {group.label}
          </Text>
          {group.data.map((tx) => (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              onPress={() => onTransactionPress?.(tx)}
            />
          ))}
        </View>
      ))}
    </View>
  );
};
