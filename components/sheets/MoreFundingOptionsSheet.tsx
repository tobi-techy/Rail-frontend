import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { BottomSheet } from './BottomSheet';
import { PhantomIcon, SolflareIcon, SolanaIcon } from '@/assets/svg';
import { BankIcon } from '@/assets/svg/filled';

interface FundingOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}

interface MoreFundingOptionsSheetProps {
  visible: boolean;
  onClose: () => void;
  mode: 'deposit' | 'send';
}

export function MoreFundingOptionsSheet({ visible, onClose, mode }: MoreFundingOptionsSheetProps) {
  const options: FundingOption[] = [
    {
      id: 'phantom',
      label: 'Phantom',
      icon: <PhantomIcon width={28} height={28} />,
      onPress: () => {
        onClose();
        // TODO: Solana Mobile Wallet Adapter — Phantom
      },
    },
    {
      id: 'solflare',
      label: 'Solflare',
      icon: <SolflareIcon width={28} height={28} />,
      onPress: () => {
        onClose();
        // TODO: Solana Mobile Wallet Adapter — Solflare
      },
    },
    {
      id: 'solana-pay',
      label: 'Solana Pay',
      icon: <SolanaIcon width={28} height={28} />,
      onPress: () => {
        onClose();
        // TODO: Solana Pay integration
      },
    },
    {
      id: 'wire',
      label: 'Wire Transfer',
      icon: <BankIcon width={28} height={28} color="#6366F1" />,
      onPress: () => {
        onClose();
        // TODO: Wire transfer flow
      },
    },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text className="mb-5 font-subtitle text-xl text-text-primary">
        {mode === 'deposit' ? 'More deposit options' : 'More send options'}
      </Text>

      {options.map((option, i) => (
        <TouchableOpacity
          key={option.id}
          className="flex-row items-center justify-between py-4"
          style={
            i < options.length - 1
              ? { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }
              : undefined
          }
          onPress={option.onPress}
          activeOpacity={0.6}>
          <View className="flex-row items-center gap-4">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-50">
              {option.icon}
            </View>
            <Text className="font-subtitle text-base text-text-primary">{option.label}</Text>
          </View>
          <ChevronRight size={18} color="#9CA3AF" />
        </TouchableOpacity>
      ))}
    </BottomSheet>
  );
}
