import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from '@/utils/platformHaptics';
import { TransactionDetails } from '@/stores/withdrawalStore';
import { ArrowRight01Icon, LinkSquare01Icon } from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';
import { Confetti } from '@/components/atoms/Confetti';

interface TransactionSuccessViewProps {
  transaction: TransactionDetails | null;
}

export const TransactionSuccessView: React.FC<TransactionSuccessViewProps> = ({ transaction }) => {
  const shakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  useEffect(() => {
    // Heavy haptic burst sequence — feels like the phone is celebrating
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 150);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 300);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 450);

    // Shake the screen
    shakeX.value = withDelay(
      50,
      withSequence(
        withTiming(-6, { duration: 40 }),
        withTiming(6, { duration: 40 }),
        withTiming(-5, { duration: 40 }),
        withTiming(5, { duration: 40 }),
        withTiming(-3, { duration: 40 }),
        withTiming(3, { duration: 40 }),
        withTiming(0, { duration: 40 })
      )
    );
  }, []);
  if (!transaction) return null;

  const handleViewOnExplorer = () => {
    const txHash = transaction.txHash;
    // Validate: Solana tx hashes are base58, 87-88 chars
    if (!txHash || !/^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(txHash)) return;
    const explorerUrl = `https://solscan.io/tx/${txHash}`;
    Linking.openURL(explorerUrl).catch(() => {});
  };

  return (
    <View className="flex-1">
      <Confetti count={60} />
      <Animated.View style={[{ flex: 1 }, shakeStyle]}>
        <ScrollView className="flex-1 bg-parchment-card px-6" showsVerticalScrollIndicator={false}>
          {/* View on Explorer Link */}
          <TouchableOpacity
            onPress={handleViewOnExplorer}
            className="mb-4 mt-2 min-h-[44px] flex-row items-center self-end px-2"
            activeOpacity={0.7}
            accessibilityRole="link"
            accessibilityLabel="View transaction on Solscan"
            accessibilityHint="Opens in browser">
            <Text className="mr-1 font-body-medium text-[12px] text-[#9f4fff]">
              View on Solscan
            </Text>
            <HugeiconsIcon icon={LinkSquare01Icon} size={12} color="#9f4fff" strokeWidth={2} />
          </TouchableOpacity>

          {/* Amount & Status */}
          <View className="mb-8 items-center">
            <Text className="mb-2 font-body-bold text-[40px] text-[#0B1120]">
              {transaction.usdAmount}
            </Text>
            <View className="mb-3 flex-row items-center">
              <Text className="mr-3 font-body-medium text-[16px] text-[#848281]">
                {transaction.amount}
              </Text>
              <View className="flex-row items-center rounded-full bg-[#00ca48] px-3 py-1">
                <View className="mr-2 h-2 w-2 rounded-full bg-warm-canvas" />
                <Text className="font-body-bold text-[11px] text-white">Successful</Text>
              </View>
            </View>
          </View>

          {/* Token Transfer Visual */}
          <View className="mb-6 flex-row items-center justify-center">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-[#2775CA]">
              <Text className="text-lg font-bold text-white">$</Text>
            </View>
            <View className="mx-4 flex-row items-center">
              <View className="h-0.5 w-8 bg-[#f2f0ed]" />
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="#848281" className="mx-1" />
              <View className="h-0.5 w-8 bg-[#f2f0ed]" />
            </View>
            <View className="h-12 w-12 items-center justify-center rounded-full bg-[#9f4fff]">
              <Text className="font-semibold text-white">
                {transaction.recipientName.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Transaction Info Card */}
          <View className="mb-6 rounded-3xl bg-[#F8FAFC] p-5">
            {/* Timestamp */}
            {transaction.timestamp && (
              <View className="mb-5">
                <Text className="text-center font-body-medium text-[12px] text-[#848281]">
                  {transaction.timestamp}
                </Text>
              </View>
            )}

            {/* From */}
            <View className="mb-4">
              <Text className="mb-2 font-body-medium text-[12px] text-[#848281]">From</Text>
              <View className="flex-row items-center justify-between">
                <Text className="font-body-medium text-[14px] text-[#0B1120]">
                  {transaction.fromAccount}
                </Text>
                <View className="flex-row items-center rounded-lg bg-parchment-card px-2 py-1">
                  <View className="mr-1 h-1 w-1 rounded-full bg-[#848281]" />
                  <Text className="font-body-medium text-[11px] text-[#848281]">
                    {transaction.fromAddress}
                  </Text>
                </View>
              </View>
            </View>

            {/* Receiving Address */}
            <View className="mb-4">
              <Text className="mb-2 font-body-medium text-[12px] text-[#848281]">
                Receiving address
              </Text>
              <View className="flex-row items-center justify-between">
                <Text className="font-body-medium text-[14px] text-[#0B1120]">
                  {transaction.recipientName}
                </Text>
                <Text className="rounded-lg bg-parchment-card px-2 py-1 font-body-medium text-[11px] text-[#848281]">
                  {transaction.recipientAddress}
                </Text>
              </View>
            </View>

            {/* Token */}
            <View className="mb-4">
              <Text className="mb-2 font-body-medium text-[12px] text-[#848281]">Token</Text>
              <View className="flex-row items-center justify-between">
                <Text className="font-body-bold text-[14px] text-[#0B1120]">
                  {transaction.amount}
                </Text>
                <Text className="font-body-medium text-[12px] text-[#848281]">
                  {transaction.usdAmount}
                </Text>
              </View>
            </View>

            {/* Network */}
            <View className="mb-4">
              <Text className="mb-2 font-body-medium text-[12px] text-[#848281]">Network</Text>
              <View className="flex-row items-center">
                <View className="h-7 w-7 items-center justify-center rounded-full bg-[#14F195]">
                  <Text className="font-body-bold text-[11px] text-[#0B1120]">S</Text>
                </View>
                <Text className="ml-2 font-body-medium text-[12px] text-[#0B1120]">
                  {transaction.fromNetwork.name}
                </Text>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={14}
                  color="#848281"
                  strokeWidth={2}
                  style={{ marginHorizontal: 8 }}
                />
                <View className="h-7 w-7 items-center justify-center rounded-full bg-[#627EEA]">
                  <Text className="font-body-bold text-[11px] text-white">E</Text>
                </View>
                <Text className="ml-2 font-body-medium text-[12px] text-[#0B1120]">
                  {transaction.toNetwork.name}
                </Text>
              </View>
            </View>

            {/* Fee */}
            <View className="mb-4">
              <Text className="mb-2 font-body-medium text-[12px] text-[#848281]">Fee</Text>
              <View className="flex-row items-center">
                <View className="mr-2 h-5 w-5 items-center justify-center rounded-full bg-coral-red/100">
                  <Text className="text-[10px] text-white">Gas</Text>
                </View>
                <Text className="font-body-medium text-[12px] text-[#0B1120]">
                  {transaction.fee}
                </Text>
              </View>
            </View>

            {/* Bridge Provider */}
            <View>
              <Text className="mb-2 font-body-medium text-[12px] text-[#848281]">
                Bridge provider
              </Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="mr-2 h-5 w-5 items-center justify-center rounded-full bg-[#9f4fff]">
                    <Text className="font-body-bold text-[10px] text-white">B</Text>
                  </View>
                  <Text className="font-body-medium text-[12px] text-[#0B1120]">
                    {transaction.bridgeProvider.name}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};
