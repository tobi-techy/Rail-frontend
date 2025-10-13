import React from 'react';
import {
  View,
  Text,
  ViewProps,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Card } from '../atoms/Card';
import { colors, typography, spacing } from '../../design/tokens';
import { Chart, ChartDataPoint } from '../atoms/Chart';
import { Icon } from '../atoms/Icon';

export interface BalanceCardProps extends ViewProps {
  balance: string;
  currency?: string;
  onPress?: () => void;
  className?: string;
  chartData: ChartDataPoint[];
  performanceText: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  currency = 'USD',
  onPress,
  className,
  chartData,
  performanceText,
  ...props
}) => {
  const { width: screenWidth } = useWindowDimensions();
  // Calculate chart width to be the full width of the card, accounting for screen padding.
  const chartWidth = screenWidth - 28; // Screen width minus the horizontal margin of the card.

  return (
    <Card
      variant="default"
      padding="none" // Remove default padding from the card
      className={`${className || ''}`}
      {...props}
      style={{
        backgroundColor: colors.primary.lavender,
        overflow: 'hidden', // Add overflow hidden to contain the chart
      }}
    >
      {/* Top Content with Padding */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
        <View className="mb-2">
          <Text className="font-heading text-body-sm text-text-on-primary uppercase">
            Portfolio Value
          </Text>
        </View>

        <View className="mb-3">
          <Text className="font-body-bold text-heading-lg text-text-on-primary">
            {balance}
          </Text>
          <View className="flex-row items-center gap-x-2 mt-1">
            <Icon
              library="feather"
              name="eye"
              size={16}
              color={colors.text.onPrimary}
            />
            <Text className="font-heading text-body-sm text-text-on-primary">
              {currency} Balance
            </Text>
          </View>
        </View>
      </View>

      {/* Full Width Chart Section (No Padding) */}
      <Chart
        data={chartData}
        type="line"
        height={190}
        width={chartWidth}
        color={colors.accent.limeGreen} // This is the vibrant "blow-like" green line color
        startFillColor={colors.primary.lavender} // The gradient starts with the same vibrant green
        endFillColor={colors.primary.lavender} //
      />

      {/* Bottom Content with Padding */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.lg,
          paddingTop: spacing.sm,
        }}
      >
        <View className="flex-row items-center justify-between mt-2">
          <View className="flex-row items-center gap-x-1">
            <Icon
              library="feather"
              name="trending-up"
              size={14}
              color={colors.accent.limeGreen}
            />
            <Text className="font-heading text-body-sm text-accent">
              {performanceText}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onPress}
            className="flex-row items-center gap-x-1"
          >
            <Text className="font-heading text-body-sm text-text-on-primary">
              View Portfolio
            </Text>
            <Icon
              library="feather"
              name="chevron-right"
              size={14}
              color={colors.text.onPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
};
