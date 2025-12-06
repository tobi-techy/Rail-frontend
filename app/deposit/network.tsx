import React, { useMemo } from 'react';
import type { ComponentType } from 'react';
import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import type { SvgProps } from 'react-native-svg';

import DepositScreenHeader from '@/components/deposit/ScreenHeader';
import { getStablecoinById } from '@/constants/depositOptions';
import { breakpoints } from '@/design/tokens';

const NetworkRow = ({
  coinId,
  networkId,
  name,
  subtitle,
  ticker,
  chainColor,
  icon,
  isCompact,
}: {
  coinId: string;
  networkId: string;
  name: string;
  subtitle: string;
  ticker: string;
  chainColor: string;
  icon: ComponentType<SvgProps>;
  isCompact: boolean;
}) => {
  const Icon = icon;
  const cardPadding = isCompact ? 16 : 20;
  const iconWrapperSize = isCompact ? 40 : 44;
  const iconSize = isCompact ? 28 : 32;
  const badgePaddingHorizontal = isCompact ? 12 : 16;
  const badgePaddingVertical = isCompact ? 6 : 8;
  const badgeRadius = isCompact ? 18 : 20;
  const titleSize = isCompact ? 15 : 16;
  const subtitleSize = isCompact ? 12 : 13;

  const handlePress = () =>
    router.push({
      pathname: '/deposit/address',
      params: { coin: coinId, network: networkId },
    });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      className="bg-[#F5F7FB]"
      style={{
        borderRadius: isCompact ? 24 : 28,
        paddingHorizontal: cardPadding,
        paddingVertical: cardPadding,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View
            className="items-center justify-center rounded-full border bg-white"
            style={{
              width: iconWrapperSize,
              height: iconWrapperSize,
            }}
          >
            <Icon width={iconSize} height={iconSize} />
          </View>
          <View style={{ marginLeft: isCompact ? 10 : 12 }}>
            <Text
              className="font-body-bold text-[#0B1120]"
              style={{ fontSize: titleSize }}
            >
              {name} ({ticker})
            </Text>
            <Text
              className="mt-1 text-[#6B7280]"
              style={{ fontSize: subtitleSize }}
            >
              {subtitle}
            </Text>
          </View>
        </View>
        <View
          className="bg-[#2563EB]"
          style={{
            borderRadius: badgeRadius,
            paddingHorizontal: badgePaddingHorizontal,
            paddingVertical: badgePaddingVertical,
          }}
        >
          <Text
            className="font-body-bold text-white"
            style={{ fontSize: isCompact ? 12 : 13 }}
          >
            Get wallet address
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const EmptyState = () => (
  <SafeAreaView className="flex-1 bg-white">
    <DepositScreenHeader
      title="Digital Dollars"
      subtitle="Select preferred digital dollar"
      onBack={() => router.replace('/deposit')}
    />
    <View className="flex-1 items-center justify-center px-6">
      <Text className="mb-2 text-xl font-body-bold text-[#0B1120]">Nothing to show yet</Text>
      <Text className="text-center text-sm text-[#6B7280]">
        We couldn&apos;t find the stablecoin you selected. Try again from the previous screen.
      </Text>
    </View>
  </SafeAreaView>
);

const DepositNetworksScreen = () => {
  const params = useLocalSearchParams<{ coin?: string }>();

  const stablecoin = useMemo(
    () => getStablecoinById(Array.isArray(params.coin) ? params.coin[0] : params.coin),
    [params.coin]
  );

  // Since we only support Solana now, automatically redirect to address screen
  React.useEffect(() => {
    if (stablecoin) {
      router.replace({
        pathname: '/deposit/address',
        params: { coin: stablecoin.id },
      });
    }
  }, [stablecoin]);

  if (!stablecoin) {
    return <EmptyState />;
  }

  // Show loading state while redirecting
  return (
    <SafeAreaView className="flex-1 bg-white">
      <DepositScreenHeader
        title={`${stablecoin.name} (${stablecoin.symbol})`}
        subtitle="Solana Network"
      />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-center text-sm text-[#6B7280]">
          Redirecting to Solana deposit address...
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default DepositNetworksScreen;
