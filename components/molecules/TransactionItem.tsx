import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { colors, typography } from '@/design/tokens';
import { Icon } from '../atoms';

// --- Type Definitions ---
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

// --- Helper Functions ---

const getTransactionDetails = (type: TransactionType) => {
  switch (type) {
    case 'DEBIT':
      return {
        iconName: 'arrow-up-right',
        iconColor: colors.semantic.danger,
        amountColor: colors.text.primary,
        sign: '-',
      };
    case 'CREDIT':
      return {
        iconName: 'arrow-down-left',
        iconColor: colors.semantic.success,
        amountColor: colors.semantic.success,
        sign: '+',
      };
    case 'SWAP':
      return {
        iconName: 'repeat',
        iconColor: colors.semantic.success,
        amountColor: colors.text.primary,
        sign: '',
      };
    default:
      return {
        iconName: 'help-circle',
        iconColor: colors.text.secondary,
        amountColor: colors.text.primary,
        sign: '',
      };
  }
};

/**
 * FIXED: Replaced `formatToParts` with a compatible method using `format()`
 * to avoid crashes on the React Native Hermes engine.
 */
const formatCurrency = (
  amount: number,
  currency: string = 'NGN',
  sign: string
) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedString = formatter.format(Math.abs(amount));

  // Extract symbol and number part. This is a robust way to handle various currency formats.
  const value = formattedString.replace(/[^0-9.,]/g, '');
  const symbol = formattedString.replace(/[0-9.,]/g, '').trim();

  // Custom placement for Nigerian Naira (₦) as seen in reference.
  if (currency === 'NGN') {
    return `${sign}${symbol}${value}`;
  }

  // Default format for others (e.g., USD)
  return `${sign}${symbol}${value}`;
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// --- Main Component ---

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  ...props
}) => {
  const { iconName, iconColor, amountColor, sign } = getTransactionDetails(
    transaction.type
  );

  const formattedAmount = formatCurrency(
    transaction.amount,
    transaction.currency,
    sign
  );

  return (
    <TouchableOpacity
      className="flex-row items-center py-3 border-b border-[#E5E7EB]"
      accessibilityLabel={`Transaction: ${transaction.title}, Amount: ${formattedAmount}`}
      {...props}
    >
      {/* Icon */}
      <View
        className="w-11 h-11 rounded-full justify-center items-center mr-4"
        style={{
          backgroundColor: `${colors.semantic.success}1A`,
        }}
      >
        <Icon library="feather" name={iconName} size={22} color={iconColor} />
      </View>

      {/* Details */}
      <View className="flex-1 justify-center">
        <Text
          className="font-body-bold text-[17px] text-gray-900"
          numberOfLines={1}
        >
          {transaction.title}
        </Text>
        <Text
          className="font-body text-[14px] text-gray-500 mt-[2px]"
          style={{
            fontFamily: typography.fonts.secondary,
          }}
          numberOfLines={1}
        >
          {`${transaction.category} • ${formatDate(transaction.createdAt)}`}
        </Text>
      </View>

      {/* Amount */}
      <Text
        className="font-body-bold text-[17px] ml-3"
      >
        {formattedAmount}
      </Text>
    </TouchableOpacity>
  );
};
