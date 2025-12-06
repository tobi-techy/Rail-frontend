import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  TouchableOpacityProps,
  Animated,
  ImageSourcePropType,
} from 'react-native';
import { Card } from '../atoms/Card';
import { Icon } from '../atoms/Icon';
import { colors, typography, spacing, shadows, borderRadius } from '../../design/tokens';

/**
 * Props for the BasketCard component.
 */
export interface BasketCardProps
  extends Omit<TouchableOpacityProps, 'children'> {
  /** Unique identifier for the basket */
  id: string;
  /** The main name of the basket */
  name: string;
  /** Description of the basket */
  description: string;
  /** Risk level of the basket */
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  /** URL for the basket icon */
  iconUrl?: ImageSourcePropType | undefined;
  /** Performance indicator data */
  performanceIndicator: {
    returnPercentage: number;
    totalInvested: number;
    currentValue: number;
  };
  /** Optional badges to display on the right (for social proof/tags) */
  badges?: { color: string; icon: string }[];
  /** Function to call when the card is pressed */
  onPress?: () => void;
  /** Additional class names for styling */
  className?: string;
}

export const BasketCard: React.FC<BasketCardProps> = ({
  id,
  name,
  description,
  riskLevel,
  iconUrl,
  performanceIndicator,
  badges,
  onPress,
  className,
  style,
  ...props
}) => {
  // Subtle press scale animation for smooth interaction
  const scale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 20 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  // Format compact currency for AUM (social proof)
  const formatCompactCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(amount);
    } catch {
      // Fallback if compact notation isn't supported
      const abs = Math.abs(amount);
      const sign = amount < 0 ? '-' : '';
      if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`;
      if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
      if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
      return `${sign}$${abs.toFixed(0)}`;
    }
  };

  const performanceColor = useMemo(() => (
    performanceIndicator.returnPercentage >= 0
      ? colors.semantic.success
      : colors.semantic.danger
  ), [performanceIndicator.returnPercentage]);

  const aumText = useMemo(() => (
    `${formatCompactCurrency(performanceIndicator.totalInvested)} AUM`
  ), [performanceIndicator.totalInvested]);


  const riskColor = useMemo(() => {
    switch (riskLevel) {
      case 'LOW':
        return `${colors.semantic.success}20`;
      case 'MEDIUM':
        return `${colors.semantic.warning}20`;
      case 'HIGH':
        return `${colors.semantic.danger}20`;
      default:
        return `${colors.text.tertiary}20`;
    }
  }, [riskLevel]);

  const composedBadges = badges || [
    { color: colors.primary.magenta, icon: 'sparkles' },
    { color: colors.text.tertiary, icon: 'shield-checkmark' },
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`${name}. ${description}. Return ${performanceIndicator.returnPercentage.toFixed(2)}%. ${aumText}`}
      className={className}
      style={style}
      {...props}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <View className={`bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden pt-[14px] pb-[6px] px-[8px] ${className || ''}`}
        >
          {/* Row layout to match reference list style */}
          <View className="flex-row items-start justify-between">
            {/* Left: Icon */}
            <View className="flex-row items-center flex-1">
              <View
                className="w-[60px] h-[60px] rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: riskColor }}
                accessibilityLabel={`${name} avatar`}
              >
                {iconUrl ? (
                  <Image source={iconUrl} className="w-[60px] h-[60px] rounded-full" />
                ) : (
                  <Text
                    className="font-body-bold text-lg font-bold text-text-primary"
                  >
                    {name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>

              {/* Title and secondary metrics */}
              <View className="flex-1">
                <Text
                  className="font-body-bold text-[20px] text-text-primary"
                  numberOfLines={1}
                >
                  {name}
                </Text>
                <View className="flex-row items-center mt-1">
                  {/* Performance % with status dot */}
                  <View className="flex-row items-center mr-4">
                    <View
                      className="w-2 h-2 rounded-full mr-1.5"
                      style={{ backgroundColor: performanceColor }}
                      accessibilityLabel={performanceIndicator.returnPercentage >= 0 ? 'Positive performance' : 'Negative performance'}
                    />
                    <Text
                      className="font-body-medium text-sm text-text-secondary"
                    >
                      {performanceIndicator.returnPercentage.toFixed(2)}%
                    </Text>
                  </View>

                  {/* AUM metric */}
                  <View className="flex-row items-center">
                    <Icon name="briefcase" library="ionicons" size={16} color={"#949FFF"} />
                    <Text
                      className="font-body-medium text-sm text-text-secondary ml-1.5"
                      numberOfLines={1}
                    >
                      {aumText}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Right: badges/icons for social proof */}
            <View className="flex-row items-center ml-3">
              {composedBadges.slice(0, 2).map((badge, index) => (
                <View
                  key={`${id}-badge-${index}`}
                  className="w-7 h-7 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: badge.color,
                    marginLeft: index > 0 ? 6 : 0,
                    ...shadows.sm,
                  }}
                  accessibilityLabel={`badge ${index + 1}`}
                >
                  <Icon name={badge.icon} library="ionicons" size={16} color={colors.text.onPrimary} />
                </View>
              ))}
              {composedBadges.length > 2 && (
                <View
                  className="w-7 h-7 rounded-full items-center justify-center ml-1.5"
                  style={{ backgroundColor: colors.text.tertiary }}
                  accessibilityLabel={`+${composedBadges.length - 2} more badges`}
                >
                  <Text
                    className="font-primary text-xs font-bold text-text-onPrimary"
                  >
                    +{composedBadges.length - 2}
                  </Text>
                </View>
              )}
            </View>
          </View>

        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};
