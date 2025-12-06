import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';

import DepositScreenHeader from '@/components/deposit/ScreenHeader';
import { STABLECOIN_OPTIONS } from '@/constants/depositOptions';
import { breakpoints } from '@/design/tokens';

const StablecoinRow = ({
  id,
  symbol,
  name,
  description,
  icon: Icon,
  isCompact,
}: typeof STABLECOIN_OPTIONS[number] & { isCompact: boolean }) => {
  const cardPadding = isCompact ? 16 : 20;
  const cardRadius = isCompact ? 24 : 28;
  const iconWrapperSize = isCompact ? 44 : 48;
  const iconSize = isCompact ? 28 : 32;
  const titleSize = isCompact ? 15 : 16;
  const descriptionSize = isCompact ? 12 : 13;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      className="flex-row items-center justify-between bg-[#F5F7FB]"
      style={{
        borderRadius: cardRadius,
        paddingHorizontal: cardPadding,
        paddingVertical: cardPadding,
      }}
      onPress={() =>
        router.push({
          pathname: '/deposit/network',
          params: { coin: id },
        })
      }
    >
      <View className="flex-row items-center">
        <View
          className="items-center justify-center rounded-full bg-white"
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
            {name} ({symbol})
          </Text>
          <Text
            className="mt-1 text-[#6B7280]"
            style={{ fontSize: descriptionSize }}
          >
            {description}
          </Text>
        </View>
      </View>
      <ChevronRight size={isCompact ? 18 : 20} color="#9CA3AF" strokeWidth={1.5} />
    </TouchableOpacity>
  );
};

const DepositLandingScreen = () => {
  const { width } = useWindowDimensions();
  const isCompact = width <= breakpoints.sm;
  const isCondensed = width <= breakpoints.md;
  const containerPadding = isCompact ? 20 : 24;
  const listTopMargin = isCompact ? 4 : 8;
  const listBottomPadding = isCompact ? 24 : 32;
  const listGap = isCompact ? 12 : 16;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <DepositScreenHeader
        title="Digital Dollars"
        subtitle="Select preferred digital dollar"
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: containerPadding,
          paddingBottom: listBottomPadding,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            marginTop: listTopMargin,
            gap: listGap,
          }}
        >
          {STABLECOIN_OPTIONS.map((option) => (
            <StablecoinRow key={option.id} {...option} isCompact={isCondensed} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DepositLandingScreen;
