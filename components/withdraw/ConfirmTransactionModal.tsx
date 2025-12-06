import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Pressable, Dimensions, ScrollView } from 'react-native';
import { ArrowRight, ChevronRight } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { colors, typography, spacing, borderRadius, animations } from '@/design/tokens';
import { TransactionDetails } from '@/stores/withdrawalStore';

interface ConfirmTransactionModalProps {
  visible: boolean;
  transaction: TransactionDetails | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

// Bottom sheet configuration
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
};

export const ConfirmTransactionModal: React.FC<ConfirmTransactionModalProps> = ({
  visible,
  transaction,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
  const maxSheetHeight = Math.min(screenHeight * 0.75, 640);
  const translateY = useSharedValue(screenHeight);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible && transaction) {
      translateY.value = withSpring(0, SPRING_CONFIG);
      overlayOpacity.value = withTiming(1, { duration: animations.normal });
    }
  }, [visible, transaction]);

  const animateClose = () => {
    translateY.value = withSpring(screenHeight, SPRING_CONFIG, () => {
      runOnJS(onClose)();
    });
    overlayOpacity.value = withTiming(0, { duration: animations.normal });
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 80 || e.velocityY > 800) {
        runOnJS(animateClose)();
      } else {
        translateY.value = withSpring(0, SPRING_CONFIG);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (!transaction || !visible) {
    return null;
  }

  return (
    <Animated.View
      // overlay
      className="absolute inset-0"
      style={[{ backgroundColor: colors.overlay }, overlayStyle]}
    >
      {/* tap outside to close */}
      <Pressable className="flex-1" onPress={animateClose} accessibilityRole="button" accessibilityLabel="Close">
        <GestureDetector gesture={pan}>
          <Animated.View
            // sheet container
            className="w-full"
            style={[
              sheetStyle,
              {
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: colors.background.main,
                borderTopLeftRadius: borderRadius.modal,
                borderTopRightRadius: borderRadius.modal,
                maxHeight: maxSheetHeight,
                // Center on large screens
                width: screenWidth >= 768 ? Math.min(560, screenWidth) : screenWidth,
                alignSelf: 'center',
                // shadow
                ...{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.12,
                  shadowRadius: 12,
                  elevation: 10,
                },
              },
            ]}
          >
            {/* drag handle */}
            <View
              style={{ alignItems: 'center', paddingTop: spacing.md }}
              accessible={false}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: borderRadius.full,
                  backgroundColor: colors.border.secondary,
                }}
              />
            </View>

            {/* Header */}
            <View
              style={{
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.md,
                paddingBottom: spacing.sm,
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: typography.fonts['body-bold'],
                  fontSize: 20,
                  color: colors.text.primary,
                  textAlign: 'center',
                }}
              >
                Confirm Transaction
              </Text>
              <Text
                style={{
                  fontFamily: typography.fonts.body,
                  fontSize: typography.styles.label.size,
                  color: '#6B7280',
                  textAlign: 'center',
                  marginTop: 4,
                  lineHeight: 18,
                }}
              >
                Please review all details carefully, transactions once{'\n'}completed are irreversible.
              </Text>
            </View>

            <ScrollView
              contentContainerStyle={{ paddingBottom: spacing.xl }}
              showsVerticalScrollIndicator={false}
            >
              {/* Amount */}
              <View style={{ alignItems: 'center', paddingBottom: spacing.md, paddingHorizontal: spacing.lg }}>
                <Text
                  style={{
                    fontFamily: typography.fonts['body-bold'],
                    fontSize: 40,
                    color: colors.text.primary,
                    marginBottom: 4,
                  }}
                >
                  {transaction.usdAmount}
                </Text>
                <Text
                  style={{
                    fontFamily: typography.fonts['body-medium'],
                    fontSize: 16,
                    color: '#6B7280',
                  }}
                >
                  {transaction.amount}
                </Text>
              </View>

              {/* Transaction Details */}
              <View style={{ paddingHorizontal: spacing.lg }}>
                {/* From */}
                <View style={{ marginBottom: spacing.md }}>
                  <Text style={{ fontFamily: typography.fonts['body-medium'], fontSize: 12, color: '#6B7280', marginBottom: 8 }}>From</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: typography.fonts['body-medium'], fontSize: 14, color: colors.text.primary }}>
                      {transaction.fromAccount}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                      <View style={{ height: 4, width: 4, borderRadius: 2, backgroundColor: '#6B7280', marginRight: 4 }} />
                      <Text style={{ fontFamily: typography.fonts['body-medium'], fontSize: 11, color: '#6B7280' }}>
                        {transaction.fromAddress}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Receiving Address */}
                <View style={{ marginBottom: spacing.md }}>
                  <Text style={{ fontFamily: typography.fonts['body-medium'], fontSize: 12, color: '#6B7280', marginBottom: 8 }}>Receiving address</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: typography.fonts['body-medium'], fontSize: 14, color: colors.text.primary }}>
                      {transaction.recipientName}
                    </Text>
                    <Text style={{ fontFamily: typography.fonts['body-medium'], fontSize: 11, color: '#6B7280', backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                      {transaction.recipientAddress}
                    </Text>
                  </View>
                </View>

                {/* Token */}
                <View style={{ marginBottom: spacing.md }}>
                  <Text style={{ fontFamily: typography.fonts['body-medium'], fontSize: 12, color: '#6B7280', marginBottom: 8 }}>Token</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: typography.fonts['body-bold'], fontSize: 14, color: colors.text.primary }}>
                      {transaction.amount}
                    </Text>
                    <Text style={{ fontFamily: typography.fonts['body-medium'], fontSize: 12, color: '#6B7280' }}>
                      {transaction.usdAmount}
                    </Text>
                  </View>
                </View>

                {/* Network */}
                <View style={{ marginBottom: spacing.md }}>
                  <Text style={{ fontFamily: typography.fonts['body-medium'], fontSize: 12, color: '#6B7280', marginBottom: 8 }}>Network</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ height: 28, width: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#14F195' }}>
                      <Text style={{ fontFamily: typography.fonts['body-bold'], fontSize: 11, color: colors.text.primary }}>S</Text>
                    </View>
                    <Text style={{ marginLeft: 8, fontFamily: typography.fonts['body-medium'], fontSize: 12, color: colors.text.primary }}>
                      {transaction.fromNetwork.name}
                    </Text>
                    <ArrowRight size={14} color="#6B7280" strokeWidth={2} style={{ marginHorizontal: 8 }} />
                    <View style={{ height: 28, width: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#627EEA' }}>
                      <Text style={{ fontFamily: typography.fonts['body-bold'], fontSize: 11, color: '#FFFFFF' }}>E</Text>
                    </View>
                    <Text style={{ marginLeft: 8, fontFamily: typography.fonts['body-medium'], fontSize: 12, color: colors.text.primary }}>
                      {transaction.toNetwork.name}
                    </Text>
                  </View>
                </View>

                {/* Fee */}
                <View style={{ marginBottom: spacing.md }}>
                  <Text style={{ fontFamily: typography.fonts['body-medium'], fontSize: 12, color: '#6B7280', marginBottom: 8 }}>Fee</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ height: 20, width: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#EF4444', marginRight: 8 }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 10 }}>⛽</Text>
                    </View>
                    <Text style={{ fontFamily: typography.fonts['body-medium'], fontSize: 12, color: colors.text.primary }}>
                      {transaction.fee}
                    </Text>
                  </View>
                </View>

                {/* Bridge Provider */}
                <View style={{ marginBottom: spacing.sm }}>
                  <Text style={{ fontFamily: typography.fonts['body-medium'], fontSize: 12, color: '#6B7280', marginBottom: 8 }}>Bridge provider</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ height: 20, width: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#8B5CF6', marginRight: 8 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 10, fontFamily: typography.fonts['body-bold'] }}>B</Text>
                      </View>
                      <Text style={{ fontFamily: typography.fonts['body-medium'], fontSize: 12, color: colors.text.primary }}>
                        {transaction.bridgeProvider.name}
                      </Text>
                    </View>
                    <ChevronRight size={14} color="#6B7280" strokeWidth={2} />
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Action Button */}
            <View
              style={{
                paddingHorizontal: spacing.lg,
                paddingBottom: spacing.lg,
                paddingTop: spacing.md,
              }}
            >
              <TouchableOpacity
                onPress={onConfirm}
                disabled={isLoading}
                activeOpacity={0.8}
                style={{
                  backgroundColor: colors.text.primary,
                  borderRadius: borderRadius.xxl,
                  paddingVertical: spacing.md,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: colors.text.onPrimary,
                    fontSize: 16,
                    fontFamily: typography.fonts['body-bold'],
                  }}
                >
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

