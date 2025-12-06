import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { colors, typography, borderRadius, spacing } from '../../design/tokens';

export interface BadgeProps extends ViewProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'low' | 'medium' | 'high';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'medium',
  children,
  className,
  style,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: colors.semantic.success,
          color: colors.text.onPrimary,
        };
      case 'warning':
        return {
          backgroundColor: colors.semantic.warning,
          color: colors.text.onAccent,
        };
      case 'danger':
        return {
          backgroundColor: colors.semantic.danger,
          color: colors.text.onPrimary,
        };
      case 'low':
        return {
          backgroundColor: colors.semantic.success,
          color: colors.text.onPrimary,
        };
      case 'medium':
        return {
          backgroundColor: colors.semantic.warning,
          color: colors.text.onAccent,
        };
      case 'high':
        return {
          backgroundColor: colors.semantic.danger,
          color: colors.text.onPrimary,
        };
      default:
        return {
          backgroundColor: colors.surface.light,
          color: colors.text.primary,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          fontSize: typography.styles.caption.size,
        };
      case 'large':
        return {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          fontSize: typography.styles.body.size,
        };
      default: // medium
        return {
          paddingHorizontal: spacing.sm + 2,
          paddingVertical: spacing.xs + 1,
          fontSize: typography.styles.label.size,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        {
          backgroundColor: variantStyles.backgroundColor,
          borderRadius: borderRadius.full,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          alignSelf: 'flex-start',
        },
        style,
      ]}
      className={className}
      {...props}
    >
      <Text
        style={{
          color: variantStyles.color,
          fontSize: sizeStyles.fontSize,
          fontFamily: typography.fonts.secondary,
          fontWeight: typography.weights.medium,
          textAlign: 'center',
        }}
      >
        {children}
      </Text>
    </View>
  );
};