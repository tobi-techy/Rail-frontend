import React, { useEffect, useRef } from 'react';
import { View, Text, ViewProps, TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useUIStore } from '@/stores';
import { sanitizeNumber } from '@/utils/sanitizeInput';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

export interface BalanceCardProps extends ViewProps {
  balance?: string;
  percentChange?: string;
  timeframe?: string;
  buyingPower?: string;
  className?: string;
}

const CHAR_HEIGHT = 58;

function AnimatedChar({ char, index, small }: { char: string; index: number; small?: boolean }) {
  const translateY = useSharedValue(CHAR_HEIGHT);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const delay = index * 30;
    translateY.value = CHAR_HEIGHT;
    opacity.value = 0;

    const timeout = setTimeout(() => {
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
        mass: 0.8,
      });
      opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });
    }, delay);

    return () => clearTimeout(timeout);
  }, [char]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: interpolate(opacity.value, [0, 1], [0, 1]),
  }));

  return (
    <View style={{ height: CHAR_HEIGHT, overflow: 'hidden', justifyContent: 'flex-end' }}>
      <Animated.Text
        style={animatedStyle}
        className={`font-subtitle text-text-primary ${small ? 'text-[32px]' : 'text-[60px]'}`}>
        {char}
      </Animated.Text>
    </View>
  );
}

function AnimatedBalance({ value, isVisible }: { value: string; isVisible: boolean }) {
  const prevValue = useRef(value);
  const displayValue = isVisible ? value : '$••••';

  useEffect(() => {
    prevValue.current = value;
  }, [value]);

  const dotIndex = displayValue.indexOf('.');

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
      {displayValue.split('').map((char, i) => (
        <AnimatedChar
          key={`${i}-${char}-${value}`}
          char={char}
          index={i}
          small={dotIndex !== -1 && i >= dotIndex}
        />
      ))}
    </View>
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
    if (isBalanceVisible) return sanitizeNumber(String(value));
    return '••••';
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
