import React from 'react';
import { View, Text, ViewProps, TouchableOpacity } from 'react-native';
import { ChevronDown, Eye, EyeOff } from 'lucide-react-native';
import { useUIStore } from '@/stores';
import { sanitizeNumber } from '@/utils/sanitizeInput';

export interface BalanceCardProps extends ViewProps {
  balance?: string;
  percentChange?: string;
  timeframe?: string;
  buyingPower?: string;
  className?: string;
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
                <Text className="mb-1 font-subtitle text-[40px] text-text-primary">
                  {maskValue(balance)}
                </Text>
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
