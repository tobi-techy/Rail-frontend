import React from 'react';
import { View, Text, ViewProps, TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useUIStore } from '@/stores';
import { sanitizeNumber } from '@/utils/sanitizeInput';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { Currency } from '@/stores/uiStore';
import { formatCurrencyAmount, convertFromUsd, type FxRates } from '@/utils/currency';

export interface BalanceCardProps extends ViewProps {
  balance?: string;
  percentChange?: string;
  timeframe?: string;
  className?: string;
}

function formatBalance(usdValue: number, currency: Currency, rates: FxRates): string {
  const converted = convertFromUsd(usdValue, currency, rates);
  return formatCurrencyAmount(converted, currency);
}

function AnimatedBalance({ value, isVisible }: { value: string; isVisible: boolean }) {
  const opacity = useSharedValue(1);
  const displayValue = isVisible ? value : '****';

  React.useEffect(() => {
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: 140, easing: Easing.out(Easing.ease) });
  }, [displayValue, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, { maxWidth: '86%' }]} className="min-w-0">
      <Animated.Text
        className="font-subtitle text-balance-lg text-text-primary"
        style={{ fontVariant: ['tabular-nums'] }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.58}
        ellipsizeMode="tail">
        {displayValue}
      </Animated.Text>
    </Animated.View>
  );
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance = '$0.00',
  percentChange = '0.00%',
  timeframe = '1D',
  className,
  ...props
}) => {
  const { isBalanceVisible, toggleBalanceVisibility, currency, currencyRates } = useUIStore();
  const isNegative = percentChange.startsWith('-');
  const rawUsd = parseFloat(balance.replace(/[^0-9.-]/g, '')) || 0;
  const isLoading = rawUsd === 0 && percentChange === '0.00%';
  const displayBalance = isLoading ? '---' : formatBalance(rawUsd, currency, currencyRates);

  return (
    <View className={`overflow-hidden ${className || ''}`} {...props}>
      <View className="items-start pb-4 pt-6">
        <Text className="mb-2 font-caption text-caption text-text-secondary">Total balance</Text>

        <View className="w-full flex-row items-center">
          <AnimatedBalance value={displayBalance} isVisible={isBalanceVisible} />
          <TouchableOpacity
            className="ml-2 shrink-0"
            onPress={toggleBalanceVisibility}
            accessibilityRole="button"
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
          {isBalanceVisible ? (isLoading ? '---' : sanitizeNumber(String(percentChange))) : '••••'}{' '}
          <Text className="text-text-secondary">{timeframe}</Text>
        </Text>
      </View>
    </View>
  );
};
