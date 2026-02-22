import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { BottomSheet } from './BottomSheet';
import { Icon } from '../atoms';
import {
  Transaction,
  TransactionType,
  SvgComponent,
  resolveTransactionAssetIcon,
} from '../molecules/TransactionItem';

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

const formatAmount = (amount: number) => {
  const abs = Math.abs(amount);
  const hasDecimals = abs % 1 !== 0;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(abs);
};

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

const LARGE_ICON_SIZE = 64;

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
      <Token width={isSymbol ? 36 : LARGE_ICON_SIZE + 8} height={isSymbol ? 36 : LARGE_ICON_SIZE + 8} />
    ) : (
      <Icon library="feather" name="dollar-sign" size={32} color="#FFFFFF" />
    )}
  </View>
);

const LargeActionIcon = ({ name }: { name: string }) => (
  <View className="h-16 w-16 items-center justify-center rounded-full border-2 border-surface bg-background-main">
    <Icon library="feather" name={name} size={28} color="#757575" />
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
  <View className="h-16 w-16">
    <View
      className="absolute left-0 top-0 h-11 w-11 items-center justify-center rounded-full"
      style={{ backgroundColor: fromBg || '#000' }}>
      {SwapFrom && <SwapFrom width={24} height={24} />}
    </View>
    <View
      className="absolute bottom-0 right-0 h-11 w-11 items-center justify-center rounded-full border-2 border-white"
      style={{ backgroundColor: toBg || '#1B84FF' }}>
      {SwapTo && <SwapTo width={24} height={24} />}
    </View>
  </View>
);

export function TransactionDetailSheet({
  visible,
  onClose,
  transaction,
}: TransactionDetailSheetProps) {
  if (!transaction) return null;

  const { icon, type, amount, currency = 'NGN', createdAt, toAddress, txHash, fee } = transaction;

  const renderIcon = () => {
    if (icon?.type === 'swap') {
      return (
        <LargeSwapIcon
          SwapFrom={icon.SwapFrom}
          SwapTo={icon.SwapTo}
          fromBg={icon.swapFromBg}
          toBg={icon.swapToBg}
        />
      );
    }
    if (icon?.type === 'token') {
      return <LargeTokenIcon Token={icon.Token} bgColor={icon.bgColor} />;
    }
    if (icon?.type === 'icon' && icon.iconName) {
      return <LargeActionIcon name={icon.iconName} />;
    }

    const inferredAssetIcon = resolveTransactionAssetIcon(transaction);
    if (inferredAssetIcon) {
      return (
        <LargeTokenIcon
          Token={inferredAssetIcon.Token}
          bgColor={inferredAssetIcon.bgColor}
          withBorder={inferredAssetIcon.withBorder}
          isSymbol={inferredAssetIcon.isSymbol}
        />
      );
    }

    return <LargeActionIcon name="activity" />;
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="items-center pb-4">
        {renderIcon()}
        <Text className="mt-4 font-caption text-body text-text-secondary">{typeLabels[type]}</Text>
        <Text className="mt-1 font-subtitle text-[32px] text-text-primary">
          {formatAmount(amount)} {currency}
        </Text>
        <Text className="mt-1 font-caption text-caption text-text-secondary">
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
