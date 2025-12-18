import React from 'react';
import { View, Text, FlatList, ViewProps } from 'react-native';
import { TransactionItem, Transaction } from './TransactionItem';
import { colors } from '@/design/tokens';
import { Icon } from '@/components/atoms';

export interface TransactionListProps extends Omit<ViewProps, 'children'> {
  transactions: Transaction[];
  title?: string;
  onTransactionPress?: (transaction: Transaction) => void;
  emptyStateMessage?: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  title,
  onTransactionPress,
  emptyStateMessage = 'You have no transactions yet.',
  style,
  ...props
}) => {
  const renderItem = ({ item }: { item: Transaction }) => (
    <TransactionItem transaction={item} onPress={() => onTransactionPress?.(item)} />
  );

  const renderEmptyState = () => (
    <View className="items-center justify-center p-8">
      <Icon name="file-tray-outline" size={48} color={colors.text.tertiary} />
      <Text className="mt-4 text-center font-body text-base text-gray-500">
        {emptyStateMessage}
      </Text>
    </View>
  );

  return (
    <View style={style} {...props}>
      <View className="flex-row items-center justify-between">
        {title && <Text className="font-subtitle text-headline-2 text-gray-900">{title}</Text>}
        <Text className="font-body text-headline-2 text-gray-500">see all</Text>
      </View>
      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View className="h-3" />}
        contentContainerStyle={{ paddingVertical: 12 }}
      />
    </View>
  );
};
