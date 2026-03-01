import React, { useState } from 'react';
import { StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BankIcon, CoinIcon } from '@/assets/svg/filled';
import { useKycGate } from '@/hooks/useKycGate';
import { useKYCStatus } from '@/api/hooks';
import { KYCVerificationSheet } from '@/components/sheets';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function WithdrawOptionCard({
  title,
  subtitle,
  onPress,
  icon,
  accessibilityLabel,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
  icon: React.ReactNode;
  accessibilityLabel: string;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      style={animStyle}
      className="rounded-3xl bg-surface px-5 py-5"
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 20, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 20, stiffness: 300 }); }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}>
      <View className="mb-4 size-12 items-center justify-center rounded-2xl bg-white">{icon}</View>
      <Text className="font-subtitle text-[20px] text-text-primary">{title}</Text>
      <Text className="mt-1 font-body text-[14px] text-text-secondary">{subtitle}</Text>
    </AnimatedPressable>
  );
}

export default function WithdrawMethodSelectorScreen() {
  const [showKYCSheet, setShowKYCSheet] = useState(false);
  const { requireKyc } = useKycGate();
  const { data: kycStatus } = useKYCStatus();

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
            <Text className="font-subtitle text-[32px] text-text-primary">Withdraw funds</Text>
            <Text className="mt-2 font-body text-[14px] text-text-secondary">
              Choose how you want to move money out of your station.
            </Text>
          </View>

          <View className="mt-8 gap-4">
            <WithdrawOptionCard
              title="Fiat"
              subtitle="Withdraw to US bank account via routing details"
              onPress={() =>
                requireKyc(
                  () => router.push('/withdraw/fiat' as never),
                  () => setShowKYCSheet(true)
                )
              }
              icon={<BankIcon width={24} height={24} />}
              accessibilityLabel="Select fiat withdrawal"
            />

            <WithdrawOptionCard
              title="Crypto"
              subtitle="Withdraw to an external wallet address"
              onPress={() => router.push('/withdraw/crypto' as never)}
              icon={<CoinIcon width={24} height={24} />}
              accessibilityLabel="Select crypto withdrawal"
            />
          </View>
        </View>

        <KYCVerificationSheet
          visible={showKYCSheet}
          onClose={() => setShowKYCSheet(false)}
          kycStatus={kycStatus}
        />
      </SafeAreaView>
    </ErrorBoundary>
  );
}
