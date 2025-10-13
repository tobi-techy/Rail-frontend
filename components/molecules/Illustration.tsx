import React from 'react';
import { View, ViewProps } from 'react-native';
import { colors, spacing } from '../../design/tokens';

export interface IllustrationProps extends ViewProps {
  type: 'welcome' | 'gift' | 'custom';
  size?: 'small' | 'medium' | 'large';
  children?: React.ReactNode;
  className?: string;
}

export const Illustration: React.FC<IllustrationProps> = ({
  type,
  size = 'medium',
  children,
  className,
  ...props
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: 120,
          height: 120,
        };
      case 'medium':
        return {
          width: 200,
          height: 200,
        };
      case 'large':
        return {
          width: 280,
          height: 280,
        };
      default:
        return {
          width: 200,
          height: 200,
        };
    }
  };

  const getIllustrationContent = () => {
    switch (type) {
      case 'welcome':
        return (
          <View
            testID="illustration-welcome"
            className="items-center justify-center rounded-full"
            style={{
              backgroundColor: colors.surface.light,
              ...getSizeStyles(),
            }}
          >
            {/* Placeholder for welcome illustration */}
            <View
              className="rounded-full"
              style={{
                width: getSizeStyles().width * 0.6,
                height: getSizeStyles().height * 0.6,
                backgroundColor: colors.primary.lavender,
              }}
            />
          </View>
        );
      case 'gift':
        return (
          <View
            testID="illustration-gift"
            className="items-center justify-center rounded-full"
            style={{
              backgroundColor: colors.surface.light,
              ...getSizeStyles(),
            }}
          >
            {/* Placeholder for gift illustration */}
            <View
              className="rounded-lg"
              style={{
                width: getSizeStyles().width * 0.5,
                height: getSizeStyles().height * 0.5,
                backgroundColor: colors.accent.limeGreen,
              }}
            />
          </View>
        );
      case 'custom':
        return children;
      default:
        return (
          <View
            className="items-center justify-center rounded-full"
            style={{
              backgroundColor: colors.surface.light,
              ...getSizeStyles(),
            }}
          />
        );
    }
  };

  return (
    <View
      className={`items-center justify-center ${className || ''}`}
      {...props}
    >
      {getIllustrationContent()}
    </View>
  );
};