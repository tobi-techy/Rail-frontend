import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewProps } from 'react-native';
import { colors, borderRadius, spacing } from '../../design/tokens';

export interface LoadingSkeletonProps extends ViewProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius: borderRadiusProp = borderRadius.md,
  className,
  style,
  ...props
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surface.card, colors.surface.light],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: borderRadiusProp,
          backgroundColor,
        } as any,
        style,
      ]}
      className={className}
      {...props}
    />
  );
};

// Preset skeleton components for common use cases
export const BasketCardSkeleton: React.FC<ViewProps> = ({ style, ...props }) => {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface.card,
          borderRadius: borderRadius.xxl,
          padding: spacing.lg,
        },
        style,
      ]}
      {...props}
    >
      {/* Header Row */}
      <View style={{ flexDirection: 'row', marginBottom: spacing.md }}>
        {/* Icon */}
        <LoadingSkeleton
          width={48}
          height={48}
          borderRadius={24}
          style={{ marginRight: spacing.md }}
        />
        
        {/* Title and Badge */}
        <View style={{ flex: 1 }}>
          <LoadingSkeleton
            width="60%"
            height={18}
            style={{ marginBottom: spacing.xs }}
          />
          <LoadingSkeleton
            width="40%"
            height={14}
          />
        </View>

        {/* Performance */}
        <LoadingSkeleton
          width={60}
          height={16}
        />
      </View>

      {/* Description */}
      <LoadingSkeleton
        width="100%"
        height={16}
        style={{ marginBottom: spacing.xs }}
      />
      <LoadingSkeleton
        width="80%"
        height={16}
        style={{ marginBottom: spacing.md }}
      />

      {/* Footer */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <LoadingSkeleton
            width={80}
            height={12}
            style={{ marginBottom: spacing.xs }}
          />
          <LoadingSkeleton
            width={60}
            height={14}
          />
        </View>
        <LoadingSkeleton
          width={20}
          height={20}
          borderRadius={10}
        />
      </View>
    </View>
  );
};