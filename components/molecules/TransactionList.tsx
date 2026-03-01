import React from 'react';
import { View, Text, SectionList, ViewProps, RefreshControlProps } from 'react-native';
import { Skeleton } from '../atoms';
import { TransactionItem, Transaction, TransactionItemSkeleton } from './TransactionItem';

export interface TransactionListProps extends Omit<ViewProps, 'children'> {
  transactions: Transaction[];
  title?: string;
  onTransactionPress?: (transaction: Transaction) => void;
  isLoading?: boolean;
  loadingItems?: number;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  /** Set false when embedded inside a ScrollView — renders as plain View */
  scrollEnabled?: boolean;
}

type Section = { label: string; data: Transaction[] };

const groupByDate = (transactions: Transaction[]): Section[] => {
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
  refreshControl,
  scrollEnabled = true,
  style,
  className,
}) => {
  if (isLoading) {
    const firstGroupCount = Math.max(1, Math.ceil(loadingItems / 2));
    const secondGroupCount = Math.max(0, loadingItems - firstGroupCount);

    return (
      <View style={style} className={className}>
        {title && (
          <Text className="mb-md font-headline-2 text-headline-3 text-text-primary">{title}</Text>
        )}
        <View className="mb-md">
          <Skeleton className="mb-sm h-3 w-[80px] rounded-sm" />
          {Array.from({ length: firstGroupCount }).map((_, i) => (
            <TransactionItemSkeleton key={`sk1-${i}`} />
          ))}
        </View>
        {secondGroupCount > 0 && (
          <View className="mb-md">
            <Skeleton className="mb-sm h-3 w-[94px] rounded-sm" />
            {Array.from({ length: secondGroupCount }).map((_, i) => (
              <TransactionItemSkeleton key={`sk2-${i}`} />
            ))}
          </View>
        )}
      </View>
    );
  }

  const sections = groupByDate(transactions);

  // Flat render for use inside a ScrollView
  if (!scrollEnabled) {
    return (
      <View style={style} className={className}>
        {title && (
          <Text className="mb-md font-headline-2 text-headline-3 text-text-primary">{title}</Text>
        )}
        {sections.map((section) => (
          <View key={section.label} className="mb-md">
            <Text className="mb-sm font-caption text-[13px] uppercase tracking-wide text-text-secondary">
              {section.label}
            </Text>
            {section.data.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} onPress={() => onTransactionPress?.(tx)} />
            ))}
          </View>
        ))}
      </View>
    );
  }

  return (
    <SectionList
      style={style}
      className={className}
      sections={sections}
      keyExtractor={(tx) => tx.id}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <Text className="mb-sm font-caption text-[13px] uppercase tracking-wide text-text-secondary">
          {section.label}
        </Text>
      )}
      renderItem={({ item: tx }) => (
        <TransactionItem transaction={tx} onPress={() => onTransactionPress?.(tx)} />
      )}
      SectionSeparatorComponent={() => <View className="mb-md" />}
      ListHeaderComponent={
        title ? (
          <Text className="mb-md font-headline-2 text-headline-3 text-text-primary">{title}</Text>
        ) : null
      }
    />
  );
};
