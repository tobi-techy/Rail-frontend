import React, { useMemo } from 'react';
import { View, Text, Pressable, StatusBar, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ArrowLeft01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import { ChainLogo } from '@/components/ChainLogo';
import { getWithdrawalChainsForCurrency, type ChainConfig } from '@/utils/chains';
import { useHaptics } from '@/hooks/useHaptics';

/** Estimated arrival time per chain */
const CHAIN_SPEED: Record<string, string> = {
  SOL: '~15 seconds',
  ETH: '~5 minutes',
  BASE: '~1 minute',
  ARB: '~1 minute',
  OP: '~1 minute',
  MATIC: '~2 minutes',
  AVAX: '~2 minutes',
  BSC: '~3 minutes',
  STARKNET: '~5 minutes',
};

function ChainRow({ chain, onPress }: { chain: ChainConfig; onPress: () => void }) {
  const speed = CHAIN_SPEED[chain.chain] ?? '~5 minutes';
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-5 py-4 active:bg-black/[0.03]"
      accessibilityRole="button"
      accessibilityLabel={`Select ${chain.label}`}>
      <View className="mr-4 size-11 items-center justify-center overflow-hidden rounded-full">
        <ChainLogo chain={chain.chain} size={44} />
      </View>
      <View className="flex-1">
        <Text className="font-subtitle text-[16px] text-text-primary">{chain.shortLabel}</Text>
        <Text className="mt-0.5 font-body text-[13px] text-text-secondary">{chain.label}</Text>
      </View>
      <Text className="font-body text-[14px] text-text-secondary">{speed}</Text>
    </Pressable>
  );
}

export default function SelectChainScreen() {
  const { impact } = useHaptics();
  const params = useLocalSearchParams<{ currency?: string }>();
  const currency = params.currency ?? 'USDC';

  const chains = useMemo(() => getWithdrawalChainsForCurrency(currency), [currency]);

  const handleSelect = (chain: ChainConfig) => {
    impact();
    router.push({
      pathname: '/withdraw/enter-address' as never,
      params: { chain: chain.chain, chainLabel: chain.label, currency },
    } as never);
  };

  return (
    <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="flex-row items-center px-5 pb-2 pt-1">
        <Pressable
          className="size-11 items-center justify-center"
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#1C1C1E" />
        </Pressable>
      </View>

      {/* Title */}
      <Animated.View entering={FadeIn.duration(200)} className="px-5 pb-4 pt-4">
        <Text className="font-subtitle text-[30px] text-text-primary">Select network</Text>
      </Animated.View>

      {/* Chain list */}
      <FlatList
        data={chains}
        keyExtractor={(item) => item.chain}
        renderItem={({ item }) => <ChainRow chain={item} onPress={() => handleSelect(item)} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
}
