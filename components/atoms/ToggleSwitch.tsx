import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Animated, ViewStyle } from 'react-native';
import { colors } from '../../design/tokens';

export interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
  style?: ViewStyle;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  value,
  onValueChange,
  size = 'medium',
  disabled = false,
  className,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, animatedValue]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 40, height: 24 },
          thumb: { width: 18, height: 18 },
          translateX: 16,
        };
      case 'medium':
        return {
          container: { width: 48, height: 28 },
          thumb: { width: 22, height: 22 },
          translateX: 20,
        };
      case 'large':
        return {
          container: { width: 56, height: 32 },
          thumb: { width: 26, height: 26 },
          translateX: 24,
        };
      default:
        return {
          container: { width: 48, height: 28 },
          thumb: { width: 22, height: 22 },
          translateX: 20,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const containerStyle: ViewStyle = {
    ...sizeStyles.container,
    backgroundColor: value ? colors.primary.lavender : colors.surface.light,
    borderRadius: sizeStyles.container.height / 2,
    padding: 3,
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
  };

  const thumbStyle = {
    ...sizeStyles.thumb,
    backgroundColor: colors.background.main,
    borderRadius: sizeStyles.thumb.height / 2,
    transform: [
      {
        translateX: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, sizeStyles.translateX],
        }),
      },
    ],
  };

  const combinedStyle = [containerStyle, style];

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      className={className}
      style={combinedStyle}
      testID="toggle-switch"
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
    >
      <Animated.View style={thumbStyle} />
    </TouchableOpacity>
  );
};