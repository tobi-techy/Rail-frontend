import React from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { colors, typography } from '../../design/tokens';

export interface TextLinkProps extends TouchableOpacityProps {
  text: string;
  variant?: 'primary' | 'secondary';
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
  const textColor = disabled
    ? colors.text.secondary
    : variant === 'primary'
      ? colors.primary.accent
      : colors.text.secondary;

  const fontSize = size === 'small' ? 12 : size === 'large' ? 16 : 14;

  return (
    <TouchableOpacity
      disabled={disabled}
      className={className}
      accessibilityRole="link"
      accessibilityLabel={text}
      {...props}
    >
      <Text
        style={{
          color: textColor,
          fontSize,
          fontFamily: typography.fonts.body,
          fontWeight: '500',
          textDecorationLine: underline ? 'underline' : 'none',
        }}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
};
