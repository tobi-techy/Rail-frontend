import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { TransactionItem, Transaction } from './TransactionItem';

export interface TransactionListProps extends Omit<ViewProps, 'children'> {
  transactions: Transaction[];
  title?: string;
  onTransactionPress?: (transaction: Transaction) => void;
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
  ...props
}) => {
  const grouped = groupByDate(transactions);

  return (
    <View {...props}>
      {title && <Text className="mb-md font-headline-2 text-headline-3 text-text-primary">{title}</Text>}
      {grouped.map((group) => (
        <View key={group.label} className="mb-md">
          <Text className="mb-sm font-caption text-[13px] uppercase tracking-wide text-text-secondary">
            {group.label}
          </Text>
          {group.data.map((tx) => (
            <TransactionItem key={tx.id} transaction={tx} onPress={() => onTransactionPress?.(tx)} />
          ))}
        </View>
      ))}
    </View>
  );
};
