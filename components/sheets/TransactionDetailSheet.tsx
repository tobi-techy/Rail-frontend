import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { CreditCard, Wallet, Mail, Tag } from 'lucide-react-native';
import { BottomSheet } from './BottomSheet';
import { Icon } from '../atoms';
import { Transaction, TransactionType, SvgComponent } from '../molecules/TransactionItem';
import { resolveTransactionAssetIcon } from '@/utils/transactionIcon';
import { formatAbsAmount } from '@/utils/transactionFormat';
import { MaskedBalance } from '../molecules/MaskedBalance';
import { useUIStore } from '@/stores';

interface TransactionDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

const typeLabels: Record<TransactionType, string> = {
  send: 'Sent',
  receive: 'Received',
  swap: 'Swapped',
  deposit: 'Deposited',
  withdraw: 'Withdrawn',
};

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
  ' at ' +
  date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const truncateAddress = (address: string) =>
  address.length > 12 ? `${address.slice(0, 4)}...${address.slice(-4)}` : address;

const statusLabel = (status: Transaction['status']) => {
  if (status === 'completed') return 'Completed';
  if (status === 'failed') return 'Failed';
  return 'Processing';
};

const DetailRow = ({
  label,
  value,
  copyable,
  isGreen,
  isDanger,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  isGreen?: boolean;
  isDanger?: boolean;
}) => {
  const handleCopy = async () => {
    await Clipboard.setStringAsync(value);
  };

  return (
    <View className="flex-row items-center justify-between py-3">
      <Text className="font-caption text-body text-text-secondary">{label}</Text>
      <View className="flex-row items-center">
        <Text
          className={`font-subtitle text-body ${isGreen ? 'text-success' : isDanger ? 'text-destructive' : 'text-text-primary'}`}>
          {copyable ? truncateAddress(value) : value}
        </Text>
        {copyable && (
          <TouchableOpacity onPress={handleCopy} className="ml-2 p-1" hitSlop={8}>
            <Icon library="feather" name="copy" size={16} color="#757575" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const LARGE_ICON_SIZE = 48;

const WITHDRAWAL_BADGE: Record<string, { Icon: React.ComponentType<any>; bg: string }> = {
  fiat:   { Icon: CreditCard, bg: '#3B82F6' },
  card:   { Icon: CreditCard, bg: '#3B82F6' },
  crypto: { Icon: Wallet,     bg: '#8B5CF6' },
  p2p:    { Icon: Mail,       bg: '#10B981' },
};

const LargeTokenIcon = ({
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
      width: LARGE_ICON_SIZE,
      height: LARGE_ICON_SIZE,
      borderRadius: LARGE_ICON_SIZE / 2,
      borderWidth: withBorder && isSymbol ? 1 : 0,
      borderColor: '#E6E8EC',
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: bgColor || '#1B84FF',
    }}>
    {Token ? (
      <Token
        width={isSymbol ? 28 : LARGE_ICON_SIZE + 8}
        height={isSymbol ? 28 : LARGE_ICON_SIZE + 8}
      />
    ) : (
      <Icon library="feather" name="dollar-sign" size={24} color="#FFFFFF" />
    )}
  </View>
);

const LargeActionIcon = ({ name }: { name: string }) => (
  <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-surface bg-background-main">
    <Icon library="feather" name={name} size={22} color="#757575" />
  </View>
);

const LargeSwapIcon = ({
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
      className="absolute left-0 top-0 h-9 w-9 items-center justify-center rounded-full"
      style={{ backgroundColor: fromBg || '#000' }}>
      {SwapFrom && <SwapFrom width={20} height={20} />}
    </View>
    <View
      className="absolute bottom-0 right-0 h-9 w-9 items-center justify-center rounded-full border-2 border-white"
      style={{ backgroundColor: toBg || '#1B84FF' }}>
      {SwapTo && <SwapTo width={20} height={20} />}
    </View>
  </View>
);

export function TransactionDetailSheet({
  visible,
  onClose,
  transaction,
}: TransactionDetailSheetProps) {
  const { isBalanceVisible } = useUIStore();
  if (!transaction) return null;

  const { icon, type, amount, currency = 'NGN', createdAt, toAddress, txHash, fee, withdrawalMethod } = transaction;

  const renderIcon = () => {
    let iconEl: React.ReactElement;

    if (icon?.type === 'swap') {
      iconEl = (
        <LargeSwapIcon
          SwapFrom={icon.SwapFrom}
          SwapTo={icon.SwapTo}
          fromBg={icon.swapFromBg}
          toBg={icon.swapToBg}
        />
      );
    } else if (icon?.type === 'token') {
      iconEl = <LargeTokenIcon Token={icon.Token} bgColor={icon.bgColor} />;
    } else if (icon?.type === 'icon' && icon.iconName) {
      iconEl = <LargeActionIcon name={icon.iconName} />;
    } else {
      const inferredAssetIcon = resolveTransactionAssetIcon(transaction);
      iconEl = inferredAssetIcon ? (
        <LargeTokenIcon
          Token={inferredAssetIcon.Token}
          bgColor={inferredAssetIcon.bgColor}
          withBorder={inferredAssetIcon.withBorder}
          isSymbol={inferredAssetIcon.isSymbol}
        />
      ) : (
        <LargeActionIcon name="activity" />
      );
    }

    const badge = withdrawalMethod ? (WITHDRAWAL_BADGE[withdrawalMethod] ?? { Icon: Tag, bg: '#6B7280' }) : null;

    return (
      <View style={{ width: LARGE_ICON_SIZE, height: LARGE_ICON_SIZE }}>
        {iconEl}
        {badge && (
          <View
            className="absolute -bottom-0.5 -right-0.5 h-5 w-5 items-center justify-center rounded-full border-2 border-white"
            style={{ backgroundColor: badge.bg }}>
            <badge.Icon size={10} color="#fff" strokeWidth={2.5} />
          </View>
        )}
      </View>
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="items-center pb-4">
        {renderIcon()}
        <View className="mt-3 rounded-full bg-surface px-3 py-1">
          <Text className="font-caption text-[11px] uppercase tracking-wide text-text-secondary">
            {typeLabels[type]}
          </Text>
        </View>
        <MaskedBalance
          value={`${formatAbsAmount(amount)} ${currency}`}
          visible={isBalanceVisible}
          textClass="text-[24px]"
          colorClass="text-text-primary"
        />
        <Text className="mt-0.5 font-caption text-[11px] text-text-secondary">
          {formatDate(createdAt)}
        </Text>
      </View>

      <View className="mt-2 border-t border-surface pt-2">
        {/* Send/Receive details */}
        {(type === 'send' || type === 'receive') && toAddress && (
          <DetailRow label={type === 'send' ? 'To' : 'From'} value={toAddress} copyable />
        )}

        {/* Deposit details */}
        {type === 'deposit' && (
          <>
            <DetailRow label="Method" value={transaction.subtitle || 'Card'} />
            <DetailRow
              label="Status"
              value={statusLabel(transaction.status)}
              isGreen={transaction.status === 'completed'}
              isDanger={transaction.status === 'failed'}
            />
          </>
        )}

        {/* Withdraw details */}
        {type === 'withdraw' && (
          <>
            <DetailRow label="To" value={transaction.subtitle || 'Bank Account'} />
            <DetailRow
              label="Status"
              value={statusLabel(transaction.status)}
              isGreen={transaction.status === 'completed'}
              isDanger={transaction.status === 'failed'}
            />
          </>
        )}

        {/* Swap details */}
        {type === 'swap' && (
          <DetailRow label="Via" value={transaction.subtitle || 'Rail Exchange'} />
        )}

        {/* Common details */}
        {txHash && <DetailRow label="Transaction ID" value={txHash} copyable />}
        {fee && (
          <DetailRow label="Fees" value={fee} isGreen={fee.toLowerCase().includes('covered')} />
        )}
      </View>
    </BottomSheet>
  );
}
