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
      translateY.value = withSpring(0, { damping: 20, stiffness: 300, mass: 0.8 });
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
        className={`font-subtitle text-text-primary ${small ? 'text-balance-sm' : 'text-balance-lg'}`}>
        {char}
      </Animated.Text>
    </View>
  );
}

function AnimatedBalance({ value, isVisible }: { value: string; isVisible: boolean }) {
  const displayValue = isVisible ? value : '$••••';
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
  className,
  ...props
}) => {
  const { isBalanceVisible, toggleBalanceVisibility } = useUIStore();
  const isNegative = percentChange.startsWith('-');

  return (
    <View className={`overflow-hidden ${className || ''}`} {...props}>
      <View className="items-start pb-4 pt-6">
        <View className="flex-row items-center gap-x-2">
          <AnimatedBalance value={balance} isVisible={isBalanceVisible} />
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

        <Text
          className={`mt-1 font-body text-caption ${isNegative ? 'text-destructive' : 'text-success'}`}>
          {isBalanceVisible ? sanitizeNumber(String(percentChange)) : '••••'}{' '}
          <Text className="text-text-secondary">{timeframe}</Text>
        </Text>
      </View>
    </View>
  );
};
