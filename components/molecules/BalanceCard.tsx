import React from 'react';
import { View, Text, ViewProps, TouchableOpacity } from 'react-native';
import { useUIStore } from '@/stores';
import { sanitizeNumber } from '@/utils/sanitizeInput';
import { Skeleton } from '@/components/atoms/Skeleton';
import type { Currency } from '@/stores/uiStore';
import { formatCurrencyAmount, convertFromUsd, type FxRates } from '@/utils/currency';
import { EyeIcon, ViewOffIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

export interface BalanceCardProps extends ViewProps {
  balance?: string;
  percentChange?: string;
  timeframe?: string;
  className?: string;
  isLoading?: boolean;
}

function formatBalance(usdValue: number, currency: Currency, rates: FxRates): string {
  const converted = convertFromUsd(usdValue, currency, rates);
  return formatCurrencyAmount(converted, currency);
}

const DIGIT_H = 66; // text-balance-lg is 50px, lineHeight 1.1 = 55px — add 1px buffer

function AnimatedBalance({ value, isVisible }: { value: string; isVisible: boolean }) {
  const display = isVisible ? value : value.replace(/[0-9]/g, '•');

  return (
    <View style={{ maxWidth: '86%', flexDirection: 'row', alignItems: 'flex-end' }}>
      <Text
        style={{
          height: DIGIT_H,
          lineHeight: DIGIT_H,
          fontFamily: 'SFMono-Semibold',
          fontVariant: ['tabular-nums'],
          fontSize: 60,
          letterSpacing: -3.8,
          color: '#070914',
        }}>
        {display}
      </Text>
    </View>
  );
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance = '$0.00',
  percentChange = '0.00%',
  timeframe = '1D',
  className,
  isLoading,
  ...props
}) => {
  const { isBalanceVisible, toggleBalanceVisibility, currency, currencyRates } = useUIStore();
  const isNegative = percentChange.startsWith('-');
  const rawUsd = parseFloat(balance.replace(/[^0-9.-]/g, '')) || 0;
  const dataLoading = isLoading === true;
  const displayBalance = dataLoading ? '---' : formatBalance(rawUsd, currency, currencyRates);

  return (
    <View className={`overflow-hidden ${className || ''}`} {...props}>
      <View className="items-start pb-4 pt-6">
        <Text className="mb-2 font-caption text-caption text-text-secondary">Total balance</Text>

        {dataLoading ? (
          <View className="gap-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-24" />
          </View>
        ) : (
          <>
            <View className="w-full flex-row items-center">
              <AnimatedBalance value={displayBalance} isVisible={isBalanceVisible} />
              <TouchableOpacity
                className="ml-2 shrink-0"
                onPress={toggleBalanceVisibility}
                accessibilityRole="button"
                accessibilityLabel={isBalanceVisible ? 'Hide balance' : 'Show balance'}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                {isBalanceVisible ? (
                  <HugeiconsIcon icon={EyeIcon} size={24} color="#757575" strokeWidth={0.9} />
                ) : (
                  <HugeiconsIcon icon={ViewOffIcon} size={24} color="#757575" strokeWidth={0.9} />
                )}
              </TouchableOpacity>
            </View>

            <Text
              className={`mt-1 font-body text-caption ${isNegative ? 'text-destructive' : 'text-success'}`}>
              {isBalanceVisible ? sanitizeNumber(String(percentChange)) : '••••'}{' '}
              <Text className="text-text-secondary">{timeframe}</Text>
            </Text>
          </>
        )}
      </View>
    </View>
  );
};
