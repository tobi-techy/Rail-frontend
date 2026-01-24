import React, { useEffect } from 'react';
import { View, Text, ViewProps, TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useUIStore } from '@/stores';
import { sanitizeNumber } from '@/utils/sanitizeInput';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

export interface BalanceCardProps extends ViewProps {
  balance?: string;
  percentChange?: string;
  timeframe?: string;
  buyingPower?: string;
  className?: string;
}

function AnimatedBalance({ value, isVisible }: { value: string; isVisible: boolean }) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(0, { duration: 150, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) })
    );
    translateY.value = withSequence(
      withTiming(-8, { duration: 150, easing: Easing.out(Easing.ease) }),
      withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) })
    );
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const maskValue = (val: string) => {
    const sanitized = sanitizeNumber(String(val));
    if (isVisible) return sanitized;
    return sanitized.replace(/[\d,\.]+/g, (match) => '−'.repeat(Math.min(match.length, 6)));
  };

  const masked = maskValue(value);
  const [whole, decimal] = masked.split('.');

  return (
    <Animated.View style={[{ flexDirection: 'row' }, animatedStyle]}>
      <Text className="font-subtitle text-[50px] text-text-primary">{whole}</Text>
      {decimal !== undefined && (
        <Text className="font-subtitle text-[50px] text-neutral-300">.{decimal}</Text>
      )}
    </Animated.View>
  );
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance = '$0.00',
  percentChange = '0.00%',
  timeframe = '1D',
  buyingPower = '$0.00',
  className,
  ...props
}) => {
  const { isBalanceVisible, toggleBalanceVisibility } = useUIStore();

  const maskValue = (value: string) => {
    const sanitized = sanitizeNumber(String(value));
    if (isBalanceVisible) return sanitized;
    return sanitized.replace(/[\d,\.]+/g, (match) => '−'.repeat(Math.min(match.length, 6)));
  };

  const isNegative = percentChange.startsWith('-');

  return (
    <View className={`overflow-hidden ${className || ''}`} {...props}>
      <View className="pb-4 pt-6">
        <View className="flex-row items-start justify-between">
          <View>
            <View className="mt-2 items-start gap-x-2">
              <Text className="font-caption text-caption text-text-secondary">Total Portfolio</Text>
              <View className="flex-row items-center gap-x-2">
                <View className="mb-1">
                  <AnimatedBalance value={balance} isVisible={isBalanceVisible} />
                </View>
                <TouchableOpacity
                  onPress={toggleBalanceVisibility}
                  accessibilityLabel={isBalanceVisible ? 'Hide balance' : 'Show balance'}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  {isBalanceVisible ? (
                    <Eye size={24} color="#757575" strokeWidth={0.9} />
                  ) : (
                    <EyeOff size={24} color="#757575" strokeWidth={0.9} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row items-center justify-between gap-x-4">
              <View className="flex-row items-center">
                <Text
                  className={`font-body text-body ${isNegative ? 'text-destructive' : 'text-success'}`}>
                  {maskValue(percentChange)}{' '}
                  <Text className="font-subtitle text-caption text-text-secondary">
                    {timeframe}
                  </Text>
                </Text>
              </View>

              <View className="flex-row items-center gap-x-1">
                <Text className="font-body text-caption text-text-secondary">Buying Power:</Text>
                <Text className="font-subtitle text-caption text-text-secondary">
                  {maskValue(buyingPower)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};
