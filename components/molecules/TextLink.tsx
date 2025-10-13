import React from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { colors, typography } from '../../design/tokens';

export interface TextLinkProps extends TouchableOpacityProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'small' | 'medium' | 'large';
  underline?: boolean;
  className?: string;
}

export const TextLink: React.FC<TextLinkProps> = ({
  text,
  variant = 'primary',
  size = 'medium',
  underline = false,
  className,
  disabled,
  ...props
}) => {
  const getVariantColor = () => {
    switch (variant) {
      case 'primary':
        return colors.primary.lavender;
      case 'secondary':
        return colors.text.secondary;
      case 'accent':
        return colors.accent.limeGreen;
      default:
        return colors.primary.lavender;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          fontSize: typography.styles.caption.size,
          fontFamily: typography.fonts.secondary,
        };
      case 'medium':
        return {
          fontSize: typography.styles.label.size,
          fontFamily: typography.fonts.secondary,
        };
      case 'large':
        return {
          fontSize: typography.styles.body.size,
          fontFamily: typography.fonts.secondary,
        };
      default:
        return {
          fontSize: typography.styles.label.size,
          fontFamily: typography.fonts.secondary,
        };
    }
  };

  const textColor = disabled ? colors.text.tertiary : getVariantColor();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      disabled={disabled}
      className={`${className || ''}`}
      accessibilityRole="link"
      accessibilityLabel={text}
      {...props}
    >
      <Text
        style={{
          color: textColor,
          fontSize: sizeStyles.fontSize,
          fontFamily: sizeStyles.fontFamily,
          fontWeight: typography.weights.medium,
          textDecorationLine: underline ? 'underline' : 'none',
        }}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
};