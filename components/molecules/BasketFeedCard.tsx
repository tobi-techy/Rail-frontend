import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import { Card } from '../atoms/Card';
import { Icon } from '../atoms/Icon';
import { Chart } from '../atoms/Chart';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../design/tokens';

export interface BasketFeedCardProps {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  performance: {
    value: number;
    isPositive: boolean;
    chartData: number[];
  };
  stocks: Array<{
    id: string;
    symbol: string;
    logoUrl?: string;
    allocation: number;
  }>;
  onPress: () => void;
  className?: string;
}

export const BasketFeedCard: React.FC<BasketFeedCardProps> = ({
  id,
  name,
  description,
  avatar,
  performance,
  stocks,
  onPress,
  className,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  // The dashboard container has 'px-6' (24px on each side).
  const chartWidth = screenWidth - 24 * 2;
  console.log("stocks", stocks)

  const performanceColor = performance.isPositive
    ? colors.semantic.success
    : colors.semantic.danger;
  const performanceSign = performance.isPositive ? '+' : '';
  const formattedPerformance = Number(performance.value.toFixed(2));

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name} basket. ${description}. Performance: ${performanceSign}${formattedPerformance}%`}
      accessibilityHint="Tap to view basket details"
      className={className}
    >
      <Card
        variant="default"
        padding="none"
        style={[shadows.md, { overflow: 'hidden' }]}
      >
        {/* Header Section (with padding) */}
        <View style={{ padding: spacing.md, paddingBottom: spacing.sm }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: spacing.sm,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.primary.lavender,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.sm,
                ...shadows.sm,
              }}
            >
              {avatar ? (
                <Image
                  source={{ uri: avatar }}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                  accessibilityLabel={`${name} basket icon`}
                />
              ) : (
                <Icon
                  name="package"
                  size={24}
                  color={colors.text.onPrimary}
                  accessibilityLabel=""
                />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: typography.fonts.secondary,
                  fontSize: 18,
                  fontWeight: typography.weights.bold,
                  color: colors.text.primary,
                  marginBottom: 2,
                }}
                numberOfLines={1}
              >
                {name}
              </Text>
              <Text
                style={{
                  fontFamily: typography.fonts.primary,
                  fontSize: 14,
                  color: colors.text.secondary,
                }}
                numberOfLines={2}
              >
                {description}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: performance.isPositive
                  ? `${colors.semantic.success}15`
                  : `${colors.semantic.danger}15`,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: borderRadius.lg,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: typography.fonts.primary,
                  fontSize: 14,
                  fontWeight: typography.weights.bold,
                  color: performanceColor,
                }}
              >
                {performanceSign}
                {formattedPerformance}%
              </Text>
            </View>
          </View>
        </View>

        {/* FIX: The Chart component is now a direct child of the Card,
          and the wrapping View with horizontal padding has been removed.
        */}
        <Chart
          data={performance.chartData.map(value => ({ value }))}
          height={150} // Increased height as requested
          width={chartWidth}
          color={colors.accent.limeGreen}
          startFillColor={colors.accent.limeGreen}
          endFillColor={colors.surface.card}
          type="line"
        />

        {/* Stocks Section (with padding) */}
        <View style={{ padding: spacing.md, paddingTop: spacing.sm }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row' }}>
                {stocks.slice(0, 4).map((stock, index) => (
                  <View
                    key={stock.id}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: colors.surface.card,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: index > 0 ? -8 : 0,
                      borderWidth: 2,
                      borderColor: colors.background.main,
                      ...shadows.sm,
                    }}
                  >
                    {stock.logoUrl ? (
                      <Image
                        source={{ uri: stock.logoUrl }}
                        style={{ width: 24, height: 24, borderRadius: 12 }}
                        accessibilityLabel={`${stock.symbol} stock`}
                      />
                    ) : (
                      <Icon
                        name="trending-up"
                        size={16}
                        color={colors.text.primary}
                        accessibilityLabel={`${stock.symbol} stock icon`}
                      />
                    )}
                  </View>
                ))}
                {stocks.length > 4 && (
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: colors.text.tertiary,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: -8,
                      borderWidth: 2,
                      borderColor: colors.background.main,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: typography.fonts.primary,
                        fontSize: 10,
                        fontWeight: typography.weights.bold,
                        color: colors.text.onPrimary,
                      }}
                    >
                      +{stocks.length - 4}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};
