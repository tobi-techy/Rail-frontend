import React, { useCallback } from 'react';
import { StatusBar, Text, View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChainLogo } from '@/components/ChainLogo';
import { SUPPORTED_CHAINS, type ChainConfig } from '@/utils/chains';
import { useHaptics } from '@/hooks/useHaptics';
import type { WalletChain } from '@/api/types';
import { useAnalytics, ANALYTICS_EVENTS } from '@/utils/analytics';
import { ArrowLeft01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';

const ARRIVAL_TIMES: Record<string, string> = {
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

function ChainRow({ config, onPress }: { config: ChainConfig; onPress: () => void }) {
  const arrivalTime = ARRIVAL_TIMES[config.chain] ?? '';
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-5 py-4 active:scale-[0.96]"
      accessibilityRole="button"
      accessibilityLabel={`Receive on ${config.label}`}>
      <View
        className="mr-4 size-11 items-center justify-center overflow-hidden rounded-full"
        style={{ borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)' }}>
        <ChainLogo chain={config.chain} size={44} />
      </View>
      <View className="flex-1">
        <Text className="font-subtitle text-[16px] text-text-primary">{config.shortLabel}</Text>
        <Text className="mt-0.5 font-body text-[13px] text-text-secondary">{config.label}</Text>
      </View>
      {arrivalTime ? (
        <Text
          className="font-body text-[14px] text-text-secondary"
          style={{ fontVariant: ['tabular-nums'] }}>
          {arrivalTime}
        </Text>
      ) : null}
    </Pressable>
  );
}

export default function ReceiveChainSelectScreen() {
  const insets = useSafeAreaInsets();
  const { selection } = useHaptics();
  const { track } = useAnalytics();

  const handleChainPress = useCallback(
    (chain: WalletChain) => {
      selection();
      track(ANALYTICS_EVENTS.DEPOSIT_INITIATED, { chain });
      router.push({ pathname: '/receive/address', params: { chain } });
    },
    [selection, track]
  );

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 32) }}>
          {/* Back button */}
          <Animated.View entering={FadeInUp.duration(220)} className="px-5 pt-2">
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={12}
              className="active:opacity-70">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#343433" />
            </Pressable>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInUp.delay(60).duration(250)} className="mb-6 mt-6 px-5">
            <Text className="font-heading text-[32px] leading-[38px] text-[#1a1a1a]">
              Select network
            </Text>
          </Animated.View>

          {/* Chain list */}
          {SUPPORTED_CHAINS.map((config, i) => (
            <Animated.View key={config.chain} entering={FadeInUp.delay(100 + i * 35).duration(260)}>
              <ChainRow config={config} onPress={() => handleChainPress(config.chain)} />
              {i < SUPPORTED_CHAINS.length - 1 && <View className="mx-5 h-px bg-[#f0ece4]" />}
            </Animated.View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}
