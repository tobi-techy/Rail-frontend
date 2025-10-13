import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../design/tokens';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'accent' | 'tertiary' | 'fab';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  className?: string;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  fullWidth = false,
  icon,
  disabled,
  className,
  style,
//   textStyle,
  ...props
}) => {
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary.lavender,
          borderWidth: 1,
          borderColor: colors.primary.lavender,
          ...shadows.md,
        };
      case 'accent':
        return {
          backgroundColor: colors.accent.limeGreen,
          borderWidth: 1,
          borderColor: colors.accent.limeGreen,
          ...shadows.md,
        };
      case 'tertiary':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border.secondary,
        };
      case 'fab':
        return {
          backgroundColor: colors.accent.limeGreen,
          borderWidth: 1,
          borderColor: colors.accent.limeGreen,
          ...shadows.md,
          borderRadius: borderRadius.fab,
          width: 56,
          height: 56,
        };
      default:
        return {
          backgroundColor: colors.primary.lavender,
          borderWidth: 1,
          borderColor: colors.primary.lavender,
          ...shadows.md,
        };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
        return colors.text.onPrimary;
      case 'accent':
        return colors.text.onAccent;
      case 'tertiary':
        return colors.text.primary;
      case 'fab':
        return colors.text.onAccent;
      default:
        return colors.text.onPrimary;
    }
  };

  const getSizeStyles = (): ViewStyle => {
    if (variant === 'fab') return {}; // FAB has fixed size

    switch (size) {
      case 'small':
        return {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          minHeight: 22,
        };
      case 'medium':
        return {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          minHeight: 44,
        };
      case 'large':
        return {
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md + 4,
          minHeight: 52,
        };
      default:
        return {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          minHeight: 44,
        };
    }
  };

  const getTextSize = (): number => {
    switch (size) {
      case 'small':
        return typography.styles.caption.size;
      case 'medium':
        return typography.styles.label.size;
      case 'large':
        return typography.styles.body.size;
      default:
        return typography.styles.label.size;
    }
  };

  const isDisabled = disabled || loading;
  const isFab = variant === 'fab';

  const buttonStyle: ViewStyle = {
    borderRadius: isFab ? borderRadius.fab : borderRadius.lg,
    flexDirection: isFab ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: fullWidth && !isFab ? '100%' : undefined,
    opacity: isDisabled ? 0.5 : 1,
    ...getVariantStyles(),
    ...getSizeStyles(),
    columnGap: 4
  };

  const textStyle: TextStyle = {
    color: getTextColor(),
    fontSize: getTextSize(),
    fontWeight: typography.weights.medium,
    fontFamily: typography.fonts.secondary,
  };

  return (
    <TouchableOpacity
      disabled={isDisabled}
      style={[buttonStyle, style]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      accessibilityLabel={title}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'tertiary' ? colors.primary.lavender : colors.text.onPrimary}
        />
      ) : (
        <>
          {icon && !isFab && icon}
          {isFab ? (
            icon || <Text style={textStyle}>+</Text>
          ) : (
            <Text style={textStyle}>
              {title}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};
