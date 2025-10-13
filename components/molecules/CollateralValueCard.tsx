import React from 'react';
import { View, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../design/tokens';
import { Icon } from '../atoms/Icon';

export interface CollateralValueCardProps extends TouchableOpacityProps {
  assetName: string;
  assetSymbol: string;
  currentValue: number;
  collateralValue: number;
  collateralRatio: number;
  currency?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendPercentage?: number;
  onPress?: () => void;
  className?: string;
  testID?: string;
}

export const CollateralValueCard: React.FC<CollateralValueCardProps> = ({
  assetName,
  assetSymbol,
  currentValue,
  collateralValue,
  collateralRatio,
  currency = 'USD',
  trend = 'neutral',
  trendPercentage,
  onPress,
  className,
  testID,
  style,
  ...props
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'remove';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return colors.semantic.success;
      case 'down':
        return colors.semantic.danger;
      default:
        return colors.text.secondary;
    }
  };

  return (
    <TouchableOpacity
      style={[
        {
          backgroundColor: colors.surface.card,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          ...shadows.sm,
        },
        style,
      ]}
      className={className}
      testID={testID}
      onPress={onPress}
      disabled={!onPress}
      {...props}
    >
      {/* Asset Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <View>
          <Text
            style={[
              {
                fontFamily: typography.fonts.primary,
                fontSize: typography.styles.h3.size,
                fontWeight: typography.styles.h3.weight,
              },
              { color: colors.text.primary }
            ]}
          >
            {assetName}
          </Text>
          <Text
            style={[
              {
                fontFamily: typography.fonts.secondary,
                fontSize: typography.styles.label.size,
                fontWeight: typography.styles.label.weight,
              },
              { color: colors.text.secondary }
            ]}
          >
            {assetSymbol}
          </Text>
        </View>

        {trendPercentage !== undefined && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon
              name={getTrendIcon()}
              library="ionicons"
              size={16}
              color={getTrendColor()}
            />
            <Text
              style={[
                {
                  fontFamily: typography.fonts.secondary,
                  fontSize: typography.styles.caption.size,
                  fontWeight: typography.styles.caption.weight,
                  marginLeft: spacing.xs,
                },
                { color: getTrendColor() }
              ]}
            >
              {formatPercentage(Math.abs(trendPercentage))}
            </Text>
          </View>
        )}
      </View>

      {/* Current Value */}
      <View style={{ marginBottom: spacing.lg }}>
        <Text
          style={[
            {
              fontFamily: typography.fonts.secondary,
              fontSize: typography.styles.caption.size,
              fontWeight: typography.styles.caption.weight,
              marginBottom: spacing.xs,
            },
            { color: colors.text.secondary }
          ]}
        >
          CURRENT VALUE
        </Text>
        <Text
          style={[
            {
              fontFamily: typography.fonts.primary,
              fontSize: typography.styles.h2.size,
              fontWeight: typography.styles.h2.weight,
            },
            { color: colors.text.primary }
          ]}
        >
          {formatCurrency(currentValue)}
        </Text>
      </View>

      {/* Collateral Information */}
      <View style={{ 
        backgroundColor: colors.surface.light, 
        borderRadius: borderRadius.md, 
        padding: spacing.md,
        marginBottom: spacing.md 
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
          <Text
            style={[
              {
                fontFamily: typography.fonts.secondary,
                fontSize: typography.styles.caption.size,
                fontWeight: typography.styles.caption.weight,
              },
              { color: colors.text.secondary }
            ]}
          >
            COLLATERAL VALUE
          </Text>
          <Text
            style={[
              {
                fontFamily: typography.fonts.secondary,
                fontSize: typography.styles.label.size,
                fontWeight: typography.styles.label.weight,
              },
              { color: colors.text.primary }
            ]}
          >
            {formatCurrency(collateralValue)}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text
            style={[
              {
                fontFamily: typography.fonts.secondary,
                fontSize: typography.styles.caption.size,
                fontWeight: typography.styles.caption.weight,
              },
              { color: colors.text.secondary }
            ]}
          >
            COLLATERAL RATIO
          </Text>
          <Text
            style={[
              {
                fontFamily: typography.fonts.secondary,
                fontSize: typography.styles.label.size,
                fontWeight: typography.styles.label.weight,
              },
              { color: colors.primary.lavender }
            ]}
          >
            {formatPercentage(collateralRatio)}
          </Text>
        </View>
      </View>

      {/* Action Indicator */}
      {onPress && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Text
            style={[
              {
                fontFamily: typography.fonts.secondary,
                fontSize: typography.styles.caption.size,
                fontWeight: typography.styles.caption.weight,
              },
              { color: colors.text.secondary }
            ]}
          >
            Tap to view details
          </Text>
          <Icon
            name="chevron-forward"
            library="ionicons"
            size={16}
            color={colors.text.secondary}
            style={{ marginLeft: spacing.xs }}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};