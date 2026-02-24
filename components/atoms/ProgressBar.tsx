import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';

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
  backgroundColor = '#F5F5F5',
  progressColor = '#FF2E01',
  className,
  style,
  ...props
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View
      className={className}
      style={[{ height, backgroundColor, borderRadius: 9999, overflow: 'hidden' }, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clampedProgress }}
      {...props}>
      <View
        style={{
          height: '100%',
          width: `${clampedProgress}%`,
          backgroundColor: progressColor,
          borderRadius: 9999,
        }}
      />
    </View>
  );
};
