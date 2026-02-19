import React from 'react';
import { View, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { SvgProps } from 'react-native-svg';
import { Icon } from '../atoms';
import { UsdcIcon, UsdtIcon } from '@/assets/svg';

export type TransactionType = 'send' | 'receive' | 'swap' | 'deposit' | 'withdraw';
export type TransactionStatus = 'completed' | 'pending' | 'failed';
export type SvgComponent = React.ComponentType<SvgProps>;

export interface Transaction {
  id: string;
  type: TransactionType;
  title: string;
  subtitle: string;
  amount: number;
  currency?: string;
  status: TransactionStatus;
  createdAt: Date;
  txHash?: string;
  toAddress?: string;
  fee?: string;
  icon?: {
    type: 'token' | 'icon' | 'swap';
    Token?: SvgComponent;
    bgColor?: string;
    iconName?: string;
    SwapFrom?: SvgComponent;
    SwapTo?: SvgComponent;
    swapFromBg?: string;
    swapToBg?: string;
  };
}

export interface TransactionItemProps extends TouchableOpacityProps {
  transaction: Transaction;
}

const formatAmount = (amount: number, type: TransactionType, currency = 'NGN') => {
  const isCredit = type === 'receive' || type === 'deposit';
  const sign = isCredit ? '+' : '-';
  const num = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  return { text: `${sign}${num} ${currency}`, isCredit };
};

const getDepositTokenIcon = (
  currency?: string
): { Token: SvgComponent; bgColor: string } | null => {
  const normalized = currency?.trim().toUpperCase();
  if (!normalized) return null;

  if (normalized === 'USDC') {
    return { Token: UsdcIcon, bgColor: 'transparent' };
  }

  if (normalized === 'USDT') {
    return { Token: UsdtIcon, bgColor: 'transparent' };
  }

  return null;
};

const TokenIcon = ({ Token, bgColor }: { Token?: SvgComponent; bgColor?: string }) => (
  <View
    className="h-12 w-12 items-center justify-center rounded-full"
    style={{ backgroundColor: bgColor || '#1B84FF' }}>
    {Token ? (
      <Token width={28} height={28} />
    ) : (
      <Icon library="feather" name="dollar-sign" size={24} color="#FFFFFF" />
    )}
  </View>
);

const ActionIcon = ({ name }: { name: string }) => (
  <View className="h-12 w-12 items-center justify-center rounded-full border border-surface bg-background-main">
    <Icon library="feather" name={name} size={22} color="#757575" />
  </View>
);

const SwapIcon = ({
  SwapFrom,
  SwapTo,
  fromBg,
  toBg,
}: {
  SwapFrom?: SvgComponent;
  SwapTo?: SvgComponent;
  fromBg?: string;
  toBg?: string;
}) => (
  <View className="h-12 w-12">
    <View
      className="absolute left-0 top-0 h-8 w-8 items-center justify-center rounded-full"
      style={{ backgroundColor: fromBg || '#000' }}>
      {SwapFrom && <SwapFrom width={18} height={18} />}
    </View>
    <View
      className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-background-main"
      style={{ backgroundColor: toBg || '#1B84FF' }}>
      {SwapTo && <SwapTo width={18} height={18} />}
    </View>
  </View>
);

const TransactionIcon = ({ transaction }: { transaction: Transaction }) => {
  const { icon, type } = transaction;

  if (icon?.type === 'swap') {
    return (
      <SwapIcon
        SwapFrom={icon.SwapFrom}
        SwapTo={icon.SwapTo}
        fromBg={icon.swapFromBg}
        toBg={icon.swapToBg}
      />
    );
  }

  if (icon?.type === 'token') {
    return <TokenIcon Token={icon.Token} bgColor={icon.bgColor} />;
  }

  if (icon?.type === 'icon' && icon.iconName) {
    return <ActionIcon name={icon.iconName} />;
  }

  if (type === 'deposit') {
    const depositTokenIcon = getDepositTokenIcon(transaction.currency);
    if (depositTokenIcon) {
      return <TokenIcon Token={depositTokenIcon.Token} bgColor={depositTokenIcon.bgColor} />;
    }
  }

  const defaultIcons: Record<TransactionType, string> = {
    send: 'arrow-up-right',
    receive: 'arrow-down-left',
    swap: 'repeat',
    deposit: 'plus',
    withdraw: 'minus',
  };

  return (
    <View className="h-12 w-12 items-center justify-center rounded-full bg-surface">
      <Icon library="feather" name={defaultIcons[type]} size={24} color="#121212" />
    </View>
  );
};

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, ...props }) => {
  const { text: amountText, isCredit } = formatAmount(
    transaction.amount,
    transaction.type,
    transaction.currency
  );
  const isPending = transaction.status === 'pending';

  return (
    <TouchableOpacity className="flex-row items-center py-3" activeOpacity={0.7} {...props}>
      <View className="mr-sm">
        <TransactionIcon transaction={transaction} />
      </View>

      <View className="flex-1">
        <Text className="font-subtitle text-subtitle text-text-primary" numberOfLines={1}>
          {transaction.title}
        </Text>
        <Text className="mt-[2px] font-caption text-caption text-text-secondary" numberOfLines={1}>
          {transaction.subtitle}
        </Text>
      </View>

      <View className="items-end">
        <Text
          className={`font-subtitle text-subtitle ${isPending ? 'text-text-secondary' : isCredit ? 'text-success' : 'text-text-primary'}`}
          numberOfLines={1}>
          {amountText}
        </Text>
        {isPending && (
          <Text className="mt-[2px] font-caption text-[12px] text-primary">Pending</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};
