import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { colors, typography, borderRadius, spacing } from '../../design/tokens';

export interface BadgeProps extends ViewProps {
  variant?: 'default' | 'success' | 'destructive' | 'secondary';
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
  const variantStyles = {
    default: { bg: colors.background.surface, text: colors.text.primary },
    success: { bg: colors.semantic.success, text: '#FFFFFF' },
    destructive: { bg: colors.semantic.destructive, text: '#FFFFFF' },
    secondary: { bg: colors.primary.secondary, text: '#FFFFFF' },
  }[variant];

  const sizeStyles = {
    small: { px: spacing.sm, py: spacing.xs, fontSize: 12 },
    medium: { px: spacing.sm + 2, py: spacing.xs + 1, fontSize: 12 },
    large: { px: spacing.md, py: spacing.sm, fontSize: 14 },
  }[size];

  return (
    <View
      style={[
        {
          backgroundColor: variantStyles.bg,
          borderRadius: borderRadius.full,
          paddingHorizontal: sizeStyles.px,
          paddingVertical: sizeStyles.py,
          alignSelf: 'flex-start',
        },
        style,
      ]}
      className={className}
      {...props}
    >
      <Text
        style={{
          color: variantStyles.text,
          fontSize: sizeStyles.fontSize,
          fontFamily: typography.fonts.caption,
          fontWeight: '500',
          textAlign: 'center',
        }}
      >
        {children}
      </Text>
    </View>
  );
};
