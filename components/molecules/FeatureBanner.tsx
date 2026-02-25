import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { ArrowUpRight } from 'lucide-react-native';

import ShieldLockIcon from '@/assets/Icons/shield-lock-5.svg';
import CreditCardIcon from '@/assets/Icons/credit-card-8.svg';
import ZapIcon from '@/assets/Icons/waterfall-chart-4.svg';
import LoyaltyIcon from '@/assets/Icons/loyalty-14.svg';

type Banner = {
  id: string;
  label: string;
  title: string;
  bg: string;
  iconColor: string;
  Icon: React.FC<{ width: number; height: number; color?: string }>;
  badge?: string;
  onPress?: () => void;
};

function BannerCard({ b, cardWidth }: { b: Banner; cardWidth: number }) {
  return (
    <TouchableOpacity
      activeOpacity={b.onPress ? 0.7 : 1}
      onPress={b.onPress}
      style={{ width: cardWidth, marginRight: 10, backgroundColor: b.bg }}
      className="rounded-2xl p-4">
      {/* Icon */}
      <View className="mb-8">
        <b.Icon width={32} height={32} color={b.iconColor} />
      </View>

      {/* Label + badge row */}
      <View className="mb-1 flex-row items-center gap-2">
        <Text
          style={{ color: b.iconColor }}
          className="font-subtitle text-[11px] uppercase tracking-widest">
          {b.label}
        </Text>
        {b.badge && (
          <View
            style={{ backgroundColor: b.iconColor + '22' }}
            className="rounded-full px-2 py-0.5">
            <Text style={{ color: b.iconColor }} className="font-subtitle text-[10px]">
              {b.badge}
            </Text>
          </View>
        )}
      </View>

      {/* Title + arrow */}
      <View className="flex-row items-end justify-between">
        <Text className="flex-1 pr-2 font-subtitle text-[15px] leading-5 text-white">
          {b.title}
        </Text>
        <View
          style={{ backgroundColor: b.iconColor + '22' }}
          className="h-7 w-7 items-center justify-center rounded-full">
          <ArrowUpRight size={14} color={b.iconColor} strokeWidth={2.5} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

interface FeatureBannerProps {
  kycApproved: boolean;
  onKYCPress?: () => void;
}

export function FeatureBanner({ kycApproved, onKYCPress }: FeatureBannerProps) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.min(Math.max(screenWidth * 0.62, 220), 320);
  const snap = cardWidth + 10;

  const banners: Banner[] = [
    ...(!kycApproved
      ? [
          {
            id: 'kyc',
            label: 'Required',
            title: 'Verify your identity',
            bg: '#0D2818',
            iconColor: '#4ADE80',
            Icon: ShieldLockIcon as any,
            onPress: onKYCPress,
          },
        ]
      : []),
    {
      id: 'card',
      label: 'Coming soon',
      title: 'Rail Debit Card',
      bg: '#0F0F1A',
      iconColor: '#818CF8',
      badge: 'Soon',
      Icon: CreditCardIcon as any,
    },
    {
      id: 'conductor',
      label: 'Coming soon',
      title: 'Conductor',
      bg: '#1A1200',
      iconColor: '#FBBF24',
      badge: 'Soon',
      Icon: ZapIcon as any,
    },
    {
      id: 'rewards',
      label: 'New',
      title: 'Rail Rewards',
      bg: '#1A0A1A',
      iconColor: '#E879F9',
      Icon: LoyaltyIcon as any,
    },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={snap}
      snapToAlignment="start"
      className="mt-5"
      contentContainerStyle={{ paddingRight: 16 }}>
      {banners.map((b) => (
        <BannerCard key={b.id} b={b} cardWidth={cardWidth} />
      ))}
    </ScrollView>
  );
}
