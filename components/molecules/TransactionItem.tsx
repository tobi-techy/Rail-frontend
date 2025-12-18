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
      className="flex-row items-center border-b border-surface py-3"
      accessibilityLabel={`Transaction: ${transaction.title}, Amount: ${formattedAmount}`}
      {...props}>
      <View
        className="mr-4 h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: `${colors.semantic.success}1A` }}>
        <Icon library="feather" name={iconName} size={22} color={iconColor} />
      </View>

      <View className="flex-1 justify-center">
        <Text
          className="font-subtitle text-[18px] text-text-primary"
          style={{ fontFamily: typography.fonts.subtitle }}
          numberOfLines={1}>
          {transaction.title}
        </Text>
        <Text
          className="mt-[2px] font-body text-[14px]"
          style={{ fontFamily: typography.fonts.caption, color: colors.text.secondary }}
          numberOfLines={1}>
          {`${transaction.category} • ${formatDate(transaction.createdAt)}`}
        </Text>
      </View>

      <Text
        className="ml-3 font-subtitle text-[18px]"
        style={{ fontFamily: typography.fonts.numeric, color: colors.text.primary }}
        numberOfLines={1}>
        {formattedAmount}
      </Text>
    </TouchableOpacity>
  );
};
