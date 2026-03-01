import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { BottomSheet } from './BottomSheet';
import { PhantomIcon, SolflareIcon, SolanaIcon } from '@/assets/svg';
import { BankIcon } from '@/assets/svg/filled';

interface FundingOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  comingSoon?: boolean;
}

interface MoreFundingOptionsSheetProps {
  visible: boolean;
  onClose: () => void;
  mode: 'deposit' | 'send';
}

export function MoreFundingOptionsSheet({ visible, onClose, mode }: MoreFundingOptionsSheetProps) {
  const showWalletOptions = Platform.OS === 'android' || mode === 'send';

  const openMethodFlow = (method: 'phantom' | 'solflare') => {
    onClose();
    requestAnimationFrame(() => {
      router.push({
        pathname: '/withdraw/[method]',
        params: {
          method,
          flow: mode === 'deposit' ? 'fund' : 'send',
        },
      } as never);
    });
  };

  const options: FundingOption[] = [
    ...(showWalletOptions
      ? [
          {
            id: 'phantom',
            label: 'Phantom',
            icon: <PhantomIcon width={28} height={28} />,
            onPress: () => openMethodFlow('phantom'),
          },
          {
            id: 'solflare',
            label: 'Solflare',
            icon: <SolflareIcon width={28} height={28} />,
            onPress: () => openMethodFlow('solflare'),
          },
        ]
      : []),
    {
      id: 'solana-pay',
      label: 'Solana Pay',
      icon: <SolanaIcon width={28} height={28} />,
      onPress: () => {},
      comingSoon: true,
    },
    {
      id: 'wire',
      label: 'Wire Transfer',
      icon: <BankIcon width={28} height={28} color="#6366F1" />,
      onPress: () => {},
      comingSoon: true,
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
          onPress={option.comingSoon ? undefined : option.onPress}
          disabled={option.comingSoon}
          activeOpacity={option.comingSoon ? 1 : 0.6}>
          <View className="flex-row items-center gap-4">
            <View
              className={`h-10 w-10 items-center justify-center rounded-full ${option.comingSoon ? 'bg-gray-100' : 'bg-gray-50'}`}>
              {option.icon}
            </View>
            <Text
              className={`font-subtitle text-base ${option.comingSoon ? 'text-gray-400' : 'text-text-primary'}`}>
              {option.label}
            </Text>
          </View>
          {option.comingSoon ? (
            <View className="rounded-full bg-gray-100 px-2 py-0.5">
              <Text className="font-body text-xs text-gray-400">Soon</Text>
            </View>
          ) : (
            <ChevronRight size={18} color="#9CA3AF" />
          )}
        </TouchableOpacity>
      ))}
    </BottomSheet>
  );
}
