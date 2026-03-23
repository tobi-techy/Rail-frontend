import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import ShieldLockIcon from '@/assets/Icons/shield-lock-5.svg';
import CreditCardIcon from '@/assets/Icons/credit-card-8.svg';
import ZapIcon from '@/assets/Icons/waterfall-chart-4.svg';
import LoyaltyIcon from '@/assets/Icons/loyalty-14.svg';
import { useKycStore } from '@/stores/kycStore';
import { BottomSheet } from '@/components/sheets';
import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

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
          <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} color={b.iconColor} strokeWidth={2.5} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

interface FeatureBannerProps {
  kycApproved: boolean;
  onKYCPress?: () => void;
  hasCard?: boolean;
}

function getKycProgressScreen(state: ReturnType<typeof useKycStore.getState>): string {
  const { taxId, employmentStatus, investmentPurposes, disclosuresConfirmed, diditSessionToken } =
    state;

  // If user has a Didit session token, they're in the middle of ID verification
  if (diditSessionToken) {
    return '/kyc/didit-sdk';
  }

  // If user has completed disclosures and submitted, they should be going to Didit
  // But if diditSessionToken is null (failed to get or session expired), go to disclosures to resubmit
  if (disclosuresConfirmed && taxId && employmentStatus && investmentPurposes.length > 0) {
    return '/kyc/disclosures';
  }

  // If user has started about-you (employment + investment goals), go to disclosures
  if (employmentStatus && investmentPurposes.length > 0 && taxId) {
    return '/kyc/disclosures';
  }

  // If user has started tax-id, go to about-you
  if (taxId) {
    return '/kyc/about-you';
  }

  // Nothing started, go to beginning
  return '/kyc/tax-id';
}

export function FeatureBanner({ kycApproved, onKYCPress, hasCard }: FeatureBannerProps) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.min(Math.max(screenWidth * 0.62, 220), 320);
  const snap = cardWidth + 10;
  const [activeIndex, setActiveIndex] = useState(0);
  const [showConductorSheet, setShowConductorSheet] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const { taxId, employmentStatus, investmentPurposes, disclosuresConfirmed, diditSessionToken } =
    useKycStore();

  const hasStartedKyc =
    taxId.trim().length > 0 ||
    employmentStatus !== null ||
    investmentPurposes.length > 0 ||
    disclosuresConfirmed ||
    diditSessionToken !== null;

  const handleKycPress = () => {
    if (hasStartedKyc) {
      const state = useKycStore.getState();
      const screen = getKycProgressScreen(state);
      router.push(screen as never);
    } else {
      router.push('/kyc');
    }
  };

  const banners: Banner[] = [
    ...(!kycApproved
      ? [
          {
            id: 'kyc',
            label: 'Required',
            title: hasStartedKyc ? 'Continue verification' : 'Verify your identity',
            bg: '#0D2818',
            iconColor: '#4ADE80',
            Icon: ShieldLockIcon as any,
            onPress: handleKycPress,
          },
        ]
      : []),
    ...(!hasCard
      ? [
          {
            id: 'card',
            label: 'Get started',
            title: 'Rail Debit Card',
            bg: '#0F0F1A',
            iconColor: '#818CF8',
            badge: 'New',
            Icon: CreditCardIcon as any,
            onPress: () => (kycApproved ? router.push('/card') : onKYCPress?.()),
          },
        ]
      : []),
    {
      id: 'conductor',
      label: 'Coming soon',
      title: 'Conductor',
      bg: '#1A1200',
      iconColor: '#FBBF24',
      badge: 'Soon',
      Icon: ZapIcon as any,
      onPress: () => setShowConductorSheet(true),
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
    <View className="mt-5">
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={snap}
        snapToAlignment="start"
        pagingEnabled={false}
        disableIntervalMomentum
        onScroll={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / snap);
          setActiveIndex(Math.max(0, Math.min(idx, banners.length - 1)));
        }}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingRight: 16 }}>
        {banners.map((b) => (
          <BannerCard key={b.id} b={b} cardWidth={cardWidth} />
        ))}
      </ScrollView>
      {banners.length > 1 && (
        <View className="mt-2 flex-row justify-center gap-1">
          {banners.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === activeIndex ? 16 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === activeIndex ? '#FF2E01' : '#E5E7EB',
              }}
            />
          ))}
        </View>
      )}

      <BottomSheet
        visible={showConductorSheet}
        onClose={() => setShowConductorSheet(false)}
        showCloseButton={false}
        dismissible>
        <View className="items-center">
          <View className="h-1 w-10 rounded-full bg-neutral-200" />
        </View>
        <View className="mt-4 gap-6">
          <View className="items-start gap-2">
            <View className="rounded-full bg-[#FBBF24]/10 px-3 py-1">
              <Text className="font-subtitle text-[12px] text-[#F59E0B]">Coming soon</Text>
            </View>
            <Text className="font-subtitle text-xl text-neutral-900">Conductor</Text>
            <Text className="font-body text-sm text-neutral-500">
              Conductor is Rail&apos;s copy-investing feature. Allocate small amounts to follow top
              investors and Rail mirrors their buy and sell decisions automatically.
            </Text>
          </View>

          <View className="gap-2">
            <Text className="font-subtitle text-base text-neutral-900">How it works</Text>
            <Text className="font-body text-sm text-neutral-500">1. Pick a conductor.</Text>
            <Text className="font-body text-sm text-neutral-500">2. Allocate funds.</Text>
            <Text className="font-body text-sm text-neutral-500">
              3. Rail follows their trades for you.
            </Text>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}
