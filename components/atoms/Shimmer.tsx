/**
 * Shimmer Component
 * Animated skeleton loader for better loading UX
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle, StyleSheet } from 'react-native';

interface ShimmerProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Shimmer: React.FC<ShimmerProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View
      style={[
        styles.container,
        {
          width: typeof width === 'number' ? width : undefined,
          height: typeof height === 'number' ? height : undefined,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            opacity,
            borderRadius,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    width: '100%',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
});

/**
 * QR Code Shimmer Skeleton
 * Simulates QR code pattern while loading
 */
interface QRShimmerProps {
  size: number;
}

export const QRShimmer: React.FC<QRShimmerProps> = ({ size }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.5],
  });

  const gridSize = 8;
  const cellSize = (size - 48) / gridSize - 4;

  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        padding: 20,
        overflow: 'hidden',
      }}
    >
      {[...Array(gridSize)].map((_, rowIndex) => (
        <View
          key={rowIndex}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}
        >
          {[...Array(gridSize)].map((_, colIndex) => {
            // Create QR-like pattern with corner squares
            const isCorner =
              (rowIndex < 3 && colIndex < 3) || // Top-left
              (rowIndex < 3 && colIndex >= gridSize - 3) || // Top-right
              (rowIndex >= gridSize - 3 && colIndex < 3); // Bottom-left

            const shouldShow = isCorner || Math.random() > 0.4;

            return shouldShow ? (
              <Animated.View
                key={colIndex}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: '#9CA3AF',
                  borderRadius: 2,
                  opacity,
                }}
              />
            ) : (
              <View
                key={colIndex}
                style={{
                  width: cellSize,
                  height: cellSize,
                }}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
};
