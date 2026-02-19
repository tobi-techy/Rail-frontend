import React from 'react';
import { StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BankIcon, CoinIcon } from '@/assets/svg/filled';
import { useKycGate } from '@/hooks/useKycGate';

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
  return (
    <TouchableOpacity
      className="rounded-3xl bg-surface px-5 py-5"
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}>
      <View className="mb-4 size-12 items-center justify-center rounded-2xl bg-white">{icon}</View>
      <Text className="font-subtitle text-[20px] text-text-primary">{title}</Text>
      <Text className="mt-1 font-body text-[14px] text-text-secondary">{subtitle}</Text>
    </TouchableOpacity>
  );
}

export default function WithdrawMethodSelectorScreen() {
  const { requireKyc } = useKycGate();

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />

        <View className="flex-1 px-5">
          <View className="flex-row items-center pb-2 pt-1">
            <TouchableOpacity
              className="size-11 items-center justify-center rounded-full bg-surface"
              onPress={() => router.back()}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back">
              <ArrowLeft size={20} color="#111827" />
            </TouchableOpacity>
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
              onPress={() => requireKyc(() => router.push('/withdraw/fiat' as any))}
              icon={<BankIcon width={24} height={24} />}
              accessibilityLabel="Select fiat withdrawal"
            />

            <WithdrawOptionCard
              title="Crypto"
              subtitle="Withdraw to an external wallet address"
              onPress={() => router.push('/withdraw/crypto' as any)}
              icon={<CoinIcon width={24} height={24} />}
              accessibilityLabel="Select crypto withdrawal"
            />
          </View>
        </View>
      </SafeAreaView>
    </ErrorBoundary>
  );
}
