import React, { useState, useCallback } from 'react';
import { StatusBar, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeInUp } from 'react-native-reanimated';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CryptoReceiveSheet } from '@/components/sheets';
import { SolanaIcon, MaticIcon, AvalancheIcon, UsdcIcon } from '@/assets/svg';
import { SUPPORTED_CHAINS, type ChainConfig } from '@/utils/chains';
import { useHaptics } from '@/hooks/useHaptics';
import type { WalletChain } from '@/api/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CHAIN_ICONS: Record<string, React.ComponentType<any>> = {
  'SOL-DEVNET': SolanaIcon,
  'MATIC-AMOY': MaticIcon,
  'AVAX-FUJI': AvalancheIcon,
};

function ChainCard({ config, onPress }: { config: ChainConfig; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const Icon = CHAIN_ICONS[config.chain];

  return (
    <AnimatedPressable
      style={animStyle}
      className="flex-row items-center rounded-3xl bg-surface px-5 py-4 gap-4"
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 20, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 20, stiffness: 300 }); }}
      accessibilityRole="button"
      accessibilityLabel={`Receive on ${config.label}`}>
      {/* Chain icon with USDC badge */}
      <View className="relative size-14 items-center justify-center">
        <View
          className="size-14 items-center justify-center rounded-full"
          style={{ backgroundColor: config.color + '18' }}>
          {Icon && <Icon width={32} height={32} />}
        </View>
        <View className="absolute -bottom-1 -right-1 size-6 items-center justify-center rounded-full bg-white shadow-sm">
          <UsdcIcon width={18} height={18} />
        </View>
      </View>

      <View className="flex-1">
        <Text className="font-subtitle text-[18px] text-text-primary">{config.label}</Text>
        <Text className="mt-0.5 font-body text-[13px] text-text-secondary">
          USDC · {config.shortLabel}
        </Text>
      </View>

      <View
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: config.color }}
      />
    </AnimatedPressable>
  );
}

export default function ReceiveChainSelectScreen() {
  const [selectedChain, setSelectedChain] = useState<WalletChain | null>(null);
  const { selection } = useHaptics();

  const handleChainPress = useCallback((chain: WalletChain) => {
    selection();
    setSelectedChain(chain);
  }, [selection]);

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />

        <View className="flex-1 px-5">
          <View className="flex-row items-center pb-2 pt-1">
            <Pressable
              className="size-11 items-center justify-center rounded-full bg-surface"
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back">
              <ArrowLeft size={20} color="#111827" />
            </Pressable>
          </View>

          <View className="mt-4">
            <Text className="font-subtitle text-[32px] text-text-primary">Receive USDC</Text>
            <Text className="mt-2 font-body text-[14px] text-text-secondary">
              Pick the network you want to receive on.
            </Text>
          </View>

          <View className="mt-8 gap-3">
            {SUPPORTED_CHAINS.map((config, i) => (
              <Animated.View key={config.chain} entering={FadeInUp.delay(i * 60).duration(350)}>
                <ChainCard config={config} onPress={() => handleChainPress(config.chain)} />
              </Animated.View>
            ))}
          </View>
        </View>

        <CryptoReceiveSheet
          visible={selectedChain !== null}
          chain={selectedChain ?? 'SOL-DEVNET'}
          onClose={() => setSelectedChain(null)}
        />
      </SafeAreaView>
    </ErrorBoundary>
  );
}
