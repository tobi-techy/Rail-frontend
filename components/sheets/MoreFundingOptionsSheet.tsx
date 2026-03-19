import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { AtSign, Mail, Users, ChevronRight } from 'lucide-react-native';
import { BottomSheet } from './BottomSheet';
import { PhantomIcon, SolflareIcon, SolanaIcon } from '@/assets/svg';
import { BankIcon } from '@/assets/svg/filled';

interface FundingOption {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  iconBg: string;
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

  const openMethodFlow = (method: string) => {
    onClose();
    requestAnimationFrame(() => {
      router.push({
        pathname: '/withdraw/[method]',
        params: { method, flow: mode === 'deposit' ? 'fund' : 'send' },
      } as never);
    });
  };

  const p2pOptions: FundingOption[] =
    mode === 'send'
      ? [
          {
            id: 'railtag',
            label: 'RailTag',
            sublabel: 'Instant send to any @rail user',
            icon: <AtSign size={20} color="#FF2E01" />,
            iconBg: '#FFF0ED',
            onPress: () => openMethodFlow('railtag'),
          },
          {
            id: 'email',
            label: 'Email',
            sublabel: 'Send to anyone by email',
            icon: <Mail size={20} color="#6366F1" />,
            iconBg: '#EEF2FF',
            onPress: () => openMethodFlow('email'),
          },
          {
            id: 'contact',
            label: 'Contact',
            sublabel: 'Pick from your phone contacts',
            icon: <Users size={20} color="#059669" />,
            iconBg: '#ECFDF5',
            onPress: () => openMethodFlow('contact'),
          },
        ]
      : [];

  const walletOptions: FundingOption[] = showWalletOptions
    ? [
        {
          id: 'phantom',
          label: 'Phantom',
          sublabel: mode === 'deposit' ? 'Fund from Phantom wallet' : 'Send to Phantom wallet',
          icon: <PhantomIcon width={20} height={20} />,
          iconBg: '#F3F0FF',
          onPress: () => openMethodFlow('phantom'),
        },
        {
          id: 'solflare',
          label: 'Solflare',
          sublabel: mode === 'deposit' ? 'Fund from Solflare wallet' : 'Send to Solflare wallet',
          icon: <SolflareIcon width={20} height={20} />,
          iconBg: '#FFF7ED',
          onPress: () => openMethodFlow('solflare'),
        },
      ]
    : [];

  const comingSoonOptions: FundingOption[] = [
    {
      id: 'solana-pay',
      label: 'Solana Pay',
      sublabel: 'Scan a QR code to pay',
      icon: <SolanaIcon width={20} height={20} />,
      iconBg: '#F0FDF4',
      onPress: () => {},
      comingSoon: true,
    },
    {
      id: 'wire',
      label: 'Wire Transfer',
      sublabel: 'International bank wire',
      icon: <BankIcon width={20} height={20} color="#6366F1" />,
      iconBg: '#EEF2FF',
      onPress: () => {},
      comingSoon: true,
    },
  ];

  type Section = { title: string; options: FundingOption[] };
  const sections: Section[] = [
    ...(p2pOptions.length ? [{ title: 'Send to people', options: p2pOptions }] : []),
    ...(walletOptions.length ? [{ title: 'Wallets', options: walletOptions }] : []),
    { title: 'Coming soon', options: comingSoonOptions },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text className="mb-6 font-subtitle text-xl text-text-primary">
        {mode === 'deposit' ? 'More deposit options' : 'Send money'}
      </Text>

      {sections.map((section, si) => (
        <View key={section.title} style={si > 0 ? { marginTop: 24 } : undefined}>
          <Text className="mb-2 font-body text-[11px] uppercase tracking-widest text-text-secondary">
            {section.title}
          </Text>
          <View className="overflow-hidden rounded-2xl bg-surface">
            {section.options.map((option, i) => (
              <TouchableOpacity
                key={option.id}
                className="flex-row items-center justify-between px-4 py-3.5"
                style={
                  i < section.options.length - 1
                    ? { borderBottomWidth: 1, borderBottomColor: '#EBEBEB' }
                    : undefined
                }
                onPress={option.comingSoon ? undefined : option.onPress}
                disabled={option.comingSoon}
                activeOpacity={0.6}>
                <View className="flex-row items-center gap-3">
                  <View
                    className="h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: option.iconBg }}>
                    {option.icon}
                  </View>
                  <View>
                    <Text
                      className={`font-subtitle text-[15px] ${option.comingSoon ? 'text-gray-400' : 'text-text-primary'}`}>
                      {option.label}
                    </Text>
                    <Text className="font-body text-[12px] text-text-secondary">
                      {option.sublabel}
                    </Text>
                  </View>
                </View>
                {option.comingSoon ? (
                  <View className="rounded-full bg-gray-200 px-2 py-0.5">
                    <Text className="font-body text-[11px] text-gray-400">Soon</Text>
                  </View>
                ) : (
                  <ChevronRight size={16} color="#C4C4C4" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </BottomSheet>
  );
}
