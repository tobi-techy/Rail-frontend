import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Skeleton } from '../atoms';
import { useUIStore } from '@/stores';
import { MaskedBalance } from './MaskedBalance';
import { resolveTransactionAssetIcon } from '@/utils/transactionIcon';
import { formatTransactionAmount } from '@/utils/transactionFormat';
import type { SvgComponent } from '@/utils/transactionIcon';
import {
  ArrowDownLeft01Icon,
  ArrowUpRight01Icon,
  CreditCardIcon,
  DollarCircleIcon,
  Mail01Icon,
  MinusSignIcon,
  PlusSignIcon,
  RepeatIcon,
  Tag01Icon,
  Wallet01Icon,
} from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';
import { useButtonFeedback } from '@/hooks/useButtonFeedback';

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
  /** Extra metadata for detail sheet / receipt */
  metadata?: Record<string, string | number | undefined>;
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

const ICON_SIZE = 48;

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
      backgroundColor: isSymbol ? bgColor || '#0090ff' : 'transparent',
      borderWidth: withBorder ? 1 : 0,
      borderColor: '#e8e6e3',
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
    {Token ? (
      <Token width={isSymbol ? 28 : ICON_SIZE} height={isSymbol ? 28 : ICON_SIZE} />
    ) : (
      <HugeiconsIcon icon={DollarCircleIcon} size={24} color="#FFFFFF" />
    )}
  </View>
);

const ACTION_ICON_MAP: Record<string, any> = {
  'arrow-up-right': ArrowUpRight01Icon,
  'arrow-down-left': ArrowDownLeft01Icon,
  repeat: RepeatIcon,
  plus: PlusSignIcon,
  minus: MinusSignIcon,
};

const ActionIcon = ({ name }: { name: string }) => (
  <View className="h-12 w-12 items-center justify-center rounded-full border border-surface bg-background-main">
    <HugeiconsIcon icon={ACTION_ICON_MAP[name] ?? ArrowUpRight01Icon} size={22} color="#848281" />
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
  <View style={{ width: ICON_SIZE, height: ICON_SIZE }}>
    <View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {SwapFrom && <SwapFrom width={36} height={36} />}
    </View>
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#f7f4ef',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {SwapTo && <SwapTo width={28} height={28} />}
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
  fiat: { icon: CreditCardIcon, bg: '#0090ff' },
  card: { icon: CreditCardIcon, bg: '#0090ff' },
  crypto: { icon: Wallet01Icon, bg: '#9f4fff' },
  p2p: { icon: Mail01Icon, bg: '#00ca48' },
};

const WithdrawalBadge = ({ method }: { method: string }) => {
  const badge = WITHDRAWAL_BADGE[method] ?? { icon: Tag01Icon, bg: '#848281' };
  return (
    <View
      style={{
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: badge.bg,
        borderWidth: 2,
        borderColor: '#f7f4ef',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <HugeiconsIcon icon={badge.icon} size={11} color="#fff" strokeWidth={2.5} />
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
        <HugeiconsIcon
          icon={ACTION_ICON_MAP[DEFAULT_ICONS[type]] ?? ArrowUpRight01Icon}
          size={24}
          color="#343433"
        />
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

export const TransactionItem: React.FC<TransactionItemProps> = React.memo(
  ({ transaction, onPress }) => {
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
    const triggerFeedback = useButtonFeedback();

    return (
      <AnimatedPressable
        style={animStyle}
        className="flex-row items-center py-[14px]"
        onPress={() => {
          triggerFeedback();
          onPress?.();
        }}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 20, stiffness: 300 });
        }}
        accessibilityRole="button"
        accessibilityLabel={`${transaction.title}, ${amountText}`}>
        <View className="mr-3">
          <TransactionIcon transaction={transaction} />
        </View>
        <View className="flex-1">
          <Text className="font-subtitle text-[15px] text-text-primary" numberOfLines={1}>
            {transaction.title}
          </Text>
          <Text className="mt-0.5 font-caption text-[13px] text-text-secondary" numberOfLines={1}>
            {transaction.subtitle}
          </Text>
        </View>
        <View className="ml-3 items-end">
          <MaskedBalance
            value={amountText}
            visible={isBalanceVisible}
            textClass="text-[15px]"
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
          {transaction.amount > 0 && (
            <Text
              className="mt-0.5 font-mono-light text-[12px] text-text-tertiary"
              style={{ fontVariant: ['tabular-nums'] }}>
              ${Math.abs(transaction.amount).toFixed(2)}
            </Text>
          )}
          {isPending && (
            <Text className="mt-0.5 font-caption text-[11px] text-primary">Pending</Text>
          )}
          {isFailed && (
            <Text className="mt-0.5 font-caption text-[11px] text-destructive">Failed</Text>
          )}
        </View>
      </AnimatedPressable>
    );
  }
);
TransactionItem.displayName = 'TransactionItem';

export const TransactionItemSkeleton: React.FC = () => (
  <View className="flex-row items-center py-[14px]">
    <View className="mr-3">
      <Skeleton className="h-12 w-12 rounded-full" />
    </View>
    <View className="flex-1">
      <Skeleton className="h-4 w-2/5 rounded-sm" />
      <Skeleton className="mt-1.5 h-3 w-3/5 rounded-sm" />
    </View>
    <View className="ml-3 items-end">
      <Skeleton className="h-4 w-[80px] rounded-sm" />
      <Skeleton className="mt-1.5 h-3 w-[50px] rounded-sm" />
    </View>
  </View>
);
