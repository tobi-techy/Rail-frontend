import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { Icon } from './Icon';
import { colors, typography, spacing } from '../../design/tokens';

export interface RewardClaimAnimationProps {
  isVisible: boolean;
  rewardText: string;
  rewardIcon?: string;
  onAnimationComplete?: () => void;
  className?: string;
  testID?: string;
}

export const RewardClaimAnimation: React.FC<RewardClaimAnimationProps> = ({
  isVisible,
  rewardText,
  rewardIcon = 'gift',
  onAnimationComplete,
  className,
  testID,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  const [showSparkles, setShowSparkles] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowSparkles(true);
      
      // Main entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Rotation animation
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Sparkle animation
      Animated.loop(
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        hideAnimation();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const hideAnimation = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: -50,
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSparkles(false);
      onAnimationComplete?.();
    });
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sparkleRotate = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!isVisible) return null;

  return (
    <View
      className={`absolute inset-0 items-center justify-center z-50 ${className || ''}`}
      testID={testID}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      }}
    >
      {/* Sparkle Effects */}
      {showSparkles && (
        <>
          {[...Array(8)].map((_, index) => {
            const angle = (index * 45) * Math.PI / 180;
            const radius = 80;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            return (
              <Animated.View
                key={index}
                className="absolute"
                style={{
                  transform: [
                    { translateX: x },
                    { translateY: y },
                    { rotate: sparkleRotate },
                    { scale: sparkleAnim },
                  ],
                  opacity: sparkleAnim,
                }}
              >
                <Icon
                  name="sparkles"
                  library="ionicons"
                  size={16}
                  color={colors.accent.limeGreen}
                />
              </Animated.View>
            );
          })}
        </>
      )}

      {/* Main Reward Container */}
      <Animated.View
        className="items-center justify-center p-8 rounded-3xl"
        style={{
          backgroundColor: colors.surface.card,
          borderWidth: 2,
          borderColor: colors.accent.limeGreen,
          transform: [
            { scale: Animated.multiply(scaleAnim, pulseAnim) },
            { translateY: translateYAnim },
          ],
          opacity: opacityAnim,
          shadowColor: colors.accent.limeGreen,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 20,
          elevation: 10,
        }}
      >
        {/* Reward Icon */}
        <Animated.View
          className="mb-4 p-4 rounded-full"
          style={{
            backgroundColor: colors.accent.limeGreen,
            transform: [{ rotate: rotateInterpolate }],
          }}
        >
          <Icon
            name={rewardIcon}
            library="ionicons"
            size={48}
            color={colors.text.onPrimary}
          />
        </Animated.View>

        {/* Success Text */}
        <Text
          style={{
            fontFamily: typography.fonts.primary,
            fontSize: typography.styles.h2.size,
            fontWeight: typography.weights.bold,
            color: colors.accent.limeGreen,
            textAlign: 'center',
            marginBottom: spacing.sm,
          }}
        >
          Reward Claimed!
        </Text>

        {/* Reward Description */}
        <Text
          style={{
            fontFamily: typography.fonts.secondary,
            fontSize: typography.styles.body.size,
            color: colors.text.primary,
            textAlign: 'center',
            maxWidth: 200,
          }}
        >
          {rewardText}
        </Text>

        {/* Celebration Emojis */}
        <View className="flex-row mt-4">
          <Text style={{ fontSize: 24, marginHorizontal: spacing.xs }}>🎉</Text>
          <Text style={{ fontSize: 24, marginHorizontal: spacing.xs }}>✨</Text>
          <Text style={{ fontSize: 24, marginHorizontal: spacing.xs }}>🎊</Text>
        </View>
      </Animated.View>
    </View>
  );
};