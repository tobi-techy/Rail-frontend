import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { GorhomBottomSheet } from './GorhomBottomSheet';
import { Button } from '@/components/ui';
import { Shield01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';

interface Props {
  visible: boolean;
  address: string;
  chain: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function NewAddressWarningSheet({ visible, address, chain, isLoading, onConfirm, onCancel }: Props) {
  const truncated = address.length > 16 ? `${address.slice(0, 8)}...${address.slice(-6)}` : address;

  return (
    <GorhomBottomSheet visible={visible} onClose={onCancel}>
      <View className="px-5 pb-6">
        <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-[#FFF7ED]">
          <HugeiconsIcon icon={Shield01Icon} size={26} color="#F59E0B" />
        </View>

        <Text className="font-subtitle text-[22px] text-text-primary">New address</Text>

        <Text className="mt-2 font-body text-[15px] leading-[22px] text-text-secondary">
          This address isn't whitelisted. We'll save it to your address book for future transfers.
        </Text>

        <View className="mt-5 rounded-2xl bg-[#F8F7F4] px-4 py-3.5">
          <Text className="font-mono text-[14px] text-text-primary" numberOfLines={1}>{truncated}</Text>
          <Text className="mt-0.5 font-body text-[12px] text-text-secondary">{chain}</Text>
        </View>

        <View className="mt-6 flex-row gap-3">
          <Button title="Cancel" variant="ghost" onPress={onCancel} disabled={isLoading} flex />
          <Button title="Whitelist & Send" variant="orange" onPress={onConfirm} disabled={isLoading} loading={isLoading} flex />
        </View>
      </View>
    </GorhomBottomSheet>
  );
}
