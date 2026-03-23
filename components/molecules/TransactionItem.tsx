import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Skeleton } from '../atoms';
import { useUIStore } from '@/stores';
import { MaskedBalance } from './MaskedBalance';
import { resolveTransactionAssetIcon } from '@/utils/transactionIcon';
import { formatTransactionAmount } from '@/utils/transactionFormat';
import type { SvgComponent } from '@/utils/transactionIcon';
import { ArrowDownLeft01Icon, ArrowUpRight01Icon, CreditCardIcon, DollarCircleIcon, Mail01Icon, MinusSignIcon, PlusSignIcon, RepeatIcon, Tag01Icon, Wallet01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

export type TransactionType = 'send' | 'receive' | 'swap' | 'deposit' | 'withdraw';
export type TransactionStatus = 'completed' | 'pending' | 'failed';
export type WithdrawalMethod = 'fiat' | 'crypto' | 'card' | 'p2p';
export type { SvgComponent };

export interface Transaction {
  id: string;
  type: TransactionType;
  title: string;
  subtitle: string;
  amount: number;
  currency?: string;
  assetSymbol?: string;
  merchant?: string;
  status: TransactionStatus;
  createdAt: Date;
  txHash?: string;
  toAddress?: string;
  fee?: string;
  withdrawalMethod?: WithdrawalMethod;
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

export interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
}

const ICON_SIZE = 44;

const TokenIcon = ({
  Token,
  bgColor,
  withBorder,
  isSymbol,
}: {
  Token?: SvgComponent;
  bgColor?: string;
  withBorder?: boolean;
  isSymbol?: boolean;
}) => (
  <View
    style={{
      width: ICON_SIZE,
      height: ICON_SIZE,
      borderRadius: ICON_SIZE / 2,
      backgroundColor: bgColor || '#1B84FF',
      borderWidth: withBorder ? 1 : 0,
      borderColor: '#E6E8EC',
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
    {Token ? (
      <Token width={isSymbol ? 28 : ICON_SIZE + 8} height={isSymbol ? 28 : ICON_SIZE + 8} />
    ) : (
      <HugeiconsIcon icon={DollarCircleIcon} size={24} color="#FFFFFF" />
    )}
  </View>
);

const ACTION_ICON_MAP: Record<string, any> = {
  'arrow-up-right': ArrowUpRight01Icon,
  'arrow-down-left': ArrowDownLeft01Icon,
  'repeat': RepeatIcon,
  'plus': PlusSignIcon,
  'minus': MinusSignIcon,
};

const ActionIcon = ({ name }: { name: string }) => (
  <View className="h-12 w-12 items-center justify-center rounded-full border border-surface bg-background-main">
    <HugeiconsIcon icon={ACTION_ICON_MAP[name] ?? ArrowUpRight01Icon} size={22} color="#757575" />
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

const DEFAULT_ICONS: Record<TransactionType, string> = {
  send: 'arrow-up-right',
  receive: 'arrow-down-left',
  swap: 'repeat',
  deposit: 'plus',
  withdraw: 'minus',
};

const WITHDRAWAL_BADGE: Record<string, { icon: any; bg: string }> = {
  fiat: { icon: CreditCardIcon, bg: '#3B82F6' },
  card: { icon: CreditCardIcon, bg: '#3B82F6' },
  crypto: { icon: Wallet01Icon, bg: '#8B5CF6' },
  p2p: { icon: Mail01Icon, bg: '#10B981' },
};

const WithdrawalBadge = ({ method }: { method: string }) => {
  const badge = WITHDRAWAL_BADGE[method] ?? { icon: Tag01Icon, bg: '#6B7280' };
  return (
    <View
      className="absolute -bottom-0.5 -right-0.5 h-5 w-5 items-center justify-center rounded-full border-2 border-white"
      style={{ backgroundColor: badge.bg }}>
      <HugeiconsIcon icon={badge.icon} size={10} color="#fff" strokeWidth={2.5} />
    </View>
  );
};

const TransactionIcon = ({ transaction }: { transaction: Transaction }) => {
  const { icon, type, withdrawalMethod } = transaction;

  let iconEl: React.ReactElement;

  if (icon?.type === 'swap')
    iconEl = (
      <SwapIcon
        SwapFrom={icon.SwapFrom}
        SwapTo={icon.SwapTo}
        fromBg={icon.swapFromBg}
        toBg={icon.swapToBg}
      />
    );
  else if (icon?.type === 'token') iconEl = <TokenIcon Token={icon.Token} bgColor={icon.bgColor} />;
  else if (icon?.type === 'icon' && icon.iconName) iconEl = <ActionIcon name={icon.iconName} />;
  else {
    const inferred = resolveTransactionAssetIcon(transaction);
    iconEl = inferred ? (
      <TokenIcon
        Token={inferred.Token}
        bgColor={inferred.bgColor}
        withBorder={inferred.withBorder}
        isSymbol={inferred.isSymbol}
      />
    ) : (
      <View className="h-12 w-12 items-center justify-center rounded-full bg-surface">
        <HugeiconsIcon icon={ACTION_ICON_MAP[DEFAULT_ICONS[type]] ?? ArrowUpRight01Icon} size={24} color="#121212" />
      </View>
    );
  }

  return (
    <View style={{ width: ICON_SIZE, height: ICON_SIZE }}>
      {iconEl}
      {type === 'withdraw' && withdrawalMethod && <WithdrawalBadge method={withdrawalMethod} />}
    </View>
  );
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onPress }) => {
  const { text: amountText, isCredit } = formatTransactionAmount(
    transaction.amount,
    transaction.type,
    transaction.currency
  );
  const isPending = transaction.status === 'pending';
  const isFailed = transaction.status === 'failed';
  const isBalanceVisible = useUIStore((s) => s.isBalanceVisible);
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      style={animStyle}
      className="flex-row items-center py-[10px]"
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      }}
      accessibilityRole="button"
      accessibilityLabel={`${transaction.title}, ${amountText}`}>
      <View className="mr-sm">
        <TransactionIcon transaction={transaction} />
      </View>
      <View className="flex-1">
        <Text className="font-subtitle text-[15px] text-text-primary" numberOfLines={1}>
          {transaction.title}
        </Text>
        <Text className="mt-[2px] font-caption text-[12px] text-text-secondary" numberOfLines={1}>
          {transaction.subtitle}
        </Text>
      </View>
      <View className="items-end">
        <MaskedBalance
          value={amountText}
          visible={isBalanceVisible}
          textClass="text-[16px]"
          colorClass={
            isPending
              ? 'text-text-secondary'
              : isFailed
                ? 'text-destructive'
                : isCredit
                  ? 'text-success'
                  : transaction.type === 'withdraw' || transaction.type === 'send'
                    ? 'text-destructive'
                    : 'text-text-primary'
          }
        />
        {isPending && (
          <Text className="mt-[2px] font-caption text-[12px] text-primary">Pending</Text>
        )}
        {isFailed && (
          <Text className="mt-[2px] font-caption text-[12px] text-destructive">Failed</Text>
        )}
      </View>
    </AnimatedPressable>
  );
};

export const TransactionItemSkeleton: React.FC = () => (
  <View className="flex-row items-center py-[10px]">
    <View className="mr-sm">
      <Skeleton className="h-12 w-12 rounded-full" />
    </View>
    <View className="flex-1">
      <Skeleton className="h-4 w-2/5 rounded-sm" />
      <Skeleton className="mt-[6px] h-3 w-3/5 rounded-sm" />
    </View>
    <View className="ml-3 items-end">
      <Skeleton className="h-4 w-[92px] rounded-sm" />
      <Skeleton className="mt-[6px] h-3 w-[62px] rounded-sm" />
    </View>
  </View>
);
