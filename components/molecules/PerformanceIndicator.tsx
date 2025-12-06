import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { Icon } from '../atoms/Icon';
import { colors, typography, spacing } from '../../design/tokens';

export interface PerformanceIndicatorProps extends ViewProps {
  returnPercentage: number;
  showIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const PerformanceIndicator: React.FC<PerformanceIndicatorProps> = ({
  returnPercentage,
  showIcon = true,
  size = 'medium',
  className,
  style,
  ...props
}) => {
  const isPositive = returnPercentage >= 0;
  const isNeutral = returnPercentage === 0;
  
  const getColor = () => {
    if (isNeutral) return colors.text.secondary;
    return isPositive ? colors.semantic.success : colors.semantic.danger;
  };

  const getIconName = () => {
    if (isNeutral) return 'remove-outline';
    return isPositive ? 'trending-up-outline' : 'trending-down-outline';
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          fontSize: typography.styles.caption.size,
          iconSize: 12,
        };
      case 'large':
        return {
          fontSize: typography.styles.body.size,
          iconSize: 20,
        };
      default: // medium
        return {
          fontSize: typography.styles.label.size,
          iconSize: 16,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const color = getColor();

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
        style,
      ]}
      className={className}
      {...props}
    >
      {showIcon && (
        <Icon
          name={getIconName()}
          library="ionicons"
          size={sizeStyles.iconSize}
          color={color}
        />
      )}
      <Text
        style={{
          color,
          fontSize: sizeStyles.fontSize,
          fontFamily: typography.fonts.secondary,
          fontWeight: typography.weights.medium,
        }}
      >
        {isPositive && '+'}
        {returnPercentage.toFixed(2)}%
      </Text>
    </View>
  );
};