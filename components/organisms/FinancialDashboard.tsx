import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Card } from '../atoms/Card';
import { Chart, ChartDataPoint } from '../atoms/Chart';
import { Icon } from '../atoms/Icon';
import { colors, typography, spacing } from '../../design/tokens';

export interface FinancialMetric {
  id: string;
  label: string;
  value: string;
  change: number; // percentage change
  icon: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface FinancialDashboardProps {
  totalBalance: string;
  totalGains: string;
  totalGainsPercentage: number;
  metrics: FinancialMetric[];
  chartData?: ChartDataPoint[];
  className?: string;
  testID?: string;
}

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({
  totalBalance,
  totalGains,
  totalGainsPercentage,
  metrics,
  chartData,
  className,
  testID,
}) => {
  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return colors.semantic.success;
      case 'down':
        return colors.semantic.danger;
      default:
        return colors.text.secondary;
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'remove';
    }
  };

  const renderMetric = (metric: FinancialMetric) => (
    <Card key={metric.id} className="p-4 flex-1 mx-1">
      <View className="flex-row items-center justify-between mb-2">
        <Icon
          name={metric.icon}
          library="ionicons"
          size={24}
          color={colors.primary.lavender}
        />
        <Icon
          name={getTrendIcon(metric.trend)}
          library="ionicons"
          size={16}
          color={getTrendColor(metric.trend)}
        />
      </View>

      <Text
        style={{
          fontFamily: typography.fonts.secondary,
          fontSize: typography.styles.caption.size,
          color: colors.text.secondary,
          marginBottom: spacing.xs,
        }}
      >
        {metric.label}
      </Text>

      <Text
        style={{
          fontFamily: typography.fonts.primary,
          fontSize: typography.styles.h3.size,
          fontWeight: typography.weights.bold,
          color: colors.text.primary,
          marginBottom: spacing.xs,
        }}
      >
        {metric.value}
      </Text>

      <View className="flex-row items-center">
        <Text
          style={{
            fontFamily: typography.fonts.secondary,
            fontSize: typography.styles.caption.size,
            fontWeight: typography.weights.medium,
            color: getTrendColor(metric.trend),
          }}
        >
          {metric.change > 0 ? '+' : ''}{metric.change.toFixed(2)}%
        </Text>
      </View>
    </Card>
  );

  return (
    <ScrollView
      className={className}
      testID={testID}
      showsVerticalScrollIndicator={false}
    >
      {/* Total Balance Card */}
      <Card className="p-6 mb-4">
        <Text
          style={{
            fontFamily: typography.fonts.secondary,
            fontSize: typography.styles.body.size,
            color: colors.text.secondary,
            marginBottom: spacing.sm,
          }}
        >
          Total Portfolio Value
        </Text>

        <Text
          style={{
            fontFamily: typography.fonts.primary,
            fontSize: typography.styles.h1.size,
            fontWeight: typography.weights.bold,
            color: colors.text.primary,
            marginBottom: spacing.sm,
          }}
        >
          {totalBalance}
        </Text>

        <View className="flex-row items-center">
          <Icon
            name={totalGainsPercentage >= 0 ? 'trending-up' : 'trending-down'}
            library="ionicons"
            size={16}
            color={totalGainsPercentage >= 0 ? colors.semantic.success : colors.semantic.danger}
          />
          <Text
            className="ml-1"
            style={{
              fontFamily: typography.fonts.secondary,
              fontSize: typography.styles.body.size,
              fontWeight: typography.weights.medium,
              color: totalGainsPercentage >= 0 ? colors.semantic.success : colors.semantic.danger,
            }}
          >
            {totalGains} ({totalGainsPercentage >= 0 ? '+' : ''}{totalGainsPercentage.toFixed(2)}%)
          </Text>
        </View>
      </Card>

      {/* Chart Card */}
      {chartData && (
        <Card className="p-4 mb-4">
          <Text
            style={{
              fontFamily: typography.fonts.primary,
              fontSize: typography.styles.h3.size,
              fontWeight: typography.weights.bold,
              color: colors.text.primary,
              marginBottom: spacing.md,
            }}
          >
            Portfolio Performance
          </Text>

          <Chart
            type="line"
            data={chartData}
            height={200}
            showLabels={true}
          />
        </Card>
      )}

      {/* Metrics Grid */}
      <View className="mb-4">
        <Text
          style={{
            fontFamily: typography.fonts.primary,
            fontSize: typography.styles.h3.size,
            fontWeight: typography.weights.bold,
            color: colors.text.primary,
            marginBottom: spacing.md,
          }}
        >
          Key Metrics
        </Text>

        <View className="flex-row flex-wrap -mx-1">
          {metrics.map(renderMetric)}
        </View>
      </View>

      {/* Quick Actions */}
      <Card className="p-4">
        <Text
          style={{
            fontFamily: typography.fonts.primary,
            fontSize: typography.styles.h3.size,
            fontWeight: typography.weights.bold,
            color: colors.text.primary,
            marginBottom: spacing.md,
          }}
        >
          Quick Actions
        </Text>

        <View className="flex-row justify-around">
          <View className="items-center">
            <View
              className="w-12 h-12 rounded-full items-center justify-center mb-2"
              style={{ backgroundColor: colors.primary.lavender }}
            >
              <Icon
                name="add"
                library="ionicons"
                size={24}
                color={colors.text.onPrimary}
              />
            </View>
            <Text
              style={{
                fontFamily: typography.fonts.secondary,
                fontSize: typography.styles.caption.size,
                color: colors.text.secondary,
                textAlign: 'center',
              }}
            >
              Power Up
            </Text>
          </View>

          <View className="items-center">
            <View
              className="w-12 h-12 rounded-full items-center justify-center mb-2"
              style={{ backgroundColor: colors.accent.limeGreen }}
            >
              <Icon
                name="cash"
                library="ionicons"
                size={24}
                color={colors.text.onPrimary}
              />
            </View>
            <Text
              style={{
                fontFamily: typography.fonts.secondary,
                fontSize: typography.styles.caption.size,
                color: colors.text.secondary,
                textAlign: 'center',
              }}
            >
              Cash Out
            </Text>
          </View>

          <View className="items-center">
            <View
              className="w-12 h-12 rounded-full items-center justify-center mb-2"
              style={{ backgroundColor: colors.text.secondary }}
            >
              <Icon
                name="analytics"
                library="ionicons"
                size={24}
                color={colors.text.onPrimary}
              />
            </View>
            <Text
              style={{
                fontFamily: typography.fonts.secondary,
                fontSize: typography.styles.caption.size,
                color: colors.text.secondary,
                textAlign: 'center',
              }}
            >
              Analytics
            </Text>
          </View>

          <View className="items-center">
            <View
              className="w-12 h-12 rounded-full items-center justify-center mb-2"
              style={{ backgroundColor: colors.text.tertiary }}
            >
              <Icon
                name="settings"
                library="ionicons"
                size={24}
                color={colors.text.onPrimary}
              />
            </View>
            <Text
              style={{
                fontFamily: typography.fonts.secondary,
                fontSize: typography.styles.caption.size,
                color: colors.text.secondary,
                textAlign: 'center',
              }}
            >
              Settings
            </Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
};