import React from 'react';
import { View, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { colors, typography } from '@/design/tokens';
import { Icon } from '../atoms';

export type TransactionType = 'DEBIT' | 'CREDIT' | 'SWAP';
export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'FAILED';

export interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  currency?: string;
  type: TransactionType;
  status: TransactionStatus;
  createdAt: Date;
}

export interface TransactionItemProps extends TouchableOpacityProps {
  transaction: Transaction;
}

const getTransactionDetails = (type: TransactionType) => {
  const details = {
    DEBIT: { iconName: 'arrow-up-right', iconColor: colors.semantic.destructive, sign: '-' },
    CREDIT: { iconName: 'arrow-down-left', iconColor: colors.semantic.success, sign: '+' },
    SWAP: { iconName: 'repeat', iconColor: colors.primary.secondary, sign: '' },
  };
  return details[type] || { iconName: 'help-circle', iconColor: colors.text.secondary, sign: '' };
};

const formatCurrency = (amount: number, currency = 'NGN', sign: string) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  });
  return `${sign}${formatter.format(Math.abs(amount))}`;
};

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, ...props }) => {
  const { iconName, iconColor, sign } = getTransactionDetails(transaction.type);
  const formattedAmount = formatCurrency(transaction.amount, transaction.currency, sign);

  return (
    <TouchableOpacity
      className="flex-row items-center py-3 border-b border-surface"
      accessibilityLabel={`Transaction: ${transaction.title}, Amount: ${formattedAmount}`}
      {...props}
    >
      <View
        className="w-11 h-11 rounded-full justify-center items-center mr-4"
        style={{ backgroundColor: `${colors.semantic.success}1A` }}
      >
        <Icon library="feather" name={iconName} size={22} color={iconColor} />
      </View>

      <View className="flex-1 justify-center">
        <Text
          className="text-body text-text-primary"
          style={{ fontFamily: typography.fonts.subtitle }}
          numberOfLines={1}
        >
          {transaction.title}
        </Text>
        <Text
          className="text-caption text-text-secondary mt-[2px]"
          style={{ fontFamily: typography.fonts.caption }}
          numberOfLines={1}
        >
          {`${transaction.category} • ${formatDate(transaction.createdAt)}`}
        </Text>
      </View>

      <Text
        className="text-body text-text-primary ml-3"
        style={{ fontFamily: typography.fonts.numeric }}
      >
        {formattedAmount}
      </Text>
    </TouchableOpacity>
  );
};
