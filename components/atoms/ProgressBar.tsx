import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { colors, borderRadius } from '../../design/tokens';

export interface ProgressBarProps extends ViewProps {
  progress: number; // 0-100
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  className?: string;
  color?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  backgroundColor = colors.surface.light, // #EAE2FF from design.json
  progressColor = colors.primary.lavender, // Updated to use new color palette
  className,
  style,
  color,
  ...props
}) => {
  // Clamp progress between 0 and 100
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

  const combinedStyle = [containerStyle, style];

  return (
    <View
      className={className}
      style={combinedStyle}
      testID="progress-bar"
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: clampedProgress,
        text: `${clampedProgress}% complete`
      }}
      {...props}
    >
      <View style={progressStyle} />
    </View>
  );
};
