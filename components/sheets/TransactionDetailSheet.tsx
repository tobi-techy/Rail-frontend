import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { BottomSheet } from './BottomSheet';
import { Icon } from '../atoms';
import { Transaction, TransactionType, SvgComponent } from '../molecules/TransactionItem';

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

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(amount));

const truncateAddress = (address: string) =>
  address.length > 12 ? `${address.slice(0, 4)}...${address.slice(-4)}` : address;

const DetailRow = ({ label, value, copyable, isGreen }: { label: string; value: string; copyable?: boolean; isGreen?: boolean }) => {
  const handleCopy = async () => {
    await Clipboard.setStringAsync(value);
  };

  return (
    <View className="flex-row items-center justify-between py-3">
      <Text className="font-caption text-body text-text-secondary">{label}</Text>
      <View className="flex-row items-center">
        <Text className={`font-subtitle text-body ${isGreen ? 'text-success' : 'text-text-primary'}`}>
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

const LargeTokenIcon = ({ Token, bgColor }: { Token?: SvgComponent; bgColor?: string }) => (
  <View className="h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: bgColor || '#1B84FF' }}>
    {Token ? <Token width={36} height={36} /> : <Icon library="feather" name="dollar-sign" size={32} color="#FFFFFF" />}
  </View>
);

const LargeActionIcon = ({ name }: { name: string }) => (
  <View className="h-16 w-16 items-center justify-center rounded-full border-2 border-surface bg-background-main">
    <Icon library="feather" name={name} size={28} color="#757575" />
  </View>
);

const LargeSwapIcon = ({ SwapFrom, SwapTo, fromBg, toBg }: { SwapFrom?: SvgComponent; SwapTo?: SvgComponent; fromBg?: string; toBg?: string }) => (
  <View className="h-16 w-16">
    <View className="absolute left-0 top-0 h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: fromBg || '#000' }}>
      {SwapFrom && <SwapFrom width={24} height={24} />}
    </View>
    <View className="absolute bottom-0 right-0 h-11 w-11 items-center justify-center rounded-full border-2 border-white" style={{ backgroundColor: toBg || '#1B84FF' }}>
      {SwapTo && <SwapTo width={24} height={24} />}
    </View>
  </View>
);

export function TransactionDetailSheet({ visible, onClose, transaction }: TransactionDetailSheetProps) {
  if (!transaction) return null;

  const { icon, type, amount, currency = 'NGN', createdAt, toAddress, txHash, fee } = transaction;

  const renderIcon = () => {
    if (icon?.type === 'swap') {
      return <LargeSwapIcon SwapFrom={icon.SwapFrom} SwapTo={icon.SwapTo} fromBg={icon.swapFromBg} toBg={icon.swapToBg} />;
    }
    if (icon?.type === 'token') {
      return <LargeTokenIcon Token={icon.Token} bgColor={icon.bgColor} />;
    }
    if (icon?.type === 'icon' && icon.iconName) {
      return <LargeActionIcon name={icon.iconName} />;
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
        <Text className="mt-1 font-caption text-caption text-text-secondary">{formatDate(createdAt)}</Text>
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
            <DetailRow label="Status" value={transaction.status === 'completed' ? 'Completed' : 'Pending'} isGreen={transaction.status === 'completed'} />
          </>
        )}

        {/* Withdraw details */}
        {type === 'withdraw' && (
          <>
            <DetailRow label="To" value={transaction.subtitle || 'Bank Account'} />
            <DetailRow label="Status" value={transaction.status === 'completed' ? 'Completed' : 'Processing'} isGreen={transaction.status === 'completed'} />
          </>
        )}

        {/* Swap details */}
        {type === 'swap' && (
          <DetailRow label="Via" value={transaction.subtitle || 'Rail Exchange'} />
        )}

        {/* Common details */}
        {txHash && <DetailRow label="Transaction ID" value={txHash} copyable />}
        {fee && <DetailRow label="Fees" value={fee} isGreen={fee.toLowerCase().includes('covered')} />}
      </View>
    </BottomSheet>
  );
}
