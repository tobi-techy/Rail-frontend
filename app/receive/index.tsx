import React, { useCallback } from 'react';
import { StatusBar, Text, View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChainLogo } from '@/components/ChainLogo';
import { SUPPORTED_CHAINS, isEVMChain, type ChainConfig } from '@/utils/chains';
import { useHaptics } from '@/hooks/useHaptics';
import type { WalletChain } from '@/api/types';
import { useAnalytics, ANALYTICS_EVENTS } from '@/utils/analytics';
import { ArrowLeft01Icon, ArrowRight01Icon, Add01Icon } from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';

const BRIDGE_CHAINS = SUPPORTED_CHAINS.filter((c) => c.via === 'bridge');

function ChainRow({ config, onPress }: { config: ChainConfig; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-5 py-4"
      accessibilityRole="button"
      accessibilityLabel={`Receive on ${config.label}`}>
      <View className="mr-4 size-11 items-center justify-center overflow-hidden rounded-full">
        <ChainLogo chain={config.chain} size={44} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="font-subtitle text-[16px] text-text-primary">{config.shortLabel}</Text>
          {isEVMChain(config.chain) && (
            <View className="rounded-md bg-stone-surface px-1.5 py-0.5">
              <Text className="font-caption text-[10px] text-text-secondary">EVM</Text>
            </View>
          )}
        </View>
        <Text className="mt-0.5 font-body text-[13px] text-text-secondary">{config.label}</Text>
      </View>
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
      <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />

        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pb-3 pt-1">
          <Pressable
            className="size-11 items-center justify-center rounded-full bg-surface"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#343433" />
          </Pressable>
          <Text className="font-subtitle text-[18px] text-text-primary">Receive USDC</Text>
          <View className="size-11" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 32) }}>
          {/* Promo banner */}
          <Animated.View entering={FadeInUp.duration(280)} className="mx-5 mb-5">
            <Pressable
              onPress={() => {
                selection();
                router.push('/fund-crosschain');
              }}
              className="overflow-hidden rounded-3xl border border-stone-surface"
              style={{ backgroundColor: '#f8f7f4' }}
              accessibilityRole="button">
              {/* Chain icon cluster — decorative top-right */}
              <View className="absolute right-4 top-4 flex-row" style={{ gap: -8 }}>
                {['SOL', 'ETH', 'BASE', 'ARB', 'OP'].map((chain) => (
                  <View
                    key={chain}
                    className="size-9 items-center justify-center rounded-full bg-parchment-card shadow-sm"
                    style={{ borderWidth: 1.5, borderColor: '#f7f2e8' }}>
                    <ChainLogo chain={chain} size={22} />
                  </View>
                ))}
              </View>

              <View className="px-6 pb-5 pt-16">
                <Text className="font-subtitle text-[20px] leading-[26px] text-text-primary">
                  Deposit from{'\n'}any chain
                </Text>
                <Text className="mt-2 font-body text-[13px] text-text-secondary">
                  Bridge from 10+ networks instantly
                </Text>
                <View className="mt-4 flex-row items-center gap-1.5">
                  <Text className="font-subtitle text-[13px]" style={{ color: '#ff3e00' }}>
                    Try it now
                  </Text>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="#ff3e00" />
                </View>
              </View>
            </Pressable>
          </Animated.View>

          {/* Chain list */}
          {BRIDGE_CHAINS.map((config, i) => (
            <Animated.View key={config.chain} entering={FadeInUp.delay(i * 40).duration(280)}>
              <ChainRow config={config} onPress={() => handleChainPress(config.chain)} />
              {i < BRIDGE_CHAINS.length - 1 && <View className="mx-5 h-px bg-stone-surface" />}
            </Animated.View>
          ))}

          {/* Divider */}
          <View className="mx-5 my-2 h-px bg-stone-surface" />

          {/* Other chains row */}
          <Animated.View entering={FadeInUp.delay(BRIDGE_CHAINS.length * 40 + 60).duration(280)}>
            <Pressable
              onPress={() => {
                selection();
                router.push('/fund-crosschain');
              }}
              className="flex-row items-center px-5 py-4"
              accessibilityRole="button"
              accessibilityLabel="Deposit from other chains">
              <View className="mr-4 size-11 items-center justify-center rounded-full bg-stone-surface">
                <HugeiconsIcon icon={Add01Icon} size={22} color="#848281" />
              </View>
              <View className="flex-1">
                <Text className="font-subtitle text-[16px] text-text-primary">Other chains</Text>
                <Text className="mt-0.5 font-body text-[13px] text-text-secondary">
                  BNB, Starknet, Monad & more
                </Text>
              </View>
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#848281" />
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}
