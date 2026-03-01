import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { ArrowRight, ChevronRight } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { haptics } from '@/utils/haptics';
import { TransactionDetails } from '@/stores/withdrawalStore';
import { layout, moderateScale, responsive } from '@/utils/layout';

const ANIMATION_DURATION = 200;
const SPRING_CONFIG = { damping: 20, stiffness: 200 };
const MUTED = '#6B7280';

interface ConfirmTransactionModalProps {
  visible: boolean;
  transaction: TransactionDetails | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const ConfirmTransactionModal: React.FC<ConfirmTransactionModalProps> = ({
  visible,
  transaction,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const maxHeightRatio = layout.isSeekerDevice
    ? 0.8
    : responsive({ default: 0.75, tall: 0.78, android: 0.77 });
  const maxSheetHeight = Math.min(screenHeight * maxHeightRatio, 680);
  const amountFontSize = moderateScale(
    layout.isSeekerDevice ? 34 : responsive({ default: 40, tall: 38, android: 36 }),
    0.45
  );
  const bottomSpacing = layout.isSeekerDevice ? 24 : 32;
  const translateY = useSharedValue(screenHeight);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible && transaction) {
      translateY.value = withSpring(0, SPRING_CONFIG);
      overlayOpacity.value = withTiming(1, { duration: ANIMATION_DURATION });
    }
  }, [visible, transaction]);

  const animateClose = () => {
    translateY.value = withSpring(screenHeight, SPRING_CONFIG, () => runOnJS(onClose)());
    overlayOpacity.value = withTiming(0, { duration: ANIMATION_DURATION });
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 80 || e.velocityY > 800) runOnJS(animateClose)();
      else translateY.value = withSpring(0, SPRING_CONFIG);
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));

  if (!transaction || !visible) return null;

  const Label = ({ children }: { children: string }) => (
    <Text className="mb-2 font-body text-small text-text-secondary">{children}</Text>
  );

  const Pill = ({ children }: { children: string }) => (
    <View className="flex-row items-center rounded-sm bg-surface px-2 py-1">
      <View className="mr-1 h-1 w-1 rounded-full bg-text-secondary" />
      <Text className="font-body text-small text-text-secondary">{children}</Text>
    </View>
  );

  return (
    <Animated.View
      className="absolute inset-0"
      style={[{ backgroundColor: 'rgba(0,0,0,0.7)' }, overlayStyle]}>
      <Pressable
        className="flex-1"
        onPress={animateClose}
        accessibilityRole="button"
        accessibilityLabel="Close">
        <GestureDetector gesture={pan}>
          <Animated.View
            className="absolute bottom-0 left-0 right-0 self-center rounded-t-lg bg-white"
            style={[
              sheetStyle,
              {
                maxHeight: maxSheetHeight,
                width: screenWidth >= 768 ? Math.min(560, screenWidth) : screenWidth,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.12,
                shadowRadius: 12,
                elevation: 10,
              },
            ]}>
            {/* Drag handle */}
            <View className="items-center pt-md">
              <View className="h-1 w-10 rounded-full bg-gray-200" />
            </View>

            {/* Header */}
            <View className="px-lg pb-sm pt-md">
              <Text className="text-center font-headline text-headline-3 text-text-primary">
                Confirm Transaction
              </Text>
              <Text
                className="mt-1 text-center font-body text-caption text-text-secondary"
                style={{ lineHeight: 18 }}>
                Please review all details carefully, transactions once{'\n'}completed are
                irreversible.
              </Text>
            </View>

            <ScrollView
              contentContainerStyle={{ paddingBottom: bottomSpacing }}
              showsVerticalScrollIndicator={false}>
              {/* Amount */}
              <View className="items-center px-lg pb-md">
                <Text
                  className="mb-1 font-headline text-text-primary"
                  style={{ fontSize: amountFontSize, lineHeight: amountFontSize * 1.1 }}>
                  {transaction.usdAmount}
                </Text>
                <Text className="font-subtitle text-body text-text-secondary">
                  {transaction.amount}
                </Text>
              </View>

              <View className="px-lg">
                {/* From */}
                <View className="mb-md">
                  <Label>From</Label>
                  <View className="flex-row items-center justify-between">
                    <Text className="font-subtitle text-caption text-text-primary">
                      {transaction.fromAccount}
                    </Text>
                    <Pill>{transaction.fromAddress}</Pill>
                  </View>
                </View>

                {/* Receiving Address */}
                <View className="mb-md">
                  <Label>Receiving address</Label>
                  <View className="flex-row items-center justify-between">
                    <Text className="font-subtitle text-caption text-text-primary">
                      {transaction.recipientName}
                    </Text>
                    <Text className="rounded-sm bg-surface px-2 py-1 font-body text-small text-text-secondary">
                      {transaction.recipientAddress}
                    </Text>
                  </View>
                </View>

                {/* Token */}
                <View className="mb-md">
                  <Label>Token</Label>
                  <View className="flex-row items-center justify-between">
                    <Text className="font-headline text-caption text-text-primary">
                      {transaction.amount}
                    </Text>
                    <Text className="font-body text-small text-text-secondary">
                      {transaction.usdAmount}
                    </Text>
                  </View>
                </View>

                {/* Network */}
                <View className="mb-md">
                  <Label>Network</Label>
                  <View className="flex-row items-center">
                    <View
                      className="h-7 w-7 items-center justify-center rounded-full"
                      style={{ backgroundColor: '#14F195' }}>
                      <Text className="font-button text-small text-text-primary">S</Text>
                    </View>
                    <Text className="ml-2 font-body text-small text-text-primary">
                      {transaction.fromNetwork.name}
                    </Text>
                    <ArrowRight
                      size={14}
                      color={MUTED}
                      strokeWidth={2}
                      style={{ marginHorizontal: 8 }}
                    />
                    <View
                      className="h-7 w-7 items-center justify-center rounded-full"
                      style={{ backgroundColor: '#627EEA' }}>
                      <Text className="font-button text-small text-white">E</Text>
                    </View>
                    <Text className="ml-2 font-body text-small text-text-primary">
                      {transaction.toNetwork.name}
                    </Text>
                  </View>
                </View>

                {/* Fee */}
                <View className="mb-md">
                  <Label>Fee</Label>
                  <View className="flex-row items-center">
                    <View className="mr-2 h-5 w-5 items-center justify-center rounded-full bg-destructive">
                      <Text className="text-[10px] text-white">⛽</Text>
                    </View>
                    <Text className="font-body text-small text-text-primary">
                      {transaction.fee}
                    </Text>
                  </View>
                </View>

                {/* Bridge Provider */}
                <View className="mb-sm">
                  <Label>Bridge provider</Label>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View
                        className="mr-2 h-5 w-5 items-center justify-center rounded-full"
                        style={{ backgroundColor: '#8B5CF6' }}>
                        <Text className="font-button text-[10px] text-white">B</Text>
                      </View>
                      <Text className="font-body text-small text-text-primary">
                        {transaction.bridgeProvider.name}
                      </Text>
                    </View>
                    <ChevronRight size={14} color={MUTED} strokeWidth={2} />
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Confirm Button */}
            <View className="px-lg pb-lg pt-md">
              <TouchableOpacity
                onPress={() => { haptics.confirm(); onConfirm(); }}
                disabled={isLoading}
                activeOpacity={0.8}
                className="items-center rounded-full bg-black py-md">
                <Text className="font-button text-body text-white">
                  {isLoading ? 'Processing...' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </GestureDetector>
      </Pressable>
    </Animated.View>
  );
};
