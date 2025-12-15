import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { colors, borderRadius } from '../../design/tokens';

export interface ProgressBarProps extends ViewProps {
  progress: number;
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  backgroundColor = colors.background.surface,
  progressColor = colors.primary.accent,
  className,
  style,
  ...props
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  const containerStyle: ViewStyle = {
    height,
    backgroundColor,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  };

  const progressStyle: ViewStyle = {
    height: '100%',
    width: `${clampedProgress}%`,
    backgroundColor: progressColor,
    borderRadius: borderRadius.full,
  };

  return (
    <View
      className={className}
      style={[containerStyle, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clampedProgress }}
      {...props}
    >
      <View style={progressStyle} />
    </View>
  );
};
